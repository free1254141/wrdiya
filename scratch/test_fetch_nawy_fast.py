import urllib.request
import re
import json
import sys
import uuid
from concurrent.futures import ThreadPoolExecutor

sys.stdout.reconfigure(encoding='utf-8')

namespace = uuid.UUID('6ba7b810-9dad-11d1-80b4-00c04fd430c8')

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
}

def fetch_page(p):
    url = f"https://www.nawy.com/ar/search?category=property&page_number={p}"
    try:
        req = urllib.request.Request(url, headers=HEADERS)
        with urllib.request.urlopen(req, timeout=12) as resp:
            html = resp.read().decode('utf-8', errors='replace')
        m = re.search(r'<script id="__NEXT_DATA__" type="application/json">(.*?)</script>', html, re.DOTALL)
        if not m:
            return []
        data = json.loads(m.group(1))
        results = data.get('props', {}).get('pageProps', {}).get('loadedSearchResultsSSR', {}).get('results', [])
        return results
    except Exception as e:
        return []

print("Testing fetching pages 1 to 5...")
with ThreadPoolExecutor(max_workers=5) as ex:
    pages_results = list(ex.map(fetch_page, range(1, 6)))

all_items = [item for sublist in pages_results for item in sublist]
print(f"Fetched {len(all_items)} items from 5 pages.")
if all_items:
    sample = all_items[0]
    nid = sample.get('id')
    db_id = str(uuid.uuid5(namespace, f"Nawy_Compound_Unit:{nid}"))
    print("Sample nid:", nid, "-> db_id:", db_id)
    print("shareLink:", sample.get('shareLink'))
