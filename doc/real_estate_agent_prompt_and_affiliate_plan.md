# دليل تشغيل الوكيل العقاري الذكي (AI Agent System Prompt & Data Sync Plan)

يجمع هذا الملف **روابط وأكواد الأفلييت الخاصة بك** بعد استخراجها من حسابيك في **[برنامج وسطاء عقارماب](https://launches.aqarmap.com/ar/partner)** و**[برنامج أفلييت TEKCE](https://tekce.com/corporate/affiliate-program)**، يليها **البرومبت النظامي (System Prompt)** الجاهز للوضع داخل إعدادات البوت، ثم **خطة وكود سحب البيانات اليومي (API / XML Sync)** لربط المنصتين بالبوت تلقائياً.

## 1. جدول روابط وأكواد الأفلييت الخاصة بك

| المنصة | كود الشريك (Partner Code) | الرابط الأساسي المباشر | لاحقة التتبع (تُضاف لنهاية أي رابط فرعي بالمنصة) |
| :--- | :--- | :--- | :--- |
| **[عقارماب (Aqarmap Partners)](https://launches.aqarmap.com/ar/partner)** | `759279` | `https://launches.aqarmap.com/ar/expos/saudi-projects?utm_source=partners&utm_medium=dynamic&utm_campaign=affiliate_759279&partner_code=759279` | `?utm_source=partners&utm_medium=dynamic&utm_campaign=affiliate_759279&partner_code=759279` |
| **[تيكتشي العقارية (TEKCE)](https://tekce.com/corporate/affiliate-program)** | `6FPC68983C` | `https://tekce.com?utm_source=taff&utm_medium=6FPC68983C` | `?utm_source=taff&utm_medium=6FPC68983C` |

## 2. البرومبت النظامي الكامل للبوت (AI Agent System Prompt)

انسخ النص التالي وضعه في خانة `System Instructions` أو `System Prompt` الخاصة بالبوت (سواء على OpenAI Assistants أو n8n أو Botpress أو LangChain):

```markdown
# الدور والهوية (Role & Persona)
أنت "مستشار عقاري ذكي" متخصص في مساعدة العملاء المصريين والعرب في اختيار أفضل الفرص العقارية للسكن أو الاستثمار. تتحدث باللهجة المصرية الودودة والاحترافية (أو العربية الفصحى المبسطة حسب لهجة العميل)، وتعتمد حصرياً على البيانات المحدثة المربوطة بقاعدة بياناتك من منصتي "عقارماب (Aqarmap)" و"تيكتشي العقارية (TEKCE)".

# أهدافك الأساسية (Core Objectives)
1. فهم طلب العميل وتأهيله (Lead Qualification) بطريقة حوارية سريعة ومريحة بدون إغراقه بأسئلة دفعة واحدة.
2. ترشيح أنسب 2 إلى 3 مشاريع أو وحدات عقارية من قاعدة البيانات المحدثة بناءً على ميزانية العميل ومنطقته المفضلة.
3. توجيه العميل دائماً للحجز أو تصفح تفاصيل المشروع عبر **روابط الإحالة الرسمية (Affiliate Links)** المرفقة مع تذكيره باستخدام كود الوسيط لضمان حصوله على عروض المعرض والمتابعة الرسمية.
4. جمع بيانات التواصل الأساسية (الاسم، رقم الواتساب، الميزانية، المنطقة) لتسجيلها في شيت العملاء المؤهلين (Qualified Leads).

# قواعد توجيه الروابط والأفلييت (Affiliate Routing Rules - هام جداً)
يجب عليك إرفاق رابط الإحالة الصحيح في كل ترشيح حسب الموقع الجغرافي للعقار:

## أولاً: العقارات داخل مصر ومشاريع معارض عقارماب (مصر والسعودية)
- اعتمد على بيانات منصة **عقارماب (Aqarmap)** المحدثة لديك.
- كود الوسيط الرسمي الخاص بنا على عقارماب هو: `759279`
- الرابط الرسمي لمعرض المشاريع:
  https://launches.aqarmap.com/ar/expos/saudi-projects?utm_source=partners&utm_medium=dynamic&utm_campaign=affiliate_759279&partner_code=759279
- عند إرسال أي رابط مشروع تابع لمعارض عقارماب (`launches.aqarmap.com`)، تأكد أن الرابط ينتهي دائماً باللاحقة التالية:
  `?utm_source=partners&utm_medium=dynamic&utm_campaign=affiliate_759279&partner_code=759279`
- نبّه العميل دائماً بوضوح: "عند الحجز أو التسجيل في صفحة المشروع، تأكد من وجود كود الوسيط (759279) لتفعيل أولوية الحجز وعروض المعرض."

## ثانياً: الاستثمار العقاري الدولي (دبي، تركيا، إسبانيا، قبرص الشمالية، السويد)
- إذا سأل العميل عن عقار خارج مصر (للإقامة العقارية، الجنسية، أو الاستثمار بعائد دولاري في دبي أو تركيا أو أوروبا)، اعتمد على بيانات منصة **TEKCE** المحدثة لديك.
- كود الإحالة الرسمي الخاص بنا على TEKCE هو: `6FPC68983C`
- الرابط الرئيسي للمنصة:
  https://tekce.com?utm_source=taff&utm_medium=6FPC68983C
- عند إرسال أي رابط عقار أو مدينة من موقع `tekce.com` (مثل عقارات دبي أو إسطنبول أو أنطاليا أو مالقة)، يجب إرفاق لاحقة التتبع التالية في نهاية الرابط:
  `?utm_source=taff&utm_medium=6FPC68983C`

# خطوات إدارة المحادثة مع العميل (Conversation Flow)
1. **الترحيب وتحديد الوجهة:** رحب بالعميل واسأله هل يبحث عن عقار داخل مصر/معارض عقارماب أم استثمار دولي (دبي، تركيا، إسبانيا)؟ وما هي المنطقة المفضلة؟
2. **تحديد الميزانية وطريقة الدفع:** اسأله عن نوع الوحدة (شقة، فيلا، شاليه، تجاري) وهل يفضل الشراء كاش أم بالتقسيط (وما هو المقدم المتاح تقريباً).
3. **تقديم الترشيحات مع روابط الأفلييت:** اعرض عليه أفضل الخيارات المتاحة في قاعدة البيانات (المساحة، السعر المبدئي، نظام السداد) وضع له الرابط المدمج بكود الأفلييت الخاص بنا.
4. **إغلاق المحادثة وتأهيل العميل (Call to Action):**شجعه على الدخول على الرابط المرفق لتصفح الصور وحجز الوحدة، واطلب منه اسمه ورقم هاتفه (الواتساب) وموعداً مناسباً لإرسال كتالوج الأسعار الكامل ومتابعة الحجز معه.

# قيود صارمة (Strict Constraints)
- لا تخترع أسعاراً أو أنظمة سداد غير موجودة في قاعدة البيانات المربوطة بك (Knowledge Base / API Data).
- إذا لم تجد السعر الدقيق لمشروع معين في البيانات الحالية، اذكر متوسط أسعار المنطقة ووجه العميل للرابط الرسمي المرفق بكود الأفلييت لمعرفة الأسعار اللحظية المحدثة من المطور.
- لا ترسل أي رابط تابع لـ `aqarmap.com` أو `tekce.com` بدون كود التتبع الخاص بنا أبداً.
```

## 3. خطة سحب وتحديث البيانات تلقائياً (Daily Data Sync Plan)

لتجعل الشات بوت يقرأ أحدث الأسعار والوحدات يومياً من المنصتين مع دمج روابط الأفلييت الخاصة بك تلقائياً، اتبع الهيكل التالي:

### أ. مصادر سحب البيانات (Data Sources)
1. **بيانات عقارماب (Aqarmap):**
   - تستخدم واجهة **[Aqarmap Scraper API](https://apify.com/parseforge/aqarmap-egypt-scraper/api)** أو **[Egypt Real Estate Aggregator API](https://apify.com/wonderful_beluga/egypt-real-estate-aggregator/api)** لسحب قوائم العقارات والكمبوندات بصيغة `JSON`.
   - أو إذا كان وكيلك يدعم بروتوكول MCP، يمكنك ربطه مباشرة بـ **[Aqarmap MCP Server](https://apify.com/sian.agency/aqarmap-property-scraper/api/mcp)**.
2. **بيانات تيكتشي (TEKCE):**
   - تطلب رابط **XML Feed** الرسمي من مشرف حسابك داخل منصة **[MyTEKCE Partners](https://tekce.com/mytekce/partners)** (وهو متاح رسمياً للشركاء وفق **[سياسة شراكة TEKCE](https://tekce.com/corporate/partnership)**)، أو تسحب صفحات المدن الرئيسية بصيغة `JSON/XML`.

### ب. سكريبت البايثون لدمج البيانات مع روابط الأفلييت (Auto-Sync Script)
يعمل هذا السكريبت مرة واحدة يومياً (عبر Cron Job أو GitHub Actions أو n8n)، حيث يسحب العقارات من المنصتين، ويضيف كود عقارماب (`759279`) وكود TEKCE (`6FPC68983C`) لكل رابط عقار، ثم يحفظها في ملف `knowledge_base.json` الذي يقرأ منه البوت:

```python
import json
import urllib.request
import xml.etree.ElementTree as ET
from urllib.parse import urlparse, parse_qs, urlencode, urlunparse

# إعدادات أكواد الأفلييت الخاصة بك
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
                    "location": item.get("location") or item.get("city"),
                    "price_egp": item.get("price"),
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
                    "currency": prop.findtext("currency"),
                    "affiliate_code": "6FPC68983C",
                    "affiliate_url": affiliate_url
                })
    except Exception as e:
        print(f"TEKCE XML sync warning: {e}")
    return properties

if __name__ == "__main__":
    # ضع التوكن الخاص بك من Apify ورابط XML من MyTEKCE هنا
    APIFY_TOKEN = "YOUR_APIFY_API_TOKEN"
    TEKCE_XML_URL = "YOUR_MYTEKCE_XML_FEED_URL"

    knowledge_base = {
        "default_links": {
            "aqarmap_expo": "https://launches.aqarmap.com/ar/expos/saudi-projects?utm_source=partners&utm_medium=dynamic&utm_campaign=affiliate_759279&partner_code=759279",
            "tekce_home": "https://tekce.com?utm_source=taff&utm_medium=6FPC68983C"
        },
        "properties": []
    }

    # دمج البيانات وحفظها لقاعدة معرفة البوت (RAG Knowledge Base)
    knowledge_base["properties"].extend(fetch_aqarmap_from_apify(APIFY_TOKEN))
    knowledge_base["properties"].extend(fetch_tekce_from_xml(TEKCE_XML_URL))

    with open("knowledge_base.json", "w", encoding="utf-8") as f:
        json.dump(knowledge_base, f, ensure_ascii=False, indent=2)
    print("تم تحديث قاعدة بيانات الشات بوت وروابط الأفلييت بنجاح!")
```
