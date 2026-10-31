import urllib.request
import re
import json
import sys
import uuid
import time
from concurrent.futures import ThreadPoolExecutor
from supabase import create_client

sys.stdout.reconfigure(encoding='utf-8')

url = 'https://csuifvyghfsibkrnxrby.supabase.co'
key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzdWlmdnlnaGZzaWJrcm54cmJ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MzEzNTY3NywiZXhwIjoyMTA4NzExNjc3fQ.nhfwxlw9gSIntjHEvQg_VxP7fK7UettcbJHd9KN5e7M'
supabase = create_client(url, key)
namespace = uuid.UUID('6ba7b810-9dad-11d1-80b4-00c04fd430c8')

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
}

res = supabase.table('properties').select('id, title, affiliate_url, images').execute()
db_props = {r['id']: r for r in res.data}

# Check total search count from page 1
page1_url = "https://www.nawy.com/ar/search?category=property&page_number=1"
req = urllib.request.Request(page1_url, headers=HEADERS)
html = urllib.request.urlopen(req, timeout=12).read().decode('utf-8', errors='replace')
m = re.search(r'<script id="__NEXT_DATA__" type="application/json">(.*?)</script>', html, re.DOTALL)
if m:
    data = json.loads(m.group(1))
    ssr = data.get('props', {}).get('pageProps', {}).get('loadedSearchResultsSSR', {})
    print('SSR keys:', list(ssr.keys()))
    print({k: ssr[k] for k in ssr if k != 'results'})
