---
title: Aqar AI Real Estate Sync Worker
emoji: 🏢
colorFrom: amber
colorTo: yellow
sdk: gradio
sdk_version: 4.44.0
app_file: app.py
pinned: false
---

# 🏢 عقار AI - محرك سحب البيانات والأفلييت (Hugging Face Worker)

يقوم هذا الخادم بسحب وتحديث بيانات العقارات يومياً وتخزينها في قاعدة بيانات **Supabase** مباشرة مع إرفاق أكواد الأفلييت الخاصة بك في الخلفية:
- كود وسيط عقارماب: `759279`
- كود شريك TEKCE الدولي: `6FPC68983C`

## ⚙️ كيف يعمل النظام؟ (Architecture)
1. **Hugging Face / Python Worker**:
   - يسحب أحدث الوحدات من عقارماب (مصر) وTEKCE (دبي، تركيا، إسبانيا).
   - ينظف البيانات ويحسب الأقساط والنسب.
   - يدمج كود الأفلييت في رابط كل وحدة لحساب العمولات.
   - يرفع البيانات فوراً إلى **Supabase** (`properties`, `compounds_projects`, `sync_logs`).
2. **Vercel (Next.js Chatbot)**:
   - لا يقوم بأي معالجة شاقة أو سحب للبيانات.
   - يقرأ ويكيش البيانات المعتمدة الجاهزة من Supabase فقط.

## 🚀 التشغيل المحلي (Local Run)
```bash
# تشغيل مزامنة فورية مرة واحدة
python sync_worker.py

# تشغيل كخادم مستمر يعمل كل 24 ساعة
python sync_worker.py --daemon
```

## 🌐 النشر على Hugging Face Spaces مجاناً
1. أنشئ Space جديد على Hugging Face باختيار Gradio SDK.
2. ارفع محتويات هذا المجلد (`app.py`, `sync_worker.py`, `requirements.txt`).
3. أضف الـ Secrets في إعدادات الـ Space:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `APIFY_API_TOKEN` (اختياري)
   - `TEKCE_XML_FEED_URL` (اختياري)
