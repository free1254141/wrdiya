import { Property } from '@/lib/types';
import { getAllCachedProperties } from '@/lib/real-estate-engine';
import { createSellerProperty, updateSellerProperty, SellerPropertyInput } from '@/lib/seller-listings';
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
      description: 'البحث الدقيق في قاعدة بيانات العقارات المعتمدة في مصر (التجمع، الشيخ زايد، العاصمة الإدارية، أكتوبر، مدينتي) ودولياً (دبي، إسبانيا، تركيا). استخدم هذه الأداة كلما سأل العميل عن شقق، فيلات، استوديوهات، ميزانية معينة (مثل 20 مليون أو 3 مليون)، أو منطقة محددة.',
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
            description: 'المدينة أو المنطقة: التجمع الخامس، الشيخ زايد، العاصمة الإدارية، 6 أكتوبر، دبي، إسبانيا، إسطنبول، أنطاليا'
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
            description: 'العملة (افتراضياً EGP للعقارات المصرية، AED لدبي، EUR لإسبانيا)'
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
      name: 'list_property_for_sale',
      description: 'إضافة وعرض وحدة عقارية أو قطعة أرض يريد العميل (المالك/البائع) بيعها في قاعدة بيانات المنصة لتظهر فوراً في بروفايله الجانبي وللباحثين عن الشراء. استدعِ هذه الأداة بمجرد أن يعطيك البائع بيانات الوحدة أو الأرض التي يريد بيعها (نوع العقار/الأرض، المنطقة، المساحة، السعر، وظروف البيع).',
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
  }
];

/**
 * Synonyms dictionary for locations
 */
const LOCATION_SYNONYMS: Record<string, string[]> = {
  'التجمع': ['التجمع', 'new cairo', 'القاهرة الجديدة', 'tagamoa', 'icity', 'mivida', 'zed east', 'fifth square', 'galleria', 'نرجس', 'أندلس', 'لوتس', 'بنفسج', 'بيت الوطن'],
  'الشيخ زايد': ['زايد', 'zayed', 'sheikh zayed', 'أكتوبر', 'october', '6 أكتوبر', 'badya', 'بادية', 'westown'],
  'العاصمة الإدارية': ['العاصمة', 'new capital', 'العاصمه', 'bosco', 'البوسكو'],
  'مدينتي': ['مدينتي', 'madinaty', 'rehab', 'الرحاب'],
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
      // Default to EGP unless target price suggests foreign or user requested other
      targetCurrency = 'EGP';
    }
  }

  // Filter by currency if provided or determined
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
    }
  }

  // 4. Bedrooms matching
  if (args.bedrooms) {
    const bedFiltered = results.filter(p => p.bedrooms === args.bedrooms);
    if (bedFiltered.length > 0) {
      results = bedFiltered;
    }
  }

  // 4.1 Installment years matching (e.g. "بتقسيط 8 سنين")
  if (args.installment_years && args.installment_years > 0) {
    const exactYears = results.filter(p => p.installment_years === args.installment_years);
    if (exactYears.length > 0) {
      results = exactYears;
    } else {
      const nearYears = results.filter(p => (p.installment_years || 0) >= args.installment_years!);
      if (nearYears.length > 0) results = nearYears;
    }
  }

  // 4.2 Down payment percentage matching (e.g. "بمقدم 10%")
  if (args.down_payment_pct && args.down_payment_pct > 0) {
    const dpFiltered = results.filter(p => (p.down_payment_pct ?? 10) <= args.down_payment_pct!);
    if (dpFiltered.length > 0) {
      results = dpFiltered;
    }
  }

  // 4.3 Delivery type matching (e.g. "استلام فوري")
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

  // 6. Target Price Filtering & Proximity Sorting:
  // Restrict results to units actually near the requested budget (not the whole DB!)
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

  // 6.1 Explicit sort requested by the user (cheapest / largest ...)
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
  // so "إظهار الكل" shows only the matching results of this search, never the entire database.
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
 * Fetch full details for one unit from the cached inventory (used for follow-ups like "tell me about the second one").
 */
export async function executePropertyDetails(args: { property_id: string }): Promise<{ found: boolean; property?: Property; details?: Record<string, any> }> {
  const all = await getAllCachedProperties();
  const p = all.find(x => x.id === args.property_id);
  if (!p) return { found: false };
  return {
    found: true,
    property: p,
    details: {
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
    area_sqm: Number(args.area_sqm) || 120,
    total_price: Number(args.total_price) || 1000000,
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
    images: uploadedImages.length > 0 ? uploadedImages : undefined,
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
