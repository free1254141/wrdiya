# 📁 مجلد النماذج الرياضية وتعلم الآلة (Trained ML Models)

تم تدريب وتصدير كل موديل كملف مستقل `.joblib` لتسهيل الفحص والتجربة:

| اسم الملف | الموديل | الخوارزمية والوظيفة |
| :--- | :--- | :--- |
| `1_lgbm_fair_price_mid.joblib` | **السعر العادل المتوقع** | LightGBM Regressor لحساب سعر المتر العادل المعروض. |
| `2_lgbm_quick_sale_low_quantile.joblib` | **الحد الأدنى للبيع السريع** | LightGBM Quantile (alpha=0.1) لتوقع أقل سعر بيع نقدي سريع. |
| `3_lgbm_premium_high_quantile.joblib` | **السقف السعري المتفائل** | LightGBM Quantile (alpha=0.9) لتوقع أعلى سعر مطلوب. |
| `4_lgbm_cash_deal_price.joblib` | **سعر الكاش الفعلي للصفقة** | LightGBM Regressor لحساب القيمة بعد تحييد فوائد التقسيط. |
| `5_lgbm_cash_deal_low.joblib` | **الحد الأدنى للكاش الفعلي** | LightGBM Quantile (alpha=0.1) للكاش الفعلي. |
| `6_lgbm_cash_deal_high.joblib` | **الحد الأقصى للكاش الفعلي** | LightGBM Quantile (alpha=0.9) للكاش الفعلي. |
| `7_knn_comparables_engine.joblib` | **محرك الصفقات المشابهة** | NearestNeighbors (KNN) لجلب أقرب 3-5 وحدات مماثلة في السوق. |
| `avm_pipeline.joblib` | **الحزمة الموحدة الشاملة** | تضم كافة النماذج السبعة + المعالجات والفيتشرات (All-in-One). |
