#!/usr/bin/env python3
"""
Real Estate Broker AI - Auto Data Sync Script
Syncs properties from Aqarmap (Apify API / Expo) and TEKCE (XML Feed)
Auto-injects affiliate tracking codes:
- Aqarmap Partner Code: 759279
- TEKCE Partner Code: 6FPC68983C
"""

import json
import os
import urllib.request
import xml.etree.ElementTree as ET
from urllib.parse import urlparse, parse_qs, urlencode, urlunparse

AQARMAP_PARTNER_PARAMS = {
    "utm_source": "partners",
    "utm_medium": "dynamic",
    "utm_campaign": "affiliate_759279",
    "partner_code": "759279"
}

TEKCE_AFFILIATE_PARAMS = {
    "utm_source": "taff",
    "utm_medium": "6FPC68983C"
}

def attach_affiliate_params(url: str, params: dict) -> str:
    """إضافة كود الأفلييت لأي رابط عقار بشكل آمن وصحيح"""
    if not url:
        return ""
    parsed = urlparse(url)
    query_dict = parse_qs(parsed.query)
    for k, v in params.items():
        query_dict[k] = [v]
    new_query = urlencode(query_dict, doseq=True)
    return urlunparse((parsed.scheme, parsed.netloc, parsed.path, parsed.params, new_query, parsed.fragment))

def fetch_aqarmap_from_apify(apify_token: str) -> list:
    """سحب أحدث العقارات من Aqarmap عبر Apify API وإرفاق كود 759279"""
    if not apify_token or apify_token == "YOUR_APIFY_API_TOKEN":
        print("ℹ️ لم يتم تحديد Apify Token، استخدام الوحدات المعتمدة المحفوظة.")
        return []
        
    api_url = f"https://api.apify.com/v2/acts/parseforge~aqarmap-egypt-scraper/runs/last/dataset/items?token={apify_token}"
    properties = []
    try:
        with urllib.request.urlopen(api_url, timeout=30) as response:
            raw_items = json.loads(response.read().decode("utf-8"))
            for item in raw_items:
                raw_url = item.get("url", "https://launches.aqarmap.com/ar/expos/saudi-projects")
                affiliate_url = attach_affiliate_params(raw_url, AQARMAP_PARTNER_PARAMS)
                properties.append({
                    "platform": "Aqarmap",
                    "title": item.get("title"),
                    "country": "مصر",
                    "location": item.get("location") or item.get("city"),
                    "price": item.get("price"),
                    "currency": "EGP",
                    "area_sqm": item.get("area"),
                    "rooms": item.get("rooms"),
                    "partner_code": "759279",
                    "affiliate_url": affiliate_url
                })
    except Exception as e:
        print(f"Aqarmap sync warning: {e}")
    return properties

def fetch_tekce_from_xml(xml_feed_url: str) -> list:
    """سحب العقارات الدولية من ملف XML الخاص بـ TEKCE وإرفاق كود 6FPC68983C"""
    if not xml_feed_url or xml_feed_url == "YOUR_MYTEKCE_XML_FEED_URL":
        print("ℹ️ لم يتم تحديد رابط TEKCE XML Feed، استخدام الوحدات المعتمدة المحفوظة.")
        return []

    properties = []
    try:
        with urllib.request.urlopen(xml_feed_url, timeout=30) as response:
            tree = ET.parse(response)
            root = tree.getroot()
            for prop in root.findall(".//property"):
                raw_url = prop.findtext("url") or "https://tekce.com"
                affiliate_url = attach_affiliate_params(raw_url, TEKCE_AFFILIATE_PARAMS)
                properties.append({
                    "platform": "TEKCE",
                    "title": prop.findtext("title"),
                    "country": prop.findtext("country"),
                    "city": prop.findtext("city"),
                    "price": prop.findtext("price"),
                    "currency": prop.findtext("currency") or "USD",
                    "affiliate_code": "6FPC68983C",
                    "affiliate_url": affiliate_url
                })
    except Exception as e:
        print(f"TEKCE XML sync warning: {e}")
    return properties

def sync_to_supabase(properties: list):
    """حفظ وتحديث البيانات مباشرة في جدول properties بسوبابيز"""
    supabase_url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "https://csuifvyghfsibkrnxrby.supabase.co")
    supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
    
    if not supabase_key:
        print("⚠️ SUPABASE_SERVICE_ROLE_KEY غير موجود في متغيرات البيئة.")
        return

    # In production, batches are upserted via Supabase REST API
    print(f"✅ جاهز للمزامنة مع سوبابيز ({len(properties)} وحدة)")

if __name__ == "__main__":
    APIFY_TOKEN = os.environ.get("APIFY_API_TOKEN", "YOUR_APIFY_API_TOKEN")
    TEKCE_XML_URL = os.environ.get("TEKCE_XML_FEED_URL", "YOUR_MYTEKCE_XML_FEED_URL")

    knowledge_base = {
        "default_links": {
            "aqarmap_expo": "https://launches.aqarmap.com/ar/expos/saudi-projects?utm_source=partners&utm_medium=dynamic&utm_campaign=affiliate_759279&partner_code=759279",
            "tekce_home": "https://tekce.com?utm_source=taff&utm_medium=6FPC68983C"
        },
        "partner_codes": {
            "aqarmap": "759279",
            "tekce": "6FPC68983C"
        },
        "properties": []
    }

    # سحب وتحديث البيانات
    aqarmap_props = fetch_aqarmap_from_apify(APIFY_TOKEN)
    tekce_props = fetch_tekce_from_xml(TEKCE_XML_URL)

    knowledge_base["properties"].extend(aqarmap_props)
    knowledge_base["properties"].extend(tekce_props)

    # حفظ محلي
    with open("knowledge_base.json", "w", encoding="utf-8") as f:
        json.dump(knowledge_base, f, ensure_ascii=False, indent=2)

    print("✅ تم حفظ وتحديث قاعدة بيانات الشات بوت وروابط الأفلييت بنجاح في knowledge_base.json!")
