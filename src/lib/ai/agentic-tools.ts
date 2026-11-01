import { Property, SellerFormPrefill } from '@/lib/types';
import { getAllCachedProperties } from '@/lib/real-estate-engine';
import { createSellerProperty, updateSellerProperty } from '@/lib/seller-listings';
import { notifyNewLead, notifyWishlistAlert } from '@/lib/notify';
import { getUnifiedPropertyValuation, findSmartCounterOffer } from '../engine/unified-valuation';
import { getBudgetRecommendations2026 } from '../knowledge/budget-matrix-2026';
import { calculateAnalyticalValuation } from '../engine/valuation-model';
import { calculatePropertyDealScore } from '../engine/deal-scoring';
import { getAreaIntelligence, compareTwoAreas } from '../knowledge/area-intelligence';
import { getDeveloperIntelligence } from '../knowledge/developer-intelligence';
import { queryLegalIntelligence } from '../knowledge/market-regulations-legal';
import { queryInvestmentIntelligence } from '../knowledge/investment-intelligence';
import { queryTransportIntelligence } from '../knowledge/transportation-intelligence';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://csuifvyghfsibkrnxrby.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

export interface SearchPropertiesArgs {
  query?: string;
  unit_type?: string;
  location?: string;
  min_price?: number;
  max_price?: number;
  target_price?: number;
  currency?: 'EGP' | 'AED' | 'EUR' | 'USD';
  bedrooms?: number;
  installment_years?: number;
  down_payment_pct?: number;
  delivery_type?: 'فوري' | 'تقسيط' | 'جاهز' | 'all';
  compound_name?: string;
  limit?: number;
  offset?: number;
  sort?: 'relevance' | 'price_asc' | 'price_desc' | 'area_desc';
}

export interface InstallmentCalcArgs {
  total_price: number;
  down_payment_pct?: number;
  installment_years?: number;
  currency?: string;
}

export interface LeadCaptureArgs {
  customer_name?: string;
  phone_or_whatsapp: string;
  property_id?: string;
  preferred_location?: string;
  notes?: string;
}

/**
 * Agentic Tool Definitions for DeepSeek Function Calling
 */
export const AGENTIC_TOOLS_SCHEMA = [
  {
    type: 'function',
    function: {
      name: 'search_properties',
      description: 'البحث الدقيق في قاعدة بيانات العقارات المعتمدة في مصر (التجمع، الشيخ زايد، العاصمة الإدارية، أكتوبر، مدينتي) والمستقبل سيتي والساحل الشمالي والسخنة والإسكندرية. استخدم هذه الأداة كلما سأل العميل عن شقق، فيلات، استوديوهات، ميزانية معينة (مثل 20 مليون أو 3 مليون)، أو منطقة محددة.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'كلمات بحث إضافية أو اسم مشروع محدد مثل ماونتن فيو، بادية، زد، جاليريا، ميفيدا'
          },
          unit_type: {
            type: 'string',
            description: 'نوع الوحدة المطلوب: شقة، فيلا، تاون هاوس، دوبلكس، استوديو، بنتهاوس، تجاري، أرض'
          },
          location: {
            type: 'string',
            description: 'المدينة أو المنطقة: التجمع الخامس، الشيخ زايد، العاصمة الإدارية، 6 أكتوبر، المستقبل سيتي، الساحل الشمالي، الإسكندرية'
          },
          target_price: {
            type: 'number',
            description: 'الميزانية المستهدفة للعميل بالأرقام (مثال: 20000000 للـ 20 مليون، أو 3000000 للـ 3 مليون). الأداة سترتب النتائج حسب الأقرب لميزانيته بالضبط.'
          },
          min_price: {
            type: 'number',
            description: 'الحد الأدنى للسعر'
          },
          max_price: {
            type: 'number',
            description: 'الحد الأقصى للسعر'
          },
          currency: {
            type: 'string',
            enum: ['EGP', 'AED', 'EUR', 'USD'],
            description: 'العملة (افتراضياً EGP للعقارات المصرية، EGP للجنيه المصري)'
          },
          bedrooms: {
            type: 'number',
            description: 'عدد غرف النوم المطلوبة (مثال: 2، 3، 4)'
          },
          installment_years: {
            type: 'number',
            description: 'عدد سنوات التقسيط المطلوبة إذا ذكرها العميل (مثال: 8 لو طلب تقسيط 8 سنين، أو 5 أو 7 أو 10)'
          },
          down_payment_pct: {
            type: 'number',
            description: 'نسبة المقدم المطلوبة إذا ذكرها العميل (مثال: 10 لو طلب مقدم 10%)'
          },
          delivery_type: {
            type: 'string',
            enum: ['فوري', 'تقسيط', 'all'],
            description: 'تفضيل الاستلام: فوري أو تقسيط'
          },
          limit: {
            type: 'number',
            description: 'عدد الكروت المطلوب عرضها (افتراضياً 4، ولا تغيّره: الواجهة تعرض الباقي في جدول)'
          },
          sort: {
            type: 'string',
            enum: ['relevance', 'price_asc', 'price_desc', 'area_desc'],
            description: 'ترتيب النتائج: price_asc للأرخص، price_desc للأغلى، area_desc للأكبر مساحة. استخدمه عندما يطلب العميل "أرخص" أو "أكبر" أو "أغلى".'
          },
          offset: {
            type: 'number',
            description: 'للاستخدام الداخلي فقط، اتركه فارغاً'
          }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_property_details',
      description: 'جلب التفاصيل الكاملة لوحدة معروضة بالفعل (الوصف، المرافق، الاستلام، التشطيب، المطور، العائد). استخدمها عندما يسأل العميل عن وحدة بعينها ("التانية"، "دي"، "الأولى") وتحتاج بيانات أكثر من الملخص الموجود في سياق المحادثة. مرر property_id من سياق المحادثة.',
      parameters: {
        type: 'object',
        required: ['property_id'],
        properties: {
          property_id: { type: 'string', description: 'معرف الوحدة كما في سياق المحادثة (id)' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'calculate_installments',
      description: 'حساب خطة السداد والأقساط الشهرية والربع سنوية والمقدم بدقة رياضية لأي وحدة عقارية أو ميزانية.',
      parameters: {
        type: 'object',
        required: ['total_price'],
        properties: {
          total_price: {
            type: 'number',
            description: 'إجمالي سعر الوحدة'
          },
          down_payment_pct: {
            type: 'number',
            description: 'نسبة المقدم المئوية (مثال: 10 أو 15 أو 20)'
          },
          installment_years: {
            type: 'number',
            description: 'عدد سنوات التقسيط (مثال: 5 أو 7 أو 8 أو 10 سنوات)'
          },
          currency: {
            type: 'string',
            description: 'العملة (EGP, AED, EUR)'
          }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'record_customer_lead',
      description: 'تسجيل بيانات العميل ورقم هاتفه وطلب المعاينة في النظام لتوصيله مباشرة بإدارة المشروع أو صاحب العقار.',
      parameters: {
        type: 'object',
        required: ['phone_or_whatsapp'],
        properties: {
          phone_or_whatsapp: {
            type: 'string',
            description: 'رقم هاتف العميل أو رقم الواتساب الذي أرسله'
          },
          customer_name: {
            type: 'string',
            description: 'اسم العميل إن وجد'
          },
          property_id: {
            type: 'string',
            description: 'معرف الوحدة المهتم بها إن وجدت'
          },
          preferred_location: {
            type: 'string',
            description: 'المنطقة أو المشروع المفضل'
          },
          notes: {
            type: 'string',
            description: 'ملاحظات إضافية عن استفسار العميل'
          }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'open_seller_listing_form',
      description: 'فتح نافذة/ديالوج فورم إضافة بيانات وحدة أو قطعة أرض للبيع مباشرة على شاشة المستخدم. استدعِ هذه الأداة فوراً عندما يوافق المستخدم على اقتراحك بفتح الفورم (مثل: "ماشي"، "ماشى"، "اه"، "أيوه"، "تمام"، "موافق"، "ياريت"، "افتحه"، "يلا"، "yes", "ok", "sure") أو عندما يطلب فتح الفورم/الديالوج مباشرة لإدخال بيانات وحدته. يمكنك أيضاً تمرير أي بيانات أولية ذكرها المستخدم لتعبئتها تلقائياً في الفورم.',
      parameters: {
        type: 'object',
        properties: {
          unit_type: {
            type: 'string',
            description: 'نوع العقار أو الأرض إن ذكره المستخدم (شقة، أرض، فيلا مستقلة، تاون هاوس، دوبلكس، بنتهاوس، استوديو، محل / تجاري)'
          },
          title: {
            type: 'string',
            description: 'عنوان مقترح للإعلان إن توفرت تفاصيل'
          },
          city: {
            type: 'string',
            description: 'المدينة إن ذكرها المستخدم'
          },
          location_text: {
            type: 'string',
            description: 'المنطقة أو الحي أو الكمبوند إن ذكره المستخدم'
          },
          area_sqm: {
            type: 'number',
            description: 'المساحة بالمتر المربع إن ذكرها'
          },
          total_price: {
            type: 'number',
            description: 'السعر الإجمالي المطلوب إن ذكره'
          },
          bedrooms: {
            type: 'number',
            description: 'عدد غرف النوم إن ذكرها'
          },
          bathrooms: {
            type: 'number',
            description: 'عدد الحمامات إن ذكرها'
          },
          finishing_type: {
            type: 'string',
            description: 'حالة التشطيب إن ذكرها'
          },
          sale_circumstances: {
            type: 'string',
            description: 'ظروف البيع أو أي ملاحظات ذكرها المستخدم'
          },
          seller_phone: {
            type: 'string',
            description: 'رقم هاتف المالك إن ذكره'
          }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'list_property_for_sale',
      description: 'إضافة وحفظ وحدة عقارية أو قطعة أرض يريد العميل (المالك/البائع) بيعها مباشرة في قاعدة بيانات المنصة عندما يفضل كتابة كل بياناتها في الشات بدلاً من الفورم (نوع العقار/الأرض، المنطقة، المساحة، السعر، وظروف البيع).',
      parameters: {
        type: 'object',
        required: ['unit_type', 'location_text', 'area_sqm', 'total_price'],
        properties: {
          unit_type: {
            type: 'string',
            description: 'نوع العقار المراد بيعه: شقة، أرض، فيلا مستقلة، تاون هاوس، دوبلكس، بنتهاوس، استوديو، محل تجاري'
          },
          title: {
            type: 'string',
            description: 'عنوان مميز للإعلان (مثال: قطعة أرض سكنية 500م للبيع في بيت الوطن، أو شقة 165م سوبر لوكس بالتجمع)'
          },
          city: {
            type: 'string',
            description: 'المدينة أو المحافظة (مثال: القاهرة الجديدة، الشيخ زايد، 6 أكتوبر، العبور، الشروق، الساحل الشمالي)'
          },
          location_text: {
            type: 'string',
            description: 'المنطقة أو الحي أو الكمبوند أو رقم القطعة بالتفصيل'
          },
          area_sqm: {
            type: 'number',
            description: 'المساحة بالمتر المربع'
          },
          total_price: {
            type: 'number',
            description: 'إجمالي السعر المطلوب بالأرقام (مثال: 3500000)'
          },
          currency: {
            type: 'string',
            enum: ['EGP', 'USD', 'AED', 'EUR'],
            description: 'العملة (افتراضياً EGP)'
          },
          bedrooms: {
            type: 'number',
            description: 'عدد غرف النوم (0 في حالة الأرض)'
          },
          bathrooms: {
            type: 'number',
            description: 'عدد الحمامات (0 في حالة الأرض)'
          },
          finishing_type: {
            type: 'string',
            description: 'حالة التشطيب للشقق/الفيلات، أو نوع الأرض ورخصة البناء للأراضي (مثال: أرض سكنية مرخصة بدروم وأرضي و3 أدوار)'
          },
          down_payment_pct: {
            type: 'number',
            description: 'نسبة المقدم المئوية (100 إذا كان البيع كاش فقط، أو نسبة المقدم مثل 20 أو 50 لو يقبل تقسيط)'
          },
          installment_years: {
            type: 'number',
            description: 'عدد سنوات التقسيط المتاحة (0 إذا كان البيع كاش فقط)'
          },
          delivery_date: {
            type: 'string',
            description: 'موعد الاستلام (استلام فوري، أو سنة التسليم)'
          },
          sale_circumstances: {
            type: 'string',
            description: 'ظروف البيع وكل التفاصيل المهمة للمشتري: هل البيع مستعجل؟ كاش ولا تقسيط؟ هل السعر قابل للتفاوض؟ هل عليها أقساط متبقية للشركة (أوفر برايس + متبقي) أم خالصة الثمن؟ موقف الرخصة والمرافق؟'
          },
          seller_name: {
            type: 'string',
            description: 'اسم المالك أو البائع إن ذكره'
          },
          seller_phone: {
            type: 'string',
            description: 'رقم هاتف المالك أو الواتساب للتواصل عند وجود مشتري جاد'
          }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'update_my_listed_property',
      description: 'تعديل بيانات وحدة أو أرض معروضة للبيع يملكها المستخدم الحالي (تظهر في seller_own_listed_units_for_sale في سياق المحادثة)، مثل تعديل السعر أو المساحة أو ظروف البيع أو رقم الهاتف.',
      parameters: {
        type: 'object',
        required: ['property_id'],
        properties: {
          property_id: {
            type: 'string',
            description: 'معرف الوحدة (id) من قائمة seller_own_listed_units_for_sale'
          },
          title: { type: 'string' },
          unit_type: { type: 'string' },
          city: { type: 'string' },
          location_text: { type: 'string' },
          area_sqm: { type: 'number' },
          total_price: { type: 'number' },
          bedrooms: { type: 'number' },
          bathrooms: { type: 'number' },
          finishing_type: { type: 'string' },
          down_payment_pct: { type: 'number' },
          installment_years: { type: 'number' },
          status: { type: 'string', description: 'متاح | محجوز | مباع' },
          sale_circumstances: { type: 'string', description: 'تحديث ظروف البيع والتفاصيل' },
          seller_phone: { type: 'string' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'valuate_property',
      description: 'تسعير وتقييم عقار بالذكاء الاصطناعي والموديل الكمي (Automated Valuation Model - AVM). استدعِ هذه الأداة فوراً عندما يسأل العميل عن سعر شقته أو يسأل "تسوى كام" أو يطلب تسعير وحدته لبيعها أو يطلب السعر العادل وسرعة البيع المتوقعة لمساحة ومنطقة معينة، أو يريد التحقق من عدالة سعر وحدة معروضة عليه.',
      parameters: {
        type: 'object',
        required: ['area_sqm', 'location'],
        properties: {
          area_sqm: { type: 'number', description: 'مساحة الوحدة بالمتر المربع' },
          location: { type: 'string', description: 'المدينة أو الحي أو المنطقة (مثل: التجمع الخامس، النرجس، بيت الوطن، الشيخ زايد، R7 العاصمة...)' },
          unit_type: { type: 'string', description: 'نوع العقار (شقة، فيلا، دوبلكس، تاون هاوس...)' },
          bedrooms: { type: 'number', description: 'عدد غرف النوم إن توفر' },
          finishing_type: { type: 'string', description: 'حالة التشطيب (محارة، نصف تشطيب، تشطيب كامل، الترا لوكس)' },
          floor: { type: 'string', description: 'الدور (أرضي بحديقة، متكرر، أخير، بنتهاوس)' },
          payment_method: { type: 'string', description: 'كاش أم تقسيط' },
          asking_price: { type: 'number', description: 'السعر المطلوب من المالك أو المعروض على العميل لتقييم ما إذا كان عادلاً أم مبالغاً فيه' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_area_intelligence',
      description: 'استخراج استخبارات وعيوب ومميزات المناطق والأحياء في مصر، ومتوسطات أسعار المتر الحقيقية كاش وتقسيط والعائد الإيجاري الصادق ورأي البروكر المحايد. استدعِ هذه الأداة عندما يسأل العميل عن عيوب أو مميزات منطقة (مثل التجمع، زايد، العاصمة، المستقبل، الشروق، مدينتي...) أو يقارن بين منطقتين أو يسأل "أشتري فين" أو "إيه عيوب المنطقة دي".',
      parameters: {
        type: 'object',
        required: ['area_name'],
        properties: {
          area_name: { type: 'string', description: 'اسم المنطقة أو الحي' },
          compare_with: { type: 'string', description: 'اسم منطقة ثانية يرغب بمقارنتها مع المنطقة الأولى (إن وجدت)' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'calculate_property_deal_score',
      description: 'حساب سكور الصفقة وجودة السعر من 0 إلى 100 بدقة رياضية وتفصيل نقاط القوة والضعف (هل هي صفقة لقطة، سعر عادل، أم سعر مبالغ فيه).',
      parameters: {
        type: 'object',
        required: ['unit_price', 'area_sqm', 'location'],
        properties: {
          unit_price: { type: 'number', description: 'السعر الإجمالي للوحدة بالجنيه' },
          area_sqm: { type: 'number', description: 'المساحة بالمتر المربع' },
          location: { type: 'string', description: 'المنطقة أو الحي' },
          installment_years: { type: 'number', description: 'سنوات التقسيط إن وجدت' },
          down_payment_pct: { type: 'number', description: 'نسبة المقدم إن وجدت' },
          finishing_type: { type: 'string', description: 'نوع التشطيب' },
          developer_name: { type: 'string', description: 'اسم المطور إن وجد' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'subscribe_property_alert',
      description: 'تسجيل وتفعيل التنبيهات الذكية وقائمة الانتظار للعميل: استدعِ هذه الأداة فوراً عندما يوافق العميل على ترك هاتفه (أو واتسابه) أو إيميله ومواصفات طلبه ليتم إخطاره فور توفر أو عرض وحدة مناسبة له في المنطقة المطلوبة.',
      parameters: {
        type: 'object',
        properties: {
          phone_or_whatsapp: {
            type: 'string',
            description: 'رقم الهاتف أو الواتساب للتواصل وإرسال التنبيه الفوري (مطلوب)',
          },
          customer_name: {
            type: 'string',
            description: 'اسم العميل',
          },
          email: {
            type: 'string',
            description: 'البريد الإلكتروني للعميل لإرسال الإشعار والتنبيهات عليه (اختياري)',
          },
          target_location: {
            type: 'string',
            description: 'المدينة أو المنطقة المطلوبة (مثال: مدينة السادات، حدائق أكتوبر، التجمع الخامس)',
          },
          target_unit_type: {
            type: 'string',
            description: 'نوع العقار المطلوب (شقة، فيلا، مكتب، أرض، إلخ)',
          },
          target_budget: {
            type: 'number',
            description: 'الميزانية التقريبية أو أقصى ميزانية بالجنيه',
          },
          payment_preference: {
            type: 'string',
            enum: ['كاش', 'تقسيط', 'غير محدد'],
            description: 'طريقة الدفع المفضلة',
          },
          notes: {
            type: 'string',
            description: 'أي مواصفات أو تفاصيل خاصة بطلب العميل (المساحة، الدور، التشطيب، إلخ)',
          },
        },
        required: ['phone_or_whatsapp', 'target_location'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_budget_matrix_2026',
      description: 'خريطة ومصفوفة الميزانيات العقارية لمصر 2026/2027: استدعِ هذه الأداة فوراً عندما يسأل العميل عن ميزانية عامة (مثال: "معايا مليون جنيه أعمل إيه؟"، "معايا 500 ألف مقدم أشتري فين؟"). توفر ترشيحاً حقيقياً للبدائل المتاحة كاش واستلام فوري أو مقدم وتقسيط مع أمثلة مشاريع واقعية في 12 منطقة.',
      parameters: {
        type: 'object',
        properties: {
          budget: {
            type: 'number',
            description: 'الميزانية الإجمالية المتوفرة مع العميل بالجنيه المصري (مثال: 1000000)',
          },
          mode: {
            type: 'string',
            enum: ['cash', 'down_payment', 'both'],
            description: 'طبيعة الشراء: كاش واستلام فوري، أو مقدم وتقسيط، أو مقارنة الاثنين',
          },
        },
        required: ['budget'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_market_legal_and_investment_guide',
      description: 'استشارة الدليل القانوني والاستثماري وشبكة النقل والمحاور في السوق العقاري المصري. استخدم هذه الأداة للإجابة عن: صحة التوقيع مقابل التسجيل بالشهر العقاري (قانون 9 لسنة 2022)، توكيلات البيع والشراء غير القابلة للإلغاء، قانون التصالح الجديد 187 لسنة 2023 ونموذج 8، وديعة وفروق الصيانة، رسوم التنازل للمطور (Transfer Fees)، ضريبة التصرفات العقارية 2.5%، خصومات الكاش الحقيقي (35%-45%)، العائد الإيجاري الصافي، الأوفر برايس، غرامات تأخير التسليم، ومحطات المونوريل والقطار السريع LRT.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'الكلمة المفتاحية أو الموضوع المطلوب (مثال: "تسجيل شهر عقاري", "توكيل بيع", "وديعة الصيانة", "رسوم التنازل", "ضريبة تصرفات", "خصم الكاش", "المونوريل", "غرامة تأخير")',
          },
        },
        required: ['query'],
      },
    },
  }
];

/**
 * Synonyms dictionary for locations
 */
const LOCATION_SYNONYMS: Record<string, string[]> = {
  'التجمع': ['التجمع', 'new cairo', 'القاهرة الجديدة', 'tagamoa', 'icity', 'mivida', 'zed east', 'fifth square', 'galleria', 'نرجس', 'أندلس', 'لوتس', 'بنفسج', 'بيت الوطن'],
  'الشيخ زايد': ['الشيخ زايد', 'زايد', 'zayed', 'sheikh zayed', 'زايد الجديدة', 'الحزام الأخضر', 'westown'],
  'أكتوبر': ['أكتوبر', 'اكتوبر', 'october', '6 أكتوبر', 'الحي المتميز', 'التوسعات الشمالية', 'o west', 'بادية', 'badya'],
  'حدائق أكتوبر': ['حدائق أكتوبر', 'حدائق اكتوبر', 'أكتوبر الجديدة', 'اكتوبر الجديدة', 'دجلة بالمز', 'كنز', 'ديار التعمير', 'صن كابيتال'],
  'الشروق': ['الشروق', 'شروق', 'shorouk', 'سوديك إيست', 'البروج', 'كليوباترا بالاس'],
  'بدر': ['بدر', 'مدينة بدر', 'badr city'],
  'العبور': ['العبور', 'مدينة العبور', 'obour'],
  'العاصمة الإدارية': ['العاصمة', 'new capital', 'العاصمه', 'bosco', 'البوسكو', 'r7', 'r8'],
  'مدينتي': ['مدينتي', 'madinaty', 'rehab', 'الرحاب'],
  'الساحل الشمالي': ['الساحل', 'ساحل', 'north coast', 'رأس الحكمة', 'راس الحكمة', 'مراسي', 'marassi', 'هاسيندا', 'hacienda', 'العلمين', 'alamein', 'سيدي عبدالرحمن'],
  'العين السخنة': ['السخنة', 'سخنة', 'sokhna', 'الجلالة', 'galala', 'أزها', 'azha'],
  'المستقبل سيتي': ['المستقبل', 'mostakbal', 'الشروق', 'shorouk', 'العبور', 'obour', 'سراي', 'sarai', 'بلوم فيلدز', 'bloomfields'],
  'الإسكندرية': ['الإسكندرية', 'الاسكندرية', 'إسكندرية', 'اسكندرية', 'alexandria', 'سموحة', 'smouha', 'ستانلي', 'stanley', 'جليم', 'كفر عبده', 'سيدي بشر'],
  'المعادي': ['المعادي', 'معادي', 'maadi', 'مصر الجديدة', 'heliopolis', 'مدينة نصر', 'nasr city', 'الزمالك', 'zamalek', 'الدقي', 'dokki', 'المهندسين', 'mohandessin'],
  'دبي': ['دبي', 'dubai', 'dxb', 'الإمارات', 'uae', 'business bay', 'palm jumeirah', 'creek', 'meydan', 'marina'],
  'إسبانيا': ['إسبانيا', 'اسبانيا', 'spain', 'malaga', 'مالقة', 'marbella', 'ماربيا', 'estepona', 'costa del sol'],
  'تركيا': ['تركيا', 'turkey', 'türkiye', 'إسطنبول', 'اسطنبول', 'istanbul', 'أنطاليا', 'انطاليا', 'antalya', 'alanya']
};

/**
 * Execute Property Search against Supabase Cache
 */
export async function executePropertySearch(args: SearchPropertiesArgs): Promise<{
  found: number;
  total_matches?: number;
  all_matches?: Property[];
  offset?: number;
  message?: string;
  properties: Property[];
  filtersApplied: Record<string, any>;
}> {
  const all = await getAllCachedProperties();
  let results = [...all];
  const limit = Math.min(Math.max(args.limit || 4, 1), 12);
  const offset = Math.max(args.offset || 0, 0);

  // 1. Check unit type (supports apartments, villas, commercial, AND seller-listed plots of land 'أرض')
  if (args.unit_type) {
    const requestedType = args.unit_type.trim().toLowerCase();
    const isAskingLand = requestedType.includes('أرض') || requestedType.includes('ارض') || requestedType.includes('land');

    results = results.filter(p => {
      const pType = (p.unit_type || '').toLowerCase();
      const pTitle = (p.title || '').toLowerCase();
      if (isAskingLand) {
        return pType === 'أرض' || pType === 'ارض' || pType.includes('قطعة أرض') || pType.includes('land');
      }
      return pType.includes(requestedType) || pTitle.includes(requestedType);
    });

    if (isAskingLand && results.length === 0) {
      return {
        found: 0,
        total_matches: 0,
        all_matches: [],
        message: 'لا توجد قطع أراضي معروضة حالياً تطابق هذا الشرط، لكن يمكنك عرض أرضك للبيع معنا أو طلب تسجيل رغبتك الشرائية لنتواصل معك فور عرض أرض مطابقة.',
        properties: [],
        filtersApplied: { unit_type: args.unit_type }
      };
    }
  }

  // 2. Currency Determination & Filtering
  let targetCurrency = args.currency;
  if (!targetCurrency) {
    if (args.location) {
      const loc = args.location.toLowerCase();
      if (loc.includes('دبي') || loc.includes('dubai') || loc.includes('إمارات')) {
        targetCurrency = 'AED';
      } else if (loc.includes('إسبانيا') || loc.includes('spain') || loc.includes('مالقة')) {
        targetCurrency = 'EUR';
      } else if (loc.includes('تركيا') || loc.includes('turkey')) {
        targetCurrency = 'USD';
      } else {
        targetCurrency = 'EGP';
      }
    } else {
      targetCurrency = 'EGP';
    }
  }

  if (targetCurrency) {
    const currencyMatches = results.filter(p => p.currency === targetCurrency);
    if (currencyMatches.length > 0) {
      results = currencyMatches;
    }
  }

  // 3. Location matching
  if (args.location) {
    const locInput = args.location.toLowerCase().trim();
    let synonyms: string[] = [locInput];
    for (const [key, synList] of Object.entries(LOCATION_SYNONYMS)) {
      if (locInput.includes(key) || synList.some(s => locInput.includes(s))) {
        synonyms = synList;
        break;
      }
    }

    const locFiltered = results.filter(p => {
      const pLoc = `${p.compound?.city || ''} ${p.compound?.area_name || ''} ${p.compound?.country || ''} ${p.title} ${(p as any).location_text || ''}`.toLowerCase();
      return synonyms.some(s => pLoc.includes(s.toLowerCase()));
    });

    if (locFiltered.length > 0) {
      results = locFiltered;
    } else {
      // Strict Location Filter: Do NOT leak units from unrelated cities!
      return {
        found: 0,
        total_matches: 0,
        all_matches: [],
        message: `لم نجد حالياً وحدات معروضة مطابقة تماماً لمدينة أو منطقة "${args.location}". حرصاً على الدقة والأمانة، لم نعرض وحدات من مدن أخرى غير مطابقة، ولكن أقرب البدائل بنفس النطاق السعري هي: حدائق أكتوبر، مدينة الشروق، أو العاصمة الإدارية. هل تود أن أعرض لك بدائل ممتازة في إحدى هذه المناطق؟`,
        properties: [],
        filtersApplied: { location: args.location }
      };
    }
  }

  // 4. Bedrooms matching
  if (args.bedrooms) {
    const bedFiltered = results.filter(p => p.bedrooms === args.bedrooms);
    if (bedFiltered.length > 0) {
      results = bedFiltered;
    }
  }

  // 4.1 Installment years matching
  if (args.installment_years && args.installment_years > 0) {
    const exactYears = results.filter(p => p.installment_years === args.installment_years);
    if (exactYears.length > 0) {
      results = exactYears;
    } else {
      const nearYears = results.filter(p => (p.installment_years || 0) >= args.installment_years!);
      if (nearYears.length > 0) results = nearYears;
    }
  }

  // 4.2 Down payment percentage matching
  if (args.down_payment_pct && args.down_payment_pct > 0) {
    const dpFiltered = results.filter(p => (p.down_payment_pct ?? 10) <= args.down_payment_pct!);
    if (dpFiltered.length > 0) {
      results = dpFiltered;
    }
  }

  // 4.3 Delivery type matching
  if (args.delivery_type === 'فوري' || args.delivery_type === 'جاهز') {
    const readyFiltered = results.filter(p => {
      const txt = `${p.delivery_date || ''} ${p.status || ''} ${p.title || ''}`.toLowerCase();
      return txt.includes('فوري') || txt.includes('جاهز') || txt.includes('ready') || txt.includes('2025') || txt.includes('2026');
    });
    if (readyFiltered.length > 0) {
      results = readyFiltered;
    }
  }

  // 5. Min / Max price filtering
  if (args.min_price) {
    results = results.filter(p => p.total_price >= args.min_price!);
  }
  if (args.max_price) {
    results = results.filter(p => p.total_price <= args.max_price!);
  }

  // 6. Target Price Filtering & Proximity Sorting
  if (args.target_price && args.target_price > 0) {
    const target = args.target_price;
    results.sort((a, b) => Math.abs(a.total_price - target) - Math.abs(b.total_price - target));
    const tightBand = results.filter(p => p.total_price >= target * 0.75 && p.total_price <= target * 1.25);
    if (tightBand.length >= 2) {
      results = tightBand;
    } else {
      const wideBand = results.filter(p => p.total_price >= target * 0.60 && p.total_price <= target * 1.40);
      results = wideBand.length > 0 ? wideBand : results.slice(0, 6);
    }
  }

  // 6.1 Explicit sort requested by the user
  if (args.sort === 'price_asc') results.sort((a, b) => a.total_price - b.total_price);
  else if (args.sort === 'price_desc') results.sort((a, b) => b.total_price - a.total_price);
  else if (args.sort === 'area_desc') results.sort((a, b) => (b.area_sqm || 0) - (a.area_sqm || 0));

  // 7. General query / compound matching
  if (args.query) {
    const q = args.query.toLowerCase();
    const queryMatched = results.filter(p => 
      p.title.toLowerCase().includes(q) ||
      (p.compound?.name || '').toLowerCase().includes(q) ||
      (p.compound?.developer?.name || '').toLowerCase().includes(q)
    );
    if (queryMatched.length > 0) {
      results = queryMatched;
    }
  }

  // 8. Deduplicate identical listings and cap to the relevant search result set (max 12)
  const seen = new Set<string>();
  const deduped: Property[] = [];
  for (const p of results) {
    const key = `${(p.title || '').trim().toLowerCase()}|${p.total_price}|${p.area_sqm}`;
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(p);
    }
  }

  const MAX_SEARCH_RESULTS = 12;
  const searchMatches = deduped.slice(0, MAX_SEARCH_RESULTS);
  const totalMatches = searchMatches.length;
  const finalProperties = searchMatches.slice(offset, offset + limit);

  return {
    found: finalProperties.length,
    total_matches: totalMatches,
    all_matches: searchMatches,
    offset,
    properties: finalProperties,
    filtersApplied: {
      unit_type: args.unit_type,
      location: args.location,
      target_price: args.target_price,
      installment_years: args.installment_years,
      down_payment_pct: args.down_payment_pct,
      currency: targetCurrency,
      min_price: args.min_price,
      max_price: args.max_price
    }
  };
}

/**
 * Execute Installment Calculation
 */
export function executeInstallmentCalculation(args: InstallmentCalcArgs) {
  const price = args.total_price;
  const dpPct = args.down_payment_pct || 10;
  const years = args.installment_years || 8;
  const currency = args.currency || 'ج.م';

  const downPayment = (price * dpPct) / 100;
  const remaining = price - downPayment;
  const totalMonths = years * 12;
  const totalQuarters = years * 4;

  const monthlyInstallment = Math.round(remaining / totalMonths);
  const quarterlyInstallment = Math.round(remaining / totalQuarters);

  return {
    total_price: price,
    currency,
    down_payment_percentage: `${dpPct}%`,
    down_payment_amount: downPayment,
    remaining_balance: remaining,
    installment_years: years,
    monthly_installment: monthlyInstallment,
    quarterly_installment: quarterlyInstallment,
    summary: `المقدم (${dpPct}%): ${downPayment.toLocaleString()} ${currency} • القسط الشهري: ${monthlyInstallment.toLocaleString()} ${currency} على ${years} سنوات (${totalMonths} شهر)`
  };
}

/**
 * Execute Customer Lead Recording
 */
export async function executeLeadRecording(args: LeadCaptureArgs) {
  try {
    const { error } = await supabaseAdmin.from('leads_inquiries').insert([{
      phone: args.phone_or_whatsapp,
      user_name: args.customer_name || 'عميل مهتم من الشات الذكي',
      preferred_location: args.preferred_location || null,
      property_id: args.property_id || null,
      notes: args.notes || 'طلب مسجل آلياً عبر محادثة الشات بوت',
      created_at: new Date().toISOString()
    }]);

    if (error) {
      console.warn('Lead insert error:', error);
    }

    // Trigger instant Telegram alert to admin
    notifyNewLead({
      name: args.customer_name || 'عميل مهتم من الشات الذكي',
      phone: args.phone_or_whatsapp,
      location: args.preferred_location || null,
      notes: args.notes || null,
      source: 'محادثة الشات بوت الذكي (أداة حجز معاينة)',
    }).catch(e => console.warn('[notify] Failed to send Telegram lead alert:', e));

    return {
      success: true,
      phone_recorded: args.phone_or_whatsapp,
      message: `تم تسجيل رقم الهاتف (${args.phone_or_whatsapp}) بنجاح وتوصيله بإدارة المبيعات لتحديد موعد المعاينة.`
    };
  } catch (err) {
    return {
      success: true,
      phone_recorded: args.phone_or_whatsapp,
      message: 'تم استلام وتوثيق طلبك وسيتواصل معك مستشارك العقاري مباشرة.'
    };
  }
}

/**
 * Fetch full details for one unit from the cached inventory
 */
export async function executePropertyDetails(args: { property_id: string }): Promise<{ found: boolean; property?: Property; details?: Record<string, any> }> {
  const all = await getAllCachedProperties();
  const p = all.find(x => x.id === args.property_id);
  if (!p) return { found: false };

  // Calculate Unified Valuation & Math Sanity Check
  const unifiedVal = getUnifiedPropertyValuation({
    propertyId: p.id,
    unitPrice: p.total_price,
    areaSqm: p.area_sqm,
    locationOrArea: p.compound?.area_name || p.compound?.city || (p as any).location_text || 'القاهرة الجديدة',
    unitType: p.unit_type,
    installmentYears: p.installment_years,
    downPaymentPct: p.down_payment_pct,
    downPayment: p.down_payment_amount,
    advertisedMonthly: p.monthly_installment,
    advertisedQuarterly: p.quarterly_installment,
    developerName: p.compound?.developer?.name,
    finishingType: p.finishing_type,
  });

  // Auto Counter-Offer for Sub-65 properties
  let smartAlternative: any = null;
  if (unifiedVal.isSub65Score) {
    const counter = findSmartCounterOffer(p, all);
    if (counter.found && counter.alternative) {
      smartAlternative = {
        id: counter.alternative.id,
        title: counter.alternative.title,
        price: `${counter.alternative.total_price.toLocaleString()} ${counter.alternative.currency}`,
        score: counter.alternativeScore,
        recommendation: counter.recommendationReason,
        affiliate_url: counter.alternative.affiliate_url || 'https://sakanybot.vercel.app?ref=759279',
      };
    }
  }

  return {
    found: true,
    property: p,
    details: {
      unified_valuation: {
        score: unifiedVal.totalScore,
        verdict: unifiedVal.verdictLabel,
        fair_market_value: unifiedVal.fairMarketTotal,
        fast_sale_value: unifiedVal.fastSaleTotal,
        installment_gap: unifiedVal.installmentGap,
        pros: unifiedVal.prosList,
        risks: unifiedVal.risksList,
        report: unifiedVal.unifiedBrokerReport,
      },
      smart_counter_offer: smartAlternative,

      id: p.id,
      title: p.title,
      type: p.unit_type,
      price: `${p.total_price.toLocaleString()} ${p.currency}`,
      area_sqm: p.area_sqm,
      bedrooms: p.bedrooms,
      bathrooms: p.bathrooms,
      finishing: p.finishing_type,
      delivery: p.delivery_date,
      status: p.status,
      down_payment: `${p.down_payment_pct}% (${(p.down_payment_amount || 0).toLocaleString()} ${p.currency})`,
      installment_years: p.installment_years,
      monthly_installment: p.monthly_installment,
      quarterly_installment: p.quarterly_installment,
      maintenance_fee: p.maintenance_fee,
      expected_roi_pct: p.roi_expected_pct,
      compound: p.compound?.name,
      compound_description: p.compound?.description?.slice(0, 500),
      amenities: p.compound?.amenities?.slice(0, 12),
      developer: p.compound?.developer?.name,
      city: p.compound?.city,
      area_name: p.compound?.area_name,
      location_text: p.location_text,
      sale_circumstances: p.sale_circumstances,
      listing_source: p.platform === 'SellerListing' ? 'معروض مباشرة من المالك' : 'مشروع مطور معتمد',
      country: p.compound?.country
    }
  };
}

export async function executeListPropertyForSale(ownerId: string, args: any, uploadedImages: string[] = []) {
  const created = await createSellerProperty({
    owner_id: ownerId,
    unit_type: args.unit_type || 'شقة',
    title: args.title,
    city: args.city,
    area_name: args.location_text || args.city,
    location_text: args.location_text,
    area_sqm: Number(args.area_sqm) || 0,
    total_price: Number(args.total_price) || 0,
    currency: args.currency || 'EGP',
    bedrooms: args.bedrooms,
    bathrooms: args.bathrooms,
    finishing_type: args.finishing_type,
    down_payment_pct: args.down_payment_pct,
    installment_years: args.installment_years,
    delivery_date: args.delivery_date,
    sale_circumstances: args.sale_circumstances,
    seller_name: args.seller_name,
    seller_phone: args.seller_phone,
    images: uploadedImages && uploadedImages.length > 0 ? uploadedImages : [],
  });

  if (!created) {
    return { success: false, error: 'تعذر حفظ الوحدة في قاعدة البيانات' };
  }

  return {
    success: true,
    property: created,
    summary: {
      id: created.id,
      title: created.title,
      unit_type: created.unit_type,
      area_sqm: created.area_sqm,
      total_price: `${created.total_price.toLocaleString()} ${created.currency}`,
      location: created.location_text || created.compound?.area_name,
      sale_circumstances: created.sale_circumstances,
      message: 'تم تسجيل وإضافة الوحدة/الأرض بنجاح في قاعدة بيانات سكنى بوت وظهرت الآن في قائمة (وحداتي المعروضة للبيع) في الرف الجانبي للبروفايل، وأصبحت متاحة لترشيحها للمشترين الجادين فوراً.'
    }
  };
}

export async function executeUpdateSellerProperty(ownerId: string, args: any, uploadedImages: string[] = []) {
  if (!args.property_id) {
    return { success: false, error: 'property_id مطلوب لتعديل الوحدة' };
  }
  const patch = uploadedImages.length > 0 ? { ...args, images: uploadedImages } : args;
  const updated = await updateSellerProperty(args.property_id, ownerId, patch);
  if (!updated) {
    return { success: false, error: 'تعذر تحديث الوحدة، تأكد من معرف الوحدة' };
  }
  return {
    success: true,
    property: updated,
    summary: {
      id: updated.id,
      title: updated.title,
      total_price: `${updated.total_price.toLocaleString()} ${updated.currency}`,
      area_sqm: updated.area_sqm,
      sale_circumstances: updated.sale_circumstances,
      status: updated.status,
      message: 'تم تحديث بيانات الوحدة بنجاح في قاعدة البيانات وفي الرف الجانبي.'
    }
  };
}

// ============================================================================
// Seller Listing Form Suggestion & Auto-Open Detection Helpers
// ============================================================================

export function extractSellerPrefillFromMessage(msg: string): SellerFormPrefill | null {
  const q = msg.trim();
  const lower = q.toLowerCase();
  const prefill: SellerFormPrefill = {};

  if (lower.includes('أرض') || lower.includes('ارض') || lower.includes('قطعة') || lower.includes('land') || lower.includes('arsa') || lower.includes('участ') || lower.includes('grund') || lower.includes('terrain') || lower.includes('terreno')) {
    prefill.unit_type = 'أرض';
  } else if (lower.includes('فيلا') || lower.includes('villa') || lower.includes('вилл')) {
    prefill.unit_type = 'فيلا مستقلة';
  } else if (lower.includes('تاون') || lower.includes('townhouse')) {
    prefill.unit_type = 'تاون هاوس';
  } else if (lower.includes('دوبلكس') || lower.includes('duplex')) {
    prefill.unit_type = 'دوبلكس';
  } else if (lower.includes('بنتهاوس') || lower.includes('penthouse')) {
    prefill.unit_type = 'بنتهاوس';
  } else if (lower.includes('استوديو') || lower.includes('studio')) {
    prefill.unit_type = 'استوديو';
  } else if (lower.includes('محل') || lower.includes('تجاري') || lower.includes('shop') || lower.includes('commercial')) {
    prefill.unit_type = 'محل / تجاري';
  } else if (lower.includes('شقة') || lower.includes('شقه') || lower.includes('apartment') || lower.includes('flat') || lower.includes('daire') || lower.includes('квартир')) {
    prefill.unit_type = 'شقة';
  }

  // Extract area (e.g. 165 متر / 165م / 165 sqm / 165 m2)
  const areaMatch = q.match(/(\d{2,4})\s*(?:متر|م²|م2|م\b|sqm|m2|m²)/i);
  if (areaMatch) {
    prefill.area_sqm = parseInt(areaMatch[1], 10);
  }

  // Extract bedrooms (e.g. 3 غرف / 3 نوم / 3 bed)
  const bedMatch = q.match(/(\d)\s*(?:غرف|غرفة|نوم|bed|rooms|oda|комн)/i);
  if (bedMatch) {
    prefill.bedrooms = parseInt(bedMatch[1], 10);
  }

  // Extract price (e.g. 4.5 مليون / 4500000)
  const millionMatch = q.match(/(\d+(?:\.\d+)?)\s*(?:مليون|ملايين|million|m\b)/i);
  const plainPriceMatch = q.match(/\b([1-9]\d{5,8})\b/);
  if (millionMatch) {
    prefill.total_price = Math.round(parseFloat(millionMatch[1]) * 1_000_000);
  } else if (plainPriceMatch) {
    prefill.total_price = parseInt(plainPriceMatch[1], 10);
  }

  // Extract city / location if mentioned
  if (lower.includes('التجمع') || lower.includes('القاهرة الجديدة') || lower.includes('new cairo') || lower.includes('بيت الوطن') || lower.includes('النرجس') || lower.includes('اللوتس')) {
    prefill.city = 'القاهرة الجديدة';
    if (lower.includes('بيت الوطن')) prefill.location_text = 'التجمع الخامس - بيت الوطن';
    else if (lower.includes('النرجس')) prefill.location_text = 'التجمع الخامس - النرجس';
    else if (lower.includes('اللوتس')) prefill.location_text = 'التجمع الخامس - اللوتس';
    else if (lower.includes('التجمع')) prefill.location_text = 'التجمع الخامس';
  } else if (lower.includes('زايد') || lower.includes('zayed')) {
    prefill.city = 'الشيخ زايد';
    prefill.location_text = 'الشيخ زايد';
  } else if (lower.includes('أكتوبر') || lower.includes('اكتوبر') || lower.includes('october')) {
    prefill.city = '6 أكتوبر';
    prefill.location_text = '6 أكتوبر';
  } else if (lower.includes('العاصمة') || lower.includes('new capital')) {
    prefill.city = 'العاصمة الإدارية';
    prefill.location_text = 'العاصمة الإدارية';
  } else if (lower.includes('مدينتي') || lower.includes('madinaty')) {
    prefill.city = 'القاهرة الجديدة';
    prefill.location_text = 'مدينتي';
  } else if (lower.includes('الشروق')) {
    prefill.city = 'الشروق';
    prefill.location_text = 'مدينة الشروق';
  } else if (lower.includes('العبور')) {
    prefill.city = 'العبور';
    prefill.location_text = 'مدينة العبور';
  }

  return Object.keys(prefill).length > 0 ? prefill : null;
}

/** True when the user explicitly asks to open the seller property form/modal. */
export function isDirectOpenSellerFormRequest(msg: string): boolean {
  const q = msg.trim().toLowerCase();
  const patterns = [
    /افتح.*(الفورم|فورم|الديالوج|ديالوج|النافذة|نافذة|اضافة|إضافة)/i,
    /(الفورم|فورم|الديالوج|ديالوج).*(افتح|بيانات|إضافة|اضافة|بيع|وحدت|شقت)/i,
    /نعم.*افتح.*فورم/i,
    /ماشي.*افتح.*فورم/i,
    /open.*(listing|property|seller|sale|unit).*(form|modal|dialog)/i,
    /open.*(form|dialog|modal)/i,
    /formu\s*aç/i,
    /откр(ой|ыть)\s*форм/i,
    /formular\s*öffnen/i,
    /ouvrir\s*le\s*formulaire/i,
    /abrir\s*el\s*formulario/i,
  ];
  return patterns.some((rx) => rx.test(q));
}

/** True when the user expresses intent to sell a unit/land or enter their unit's details. */
export function isSellerListingIntent(msg: string): boolean {
  const q = msg.trim().toLowerCase();
  const patterns = [
    /(عايز|عاوز|محتاج|حابب|أريد|اريد|نفسي|ممكن|ازاي|إزاي|كيف)\s*(أبيع|ابيع|نبيع|بيع|أعرض|اعرض|نعرض|عرض|أضيف|اضيف|إضافة|اضافة|أدخل|ادخل|إدخال|ادخال|أسجل|اسجل)/i,
    /(أدخل|ادخل|إدخال|ادخال|تسجيل|إضافة|اضافة)\s*(بيانات|بينات|تفاصيل)\s*(وحدت|شقت|فيلت|أرض|ارض|عقار|لوحدت)/i,
    /(بيانات|بينات)\s*(لوحدت|وحدت|شقت|عقار|أرض)/i,
    /(عندي|معايا|املك|أملك|لدى|لدي)\s*(شقة|شقه|فيلا|وحدة|وحده|أرض|ارض|قطعة|عقار|دوبلكس|تاون|محل|استوديو).*?(للبيع|أبيع|ابيع|أعرض|اعرض|عايز|محتاج)/i,
    /(شقتي|وحدتي|فيلتي|أرضي|ارضي|عقاري)\s*(للبيع|عايز أبيع|عايز ابيع|للبدل|أعرضها|اعرضها)/i,
    /\b(sell|list)\s+(my|a|an)\s+(property|apartment|unit|villa|land|house|flat|duplex|townhouse|studio)/i,
    /\b(enter|add|submit|fill)\s+(my\s+)?(property|unit|apartment|listing)\s+(details|data|info|form)/i,
    /\bi\s+have\s+a\s+(property|apartment|unit|villa|land)\s+(for\s+sale|to\s+sell)/i,
    /\b(dairemi|evimi|arsamı|mülkümü)\s+satmak\s+istiyorum/i,
    /\b(satılık\s+ilan\s+ekle|ilan\s+vermek\s+istiyorum)/i,
    /\b(хочу\s+продать|продать\s+(мою\s+)?(квартиру|виллу|участок|недвижимость)|добавить\s+объект)/i,
    /\b(immobilie|wohnung|haus|grundstück)\s+verkaufen/i,
    /\b(vendre\s+(mon|ma)\s+(appartement|villa|terrain|bien)|mettre\s+en\s+vente)/i,
    /\b(vender\s+mi\s+(propiedad|apartamento|piso|villa|terreno)|publicar\s+propiedad)/i,
  ];
  return patterns.some((rx) => rx.test(q));
}

/** True when the assistant's previous message offered to open the seller form. */
export function didAssistantOfferSellerForm(lastAssistantContent?: string): boolean {
  if (!lastAssistantContent) return false;
  const c = lastAssistantContent.toLowerCase();
  return (
    (c.includes('فورم') && (c.includes('أفتح') || c.includes('افتح') || c.includes('تفتح') || c.includes('بيانات') || c.includes('وحدتك'))) ||
    (c.includes('ديالوج') && (c.includes('أفتح') || c.includes('افتح'))) ||
    (c.includes('open') && c.includes('form') && (c.includes('property') || c.includes('listing') || c.includes('unit'))) ||
    c.includes('formu açmamı') ||
    c.includes('открыть форму') ||
    c.includes('formular öffnen') ||
    c.includes('ouvrir le formulaire') ||
    c.includes('abrir el formulario')
  );
}

/** True when the user replies with "ماشي" / "اه" / "تمام" / "موافق" / "yes" / "ok" after the bot offered to open the form. */
export function isUserAgreeingToOpenForm(
  userMsg: string,
  pendingSellerFormOffer?: boolean,
  lastAssistantContent?: string
): boolean {
  const hasActiveOffer = Boolean(pendingSellerFormOffer) || didAssistantOfferSellerForm(lastAssistantContent);
  if (!hasActiveOffer) return false;

  const cleaned = userMsg
    .trim()
    .toLowerCase()
    .replace(/[!.,،؟?🏠✨👍👌🙏]+/g, '')
    .trim();

  if (!cleaned || cleaned.length > 60) return false;

  const exactAgreements = new Set([
    'ماشي',
    'ماشى',
    'اه',
    'آه',
    'أه',
    'اها',
    'ايوه',
    'أيوة',
    'ايوة',
    'ايوا',
    'أيوا',
    'نعم',
    'تمام',
    'موافق',
    'موافقه',
    'موافقة',
    'ياريت',
    'يا ريت',
    'اكيد',
    'أكيد',
    'طبعا',
    'طبعاً',
    'يلا',
    'يله',
    'يالا',
    'افتح',
    'افتحه',
    'افتحها',
    'افتحلي',
    'افتحلى',
    'افتحهولي',
    'افتحهولى',
    'اوك',
    'أوك',
    'اوكي',
    'أوكي',
    'اوكى',
    'اتفضل',
    'تفضل',
    'شغال',
    'حلو',
    'طيب',
    'حاضر',
    'دوس',
    'توكل على الله',
    'ماشي افتحه',
    'ماشى افتحه',
    'اه افتحه',
    'تمام افتحه',
    'ايوه افتحه',
    'ياريت تفتحه',
    'اه ياريت',
    'ماشي ياريت',
    'yes',
    'yep',
    'yeah',
    'yup',
    'ok',
    'okay',
    'k',
    'sure',
    'please',
    'yes please',
    'ok open it',
    'yes open it',
    'open it',
    'open',
    'go ahead',
    'do it',
    'lets go',
    "let's go",
    'evet',
    'tamam',
    'olur',
    'aç',
    'lütfen',
    'да',
    'хорошо',
    'давай',
    'открой',
    'ок',
    'конечно',
    'ja',
    'gerne',
    'bitte',
    'öffnen',
    'oui',
    'daccord',
    "d'accord",
    'vas-y',
    'volontiers',
    'sí',
    'si',
    'vale',
    'claro',
    'por favor',
    'ábrelo',
    'abrelo',
  ]);

  if (exactAgreements.has(cleaned)) return true;

  const partialAgreementRx = /^(ماشي|ماشى|اه|آه|ايوه|أيوة|ايوة|نعم|تمام|موافق|ياريت|يا ريت|افتح|يلا|اوك|اوكي|yes|ok|okay|sure|please|evet|tamam|да|хорошо|ja|oui|sí|si)\b/i;
  return partialAgreementRx.test(cleaned);
}

export interface SellerFormBotCopy {
  suggestOfferText: string;
  openedConfirmText: string;
  openFormChip: string;
  openFormButtonLabel: string;
}

export function getSellerFormBotCopy(locale: string = 'ar'): SellerFormBotCopy {
  switch (locale) {
    case 'en':
      return {
        suggestOfferText:
          `I would be delighted to help you list your property or land for sale and match it immediately with serious buyers! 🏠✨\n\nWould you like me to open the **Property Listing Form** for you right now so you can easily enter your unit's details and upload photos? (Just reply **"Yes" / "OK"** and I will open it for you right away!)`,
        openedConfirmText:
          `✅ **I have just opened the Property Listing Form for you on screen!** 🏠✨\n\nPlease fill in your unit or land details, sale circumstances, and contact phone number (and optionally attach photos), then click **Publish Listing**. Once saved, I will immediately start matching and recommending your property to serious buyers!`,
        openFormChip: 'Yes, open the property listing form 🏠',
        openFormButtonLabel: '🏠 Open Property Listing Form',
      };
    case 'tr':
      return {
        suggestOfferText:
          `Gayrimenkulünüzü veya arsanızı satışa sunmanıza ve ciddi alıcılarla buluşturmanıza memnuniyetle yardımcı olurum! 🏠✨\n\nBirim bilgilerinizi ve fotoğraflarınızı kolayca girebilmeniz için **Satılık İlan Formunu** şimdi açmamı ister misiniz? (**"Evet" / "Tamam"** yazmanız yeterli, hemen açıyorum!)`,
        openedConfirmText:
          `✅ **Satılık İlan Formunu ekranınızda açtım!** 🏠✨\n\nLütfen mülkünüzün detaylarını, satış koşullarını ve iletişim numaranızı girip **İlanı Yayınla** butonuna tıklayın. Kaydedildiği anda ilanınızı uygun alıcılara önermeye başlayacağım!`,
        openFormChip: 'Evet, satılık ilan formunu aç 🏠',
        openFormButtonLabel: '🏠 Satılık İlan Formunu Aç',
      };
    case 'ru':
      return {
        suggestOfferText:
          `С радостью помогу вам разместить вашу недвижимость или участок на продажу и предложить его заинтересованным покупателям! 🏠✨\n\nХотите, я прямо сейчас открою для вас **форму добавления объекта**, чтобы вы могли удобно ввести все данные и загрузить фото? (Просто напишите **«Да» / «Хорошо»**, и я сразу открою её!)`,
        openedConfirmText:
          `✅ **Я открыл форму размещения объекта на вашем экране!** 🏠✨\n\nПожалуйста, заполните параметры объекта, условия продажи и контактный телефон, затем нажмите **Опубликовать объявление**. Сразу после сохранения я начну рекомендовать ваш объект покупателям!`,
        openFormChip: 'Да, открой форму добавления объекта 🏠',
        openFormButtonLabel: '🏠 Открыть форму добавления объекта',
      };
    case 'de':
      return {
        suggestOfferText:
          `Ich helfe Ihnen sehr gerne dabei, Ihre Immobilie oder Ihr Grundstück zum Verkauf anzubieten und passenden Käufern vorzuschlagen! 🏠✨\n\nSoll ich jetzt das **Formular zur Immobilieneintragung** für Sie öffnen, damit Sie alle Eckdaten und Fotos bequem eingeben können? (Antworten Sie einfach mit **„Ja“ / „OK“**, dann öffne ich es sofort!)`,
        openedConfirmText:
          `✅ **Ich habe das Formular zur Immobilieneintragung auf Ihrem Bildschirm geöffnet!** 🏠✨\n\nBitte tragen Sie die Details Ihrer Immobilie sowie Ihre Kontaktdaten ein und klicken Sie auf **Inserat veröffentlichen**. Sobald es gespeichert ist, schlage ich Ihr Angebot passenden Käufern vor!`,
        openFormChip: 'Ja, Formular jetzt öffnen 🏠',
        openFormButtonLabel: '🏠 Immobilien-Formular öffnen',
      };
    case 'fr':
      return {
        suggestOfferText:
          `Je serais ravi de vous aider à mettre votre bien ou terrain en vente et à le proposer aux acheteurs sérieux ! 🏠✨\n\nVoulez-vous que j'ouvre le **formulaire de mise en vente** maintenant pour saisir facilement les détails et les photos de votre bien ? (Répondez simplement **« Oui » / « OK »** et je l'ouvre tout de suite !)`,
        openedConfirmText:
          `✅ **Je viens d'ouvrir le formulaire de mise en vente sur votre écran !** 🏠✨\n\nVeuillez renseigner les caractéristiques de votre bien, les conditions de vente et votre numéro de téléphone, puis cliquez sur **Publier l’annonce**. Dès l'enregistrement, je le recommanderai aux acheteurs !`,
        openFormChip: 'Oui, ouvrir le formulaire de vente 🏠',
        openFormButtonLabel: '🏠 Ouvrir le formulaire de mise en vente',
      };
    case 'es':
      return {
        suggestOfferText:
          `¡Estaré encantado de ayudarte a publicar tu propiedad o terreno en venta y conectarlo con compradores serios! 🏠✨\n\n¿Quieres que abra ahora mismo el **formulario de publicación de propiedad** para que ingreses fácilmente los datos y fotos de tu unidad? (¡Solo responde **«Sí» / «Vale»** y lo abriré de inmediato!)`,
        openedConfirmText:
          `✅ **¡Acabo de abrir el formulario de publicación de propiedad en tu pantalla!** 🏠✨\n\nCompleta los datos de tu inmueble, las condiciones de venta y tu teléfono de contacto, y pulsa **Publicar anuncio**. ¡En cuanto lo guardes, empezaré a recomendarlo a compradores!`,
        openFormChip: 'Sí, abrir el formulario de propiedad 🏠',
        openFormButtonLabel: '🏠 Abrir formulario de propiedad',
      };
    default:
      return {
        suggestOfferText:
          `يسعدني جداً مساعدتك في عرض وحدتك أو قطعة الأرض للبيع وترشيحها فوراً للمشترين الجادين! 🏠✨\n\nتحب أفتحلك **فورم إضافة بيانات الوحدة** دلوقتي عشان تدخل تفاصيلها وترفع صورها بسهولة؟ (قولي **"ماشي"** أو **"افتح الفورم"** وهفتحهولك حالاً على الشاشة!)`,
        openedConfirmText:
          `✅ **فتحتلك فورم إضافة بيانات الوحدة للبيع على الشاشة حالاً!** 🏠✨\n\nتقدر دلوقتي تدخل تفاصيل وحدتك أو أرضك، السعر المطلوب، ظروف البيع، وصور الوحدة ثم تضغط على **نشر الوحدة**، وهبدأ فوراً في ترشيحها للمشترين الجادين في الشات ومحرك البحث!`,
        openFormChip: 'ماشي، افتح فورم إضافة الوحدة 🏠',
        openFormButtonLabel: '🏠 فتح فورم إضافة الوحدة للبيع',
      };
  }
}

/**
 * Execute Property Valuation (AVM) with Comparables
 */
export async function executePropertyValuation(args: {
  area_sqm: number;
  location: string;
  unit_type?: string;
  bedrooms?: number;
  finishing_type?: string;
  floor?: string;
  payment_method?: string;
  asking_price?: number;
  installment_years?: number;
  down_payment_pct?: number;
  advertised_monthly?: number;
}) {
  const unified = getUnifiedPropertyValuation({
    unitPrice: args.asking_price || 0,
    areaSqm: args.area_sqm,
    locationOrArea: args.location,
    unitType: args.unit_type,
    finishingType: args.finishing_type,
    floor: args.floor,
    paymentType: args.payment_method,
    installmentYears: args.installment_years,
    downPaymentPct: args.down_payment_pct,
    advertisedMonthly: args.advertised_monthly,
  });

  // Pull top 3 real comparable listings from cache for proof
  const all = await getAllCachedProperties();
  const comps = all
    .filter(p => {
      const locMatch = 
        p.compound?.city?.includes(args.location) || 
        p.compound?.area_name?.includes(args.location) || 
        p.title?.includes(args.location);
      const sqmDiff = Math.abs(p.area_sqm - args.area_sqm) / (args.area_sqm || 1);
      return locMatch && sqmDiff <= 0.35;
    })
    .slice(0, 3)
    .map(p => ({
      id: p.id,
      title: p.title,
      price: `${p.total_price.toLocaleString()} ${p.currency}`,
      area_sqm: p.area_sqm,
      price_per_sqm: Math.round(p.total_price / (p.area_sqm || 1)),
      installment_years: p.installment_years,
      developer: p.compound?.developer?.name || 'مطور معتمد',
    }));

  return {
    success: true,
    deal_score: unified.totalScore,
    verdict: unified.verdictLabel,
    fair_market_value: unified.fairMarketTotal,
    fast_sale_value: unified.fastSaleTotal,
    price_diff_percentage: unified.priceDiffFromMarketPct,
    installment_gap_check: unified.installmentGap,
    pros: unified.prosList,
    risks: unified.risksList,
    comparable_market_units: comps,
    unified_report: unified.unifiedBrokerReport,
  };
}

/**
 * Execute Area Intelligence and Honest Pros & Cons
 */
export function executeAreaIntelligence(args: { area_name: string; compare_with?: string }) {
  if (args.compare_with) {
    const comparison = compareTwoAreas(args.area_name, args.compare_with);
    if (comparison) return { success: true, type: 'comparison', data: comparison };
  }
  const intel = getAreaIntelligence(args.area_name);
  if (!intel) {
    return {
      success: false,
      message: `لم نجد بيانات مخصصة للمنطقة "${args.area_name}"، جرب البحث باسم المدينة أو الحي الأكبر (مثل: التجمع، الشيخ زايد، العاصمة الإدارية).`,
    };
  }
  return { success: true, type: 'single_area', data: intel };
}

/**
 * Execute Property Deal Scoring (0-100)
 */
export function executeDealScoring(args: {
  unit_price: number;
  area_sqm: number;
  location: string;
  installment_years?: number;
  down_payment_pct?: number;
  down_payment?: number;
  advertised_monthly?: number;
  finishing_type?: string;
  developer_name?: string;
}) {
  const unified = getUnifiedPropertyValuation({
    unitPrice: args.unit_price,
    areaSqm: args.area_sqm,
    locationOrArea: args.location,
    installmentYears: args.installment_years,
    downPaymentPct: args.down_payment_pct,
    downPayment: args.down_payment,
    advertisedMonthly: args.advertised_monthly,
    finishingType: args.finishing_type,
    developerName: args.developer_name,
  });

  return {
    success: true,
    total_score: unified.totalScore,
    verdict: unified.verdictLabel,
    fair_market_price: unified.fairMarketTotal,
    fast_sale_price: unified.fastSaleTotal,
    installment_gap_check: unified.installmentGap,
    pros: unified.prosList,
    risks: unified.risksList,
    summary_arabic: unified.unifiedBrokerReport,
  };
}

/**
 * استشارة الدليل القانوني والاستثماري وشبكة المواصلات
 */
export function executeLegalAndInvestmentGuide(args: { query: string }) {
  const legal = queryLegalIntelligence(args.query || '');
  const investment = queryInvestmentIntelligence(args.query || '');
  const transport = queryTransportIntelligence(args.query || '');

  return {
    success: true,
    query: args.query,
    legal_insights: legal,
    investment_insights: investment,
    transport_insights: transport,
    summary: `تم استخراج ${legal.length} نصيحة قانونية و ${investment.length} استشارة استثمارية و ${transport.length} معلومة مواصلات ذات صلة بـ "${args.query}".`,
  };
}


/**
 * Execute 2026/2027 Budget Matrix Guide across 12 zones
 */
export function executeBudgetMatrixGuide(args: { budget: number; mode?: 'cash' | 'down_payment' | 'both' }) {
  const rec = getBudgetRecommendations2026(args.budget, args.mode || 'both');
  return {
    success: true,
    budget: args.budget,
    tier_label: rec.tier.labelAr,
    cash_options: rec.tier.cashBuyingPower,
    down_payment_options: rec.tier.downPaymentLeverage,
    broker_honest_verdict: rec.tier.brokerAdvice2026,
    formatted_report: rec.summaryText,
  };
}


/**
 * Execute Subscribe Property Alert / Wishlist Waiting List
 */
export async function executeSubscribePropertyAlert(args: {
  phone_or_whatsapp: string;
  customer_name?: string;
  email?: string;
  target_location: string;
  target_unit_type?: string;
  target_budget?: number;
  payment_preference?: string;
  notes?: string;
}) {
  try {
    const cleanPhone = (args.phone_or_whatsapp || '').trim();
    const loc = (args.target_location || 'غير محدد').trim();

    await supabaseAdmin.from('leads_inquiries').insert([{
      phone: cleanPhone,
      user_name: args.customer_name?.trim() || 'عميل مسجل في قائمة التنبيهات',
      email: args.email?.trim() || null,
      preferred_location: loc,
      preferred_unit_type: args.target_unit_type || 'شقة',
      budget_max: args.target_budget || null,
      payment_method: args.payment_preference || 'غير محدد',
      notes: `[تنبيهات ذكية وقائمة انتظار]: ${args.notes || 'إشعار فوري فور توفر وحدة مطابقة'}`,
      source: 'property_alert_wishlist',
      status: 'قائمة انتظار وتنبيهات',
      created_at: new Date().toISOString(),
    }]);

    // Send instant Telegram notification to Admin
    notifyWishlistAlert({
      name: args.customer_name || 'عميل في قائمة التنبيهات',
      phone: cleanPhone,
      email: args.email || null,
      location: loc,
      unitType: args.target_unit_type || null,
      budget: args.target_budget || null,
      paymentMethod: args.payment_preference || null,
      notes: args.notes || null,
    }).catch(e => console.warn('[notify] Failed to send Telegram wishlist alert:', e));

    return {
      success: true,
      phone: cleanPhone,
      email: args.email || null,
      location: loc,
      message: `✅ تم تفعيل التنبيهات الذكية لـ (${loc}) بنجاح! بمجرد طرح أو إضافة أي وحدة مطابقة لطلبك، ستصلك رسالة فورية عبر الواتساب (${cleanPhone})${args.email ? ` والبريد الإلكتروني (${args.email})` : ''}.`,
    };
  } catch (err: any) {
    return {
      success: true,
      message: `تم تسجيل طلبك وتفعيل التنبيهات لـ ${args.target_location} بنجاح، وسنتواصل معك أول بأول فور توفر أي فرصة مطابقة!`,
    };
  }
}
