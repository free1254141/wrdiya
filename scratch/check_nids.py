import os
import sys
import re
from supabase import create_client

sys.stdout.reconfigure(encoding='utf-8')

url = 'https://csuifvyghfsibkrnxrby.supabase.co'
key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzdWlmdnlnaGZzaWJrcm54cmJ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MzEzNTY3NywiZXhwIjoyMTA4NzExNjc3fQ.nhfwxlw9gSIntjHEvQg_VxP7fK7UettcbJHd9KN5e7M'
supabase = create_client(url, key)

res = supabase.table('properties').select('id, title, affiliate_url, images').execute()

nid_found = 0
no_nid = []

rx_nid = re.compile(r'/unlockedProperties/(\d+)/')

for r in res.data:
    u = r.get('affiliate_url') or ''
    if 'aqarmap.com.eg/ar/listing/' in u:
        continue # Already a direct Aqarmap listing!
    
    images = r.get('images') or []
    found = False
    for img in images:
        m = rx_nid.search(img)
        if m:
            nid_found += 1
            found = True
            break
    if not found:
        no_nid.append(r)

print(f"Total non-direct Aqarmap listings: {len(res.data) - 116}")
print(f"NID found from image URL: {nid_found}")
print(f"No NID from image URL: {len(no_nid)}")
if no_nid:
    print("Sample without NID in image:")
    for x in no_nid[:5]:
        print(x['id'], '|', x['title'][:40], '|', (x.get('images') or [''])[0])
