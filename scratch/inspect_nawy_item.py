import urllib.request
import re
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

url = 'https://www.nawy.com/ar/search?category=property&page_number=1'
headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
}
req = urllib.request.Request(url, headers=headers)
html = urllib.request.urlopen(req, timeout=15).read().decode('utf-8', errors='replace')
m = re.search(r'<script id="__NEXT_DATA__" type="application/json">(.*?)</script>', html, re.DOTALL)
if m:
    data = json.loads(m.group(1))
    results = data.get('props', {}).get('pageProps', {}).get('loadedSearchResultsSSR', {}).get('results', [])
    if results:
        it = results[0]
        print('Result keys:', list(it.keys()))
        print('Item id:', it.get('id'), 'slug:', it.get('slug'))
        print('Compound:', it.get('compound'))
        print('URL fields:', {k: v for k, v in it.items() if 'url' in k.lower() or 'slug' in k.lower() or 'link' in k.lower()})
        print('\nFull item sample (formatted):')
        print(json.dumps(it, ensure_ascii=False, indent=2)[:1000])
else:
    print('No __NEXT_DATA__ found')
