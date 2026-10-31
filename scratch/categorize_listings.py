import re
import json
import sys
import uuid
from supabase import create_client

sys.stdout.reconfigure(encoding='utf-8')

url = 'https://csuifvyghfsibkrnxrby.supabase.co'
key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzdWlmdnlnaGZzaWJrcm54cmJ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MzEzNTY3NywiZXhwIjoyMTA4NzExNjc3fQ.nhfwxlw9gSIntjHEvQg_VxP7fK7UettcbJHd9KN5e7M'
supabase = create_client(url, key)

res = supabase.table('properties').select('id, title, affiliate_url, images').execute()
print(f"Total properties: {len(res.data)}")

rx_unlocked = re.compile(r'/unlockedProperties/(\d+)/')
rx_prop_img = re.compile(r'/property_image/image/(\d+)/')

exact_listing_count = 0
unlocked_nid_count = 0
prop_img_nid_count = 0
brochure_count = 0
other_count = 0

for r in res.data:
    u = r.get('affiliate_url') or ''
    if 'aqarmap.com.eg/ar/listing/' in u:
        exact_listing_count += 1
        continue
    
    imgs = r.get('images') or []
    img_str = " ".join(imgs)
    
    m1 = rx_unlocked.search(img_str)
    if m1:
        unlocked_nid_count += 1
        continue
        
    m2 = rx_prop_img.search(img_str)
    if m2:
        prop_img_nid_count += 1
        continue
        
    if 'brochure_images' in img_str:
        brochure_count += 1
        continue
        
    other_count += 1

print(f"1. Aqarmap direct /ar/listing/: {exact_listing_count}")
print(f"2. Nawy unlockedProperties NID: {unlocked_nid_count}")
print(f"3. Nawy property_image NID: {prop_img_nid_count}")
print(f"4. Nawy brochure_images: {brochure_count}")
print(f"5. Other: {other_count}")
