import urllib.request
import re
import json
import sys
import urllib.parse

sys.stdout.reconfigure(encoding='utf-8')

test_queries = [
    'ياردين',
    'كمبوند بادية',
    'ماونتن فيو اي سيتي',
    'ريجنسي بيزنس تاور',
    'بلوم فيلدز'
]

headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}

for q_text in test_queries:
    q = urllib.parse.quote(q_text)
    url = f"https://www.nawy.com/ar/search?query={q}"
    try:
        html = urllib.request.urlopen(urllib.request.Request(url, headers=headers), timeout=10).read().decode('utf-8', errors='replace')
        m = re.search(r'<script id="__NEXT_DATA__" type="application/json">(.*?)</script>', html, re.DOTALL)
        if m:
            data = json.loads(m.group(1))
            res = data.get('props', {}).get('pageProps', {}).get('loadedSearchResultsSSR', {}).get('results', [])
            if res:
                it = res[0]
                comp_slug = it.get('compound', {}).get('slug') or 'any'
                item_slug = it.get('slug') or str(it.get('id'))
                direct_url = f"https://www.nawy.com/ar/compound/{comp_slug}/property/{item_slug}"
                print(f"Query '{q_text}' -> {len(res)} results. First direct: {direct_url}")
            else:
                print(f"Query '{q_text}' -> No results")
        else:
            print(f"Query '{q_text}' -> No __NEXT_DATA__")
    except Exception as e:
        print(f"Query '{q_text}' -> Error: {e}")
