import urllib.request
import re
import json
import sys
import uuid
import time
import urllib.parse
from concurrent.futures import ThreadPoolExecutor, as_completed
from supabase import create_client

sys.stdout.reconfigure(encoding='utf-8')

url = 'https://csuifvyghfsibkrnxrby.supabase.co'
key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzdWlmdnlnaGZzaWJrcm54cmJ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MzEzNTY3NywiZXhwIjoyMTA4NzExNjc3fQ.nhfwxlw9gSIntjHEvQg_VxP7fK7UettcbJHd9KN5e7M'
supabase = create_client(url, key)

rx_unlocked = re.compile(r'/unlockedProperties/(\d+)/')
rx_prop_img = re.compile(r'/property_image/image/(\d+)/')

print("1. Fetching all remaining broken rows...")
all_broken = []
limit = 1000
offset = 0

while True:
    res = supabase.table('properties')\
        .select('id, title, affiliate_url, images')\
        .ilike('affiliate_url', '%for-sale/property/all/egypt%')\
        .range(offset, offset + limit - 1)\
        .execute()
    batch = res.data
    all_broken.extend(batch)
    print(f"Fetched {len(batch)} broken rows (Total so far: {len(all_broken)})")
    if len(batch) < limit:
        break
    offset += limit

print(f"Total broken rows to migrate: {len(all_broken)}")

# Known compound slug map for top Egyptian compounds
KNOWN_COMPOUNDS = [
    ("ياردين", "1852-yardin"),
    ("ريجنسي", "1682-aurora"),
    ("بادية", "223-badya"),
    ("اي سيتي", "422-mountain-view-icity-october"),
    ("ماونتن فيو", "422-mountain-view-icity-october"),
    ("بلوم فيلدز", "248-bloomfields"),
    ("سراي", "245-sarai"),
    ("أو ريفا", "2808-o-riva"),
    ("أو ويست", "1214-o-west"),
    ("اليفايشن", "1291-elevation"),
    ("وست اند", "1111-west-end"),
    ("أيرا", "1009-ira"),
    ("فيرت", "2245-vert"),
    ("نيوم", "1430-nyoum-mostakbal"),
    ("قطامية جاردينز", "890-katameya-gardens"),
    ("البوسكو", "226-il-bosco"),
    ("سوديك إيست", "224-sodic-east"),
    ("ميفيدا", "221-mivida"),
    ("تاج سيتي", "244-taj-city"),
    ("زد", "445-zed-east"),
    ("هايد بارك", "220-hyde-park"),
    ("لا ميرادا", "875-la-mirada-new-cairo"),
]

def resolve_new_url(prop):
    pid = prop['id']
    title = prop.get('title') or ''
    imgs = prop.get('images') or []
    img_str = " ".join(imgs)

    # Strategy 1: unlockedProperties NID
    m1 = rx_unlocked.search(img_str)
    if m1:
        return f"https://www.nawy.com/ar/compound/any/property/{m1.group(1)}"

    # Strategy 2: property_image NID
    m2 = rx_prop_img.search(img_str)
    if m2:
        return f"https://www.nawy.com/ar/compound/any/property/{m2.group(1)}"

    # Strategy 3: Known compound slug match
    for cname, cslug in KNOWN_COMPOUNDS:
        if cname in title:
            return f"https://www.nawy.com/ar/compound/{cslug}"

    # Strategy 4: Clean title compound search on Nawy
    clean_title = title.split('|')[0].split(' - ')[0]
    for pfx in ["شقة في كمبوند", "فيلا في كمبوند", "مكتب في كمبوند", "تاون هاوس في كمبوند", "شاليه في كمبوند"]:
        clean_title = clean_title.replace(pfx, "").strip()
    clean_title = clean_title.replace("كمبوند", "").strip()

    return f"https://www.nawy.com/ar/search?query={urllib.parse.quote(clean_title or title)}"

updates = []
for p in all_broken:
    new_url = resolve_new_url(p)
    updates.append({'id': p['id'], 'affiliate_url': new_url, 'platform': 'Nawy'})

print(f"Prepared {len(updates)} updates.")

def update_single(item):
    try:
        supabase.table('properties').update({
            'affiliate_url': item['affiliate_url'],
            'platform': item['platform']
        }).eq('id', item['id']).execute()
        return True
    except Exception as e:
        return False

print("Updating Supabase concurrently with 25 workers...")
t0 = time.time()
success = 0
with ThreadPoolExecutor(max_workers=25) as executor:
    futures = [executor.submit(update_single, u) for u in updates]
    for fut in as_completed(futures):
        if fut.result():
            success += 1
        if success % 100 == 0:
            print(f"Progress: {success}/{len(updates)} rows updated...")

print(f"Done in {time.time() - t0:.2f}s! Successfully updated {success} rows in Supabase.")
