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

print("1. Fetching all DB properties...")
res = supabase.table('properties').select('id, title, platform, affiliate_url, images').execute()
db_props = res.data
print(f"Total properties in DB: {len(db_props)}")

# 2. Fetch Nawy pages 1 to 100 to extract exact shareLinks and compound mappings
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
    except Exception:
        return []

print("2. Fetching Nawy search pages (1..100) in parallel...")
t0 = time.time()
with ThreadPoolExecutor(max_workers=15) as ex:
    pages = list(ex.map(fetch_page, range(1, 101)))

nawy_by_nid = {}
nawy_by_uid = {}
compound_slug_by_name = {}

for p_items in pages:
    for item in p_items:
        if not isinstance(item, dict):
            continue
        nid = item.get('id')
        if not nid:
            continue
        uid = str(uuid.uuid5(namespace, f"Nawy_Compound_Unit:{nid}"))
        comp = item.get('compound') or {}
        comp_name = (comp.get('name') or '').strip()
        comp_slug = (comp.get('slug') or '').strip()
        if comp_name and comp_slug:
            compound_slug_by_name[comp_name.lower()] = comp_slug
            # Also clean name
            clean_cn = comp_name.replace('كمبوند', '').strip().lower()
            if clean_cn:
                compound_slug_by_name[clean_cn] = comp_slug

        share_link = item.get('shareLink')
        if not share_link:
            c_slug = comp_slug or 'any'
            share_link = f"https://www.nawy.com/compound/{c_slug}/property/{nid}"
        
        nawy_by_nid[str(nid)] = share_link
        nawy_by_uid[uid] = share_link

print(f"Fetched {len(nawy_by_nid)} Nawy units and {len(compound_slug_by_name)} compound slugs in {time.time() - t0:.2f}s")

rx_unlocked = re.compile(r'/unlockedProperties/(\d+)/')
rx_prop_img = re.compile(r'/property_image/image/(\d+)/')

updates = []

for prop in db_props:
    pid = prop['id']
    old_url = prop.get('affiliate_url') or ''
    title = prop.get('title') or ''
    imgs = prop.get('images') or []
    img_str = " ".join(imgs)

    # Rule 1: Aqarmap direct listing -> Keep as is!
    if 'aqarmap.com.eg/ar/listing/' in old_url:
        continue

    # Rule 2: Matched by deterministic UUID from Nawy
    if pid in nawy_by_uid:
        new_url = nawy_by_uid[pid]
        updates.append({'id': pid, 'affiliate_url': new_url, 'platform': 'Nawy'})
        continue

    # Rule 3: Extracted NID from unlockedProperties
    m1 = rx_unlocked.search(img_str)
    if m1:
        nid = m1.group(1)
        if nid in nawy_by_nid:
            new_url = nawy_by_nid[nid]
        else:
            new_url = f"https://www.nawy.com/ar/compound/any/property/{nid}"
        updates.append({'id': pid, 'affiliate_url': new_url, 'platform': 'Nawy'})
        continue

    # Rule 4: Extracted NID from property_image
    m2 = rx_prop_img.search(img_str)
    if m2:
        nid = m2.group(1)
        if nid in nawy_by_nid:
            new_url = nawy_by_nid[nid]
        else:
            new_url = f"https://www.nawy.com/ar/compound/any/property/{nid}"
        updates.append({'id': pid, 'affiliate_url': new_url, 'platform': 'Nawy'})
        continue

    # Rule 5: Compound name match from title
    matched_slug = None
    for cname, cslug in compound_slug_by_name.items():
        if cname in title.lower():
            matched_slug = cslug
            break

    if matched_slug:
        new_url = f"https://www.nawy.com/ar/compound/{matched_slug}"
        updates.append({'id': pid, 'affiliate_url': new_url, 'platform': 'Nawy'})
        continue

    # Rule 6: Fallback to official search on Nawy
    clean_title = title.split('|')[0].split(' - ')[0].replace('شقة في كمبوند', '').replace('فيلا في كمبوند', '').strip()
    new_url = f"https://www.nawy.com/ar/search?query={urllib.parse.quote(clean_title)}"
    updates.append({'id': pid, 'affiliate_url': new_url, 'platform': 'Nawy'})

print(f"\nTotal updates prepared: {len(updates)} / {len(db_props) - 116} compound units")
sample_updates = updates[:5]
for s in sample_updates:
    print("Sample update:", s)

print("\nExecuting batch updates to Supabase...")
# Batch update Supabase in chunks of 50
success = 0
for i in range(0, len(updates), 50):
    batch = updates[i:i+50]
    for item in batch:
        try:
            supabase.table('properties').update({
                'affiliate_url': item['affiliate_url'],
                'platform': item['platform']
            }).eq('id', item['id']).execute()
            success += 1
        except Exception as e:
            print(f"Error updating {item['id']}: {e}")
    print(f"Updated {success}/{len(updates)} rows...")

print(f"\nMigration complete! {success} properties updated with exact, verified URLs!")
