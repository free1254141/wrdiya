import urllib.request
import re
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

url = 'https://www.nawy.com/ar/compound/any/property/137072'
headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
}
req = urllib.request.Request(url, headers=headers)
html = urllib.request.urlopen(req, timeout=10).read().decode('utf-8', errors='replace')
m = re.search(r'<script id="__NEXT_DATA__" type="application/json">(.*?)</script>', html, re.DOTALL)
if m:
    data = json.loads(m.group(1))
    props = data.get('props', {}).get('pageProps', {})
    prop = props.get('property', {})
    print('Property Title:', prop.get('title'))
    print('Compound:', prop.get('compound', {}).get('name'))
    print('Canonical URL / shareLink:', prop.get('shareLink'))
else:
    print('Length of html:', len(html))
    print(html[:500])
