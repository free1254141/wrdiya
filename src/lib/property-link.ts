import { Property } from '@/lib/types';

export const AQARMAP_PARTNER_CODE = '759279';
export const TEKCE_PARTNER_CODE = '6FPC68983C';

export const AQARMAP_PARTNER_PARAMS = {
  utm_source: 'partners',
  utm_medium: 'dynamic',
  utm_campaign: `affiliate_${AQARMAP_PARTNER_CODE}`,
  partner_code: AQARMAP_PARTNER_CODE,
};

/**
 * Safely attach Aqarmap affiliate partner tracking params to any URL.
 */
export function attachAqarmapPartnerParams(urlStr: string): string {
  if (!urlStr) return '';
  try {
    const url = new URL(urlStr);
    for (const [k, v] of Object.entries(AQARMAP_PARTNER_PARAMS)) {
      url.searchParams.set(k, v);
    }
    return url.toString();
  } catch {
    const sep = urlStr.includes('?') ? '&' : '?';
    const qs = new URLSearchParams(AQARMAP_PARTNER_PARAMS).toString();
    return `${urlStr}${sep}${qs}`;
  }
}

/**
 * Extracts a clean, targeted compound query from property title or compound name.
 * Strips developer names (e.g. '| اي جي اي ريل استيت'), locations after ' - ',
 * and boilerplate prefixes (e.g. 'شقة في كمبوند', 'فيلا في كمبوند', 'مكتب في كمبوند', etc.)
 * while preserving the essential compound name prefixed by 'كمبوند'.
 */
export function extractCleanCompoundQuery(title?: string, compoundName?: string): string {
  let text = (title || '').trim();

  // 1. Strip developer after '|' (e.g. '| اي جي اي ريل استيت')
  if (text.includes('|')) {
    text = text.split('|')[0].trim();
  }

  // 2. Strip location after ' - ' (space dash space)
  if (text.includes(' - ')) {
    const parts = text.split(' - ');
    text = parts[0].trim();
  }

  // 3. Strip boilerplate prefixes like 'شقة في كمبوند', 'فيلا في كمبوند', etc.
  const boilerplatePrefixes = [
    /^(شقة|فيلا|مكتب|دوبلكس|بنتهاوس|تاون هاوس|توين هاوس|شاليه|تجاري|محل|عيادة|صيدلية|استوديو|وحدة|ارض|أرض|مقر اداری|مقر إداري)\s+(للبيع\s+)?(في|فى)\s+(كمبوند\s+)?/i,
    /^(شقة|فيلا|مكتب|دوبلكس|بنتهاوس|تاون هاوس|توين هاوس|شاليه|تجاري|محل|عيادة|صيدلية|استوديو|وحدة|ارض|أرض)\s+(للبيع\s+)?/i,
    /^(للبيع\s+في|للبيع\s+فى)\s+(كمبوند\s+)?/i,
  ];

  let cleaned = text;
  const hadCompound = text.includes('كمبوند');

  for (const rx of boilerplatePrefixes) {
    if (rx.test(cleaned)) {
      cleaned = cleaned.replace(rx, '').trim();
      break;
    }
  }

  // Ensure "كمبوند" prefix for targeted compound search
  if (!cleaned.startsWith('كمبوند') && (hadCompound || (compoundName && compoundName.includes('كمبوند')))) {
    cleaned = `كمبوند ${cleaned}`.trim();
  } else if (!cleaned.startsWith('كمبوند') && cleaned.length > 0) {
    cleaned = `كمبوند ${cleaned}`.trim();
  }

  // Fallback if cleaned text is missing or too short
  if (!cleaned || cleaned.length < 3) {
    if (compoundName && compoundName.trim().length >= 3) {
      cleaned = compoundName.startsWith('كمبوند') ? compoundName.trim() : `كمبوند ${compoundName.trim()}`;
    } else {
      cleaned = (text || title || '').trim();
    }
  }

  return cleaned.trim();
}

/**
 * Safely extracts a direct Nawy unit ID from image URLs if present:
 * e.g. /unlockedProperties/137072/... or /property_image/image/137072/...
 */
export function extractDirectNawyId(images?: string[]): string | null {
  if (!images || images.length === 0) return null;
  for (const img of images) {
    if (!img || typeof img !== 'string') continue;
    const m1 = img.match(/\/unlockedProperties\/(\d+)\//);
    if (m1 && m1[1]) return m1[1];
    const m2 = img.match(/\/property_image\/image\/(\d+)\//);
    if (m2 && m2[1]) return m2[1];
  }
  return null;
}

/**
 * Returns portal branding details for displaying on buttons and chips
 */
export function getPropertyPortalBrand(property: Property): {
  nameAr: string;
  nameEn: string;
  buttonLabelAr: string;
  buttonLabelEn: string;
} {
  if (!property) {
    return {
      nameAr: 'الموقع الرسمي',
      nameEn: 'Official Portal',
      buttonLabelAr: 'الموقع الرسمي ↗',
      buttonLabelEn: 'Official Portal ↗',
    };
  }

  if (property.platform === 'SellerListing') {
    return {
      nameAr: 'واتساب المالك',
      nameEn: 'Owner WhatsApp',
      buttonLabelAr: 'واتساب المالك ↗',
      buttonLabelEn: 'Owner WhatsApp ↗',
    };
  }

  const u = property.affiliate_url || '';
  if (u.includes('aqarmap.com.eg/ar/listing/') || u.includes('aqarmap.com.eg/en/listing/')) {
    return {
      nameAr: 'عقارماب',
      nameEn: 'Aqarmap',
      buttonLabelAr: 'فتح الإعلان على عقارماب ↗',
      buttonLabelEn: 'View on Aqarmap ↗',
    };
  }

  return {
    nameAr: 'الموقع الرسمي',
    nameEn: 'Official Listing',
    buttonLabelAr: 'الموقع الرسمي للإعلان ↗',
    buttonLabelEn: 'Official Listing ↗',
  };
}

/**
 * Returns the exact direct destination URL for a property:
 * - Direct WhatsApp conversation for Seller Listings
 * - Direct Aqarmap listing URL (with partner params) if available
 * - Exact canonical Nawy unit/compound listing URL
 * - Guaranteed NEVER to return generic 210,000 listings or 2,054 compounds directory!
 */
export function getDirectPropertyUrl(property: Property): string {
  if (!property) return '';

  // a) Seller Listings -> Direct WhatsApp conversation with owner
  if (property.platform === 'SellerListing') {
    if (property.seller_phone) {
      let phoneDigits = property.seller_phone.replace(/[^0-9]/g, '');
      if (phoneDigits.startsWith('0') && phoneDigits.length === 11) {
        phoneDigits = `2${phoneDigits}`;
      }
      const msg = encodeURIComponent(`مرحباً، بخصوص إعلان وحدتك المعروضة للبيع على منصة سكنى بوت: ${property.title || ''}`);
      return `https://wa.me/${phoneDigits}?text=${msg}`;
    }
    return '';
  }

  const affiliateUrl = property.affiliate_url || '';

  // b) Direct Aqarmap Listing (e.g. /ar/listing/... or /en/listing/...)
  // This lands directly on the exact listing page without any redirect
  if (
    affiliateUrl.startsWith('https://aqarmap.com.eg/ar/listing/') ||
    affiliateUrl.startsWith('https://aqarmap.com.eg/en/listing/')
  ) {
    return attachAqarmapPartnerParams(affiliateUrl);
  }

  // c) Direct canonical Nawy unit or compound link
  if (
    affiliateUrl.includes('nawy.com/compound/') ||
    affiliateUrl.includes('nawy.com/ar/compound/') ||
    affiliateUrl.includes('nawy.com/ar/search')
  ) {
    // If it's a broken aqarmap search query that was mistakenly in affiliate_url, skip it
    if (!affiliateUrl.includes('for-sale/property/all/egypt')) {
      return affiliateUrl;
    }
  }

  // d) Extract direct unit ID from S3 image CDN path if present
  const nawyId = extractDirectNawyId(property.images);
  if (nawyId) {
    return `https://www.nawy.com/ar/compound/any/property/${nawyId}`;
  }

  // e) If affiliateUrl already has a valid direct nawy URL
  if (affiliateUrl.includes('nawy.com') && !affiliateUrl.includes('for-sale/property/all/egypt')) {
    return affiliateUrl;
  }

  // f) For compound properties: Link to the compound page or search
  if (property.compound?.slug) {
    return `https://www.nawy.com/ar/compound/${property.compound.slug}`;
  }

  const cleanQuery = extractCleanCompoundQuery(property.title, property.compound?.name);
  if (cleanQuery && cleanQuery.length > 2) {
    const cleanComp = cleanQuery.replace(/^كمبوند\s+/, '').trim();
    return `https://www.nawy.com/ar/search?query=${encodeURIComponent(cleanComp)}`;
  }

  // Fallback: Google search targeting the exact ad and project, NEVER generic Aqarmap 210,000 index
  return `https://www.google.com/search?q=${encodeURIComponent(`${property.title || ''} إعلان عقار للبيع`)}`;
}

/**
 * Returns a fallback direct Google search URL for the compound on Aqarmap
 */
export function getDirectPropertySearchFallback(property: Property): string {
  if (!property) return 'https://www.google.com';
  const compoundOrTitle = extractCleanCompoundQuery(property.title, property.compound?.name) || property.title || '';
  const searchTerms = compoundOrTitle.startsWith('كمبوند') ? compoundOrTitle : `كمبوند ${compoundOrTitle}`;
  return `https://www.google.com/search?q=${encodeURIComponent(`${searchTerms} عقارماب`)}`;
}
