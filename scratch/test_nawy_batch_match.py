import urllib.request
import re
import json
import sys
import uuid
import time
from concurrent.futures import ThreadPoolExecutor

sys.stdout.reconfigure(encoding='utf-8')

from supabase import create_client

url = 'https://csuifvyghfsibkrnxrby.supabase.co'
key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzdWlmdnlnaGZzaWJrcm54cmJ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MzEzNTY3NywiZXhwIjoyMTA4NzExNjc3fQ.nhfwxlw9gSIntjHEvQg_VxP7fK7UettcbJHd9KN5e7M'
supabase = create_client(url, key)

namespace = uuid.UUID('6ba7b810-9dad-11d1-80b4-00c04fd430c8')

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
}

print("Fetching DB property IDs...")
res = supabase.table('properties').select('id, title, affiliate_url').execute()
db_props = {r['id']: r for r in res.data}
print(f"Total DB properties: {len(db_props)}")

def fetch_page(p):
    page_url = f"https://www.nawy.com/ar/search?category=property&page_number={p}"
    try:
        req = urllib.request.Request(page_url, headers=HEADERS)
        with urllib.request.urlopen(req, timeout=12) as resp:
            html = resp.read().decode('utf-8', errors='replace')
        m = re.search(r'<script id="__NEXT_DATA__" type="application/json">(.*?)</script>', html, re.DOTALL)
        if not m:
            return []
        data = json.loads(m.group(1))
        return data.get('props', {}).get('pageProps', {}).get('loadedSearchResultsSSR', {}).get('results', [])
    except Exception as e:
        return []

print("Fetching Nawy search pages 1 to 85 in parallel...")
t0 = time.time()
with ThreadPoolExecutor(max_workers=15) as ex:
    pages = list(ex.map(fetch_page, range(1, 86)))

all_nawy_items = [item for page in pages for item in page if isinstance(item, dict) and item.get('id')]
print(f"Fetched {len(all_nawy_items)} items from Nawy in {time.time() - t0:.2f}s")

matched = {}
for item in all_nawy_items:
    nid = item.get('id')
    uid = str(uuid.uuid5(namespace, f"Nawy_Compound_Unit:{nid}"))
    if uid in db_props:
        share_link = item.get('shareLink')
        if not share_link:
            comp_slug = item.get('compound', {}).get('slug') or 'any'
            share_link = f"https://www.nawy.com/compound/{comp_slug}/property/{nid}"
        matched[uid] = {
            'shareLink': share_link,
            'title': item.get('title'),
            'nid': nid
        }

print(f"Matched {len(matched)} / {len(db_props)} database properties to exact Nawy shareLinks!")
