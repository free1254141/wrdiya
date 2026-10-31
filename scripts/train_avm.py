"""Sakanybot - Automated Valuation Model (AVM) Model Training Script
==================================================================
Trains:
1. `model_mid`: LightGBM Regressor for fair market price per sqm & total price.
2. `model_low`: LightGBM Quantile Regressor (alpha=0.1) for quick-sale lower bound.
3. `model_high`: LightGBM Quantile Regressor (alpha=0.9) for optimistic upper bound.
4. Cash-equivalent models for intrinsic cash deal valuation.
5. KNN NearestNeighbors for automated comparable properties retrieval (Comps).

Computes MAE, MAPE, R2, and quantile coverage metrics.
Saves the complete pipeline to `models/avm_pipeline.joblib`.
"""

import os
import sys
from datetime import datetime
from pathlib import Path
import joblib
import lightgbm as lgb
import numpy as np
import pandas as pd
from sklearn.metrics import mean_absolute_error, mean_absolute_percentage_error, r2_score
from sklearn.model_selection import train_test_split
from sklearn.neighbors import NearestNeighbors
from sklearn.preprocessing import OrdinalEncoder, StandardScaler

# Windows UTF-8 stdout fix
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

# Paths
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
MODELS_DIR = BASE_DIR / "models"
MODELS_DIR.mkdir(exist_ok=True)
INPUT_CSV = DATA_DIR / "avm_properties_clean.csv"
OUTPUT_PIPELINE = MODELS_DIR / "avm_pipeline.joblib"


def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    """Add domain-specific interaction and ratio features for Egyptian real estate."""
    data = df.copy()

    # Ratios and binary indicators
    data["bath_to_bed_ratio"] = data["bathrooms"] / data["bedrooms"].clip(lower=1)
    data["is_cash"] = (data["installment_years"] == 0).astype(int)
    data["is_immediate"] = (data["years_to_delivery"] == 0).astype(int)
    data["is_long_installment"] = (data["installment_years"] >= 7).astype(int)

    return data


def train_models():
    print("=" * 65)
    print("Sakanybot AVM - Step 2: Model Training & Evaluation")
    print("=" * 65)

    if not INPUT_CSV.exists():
        raise FileNotFoundError(f"Cleaned dataset not found at {INPUT_CSV}. Run scripts/prepare_avm_data.py first.")

    print(f"Loading cleaned dataset from: {INPUT_CSV}")
    df = pd.read_csv(INPUT_CSV, encoding="utf-8-sig")
    print(f"Loaded {len(df):,} properties.")

    # 1. Feature Engineering
    df = engineer_features(df)

    cat_cols = ["unit_type", "finishing_type", "area_name", "compound_name", "developer_name", "main_city"]
    num_cols = [
        "area_sqm",
        "bedrooms",
        "bathrooms",
        "installment_years",
        "years_to_delivery",
        "bath_to_bed_ratio",
        "is_cash",
        "is_immediate",
        "is_long_installment",
    ]

    # Fill NA if any
    for col in cat_cols:
        df[col] = df[col].fillna("غير محدد").astype(str)
    for col in num_cols:
        df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0)

    # 2. Ordinal Encoding for LightGBM
    encoder = OrdinalEncoder(handle_unknown="use_encoded_value", unknown_value=-1)
    encoded_cat = encoder.fit_transform(df[cat_cols])
    encoded_cat_df = pd.DataFrame(encoded_cat, columns=cat_cols, index=df.index)

    X = pd.concat([encoded_cat_df, df[num_cols]], axis=1)
    feature_names = list(X.columns)

    y_listed_sqm = df["price_per_sqm"]
    y_cash_sqm = df["cash_price_per_sqm"]

    # 3. Train/Test Split (80% Train, 20% Test)
    X_train, X_test, y_train, y_test, y_cash_train, y_cash_test = train_test_split(
        X, y_listed_sqm, y_cash_sqm, test_size=0.2, random_state=42
    )
    test_indices = y_test.index
    print(f"Training samples: {len(X_train):,}, Testing samples: {len(X_test):,}")

    # 4. LightGBM Hyperparameters
    lgb_params = {
        "n_estimators": 400,
        "learning_rate": 0.04,
        "num_leaves": 25,
        "min_child_samples": 12,
        "subsample": 0.85,
        "colsample_bytree": 0.85,
        "random_state": 42,
        "verbose": -1,
        "n_jobs": -1,
    }

    # 5. Train Listed Price Models (model_mid, model_low, model_high)
    print("\nTraining LightGBM Listed Price Models...")
    model_mid = lgb.LGBMRegressor(objective="regression", **lgb_params)
    model_low = lgb.LGBMRegressor(objective="quantile", alpha=0.1, **lgb_params)
    model_high = lgb.LGBMRegressor(objective="quantile", alpha=0.9, **lgb_params)

    model_mid.fit(X_train, y_train)
    model_low.fit(X_train, y_train)
    model_high.fit(X_train, y_train)

    # 6. Train Cash Equivalent Price Models
    print("Training LightGBM Cash-Equivalent Models...")
    model_cash_mid = lgb.LGBMRegressor(objective="regression", **lgb_params)
    model_cash_low = lgb.LGBMRegressor(objective="quantile", alpha=0.1, **lgb_params)
    model_cash_high = lgb.LGBMRegressor(objective="quantile", alpha=0.9, **lgb_params)

    model_cash_mid.fit(X_train, y_cash_train)
    model_cash_low.fit(X_train, y_cash_train)
    model_cash_high.fit(X_train, y_cash_train)

    # 7. Evaluate on Test Set
    pred_mid = model_mid.predict(X_test)
    pred_low = model_low.predict(X_test)
    pred_high = model_high.predict(X_test)

    # Monotonicity adjustment: low <= mid <= high
    pred_low_adj = np.minimum(pred_low, pred_mid)
    pred_high_adj = np.maximum(pred_high, pred_mid)

    # Listed Price Metrics (per SQM)
    mae_sqm = mean_absolute_error(y_test, pred_mid)
    mape_sqm = mean_absolute_percentage_error(y_test, pred_mid) * 100
    r2_sqm = r2_score(y_test, pred_mid)

    # Listed Price Metrics (Total Value)
    test_areas = df.loc[test_indices, "area_sqm"].values
    tot_true = y_test.values * test_areas
    tot_pred = pred_mid * test_areas
    mae_tot = mean_absolute_error(tot_true, tot_pred)
    mape_tot = mean_absolute_percentage_error(tot_true, tot_pred) * 100
    r2_tot = r2_score(tot_true, tot_pred)

    # Quantile Coverage Metrics
    in_range = (y_test.values >= pred_low_adj) & (y_test.values <= pred_high_adj)
    coverage_pct = np.mean(in_range) * 100
    below_low_pct = np.mean(y_test.values < pred_low_adj) * 100
    above_high_pct = np.mean(y_test.values > pred_high_adj) * 100

    # Cash-equivalent Metrics
    cash_pred_mid = model_cash_mid.predict(X_test)
    mae_cash_sqm = mean_absolute_error(y_cash_test, cash_pred_mid)
    mape_cash_sqm = mean_absolute_percentage_error(y_cash_test, cash_pred_mid) * 100
    r2_cash_sqm = r2_score(y_cash_test, cash_pred_mid)

    # 8. Train KNN Comparables Model (NearestNeighbors)
    print("Training KNN Comparables Model...")
    area_medians = df.groupby("area_name")["price_per_sqm"].median().to_dict()
    df["area_price_level"] = df["area_name"].map(area_medians).fillna(df["price_per_sqm"].median())

    knn_feature_cols = ["area_sqm", "price_per_sqm", "bedrooms", "area_price_level"]
    knn_scaler = StandardScaler()
    X_knn = knn_scaler.fit_transform(df[knn_feature_cols])

    # Weights to prioritize location area and unit size
    knn_weights = np.array([2.0, 2.0, 1.2, 4.0])
    X_knn_weighted = X_knn * knn_weights

    knn_model = NearestNeighbors(n_neighbors=5, metric="euclidean")
    knn_model.fit(X_knn_weighted)

    # KNN Database for instant retrieval
    knn_db = df[
        [
            "id",
            "title",
            "unit_type",
            "area_name",
            "compound_name",
            "developer_name",
            "area_sqm",
            "bedrooms",
            "bathrooms",
            "finishing_type",
            "total_price",
            "price_per_sqm",
            "cash_equivalent_price",
            "cash_price_per_sqm",
            "installment_years",
            "delivery_date",
            "affiliate_url",
            "platform",
        ]
    ].copy()

    # 9. Assemble and Save Artifact
    pipeline_artifact = {
        "models": {
            "model_mid": model_mid,
            "model_low": model_low,
            "model_high": model_high,
            "model_cash_mid": model_cash_mid,
            "model_cash_low": model_cash_low,
            "model_cash_high": model_cash_high,
        },
        "knn": {
            "model": knn_model,
            "scaler": knn_scaler,
            "weights": knn_weights,
            "feature_cols": knn_feature_cols,
            "db": knn_db,
        },
        "preprocessors": {
            "encoder": encoder,
            "cat_cols": cat_cols,
            "num_cols": num_cols,
            "feature_names": feature_names,
            "area_medians": area_medians,
            "default_area_median": float(df["price_per_sqm"].median()),
        },
        "metrics": {
            "price_per_sqm": {
                "MAE": mae_sqm,
                "MAPE": mape_sqm,
                "R2": r2_sqm,
            },
            "total_price": {
                "MAE": mae_tot,
                "MAPE": mape_tot,
                "R2": r2_tot,
            },
            "quantiles": {
                "coverage_pct": coverage_pct,
                "below_low_pct": below_low_pct,
                "above_high_pct": above_high_pct,
                "alpha_low": 0.1,
                "alpha_high": 0.9,
            },
            "cash_price_per_sqm": {
                "MAE": mae_cash_sqm,
                "MAPE": mape_cash_sqm,
                "R2": r2_cash_sqm,
            },
        },
        "metadata": {
            "trained_at": datetime.now().isoformat(),
            "total_samples": len(df),
            "train_samples": len(X_train),
            "test_samples": len(X_test),
            "version": "1.0.0",
        },
    }

    joblib.dump(pipeline_artifact, OUTPUT_PIPELINE, compress=3)
    file_size_mb = OUTPUT_PIPELINE.stat().st_size / (1024 * 1024)
    print(f"\n[SUCCESS] Pipeline successfully saved to:\n  -> {OUTPUT_PIPELINE.resolve()} ({file_size_mb:.2f} MB)")

    # 10. Print Detailed Report
    print("\n" + "=" * 65)
    print("Model Evaluation & Accuracy Report:")
    print("=" * 65)
    print(f"Listed Price / m² (model_mid):")
    print(f"  • MAE:      {mae_sqm:,.2f} EGP/m²")
    print(f"  • MAPE:     {mape_sqm:.2f}%")
    print(f"  • R² Score: {r2_sqm:.4f}")

    print(f"\nTotal Listed Property Value:")
    print(f"  • MAE:      {mae_tot:,.2f} EGP")
    print(f"  • MAPE:     {mape_tot:.2f}%")
    print(f"  • R² Score: {r2_tot:.4f}")

    print(f"\nCash Equivalent Price / m² (model_cash_mid):")
    print(f"  • MAE:      {mae_cash_sqm:,.2f} EGP/m²")
    print(f"  • MAPE:     {mape_cash_sqm:.2f}%")
    print(f"  • R² Score: {r2_cash_sqm:.4f}")

    print(f"\nQuantile Range & Uncertainty (alpha=0.1 to 0.9):")
    print(f"  • Coverage Percentage:  {coverage_pct:.2f}% of test properties fall within [Low, High]")
    print(f"  • Below Lower Bound:   {below_low_pct:.2f}% (Quick-sale opportunities)")
    print(f"  • Above Upper Bound:   {above_high_pct:.2f}% (Overpriced / Premium asking)")

    print(f"\nKNN Comparables Database:")
    print(f"  • Active units indexed for comps: {len(knn_db):,}")
    print("=" * 65)


if __name__ == "__main__":
    train_models()
