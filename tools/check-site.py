#!/usr/bin/env python3
"""Check website references, metadata, content hygiene and direct-link boundaries."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit,unquote
import re,collections,json,base64,subprocess
root=Path(__file__).resolve().parent.parent
import os
os.chdir(root)
class Page(HTMLParser):
 def __init__(self,s):
  super().__init__(); self.ids=[];self.links=[];self.json=False; self.scripts=[]; self.h1=0; self.feed(s)
 def handle_starttag(self,t,a):
  a=dict(a)
  if 'id' in a:self.ids.append(a['id'])
  if t=='h1':self.h1+=1
  if t in ['a','link','script','img']:self.links.append(a.get('href',a.get('src','')))
  self.json=t=='script' and a.get('type')=='application/ld+json'
 def handle_endtag(self,t):
  if t=='script':self.json=False
 def handle_data(self,d):
  if self.json:self.scripts.append(json.loads(d))
files=list(root.glob('*.html'))+list((root/'intro').glob('*.html'))+list((root/'standard').glob('*.html'))
pages={p.resolve():Page(p.read_text()) for p in files}; errors=[];links=0
for p,parsed in pages.items():
 for k,n in collections.Counter(parsed.ids).items():
  if n>1:errors.append((str(p.relative_to(root)),'duplicate ID',k))
 if parsed.h1!=1:errors.append((str(p.relative_to(root)),'h1 count',parsed.h1))
 for link in parsed.links:
  u=urlsplit(link)
  if u.scheme or u.netloc or not link:continue
  target=(root/u.path.lstrip('/') if u.path.startswith('/') else p.parent/u.path).resolve() if u.path else p
  if target.is_dir():target=target/'index.html'
  links+=1
  if not target.exists():errors.append((str(p.relative_to(root)),'missing',link))
  elif u.fragment and target in pages and unquote(u.fragment) not in pages[target].ids:errors.append((str(p.relative_to(root)),'bad anchor',link))
 if 'standard' in p.relative_to(root).parts:
  if 'name="robots" content="noindex, nofollow"' not in p.read_text():errors.append((p.name,'indexable'))
 else:
  for link in parsed.links:
   if '/standard' in link or link.startswith('standard/'):errors.append((p.name,'exposes standard',link))
pat=base64.b64decode(re.search("echo '([^']+)'",Path('.github/workflows/content-hygiene.yml').read_text())[1]).decode()
positive=re.search(r'[a-z]{4,}',pat).group()
assert re.search(pat,positive,re.I), 'Content guard positive control failed'
tracked=subprocess.check_output(['git','ls-files','-z']).decode().split('\0')
new=subprocess.check_output(['git','ls-files','--others','--exclude-standard','-z']).decode().split('\0')
for f in set(tracked+new)-{''}:
 data=Path(f).read_bytes()
 if b'\0' in data:continue
 if re.search(pat,data.decode(errors='replace'),re.I):errors.append((f,'content guard match'))
print('Pages:',len(pages),'local references:',links)
print('Errors:',len(errors))
for e in errors[:60]:print(e)
raise SystemExit(bool(errors))
