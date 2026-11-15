"""Live scraper for Egyptian real estate news, NUCA land/policy updates, CBE macro news, and EGX developer disclosures.

Pulls public Arabic RSS feeds, classifies developer/ticker/category/sentiment,
upserts into Supabase `market_news_disclosures`, and saves a local JSON snapshot
at `src/lib/data/news-disclosures.json`.
"""

from __future__ import annotations

import email.utils
import json
import os
import re
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ENV_PATH = ROOT / ".env.local"
SNAPSHOT_PATH = ROOT / "src" / "lib" / "data" / "news-disclosures.json"

QUERIES = [
    ("egx_disclosure", "طلعت مصطفى OR بالم هيلز OR مدينة مصر OR إعمار مصر إفصاح البورصة نتائج أعمال"),
    ("egx_disclosure", "سوديك OR أوراسكوم للتنمية OR مصر الجديدة للإسكان البورصة المصرية"),
    ("developer_news", "ماونتن فيو OR تطوير مصر OR حسن علام OR لافيستا عقارات مصر"),
    ("nuca_policy", "هيئة المجتمعات العمرانية طرح أراضي قرار وزاري مصر"),
    ("macro_cbe", "البنك المركزي المصري سعر الفائدة التمويل العقاري شهادات"),
    ("developer_news", "العاصمة الإدارية OR العلمين الجديدة OR الساحل الشمالي OR القاهرة الجديدة عقارات"),
    ("nuca_policy", "تأخير تسليم عقارات مصر OR نزاع أراضي OR سحب أرض عقارات"),
]

DEVELOPERS = [
    (["طلعت مصطفى", "TMG", "مدينتي", "الرحاب", "نور", "ذا سباين"], "Talaat Moustafa Group (TMG)", "TMGH.CA"),
    (["بالم هيلز", "Palm Hills", "باديا"], "Palm Hills Developments", "PHDC.CA"),
    (["مدينة مصر", "تاج سيتي", "سراي"], "Madinet Masr", "MASR.CA"),
    (["إعمار مصر", "مراسي", "ميفيدا", "أب تاون"], "Emaar Misr", "EMFD.CA"),
    (["سوديك", "SODIC", "أكتوبر بلازا", "فيليت"], "SODIC", "OCDI.CA"),
    (["أوراسكوم للتنمية", "الجونة", "O West", "أو ويست"], "Orascom Development Egypt", "ORHD.CA"),
    (["مصر الجديدة للإسكان", "هليوبوليس الجديدة"], "Heliopolis Housing", "HELI.CA"),
    (["ماونتن فيو", "آي سيتي"], "Mountain View", None),
    (["تطوير مصر", "بلومفيلدز", "فوكا باي"], "Tatweer Misr", None),
    (["حسن علام", "سوان ليك"], "Hassan Allam Properties", None),
]

POSITIVE_WORDS = [
    "أرباح", "ترتفع", "نمو", "زيادة", "مبيعات", "تستهدف", "تمويل", "طرح",
    "توقيع", "شراكة", "افتتاح", "تسليم", "توسع", "توزيعات", "إطلاق", "فرصة استثمارية",
]
WARNING_WORDS = [
    "تراجع", "انخفاض", "خسائر", "نزاع", "تأخير", "تنازل", "خلو منصب",
    "إلغاء", "سحب أرض", "تحذير", "غرامة", "أزمة", "تعثر", "شكاوى",
]


def load_env() -> dict[str, str]:
    env: dict[str, str] = {}
    if ENV_PATH.exists():
        for line in ENV_PATH.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, v = line.split("=", 1)
            env[k.strip()] = v.strip().strip('"').strip("'")
    return env


def parse_pub_date(raw: str | None) -> str:
    if not raw:
        return datetime.now(timezone.utc).isoformat()
    try:
        dt = email.utils.parsedate_to_datetime(raw)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.astimezone(timezone.utc).isoformat()
    except Exception:
        return datetime.now(timezone.utc).isoformat()


def classify_item(title: str, default_category: str) -> tuple[str, str | None, str | None, str, str, list[str]]:
    dev_name: str | None = None
    ticker: str | None = None
    for keywords, name, egx in DEVELOPERS:
        if any(k.lower() in title.lower() for k in keywords):
            dev_name = name
            ticker = egx
            break

    category = default_category
    if any(w in title for w in ["البنك المركزي", "الفائدة", "التضخم", "التمويل العقاري", "شهادات"]):
        category = "macro_cbe"
    elif any(w in title for w in ["المجتمعات العمرانية", "قرار وزاري", "طرح أراضي", "سحب أرض", "تخصيص أرض"]):
        category = "nuca_policy"
    elif ticker or any(w in title for w in ["إفصاح", "البورصة", "أرباح", "نتائج أعمال", "قوائم مالية"]):
        category = "egx_disclosure"

    pos_hits = sum(1 for w in POSITIVE_WORDS if w in title)
    neg_hits = sum(1 for w in WARNING_WORDS if w in title)
    if neg_hits > pos_hits:
        sentiment = "warning"
        impact_summary = "تنبيه مهم للمشتري والمستثمر: يُنصح بمراجعة تفاصيل الخبر وشروط العقد أو موقف التسليم قبل اتخاذ قرار الشراء."
    elif pos_hits > 0:
        sentiment = "positive"
        impact_summary = "مؤشر إيجابي يدعم ثقة السوق أو الملاءة المالية والتوسعات الجارية، مما يعزز جاذبية الاستثمار."
    else:
        sentiment = "neutral"
        impact_summary = "متابعة دورية لحركة السوق والسياسات العقارية المصرية."

    tags = [category]
    if dev_name:
        tags.append(dev_name)
    if ticker:
        tags.append(ticker)
    return category, dev_name, ticker, sentiment, impact_summary, tags


def fetch_rss_items() -> list[dict]:
    seen_urls: set[str] = set()
    seen_titles: set[str] = set()
    items: list[dict] = []

    for default_cat, query in QUERIES:
        url = f"https://news.google.com/rss/search?q={urllib.parse.quote(query)}&hl=ar&gl=EG&ceid=EG:ar"
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        try:
            with urllib.request.urlopen(req, timeout=15) as resp:
                xml_bytes = resp.read()
            root = ET.fromstring(xml_bytes)
        except Exception as exc:
            print(f"[WARN] Failed query '{query}': {exc}")
            continue

        for node in root.findall("./channel/item"):
            raw_title = (node.findtext("title") or "").strip()
            link = (node.findtext("link") or "").strip()
            pub_raw = node.findtext("pubDate")
            source_el = node.find("source")
            source_name = (source_el.text.strip() if source_el is not None and source_el.text else "")

            # Google News titles often end with " - Source"
            clean_title = raw_title
            if " - " in raw_title:
                parts = raw_title.rsplit(" - ", 1)
                if not source_name:
                    source_name = parts[1].strip()
                clean_title = parts[0].strip()

            if not clean_title or not link or link in seen_urls:
                continue
            norm_title = re.sub(r"\s+", " ", clean_title).lower()
            if norm_title in seen_titles:
                continue

            seen_urls.add(link)
            seen_titles.add(norm_title)

            category, dev_name, ticker, sentiment, impact_summary, tags = classify_item(clean_title, default_cat)
            items.append({
                "title": clean_title,
                "source_name": source_name or "مصدر إخباري مصري",
                "url": link,
                "published_at": parse_pub_date(pub_raw),
                "category": category,
                "developer_name": dev_name,
                "egx_ticker": ticker,
                "impact_sentiment": sentiment,
                "impact_summary": impact_summary,
                "tags": tags,
            })

    items.sort(key=lambda x: x["published_at"], reverse=True)
    return items


def upsert_supabase(items: list[dict], env: dict[str, str]) -> int:
    supa_url = env.get("NEXT_PUBLIC_SUPABASE_URL") or os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
    supa_key = env.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not supa_url or not supa_key or not items:
        print("[WARN] Missing Supabase credentials or no items to upsert.")
        return 0

    endpoint = f"{supa_url.rstrip('/')}/rest/v1/market_news_disclosures?on_conflict=url"
    batch_size = 50
    total = 0
    for i in range(0, len(items), batch_size):
        batch = items[i : i + batch_size]
        req = urllib.request.Request(
            endpoint,
            data=json.dumps(batch, ensure_ascii=False).encode("utf-8"),
            method="POST",
            headers={
                "apikey": supa_key,
                "Authorization": f"Bearer {supa_key}",
                "Content-Type": "application/json",
                "Prefer": "resolution=merge-duplicates,return=minimal",
            },
        )
        with urllib.request.urlopen(req, timeout=20) as resp:
            if resp.status in (200, 201, 204):
                total += len(batch)
    return total


def main() -> None:
    env = load_env()
    items = fetch_rss_items()
    print(f"Scraped {len(items)} unique real estate news & EGX disclosure items.")
    SNAPSHOT_PATH.parent.mkdir(parents=True, exist_ok=True)
    SNAPSHOT_PATH.write_text(json.dumps(items, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Saved snapshot to {SNAPSHOT_PATH}")
    upserted = upsert_supabase(items, env)
    print(f"Upserted {upserted} items to Supabase market_news_disclosures.")


if __name__ == "__main__":
    main()
