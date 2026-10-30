# -*- coding: utf-8 -*-
"""
Direct Aqarmap scraper - no Apify needed.
Scrapes search pages for listing URLs, then scrapes each listing page for full data.
Uses Aqarmap's internal __NEXT_DATA__ JSON embedded in HTML pages.
"""
import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

import urllib.request
import urllib.error
import urllib.parse
import json
import re
import time
import random

SUPABASE_URL = "https://csuifvyghfsibkrnxrby.supabase.co"
SUPABASE_KEY = os.environ.get('SUPABASE_SERVICE_ROLE_KEY', '')
AFFILIATE_CODE = "759279"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9,ar;q=0.8",
    "Accept-Encoding": "identity",
    "Connection": "keep-alive",
}

# Search pages to crawl (multiple pages per area)
SEARCH_PAGES = [
    # New Cairo - multiple pages
    "https://aqarmap.com.eg/en/for-sale/property-type/cairo/new-cairo/",
    "https://aqarmap.com.eg/en/for-sale/property-type/cairo/new-cairo/?page=2",
    "https://aqarmap.com.eg/en/for-sale/property-type/cairo/new-cairo/?page=3",
    "https://aqarmap.com.eg/en/for-sale/property-type/cairo/new-cairo/?page=4",
    "https://aqarmap.com.eg/en/for-sale/property-type/cairo/new-cairo/?page=5",
    # New Capital
    "https://aqarmap.com.eg/en/for-sale/property-type/cairo/new-capital/",
    "https://aqarmap.com.eg/en/for-sale/property-type/cairo/new-capital/?page=2",
    "https://aqarmap.com.eg/en/for-sale/property-type/cairo/new-capital/?page=3",
    # Sheikh Zayed
    "https://aqarmap.com.eg/en/for-sale/property-type/giza/sheikh-zayed/",
    "https://aqarmap.com.eg/en/for-sale/property-type/giza/sheikh-zayed/?page=2",
    # 6th October
    "https://aqarmap.com.eg/en/for-sale/property-type/giza/hadayek-october/",
    "https://aqarmap.com.eg/en/for-sale/property-type/giza/october-city/",
    # Maadi
    "https://aqarmap.com.eg/en/for-sale/property-type/cairo/maadi/",
    "https://aqarmap.com.eg/en/for-sale/property-type/cairo/maadi/?page=2",
    # Heliopolis / Nasr City
    "https://aqarmap.com.eg/en/for-sale/property-type/cairo/heliopolis/",
    "https://aqarmap.com.eg/en/for-sale/property-type/cairo/nasr-city/",
    # Alexandria
    "https://aqarmap.com.eg/en/for-sale/property-type/alex/",
    "https://aqarmap.com.eg/en/for-sale/property-type/alex/?page=2",
    "https://aqarmap.com.eg/en/for-sale/property-type/alex/stanley/",
    "https://aqarmap.com.eg/en/for-sale/property-type/alex/smouha/",
    # North Coast
    "https://aqarmap.com.eg/en/for-sale/property-type/north-coast/",
    "https://aqarmap.com.eg/en/for-sale/property-type/north-coast/?page=2",
    # Shorouk / Obour
    "https://aqarmap.com.eg/en/for-sale/property-type/cairo/el-shorouk/",
    "https://aqarmap.com.eg/en/for-sale/property-type/cairo/obour-city/",
    # Zamalek / Dokki / Mohandessin
    "https://aqarmap.com.eg/en/for-sale/property-type/cairo/zamalek/",
    "https://aqarmap.com.eg/en/for-sale/property-type/cairo/dokki/",
    # Compounds
    "https://aqarmap.com.eg/en/for-sale/compound/cairo/new-cairo/",
    "https://aqarmap.com.eg/en/for-sale/compound/cairo/new-cairo/?page=2",
    "https://aqarmap.com.eg/en/for-sale/compound/cairo/new-capital/",
    "https://aqarmap.com.eg/en/for-sale/compound/giza/sheikh-zayed/",
    # Villas
    "https://aqarmap.com.eg/en/for-sale/villa/cairo/new-cairo/",
    "https://aqarmap.com.eg/en/for-sale/villa/giza/sheikh-zayed/",
]

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

def http_get_html(url: str, retries=3) -> str:
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, headers=HEADERS)
            with urllib.request.urlopen(req, timeout=30) as r:
                return r.read().decode('utf-8', errors='replace')
        except urllib.error.HTTPError as e:
            print(f"  [HTTP {e.code}] {url}")
            if e.code == 404:
                return ""
            time.sleep(2 * (attempt + 1))
        except Exception as e:
            print(f"  [ERROR] {url}: {e}")
            time.sleep(2 * (attempt + 1))
    return ""

def supabase_get(path: str) -> list:
    url = f"{SUPABASE_URL}/rest/v1/{path}"
    req = urllib.request.Request(url, headers={
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
    })
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())

def supabase_upsert(rows: list) -> int:
    if not rows:
        return 0
    url = f"{SUPABASE_URL}/rest/v1/properties"
    inserted = 0
    for i in range(0, len(rows), 50):
        batch = rows[i:i+50]
        body = json.dumps(batch).encode('utf-8')
        req = urllib.request.Request(url, data=body, method='POST')
        req.add_header('Content-Type', 'application/json; charset=utf-8')
        req.add_header('apikey', SUPABASE_KEY)
        req.add_header('Authorization', f'Bearer {SUPABASE_KEY}')
        req.add_header('Prefer', 'resolution=ignore-duplicates,return=minimal')
        try:
            with urllib.request.urlopen(req, timeout=30) as r:
                r.read()
            inserted += len(batch)
            print(f"  [DB] Upserted {len(batch)} rows")
        except Exception as e:
            print(f"  [DB ERROR] {e}")
    return inserted

def get_existing_listing_ids() -> set:
    data = supabase_get("properties?platform=eq.Aqarmap&select=affiliate_url&limit=5000")
    ids = set()
    for row in data:
        u = row.get("affiliate_url") or ""
        m = re.search(r'/listing/(\d+)', u)
        if m:
            ids.add(m.group(1))
    print(f"[INFO] {len(ids)} existing Aqarmap listing IDs in DB")
    return ids

def extract_listing_urls_from_page(html: str) -> list[str]:
    """Extract /en/listing/... URLs from a search results page."""
    urls = re.findall(r'href="(https://aqarmap\.com\.eg/en/listing/\d+[^"]*)"', html)
    # Also try relative paths
    rel = re.findall(r'href="(/en/listing/\d+[^"]*)"', html)
    for r in rel:
        urls.append("https://aqarmap.com.eg" + r)
    # Also extract from JSON data embedded in page
    json_urls = re.findall(r'"url"\s*:\s*"(https://aqarmap\.com\.eg/en/listing/\d+[^"]*)"', html)
    urls.extend(json_urls)
    # Deduplicate and clean
    clean = set()
    for u in urls:
        u = u.split("?")[0].rstrip("/")
        clean.add(u)
    return list(clean)

def extract_listing_urls_from_nextdata(html: str) -> list[str]:
    """Try to extract listing URLs from __NEXT_DATA__ JSON."""
    m = re.search(r'<script id="__NEXT_DATA__"[^>]*>(.*?)</script>', html, re.DOTALL)
    if not m:
        return []
    try:
        data = json.loads(m.group(1))
        # Walk the JSON looking for listing URLs
        text = json.dumps(data)
        urls = re.findall(r'"(https://aqarmap\.com\.eg/en/listing/\d+[^"]*)"', text)
        rel = re.findall(r'"(/en/listing/\d+[^"]*)"', text)
        all_urls = set()
        for u in urls:
            all_urls.add(u.split("?")[0].rstrip("/"))
        for r in rel:
            all_urls.add(("https://aqarmap.com.eg" + r).split("?")[0].rstrip("/"))
        return list(all_urls)
    except:
        return []

def scrape_listing_page(url: str) -> dict | None:
    """Scrape a single listing page and extract property data."""
    html = http_get_html(url)
    if not html or len(html) < 1000:
        return None
    
    # Try JSON-LD first
    json_ld_blocks = re.findall(r'<script type="application/ld\+json">(.*?)</script>', html, re.DOTALL)
    listing_data = {}
    for block in json_ld_blocks:
        try:
            d = json.loads(block.strip())
            t = d.get("@type", "")
            if t in ("RealEstateListing", "Product", "Offer") or "price" in d:
                listing_data = d
                break
        except:
            continue
    
    # Try __NEXT_DATA__
    next_data = {}
    m = re.search(r'<script id="__NEXT_DATA__"[^>]*>(.*?)</script>', html, re.DOTALL)
    if m:
        try:
            next_data = json.loads(m.group(1))
        except:
            pass
    
    # Extract images - MUST be from aqarmap CDN
    all_images = re.findall(r'https://img[\d\w-]*\.aqarmap\.com\.eg/[^\s"\'<>]+', html)
    # Also find from listing data
    cdn_images = []
    for img in set(all_images):
        img = img.rstrip('",\'')
        if 'unsplash' not in img and ('aqarmap.com.eg' in img):
            if any(ext in img.lower() for ext in ['.jpg', '.jpeg', '.png', '.webp']):
                cdn_images.append(img)
    
    if not cdn_images:
        # Try JSON-LD images
        imgs = listing_data.get("image", [])
        if isinstance(imgs, str):
            imgs = [imgs]
        for img in imgs:
            if 'aqarmap.com.eg' in img and 'unsplash' not in img:
                cdn_images.append(img)
    
    if not cdn_images:
        return None  # No real images
    
    # Extract price
    price = 0
    price_raw = listing_data.get("offers", {}).get("price") or listing_data.get("price", 0)
    if not price_raw:
        # Try from HTML meta tags
        m = re.search(r'"price"\s*:\s*"?(\d[\d,\.]+)"?', html)
        if m:
            price_raw = m.group(1)
    if not price_raw:
        m = re.search(r'<meta property="product:price:amount" content="([\d,\.]+)"', html)
        if m:
            price_raw = m.group(1)
    try:
        price = float(str(price_raw).replace(",", "").replace(" ", ""))
    except:
        price = 0
    
    if price <= 0:
        # Try to find price in HTML text
        m = re.search(r'(\d[\d,]{4,})\s*(?:EGP|جنيه|ج\.م)', html)
        if m:
            try:
                price = float(m.group(1).replace(",", ""))
            except:
                pass
    
    if price <= 0:
        return None
    
    # Extract title
    title = listing_data.get("name") or listing_data.get("headline") or ""
    if not title:
        m = re.search(r'<title>([^<]+)</title>', html)
        if m:
            title = m.group(1).replace(" | Aqarmap", "").replace("Aqarmap - ", "").strip()
    if not title:
        m = re.search(r'<h1[^>]*>([^<]+)</h1>', html)
        if m:
            title = m.group(1).strip()
    
    if not title or len(title) < 5:
        return None
    
    # Extract area (sqm)
    area = 0
    area_raw = listing_data.get("floorSize", {})
    if isinstance(area_raw, dict):
        area = area_raw.get("value", 0)
    elif isinstance(area_raw, (int, float)):
        area = area_raw
    if not area:
        m = re.search(r'(\d+)\s*(?:m2|sqm|&#x645;2|متر)', html, re.IGNORECASE)
        if m:
            try:
                area = float(m.group(1))
            except:
                pass
    
    # Bedrooms / Bathrooms
    bedrooms = listing_data.get("numberOfRooms", 0)
    if not bedrooms:
        m = re.search(r'"numberOfRooms"\s*:\s*(\d+)', html)
        if m:
            bedrooms = int(m.group(1))
    if not bedrooms:
        m = re.search(r'(\d+)\s*(?:bed|bedroom|Bed|غرفة)', html)
        if m:
            bedrooms = int(m.group(1))
    
    bathrooms = 0
    m = re.search(r'(\d+)\s*(?:bath|bathroom|Bath|حمام)', html)
    if m:
        bathrooms = int(m.group(1))
    
    # Unit type
    unit_type = "Apartment"
    type_m = re.search(r'"propertyType"\s*:\s*"([^"]+)"', html)
    if type_m:
        pt = type_m.group(1).lower()
        if "villa" in pt:
            unit_type = "Villa"
        elif "penthouse" in pt:
            unit_type = "Penthouse"
        elif "twin" in pt or "townhouse" in pt:
            unit_type = "Townhouse"
        elif "studio" in pt:
            unit_type = "Studio"
        elif "chalet" in pt:
            unit_type = "Chalet"
    
    # Map compound
    title_lower = title.lower()
    project_id = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"  # default: New Cairo
    for kw, pid in COMPOUND_MAP.items():
        if kw in title_lower:
            project_id = pid
            break
    
    return {
        "project_id": project_id,
        "title": title[:255],
        "unit_type": unit_type,
        "bedrooms": int(bedrooms) if bedrooms else None,
        "bathrooms": int(bathrooms) if bathrooms else None,
        "area_sqm": float(area) if area > 0 else None,
        "total_price": price,
        "currency": "EGP",
        "status": "available",
        "images": list(dict.fromkeys(cdn_images))[:10],
        "featured": False,
        "affiliate_url": url + f"?utm_source=skanybot&ref={AFFILIATE_CODE}",
        "partner_code": str(AFFILIATE_CODE),
        "platform": "Aqarmap",
    }

def main():
    print("=== Aqarmap Direct Scraper ===")
    existing_ids = get_existing_listing_ids()
    
    # Step 1: Collect all unique listing URLs from search pages
    all_listing_urls = set()
    print(f"\n[STEP 1] Crawling {len(SEARCH_PAGES)} search pages...")
    
    for i, search_url in enumerate(SEARCH_PAGES):
        print(f"  [{i+1}/{len(SEARCH_PAGES)}] {search_url}")
        html = http_get_html(search_url)
        if not html:
            print(f"    -> Empty response, skipping")
            continue
        
        # Extract from href patterns
        urls1 = extract_listing_urls_from_page(html)
        # Extract from __NEXT_DATA__
        urls2 = extract_listing_urls_from_nextdata(html)
        
        new_urls = set(urls1) | set(urls2)
        
        # Filter out already-known IDs
        filtered = set()
        for u in new_urls:
            m = re.search(r'/listing/(\d+)', u)
            if m and m.group(1) not in existing_ids:
                filtered.add(u)
        
        all_listing_urls |= filtered
        print(f"    -> Found {len(urls1+urls2)} URLs, {len(filtered)} new. Total unique: {len(all_listing_urls)}")
        
        time.sleep(random.uniform(0.5, 1.5))  # polite delay
    
    print(f"\n[STEP 2] Scraping {len(all_listing_urls)} individual listing pages...")
    
    if not all_listing_urls:
        print("[WARNING] No new listing URLs found! Trying alternative approach...")
        # Fallback: use Aqarmap sitemap
        sitemap_html = http_get_html("https://aqarmap.com.eg/sitemap-listings-en.xml")
        if sitemap_html:
            sitemap_urls = re.findall(r'<loc>(https://aqarmap\.com\.eg/en/listing/\d+[^<]*)</loc>', sitemap_html)
            print(f"  [SITEMAP] Found {len(sitemap_urls)} listing URLs in sitemap")
            for u in sitemap_urls[:500]:
                m = re.search(r'/listing/(\d+)', u)
                if m and m.group(1) not in existing_ids:
                    all_listing_urls.add(u.split("?")[0])
        
        # Also try robots.txt for sitemap URLs
        if not all_listing_urls:
            print("[WARNING] Still no URLs. Check network access to aqarmap.com.eg")
            get_final_stats()
            return
    
    # Step 2: Scrape each listing page
    rows = []
    urls_list = list(all_listing_urls)
    
    for i, listing_url in enumerate(urls_list):
        print(f"  [{i+1}/{len(urls_list)}] Scraping: {listing_url[:80]}")
        
        prop = scrape_listing_page(listing_url)
        if prop:
            rows.append(prop)
            # Mark ID as processed
            m = re.search(r'/listing/(\d+)', listing_url)
            if m:
                existing_ids.add(m.group(1))
            print(f"    -> OK: {prop['title'][:50]} | EGP {prop['total_price']:,.0f} | {len(prop['images'])} imgs")
        else:
            print(f"    -> SKIP (no valid data)")
        
        # Batch upsert every 20 properties
        if len(rows) >= 20:
            print(f"\n  [BATCH UPSERT] {len(rows)} rows...")
            supabase_upsert(rows)
            rows = []
        
        time.sleep(random.uniform(0.3, 0.8))
    
    # Final upsert
    if rows:
        print(f"\n  [FINAL UPSERT] {len(rows)} rows...")
        supabase_upsert(rows)
    
    get_final_stats()

def get_final_stats():
    """Get final counts from Supabase."""
    try:
        data = supabase_get("properties?select=platform,unit_type,currency&limit=5000")
        total = len(data)
        aqar = [x for x in data if x.get("platform") == "Aqarmap"]
        tekce = [x for x in data if x.get("platform") == "TEKCE"]
        
        print(f"\n{'='*50}")
        print(f"FINAL STATS")
        print(f"{'='*50}")
        print(f"Total properties: {total}")
        print(f"  Aqarmap (Egypt): {len(aqar)}")
        print(f"  TEKCE (International): {len(tekce)}")
        
        aqar_types = {}
        for x in aqar:
            t = x.get("unit_type", "Unknown")
            aqar_types[t] = aqar_types.get(t, 0) + 1
        print(f"Aqarmap unit types:")
        for t, c in sorted(aqar_types.items(), key=lambda x: -x[1]):
            print(f"  {t}: {c}")
        
        tekce_curr = {}
        for x in tekce:
            c = x.get("currency", "?")
            tekce_curr[c] = tekce_curr.get(c, 0) + 1
        print(f"TEKCE by location:")
        for c, n in sorted(tekce_curr.items(), key=lambda x: -x[1]):
            label = {"USD": "Turkey", "AED": "Dubai", "EUR": "Spain"}.get(c, c)
            print(f"  {label} ({c}): {n}")
        print(f"{'='*50}")
    except Exception as e:
        print(f"[STATS ERROR] {e}")

if __name__ == "__main__":
    main()
