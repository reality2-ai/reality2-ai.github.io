#!/usr/bin/env python3
"""Add the website's reading interface to an already-reviewed standard export.

Run after the standard's own renderer, before publication. This does not import
source documents or approve them for publication. Requirements and clause IDs
remain unchanged. No dependencies beyond Python's standard library.
"""
import argparse
import html
import re
from pathlib import Path


def plain(value):
    return html.unescape(re.sub(r'<[^>]*>', '', value)).strip()


def prepare(path):
    source = path.read_text()
    if 'data-reader-edition="1"' in source:
        return
    source = source.replace('<meta name="viewport"', '<meta name="robots" content="noindex, nofollow">\n<meta name="viewport"', 1)
    source = source.replace('</head>', '<link rel="stylesheet" href="/standard/reader.css">\n<script src="/standard/reader.js" defer></script>\n</head>', 1)
    source = source.replace("var t=localStorage.getItem('r2-theme');", "var t;try{t=localStorage.getItem('r2-theme');}catch(e){}")
    source = source.replace("localStorage.setItem('r2-theme',n);", "try{localStorage.setItem('r2-theme',n);}catch(e){}")
    # Headings without IDs occur on the contents, glossary, index and history.
    ids = set(re.findall(r'\bid="([^"]+)"', source))
    def heading(match):
        level, attrs, body = match.groups()
        if 'id=' not in attrs:
            base = re.sub(r'[^a-z0-9]+', '-', plain(body).lower()).strip('-') or 'section'
            identity, suffix = base, 2
            while identity in ids:
                identity = f'{base}-{suffix}'; suffix += 1
            ids.add(identity)
            attrs += f' id="{identity}"'
        return f'<h{level}{attrs}>{body}</h{level}>'
    source = re.sub(r'<h([23])([^>]*)>(.*?)</h\1>', heading, source, flags=re.S)
    headings = re.findall(r'<h2[^>]*id="([^"]+)"[^>]*>(.*?)</h2>', source, flags=re.S)
    links = ''.join(f'<li><a href="#{html.escape(identity, quote=True)}">{html.escape(plain(label))}</a></li>' for identity, label in headings)
    toc = ('<aside class="reader-sidebar" aria-label="Page navigation">'
           '<details class="reader-toc"><summary>On this page</summary>'
           f'<ul>{links}</ul></details>'
           '<a class="reader-top" href="#main">Back to top ↑</a></aside>')
    source, count = re.subn(r'<article id="main"([^>]*)>', '<div class="reader-layout" data-reader-edition="1">' + toc + r'<main id="main"><article\1>', source, count=1)
    if count != 1:
        raise ValueError(f'{path}: expected one standard article')
    source = source.replace('</article>', '</article></main></div>', 1)
    # Distinguish source text from navigation aids without rewriting requirements.
    if path.stem not in ('index', 'glossary', 'clauses', 'history'):
        kind = 'Informative example' if path.stem.startswith('EXAMPLE-') else ('Informative overview' if path.stem == '00-overview' else ('Test vectors' if path.stem.startswith('TEST-VECTORS-') else 'Normative document'))
        source = source.replace('</h1>', f'</h1>\n<p class="reader-kind">{kind}</p>', 1)
    def table(match):
        table = match[1]
        headers = [plain(x) for x in re.findall(r'<th[^>]*>(.*?)</th>', table, flags=re.S)]
        label = 'Table: ' + ', '.join(headers[:4]) if headers else 'Reference table'
        return '<div class="table-wrap" tabindex="0" role="region" aria-label="' + html.escape(label, quote=True) + '">' + table + '</div>'
    source = re.sub(r'<div class="table-wrap">(<table>.*?</table>)</div>', table, source, flags=re.S)
    source = source.replace('<figure class="stack-fig">', '<figure class="stack-fig" tabindex="0" aria-label="Protocol layers; scroll horizontally on small screens">')
    source = source.replace('<pre>', '<pre tabindex="0" aria-label="Code or test vector">')
    # Optional filtering never hides content until JavaScript is available.
    if path.stem in ('glossary', 'clauses', 'index'):
        label = {'glossary': 'Filter terms and definitions', 'clauses': 'Filter clause titles', 'index': 'Find a document'}[path.stem]
        search = (f'<div class="reader-filter" hidden><label for="reader-query">{label}</label>'
                  '<input id="reader-query" type="search" autocomplete="off" aria-describedby="reader-results">'
                  '<p id="reader-results" role="status" aria-live="polite"></p></div>')
        source = source.replace('</h1>', '</h1>\n' + search, 1)
    path.write_text(source)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('directory', nargs='?', default='standard', type=Path)
    args = parser.parse_args()
    for path in sorted(args.directory.glob('*.html')):
        prepare(path)
    print('Prepared standard reading interface.')


if __name__ == '__main__':
    main()
