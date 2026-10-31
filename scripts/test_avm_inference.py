"""Sakanybot - Automated Valuation Model (AVM) Inference Script
============================================================
Performs fast valuation inference for a given property specification:
- Fair market price & price per sqm (السعر العادل وسعر المتر)
- Estimated valuation range: quick-sale lower bound to optimistic upper bound (النطاق السعري)
- Cash-equivalent fair price (السعر الكاش المكافئ المحايد)
- Top 3 market comparable properties (أقرب 3 صفقات ووحدات مثيلة معروضة)

Usage:
  python scripts/test_avm_inference.py
  python scripts/test_avm_inference.py --area 150 --bedrooms 3 --location "التجمع الخامس" --finishing "تشطيب كامل" --delivery 2026
"""

import argparse
import sys
from pathlib import Path
import joblib
import numpy as np
import pandas as pd

# Windows UTF-8 stdout fix
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

# Paths
BASE_DIR = Path(__file__).resolve().parent.parent
PIPELINE_PATH = BASE_DIR / "models" / "avm_pipeline.joblib"

# Area alias mapping for Egyptian districts
AREA_ALIASES = {
    "التجمع": "القاهرة الجديدة",
    "التجمع الخامس": "القاهرة الجديدة",
    "التجمع الاول": "القاهرة الجديدة",
    "التجمع الأول": "القاهرة الجديدة",
    "القاهرة الجديدة": "القاهرة الجديدة",
    "new cairo": "القاهرة الجديدة",
    "زايد": "الشيخ زايد",
    "الشيخ زايد": "الشيخ زايد",
    "زايد الجديدة": "الشيخ زايد الجديدة",
    "الشيخ زايد الجديدة": "الشيخ زايد الجديدة",
    "اكتوبر": "مدينة السادس من أكتوبر",
    "أكتوبر": "مدينة السادس من أكتوبر",
    "6 اكتوبر": "مدينة السادس من أكتوبر",
    "6 أكتوبر": "مدينة السادس من أكتوبر",
    "مدينة السادس من أكتوبر": "مدينة السادس من أكتوبر",
    "حدائق اكتوبر": "حدائق اكتوبر (مدينة السادس من أكتوبر)",
    "حدائق أكتوبر": "حدائق اكتوبر (مدينة السادس من أكتوبر)",
    "العاصمة": "العاصمة الإدارية الجديدة",
    "العاصمة الإدارية": "العاصمة الإدارية الجديدة",
    "العاصمة الادارية": "العاصمة الإدارية الجديدة",
    "العاصمة الإدارية الجديدة": "العاصمة الإدارية الجديدة",
    "المستقبل": "مدينة المستقبل (القاهرة الجديدة)",
    "مدينة المستقبل": "مدينة المستقبل (القاهرة الجديدة)",
    "الساحل": "رأس الحكمة (الساحل الشمالي)",
    "الساحل الشمالي": "رأس الحكمة (الساحل الشمالي)",
    "راس الحكمة": "رأس الحكمة (الساحل الشمالي)",
    "رأس الحكمة": "رأس الحكمة (الساحل الشمالي)",
    "العلمين": "العلمين (الساحل الشمالي)",
    "سيدي عبد الرحمن": "سيدي عبد الرحمن (الساحل الشمالي)",
    "السخنة": "العين السخنة",
    "العين السخنة": "العين السخنة",
    "الشروق": "الشروق",
    "هيليوبوليس": "هيليوبوليس الجديدة",
    "هيليوبوليس الجديدة": "هيليوبوليس الجديدة",
}

FINISHING_ALIASES = {
    "تشطيب كامل": "تشطيب كامل سوبر لوكس",
    "سوبر لوكس": "تشطيب كامل سوبر لوكس",
    "تشطيب كامل سوبر لوكس": "تشطيب كامل سوبر لوكس",
    "الترا سوبر لوكس": "تشطيب ألترا سوبر لوكس",
    "ألترا سوبر لوكس": "تشطيب ألترا سوبر لوكس",
    "نصف تشطيب": "نصف تشطيب",
    "نص تشطيب": "نصف تشطيب",
    "المطور": "تشطيب المطور الرسمي",
    "تشطيب المطور": "تشطيب المطور الرسمي",
    "تشطيب المطور الرسمي": "تشطيب المطور الرسمي",
    "بدون تشطيب": "بدون تشطيب",
    "جاهز للسكن": "تشطيب كامل جاهز للسكن",
}


def normalize_area(area_input: str) -> str:
    cleaned = area_input.strip()
    for alias, standard in AREA_ALIASES.items():
        if alias in cleaned or cleaned in alias:
            return standard
    return cleaned


def normalize_finishing(finishing_input: str) -> str:
    cleaned = finishing_input.strip()
    for alias, standard in FINISHING_ALIASES.items():
        if alias in cleaned or cleaned in alias:
            return standard
    return "تشطيب كامل سوبر لوكس"


def predict_valuation(
    area_sqm: float = 150.0,
    bedrooms: int = 3,
    bathrooms: int = 2,
    location: str = "التجمع الخامس",
    unit_type: str = "شقة",
    finishing_type: str = "تشطيب كامل سوبر لوكس",
    installment_years: int = 7,
    delivery_year: int = 2026,
    compound_name: str = "غير محدد",
    developer_name: str = "غير محدد",
):
    if not PIPELINE_PATH.exists():
        raise FileNotFoundError(f"Pipeline artifact not found at {PIPELINE_PATH}. Run scripts/train_avm.py first.")

    pipeline = joblib.load(PIPELINE_PATH)
    models = pipeline["models"]
    preprocessors = pipeline["preprocessors"]
    encoder = preprocessors["encoder"]
    area_medians = preprocessors["area_medians"]
    default_area_median = preprocessors["default_area_median"]

    # Normalize inputs
    norm_area = normalize_area(location)
    norm_finishing = normalize_finishing(finishing_type)
    years_to_delivery = max(0, delivery_year - 2026)
    bath_to_bed_ratio = bathrooms / max(bedrooms, 1)
    is_cash = 1 if installment_years == 0 else 0
    is_immediate = 1 if years_to_delivery == 0 else 0
    is_long_installment = 1 if installment_years >= 7 else 0

    # Categorical row
    cat_df = pd.DataFrame(
        [
            {
                "unit_type": unit_type,
                "finishing_type": norm_finishing,
                "area_name": norm_area,
                "compound_name": compound_name,
                "developer_name": developer_name,
                "main_city": norm_area,
            }
        ]
    )

    encoded_cat = encoder.transform(cat_df)
    encoded_cat_df = pd.DataFrame(encoded_cat, columns=preprocessors["cat_cols"])

    # Numeric row
    num_df = pd.DataFrame(
        [
            {
                "area_sqm": area_sqm,
                "bedrooms": bedrooms,
                "bathrooms": bathrooms,
                "installment_years": installment_years,
                "years_to_delivery": years_to_delivery,
                "bath_to_bed_ratio": bath_to_bed_ratio,
                "is_cash": is_cash,
                "is_immediate": is_immediate,
                "is_long_installment": is_long_installment,
            }
        ]
    )

    X_input = pd.concat([encoded_cat_df, num_df], axis=1)

    # 1. Model Predictions: Listed Price
    pred_mid_sqm = float(models["model_mid"].predict(X_input)[0])
    pred_low_sqm = float(models["model_low"].predict(X_input)[0])
    pred_high_sqm = float(models["model_high"].predict(X_input)[0])

    # Monotonicity adjustment
    pred_low_sqm = min(pred_low_sqm, pred_mid_sqm)
    pred_high_sqm = max(pred_high_sqm, pred_mid_sqm)

    pred_mid_total = pred_mid_sqm * area_sqm
    pred_low_total = pred_low_sqm * area_sqm
    pred_high_total = pred_high_sqm * area_sqm

    # 2. Model Predictions: Cash Equivalent Price
    cash_mid_sqm = float(models["model_cash_mid"].predict(X_input)[0])
    cash_low_sqm = float(models["model_cash_low"].predict(X_input)[0])
    cash_high_sqm = float(models["model_cash_high"].predict(X_input)[0])

    cash_low_sqm = min(cash_low_sqm, cash_mid_sqm)
    cash_high_sqm = max(cash_high_sqm, cash_mid_sqm)

    cash_mid_total = cash_mid_sqm * area_sqm
    cash_low_total = cash_low_sqm * area_sqm
    cash_high_total = cash_high_sqm * area_sqm

    # 3. KNN Comparables Retrieval
    knn_dict = pipeline["knn"]
    knn_model = knn_dict["model"]
    knn_scaler = knn_dict["scaler"]
    knn_weights = knn_dict["weights"]
    knn_db = knn_dict["db"]
    knn_feature_cols = knn_dict["feature_cols"]

    area_level = area_medians.get(norm_area, default_area_median)
    q_features_df = pd.DataFrame(
        [[area_sqm, pred_mid_sqm, bedrooms, area_level]],
        columns=knn_feature_cols,
    )
    q_scaled = knn_scaler.transform(q_features_df) * knn_weights

    dists, indices = knn_model.kneighbors(q_scaled, n_neighbors=3)

    comps = []
    for rank, idx in enumerate(indices[0], 1):
        c_row = knn_db.iloc[idx]
        comps.append(
            {
                "rank": rank,
                "id": c_row["id"],
                "title": c_row["title"],
                "compound_name": c_row["compound_name"],
                "area_name": c_row["area_name"],
                "developer_name": c_row["developer_name"],
                "area_sqm": float(c_row["area_sqm"]),
                "bedrooms": int(c_row["bedrooms"]),
                "bathrooms": int(c_row["bathrooms"]),
                "price_per_sqm": float(c_row["price_per_sqm"]),
                "total_price": float(c_row["total_price"]),
                "cash_price_per_sqm": float(c_row["cash_price_per_sqm"]),
                "cash_equivalent_price": float(c_row["cash_equivalent_price"]),
                "installment_years": int(c_row["installment_years"]),
                "delivery_date": str(c_row["delivery_date"]),
                "affiliate_url": str(c_row["affiliate_url"]),
            }
        )

    return {
        "inputs": {
            "area_sqm": area_sqm,
            "bedrooms": bedrooms,
            "bathrooms": bathrooms,
            "location_raw": location,
            "location_normalized": norm_area,
            "unit_type": unit_type,
            "finishing_type": norm_finishing,
            "installment_years": installment_years,
            "delivery_year": delivery_year,
        },
        "listed_valuation": {
            "fair_price_per_sqm": round(pred_mid_sqm, 2),
            "fair_total_price": round(pred_mid_total, 2),
            "low_price_per_sqm": round(pred_low_sqm, 2),
            "low_total_price": round(pred_low_total, 2),
            "high_price_per_sqm": round(pred_high_sqm, 2),
            "high_total_price": round(pred_high_total, 2),
        },
        "cash_valuation": {
            "cash_fair_price_per_sqm": round(cash_mid_sqm, 2),
            "cash_fair_total_price": round(cash_mid_total, 2),
            "cash_low_price_per_sqm": round(cash_low_sqm, 2),
            "cash_low_total_price": round(cash_low_total, 2),
            "cash_high_price_per_sqm": round(cash_high_sqm, 2),
            "cash_high_total_price": round(cash_high_total, 2),
        },
        "comparables": comps,
    }


def main():
    parser = argparse.ArgumentParser(description="Sakanybot AVM Inference Engine")
    parser.add_argument("--area", type=float, default=150.0, help="Unit area in square meters")
    parser.add_argument("--bedrooms", type=int, default=3, help="Number of bedrooms")
    parser.add_argument("--bathrooms", type=int, default=2, help="Number of bathrooms")
    parser.add_argument("--location", type=str, default="التجمع الخامس", help="District/City name")
    parser.add_argument("--unit_type", type=str, default="شقة", help="Unit type")
    parser.add_argument("--finishing", type=str, default="تشطيب كامل سوبر لوكس", help="Finishing type")
    parser.add_argument("--installments", type=int, default=7, help="Installment years (0 for cash)")
    parser.add_argument("--delivery", type=int, default=2026, help="Delivery year (e.g. 2026 for immediate)")
    args = parser.parse_args()

    print("=" * 70)
    print("🏠 سكنى بوت - تقييم العقارات الآلي (Sakanybot AVM Inference)")
    print("=" * 70)

    result = predict_valuation(
        area_sqm=args.area,
        bedrooms=args.bedrooms,
        bathrooms=args.bathrooms,
        location=args.location,
        unit_type=args.unit_type,
        finishing_type=args.finishing,
        installment_years=args.installments,
        delivery_year=args.delivery,
    )

    inp = result["inputs"]
    lv = result["listed_valuation"]
    cv = result["cash_valuation"]
    comps = result["comparables"]

    print(f"\n📋 مواصفات الوحدة المدخلة:")
    print(f"  • النوع:        {inp['unit_type']}")
    print(f"  • المساحة:      {inp['area_sqm']} م²")
    print(f"  • الغرف:        {inp['bedrooms']} غرف نوم | {inp['bathrooms']} حمام")
    print(f"  • الموقع:       {inp['location_raw']} (المنطقة المطابقة: {inp['location_normalized']})")
    print(f"  • التشطيب:      {inp['finishing_type']}")
    print(f"  • الاستلام:     {inp['delivery_year']} ({'استلام فوري' if inp['delivery_year'] <= 2026 else f'استلام بعد {inp['delivery_year']-2026} سنوات'})")
    print(f"  • نظام الدفع:   تقسيط على {inp['installment_years']} سنوات")

    print("\n" + "-" * 70)
    print("💰 التقييم السوقي المعروض (Listed Asking Valuation):")
    print(f"  • السعر العادل التقديري:  {lv['fair_total_price']:,.0f} ج.م ({lv['fair_price_per_sqm']:,.0f} ج.م / م²)")
    print(f"  • النطاق السعري العادل:   من {lv['low_total_price']:,.0f} إلى {lv['high_total_price']:,.0f} ج.م")
    print(f"  • نطاق سعر المتر:         من {lv['low_price_per_sqm']:,.0f} إلى {lv['high_price_per_sqm']:,.0f} ج.م / م²")

    print("\n" + "-" * 70)
    print("💵 التقييم الكاش الفعلي المكافئ (Cash Deal Equivalent):")
    print(f"  • القيمة الكاش العادلة:   {cv['cash_fair_total_price']:,.0f} ج.م ({cv['cash_fair_price_per_sqm']:,.0f} ج.م / م²)")
    print(f"  • النطاق الكاش المحايد:   من {cv['cash_low_total_price']:,.0f} إلى {cv['cash_high_total_price']:,.0f} ج.م")
    print(f"  • نطاق سعر المتر كاش:     من {cv['cash_low_price_per_sqm']:,.0f} إلى {cv['cash_high_price_per_sqm']:,.0f} ج.م / م²")

    print("\n" + "=" * 70)
    print("🔍 أقرب 3 وحدات معروضة مثيلة في السوق حالياً (Market Comparables - Comps):")
    print("=" * 70)
    for c in comps:
        print(f"\n[{c['rank']}] {c['title']}")
        print(f"    • الكمبوند والمطور:  {c['compound_name']} | {c['developer_name']}")
        print(f"    • المنطقة:          {c['area_name']}")
        print(f"    • المواصفات:        {c['area_sqm']} م² | {c['bedrooms']} غرف نوم | {c['bathrooms']} حمام")
        print(f"    • السعر المعروض:    {c['total_price']:,.0f} ج.م ({c['price_per_sqm']:,.0f} ج.م/م²) - أقساط {c['installment_years']} سنوات")
        print(f"    • السعر الكاش المقدر: {c['cash_equivalent_price']:,.0f} ج.م ({c['cash_price_per_sqm']:,.0f} ج.م/م²)")
        print(f"    • تاريخ الاستلام:   {c['delivery_date']}")
        print(f"    • الرابط أو المرجع: {c['affiliate_url'] if c['affiliate_url'] else c['id']}")

    print("\n" + "=" * 70)


if __name__ == "__main__":
    main()
