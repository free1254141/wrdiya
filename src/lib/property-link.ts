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
 * Returns the exact direct destination URL for a property:
 * - Direct WhatsApp conversation for Seller Listings
 * - TEKCE direct affiliate URL for international properties
 * - Direct Aqarmap listing URL (with partner params) if available
 * - Direct targeted search URL on Aqarmap showing this exact compound
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

  // b) TEKCE International Properties
  if (property.platform === 'TEKCE') {
    return property.affiliate_url || `https://tekce.com?utm_source=taff&utm_medium=${TEKCE_PARTNER_CODE}`;
  }

  const affiliateUrl = property.affiliate_url || '';

  // c) Direct Aqarmap Listing (e.g. /ar/listing/... or /en/listing/...)
  if (
    affiliateUrl.startsWith('https://aqarmap.com.eg/ar/listing/') ||
    affiliateUrl.startsWith('https://aqarmap.com.eg/en/listing/')
  ) {
    return attachAqarmapPartnerParams(affiliateUrl);
  }

  // Already a targeted search URL on Aqarmap
  if (
    affiliateUrl.startsWith('https://aqarmap.com.eg/ar/for-sale/property/all/egypt/') &&
    affiliateUrl.includes('searchQuery=')
  ) {
    return attachAqarmapPartnerParams(affiliateUrl);
  }

  // d) Targeted search for compound on Aqarmap:
  // Instead of generic 2,054 compounds directory (/ar/compounds/), jump straight to listings in this exact compound
  const cleanQuery = extractCleanCompoundQuery(property.title, property.compound?.name);
  return `https://aqarmap.com.eg/ar/for-sale/property/all/egypt/?default=false&searchQuery=${encodeURIComponent(
    cleanQuery
  )}&utm_source=partners&utm_medium=dynamic&utm_campaign=affiliate_${AQARMAP_PARTNER_CODE}&partner_code=${AQARMAP_PARTNER_CODE}`;
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
