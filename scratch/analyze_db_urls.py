import os
import sys
import json
from collections import Counter
from supabase import create_client

sys.stdout.reconfigure(encoding='utf-8')

url = 'https://csuifvyghfsibkrnxrby.supabase.co'
key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzdWlmdnlnaGZzaWJrcm54cmJ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MzEzNTY3NywiZXhwIjoyMTA4NzExNjc3fQ.nhfwxlw9gSIntjHEvQg_VxP7fK7UettcbJHd9KN5e7M'
supabase = create_client(url, key)

res = supabase.table('properties').select('id, title, platform, affiliate_url, images').execute()
print(f"Total properties: {len(res.data)}")

platforms = Counter(r.get('platform') for r in res.data)
print("Platforms count:", platforms)

url_types = Counter()
for r in res.data:
    u = r.get('affiliate_url') or ''
    if 'aqarmap.com.eg/ar/listing/' in u:
        url_types['aqarmap_direct_listing'] += 1
    elif 'aqarmap.com.eg/ar/for-sale/' in u:
        url_types['aqarmap_search'] += 1
    elif 'aqarmap.com.eg/ar/compounds/' in u:
        url_types['aqarmap_compounds'] += 1
    elif 'tekce.com' in u:
        url_types['tekce'] += 1
    elif 'nawy.com' in u:
        url_types['nawy'] += 1
    elif 'wa.me' in u:
        url_types['whatsapp'] += 1
    else:
        url_types['other'] += 1

print("URL types:", url_types)

# Let's inspect some samples
print("\nSample aqarmap_direct_listing:")
for r in res.data:
    if 'aqarmap.com.eg/ar/listing/' in (r.get('affiliate_url') or ''):
        print(r['id'], '|', r['title'][:40], '|', r['affiliate_url'])
        break

print("\nSample aqarmap_search:")
for r in res.data:
    if 'aqarmap.com.eg/ar/for-sale/' in (r.get('affiliate_url') or ''):
        print(r['id'], '|', r['title'][:40], '|', r['affiliate_url'])
        imgs = r.get('images') or []
        print('  image sample:', imgs[0] if imgs else 'None')
        break
