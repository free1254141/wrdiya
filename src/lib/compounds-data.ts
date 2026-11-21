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

/**
 * Normalizes malformed location strings from source scrapes (e.g. unclosed '('
 * in "مدينة المستقبل (القاهرة الجديدة" -> "مدينة المستقبل (القاهرة الجديدة)").
 */
export function cleanLocationName(raw?: string | null): string {
  let loc = (raw || 'مصر').trim().replace(/\s+/g, ' ');
  const openCount = (loc.match(/\(/g) || []).length;
  const closeCount = (loc.match(/\)/g) || []).length;
  if (openCount > closeCount) {
    loc = `${loc}${')'.repeat(openCount - closeCount)}`;
  }
  return loc;
}

const allCompounds: CompoundSEOData[] = (compoundsRaw as CompoundSEOData[]).map((c) => ({
  ...c,
  location: cleanLocationName(c.location),
}));

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
  const locKeyword = (target.location || '').split(/[،,\-\s()]+/).filter((w) => w.length > 2)[0] || '';
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

// ============================================================================
// Programmatic Egyptian Real Estate Area Landing Pages (/areas/[slug])
// ============================================================================

export interface AreaDefinition {
  slug: string;
  nameAr: string;
  shortNameAr: string;
  nameEn: string;
  descriptionAr: string;
  keywords: string[];
  matchTerms: string[];
}

export interface AreaSEOData extends AreaDefinition {
  compounds: CompoundSEOData[];
  compoundsCount: number;
  unitsCount: number;
  minPrice: number;
  maxPrice: number;
  avgPricePerSqm: number;
  minDownPaymentPct: number;
  maxInstallmentYears: number;
}

const AREA_DEFINITIONS: AreaDefinition[] = [
  {
    slug: 'new-cairo',
    nameAr: 'القاهرة الجديدة والتجمع الخامس',
    shortNameAr: 'التجمع الخامس والقاهرة الجديدة',
    nameEn: 'New Cairo & Fifth Settlement',
    descriptionAr:
      'اكتشف أحدث أسعار الشقق والفيلات وجداول التقسيط في كمبوندات القاهرة الجديدة والتجمع الخامس والتجمع السادس لعام 2026 مع مقارنة سعر المتر وأنظمة السداد بدون مكالمات سيلز.',
    keywords: ['كمبوندات التجمع الخامس', 'شقق للبيع في القاهرة الجديدة', 'أسعار متر التجمع الخامس 2026'],
    matchTerms: ['القاهرة الجديدة', 'التجمع الخامس', 'التجمع السادس', 'جولدن سكوير', 'بيت الوطن', 'النرجس'],
  },
  {
    slug: 'sheikh-zayed',
    nameAr: 'الشيخ زايد والشيخ زايد الجديدة',
    shortNameAr: 'الشيخ زايد',
    nameEn: 'Sheikh Zayed & New Zayed',
    descriptionAr:
      'دليل أسعار كمبوندات الشيخ زايد والشيخ زايد الجديدة 2026: شقق، توين هاوس، وفيلات مستقلة بمقدم يبدأ من 5% وتقسيط حتى 10 سنوات.',
    keywords: ['كمبوندات الشيخ زايد', 'فيلات للبيع في الشيخ زايد الجديدة', 'أسعار الشيخ زايد 2026'],
    matchTerms: ['الشيخ زايد', 'زايد الجديدة', 'زايد'],
  },
  {
    slug: 'october',
    nameAr: 'مدينة 6 أكتوبر وحدائق أكتوبر',
    shortNameAr: '6 أكتوبر',
    nameEn: '6th of October City',
    descriptionAr:
      'استعرض أفضل كمبوندات مدينة السادس من أكتوبر، التوسعات الشمالية، وحدائق أكتوبر بأسعار 2026 الرسمية وأنظمة التقسيط المباشر من المطورين.',
    keywords: ['كمبوندات 6 أكتوبر', 'شقق للبيع في حدائق أكتوبر', 'أسعار كمبوندات أكتوبر 2026'],
    matchTerms: ['أكتوبر', 'اكتوبر', 'التوسعات الشمالية', 'أكتوبر الجديدة'],
  },
  {
    slug: 'new-capital',
    nameAr: 'العاصمة الإدارية الجديدة',
    shortNameAr: 'العاصمة الإدارية',
    nameEn: 'New Administrative Capital',
    descriptionAr:
      'قارن أسعار ومقدمات كمبوندات العاصمة الإدارية الجديدة في أحياء R7 و R8 والحي السكني لعام 2026 بفترات تقسيط طويلة وأقساط شهرية مرنة.',
    keywords: ['كمبوندات العاصمة الإدارية الجديدة', 'شقق R7 و R8 العاصمة الإدارية', 'أسعار العاصمة الإدارية 2026'],
    matchTerms: ['العاصمة الإدارية', 'العاصمه الاداريه', 'العاصمة'],
  },
  {
    slug: 'north-coast',
    nameAr: 'الساحل الشمالي',
    shortNameAr: 'الساحل الشمالي',
    nameEn: 'North Coast Egypt',
    descriptionAr:
      'أحدث أسعار قرى ومنتجعات وشاليهات الساحل الشمالي لعام 2026 (رأس الحكمة، سيدي عبد الرحمن، العلمين، سيدي حنيش) بأسعار المطورين المباشرة.',
    keywords: ['قرى الساحل الشمالي', 'شاليهات للبيع في الساحل الشمالي 2026', 'أسعار الساحل الشمالي بالتقسيط'],
    matchTerms: ['الساحل الشمالي', 'رأس الحكمة', 'سيدي عبد الرحمن', 'سيدي حنيش', 'العلمين', 'الضبعة'],
  },
  {
    slug: 'ras-el-hekma',
    nameAr: 'رأس الحكمة — الساحل الشمالي',
    shortNameAr: 'رأس الحكمة',
    nameEn: 'Ras El Hekma',
    descriptionAr:
      'دليل مشاريع وقرى خليج رأس الحكمة في الساحل الشمالي لعام 2026: أسعار الشاليهات والفيلات على البحر، أقل مقدم، وأطول خطط تقسيط.',
    keywords: ['قرى رأس الحكمة', 'شاليهات رأس الحكمة 2026', 'أسعار مشاريع رأس الحكمة'],
    matchTerms: ['رأس الحكمة', 'راس الحكمة', 'راس الحكمه'],
  },
  {
    slug: 'mostakbal-city',
    nameAr: 'مدينة المستقبل (مستقبل سيتي)',
    shortNameAr: 'المستقبل سيتي',
    nameEn: 'Mostakbal City',
    descriptionAr:
      'كل كمبوندات مدينة المستقبل (Mostakbal City) بالقاهرة الجديدة بأسعار 2026 وجداول الأقساط الرسمية ومقارنة أسعار المتر بين المطورين.',
    keywords: ['كمبوندات المستقبل سيتي', 'شقق للبيع في مدينة المستقبل 2026', 'أسعار مستقبل سيتي'],
    matchTerms: ['المستقبل', 'مستقبل سيتي'],
  },
  {
    slug: 'ain-sokhna',
    nameAr: 'العين السخنة ومدينة الجلالة',
    shortNameAr: 'العين السخنة',
    nameEn: 'Ain Sokhna & El Galala',
    descriptionAr:
      'تصفح أسعار شاليهات وفيلات قرى العين السخنة والجلالة 2026 بالتقسيط واستلام فوري على البحر الأحمر مع حاسبة أقساط دقيقة.',
    keywords: ['قرى العين السخنة', 'شاليهات العين السخنة 2026', 'منتجعات الجلالة بالتقسيط'],
    matchTerms: ['العين السخنة', 'السخنة', 'الجلالة'],
  },
  {
    slug: 'el-shorouk',
    nameAr: 'مدينة الشروق وهليوبوليس الجديدة',
    shortNameAr: 'الشروق وهليوبوليس الجديدة',
    nameEn: 'El Shorouk & New Heliopolis',
    descriptionAr:
      'أفضل كمبوندات مدينة الشروق وهليوبوليس الجديدة 2026: شقق وفيلات بأسعار تنافسية وتقسيط مباشر من المطورين العقاريين.',
    keywords: ['كمبوندات الشروق', 'شقق هليوبوليس الجديدة 2026', 'أسعار كمبوندات مدينة الشروق'],
    matchTerms: ['الشروق', 'هليوبوليس الجديدة'],
  },
  {
    slug: 'new-alamein',
    nameAr: 'العلمين الجديدة',
    shortNameAr: 'العلمين الجديدة',
    nameEn: 'New Alamein City',
    descriptionAr:
      'أسعار أبراج وكمبوندات وشاليهات مدينة العلمين الجديدة 2026 مع خطط التقسيط والمقدم وحساب القسط الشهري فوراً.',
    keywords: ['كمبوندات العلمين الجديدة', 'شقق أبراج العلمين الجديدة 2026', 'أسعار العلمين الجديدة'],
    matchTerms: ['العلمين'],
  },
  {
    slug: 'red-sea',
    nameAr: 'البحر الأحمر (سوما باي والجونة وسهل حشيش)',
    shortNameAr: 'البحر الأحمر والجونة',
    nameEn: 'Red Sea (Soma Bay, El Gouna & Sahl Hasheesh)',
    descriptionAr:
      'دليل منتجعات وشاليهات البحر الأحمر لعام 2026 في سوما باي، الجونة، سهل حشيش، ومكادي هايتس بالأسعار الرسمية وأنظمة السداد.',
    keywords: ['منتجعات البحر الأحمر', 'شاليهات سوما باي 2026', 'أسعار الجونة وسهل حشيش'],
    matchTerms: ['سوماباي', 'سوما باي', 'الجونة', 'الجونه', 'سهل حشيش', 'مكادي', 'الغردقة'],
  },
  {
    slug: 'madinaty',
    nameAr: 'مدينتي وشرق القاهرة',
    shortNameAr: 'مدينتي',
    nameEn: 'Madinaty & East Cairo',
    descriptionAr:
      'تعرف على أسعار الشقق والفيلات وخطط السداد في مدينتي والمشروعات المجاورة في شرق القاهرة لعام 2026.',
    keywords: ['أسعار شقق مدينتي 2026', 'فيلات للبيع في مدينتي', 'عقارات شرق القاهرة'],
    matchTerms: ['مدينتي', 'مدينتى'],
  },
];

function computeAreaData(def: AreaDefinition): AreaSEOData {
  const matched = allCompounds.filter((c) => {
    const loc = c.location.toLowerCase();
    const name = c.name.toLowerCase();
    return def.matchTerms.some((term) => {
      const t = term.toLowerCase();
      return loc.includes(t) || name.includes(t);
    });
  });

  const validPrices = matched.map((c) => c.min_price).filter((p) => p > 0);
  const validMaxPrices = matched.map((c) => c.max_price).filter((p) => p > 0);
  const ppsList = matched
    .map((c) => getCompoundMetrics(c).avgPricePerSqm)
    .filter((p) => p > 0);
  const dpList = matched.map((c) => c.min_down_payment_pct).filter((p) => p > 0);
  const yearsList = matched.map((c) => c.max_installment_years).filter((y) => y > 0);

  return {
    ...def,
    compounds: matched,
    compoundsCount: matched.length,
    unitsCount: matched.reduce((sum, c) => sum + (c.units_count || 0), 0),
    minPrice: validPrices.length > 0 ? Math.min(...validPrices) : 0,
    maxPrice: validMaxPrices.length > 0 ? Math.max(...validMaxPrices) : 0,
    avgPricePerSqm:
      ppsList.length > 0
        ? Math.round(ppsList.reduce((a, b) => a + b, 0) / ppsList.length)
        : 0,
    minDownPaymentPct: dpList.length > 0 ? Math.min(...dpList) : 5,
    maxInstallmentYears: yearsList.length > 0 ? Math.max(...yearsList) : 8,
  };
}

const cachedAreas: AreaSEOData[] = AREA_DEFINITIONS.map(computeAreaData).filter(
  (a) => a.compoundsCount > 0
);

export function getAllAreas(): AreaSEOData[] {
  return cachedAreas;
}

export function getAreaBySlug(slug: string): AreaSEOData | undefined {
  if (!slug) return undefined;
  const normalized = decodeURIComponent(slug).trim().toLowerCase();
  return cachedAreas.find((a) => a.slug === normalized);
}

export function findAreaForLocation(location: string): AreaSEOData | undefined {
  const loc = (location || '').toLowerCase();
  // Check more specific areas first (e.g. ras-el-hekma, mostakbal-city, new-alamein before north-coast/new-cairo)
  const priorityOrder = [
    'ras-el-hekma',
    'new-alamein',
    'mostakbal-city',
    'madinaty',
    'el-shorouk',
    'new-capital',
    'sheikh-zayed',
    'october',
    'ain-sokhna',
    'red-sea',
    'north-coast',
    'new-cairo',
  ];
  for (const slug of priorityOrder) {
    const area = cachedAreas.find((a) => a.slug === slug);
    if (area && area.matchTerms.some((term) => loc.includes(term.toLowerCase()))) {
      return area;
    }
  }
  return undefined;
}

export interface PopularComparisonPair {
  c1: CompoundSEOData;
  c2: CompoundSEOData;
  areaLabel: string;
}

export function getPopularComparisons(limit = 12): PopularComparisonPair[] {
  const pairs: PopularComparisonPair[] = [];
  const usedKeys = new Set<string>();

  for (const area of cachedAreas) {
    if (area.compounds.length < 2) continue;
    const top = [...area.compounds]
      .sort((a, b) => (b.units_count || 0) - (a.units_count || 0))
      .slice(0, 4);
    for (let i = 0; i < top.length - 1; i += 2) {
      const a = top[i];
      const b = top[i + 1];
      const key = [a.slug, b.slug].sort().join('|');
      if (!usedKeys.has(key)) {
        usedKeys.add(key);
        pairs.push({ c1: a, c2: b, areaLabel: area.shortNameAr });
      }
      if (pairs.length >= limit) return pairs;
    }
  }

  return pairs;
}
