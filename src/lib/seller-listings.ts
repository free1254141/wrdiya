import { createClient } from '@supabase/supabase-js';
import { Property } from './types';
import { invalidatePropertiesCache } from './real-estate-engine';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://csuifvyghfsibkrnxrby.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});

export interface SellerPropertyInput {
  owner_id: string;
  title?: string;
  unit_type: string; // 'شقة' | 'أرض' | 'فيلا مستقلة' | 'تاون هاوس' | 'دوبلكس' | 'استوديو' | 'تجاري'
  city?: string;
  area_name?: string;
  location_text?: string;
  area_sqm: number;
  bedrooms?: number;
  bathrooms?: number;
  finishing_type?: string;
  total_price: number;
  currency?: string;
  down_payment_pct?: number;
  installment_years?: number;
  delivery_date?: string;
  status?: string;
  images?: string[];
  seller_name?: string;
  seller_phone?: string;
  sale_circumstances?: string;
}

const DEFAULT_IMAGES_BY_TYPE: Record<string, string[]> = {
  أرض: [
    'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80',
  ],
  فيلا: [
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
  ],
  شقة: [
    'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80',
  ],
};

function pickDefaultImages(unitType: string): string[] {
  const t = (unitType || '').toLowerCase();
  if (t.includes('أرض') || t.includes('ارض') || t.includes('land')) return DEFAULT_IMAGES_BY_TYPE['أرض'];
  if (t.includes('فيلا') || t.includes('تاون') || t.includes('villa')) return DEFAULT_IMAGES_BY_TYPE['فيلا'];
  return DEFAULT_IMAGES_BY_TYPE['شقة'];
}

/**
 * Unpack seller metadata stored in `affiliate_url` when `platform === 'SellerListing'`.
 */
export function enrichSellerProperty(raw: Property): Property {
  if (!raw || raw.platform !== 'SellerListing') return raw;
  const p: Property = { ...raw };
  let meta: Record<string, any> = {};
  if (typeof p.affiliate_url === 'string' && p.affiliate_url.trim().startsWith('{')) {
    try {
      meta = JSON.parse(p.affiliate_url);
    } catch {
      meta = {};
    }
  }
  const ownerFromCode = typeof p.partner_code === 'string' && p.partner_code.startsWith('seller:')
    ? p.partner_code.slice('seller:'.length)
    : undefined;

  p.seller_user_id = meta.seller_user_id || ownerFromCode;
  p.seller_name = meta.seller_name || undefined;
  p.seller_phone = meta.seller_phone || undefined;
  p.location_text = meta.location_text || meta.area_name || meta.city || undefined;
  p.sale_circumstances = meta.sale_circumstances || undefined;
  p.affiliate_url = undefined; // prevent UI from treating JSON metadata as an external URL

  const city = meta.city || p.compound?.city || 'مصر';
  const areaName = meta.area_name || meta.location_text || p.compound?.area_name || city;
  const compoundTitle = meta.location_text
    ? `${meta.location_text} (${city})`
    : `عروض الملاك المباشرة — ${areaName}`;

  p.compound = {
    id: p.project_id,
    developer_id: p.compound?.developer_id || '',
    name: compoundTitle,
    slug: p.compound?.slug || 'seller-direct-listing',
    country: p.compound?.country || 'Egypt',
    city,
    area_name: areaName,
    platform: 'SellerListing',
    description: meta.sale_circumstances
      ? `تفاصيل وظروف البيع من المالك مباشرة: ${meta.sale_circumstances}`
      : p.compound?.description || 'وحدة معروضة للبيع مباشرة من المالك عبر منصة سكنى بوت.',
    amenities: p.compound?.amenities?.length
      ? p.compound.amenities
      : ['معروض من المالك مباشرة', 'معاينة بالتنسيق المباشر'],
    delivery_year: p.compound?.delivery_year || new Date().getFullYear(),
    cover_image: p.images?.[0] || p.compound?.cover_image,
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

async function resolveProjectIdForCity(city?: string, area?: string): Promise<string> {
  const { data: allCompounds } = await supabaseAdmin
    .from('compounds_projects')
    .select('id, city, area_name')
    .limit(30);

  if (allCompounds && allCompounds.length > 0) {
    const searchStr = `${city || ''} ${area || ''}`.toLowerCase();
    const matched = allCompounds.find(
      (c) =>
        (c.city && searchStr.includes(c.city.toLowerCase())) ||
        (c.area_name && searchStr.includes(c.area_name.toLowerCase()))
    );
    return (matched || allCompounds[0]).id;
  }
  return 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
}

export async function createSellerProperty(input: SellerPropertyInput): Promise<Property | null> {
  const ownerId = (input.owner_id || 'guest_seller').trim();
  const unitType = (input.unit_type || 'شقة').trim();
  const isLand = unitType.includes('أرض') || unitType.includes('ارض') || unitType.toLowerCase().includes('land');
  const city = (input.city || input.location_text || 'القاهرة الجديدة').trim();
  const areaName = (input.area_name || input.location_text || city).trim();
  const locationText = (input.location_text || `${areaName} - ${city}`).trim();
  const areaSqm = Math.max(Number(input.area_sqm) || 100, 10);
  const totalPrice = Math.max(Number(input.total_price) || 1_000_000, 1000);
  const currency = (input.currency || 'EGP').toUpperCase();

  const years = input.installment_years !== undefined ? Math.max(Number(input.installment_years), 0) : 0;
  const dpPct = years > 0
    ? Math.min(Math.max(Number(input.down_payment_pct ?? 20), 0), 100)
    : 100;
  const dpAmount = Math.round((totalPrice * dpPct) / 100);
  const remaining = Math.max(0, totalPrice - dpAmount);
  const monthly = years > 0 ? Math.round(remaining / (years * 12)) : 0;
  const quarterly = years > 0 ? Math.round(remaining / (years * 4)) : 0;

  const autoTitle = input.title?.trim()
    ? input.title.trim()
    : `${unitType} للبيع ${areaSqm} م² في ${locationText}`;

  const projectId = await resolveProjectIdForCity(city, areaName);
  const cleanImages = (input.images || []).map((u) => u.trim()).filter(Boolean);

  const meta = {
    seller_user_id: ownerId,
    seller_name: input.seller_name?.trim() || undefined,
    seller_phone: input.seller_phone?.trim() || undefined,
    location_text: locationText,
    city,
    area_name: areaName,
    sale_circumstances: input.sale_circumstances?.trim() || undefined,
  };

  const payload = {
    project_id: projectId,
    title: autoTitle,
    unit_type: isLand ? 'أرض' : unitType,
    bedrooms: isLand ? 0 : Math.max(Number(input.bedrooms ?? 2), 0),
    bathrooms: isLand ? 0 : Math.max(Number(input.bathrooms ?? 1), 0),
    area_sqm: areaSqm,
    finishing_type: input.finishing_type?.trim() || (isLand ? 'أرض فضاء مرخصة' : 'تشطيب كامل'),
    total_price: totalPrice,
    currency,
    down_payment_pct: dpPct,
    down_payment_amount: dpAmount,
    installment_years: years,
    monthly_installment: monthly,
    quarterly_installment: quarterly,
    delivery_date: input.delivery_date?.trim() || 'استلام فوري',
    status: input.status?.trim() || 'متاح',
    images: cleanImages.length > 0 ? cleanImages : pickDefaultImages(unitType),
    featured: true,
    roi_expected_pct: isLand ? 18.0 : 14.5,
    platform: 'SellerListing',
    partner_code: `seller:${ownerId}`,
    affiliate_url: JSON.stringify(meta),
  };

  const { data, error } = await supabaseAdmin
    .from('properties')
    .insert([payload])
    .select('*')
    .single();

  if (error || !data) {
    console.error('[SellerListings] Failed to insert seller property:', error);
    return null;
  }

  // Also record in leads_inquiries for CRM follow-up if phone is provided
  if (input.seller_phone) {
    try {
      await supabaseAdmin.from('leads_inquiries').insert([{
        user_name: input.seller_name || 'مالك عقار عارض للبيع',
        phone: input.seller_phone,
        preferred_location: locationText,
        preferred_unit_type: unitType,
        budget_max: totalPrice,
        payment_method: years > 0 ? `تقسيط ${years} سنوات` : 'كاش',
        property_id: data.id,
        notes: `عرض بيع وحدة/أرض جديدة (${autoTitle}) — ظروف البيع: ${input.sale_circumstances || 'لم يحدد'}`,
        source: 'seller_listing',
        status: 'جديد',
      }]);
    } catch {}
  }

  invalidatePropertiesCache();
  return enrichSellerProperty(data as Property);
}

export async function updateSellerProperty(
  propertyId: string,
  ownerId: string,
  patch: Partial<SellerPropertyInput>
): Promise<Property | null> {
  const { data: existing, error: fetchErr } = await supabaseAdmin
    .from('properties')
    .select('*')
    .eq('id', propertyId)
    .maybeSingle();

  if (fetchErr || !existing) return null;

  const currentEnriched = enrichSellerProperty(existing as Property);
  const unitType = (patch.unit_type ?? currentEnriched.unit_type ?? 'شقة').trim();
  const isLand = unitType.includes('أرض') || unitType.includes('ارض') || unitType.toLowerCase().includes('land');
  const totalPrice = patch.total_price !== undefined ? Number(patch.total_price) : Number(existing.total_price);
  const years = patch.installment_years !== undefined ? Number(patch.installment_years) : Number(existing.installment_years || 0);
  const dpPct = patch.down_payment_pct !== undefined
    ? Number(patch.down_payment_pct)
    : years > 0
      ? Number(existing.down_payment_pct || 20)
      : 100;
  const dpAmount = Math.round((totalPrice * dpPct) / 100);
  const remaining = Math.max(0, totalPrice - dpAmount);
  const monthly = years > 0 ? Math.round(remaining / (years * 12)) : 0;
  const quarterly = years > 0 ? Math.round(remaining / (years * 4)) : 0;

  const city = (patch.city ?? currentEnriched.compound?.city ?? 'القاهرة الجديدة').trim();
  const areaName = (patch.area_name ?? currentEnriched.compound?.area_name ?? city).trim();
  const locationText = (patch.location_text ?? currentEnriched.location_text ?? `${areaName} - ${city}`).trim();

  const meta = {
    seller_user_id: currentEnriched.seller_user_id || ownerId,
    seller_name: patch.seller_name !== undefined ? patch.seller_name.trim() : currentEnriched.seller_name,
    seller_phone: patch.seller_phone !== undefined ? patch.seller_phone.trim() : currentEnriched.seller_phone,
    location_text: locationText,
    city,
    area_name: areaName,
    sale_circumstances: patch.sale_circumstances !== undefined ? patch.sale_circumstances.trim() : currentEnriched.sale_circumstances,
  };

  const cleanImages = patch.images
    ? patch.images.map((u) => u.trim()).filter(Boolean)
    : existing.images;

  const updateRow: Record<string, any> = {
    title: patch.title !== undefined ? patch.title.trim() : existing.title,
    unit_type: isLand ? 'أرض' : unitType,
    area_sqm: patch.area_sqm !== undefined ? Number(patch.area_sqm) : existing.area_sqm,
    bedrooms: isLand ? 0 : (patch.bedrooms !== undefined ? Number(patch.bedrooms) : existing.bedrooms),
    bathrooms: isLand ? 0 : (patch.bathrooms !== undefined ? Number(patch.bathrooms) : existing.bathrooms),
    finishing_type: patch.finishing_type !== undefined ? patch.finishing_type.trim() : existing.finishing_type,
    total_price: totalPrice,
    currency: (patch.currency ?? existing.currency ?? 'EGP').toUpperCase(),
    down_payment_pct: dpPct,
    down_payment_amount: dpAmount,
    installment_years: years,
    monthly_installment: monthly,
    quarterly_installment: quarterly,
    delivery_date: patch.delivery_date !== undefined ? patch.delivery_date.trim() : existing.delivery_date,
    status: patch.status !== undefined ? patch.status.trim() : existing.status,
    images: cleanImages && cleanImages.length > 0 ? cleanImages : pickDefaultImages(unitType),
    affiliate_url: JSON.stringify(meta),
  };

  const { data: updated, error: updateErr } = await supabaseAdmin
    .from('properties')
    .update(updateRow)
    .eq('id', propertyId)
    .select('*')
    .single();

  if (updateErr || !updated) {
    console.error('[SellerListings] Update error:', updateErr);
    return null;
  }

  invalidatePropertiesCache();
  return enrichSellerProperty(updated as Property);
}

export async function deleteSellerProperty(propertyId: string): Promise<boolean> {
  const { error } = await supabaseAdmin
    .from('properties')
    .delete()
    .eq('id', propertyId);

  if (error) {
    console.error('[SellerListings] Delete error:', error);
    return false;
  }
  invalidatePropertiesCache();
  return true;
}

export async function getSellerProperties(ownerId: string): Promise<Property[]> {
  if (!ownerId) return [];
  const { data, error } = await supabaseAdmin
    .from('properties')
    .select('*')
    .eq('partner_code', `seller:${ownerId}`)
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return (data as Property[]).map(enrichSellerProperty);
}
