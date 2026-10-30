# -*- coding: utf-8 -*-
"""
Expand Aqarmap data by running Apify actor with many diverse Egyptian area URLs.
Targets: Cairo, Giza, Alexandria, New Cairo, October, Sheikh Zayed, New Capital, etc.
"""
import urllib.request
import urllib.error
import json
import time
import sys

APIFY_TOKEN = os.environ.get('APIFY_TOKEN', '')
ACTOR_ID = "sian.agency~aqarmap-property-scraper"
SUPABASE_URL = "https://csuifvyghfsibkrnxrby.supabase.co"
SUPABASE_KEY = os.environ.get('SUPABASE_SERVICE_ROLE_KEY', '')
AFFILIATE_CODE = "759279"

# Compound mapping: keywords in title -> project_id
COMPOUND_MAP = {
    "mountain view": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    "mivida": "cccccccc-cccc-cccc-cccc-cccccccccccc",
    "il bosco": "dddddddd-dddd-dddd-dddd-dddddddddddd",
    "villette": "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
    "zed east": "ffffffff-ffff-ffff-ffff-ffffffffffff",
    "madinaty": "00000000-0000-0000-0000-000000000001",
    "westown": "00000000-0000-0000-0000-000000000002",
    "badya": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
    "palm hills": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
}

# LARGE set of Aqarmap search URLs covering diverse Egyptian areas
START_URLS = [
    # New Cairo / Fifth Settlement
    "https://aqarmap.com.eg/en/for-sale/property-type/cairo/new-cairo/",
    "https://aqarmap.com.eg/en/for-sale/property-type/cairo/new-cairo/?page=2",
    "https://aqarmap.com.eg/en/for-sale/property-type/cairo/new-cairo/?page=3",
    "https://aqarmap.com.eg/en/for-sale/property-type/cairo/new-cairo/?page=4",
    "https://aqarmap.com.eg/en/for-sale/property-type/cairo/new-cairo/?page=5",
    # New Administrative Capital
    "https://aqarmap.com.eg/en/for-sale/property-type/cairo/new-capital/",
    "https://aqarmap.com.eg/en/for-sale/property-type/cairo/new-capital/?page=2",
    "https://aqarmap.com.eg/en/for-sale/property-type/cairo/new-capital/?page=3",
    # Sheikh Zayed / 6th October / Giza
    "https://aqarmap.com.eg/en/for-sale/property-type/giza/sheikh-zayed/",
    "https://aqarmap.com.eg/en/for-sale/property-type/giza/sheikh-zayed/?page=2",
    "https://aqarmap.com.eg/en/for-sale/property-type/giza/hadayek-october/",
    "https://aqarmap.com.eg/en/for-sale/property-type/giza/hadayek-october/?page=2",
    "https://aqarmap.com.eg/en/for-sale/property-type/giza/october-city/",
    # Maadi / Heliopolis / Nasr City
    "https://aqarmap.com.eg/en/for-sale/property-type/cairo/maadi/",
    "https://aqarmap.com.eg/en/for-sale/property-type/cairo/maadi/?page=2",
    "https://aqarmap.com.eg/en/for-sale/property-type/cairo/heliopolis/",
    "https://aqarmap.com.eg/en/for-sale/property-type/cairo/nasr-city/",
    # Alexandria
    "https://aqarmap.com.eg/en/for-sale/property-type/alex/",
    "https://aqarmap.com.eg/en/for-sale/property-type/alex/?page=2",
    "https://aqarmap.com.eg/en/for-sale/property-type/alex/stanley/",
    "https://aqarmap.com.eg/en/for-sale/property-type/alex/smouha/",
    # North Coast / Sahel
    "https://aqarmap.com.eg/en/for-sale/property-type/north-coast/",
    "https://aqarmap.com.eg/en/for-sale/property-type/north-coast/?page=2",
    # Shorouk / Obour / Badr
    "https://aqarmap.com.eg/en/for-sale/property-type/cairo/el-shorouk/",
    "https://aqarmap.com.eg/en/for-sale/property-type/cairo/obour-city/",
    # Zamalek / Dokki / Mohandessin
    "https://aqarmap.com.eg/en/for-sale/property-type/cairo/zamalek/",
    "https://aqarmap.com.eg/en/for-sale/property-type/cairo/dokki/",
    "https://aqarmap.com.eg/en/for-sale/property-type/cairo/mohandessin/",
    # Compounds specifically
    "https://aqarmap.com.eg/en/for-sale/compound/cairo/new-cairo/",
    "https://aqarmap.com.eg/en/for-sale/compound/cairo/new-capital/",
    "https://aqarmap.com.eg/en/for-sale/compound/giza/sheikh-zayed/",
]

def http_post(url, data, headers=None):
    body = json.dumps(data).encode()
    req = urllib.request.Request(url, data=body, method='POST')
    req.add_header('Content-Type', 'application/json')
    if headers:
        for k, v in headers.items():
            req.add_header(k, v)
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.loads(r.read())

def http_get(url, headers=None):
    req = urllib.request.Request(url)
    if headers:
        for k, v in headers.items():
            req.add_header(k, v)
    with urllib.request.urlopen(req, timeout=120) as r:
        return json.loads(r.read())

def get_existing_urls():
    """Get all existing Aqarmap affiliate URLs to avoid duplicates."""
    url = f"{SUPABASE_URL}/rest/v1/properties?platform=eq.Aqarmap&select=affiliate_url&limit=2000"
    headers = {"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}"}
    data = http_get(url, headers)
    existing = set()
    for row in data:
        u = row.get("affiliate_url", "")
        if u:
            # Extract listing ID
            parts = u.split("/")
            for p in parts:
                if p and p[0].isdigit():
                    existing.add(p.split("-")[0])
                    break
    print(f"[INFO] Found {len(existing)} existing Aqarmap listing IDs in Supabase")
    return existing

def map_compound(title: str) -> str:
    """Map property title to a compound/project_id."""
    t = title.lower()
    for keyword, pid in COMPOUND_MAP.items():
        if keyword in t:
            return pid
    # Default: New Cairo compound
    return "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"

def map_unit_type(prop: dict) -> str:
    """Map Aqarmap property type to our unit_type."""
    ptype = str(prop.get("propertyType") or prop.get("property_type") or "").lower()
    if "villa" in ptype:
        return "Villa"
    elif "twin" in ptype or "townhouse" in ptype:
        return "Townhouse"
    elif "penthouse" in ptype:
        return "Penthouse"
    elif "studio" in ptype:
        return "Studio"
    elif "chalet" in ptype:
        return "Chalet"
    return "Apartment"

def run_apify_batch(start_urls_batch: list, batch_num: int) -> list:
    """Run Apify actor for a batch of URLs."""
    print(f"\n[BATCH {batch_num}] Sending {len(start_urls_batch)} URLs to Apify...")
    
    run_url = f"https://api.apify.com/v2/acts/{ACTOR_ID}/runs?token={APIFY_TOKEN}"
    
    payload = {
        "startUrls": [{"url": u} for u in start_urls_batch],
        "maxItems": 200,
        "maxRequestsPerCrawl": 500,
    }
    
    try:
        result = http_post(run_url, payload)
        run_id = result.get("data", {}).get("id", "")
        if not run_id:
            print(f"[ERROR] No run ID returned: {result}")
            return []
        print(f"[BATCH {batch_num}] Run started: {run_id}")
        return [run_id]
    except Exception as e:
        print(f"[ERROR] Failed to start run: {e}")
        return []

def wait_for_run(run_id: str, timeout=300) -> str:
    """Wait for Apify run to complete, return dataset_id."""
    status_url = f"https://api.apify.com/v2/actor-runs/{run_id}?token={APIFY_TOKEN}"
    start = time.time()
    while time.time() - start < timeout:
        try:
            data = http_get(status_url)
            status = data.get("data", {}).get("status", "")
            dataset_id = data.get("data", {}).get("defaultDatasetId", "")
            if status in ("SUCCEEDED", "FAILED", "ABORTED", "TIMED-OUT"):
                print(f"[RUN {run_id}] Status: {status} | Dataset: {dataset_id}")
                return dataset_id if status == "SUCCEEDED" else ""
            print(f"[RUN {run_id}] Status: {status}... waiting 15s")
            time.sleep(15)
        except Exception as e:
            print(f"[ERROR] Status check failed: {e}")
            time.sleep(10)
    print(f"[TIMEOUT] Run {run_id} timed out")
    return ""

def fetch_dataset(dataset_id: str) -> list:
    """Fetch items from Apify dataset."""
    url = f"https://api.apify.com/v2/datasets/{dataset_id}/items?token={APIFY_TOKEN}&limit=1000&clean=true"
    try:
        data = http_get(url)
        print(f"[DATASET {dataset_id}] Got {len(data)} items")
        return data
    except Exception as e:
        print(f"[ERROR] Fetch dataset failed: {e}")
        return []

def transform_to_supabase(item: dict, existing_ids: set) -> dict | None:
    """Transform Apify item to Supabase property row."""
    # Get listing URL/ID
    listing_url = item.get("url") or item.get("listingUrl") or item.get("link") or ""
    if not listing_url:
        return None
    
    # Extract listing ID for dedup
    listing_id = ""
    for part in listing_url.split("/"):
        if part and part[0].isdigit():
            listing_id = part.split("-")[0]
            break
    
    if listing_id in existing_ids:
        return None  # Skip duplicate
    
    # Build affiliate URL
    if "?" in listing_url:
        affiliate_url = f"{listing_url}&utm_source=skanybot&ref={AFFILIATE_CODE}"
    else:
        affiliate_url = f"{listing_url}?utm_source=skanybot&ref={AFFILIATE_CODE}"
    
    # Images - MUST be from aqarmap CDN, no Unsplash
    images = item.get("images") or item.get("photos") or []
    if isinstance(images, str):
        images = [images]
    real_images = [
        img for img in images
        if isinstance(img, str) and "aqarmap.com.eg" in img and "unsplash" not in img
    ]
    if not real_images:
        # Try imageUrl field
        img_url = item.get("imageUrl") or item.get("mainImage") or item.get("coverImage") or ""
        if img_url and "aqarmap.com.eg" in img_url and "unsplash" not in img_url:
            real_images = [img_url]
    
    if not real_images:
        return None  # Skip if no real CDN images
    
    # Price
    price = item.get("price") or item.get("totalPrice") or 0
    try:
        price = float(str(price).replace(",", "").replace(" ", ""))
    except:
        price = 0
    if price <= 0:
        return None
    
    # Title
    title = item.get("title") or item.get("name") or item.get("description", "")[:100] or ""
    if not title:
        return None
    
    # Area/size
    area = item.get("area") or item.get("size") or item.get("areaSqm") or 0
    try:
        area = float(str(area).replace(",", "").replace(" ", "").replace("m2","").replace("م",""))
    except:
        area = 0
    
    # Bedrooms / Bathrooms
    bedrooms = item.get("bedrooms") or item.get("rooms") or 0
    bathrooms = item.get("bathrooms") or 0
    try:
        bedrooms = int(bedrooms)
        bathrooms = int(bathrooms)
    except:
        bedrooms = 0
        bathrooms = 0
    
    unit_type = map_unit_type(item)
    project_id = map_compound(title)
    
    if listing_id:
        existing_ids.add(listing_id)
    
    return {
        "project_id": project_id,
        "title": title[:255],
        "unit_type": unit_type,
        "bedrooms": bedrooms or None,
        "bathrooms": bathrooms or None,
        "area_sqm": area if area > 0 else None,
        "total_price": price,
        "currency": "EGP",
        "status": "available",
        "images": real_images[:10],
        "featured": False,
        "affiliate_url": affiliate_url,
        "partner_code": str(AFFILIATE_CODE),
        "platform": "Aqarmap",
    }

def upsert_to_supabase(rows: list) -> int:
    """Batch upsert rows to Supabase."""
    if not rows:
        return 0
    
    url = f"{SUPABASE_URL}/rest/v1/properties"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Prefer": "resolution=ignore-duplicates,return=minimal",
    }
    
    # Send in batches of 50
    inserted = 0
    for i in range(0, len(rows), 50):
        batch = rows[i:i+50]
        try:
            body = json.dumps(batch).encode()
            req = urllib.request.Request(url, data=body, method='POST')
            req.add_header('Content-Type', 'application/json')
            for k, v in headers.items():
                req.add_header(k, v)
            with urllib.request.urlopen(req, timeout=30) as r:
                r.read()
            inserted += len(batch)
            print(f"  [UPSERT] Inserted batch of {len(batch)}")
        except Exception as e:
            print(f"  [ERROR] Upsert failed: {e}")
    return inserted

def get_final_stats():
    """Get final counts from Supabase."""
    url = f"{SUPABASE_URL}/rest/v1/properties?select=platform,unit_type,currency&limit=5000"
    headers = {"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}"}
    data = http_get(url, headers)
    
    total = len(data)
    aqar = [x for x in data if x.get("platform") == "Aqarmap"]
    tekce = [x for x in data if x.get("platform") == "TEKCE"]
    
    print(f"\n{'='*50}")
    print(f"FINAL STATS")
    print(f"{'='*50}")
    print(f"Total properties: {total}")
    print(f"  Aqarmap (Egypt): {len(aqar)}")
    print(f"  TEKCE (International): {len(tekce)}")
    
    # Unit type breakdown for Aqarmap
    aqar_types = {}
    for x in aqar:
        t = x.get("unit_type", "Unknown")
        aqar_types[t] = aqar_types.get(t, 0) + 1
    print(f"\nAqarmap unit types:")
    for t, c in sorted(aqar_types.items(), key=lambda x: -x[1]):
        print(f"  {t}: {c}")
    
    # TEKCE currency (location) breakdown
    tekce_curr = {}
    for x in tekce:
        c = x.get("currency", "?")
        tekce_curr[c] = tekce_curr.get(c, 0) + 1
    print(f"\nTEKCE by currency/location:")
    for c, n in sorted(tekce_curr.items(), key=lambda x: -x[1]):
        label = {"USD": "Turkey", "AED": "Dubai", "EUR": "Spain"}.get(c, c)
        print(f"  {label} ({c}): {n}")
    print(f"{'='*50}")

# ─── MAIN ───────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    print("=== Aqarmap Expansion Script ===")
    print(f"Total start URLs: {len(START_URLS)}")
    
    existing_ids = get_existing_urls()
    
    total_new = 0
    
    # Split into batches of 10 URLs each to avoid Apify limits
    BATCH_SIZE = 10
    batches = [START_URLS[i:i+BATCH_SIZE] for i in range(0, len(START_URLS), BATCH_SIZE)]
    
    all_run_ids = []
    
    # Start all runs
    for i, batch in enumerate(batches):
        run_ids = run_apify_batch(batch, i+1)
        all_run_ids.extend(run_ids)
        time.sleep(2)  # Small delay between starts
    
    print(f"\n[INFO] Started {len(all_run_ids)} Apify runs. Waiting for completion...")
    
    # Wait for each run and process results
    for run_id in all_run_ids:
        dataset_id = wait_for_run(run_id, timeout=240)
        if not dataset_id:
            print(f"[SKIP] Run {run_id} failed or timed out")
            continue
        
        items = fetch_dataset(dataset_id)
        if not items:
            continue
        
        rows = []
        for item in items:
            row = transform_to_supabase(item, existing_ids)
            if row:
                rows.append(row)
        
        if rows:
            print(f"[INFO] Upserting {len(rows)} new properties from run {run_id}...")
            n = upsert_to_supabase(rows)
            total_new += n
            print(f"[INFO] Inserted {n} | Total new so far: {total_new}")
        else:
            print(f"[INFO] No new valid properties from run {run_id}")
    
    print(f"\n[DONE] Total new Aqarmap properties added: {total_new}")
    get_final_stats()
