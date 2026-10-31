"""Sakanybot - Automated Valuation Model (AVM) Data Preparation Script
=====================================================================
Fetches all property listings from Supabase, cleans and normalizes features,
extracts developer/compound/area entities, computes price per sqm, and
calculates the 'Cash Equivalent Price' based on installment duration and negotiation margins.
Saves the cleaned dataset to `data/avm_properties_clean.csv`.
"""

import os
import re
import sys
from pathlib import Path
import pandas as pd
import numpy as np
from dotenv import load_dotenv
from supabase import create_client

# Force utf-8 output for console printing in Windows
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

# Paths
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(exist_ok=True)
OUTPUT_CSV = DATA_DIR / "avm_properties_clean.csv"
ENV_FILE = BASE_DIR / ".env.local"


def load_supabase_client():
    """Load Supabase client using credentials from .env.local."""
    if not ENV_FILE.exists():
        raise FileNotFoundError(f"Configuration file {ENV_FILE} not found.")

    load_dotenv(ENV_FILE)
    supabase_url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")

    if not supabase_url or not supabase_key:
        raise ValueError("Missing Supabase URL or Service Role / Anon key in .env.local")

    print(f"Connecting to Supabase at: {supabase_url[:35]}...")
    return create_client(supabase_url, supabase_key)


def fetch_all_properties(supabase, page_size: int = 1000) -> pd.DataFrame:
    """Fetch all rows from 'properties' table handling Supabase pagination limits."""
    print("Fetching properties from Supabase with pagination...")
    all_rows = []
    start = 0

    while True:
        end = start + page_size - 1
        response = (
            supabase.table("properties")
            .select(
                "id, project_id, title, unit_type, bedrooms, bathrooms, "
                "area_sqm, finishing_type, total_price, currency, down_payment_pct, "
                "down_payment_amount, installment_years, monthly_installment, "
                "quarterly_installment, maintenance_fee, delivery_date, status, "
                "featured, roi_expected_pct, created_at, affiliate_url, platform"
            )
            .range(start, end)
            .execute()
        )

        batch = response.data
        if not batch:
            break

        all_rows.extend(batch)
        print(f"  -> Fetched records {start} to {start + len(batch) - 1} (Total so far: {len(all_rows)})")

        if len(batch) < page_size:
            break

        start += page_size

    df = pd.DataFrame(all_rows)
    print(f"Total raw records fetched: {len(df)}")
    return df


def parse_title(title: str):
    """
    Extract compound_name, area_name, and developer_name from the property title.
    Expected pattern: [Unit Type] في كمبوند [Compound] - [Area] | [Developer]
    """
    raw_title = str(title).strip()
    developer = "غير محدد"
    compound = "غير محدد"
    area = "غير محدد"

    # 1. Developer separation by '|'
    if "|" in raw_title:
        parts = raw_title.split("|")
        developer = parts[-1].strip()
        main_part = "|".join(parts[:-1]).strip()
    else:
        main_part = raw_title

    # 2. Compound and Area separation by '-'
    if "-" in main_part:
        dash_parts = main_part.split("-")
        area = dash_parts[-1].strip()
        compound = "-".join(dash_parts[:-1]).strip()
    else:
        compound = main_part
        # Fallback heuristic for known locations
        if "السويس" in main_part:
            area = "السويس"
        elif "الشيخ زايد" in main_part:
            area = "الشيخ زايد"
        elif "مدينة نصر" in main_part or "مدينه نصر" in main_part:
            area = "مدينة نصر"
        elif "فيصل" in main_part:
            area = "فيصل"
        elif "القاهرة الجديدة" in main_part or "التجمع" in main_part:
            area = "القاهرة الجديدة"
        elif "المعادي" in main_part:
            area = "المعادي"
        elif "الشروق" in main_part:
            area = "الشروق"
        else:
            area = "أخرى"

    # 3. Clean compound prefix
    compound_clean = re.sub(
        r"^(شقة|فيلا|تاون هاوس|شاليه|دوبلكس|استوديو|بنتهاوس|تجاري / إداري|وحدة|مكتب|محل|منزل|قطعة أرض|أرض زراعية|أرض|مزرعة)\s*(للبيع\s*)?(في\s*)?(كمبوند\s*|مشروع\s*)?",
        "",
        compound,
    ).strip()

    if not compound_clean:
        compound_clean = compound if compound else "غير محدد"

    # 4. Extract primary city/governorate if area contains parentheses
    main_city = area
    parenthesis_match = re.search(r"\((.*?)\)", area)
    if parenthesis_match:
        main_city = parenthesis_match.group(1).strip()

    return pd.Series([compound_clean, area, developer, main_city])


def calculate_cash_discount_rate(years: float) -> float:
    """
    Computes market financing inflation & time-value-of-money discount:
    - 0 years (Cash): 0%
    - 1-5 years: 5% per year (up to 25% at 5 years)
    - 6-10 years: 25% + 3% per year (reaching 40% at 10 years)
    - >10 years: capped at 40% (0.40)
    """
    y = float(years) if pd.notnull(years) else 0.0
    if y <= 0:
        return 0.0
    elif y <= 5:
        return y * 0.05
    elif y <= 10:
        return 0.25 + (y - 5.0) * 0.03
    else:
        return 0.40


def parse_delivery_year(date_str: str) -> int:
    """Extract delivery year from text, defaulting to 2026 for immediate delivery."""
    text = str(date_str)
    year_match = re.search(r"20\d\d", text)
    if year_match:
        return int(year_match.group(0))
    return 2026


def clean_and_process_data(df: pd.DataFrame) -> pd.DataFrame:
    """Perform data cleaning, feature engineering, and Cash Equivalent valuation."""
    print("Cleaning data and computing AVM features...")
    df = df.copy()

    # 1. Title decomposition
    title_components = df["title"].apply(parse_title)
    df["compound_name"] = title_components[0]
    df["area_name"] = title_components[1]
    df["developer_name"] = title_components[2]
    df["main_city"] = title_components[3]

    # 2. Basic numeric sanity
    df["area_sqm"] = pd.to_numeric(df["area_sqm"], errors="coerce")
    df["total_price"] = pd.to_numeric(df["total_price"], errors="coerce")
    df["bedrooms"] = pd.to_numeric(df["bedrooms"], errors="coerce").fillna(2).astype(int)
    df["bathrooms"] = pd.to_numeric(df["bathrooms"], errors="coerce").fillna(2).astype(int)
    df["installment_years"] = pd.to_numeric(df["installment_years"], errors="coerce").fillna(0).astype(int)

    # 3. Listed Price per SQM
    df["price_per_sqm"] = df["total_price"] / df["area_sqm"]

    # 4. Cash Equivalent Price calculation:
    # - Installment discount: 25% to 40% for multi-year installment plans
    # - Negotiation buffer: 9% (market range 8-10%)
    NEGOTIATION_DISCOUNT = 0.09

    df["installment_discount_rate"] = df["installment_years"].apply(calculate_cash_discount_rate)
    df["negotiation_discount_rate"] = NEGOTIATION_DISCOUNT
    df["total_discount_factor"] = (1.0 - df["installment_discount_rate"]) * (1.0 - df["negotiation_discount_rate"])
    df["cash_equivalent_price"] = (df["total_price"] * df["total_discount_factor"]).round(2)
    df["cash_price_per_sqm"] = (df["cash_equivalent_price"] / df["area_sqm"]).round(2)

    # 5. Delivery timeline features
    df["delivery_year"] = df["delivery_date"].apply(parse_delivery_year)
    df["years_to_delivery"] = (df["delivery_year"] - 2026).clip(lower=0)

    # 6. Filter out extreme non-residential outliers (e.g. 10-feddan olive farms or corrupt entries)
    # Keeping properties between 20m² and 3,000m², and price/m² between 5,000 and 500,000 EGP
    initial_count = len(df)
    valid_mask = (
        (df["area_sqm"] >= 20)
        & (df["area_sqm"] <= 3000)
        & (df["total_price"] > 0)
        & (df["price_per_sqm"] >= 5000)
        & (df["price_per_sqm"] <= 500000)
    )
    df_clean = df[valid_mask].copy().reset_index(drop=True)
    dropped = initial_count - len(df_clean)
    print(f"Filtered out {dropped} non-standard outliers (Farms/Plots > 3000m² or < 5000 EGP/m²).")
    print(f"Retained {len(df_clean)} verified properties ({len(df_clean)/initial_count*100:.2f}%).")

    return df_clean


def main():
    print("=" * 60)
    print("Sakanybot AVM - Step 1: Data Preparation & Normalization")
    print("=" * 60)

    supabase = load_supabase_client()
    raw_df = fetch_all_properties(supabase)
    clean_df = clean_and_process_data(raw_df)

    # Save to CSV
    clean_df.to_csv(OUTPUT_CSV, index=False, encoding="utf-8-sig")
    print(f"\n[SUCCESS] Cleaned AVM dataset saved to:\n  -> {OUTPUT_CSV.resolve()}")

    # Summary Statistics
    print("\n" + "=" * 60)
    print("Dataset Summary Statistics:")
    print("=" * 60)
    print(f"Total Clean Records: {len(clean_df):,}")
    print(f"Unique Unit Types:   {clean_df['unit_type'].nunique()} types: {list(clean_df['unit_type'].unique())}")
    print(f"Unique Areas:        {clean_df['area_name'].nunique()} areas")
    print(f"Unique Compounds:    {clean_df['compound_name'].nunique()} compounds")
    print(f"Unique Developers:   {clean_df['developer_name'].nunique()} developers")
    print("\nPrice per SQM (Listed):")
    print(clean_df["price_per_sqm"].describe().apply(lambda x: f"{x:,.2f}"))
    print("\nCash Equivalent Price per SQM (Deal-level):")
    print(clean_df["cash_price_per_sqm"].describe().apply(lambda x: f"{x:,.2f}"))
    print("\nTop 5 Areas by Count:")
    print(clean_df["area_name"].value_counts().head(5))
    print("=" * 60)


if __name__ == "__main__":
    main()
