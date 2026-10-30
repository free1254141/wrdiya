# -*- coding: utf-8 -*-
"""
Aqarmap Direct Scraper v2
- Collects listing URLs from search pages (relative href pattern)
- Scrapes each listing page for real data + CDN images
- Inserts into Supabase (no Apify, no fake data)
"""
import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

import urllib.request, urllib.error, json, re, time, random

SUPABASE_URL = "https://csuifvyghfsibkrnxrby.supabase.co"
SUPABASE_KEY = os.environ.get('SUPABASE_SERVICE_ROLE_KEY', '')
AFFILIATE_CODE = "759279"
BASE = "https://aqarmap.com.eg"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept-Encoding": "identity",
}

SEARCH_PAGES = [
    "/en/for-sale/property-type/cairo/new-cairo/",
    "/en/for-sale/property-type/cairo/new-cairo/?page=2",
    "/en/for-sale/property-type/cairo/new-cairo/?page=3",
    "/en/for-sale/property-type/cairo/new-cairo/?page=4",
    "/en/for-sale/property-type/cairo/new-cairo/?page=5",
    "/en/for-sale/property-type/cairo/new-capital/",
    "/en/for-sale/property-type/cairo/new-capital/?page=2",
    "/en/for-sale/property-type/cairo/new-capital/?page=3",
    "/en/for-sale/property-type/giza/sheikh-zayed/",
    "/en/for-sale/property-type/giza/sheikh-zayed/?page=2",
    "/en/for-sale/property-type/giza/hadayek-october/",
    "/en/for-sale/property-type/giza/october-city/",
    "/en/for-sale/property-type/cairo/maadi/",
    "/en/for-sale/property-type/cairo/maadi/?page=2",
    "/en/for-sale/property-type/cairo/heliopolis/",
    "/en/for-sale/property-type/cairo/nasr-city/",
    "/en/for-sale/property-type/alex/",
    "/en/for-sale/property-type/alex/?page=2",
    "/en/for-sale/property-type/alex/stanley/",
    "/en/for-sale/property-type/alex/smouha/",
    "/en/for-sale/property-type/north-coast/",
    "/en/for-sale/property-type/north-coast/?page=2",
    "/en/for-sale/property-type/cairo/el-shorouk/",
    "/en/for-sale/property-type/cairo/obour-city/",
    "/en/for-sale/property-type/cairo/zamalek/",
    "/en/for-sale/property-type/cairo/dokki/",
    "/en/for-sale/property-type/cairo/mohandessin/",
    "/en/for-sale/compound/cairo/new-cairo/",
    "/en/for-sale/compound/cairo/new-cairo/?page=2",
    "/en/for-sale/compound/cairo/new-capital/",
    "/en/for-sale/compound/giza/sheikh-zayed/",
    "/en/for-sale/villa/cairo/new-cairo/",
    "/en/for-sale/villa/giza/sheikh-zayed/",
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

# Regex patterns
RE_LISTING = re.compile(r'href="(/en/listing/(\d+)[^"]*)"')
RE_IMG_CDN = re.compile(r'(https://img-?\d*\.aqarmap\.com\.eg/[^\s"\'<>]+\.(?:jpg|jpeg|png|webp|JPG|JPEG|PNG|WEBP))', re.IGNORECASE)
RE_PRICE = re.compile(r'"price"\s*:\s*"?([\d,\.]+)"?')
RE_AREA = re.compile(r'"area"\s*:\s*"?([\d,\.]+)"?')
RE_BEDS = re.compile(r'"bedrooms"\s*:\s*(\d+)')
RE_BATHS = re.compile(r'"bathrooms"\s*:\s*(\d+)')
RE_TYPE = re.compile(r'"propertyType"\s*:\s*"([^"]+)"')
RE_TITLE = re.compile(r'<title>([^<]+)</title>')

def fetch(url: str, retries=3) -> str:
    for i in range(retries):
        try:
            req = urllib.request.Request(url, headers=HEADERS)
            with urllib.request.urlopen(req, timeout=20) as r:
                return r.read().decode('utf-8', errors='replace')
        except urllib.error.HTTPError as e:
            if e.code == 404:
                return ""
            time.sleep(2 ** i)
        except Exception as e:
            time.sleep(2 ** i)
    return ""

def sb_get(path: str) -> list:
    req = urllib.request.Request(
        f"{SUPABASE_URL}/rest/v1/{path}",
        headers={"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}"}
    )
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())

def sb_upsert(rows: list) -> int:
    if not rows:
        return 0
    total = 0
    for i in range(0, len(rows), 20):
        batch = rows[i:i+20]
        # Sanitize: ensure all string fields are valid unicode, strip nulls
        clean = []
        for row in batch:
            r2 = {}
            for k, v in row.items():
                if isinstance(v, str):
                    v = v.replace('\x00', '').strip()
                elif isinstance(v, list):
                    v = [x.replace('\x00','').strip() if isinstance(x,str) else x for x in v]
                r2[k] = v
            clean.append(r2)
        body = json.dumps(clean, ensure_ascii=False).encode('utf-8')
        req = urllib.request.Request(f"{SUPABASE_URL}/rest/v1/properties", data=body, method='POST')
        req.add_header('Content-Type', 'application/json; charset=utf-8')
        req.add_header('apikey', SUPABASE_KEY)
        req.add_header('Authorization', f'Bearer {SUPABASE_KEY}')
        req.add_header('Prefer', 'resolution=ignore-duplicates,return=minimal')
        try:
            with urllib.request.urlopen(req, timeout=30) as r:
                r.read()
            total += len(clean)
            print(f"  [DB] Upserted {len(clean)} rows OK")
        except urllib.error.HTTPError as e:
            err_body = e.read().decode('utf-8', errors='replace')[:300]
            print(f"  [DB ERR {e.code}] {err_body}")
            # Try one by one to isolate bad rows
            for single in clean:
                try:
                    b2 = json.dumps([single], ensure_ascii=False).encode('utf-8')
                    req2 = urllib.request.Request(f"{SUPABASE_URL}/rest/v1/properties", data=b2, method='POST')
                    req2.add_header('Content-Type', 'application/json; charset=utf-8')
                    req2.add_header('apikey', SUPABASE_KEY)
                    req2.add_header('Authorization', f'Bearer {SUPABASE_KEY}')
                    req2.add_header('Prefer', 'resolution=ignore-duplicates,return=minimal')
                    with urllib.request.urlopen(req2, timeout=15) as r2:
                        r2.read()
                    total += 1
                except Exception as e2:
                    print(f"  [SKIP ROW] {single.get('title','?')[:40]}: {e2}")
        except Exception as e:
            print(f"  [DB ERR] {e}")
    return total

def get_existing_ids() -> set:
    data = sb_get("properties?platform=eq.Aqarmap&select=affiliate_url&limit=5000")
    ids = set()
    for row in data:
        u = row.get("affiliate_url") or ""
        m = re.search(r'/listing/(\d+)', u)
        if m:
            ids.add(m.group(1))
    print(f"[DB] {len(ids)} existing Aqarmap IDs")
    return ids

def map_compound(title: str) -> str:
    t = title.lower()
    for kw, pid in COMPOUND_MAP.items():
        if kw in t:
            return pid
    return "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"

def map_unit_type(html: str) -> str:
    m = RE_TYPE.search(html)
    if m:
        pt = m.group(1).lower()
        if "villa" in pt: return "Villa"
        if "penthouse" in pt: return "Penthouse"
        if "twin" in pt or "townhouse" in pt: return "Townhouse"
        if "studio" in pt: return "Studio"
        if "chalet" in pt: return "Chalet"
    return "Apartment"

def collect_listing_urls(existing_ids: set) -> list:
    """Step 1: Collect all unique new listing URLs."""
    seen_ids = set()
    result = []

    for i, path in enumerate(SEARCH_PAGES):
        url = BASE + path
        print(f"[{i+1}/{len(SEARCH_PAGES)}] {url}")
        html = fetch(url)
        if not html:
            print(f"  -> empty, skip")
            continue

        matches = RE_LISTING.findall(html)
        new = 0
        for href, lid in matches:
            if lid not in existing_ids and lid not in seen_ids:
                seen_ids.add(lid)
                result.append((lid, BASE + href.split("?")[0]))
                new += 1

        print(f"  -> {len(matches)} hits, {new} new. Total: {len(result)}")
        time.sleep(random.uniform(0.6, 1.2))

    return result

def scrape_listing(lid: str, url: str) -> dict | None:
    """Step 2: Scrape individual listing page."""
    html = fetch(url)
    if not html or len(html) < 2000:
        return None

    # Images - ONLY from aqarmap CDN, prefer large size, deduplicate
    all_imgs = RE_IMG_CDN.findall(html)
    # Prefer /large/ images; fallback to any CDN image
    large_imgs = [img for img in all_imgs if '/large/' in img and 'unsplash' not in img]
    if not large_imgs:
        large_imgs = [img for img in all_imgs if 'unsplash' not in img
                      and '/small/' not in img and '/logo/' not in img and '/search-thumb/' not in img]
    if not large_imgs:
        large_imgs = [img for img in all_imgs if 'unsplash' not in img]
    imgs = list(dict.fromkeys(large_imgs))
    if not imgs:
        return None

    # Price - strip trailing comma/space
    price = 0
    m = RE_PRICE.search(html)
    if m:
        try: price = float(m.group(1).rstrip(',').replace(",", ""))
        except: pass
    if price <= 0:
        pm = re.search(r'([\d]{4,}[\d,]*)\s*(?:EGP|ج)', html)
        if pm:
            try: price = float(pm.group(1).replace(",", ""))
            except: pass
    if price <= 0:
        return None

    # Title
    title = ""
    m = RE_TITLE.search(html)
    if m:
        title = m.group(1).replace(" | Aqarmap", "").replace("Aqarmap - ", "").strip()
    if not title or len(title) < 5:
        return None

    # Numeric fields
    area = 0
    m = RE_AREA.search(html)
    if m:
        try: area = float(m.group(1).replace(",", ""))
        except: pass

    beds = 0
    m = RE_BEDS.search(html)
    if m:
        try: beds = int(m.group(1))
        except: pass

    baths = 0
    m = RE_BATHS.search(html)
    if m:
        try: baths = int(m.group(1))
        except: pass

    aff_url = f"{url}?utm_source=skanybot&ref={AFFILIATE_CODE}"

    return {
        "project_id": map_compound(title),
        "title": title[:255],
        "unit_type": map_unit_type(html),
        "bedrooms": beds or None,
        "bathrooms": baths or None,
        "area_sqm": area if area > 0 else None,
        "total_price": price,
        "currency": "EGP",
        "status": "available",
        "images": imgs[:10],
        "featured": False,
        "affiliate_url": aff_url,
        "partner_code": str(AFFILIATE_CODE),
        "platform": "Aqarmap",
    }

def print_stats():
    data = sb_get("properties?select=platform,unit_type,currency&limit=5000")
    aqar = [x for x in data if x.get("platform") == "Aqarmap"]
    tekce = [x for x in data if x.get("platform") == "TEKCE"]
    print(f"\n{'='*55}")
    print(f"STATS — Total: {len(data)}")
    print(f"  Aqarmap (Egypt):         {len(aqar)}")
    print(f"  TEKCE (International):   {len(tekce)}")
    types = {}
    for x in aqar:
        t = x.get("unit_type","?")
        types[t] = types.get(t,0)+1
    print("  Aqarmap unit types:")
    for t,c in sorted(types.items(), key=lambda x:-x[1]):
        print(f"    {t}: {c}")
    currs = {}
    for x in tekce:
        c = x.get("currency","?")
        currs[c] = currs.get(c,0)+1
    print("  TEKCE by location:")
    for c,n in sorted(currs.items(), key=lambda x:-x[1]):
        label = {"USD":"Turkey","AED":"Dubai","EUR":"Spain"}.get(c,c)
        print(f"    {label} ({c}): {n}")
    print(f"{'='*55}")

if __name__ == "__main__":
    print("=== Aqarmap Direct Scraper v2 ===\n")
    existing_ids = get_existing_ids()

    # STEP 1: Collect listing URLs
    print("\n--- STEP 1: Collecting listing URLs from search pages ---")
    listings = collect_listing_urls(existing_ids)
    print(f"\n[STEP 1 DONE] Found {len(listings)} new listings to scrape\n")

    if not listings:
        print("[WARN] No new listings found. All already in DB or site blocked.")
        print_stats()
        sys.exit(0)

    # STEP 2: Scrape each listing
    print(f"--- STEP 2: Scraping {len(listings)} listing pages ---")
    rows = []
    ok = 0
    skip = 0

    for i, (lid, url) in enumerate(listings):
        prop = scrape_listing(lid, url)
        if prop:
            rows.append(prop)
            ok += 1
            p = prop['total_price']
            print(f"  [{i+1}] OK: {prop['title'][:55]} | EGP {p:,.0f} | {len(prop['images'])} imgs")
        else:
            skip += 1
            print(f"  [{i+1}] SKIP: {url[:70]}")

        # Upsert every 20
        if len(rows) >= 20:
            n = sb_upsert(rows)
            print(f"  >> Batch upserted {n}. OK={ok} SKIP={skip}")
            rows = []

        time.sleep(random.uniform(0.3, 0.7))

    if rows:
        n = sb_upsert(rows)
        print(f"  >> Final batch upserted {n}")

    print(f"\n[DONE] OK={ok} | SKIP={skip} | Total new inserted: {ok}")
    print_stats()
