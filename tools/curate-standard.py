#!/usr/bin/env python3
"""Curate a reviewed standard render without changing its numbered requirements.

Input must be the standard renderer's output at one pinned revision. Output stays
separate until review. Only document pages, generated indexes and CSS are copied;
private commit messages are never used as website history. No publishing occurs.
"""
import argparse
import base64
from collections import Counter
from html import escape
from html.parser import HTMLParser
from pathlib import Path
import re

VOID = {'area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr'}
class Node:
    def __init__(self, tag='', attrs=(), opening=''):
        self.tag, self.attrs, self.opening = tag, dict(attrs), opening
        self.children = []
        self.removed = False
    def text(self):
        return ''.join(x.text() if isinstance(x, Node) else x for x in self.children)
    def render(self):
        if self.removed: return ''
        inner = ''.join(x.render() if isinstance(x, Node) else x for x in self.children)
        return self.opening + inner + (f'</{self.tag}>' if self.tag and self.tag not in VOID else '')
    def walk(self):
        yield self
        for child in self.children:
            if isinstance(child, Node): yield from child.walk()
class Document(HTMLParser):
    def __init__(self, source):
        super().__init__(convert_charrefs=False)
        self.root = Node(); self.stack = [self.root]; self.feed(source)
    def handle_starttag(self, tag, attrs):
        node = Node(tag, attrs, self.get_starttag_text()); self.stack[-1].children.append(node)
        if tag not in VOID: self.stack.append(node)
    def handle_startendtag(self, tag, attrs):
        self.stack[-1].children.append(self.get_starttag_text())
    def handle_endtag(self, tag):
        if self.stack[-1].tag != tag:
            raise ValueError(f'Unexpected closing {tag}, inside {self.stack[-1].tag}')
        self.stack.pop()
    def handle_data(self, text): self.stack[-1].children.append(text)
    def handle_entityref(self, name): self.handle_data('&'+name+';')
    def handle_charref(self, name): self.handle_data('&#'+name+';')
    def handle_decl(self, value): self.handle_data('<!'+value+'>')
    def handle_comment(self, value): self.handle_data('<!--'+value+'-->')

# These are provenance or internal working contexts, not protocol terms.
CONTEXT = re.compile(r'\bfleet process\b|\bthis fleet\b|\bthe fleet\b|\blanes?\b|\bsupervisor\b|\bcomposer\b|\bSS\d+\b|LESSONS\.md|DECISIONS\.md|\bD-\d+\b|r2-impl|r2-hive/|r2-core/|/home/|\bDFR\d|\bHeltec\b|\bpilot\b|\bbench\b|\bdeployed\b|\bcorpus\b|\bimport\b|\bruling\b|\bratifi|DFRobot|SEN[0-9]+|\bregister map\b',re.I)
EDITORIAL = re.compile(r'\b20\d\d-\d\d-\d\d\b|^(?:\(Corpus alignment|\(Contributed by|\(Subject stated)',re.I)


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('source',type=Path); ap.add_argument('output',type=Path)
    ap.add_argument('--revision',required=True); ap.add_argument('--version',required=True)
    args=ap.parse_args()
    if args.source.resolve()==args.output.resolve(): raise ValueError('Use separate input and output directories')
    gate=Path('.github/workflows/content-hygiene.yml').read_text()
    pattern=re.compile(base64.b64decode(re.search("echo '([^']+)'",gate)[1]).decode(),re.I)
    args.output.mkdir(parents=True,exist_ok=True)
    report={}
    for path in sorted(args.source.glob('*.html')):
        if path.stem=='history': continue
        source=path.read_text(); doc=Document(source)
        counts=Counter()
        article=next(n for n in doc.root.walk() if n.tag=='article')
        # Preserve every numbered clause anchor, and compare clause paragraphs
        # after the same explicitly editorial-only normalisation on both sides.
        # The source renderer can mistake a bold cross-reference for a heading
        # anchor. Prefer the actual numbered heading as that link's destination.
        for heading in list(article.walk()):
            if heading.tag not in ('h2','h3','h4'): continue
            match=re.match(r'^(\d+(?:\.[0-9]+[a-z]?)*)\s',heading.text())
            if not match: continue
            identity='c'+match[1]
            anchored=next((n for n in article.walk() if n.attrs.get('id')==identity),None)
            if anchored is not None and anchored.tag=='strong':
                anchored.opening=anchored.opening.replace(' class="clause"','').replace(f' id="{identity}"','')
                anchored.attrs.pop('id',None);anchored.attrs.pop('class',None)
                heading.children.insert(0,f'<span class="clause-anchor" id="{identity}"></span>')
        clause_ids={n.attrs.get('id') for n in article.walk() if 'clause' in n.attrs.get('class','').split()}
        for node in list(article.walk()):
            text=node.text().strip()
            if node.tag=='p' and re.match(r'^Note\b',text) and (CONTEXT.search(text) or pattern.search(text)):
                if re.search(r'\bshall\b', text) and not text.startswith('Note 1 to entry: This was drafted as a should'):
                    raise ValueError(f'{path.name}: review a source note containing requirement wording before omitting it')
                note_markers=list(dict.fromkeys(re.findall(r'PROVISIONAL\([^)]*\)',text)))
                note_ids=[n.attrs.get('id') for n in node.walk() if n.attrs.get('id') in clause_ids]
                if note_ids:
                    # These anchors were assigned to bold references inside a
                    # note, not to a clause definition. Preserve incoming links.
                    node.children=[f'<span class="clause-anchor" id="{identity}"></span>' for identity in note_ids]+['Source note omitted from this reading edition.']
                    clause_ids.difference_update(note_ids)
                elif note_markers:
                    # Keep status visible where a reader encounters its subject.
                    lead=text.split(':',1)[0]
                    node.children=[escape(lead)+': Source commentary omitted; provisional markers retained: '+', '.join('<code>'+escape(x)+'</code>' for x in note_markers)+'.']
                else: node.removed=True
                counts['source_notes']+=1
            elif node.tag=='em' and text.startswith('(') and (EDITORIAL.search(text) or CONTEXT.search(text)):
                # A provisional flag is meaningful and must survive curation.
                markers=re.findall(r'PROVISIONAL\([^)]*\)',text)
                node.children=['('+ '; '.join(escape(m) for m in dict.fromkeys(markers))+')'] if markers else []
                if not markers: node.removed=True
                counts['editorial_attributions']+=1
            elif node.tag=='p' and text.startswith('Requirements register:'):
                node.removed=True;counts['register_notes']+=1
        # One source-only preface documents an old implementation investigation.
        # Its normative scope starts at clause 1; keep the c0 link as an omission.
        if path.stem=='L1-BINDING-ESPNOW':
            dropping=False
            for node in article.children:
                if not isinstance(node,Node): continue
                if node.attrs.get('id')=='c0': dropping=True;continue
                if node.attrs.get('id')=='c1': dropping=False
                if dropping:
                    if any(n.attrs.get('id') in clause_ids for n in node.walk()): raise ValueError('Numbered requirement in editorial preface')
                    node.removed=True
            # Insert visible text at the retained link destination.
            anchor=next(n for n in article.walk() if n.attrs.get('id')=='c0')
            anchor.opening=anchor.opening.replace('class="clause-anchor"', 'class="clause-anchor omission"')
            anchor.children=['The source-only implementation preface is omitted from this reading edition. The binding begins at clause 1.']
            counts['implementation_prefaces']+=1
        # Reviewed source-only commentary continued outside labelled notes.
        if path.stem=='FORMATS':
            for node in article.walk():
                text=node.text().strip()
                if node.tag=='p' and (text.startswith('⚠ THE GROUNDING') or text.startswith('⚠ The grounding') or text.startswith('One part of the design does not survive')):
                    if any(n.attrs.get('id') in clause_ids for n in node.walk()): raise ValueError('Requirement in commentary')
                    node.removed=True;counts['source_commentary']+=1
        curated=doc.root.render()
        if path.stem=='FORMATS':
            # Clause 6.2 mixes the contract with an attribution and a physical
            # reference instance. Retain its complete descriptor/command rules.
            curated=curated.replace(', corrected to the\ncomposer-lane catalogue truth (review 2026-08-01): the descriptor core set is', '. The descriptor core set is')
            curated=re.sub(r' Reference instance:\s*[^<]+(?=</p>)', '', curated, count=1)

        # A repeated introductory attribution is outside numbered requirements.
        curated=curated.replace('build from it (d041, Roy: <em>standard is the canon</em>).','build from it.')
        if path.stem=='L1-BINDING-ESPNOW':
            curated=curated.replace('every other bearer this fleet uses', 'every other bearer discussed in that source finding')
        # Remove empty blockquotes/paragraphs left by omitted editorial notes.
        curated=re.sub(r'<(?:p|blockquote)>\s*</(?:p|blockquote)>','',curated)
        current_ids=set(re.findall(r'class="clause" id="([^"]+)"',curated))
        if clause_ids != current_ids: raise ValueError(f'{path.name}: numbered clause lost')
        if pattern.search(curated): raise ValueError(f'{path.name}: content guard match remains')
        stamp=(f'Curated working draft · declared source version {escape(args.version)} · '
               f'revision <span class="mono">{escape(args.revision[:8])}</span>. '
               'This is not a tagged release. Cite the revision and clause. '
               '<a href="/standard/history.html">Edition notes</a>.')
        curated=re.sub(r'<p class="stamp">.*?</p>',f'<p class="stamp">{stamp}</p>',curated,flags=re.S)
        if path.stem=='index':
            curated=curated.replace('A decentralised mesh protocol for trust groups. These are the normative parts —\nthe text an implementation is measured against.', 'A decentralised mesh protocol for trust groups. Read the requirements, their companion formats and bindings, and the informative examples that explain how they fit together.')
            curated=curated.replace('Clauses marked\n<code>PROVISIONAL</code> are drafted and not yet ratified.', 'Requirements apply as written. Explicit <code>PROVISIONAL</code> markers identify provisional text or values; “draft” describes editorial maturity.')
            overview=re.search(r'<a class="doc" href="00-overview.html">.*?</a>',curated,re.S)[0]
            curated=curated.replace(overview,'')
            curated=curated.replace('<h2>Read in this order</h2>', '<h2>Start here</h2><p>New to the design? Start with the informative overview, then a worked example. Implementers should read terminology before the layer requirements.</p><div class="doc-grid">'+overview+'</div><h2>Requirements and companions</h2>')
            curated=curated.replace('Every revision of the published documents, newest first.', 'Source revision, citation guidance and disclosed editorial omissions.')
            curated=curated.replace('Version history</span>', 'Edition notes</span>')
            curated=re.sub(r'<p class="version-badge[^\"]*">.*?</p>',f'<p class="version-badge draft">Working draft · {escape(args.revision[:8])}</p>',curated)
        notice=('<details class="edition-note"><summary>About this reading edition</summary><p>'
                'The numbered requirements and their provisional markers are retained from the cited source revision. '
                'Selected non-normative source notes, editorial attributions and internal working details are omitted. '
                'Clause numbers are unchanged; references to omitted notes may remain. '
                'The overview and worked examples are informative. Navigation and reading aids are not requirements.'
                '</p></details>')
        curated=curated.replace('</h1>','</h1>\n'+notice,1)
        (args.output/path.name).write_text(curated)
        report[path.name]=dict(counts)
    (args.output/'standard.css').write_text((args.source/'standard.css').read_text())
    # An edition ledger is safer and more useful than private repository messages.
    template=(args.output/'index.html').read_text()
    body='''<a class="back-link" href="/standard/">← Contents</a>
<h1>Edition notes</h1>
<p class="subtitle">Which text this reading edition contains, and how to cite it.</p>
<h2 id="current">Current reading edition</h2>
<p>This edition follows source revision <code>REVISION</code>, whose documents declare version <code>VERSION</code>. It is a working draft, not a tagged release. Cite this revision, the document and the clause number when discussing a requirement.</p>
<h2 id="omissions">What is omitted</h2>
<p>Selected non-normative source notes, editorial attributions and internal working details are excluded. The source-only implementation preface to the ESP-NOW binding is omitted. Numbered requirements, test-vector data and provisional markers are retained. References to omitted notes can still occur in the source wording.</p>
<p>Requirements are not rewritten to make the reading edition. Its contents links, filters, page labels and diagrams help navigation; they do not add requirements. This edition is intended for readers given a direct link and is excluded from search indexing.</p>
<h2 id="previous">Previous website edition</h2>
<p>The previous website snapshot was labelled version 0.8.0, built from revision <code>f5bf72b</code> on 5 August 2026. The current edition includes later clause changes and the ESP-NOW, BLE and LoRa binding documents.</p>
<h2 id="source">Questions about the text</h2>
<p>For the complete source or to discuss a clause, <a href="mailto:roy@reality2.ai">contact Roy</a>. Internal revision messages are not reproduced here.</p>
'''.replace('REVISION',escape(args.revision)).replace('VERSION',escape(args.version))
    template=re.sub(r'<article id="main"[^>]*>.*?</article>',f'<article id="main" class="doc-page">{body}</article>',template,flags=re.S)
    template=template.replace('The Reality2 Standard','Edition notes — Reality2 Standard')
    template=template.replace('https://reality2.ai/standard/"','https://reality2.ai/standard/history.html"')
    (args.output/'history.html').write_text(template)
    print('Curated',len(report),'pages; retained all numbered clause anchors.')
    print('Omissions:',dict(sum((Counter(x) for x in report.values()),Counter())))

if __name__=='__main__': main()
