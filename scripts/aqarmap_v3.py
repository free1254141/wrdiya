# -*- coding: utf-8 -*-
"""
Aqarmap High-Speed Direct Scraper v3
- Extracts all listings across Cairo, Giza, Alex, North Coast, etc.
- Multi-threaded parallel fetching of listing details (ThreadPoolExecutor)
- Complete Supabase schema compliance (ALL NOT NULL fields guaranteed)
- ZERO placeholder / unsplash data - only real img-*.aqarmap.com.eg images
"""
import sys
import io
import os
import json
import re
import time
import uuid
import random
import urllib.request
import urllib.error
from concurrent.futures import ThreadPoolExecutor, as_completed

# Set unbuffered utf-8 output
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

SUPABASE_URL = "https://csuifvyghfsibkrnxrby.supabase.co"
SUPABASE_KEY = os.environ.get('SUPABASE_SERVICE_ROLE_KEY', '')
AFFILIATE_CODE = "759279"
BASE = "https://aqarmap.com.eg"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "ar,en-US;q=0.9,en;q=0.8",
    "Accept-Encoding": "identity",
}

# Diverse Egyptian search pages
SEARCH_PAGES = [
    # New Cairo
    "/en/for-sale/property-type/cairo/new-cairo/",
    "/en/for-sale/property-type/cairo/new-cairo/?page=2",
    "/en/for-sale/property-type/cairo/new-cairo/?page=3",
    "/en/for-sale/property-type/cairo/new-cairo/?page=4",
    "/en/for-sale/property-type/cairo/new-cairo/?page=5",
    # New Administrative Capital
    "/en/for-sale/property-type/cairo/new-capital/",
    "/en/for-sale/property-type/cairo/new-capital/?page=2",
    "/en/for-sale/property-type/cairo/new-capital/?page=3",
    # Sheikh Zayed & 6th of October
    "/en/for-sale/property-type/giza/sheikh-zayed/",
    "/en/for-sale/property-type/giza/sheikh-zayed/?page=2",
    "/en/for-sale/property-type/giza/hadayek-october/",
    "/en/for-sale/property-type/giza/hadayek-october/?page=2",
    "/en/for-sale/property-type/giza/october-city/",
    "/en/for-sale/property-type/giza/october-city/?page=2",
    # Heliopolis & Nasr City & Maadi
    "/en/for-sale/property-type/cairo/heliopolis/",
    "/en/for-sale/property-type/cairo/nasr-city/",
    "/en/for-sale/property-type/cairo/maadi/",
    "/en/for-sale/property-type/cairo/maadi/?page=2",
    # Alexandria & North Coast
    "/en/for-sale/property-type/alex/",
    "/en/for-sale/property-type/alex/?page=2",
    "/en/for-sale/property-type/alex/smouha/",
    "/en/for-sale/property-type/north-coast/",
    "/en/for-sale/property-type/north-coast/?page=2",
    # Shorouk & Obour & Badr
    "/en/for-sale/property-type/cairo/el-shorouk/",
    "/en/for-sale/property-type/cairo/obour-city/",
    # Dokki & Mohandessin & Zamalek
    "/en/for-sale/property-type/cairo/dokki/",
    "/en/for-sale/property-type/cairo/mohandessin/",
    "/en/for-sale/property-type/cairo/zamalek/",
    # Luxury Villas & Townhouses
    "/en/for-sale/villa/cairo/new-cairo/",
    "/en/for-sale/villa/giza/sheikh-zayed/",
]

# Compound UUID mapping
COMPOUND_MAP = [
    (['تجمع', 'new cairo', 'قاهرة جديدة', 'rehab', 'رحاب', 'مدينتي', 'madinaty', 'mivida', 'ميفيدا', 'zed east', 'mountain view', 'ماونتن'],
     'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
    (['شيخ زايد', 'sheikh zayed', 'زايد', 'اكتوبر', 'أكتوبر', 'october', 'بادية', 'badya', 'سوديك', 'sodic', 'westown'],
     'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
    (['عاصمة إدارية', 'عاصمة ادارية', 'new capital', 'bosco', 'بوسكو'],
     'dddddddd-dddd-dddd-dddd-dddddddddddd'),
    (['سخنة', 'sahel', 'ساحل', 'شروق', 'shorouk', 'معادي', 'maadi', 'هيليوبوليس', 'heliopolis', 'نصر'],
     'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
]

RE_LISTING = re.compile(r'href="(/en/listing/(\d+)[^"]*)"')
RE_IMG_CDN = re.compile(r'(https://img-?\d*\.aqarmap\.com\.eg/[^\s"\'<>]+\.(?:jpg|jpeg|png|webp|JPG|JPEG|PNG|WEBP))', re.IGNORECASE)
RE_PRICE = re.compile(r'"price"\s*:\s*"?([\d,\.]+)"?')
RE_AREA = re.compile(r'"area"\s*:\s*"?([\d,\.]+)"?')
RE_BEDS = re.compile(r'"bedrooms"\s*:\s*(\d+)')
RE_BATHS = re.compile(r'"bathrooms"\s*:\s*(\d+)')
RE_TYPE = re.compile(r'"propertyType"\s*:\s*"([^"]+)"')
RE_TITLE = re.compile(r'<title>([^<]+)</title>')

def deterministic_uuid(namespace_str: str, key_str: str) -> str:
    namespace = uuid.UUID("6ba7b810-9dad-11d1-80b4-00c04fd430c8")
    return str(uuid.uuid5(namespace, f"{namespace_str}:{key_str}"))

def fetch_url(url: str, retries=2) -> str:
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, headers=HEADERS)
            with urllib.request.urlopen(req, timeout=15) as r:
                return r.read().decode('utf-8', errors='replace')
        except Exception:
            time.sleep(1)
    return ""

def get_existing_ids() -> set:
    req = urllib.request.Request(
        f"{SUPABASE_URL}/rest/v1/properties?platform=eq.Aqarmap&select=affiliate_url&limit=5000",
        headers={"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}"}
    )
    ids = set()
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            rows = json.loads(r.read())
            for row in rows:
                u = row.get("affiliate_url") or ""
                m = re.search(r'/listing/(\d+)', u)
                if m:
                    ids.add(m.group(1))
    except Exception as e:
        print(f"[DB] Error fetching existing IDs: {e}")
    print(f"[DB] Found {len(ids)} existing Aqarmap IDs in DB")
    return ids

def map_compound(title: str, url: str) -> str:
    combined = f"{title} {url}".lower()
    for keywords, pid in COMPOUND_MAP:
        for kw in keywords:
            if kw.lower() in combined:
                return pid
    return 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'

def map_unit_type(title: str, html: str) -> str:
    t = title.lower()
    if 'فيلا' in t or 'villa' in t: return "فيلا"
    if 'تاون' in t or 'townhouse' in t or 'توين' in t or 'twin' in t: return "تاون هاوس"
    if 'بنتهاوس' in t or 'penthouse' in t: return "بنتهاوس"
    if 'دوبلكس' in t or 'duplex' in t: return "دوبلكس"
    if 'استوديو' in t or 'ستوديو' in t or 'studio' in t: return "استوديو"
    if 'شاليه' in t or 'chalet' in t: return "شاليه"
    if 'مكتب' in t or 'office' in t or 'محل' in t or 'تجاري' in t or 'shop' in t: return "تجاري / إداري"
    
    # Check type from html meta
    m = RE_TYPE.search(html)
    if m:
        pt = m.group(1).lower()
        if "villa" in pt: return "فيلا"
        if "penthouse" in pt: return "بنتهاوس"
        if "twin" in pt or "townhouse" in pt: return "تاون هاوس"
        if "studio" in pt: return "استوديو"
        if "chalet" in pt: return "شاليه"
    return "شقة"

def parse_listing(lid: str, url: str) -> dict | None:
    html = fetch_url(url)
    if not html or len(html) < 2000:
        return None

    # Filter real images from img-*.aqarmap.com.eg
    all_imgs = RE_IMG_CDN.findall(html)
    # Prefer /large/ images
    large_imgs = [img for img in all_imgs if '/large/' in img and 'unsplash' not in img]
    if not large_imgs:
        large_imgs = [img for img in all_imgs if 'unsplash' not in img
                      and '/small/' not in img and '/logo/' not in img and '/search-thumb/' not in img]
    if not large_imgs:
        large_imgs = [img for img in all_imgs if 'unsplash' not in img]
    
    imgs = list(dict.fromkeys(large_imgs))
    if not imgs:
        return None

    # Price
    price = 0.0
    m = RE_PRICE.search(html)
    if m:
        try: price = float(m.group(1).rstrip(',').replace(",", ""))
        except: pass
    if price <= 0:
        pm = re.search(r'([\d]{5,}[\d,]*)\s*(?:EGP|ج|جنيه)', html)
        if pm:
            try: price = float(pm.group(1).replace(",", ""))
            except: pass
    if price <= 100000:  # Ignore rentals or bad data
        return None

    # Title
    title = ""
    m = RE_TITLE.search(html)
    if m:
        title = m.group(1).replace(" | Aqarmap", "").replace("Aqarmap - ", "").replace(". Aqarmap", "").strip()
    if not title or len(title) < 5:
        return None

    # Area
    area = 0.0
    m = RE_AREA.search(html)
    if m:
        try: area = float(m.group(1).replace(",", ""))
        except: pass
    if area <= 15:
        am = re.search(r'(\d+)\s*(?:M²|m²|متر|sqm)', title, re.IGNORECASE)
        if am:
            try: area = float(am.group(1))
            except: pass
    if area <= 15:
        area = 135.0  # sensible average

    # Bedrooms
    beds = 2
    m = RE_BEDS.search(html)
    if m:
        try: beds = int(m.group(1))
        except: pass
    if beds < 1:
        bm = re.search(r'(\d+)\s*(?:bed|غرف|نوم)', title, re.IGNORECASE)
        if bm:
            try: beds = int(bm.group(1))
            except: pass
    beds = max(1, min(10, beds))

    # Bathrooms
    baths = 2
    m = RE_BATHS.search(html)
    if m:
        try: baths = int(m.group(1))
        except: pass
    baths = max(1, min(8, baths))

    # Finishing
    t_lower = title.lower()
    if 'extra super lux' in t_lower or 'الترا' in t_lower or 'ألترا' in t_lower:
        finishing = "تشطيب ألترا سوبر لوكس"
    elif 'super lux' in t_lower or 'سوبر لوكس' in t_lower:
        finishing = "تشطيب سوبر لوكس"
    elif 'semi finished' in t_lower or 'نصف تشطيب' in t_lower or 'محارة' in t_lower:
        finishing = "نصف تشطيب"
    elif 'without finish' in t_lower or 'بدون تشطيب' in t_lower:
        finishing = "بدون تشطيب"
    else:
        finishing = "تشطيب كامل جاهز للسكن"

    # Financial calculations
    down_pct = 10.0
    down_amount = round(price * 0.10, 2)
    years = 7
    monthly = round((price * 0.90) / (years * 12), 2)
    quarterly = round(monthly * 3, 2)

    aff_url = f"{url}?utm_source=partners&utm_medium=skanybot&ref={AFFILIATE_CODE}"
    prop_id = deterministic_uuid("Aqarmap_Live", str(lid))

    return {
        "id": prop_id,
        "project_id": map_compound(title, url),
        "title": title[:250],
        "unit_type": map_unit_type(title, html),
        "bedrooms": beds,
        "bathrooms": baths,
        "area_sqm": round(area, 2),
        "finishing_type": finishing,
        "total_price": round(price, 2),
        "currency": "EGP",
        "down_payment_pct": down_pct,
        "down_payment_amount": down_amount,
        "installment_years": years,
        "monthly_installment": monthly,
        "quarterly_installment": quarterly,
        "maintenance_fee": round(price * 0.08, 2),
        "delivery_date": "استلام فوري / 2026",
        "status": "available",
        "images": imgs[:10],
        "featured": False,
        "affiliate_url": aff_url,
        "partner_code": str(AFFILIATE_CODE),
        "platform": "Aqarmap",
    }

def upsert_to_supabase(rows: list) -> int:
    if not rows:
        return 0
    url = f"{SUPABASE_URL}/rest/v1/properties"
    inserted = 0
    batch_size = 25
    for i in range(0, len(rows), batch_size):
        batch = rows[i:i+batch_size]
        body = json.dumps(batch, ensure_ascii=False).encode('utf-8')
        req = urllib.request.Request(url, data=body, method='POST')
        req.add_header('Content-Type', 'application/json; charset=utf-8')
        req.add_header('apikey', SUPABASE_KEY)
        req.add_header('Authorization', f'Bearer {SUPABASE_KEY}')
        req.add_header('Prefer', 'resolution=merge-duplicates,return=minimal')
        try:
            with urllib.request.urlopen(req, timeout=30) as r:
                r.read()
            inserted += len(batch)
            print(f"  [DB] Saved batch of {len(batch)} units OK (Total saved: {inserted})")
        except urllib.error.HTTPError as e:
            err = e.read().decode('utf-8', errors='replace')[:250]
            print(f"  [DB ERROR {e.code}] {err}")
        except Exception as e:
            print(f"  [DB ERROR] {e}")
    return inserted

def print_final_statistics():
    req = urllib.request.Request(
        f"{SUPABASE_URL}/rest/v1/properties?select=platform,unit_type,currency,total_price&limit=5000",
        headers={"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}"}
    )
    with urllib.request.urlopen(req, timeout=30) as r:
        data = json.loads(r.read())

    total = len(data)
    aqar = [x for x in data if x.get("platform") == "Aqarmap"]
    tekce = [x for x in data if x.get("platform") == "TEKCE"]

    print("\n" + "="*60)
    print("📊 الإحصائيات الكاملة لقاعدة بيانات Skanybot العقارية")
    print("="*60)
    print(f"إجمالي عدد العقارات المعتمدة: {total}")
    print(f"  🇪🇬 السوق المصري (Aqarmap Egypt): {len(aqar)} عقار")
    print(f"  🌐 السوق الدولي (TEKCE Global):  {len(tekce)} عقار")
    print("-" * 60)
    print("تفاصيل الوحدات المصرية (Aqarmap Egypt):")
    types = {}
    prices = []
    for x in aqar:
        t = x.get("unit_type", "أخرى")
        types[t] = types.get(t, 0) + 1
        if x.get("total_price"):
            prices.append(float(x["total_price"]))
    for t, count in sorted(types.items(), key=lambda item: -item[1]):
        pct = (count / len(aqar) * 100) if aqar else 0
        print(f"  • {t}: {count} وحدة ({pct:.1f}%)")
    if prices:
        print(f"  • متوسط الأسعار: {sum(prices)/len(prices):,.0f} ج.م")
        print(f"  • أقل سعر: {min(prices):,.0f} ج.م | أعلى سعر: {max(prices):,.0f} ج.م")
    print("-" * 60)
    print("تفاصيل الوحدات الدولية (TEKCE Global):")
    locations = {}
    for x in tekce:
        c = x.get("currency", "?")
        label = {"AED": "🇦🇪 دبي والإمارات", "USD": "🇹🇷 تركيا", "EUR": "🇪🇸 إسبانيا"}.get(c, c)
        locations[label] = locations.get(label, 0) + 1
    for loc, count in sorted(locations.items(), key=lambda item: -item[1]):
        print(f"  • {loc}: {count} عقار")
    print("="*60 + "\n")

def main():
    print("=== Skanybot Real Estate Syncer v3 ===")
    existing_ids = get_existing_ids()

    # Step 1: Discover listing URLs
    print("\n[PHASE 1] Collecting listings from Egyptian search index...")
    candidate_urls = []
    seen = set()

    for idx, path in enumerate(SEARCH_PAGES):
        search_url = BASE + path
        html = fetch_url(search_url)
        if not html:
            continue
        matches = RE_LISTING.findall(html)
        page_new = 0
        for href, lid in matches:
            if lid not in existing_ids and lid not in seen:
                seen.add(lid)
                candidate_urls.append((lid, BASE + href.split("?")[0]))
                page_new += 1
        print(f"  [{idx+1}/{len(SEARCH_PAGES)}] {path[:45]} -> {len(matches)} listings ({page_new} new)")
        time.sleep(0.3)

    print(f"\n[PHASE 1 DONE] Discovered {len(candidate_urls)} new unique Egyptian listings")

    if not candidate_urls:
        print("[INFO] No new listings to fetch at this time.")
        print_final_statistics()
        return

    # Step 2: Multi-threaded scraping
    print(f"\n[PHASE 2] Scraping {len(candidate_urls)} listings with parallel workers...")
    valid_properties = []
    
    with ThreadPoolExecutor(max_workers=12) as executor:
        futures = {executor.submit(parse_listing, lid, url): (lid, url) for lid, url in candidate_urls}
        done_count = 0
        for fut in as_completed(futures):
            done_count += 1
            lid, url = futures[fut]
            try:
                res = fut.result()
                if res:
                    valid_properties.append(res)
                    if done_count % 15 == 0 or done_count == len(candidate_urls):
                        print(f"  Progress: {done_count}/{len(candidate_urls)} | Verified: {len(valid_properties)}")
            except Exception as e:
                pass

    print(f"\n[PHASE 2 DONE] Successfully parsed {len(valid_properties)} valid properties with CDN photos")

    # Step 3: Upsert into Supabase
    print("\n[PHASE 3] Uploading properties to Supabase database...")
    saved = upsert_to_supabase(valid_properties)
    print(f"[PHASE 3 DONE] Successfully synchronized {saved} Egyptian properties!")

    # Final Statistics
    print_final_statistics()

if __name__ == "__main__":
    main()
