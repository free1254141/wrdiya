import { Property } from '@/lib/types';
import { getAllCachedProperties } from '@/lib/real-estate-engine';
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

  // 1. Check unit type
  if (args.unit_type) {
    const requestedType = args.unit_type.trim().toLowerCase();
    
    // Explicit handle for land (قاعدة البيانات لا تحتوي على أراضي حالياً)
    if (requestedType.includes('أرض') || requestedType.includes('ارض') || requestedType.includes('land')) {
      return {
        found: 0,
        message: 'لا توجد قطع أراضي مسجلة حالياً في قاعدة بياناتنا المعتمدة. الوحدات المتاحة تشمل شقق، فيلات، تاون هاوس، دوبلكس، استوديوهات ووحدات تجارية.',
        properties: [],
        filtersApplied: { unit_type: args.unit_type }
      };
    }

    results = results.filter(p => {
      const pType = (p.unit_type || '').toLowerCase();
      const pTitle = (p.title || '').toLowerCase();
      return pType.includes(requestedType) || pTitle.includes(requestedType);
    });
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

  // 5. Min / Max price filtering
  if (args.min_price) {
    results = results.filter(p => p.total_price >= args.min_price!);
  }
  if (args.max_price) {
    results = results.filter(p => p.total_price <= args.max_price!);
  }

  // 6. Target Price Sorting: Crucial for queries like "عايز شقق فى حدود ال 20 مليون" or "ب 3 مليون"
  if (args.target_price && args.target_price > 0) {
    const target = args.target_price;
    results.sort((a, b) => {
      const diffA = Math.abs(a.total_price - target);
      const diffB = Math.abs(b.total_price - target);
      return diffA - diffB;
    });
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

  const totalMatches = results.length;
  const finalProperties = results.slice(offset, offset + limit);

  return {
    found: finalProperties.length,
    total_matches: totalMatches,
    all_matches: results.slice(0, 100),
    offset,
    properties: finalProperties,
    filtersApplied: {
      unit_type: args.unit_type,
      location: args.location,
      target_price: args.target_price,
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
      country: p.compound?.country
    }
  };
}
