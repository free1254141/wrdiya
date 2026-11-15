import compoundsRaw from './data/compounds.json';

export interface CompoundSampleUnit {
  id: string;
  title: string;
  unit_type: string;
  price: number;
  down_payment_pct: number;
  installment_years: number;
  monthly_installment: number;
  area_sqm: number;
  bedrooms: number;
  image?: string | null;
}

export interface CompoundSEOData {
  name: string;
  slug: string;
  location: string;
  units_count: number;
  min_price: number;
  max_price: number;
  min_down_payment_pct: number;
  max_installment_years: number;
  min_monthly_installment: number;
  min_area_sqm: number;
  max_area_sqm: number;
  images: string[];
  sample_units: CompoundSampleUnit[];
}

const allCompounds: CompoundSEOData[] = compoundsRaw as CompoundSEOData[];

export function getAllCompounds(): CompoundSEOData[] {
  return allCompounds;
}

export function getTopCompounds(limit = 40): CompoundSEOData[] {
  return allCompounds.slice(0, limit);
}

export function getCompoundBySlug(slug: string): CompoundSEOData | undefined {
  if (!slug) return undefined;
  const decoded = decodeURIComponent(slug).trim().toLowerCase();
  const normalized = decoded.replace(/-/g, ' ');

  return allCompounds.find((c) => {
    const cSlug = c.slug.toLowerCase();
    const cName = c.name.toLowerCase();
    return (
      cSlug === decoded ||
      cSlug === normalized ||
      cName === decoded ||
      cName === normalized ||
      cSlug.replace(/-/g, ' ') === normalized
    );
  });
}

export function searchCompounds(query: string): CompoundSEOData[] {
  if (!query || query.trim() === '') return allCompounds.slice(0, 30);
  const q = query.trim().toLowerCase();
  return allCompounds.filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      c.location.toLowerCase().includes(q)
  );
}

export function getCompoundsByBudget(
  downPayment: number,
  monthlyInstallment: number,
  location?: string
): CompoundSEOData[] {
  return allCompounds.filter((c) => {
    if (location && location !== 'all' && location !== 'الكل') {
      if (!c.location.includes(location) && !c.name.includes(location)) {
        return false;
      }
    }
    const minRequiredDp = c.min_price * (c.min_down_payment_pct / 100);
    const matchesDp = downPayment >= minRequiredDp * 0.85; // 15% flexibility
    const matchesMonthly = monthlyInstallment >= c.min_monthly_installment * 0.85;

    return matchesDp || matchesMonthly;
  }).slice(0, 12);
}

export interface CompoundComputedMetrics {
  avgPricePerSqm: number;
  minDownPaymentEgp: number;
  priceRangeText: string;
}

export function getCompoundMetrics(c: CompoundSEOData): CompoundComputedMetrics {
  const unitPps = (c.sample_units || [])
    .filter((u) => u.price > 0 && u.area_sqm > 0)
    .map((u) => u.price / u.area_sqm);

  let avgPricePerSqm = 0;
  if (unitPps.length > 0) {
    avgPricePerSqm = Math.round(unitPps.reduce((a, b) => a + b, 0) / unitPps.length);
  } else if (c.min_price > 0 && c.min_area_sqm > 0) {
    avgPricePerSqm = Math.round(c.min_price / c.min_area_sqm);
  }

  const minDownPaymentEgp = Math.round(c.min_price * ((c.min_down_payment_pct || 10) / 100));
  const minM = (c.min_price / 1_000_000).toFixed(1);
  const maxM = (c.max_price / 1_000_000).toFixed(1);
  const priceRangeText = minM === maxM ? `${minM} مليون` : `${minM} - ${maxM} مليون`;

  return { avgPricePerSqm, minDownPaymentEgp, priceRangeText };
}

export function getRelatedCompoundsByLocation(
  target: CompoundSEOData,
  limit = 6
): CompoundSEOData[] {
  const locKeyword = (target.location || '').split(/[،,\-\s]+/).filter((w) => w.length > 2)[0] || '';
  const sameLocation = allCompounds.filter(
    (c) =>
      c.slug !== target.slug &&
      locKeyword &&
      (c.location.includes(locKeyword) || c.name.includes(locKeyword))
  );

  if (sameLocation.length >= limit) {
    return sameLocation.slice(0, limit);
  }

  const used = new Set([target.slug, ...sameLocation.map((c) => c.slug)]);
  const similarPrice = allCompounds
    .filter((c) => !used.has(c.slug))
    .sort(
      (a, b) =>
        Math.abs(a.min_price - target.min_price) -
        Math.abs(b.min_price - target.min_price)
    );

  return [...sameLocation, ...similarPrice].slice(0, limit);
}
