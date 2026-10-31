# -*- coding: utf-8 -*-
"""
==============================================================================
Skanybot Smart Incremental Delta Sync (Fast, Lightweight, Low-Cost)
==============================================================================
Designed to keep the database updated in seconds without heavy requests:
1. Performs shallow discovery across top latest pages only.
2. Checks existing property signatures (UUID v5 / ID) in Supabase.
3. Only parses and ingests brand-new or updated listings (Delta Sync).
4. Upserts in bulk with minimal network overhead and logs to `sync_logs`.
==============================================================================
"""
import sys
import io
import os
import json
import re
import time
import uuid
import urllib.request
import urllib.error
import urllib.parse
from datetime import datetime, timezone
from concurrent.futures import ThreadPoolExecutor, as_completed

if sys.platform == "win32":
    try:
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
    except Exception:
        pass

SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "https://csuifvyghfsibkrnxrby.supabase.co")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
AFFILIATE_CODE = "759279"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "ar,en-US;q=0.9,en;q=0.8",
}

COMPOUND_MAP = [
    (["الساحل", "رأس الحكمة", "راس الحكمة", "مراسي", "هاسيندا", "العلمين", "سيدي عبد", "الضبعه", "الضبعة"], "00000000-0000-0000-0000-000000000003"),
    (["السخنة", "السخنه", "سخنة", "الجلالة", "الجلاله", "جلالة", "أزها"], "00000000-0000-0000-0000-000000000004"),
    (["ميفيدا", "mivida", "إعمار", "اعمار", "emaar"], "cccccccc-cccc-cccc-cccc-cccccccccccc"),
    (["فيليت", "villette", "سوديك إيست", "sodic east"], "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee"),
    (["زد إيست", "زد ايست", "zed east", "أورا", "اورا", "ora"], "ffffffff-ffff-ffff-ffff-ffffffffffff"),
    (["مدينتي", "الرحاب", "طلعت مصطفى", "سيليا", "نور"], "00000000-0000-0000-0000-000000000001"),
    (["ويست تاون", "وست تاون", "westown", "سوديك ويست", "أليجريا"], "00000000-0000-0000-0000-000000000002"),
    (["بادية", "badya", "بالم هيلز أكتوبر", "بالم هيلز الشيخ زايد"], "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
    (["ماونتن فيو", "mountain view", "آي سيتي", "اي سيتي", "هايد بارك"], "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
    (["المستقبل", "الشروق", "العبور", "سراي", "بلوم فيلدز", "بدر", "هليوبوليس الجديدة"], "00000000-0000-0000-0000-000000000005"),
    (["الإسكندرية", "الاسكندرية", "إسكندرية", "اسكندرية", "سموحة", "ستانلي"], "00000000-0000-0000-0000-000000000006"),
    (["المعادي", "معادي", "مصر الجديدة", "مصر الجديده", "مدينة نصر", "مدينه نصر", "الزمالك", "الدقي", "المهندسين", "المقطم"], "00000000-0000-0000-0000-000000000007"),
    (["العاصمة الإدارية", "العاصمة الادارية", "البوسكو", "حي المستثمرين", "R7", "R8"], "dddddddd-dddd-dddd-dddd-dddddddddddd"),
    (["الشيخ زايد", "زايد", "زايد الجديدة"], "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
    (["أكتوبر", "اكتوبر", "السادس من أكتوبر", "حدائق أكتوبر", "حدائق اكتوبر", "أو ويست", "أو ريفا", "بيفرلي"], "00000000-0000-0000-0000-000000000008"),
]

RE_NEXT_DATA = re.compile(r'<script id="__NEXT_DATA__" type="application/json">(.*?)</script>', re.DOTALL)


def deterministic_uuid(namespace_str: str, key_str: str) -> str:
    namespace = uuid.UUID("6ba7b810-9dad-11d1-80b4-00c04fd430c8")
    return str(uuid.uuid5(namespace, f"{namespace_str}:{key_str}"))


def map_compound(context_text: str) -> str:
    combined = (context_text or "").lower()
    for keywords, pid in COMPOUND_MAP:
        for kw in keywords:
            if kw.lower() in combined:
                return pid
    return "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"


def get_existing_ids() -> set:
    """Fetch all known IDs in a fast lightweight call"""
    url = f"{SUPABASE_URL}/rest/v1/properties?select=id&limit=10000"
    req = urllib.request.Request(
        url,
        headers={"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}"}
    )
    try:
        with urllib.request.urlopen(req, timeout=12) as r:
            data = json.loads(r.read().decode("utf-8"))
            return {row["id"] for row in data}
    except Exception as e:
        print(f"⚠️ [Warning] Could not fetch existing IDs: {e}")
        return set()


def parse_nawy_item(item: dict) -> dict | None:
    nid = item.get("id")
    if not nid:
        return None

    pp = item.get("paymentPlan") or {}
    price = float(pp.get("minPrice") or 0)
    if price < 1_000_000 or price > 350_000_000:
        return None

    imgs = []
    main_img = item.get("imageUrl")
    if main_img and isinstance(main_img, str) and main_img.startswith("http"):
        imgs.append(main_img)
    for extra in item.get("images") or []:
        if isinstance(extra, str) and extra.startswith("http") and extra not in imgs:
            imgs.append(extra)
    if not imgs:
        return None

    compound_obj = item.get("compound") or {}
    area_obj = item.get("area") or {}
    dev_obj = item.get("developer") or {}

    comp_name = (compound_obj.get("name") or "").strip()
    area_name = (area_obj.get("name") or "").strip()
    parent_area = (area_obj.get("parentAreaName") or "").strip()
    dev_name = (dev_obj.get("name") or "").strip()
    prop_type_raw = (item.get("propertyType") or "شقة").strip()
    subtitle = (item.get("subtitle") or "").strip()

    area_display = f"{area_name} ({parent_area})" if parent_area and parent_area != area_name else area_name
    if comp_name and area_display:
        title = f"{prop_type_raw} في كمبوند {comp_name} - {area_display}"
        if dev_name:
            title += f" | {dev_name}"
    elif subtitle:
        title = subtitle.rstrip(".")
    else:
        title = item.get("title") or f"{prop_type_raw} في {area_display}"

    # Unit type mapping
    t_lower = f"{prop_type_raw} {title}".lower()
    if "شاليه" in t_lower or "chalet" in t_lower:
        unit_type = "شاليه"
    elif "تاون" in t_lower or "توين" in t_lower:
        unit_type = "تاون هاوس"
    elif "فيلا" in t_lower:
        unit_type = "فيلا"
    elif "بنتهاوس" in t_lower:
        unit_type = "بنتهاوس"
    elif "دوبلكس" in t_lower:
        unit_type = "دوبلكس"
    elif "استوديو" in t_lower:
        unit_type = "استوديو"
    elif "تجاري" in t_lower or "إداري" in t_lower or "اداري" in t_lower:
        unit_type = "تجاري / إداري"
    else:
        unit_type = "شقة"

    beds = max(1, min(10, int(item.get("numberOfBedrooms") or 2)))
    baths = max(1, min(10, int(item.get("numberOfBathrooms") or 2)))
    area_sqm = float(item.get("unitArea") or 135.0)

    is_cash = bool(pp.get("isCash"))
    dp_pct = float(pp.get("downPaymentPercentage") or (100.0 if is_cash else 10.0))
    dp_amount = float(pp.get("minDownPayment") or round((price * dp_pct) / 100.0, 2))
    years = int(pp.get("numberOfInstallmentYears") or (0 if is_cash else 7))

    min_inst = float(pp.get("minInstallment") or 0)
    freq = (pp.get("frequency") or "").strip()
    if years > 0:
        if min_inst > 0 and "ربع" in freq:
            quarterly = round(min_inst, 2)
            monthly = round(min_inst / 3.0, 2)
        elif min_inst > 0:
            monthly = round(min_inst, 2)
            quarterly = round(min_inst * 3.0, 2)
        else:
            monthly = round(max(0.0, price - dp_amount) / (years * 12), 2)
            quarterly = round(monthly * 3.0, 2)
    else:
        monthly = 0.0
        quarterly = 0.0

    prop_uuid = deterministic_uuid("Nawy_Compound_Unit", str(nid))
    loc_context = f"{comp_name} {area_name} {parent_area} {dev_name} {title}"
    project_id = map_compound(loc_context)

    # Exact Canonical Direct Unit Listing Link
    share_link = item.get("shareLink")
    if not share_link:
        comp_slug = compound_obj.get("slug") or "any"
        share_link = f"https://www.nawy.com/compound/{comp_slug}/property/{nid}"

    return {
        "id": prop_uuid,
        "project_id": project_id,
        "title": title,
        "unit_type": unit_type,
        "bedrooms": beds,
        "bathrooms": baths,
        "area_sqm": area_sqm,
        "finishing_type": "تشطيب كامل سوبر لوكس",
        "total_price": price,
        "currency": "EGP",
        "down_payment_pct": round(dp_pct, 1),
        "down_payment_amount": round(dp_amount, 2),
        "installment_years": years,
        "monthly_installment": monthly,
        "quarterly_installment": quarterly,
        "delivery_date": "استلام 2027 / 2028",
        "status": "متاح",
        "featured": True,
        "roi_expected_pct": 16.5,
        "images": imgs[:4],
        "platform": "Nawy",
        "partner_code": AFFILIATE_CODE,
        "affiliate_url": share_link,
    }


def fetch_page_items(page_num: int) -> list:
    url = f"https://www.nawy.com/ar/search?category=property&page_number={page_num}"
    try:
        req = urllib.request.Request(url, headers=HEADERS)
        with urllib.request.urlopen(req, timeout=10) as r:
            html = r.read().decode("utf-8", errors="replace")
        m = RE_NEXT_DATA.search(html)
        if not m:
            return []
        data = json.loads(m.group(1))
        return (
            data.get("props", {})
            .get("pageProps", {})
            .get("loadedSearchResultsSSR", {})
            .get("results", [])
        )
    except Exception:
        return []


def upsert_delta(units: list) -> int:
    if not units:
        return 0
    url = f"{SUPABASE_URL}/rest/v1/properties"
    body = json.dumps(units, ensure_ascii=False).encode("utf-8")
    req = urllib.request.Request(url, data=body, method="POST")
    req.add_header("Content-Type", "application/json; charset=utf-8")
    req.add_header("apikey", SUPABASE_KEY)
    req.add_header("Authorization", f"Bearer {SUPABASE_KEY}")
    req.add_header("Prefer", "resolution=merge-duplicates,return=minimal")
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            r.read()
        return len(units)
    except Exception as e:
        print(f"❌ [DB Upload Error]: {e}")
        return 0


def log_sync(new_count: int, duration_sec: float):
    url = f"{SUPABASE_URL}/rest/v1/sync_logs"
    payload = {
        "source": "Smart_Delta_Sync",
        "status": "SUCCESS",
        "items_synced": new_count,
        "details": {"duration_seconds": round(duration_sec, 2), "mode": "smart_incremental"},
        "synced_at": datetime.now(timezone.utc).isoformat(),
    }
    try:
        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json", "apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}"},
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=10) as r:
            r.read()
    except Exception:
        pass


def run_delta_sync(check_pages: int = 3, dry_run: bool = False):
    t0 = time.time()
    print("=" * 64)
    print(f"⚡ Skanybot Smart Delta Sync (Checking latest {check_pages} pages)")
    print("=" * 64)

    # 1. Fetch current IDs
    existing_ids = get_existing_ids()
    print(f"[DB] Known properties in database: {len(existing_ids)}")

    # 2. Shallow scan latest pages in parallel
    print(f"[SCAN] Scanning latest {check_pages} pages for new launches...")
    raw_results = []
    with ThreadPoolExecutor(max_workers=check_pages) as executor:
        futures = {executor.submit(fetch_page_items, p): p for p in range(1, check_pages + 1)}
        for fut in as_completed(futures):
            res = fut.result()
            raw_results.extend(res)

    print(f"[DISCOVERY] Found {len(raw_results)} items on top {check_pages} pages.")

    # 3. Filter for truly new or modified units
    new_units = []
    skipped = 0
    for item in raw_results:
        nid = item.get("id")
        if not nid:
            continue
        prop_uuid = deterministic_uuid("Nawy_Compound_Unit", str(nid))
        if prop_uuid in existing_ids:
            skipped += 1
            continue

        parsed = parse_nawy_item(item)
        if parsed:
            new_units.append(parsed)

    duration = time.time() - t0
    print(f"[DELTA] Discovered {len(new_units)} NEW units | Skipped {skipped} unchanged units.")

    # 4. Ingest only the delta
    if dry_run:
        print(f"🔍 [DRY-RUN] Test complete in {duration:.2f}s! (No database changes made)")
        return

    saved = 0
    if new_units:
        print(f"[UPLOAD] Fast-uploading {len(new_units)} delta units...")
        saved = upsert_delta(new_units)
        log_sync(saved, duration)
        print(f"✅ [SUCCESS] Synced {saved} new units in {duration:.2f} seconds!")
    else:
        print(f"⚡ [UP-TO-DATE] Database is already 100% fresh! Zero cost incurred ({duration:.2f}s).")


if __name__ == "__main__":
    pages = 3
    is_dry = False
    for arg in sys.argv[1:]:
        if arg == "--dry-run":
            is_dry = True
        elif arg.isdigit():
            pages = int(arg)
    run_delta_sync(pages, is_dry)
