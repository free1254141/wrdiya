import { Property, CompoundProject, Developer, PropertyFilter, SupportedLocale } from './types';
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

  // 3. Detect Unit Type
  if (q.includes('شقة') || q.includes('شقق') || q.includes('apartment') || q.includes('flat') || q.includes('daire') || q.includes('квартир') || q.includes('wohnung')) {
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

  return { intent, filter, rawQuery: query };
}

// In-Memory Runtime Cache: Vercel caches verified inventory from Supabase
let cachedProperties: Property[] | null = null;
let lastCacheTimestamp = 0;
const CACHE_TTL_MS = 3 * 60 * 1000; // 3 minutes cache for fresh live updates

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
      .order('featured', { ascending: false });

    if (error || !data) {
      console.error('Supabase property query error:', error);
      return cachedProperties || [];
    }

    cachedProperties = data as Property[];
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
    results = results.filter(p => p.unit_type.toLowerCase().includes(filter.unit_type!.toLowerCase()));
  }

  if (filter.max_price) {
    results = results.filter(p => p.total_price <= filter.max_price!);
  }

  if (filter.min_price) {
    results = results.filter(p => p.total_price >= filter.min_price!);
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
      'أكتوبر': ['أكتوبر', 'اكتوبر', 'october', 'زايد', 'zayed', 'badya', 'بادية'],
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

  return results;
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
    let text = '';

    if (isAr) {
      text = `وجدت لك **${count} ${count === 1 ? 'فرصة عقارية معتمدة ومطابقة' : 'فرص عقارية معتمدة ومطابقة'}** لطلبك في قاعدة بيانات العقارات الرسمية:\n\n`;
    } else if (isTr) {
      text = `Kriterlerinize uygun resmi veritabanında **${count} onaylı gayrimenkul fırsatı** bulundu:\n\n`;
    } else if (isRu) {
      text = `В официальной базе данных найдено **${count} проверенных объектов**, соответствующих вашему запросу:\n\n`;
    } else if (isDe) {
      text = `In der offiziellen Datenbank wurden **${count} verifizierte Immobilienangebote** gefunden:\n\n`;
    } else if (isFr) {
      text = `J'ai trouvé **${count} opportunités immobilières vérifiées** correspondant à vos critères :\n\n`;
    } else if (isEs) {
      text = `He encontrado **${count} oportunidades verificadas** en la base de datos oficial:\n\n`;
    } else {
      text = `I found **${count} verified propert${count === 1 ? 'y' : 'ies'}** matching your criteria in the official database:\n\n`;
    }

    topUnits.forEach((prop, idx) => {
      const devName = prop.compound?.developer?.name || (isAr ? 'مطور معتمد' : 'Verified Developer');
      const projectName = prop.compound?.name || (isAr ? 'مشروع سكني فاخر' : 'Luxury Development');
      const area = prop.compound?.area_name || (isAr ? 'موقع استراتيجي' : 'Prime Location');
      const curr = prop.currency || (isAr ? 'ج.م' : 'EGP');
      const affiliateLink = prop.affiliate_url || (prop.platform === 'TEKCE' ? AFFILIATE_CONFIG.tekce.homeUrl : AFFILIATE_CONFIG.aqarmap.expoUrl);

      if (isAr) {
        text += `### ${idx + 1}. ${prop.title}\n`;
        text += `📍 **الوجهة والمشروع**: ${projectName} — ${devName} (${area})\n`;
        text += `📐 **المساحة والتقسيم**: ${prop.area_sqm} م² (${prop.bedrooms} غرف نوم • ${prop.bathrooms} حمامات) — تشطيب: *${prop.finishing_type}*\n`;
        text += `💰 **السعر الإجمالي**: **${prop.total_price.toLocaleString('ar-EG')} ${curr}**\n`;
        text += `💳 **نظام السداد**: مقدم **${prop.down_payment_pct}%** (${prop.down_payment_amount.toLocaleString('ar-EG')} ${curr}) وتقسيط مريح على **${prop.installment_years} سنوات** (قسط شهري: **${prop.monthly_installment.toLocaleString('ar-EG')} ${curr}**)\n`;
        text += `🔑 **موعد الاستلام**: ${prop.delivery_date}\n`;
        text += `🌐 **رابط التفاصيل والحجز الرسمي**: [اضغط هنا لتصفح التفاصيل الرسمية وحجز الوحدة مباشرة](${affiliateLink})\n\n`;
      } else if (isTr) {
        text += `### ${idx + 1}. ${prop.title}\n`;
        text += `📍 **Proje ve Geliştirici**: ${projectName} — ${devName} (${area})\n`;
        text += `📐 **Alan ve Plan**: ${prop.area_sqm} m² (${prop.bedrooms} oda • ${prop.bathrooms} banyo) — Teslim: *${prop.finishing_type}*\n`;
        text += `💰 **Toplam Fiyat**: **${prop.total_price.toLocaleString('tr-TR')} ${curr}**\n`;
        text += `💳 **Ödeme Planı**: Peşinat **%${prop.down_payment_pct}** (${prop.down_payment_amount.toLocaleString('tr-TR')} ${curr}), **${prop.installment_years} yıl** vade (Aylık: **${prop.monthly_installment.toLocaleString('tr-TR')} ${curr}**)\n`;
        text += `🔑 **Teslim Tarihi**: ${prop.delivery_date}\n`;
        text += `🌐 **Resmi Detaylar ve Rezervasyon**: [Resmi detayları görüntülemek ve birimi ayırtmak için tıklayın](${affiliateLink})\n\n`;
      } else if (isRu) {
        text += `### ${idx + 1}. ${prop.title}\n`;
        text += `📍 **Проект и застройщик**: ${projectName} — ${devName} (${area})\n`;
        text += `📐 **Площадь и планировка**: ${prop.area_sqm} м² (${prop.bedrooms} комн. • ${prop.bathrooms} санузла) — Отделка: *${prop.finishing_type}*\n`;
        text += `💰 **Полная стоимость**: **${prop.total_price.toLocaleString('ru-RU')} ${curr}**\n`;
        text += `💳 **Условия рассрочки**: Первый взнос **${prop.down_payment_pct}%** (${prop.down_payment_amount.toLocaleString('ru-RU')} ${curr}), рассрочка на **${prop.installment_years} лет** (Ежемесячно: **${prop.monthly_installment.toLocaleString('ru-RU')} ${curr}**)\n`;
        text += `🔑 **Срок сдачи**: ${prop.delivery_date}\n`;
        text += `🌐 **Официальная информация и бронь**: [Нажмите здесь для перехода на официальную страницу объекта](${affiliateLink})\n\n`;
      } else if (isDe) {
        text += `### ${idx + 1}. ${prop.title}\n`;
        text += `📍 **Projekt & Bauträger**: ${projectName} — ${devName} (${area})\n`;
        text += `📐 **Fläche & Aufteilung**: ${prop.area_sqm} m² (${prop.bedrooms} Zi. • ${prop.bathrooms} Bäder) — Ausführung: *${prop.finishing_type}*\n`;
        text += `💰 **Gesamtpreis**: **${prop.total_price.toLocaleString('de-DE')} ${curr}**\n`;
        text += `💳 **Zahlungsplan**: Anzahlung **${prop.down_payment_pct}%** (${prop.down_payment_amount.toLocaleString('de-DE')} ${curr}), **${prop.installment_years} Jahre** Ratenzahlung (Monatlich: **${prop.monthly_installment.toLocaleString('de-DE')} ${curr}**)\n`;
        text += `🔑 **Übergabe**: ${prop.delivery_date}\n`;
        text += `🌐 **Offizielle Reservierung**: [Hier klicken für offizielle Details und Direktreservierung](${affiliateLink})\n\n`;
      } else if (isFr) {
        text += `### ${idx + 1}. ${prop.title}\n`;
        text += `📍 **Projet & Promoteur**: ${projectName} — ${devName} (${area})\n`;
        text += `📐 **Surface & Disposition**: ${prop.area_sqm} m² (${prop.bedrooms} ch. • ${prop.bathrooms} sdb) — Finition: *${prop.finishing_type}*\n`;
        text += `💰 **Prix total**: **${prop.total_price.toLocaleString('fr-FR')} ${curr}**\n`;
        text += `💳 **Plan de paiement**: Acompte **${prop.down_payment_pct}%** (${prop.down_payment_amount.toLocaleString('fr-FR')} ${curr}), échelonné sur **${prop.installment_years} ans** (Mensualité : **${prop.monthly_installment.toLocaleString('fr-FR')} ${curr}**)\n`;
        text += `🔑 **Date de livraison**: ${prop.delivery_date}\n`;
        text += `🌐 **Réservation officielle**: [Cliquez ici pour accéder aux détails officiels et réserver](${affiliateLink})\n\n`;
      } else if (isEs) {
        text += `### ${idx + 1}. ${prop.title}\n`;
        text += `📍 **Proyecto y Promotor**: ${projectName} — ${devName} (${area})\n`;
        text += `📐 **Superficie y Distribución**: ${prop.area_sqm} m² (${prop.bedrooms} dorm. • ${prop.bathrooms} baños) — Acabados: *${prop.finishing_type}*\n`;
        text += `💰 **Precio Total**: **${prop.total_price.toLocaleString('es-ES')} ${curr}**\n`;
        text += `💳 **Plan de pago**: Entrada **${prop.down_payment_pct}%** (${prop.down_payment_amount.toLocaleString('es-ES')} ${curr}) a **${prop.installment_years} años** (Mensual: **${prop.monthly_installment.toLocaleString('es-ES')} ${curr}**)\n`;
        text += `🔑 **Fecha de entrega**: ${prop.delivery_date}\n`;
        text += `🌐 **Reserva oficial**: [Haga clic aquí para consultar detalles oficiales y reservar directamente](${affiliateLink})\n\n`;
      } else {
        text += `### ${idx + 1}. ${prop.title}\n`;
        text += `📍 **Project & Developer**: ${projectName} — ${devName} (${area})\n`;
        text += `📐 **Area & Layout**: ${prop.area_sqm} sqm (${prop.bedrooms} beds • ${prop.bathrooms} baths) — Finishing: *${prop.finishing_type}*\n`;
        text += `💰 **Total Price**: **${prop.total_price.toLocaleString('en-US')} ${curr}**\n`;
        text += `💳 **Payment Plan**: Down Payment **${prop.down_payment_pct}%** (${prop.down_payment_amount.toLocaleString('en-US')} ${curr}) with **${prop.installment_years} years** installments (Monthly: **${prop.monthly_installment.toLocaleString('en-US')} ${curr}**)\n`;
        text += `🔑 **Delivery Date**: ${prop.delivery_date}\n`;
        text += `🌐 **Official Details & Booking**: [Click here to view official details and reserve directly](${affiliateLink})\n\n`;
      }
    });

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
