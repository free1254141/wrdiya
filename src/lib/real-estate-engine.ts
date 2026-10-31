import { Property, CompoundProject, Developer, PropertyFilter, SupportedLocale } from './types';
import { calculatePropertyDealScore } from './engine/deal-scoring';
import { createClient } from '@supabase/supabase-js';

// Server-side Supabase client using Service Role or Anon key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://csuifvyghfsibkrnxrby.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

// Official Partner & Affiliate Configurations (used internally for silent tracking links)
export const AFFILIATE_CONFIG = {
  aqarmap: {
    partnerCode: '759279',
    expoUrl: 'https://launches.aqarmap.com/ar/expos/saudi-projects?utm_source=partners&utm_medium=dynamic&utm_campaign=affiliate_759279&partner_code=759279',
    trackingSuffix: '?utm_source=partners&utm_medium=dynamic&utm_campaign=affiliate_759279&partner_code=759279'
  },
  tekce: {
    affiliateCode: '6FPC68983C',
    homeUrl: 'https://tekce.com?utm_source=taff&utm_medium=6FPC68983C',
    trackingSuffix: '?utm_source=taff&utm_medium=6FPC68983C'
  }
};

export interface QueryAnalysis {
  intent: 'search' | 'compare' | 'installment_calc' | 'compound_info' | 'booking_inquiry' | 'international' | 'general';
  filter: PropertyFilter;
  rawQuery: string;
}

/**
 * Robust Multilingual Natural Language Intent & Filter Extractor
 * Strictly extracts real search constraints to prevent hallucination.
 */
export function analyzeUserQuery(query: string): QueryAnalysis {
  const q = query.toLowerCase().trim();
  const filter: PropertyFilter = {};
  let intent: QueryAnalysis['intent'] = 'search';

  // 1. Detect Booking / Viewing / Contact Intent
  if (
    q.includes('معاينه') || q.includes('معاينة') || 
    q.includes('زيار') || q.includes('اشوف') || q.includes('أشوف') ||
    q.includes('احجز') || q.includes('أحجز') || q.includes('تواصل') ||
    q.includes('واتساب') || q.includes('رقم التليفون') || q.includes('مكالمه') || q.includes('مكالمة') ||
    q.includes('viewing') || q.includes('visit') || q.includes('book') || q.includes('contact') || q.includes('call') ||
    q.includes('randevu') || q.includes('просмотр') || q.includes('besichtigung') || q.includes('visite') || q.includes('visita')
  ) {
    intent = 'booking_inquiry';
  }

  // 2. Detect International Real Estate & Residency / Golden Visa Intent (TEKCE)
  if (
    q.includes('دبي') || q.includes('dubai') || q.includes('الامارات') || q.includes('الإمارات') || q.includes('uae') ||
    q.includes('تركيا') || q.includes('turkey') || q.includes('türkiye') || q.includes('турци') ||
    q.includes('اسطنبول') || q.includes('إسطنبول') || q.includes('istanbul') || q.includes('стамбул') || 
    q.includes('انطاليا') || q.includes('أنطاليا') || q.includes('antalya') || q.includes('анталья') || q.includes('alanya') || q.includes('ألانيا') ||
    q.includes('اسبانيا') || q.includes('إسبانيا') || q.includes('spain') || q.includes('испани') || q.includes('spanien') || q.includes('espagne') || q.includes('españa') ||
    q.includes('مالقة') || q.includes('مالقا') || q.includes('malaga') || q.includes('málaga') || q.includes('ماлага') || q.includes('marbella') || q.includes('ماربيا') ||
    q.includes('قبرص') || q.includes('cyprus') || q.includes('кипр') ||
    q.includes('جنسية') || q.includes('citizenship') || q.includes('vatandaşlık') || q.includes('гражданство') || 
    q.includes('إقامة ذهبية') || q.includes('golden visa') || q.includes('внж') ||
    q.includes('تيكتشي') || q.includes('tekce')
  ) {
    intent = 'international';
    filter.platform = 'TEKCE';

    // Extract specific international city/region
    if (q.includes('دبي') || q.includes('dubai') || q.includes('الامارات') || q.includes('الإمارات') || q.includes('uae')) {
      filter.location = 'دبي';
    } else if (q.includes('اسطنبول') || q.includes('إسطنبول') || q.includes('istanbul') || q.includes('стамбул')) {
      filter.location = 'إسطنبول';
    } else if (q.includes('انطاليا') || q.includes('أنطاليا') || q.includes('antalya') || q.includes('анталья') || q.includes('alanya') || q.includes('ألانيا')) {
      filter.location = 'أنطاليا';
    } else if (q.includes('مالقة') || q.includes('مالقا') || q.includes('malaga') || q.includes('málaga') || q.includes('marbella') || q.includes('ماربيا') || q.includes('اسبانيا') || q.includes('spain')) {
      filter.location = 'مالقة';
    } else if (q.includes('قبرص') || q.includes('cyprus')) {
      filter.location = 'قبرص';
    }
  }

  // 5. Detect Unit Type & Land
  if (q.includes('أرض') || q.includes('ارض') || q.includes('اراضي') || q.includes('أراضي') || q.includes('قطعة أرض') || q.includes('قطعه ارض') || q.includes('land')) {
    filter.unit_type = 'أرض';
  } else if (q.includes('شقة') || q.includes('شقق') || q.includes('apartment') || q.includes('flat') || q.includes('daire') || q.includes('квартир') || q.includes('wohnung')) {
    filter.unit_type = 'شقة';
  } else if (q.includes('فيلا') || q.includes('فيلات') || q.includes('villa') || q.includes('вилл')) {
    filter.unit_type = 'فيلا';
  } else if (q.includes('دوبلكس') || q.includes('duplex')) {
    filter.unit_type = 'دوبلكس';
  } else if (q.includes('تاون') || q.includes('townhouse')) {
    filter.unit_type = 'تاون هاوس';
  } else if (q.includes('استوديو') || q.includes('studio') || q.includes('студи')) {
    filter.unit_type = 'استوديو';
  } else if (q.includes('بنتهاوس') || q.includes('penthouse') || q.includes('пентхаус')) {
    filter.unit_type = 'بنتهاوس';
  } else if (q.includes('شاليه') || q.includes('شاليهات') || q.includes('chalet')) {
    filter.unit_type = 'شاليه';
  }

  // 5.1 Extract Numbers & Budget Range (e.g. "20 مليون", "3 مليون", "20M", "500 الف")
  const millionMatch = q.match(/(\d+(?:\.\d+)?)\s*(?:مليون|ملايين|مليونز|m\b)/i);
  const thousandMatch = q.match(/(\d+(?:\.\d+)?)\s*(?:ألف|الف|k\b)/i);
  const plainNumberMatch = q.match(/\b([1-9]\d{5,8})\b/);

  let extractedPrice: number | null = null;
  if (millionMatch) {
    extractedPrice = parseFloat(millionMatch[1]) * 1_000_000;
  } else if (thousandMatch) {
    extractedPrice = parseFloat(thousandMatch[1]) * 1_000;
  } else if (plainNumberMatch) {
    extractedPrice = parseInt(plainNumberMatch[1], 10);
  }

  if (extractedPrice) {
    if (q.includes('اقل من') || q.includes('أقل من') || q.includes('بحد اقصى') || q.includes('بحد أقصى') || q.includes('under') || q.includes('max')) {
      filter.max_price = extractedPrice;
      filter.target_price = extractedPrice;
    } else if (q.includes('اكثر من') || q.includes('أكثر من')) {
      filter.min_price = extractedPrice;
      filter.target_price = extractedPrice;
    } else {
      filter.target_price = extractedPrice;
    }
  }

  // 4. Detect Number of Bedrooms
  if (q.includes('3 غرف') || q.includes('3 نوم') || q.includes('ثلاث غرف') || q.includes('3 bed') || q.includes('3 rooms') || q.includes('3+1') || q.includes('3 комн')) {
    filter.bedrooms = 3;
  } else if (q.includes('2 غرف') || q.includes('2 نوم') || q.includes('غرفتين') || q.includes('2 bed') || q.includes('2 rooms') || q.includes('2+1') || q.includes('2 комн')) {
    filter.bedrooms = 2;
  } else if (q.includes('4 غرف') || q.includes('4 نوم') || q.includes('اربع غرف') || q.includes('4 bed') || q.includes('4 rooms') || q.includes('4+1') || q.includes('4 комн')) {
    filter.bedrooms = 4;
  } else if (q.includes('غرفة') || q.includes('1 نوم') || q.includes('1 bed') || q.includes('1+1') || q.includes('1 комн')) {
    filter.bedrooms = 1;
  }

  // 5. Detect Specific Egyptian Compound / Developer Mentions (Aqarmap)
  if (q.includes('ماونتن فيو') || q.includes('mountain view') || q.includes('اي سيتي') || q.includes('icity')) {
    filter.compound_name = 'ماونتن فيو';
    filter.platform = 'Aqarmap';
  } else if (q.includes('بادية') || q.includes('badya') || q.includes('بالم هيلز') || q.includes('palm hills')) {
    filter.compound_name = 'بادية';
    filter.platform = 'Aqarmap';
  } else if (q.includes('سوديك') || q.includes('sodic') || q.includes('فيليت') || q.includes('villette') || q.includes('وست تاون') || q.includes('westown')) {
    filter.compound_name = 'سوديك';
    filter.platform = 'Aqarmap';
  } else if (q.includes('البوسكو') || q.includes('bosco') || q.includes('مصر ايطاليا') || q.includes('misr italia')) {
    filter.compound_name = 'البوسكو';
    filter.platform = 'Aqarmap';
  } else if (q.includes('زد') || q.includes('zed') || q.includes('اورا') || q.includes('sawiris') || q.includes('ساويرس')) {
    filter.compound_name = 'زد';
    filter.platform = 'Aqarmap';
  } else if (q.includes('ميفيدا') || q.includes('mivida') || q.includes('اعمار') || q.includes('emaar')) {
    filter.compound_name = 'ميفيدا';
    filter.platform = 'Aqarmap';
  } else if (q.includes('مدينتي') || q.includes('madinaty') || q.includes('طلعت مصطفى') || q.includes('tmg')) {
    filter.compound_name = 'مدينتي';
    filter.platform = 'Aqarmap';
  }

  // 6. Detect Location / City / Area
  if (q.includes('التجمع') || q.includes('القاهرة الجديدة') || q.includes('new cairo') || q.includes('tagamoa')) {
    filter.location = 'التجمع';
    if (!filter.platform) filter.platform = 'Aqarmap';
  } else if (q.includes('زايد') || q.includes('الشيخ زايد') || q.includes('zayed') || q.includes('sheikh zayed')) {
    filter.location = 'الشيخ زايد';
    if (!filter.platform) filter.platform = 'Aqarmap';
  } else if (q.includes('العاصمة') || q.includes('العاصمة الإدارية') || q.includes('new capital')) {
    filter.location = 'العاصمة الإدارية';
    if (!filter.platform) filter.platform = 'Aqarmap';
  } else if (q.includes('اكتوبر') || q.includes('أكتوبر') || q.includes('october') || q.includes('6th of october')) {
    filter.location = 'أكتوبر';
    if (!filter.platform) filter.platform = 'Aqarmap';
  } else if (q.includes('مدينتي') || q.includes('madinaty') || q.includes('الرحاب') || q.includes('rehab')) {
    filter.location = 'القاهرة الجديدة';
    if (!filter.platform) filter.platform = 'Aqarmap';
  } else if (q.includes('الساحل') || q.includes('رأس الحكمة') || q.includes('راس الحكمة') || q.includes('مراسي') || q.includes('العلمين') || q.includes('north coast')) {
    filter.location = 'الساحل الشمالي';
    if (!filter.platform) filter.platform = 'Aqarmap';
  } else if (q.includes('السخنة') || q.includes('العين السخنة') || q.includes('الجلالة') || q.includes('sokhna')) {
    filter.location = 'العين السخنة';
    if (!filter.platform) filter.platform = 'Aqarmap';
  } else if (q.includes('المستقبل') || q.includes('الشروق') || q.includes('العبور') || q.includes('mostakbal') || q.includes('shorouk')) {
    filter.location = 'المستقبل سيتي';
    if (!filter.platform) filter.platform = 'Aqarmap';
  } else if (q.includes('الإسكندرية') || q.includes('الاسكندرية') || q.includes('اسكندرية') || q.includes('سموحة') || q.includes('alexandria')) {
    filter.location = 'الإسكندرية';
    if (!filter.platform) filter.platform = 'Aqarmap';
  } else if (q.includes('المعادي') || q.includes('مصر الجديدة') || q.includes('مدينة نصر') || q.includes('الزمالك') || q.includes('maadi') || q.includes('heliopolis')) {
    filter.location = 'المعادي';
    if (!filter.platform) filter.platform = 'Aqarmap';
  } else if (q.includes('مصر') || q.includes('egypt') || q.includes('القاهرة') || q.includes('cairo')) {
    if (!filter.platform) filter.platform = 'Aqarmap';
  }

  // 7. Detect Delivery Preference
  if (q.includes('فوري') || q.includes('جاهز') || q.includes('ready') || q.includes('immediate') || q.includes('hemen teslim') || q.includes('готово')) {
    filter.delivery_year = 'فوري';
  }

  // 8. Detect Installment / Down Payment Preference
  if (q.includes('تقسيط') || q.includes('قسط') || q.includes('installment') || q.includes('taksit') || q.includes('рассрочка') || q.includes('rate')) {
    intent = 'installment_calc';
  }

  // 9. Greeting / general chat — no property cards needed
  const greetingPattern = /^(هاي|هي|هايا|مرحبا|سلام|السلام|أهلا|اهلا|ازيك|كيف حالك|شكرا|ok|okay|تمام|oke|hi|hey|hello|good morning|good evening|bonjour|hola|ciao|merhaba|merhabalar|привет|здравствуй|danke|gracias|merci)[\s!.،,؟?]*$/i;
  if (greetingPattern.test(q.trim()) || (q.trim().length < 5 && Object.keys(filter).length === 0)) {
    intent = 'general';
  }

  return { intent, filter, rawQuery: query };
}

// In-Memory Runtime Cache: Vercel caches verified inventory from Supabase
let cachedProperties: Property[] | null = null;
let lastCacheTimestamp = 0;
const CACHE_TTL_MS = 3 * 60 * 1000; // 3 minutes cache for fresh live updates

export function invalidatePropertiesCache() {
  cachedProperties = null;
  lastCacheTimestamp = 0;
}

function hydrateSellerListing(raw: Property): Property {
  if (!raw || raw.platform !== 'SellerListing') return raw;
  const p: Property = { ...raw };
  let meta: Record<string, any> = {};
  if (typeof p.affiliate_url === 'string' && p.affiliate_url.trim().startsWith('{')) {
    try {
      meta = JSON.parse(p.affiliate_url);
    } catch {}
  }
  p.seller_user_id = meta.seller_user_id || undefined;
  p.seller_name = meta.seller_name || undefined;
  p.seller_phone = meta.seller_phone || undefined;
  p.location_text = meta.location_text || meta.area_name || meta.city || undefined;
  p.sale_circumstances = meta.sale_circumstances || undefined;
  p.affiliate_url = undefined;

  const city = meta.city || p.compound?.city || 'مصر';
  const areaName = meta.area_name || meta.location_text || p.compound?.area_name || city;
  p.compound = {
    id: p.project_id,
    developer_id: p.compound?.developer_id || '',
    name: meta.location_text ? `${meta.location_text} (${city})` : `عروض الملاك المباشرة — ${areaName}`,
    slug: p.compound?.slug || 'seller-direct-listing',
    country: p.compound?.country || 'Egypt',
    city,
    area_name: areaName,
    platform: 'SellerListing',
    description: meta.sale_circumstances
      ? `تفاصيل وظروف البيع من المالك مباشرة: ${meta.sale_circumstances}`
      : p.compound?.description || 'وحدة معروضة للبيع مباشرة من المالك عبر منصة سكنى بوت.',
    amenities: p.compound?.amenities?.length ? p.compound.amenities : ['معروض من المالك مباشرة', 'معاينة بالتنسيق المباشر'],
    delivery_year: p.compound?.delivery_year || new Date().getFullYear(),
    cover_image: p.images?.[0] || undefined,
    developer: {
      id: p.compound?.developer?.id || 'seller-direct',
      name: meta.seller_name ? `المالك: ${meta.seller_name}` : 'مالك مباشر (عروض الأفراد)',
      slug: 'direct-owner',
      phone: meta.seller_phone || undefined,
      whatsapp: meta.seller_phone || undefined,
      reputation_score: 4.9,
    },
  };
  return p;
}

/**
 * Fetch and cache all active properties from Supabase
 * Eliminates repetitive database joins and guarantees zero heavy processing on Vercel
 */
export async function getAllCachedProperties(forceRefresh = false): Promise<Property[]> {
  const now = Date.now();
  if (!forceRefresh && cachedProperties && (now - lastCacheTimestamp < CACHE_TTL_MS)) {
    return cachedProperties;
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('properties')
      .select(`
        *,
        compound:compounds_projects (
          id,
          name,
          slug,
          country,
          city,
          area_name,
          platform,
          description,
          amenities,
          delivery_year,
          cover_image,
          developer:developers (
            id,
            name,
            slug,
            logo_url,
            phone,
            whatsapp,
            reputation_score
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (error || !data) {
      console.error('Supabase property query error:', error);
      return cachedProperties || [];
    }

    cachedProperties = (data as Property[]).map(hydrateSellerListing);
    lastCacheTimestamp = now;
    return cachedProperties;
  } catch (err) {
    console.error('Failed to query properties:', err);
    return cachedProperties || [];
  }
}

/**
 * Filter properties from the cached Supabase inventory.
 * Instant zero-latency responses with 100% data grounding.
 */
export async function queryProperties(filter: PropertyFilter): Promise<Property[]> {
  const allProperties = await getAllCachedProperties();
  let results = [...allProperties];

  if (filter.bedrooms) {
    results = results.filter(p => p.bedrooms === filter.bedrooms);
  }

  if (filter.unit_type) {
    results = results.filter(p => (p.unit_type || '').toLowerCase().includes(filter.unit_type!.toLowerCase()));
  }

  // 2. Currency determination
  let targetCurrency = filter.currency;
  if (!targetCurrency) {
    if (filter.location) {
      const loc = filter.location.toLowerCase();
      if (loc.includes('دبي') || loc.includes('dubai')) {
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
    const currMatches = results.filter(p => p.currency === targetCurrency);
    if (currMatches.length > 0) {
      results = currMatches;
    }
  }

  if (filter.max_price) {
    results = results.filter(p => p.total_price <= filter.max_price!);
  }

  if (filter.min_price) {
    results = results.filter(p => p.total_price >= filter.min_price!);
  }

  // 3. Sort by closest to target_price if requested (e.g. 20 million or 3 million)
  if (filter.target_price && filter.target_price > 0) {
    const target = filter.target_price;
    results.sort((a, b) => {
      const diffA = Math.abs(a.total_price - target);
      const diffB = Math.abs(b.total_price - target);
      return diffA - diffB;
    });
  }

  if (filter.max_down_payment) {
    results = results.filter(p => p.down_payment_amount <= filter.max_down_payment!);
  }

  if (filter.platform) {
    results = results.filter(p => p.platform === filter.platform);
  }

  if (filter.country) {
    results = results.filter(p => p.compound?.country === filter.country);
  }

  if (filter.location) {
    const locLower = filter.location.toLowerCase();
    const locSynonyms: Record<string, string[]> = {
      'دبي': ['دبي', 'dubai', 'dxb', 'الإمارات', 'uae', 'business bay', 'palm jumeirah', 'creek'],
      'إسطنبول': ['إسطنبول', 'اسطنبول', 'istanbul', 'стамбул', 'esenyurt', 'bosphorus', 'ist-'],
      'أنطاليا': ['أنطاليا', 'انطاليا', 'antalya', 'анталья', 'alanya', 'ألانيا', 'ayt-'],
      'مالقة': ['مالقة', 'مالقا', 'malaga', 'málaga', 'marbella', 'ماربيا', 'spain', 'إسبانيا', 'اسبانيا', 'costa del sol', 'agp-'],
      'التجمع': ['التجمع', 'new cairo', 'القاهرة الجديدة', 'tagamoa', 'قاهرة جديدة', 'icity', 'mivida', 'zed east', 'fifth square'],
      'الشيخ زايد': ['زايد', 'zayed', 'sheikh zayed', 'أكتوبر', 'october', '6 أكتوبر', 'badya', 'بادية', 'westown'],
      'العاصمة الإدارية': ['العاصمة', 'new capital', 'العاصمه', 'البوسكو', 'bosco'],
      'أكتوبر': ['أكتوبر', 'اكتوبر', 'october', 'زايد', 'zayed', 'badya', 'بادية', 'حدائق أكتوبر'],
      'الساحل الشمالي': ['الساحل', 'north coast', 'رأس الحكمة', 'راس الحكمة', 'مراسي', 'marassi', 'هاسيندا', 'العلمين'],
      'العين السخنة': ['السخنة', 'سخنة', 'sokhna', 'الجلالة', 'galala', 'أزها'],
      'المستقبل سيتي': ['المستقبل', 'mostakbal', 'الشروق', 'shorouk', 'العبور', 'obour', 'سراي', 'بلوم فيلدز'],
      'الإسكندرية': ['الإسكندرية', 'الاسكندرية', 'اسكندرية', 'alexandria', 'سموحة', 'ستانلي'],
      'المعادي': ['المعادي', 'maadi', 'مصر الجديدة', 'heliopolis', 'مدينة نصر', 'nasr city', 'الزمالك'],
    };

    const synEntry = Object.entries(locSynonyms).find(([k]) => k.includes(filter.location!) || filter.location!.includes(k));
    const syns = synEntry ? synEntry[1] : [locLower];

    results = results.filter(p => {
      const targetStr = `${p.compound?.area_name || ''} ${p.compound?.city || ''} ${p.compound?.country || ''} ${p.compound?.name || ''} ${p.title || ''}`.toLowerCase();
      return syns.some(s => targetStr.includes(s.toLowerCase()));
    });
  }

  if (filter.developer_name) {
    results = results.filter(p => 
      p.compound?.developer?.name.includes(filter.developer_name!) ||
      p.title.includes(filter.developer_name!)
    );
  }

  if (filter.compound_name) {
    results = results.filter(p => 
      p.compound?.name.includes(filter.compound_name!) ||
      p.title.includes(filter.compound_name!)
    );
  }

  if (filter.delivery_year) {
    results = results.filter(p => p.delivery_date.includes(String(filter.delivery_year)) || p.delivery_date.includes('فوري'));
  }

  return results.map(enrichPropertyWithScore);
}

export function enrichPropertyWithScore(p: Property): Property {
  try {
    if (p.deal_score !== undefined) return p;
    const scoreResult = calculatePropertyDealScore({
      unitPrice: p.total_price,
      areaSqm: p.area_sqm,
      locationOrArea: p.compound?.city || p.compound?.area_name || p.location_text || p.title,
      paymentType: p.installment_years > 0 ? 'تقسيط' : 'كاش',
      downPaymentPct: p.down_payment_pct,
      installmentYears: p.installment_years,
      developerName: p.compound?.developer?.name,
      deliveryDateOrYears: p.delivery_date,
      finishingType: p.finishing_type,
    });
    return {
      ...p,
      deal_score: scoreResult.totalScore,
      deal_badge: scoreResult.verdictLabel,
      deal_color: scoreResult.badgeColor,
    };
  } catch {
    return p;
  }
}

/**
 * Get top featured opportunities from the cached inventory
 */
export async function getFeaturedOpportunities(): Promise<Property[]> {
  const all = await getAllCachedProperties();
  return all.filter(p => p.featured).slice(0, 6);
}

/**
 * Multilingual Grounded Real Estate Broker Output Formatter
 * Supports Arabic, English, Turkish, Russian, German, French, and Spanish
 */
export function formatGroundedBrokerResponse(
  userQuery: string,
  analysis: QueryAnalysis,
  matchedProperties: Property[],
  featuredFallbacks: Property[],
  locale: SupportedLocale = 'ar'
): { content: string; properties: Property[]; suggestedActions: string[] } {
  const count = matchedProperties.length;
  const isAr = locale === 'ar';
  const isTr = locale === 'tr';
  const isRu = locale === 'ru';
  const isDe = locale === 'de';
  const isFr = locale === 'fr';
  const isEs = locale === 'es';
  const isInternational = analysis.filter.platform === 'TEKCE' || analysis.intent === 'international';

  // Case 1: Matching Properties Found
  if (count > 0) {
    const topUnits = matchedProperties.slice(0, 4);
    const curr = topUnits[0].currency || (isAr ? 'ج.م' : 'EGP');
    const prices = topUnits.map(p => p.total_price).filter(p => p > 0);
    const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
    const installments = topUnits.map(p => p.installment_years || 7);
    const maxYears = Math.max(...installments);
    const monthlies = topUnits.map(p => p.monthly_installment).filter(m => m > 0);
    const minMonthly = monthlies.length > 0 ? Math.min(...monthlies) : 0;
    const downPcts = topUnits.map(p => p.down_payment_pct || 10);
    const minDown = Math.min(...downPcts);

    let text = '';

    if (isAr) {
      text = `أهلاً بك! وجدت لك **${count} فرصة عقارية معتمدة** مطابقة لطلبك في قاعدة البيانات الرسمية.\n\n` +
        `💰 **نظرة سريعة على الأسعار وأنظمة السداد:**\n` +
        `• تبدأ الأسعار من **${minPrice.toLocaleString('ar-EG')} ${curr}**\n` +
        `• مقدم يبدأ من **${minDown}%** وتقسيط مريح يصل حتى **${maxYears} سنوات** (أقساط شهرية تبدأ من **${Math.round(minMonthly).toLocaleString('ar-EG')} ${curr}**).\n\n` +
        `👇 **عرضت لك أبرز الوحدات في الكروت التفاعلية بالأسفل بكامل التفاصيل والصور وأرقام التواصل الرسمية:**`;
    } else if (isTr) {
      text = `Harika! Kriterlerinize uygun **${count} onaylı gayrimenkul fırsatı** bulundu.\n\n` +
        `💰 **Fiyat ve Ödeme Planı Özeti:**\n` +
        `• Fiyatlar **${minPrice.toLocaleString('tr-TR')} ${curr}** seviyesinden başlamaktadır.\n` +
        `• Peşinat **%${minDown}** ve **${maxYears} yıla varan** taksit imkanı.\n\n` +
        `👇 **Aşağıdaki kartlardan en popüler birimleri ve detaylarını inceleyebilirsiniz:**`;
    } else if (isRu) {
      text = `Здравствуйте! По вашему запросу найдено **${count} проверенных объектов** в официальной базе данных.\n\n` +
        `💰 **Кратко по ценам и условиям рассрочки:**\n` +
        `• Цены начинаются от **${minPrice.toLocaleString('ru-RU')} ${curr}**\n` +
        `• Первый взнос от **${minDown}%**, рассрочка до **${maxYears} лет**.\n\n` +
        `👇 **Ниже представлены интерактивные карточки с фото и деталями:**`;
    } else if (isDe) {
      text = `Hallo! Wir haben **${count} verifizierte Einheiten** gefunden, die zu Ihrer Anfrage passen.\n\n` +
        `💰 **Preis- und Ratenübersicht:**\n` +
        `• Preise ab **${minPrice.toLocaleString('de-DE')} ${curr}**\n` +
        `• Anzahlung ab **${minDown}%**, Laufzeit bis zu **${maxYears} Jahre**.\n\n` +
        `👇 **Die besten Optionen finden Sie direkt in den Karten unten:**`;
    } else if (isFr) {
      text = `Bonjour ! J'ai trouvé **${count} biens vérifiés** correspondant à votre recherche.\n\n` +
        `💰 **Aperçu des prix et financements :**\n` +
        `• Prix à partir de **${minPrice.toLocaleString('fr-FR')} ${curr}**\n` +
        `• Acompte dès **${minDown}%** avec paiement échelonné jusqu'à **${maxYears} ans**.\n\n` +
        `👇 **Découvrez les options clés ci-dessous avec photos et détails :**`;
    } else if (isEs) {
      text = `¡Hola! Hemos encontrado **${count} propiedades verificadas** para su búsqueda.\n\n` +
        `💰 **Resumen de precios y financiación:**\n` +
        `• Precios desde **${minPrice.toLocaleString('es-ES')} ${curr}**\n` +
        `• Entrada desde **${minDown}%** y financiación hasta **${maxYears} años**.\n\n` +
        `👇 **Consulte las unidades destacadas en las tarjetas a continuación:**`;
    } else {
      text = `Hello! I found **${count} verified properties** matching your request in the official database.\n\n` +
        `💰 **Pricing & Payment Overview:**\n` +
        `• Starting from **${minPrice.toLocaleString('en-US')} ${curr}**\n` +
        `• Down payment from **${minDown}%** with flexible installments up to **${maxYears} years** (monthly from **${Math.round(minMonthly).toLocaleString('en-US')} ${curr}**).\n\n` +
        `👇 **Explore top matching units in the interactive cards below with full photos & direct booking:**`;
    }

    const actionsAr = isInternational ? [
      'عقارات دبي المؤهلة للإقامة الذهبية',
      'شقق إسطنبول المناسبة للجنسية التركية',
      'عقارات إسبانيا وفيزا شنجن الأوروبية',
      'تحدث مع مستشار الاستثمار الدولي عبر واتساب'
    ] : [
      'احسبلي القسط لو زودت المقدم لـ 20%',
      'عايز وحدات استلام فوري جاهزة للسكن',
      'طلب موعد معاينة في المشروع',
      'أفضل كمبوندات التجمع الخامس بتقسيط 8 سنين'
    ];

    const actionsEn = isInternational ? [
      'Dubai properties eligible for Golden Visa',
      'Istanbul units eligible for Turkish Citizenship',
      'Spain coastal properties with Schengen access',
      'Chat with international broker via WhatsApp'
    ] : [
      'Calculate monthly installment with 20% down payment',
      'Show ready-to-move units available now',
      'Schedule an on-site project viewing',
      'Best New Cairo compounds with 8-year installments'
    ];

    return { content: text, properties: topUnits, suggestedActions: isAr ? actionsAr : actionsEn };
  }

  // Case 2: Zero Match (Strict Anti-Hallucination Fallback)
  let text = isAr 
    ? `⚠️ **لم أجد وحدات مطابقة تماماً لهذه الشروط المحددة** في قاعدة البيانات الحالية.\n\nحرصاً على الشفافية وعدم إعطائك أي أرقام غير معتمدة، نعتمد حصرياً على قوائم الأسعار الرسمية.\n\n✨ **إليك أبرز الفرص المعتمدة المتاحة حالياً**:`
    : `⚠️ **No exact units found matching these exact criteria** in the verified records.\n\nTo ensure complete accuracy, we rely strictly on accredited developer inventory.\n\n✨ **Here are top verified opportunities currently available**:`;

  // Grounded fallbacks scoped strictly by target platform
  const targetPlatform = isInternational ? 'TEKCE' : 'Aqarmap';
  const platformFallbacks = featuredFallbacks.filter(p => p.platform === targetPlatform);
  const fallbackUnits = (platformFallbacks.length > 0 ? platformFallbacks : featuredFallbacks).slice(0, 3);
  const actionsAr = [
    'مشاريع معارض عقارماب الحصرية',
    'فرص الاستثمار الدولي في دبي وتركيا',
    'شقق التجمع الخامس بتقسيط 8 سنين',
    'تواصل مع وسيط عقاري معتمد عبر واتساب'
  ];

  const actionsEn = [
    'Exclusive accredited expo projects',
    'International Dubai & Turkey investment units',
    'New Cairo apartments with 8-year installments',
    'Connect with a verified broker on WhatsApp'
  ];

  return {
    content: text,
    properties: fallbackUnits,
    suggestedActions: isAr ? actionsAr : actionsEn
  };
}
