import { getAllCompounds, getCompoundMetrics, CompoundSEOData } from './compounds-data';

export interface BuyerIntentResult {
  score: number;
  tier: 'hot' | 'warm' | 'exploring';
  labelAr: string;
  signals: string[];
}

export function calculateBuyerIntentScore(params: {
  text?: string;
  messageCount?: number;
  hasPhoneOptIn?: boolean;
  budgetMax?: number | null;
  preferredLocation?: string | null;
}): BuyerIntentResult {
  const txt = (params.text || '').toLowerCase();
  let score = 10;
  const signals: string[] = [];

  const hasBudget =
    Boolean(params.budgetMax && params.budgetMax > 0) ||
    /(\d+\s*(مليون|الف|ألف|m\b|k\b)|مقدم|قسط|ميزاني)/i.test(txt);
  if (hasBudget) {
    score += 25;
    signals.push('حدد الميزانية أو المقدم');
  }

  const hasLocation =
    Boolean(params.preferredLocation && params.preferredLocation !== 'General') ||
    /(التجمع|القاهرة الجديدة|زايد|اكتوبر|أكتوبر|العاصمة|الساحل|السخنة|المستقبل|مدينتي|الشروق|المعادي)/i.test(
      txt
    );
  if (hasLocation) {
    score += 20;
    signals.push('حدد المنطقة المطلوبة');
  }

  const hasUnitSpec =
    /(شقة|شقه|فيلا|شاليه|تاون|توين|دوبلكس|بنتهاوس|استوديو|غرف|متر|م²)/i.test(txt);
  if (hasUnitSpec) {
    score += 15;
    signals.push('حدد نوع أو مساحة الوحدة');
  }

  const hasActionIntent =
    /(معاينة|معاينه|احجز|تواصل|يكلمني|المطور|استلام فوري|قسط شهري|مقارنة|قارن)/i.test(
      txt
    );
  if (hasActionIntent) {
    score += 15;
    signals.push('نية شراء أو معاينة واضحة');
  }

  if ((params.messageCount || 0) >= 3) {
    score += 10;
    signals.push('تفاعل متعمق في المحادثة');
  }

  if (params.hasPhoneOptIn) {
    score += 15;
    signals.push('موافقة صريحة على تواصل المطور');
  }

  score = Math.min(100, score);

  if (score >= 70) {
    return { score, tier: 'hot', labelAr: 'عميل جاد جداً 🔥', signals };
  }
  if (score >= 45) {
    return { score, tier: 'warm', labelAr: 'مهتم دافئ ⚡', signals };
  }
  return { score, tier: 'exploring', labelAr: 'في مرحلة الاستكشاف 🔍', signals };
}

export interface RegionDemandStat {
  region: string;
  demandCount: number;
  demandSharePct: number;
  supplyCompoundsCount: number;
  supplySharePct: number;
  gapNote: string;
}

export interface BudgetBucketStat {
  label: string;
  count: number;
  sharePct: number;
}

export interface UnitTypeStat {
  type: string;
  count: number;
  sharePct: number;
}

export interface AggregatedDemandReport {
  analyzedMessages: number;
  regionStats: RegionDemandStat[];
  budgetBuckets: BudgetBucketStat[];
  unitTypes: UnitTypeStat[];
  topRequestedCompounds: Array<{ name: string; count: number }>;
  generatedAt: string;
}

const REGION_RULES: Array<{ label: string; regex: RegExp; supplyRegex: RegExp }> = [
  {
    label: 'التجمع الخامس والقاهرة الجديدة',
    regex: /(التجمع|القاهرة الجديدة|new cairo|تجمع|ميفيدا|تاج سيتي|ماونتن فيو|هايد بارك|زيد ايست)/i,
    supplyRegex: /(التجمع|القاهرة الجديدة|new cairo)/i,
  },
  {
    label: 'الشيخ زايد و6 أكتوبر',
    regex: /(زايد|اكتوبر|أكتوبر|zayed|october|بادية|أو ويست|سوديك|بالم هيلز)/i,
    supplyRegex: /(زايد|أكتوبر|اكتوبر|zayed|october)/i,
  },
  {
    label: 'العاصمة الإدارية الجديدة',
    regex: /(العاصمة|capital|r7|r8|البوسكو|سيليا|المقصد)/i,
    supplyRegex: /(العاصمة|capital)/i,
  },
  {
    label: 'الساحل الشمالي ورأس الحكمة',
    regex: /(الساحل|رأس الحكمة|راس الحكمة|مراسي|العلمين|north coast|marassi)/i,
    supplyRegex: /(الساحل|العلمين|الحكمة|north coast)/i,
  },
  {
    label: 'المستقبل سيتي والشروق ومدينتي',
    regex: /(المستقبل|الشروق|مدينتي|mostakbal|madinaty|سراي|بلوم فيلدز)/i,
    supplyRegex: /(المستقبل|الشروق|مدينتي)/i,
  },
  {
    label: 'العين السخنة والجلالة',
    regex: /(السخنة|الجلالة|sokhna|المونت جلالة)/i,
    supplyRegex: /(السخنة|الجلالة|sokhna)/i,
  },
];

export function aggregateMarketDemand(userMessages: string[]): AggregatedDemandReport {
  const allCompounds = getAllCompounds();
  const totalCompounds = Math.max(1, allCompounds.length);

  const regionCounts = REGION_RULES.map((r) => ({
    ...r,
    demandCount: 0,
    supplyCompoundsCount: allCompounds.filter(
      (c) => r.supplyRegex.test(c.location) || r.supplyRegex.test(c.name)
    ).length,
  }));

  const budgetCounts = {
    under4: 0,
    b4to8: 0,
    b8to15: 0,
    over15: 0,
  };

  const unitCounts: Record<string, number> = {
    'شقق سكنية': 0,
    'فيلات / تاون هاوس': 0,
    'شاليهات مصيفية': 0,
    'دوبلكس / بنتهاوس': 0,
    'تجاري / إداري / طبي': 0,
  };

  const compoundMentions: Record<string, number> = {};
  const topNames = allCompounds.slice(0, 80).map((c) => c.name);

  for (const raw of userMessages) {
    const msg = (raw || '').trim();
    if (!msg) continue;

    // Region detection
    for (const r of regionCounts) {
      if (r.regex.test(msg)) {
        r.demandCount += 1;
      }
    }

    // Budget detection (in millions EGP)
    const millionMatch = msg.match(/(\d+(?:\.\d+)?)\s*مليون/);
    if (millionMatch) {
      const val = parseFloat(millionMatch[1]);
      if (val < 4) budgetCounts.under4 += 1;
      else if (val <= 8) budgetCounts.b4to8 += 1;
      else if (val <= 15) budgetCounts.b8to15 += 1;
      else budgetCounts.over15 += 1;
    } else if (/(\d+)\s*(الف|ألف)/.test(msg)) {
      // Down payment or small budget
      budgetCounts.under4 += 1;
    }

    // Unit types
    if (/(شقة|شقه|استوديو|apartment)/i.test(msg)) unitCounts['شقق سكنية'] += 1;
    if (/(فيلا|فيلات|تاون|توين|villa)/i.test(msg)) unitCounts['فيلات / تاون هاوس'] += 1;
    if (/(شاليه|شاليهات|chalet)/i.test(msg)) unitCounts['شاليهات مصيفية'] += 1;
    if (/(دوبلكس|بنتهاوس|روف|duplex)/i.test(msg)) unitCounts['دوبلكس / بنتهاوس'] += 1;
    if (/(تجاري|اداري|إداري|عيادة|محل|مكتب)/i.test(msg))
      unitCounts['تجاري / إداري / طبي'] += 1;

    // Top compound mentions
    for (const cname of topNames) {
      if (cname.length >= 4 && msg.includes(cname)) {
        compoundMentions[cname] = (compoundMentions[cname] || 0) + 1;
      }
    }
  }

  const totalRegionHits = Math.max(
    1,
    regionCounts.reduce((acc, r) => acc + r.demandCount, 0)
  );

  const regionStats: RegionDemandStat[] = regionCounts
    .map((r) => {
      const demandSharePct = Math.round((r.demandCount / totalRegionHits) * 100);
      const supplySharePct = Math.round((r.supplyCompoundsCount / totalCompounds) * 100);
      const diff = demandSharePct - supplySharePct;
      let gapNote = 'توازن نسبي بين العرض والطلب';
      if (diff >= 8) gapNote = '🔥 فجوة طلب مرتفعة (الطلب أعلى من المعروض)';
      else if (diff <= -8) gapNote = 'منافسة عرض قوية (فرص تفاوض ممتازة)';

      return {
        region: r.label,
        demandCount: r.demandCount,
        demandSharePct,
        supplyCompoundsCount: r.supplyCompoundsCount,
        supplySharePct,
        gapNote,
      };
    })
    .sort((a, b) => b.demandCount - a.demandCount);

  const totalBudgets = Math.max(
    1,
    budgetCounts.under4 + budgetCounts.b4to8 + budgetCounts.b8to15 + budgetCounts.over15
  );
  const budgetBuckets: BudgetBucketStat[] = [
    {
      label: 'أقل من 4 مليون ج.م',
      count: budgetCounts.under4,
      sharePct: Math.round((budgetCounts.under4 / totalBudgets) * 100),
    },
    {
      label: 'من 4 إلى 8 مليون ج.م',
      count: budgetCounts.b4to8,
      sharePct: Math.round((budgetCounts.b4to8 / totalBudgets) * 100),
    },
    {
      label: 'من 8 إلى 15 مليون ج.م',
      count: budgetCounts.b8to15,
      sharePct: Math.round((budgetCounts.b8to15 / totalBudgets) * 100),
    },
    {
      label: 'أكثر من 15 مليون ج.م',
      count: budgetCounts.over15,
      sharePct: Math.round((budgetCounts.over15 / totalBudgets) * 100),
    },
  ];

  const totalUnits = Math.max(
    1,
    Object.values(unitCounts).reduce((a, b) => a + b, 0)
  );
  const unitTypes: UnitTypeStat[] = Object.entries(unitCounts)
    .map(([type, count]) => ({
      type,
      count,
      sharePct: Math.round((count / totalUnits) * 100),
    }))
    .sort((a, b) => b.count - a.count);

  const topRequestedCompounds = Object.entries(compoundMentions)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    analyzedMessages: userMessages.length,
    regionStats,
    budgetBuckets,
    unitTypes,
    topRequestedCompounds,
    generatedAt: new Date().toISOString(),
  };
}

export interface CityMarketIndexRow {
  city: string;
  compoundsCount: number;
  avgPricePerSqm: number;
  minPriceEgp: number;
  avgDownPaymentPct: number;
  maxInstallmentYears: number;
  cheapestCompound: CompoundSEOData | null;
}

export function getMonthlyMarketIndex(): {
  totalCompounds: number;
  nationalAvgPricePerSqm: number;
  cities: CityMarketIndexRow[];
} {
  const all = getAllCompounds();
  const cities: CityMarketIndexRow[] = [];

  for (const rule of REGION_RULES) {
    const matched = all.filter(
      (c) => rule.supplyRegex.test(c.location) || rule.supplyRegex.test(c.name)
    );
    if (matched.length === 0) continue;

    const ppsList = matched
      .map((c) => getCompoundMetrics(c).avgPricePerSqm)
      .filter((n) => n > 5000 && n < 500000);

    const avgPricePerSqm =
      ppsList.length > 0
        ? Math.round(ppsList.reduce((a, b) => a + b, 0) / ppsList.length)
        : 0;

    const sortedByPrice = [...matched]
      .filter((c) => c.min_price > 0)
      .sort((a, b) => a.min_price - b.min_price);

    const avgDownPaymentPct = Math.round(
      matched.reduce((a, c) => a + (c.min_down_payment_pct || 10), 0) / matched.length
    );

    const maxInstallmentYears = Math.max(
      ...matched.map((c) => c.max_installment_years || 7)
    );

    cities.push({
      city: rule.label,
      compoundsCount: matched.length,
      avgPricePerSqm,
      minPriceEgp: sortedByPrice[0]?.min_price || 0,
      avgDownPaymentPct,
      maxInstallmentYears,
      cheapestCompound: sortedByPrice[0] || null,
    });
  }

  const validCities = cities.filter((c) => c.avgPricePerSqm > 0);
  const nationalAvgPricePerSqm =
    validCities.length > 0
      ? Math.round(
          validCities.reduce((a, c) => a + c.avgPricePerSqm, 0) / validCities.length
        )
      : 0;

  return {
    totalCompounds: all.length,
    nationalAvgPricePerSqm,
    cities: cities.sort((a, b) => b.compoundsCount - a.compoundsCount),
  };
}
