// ==============================================================================
// Sakanybot - Unified Valuation & Deal Scoring Engine (محرك التقييم الموحد)
// يمنع التناقض بين تقييم AVM وسكور الصفقة Deal Score
// ==============================================================================

import { calculatePropertyDealScore, DealScoreResult } from './deal-scoring';
import { calculateAnalyticalValuation, AnalyticalValuationResult } from './valuation-model';
import { checkInstallmentGap, InstallmentGapResult } from './sanity-validator';
import { Property } from '../types';

export interface UnifiedValuationInput {
  propertyId?: string;
  unitPrice: number;
  areaSqm: number;
  locationOrArea: string;
  unitType?: string;
  paymentType?: 'كاش' | 'تقسيط' | string;
  downPayment?: number;
  downPaymentPct?: number;
  installmentYears?: number;
  advertisedMonthly?: number;
  advertisedQuarterly?: number;
  developerName?: string;
  deliveryDateOrYears?: string | number;
  finishingType?: string;
  viewAndLocationRating?: string;
  floor?: string;
}

export interface UnifiedValuationOutput {
  propertyId?: string;
  totalScore: number; // 0-100 (Single source of truth)
  verdictLabel: string;
  pricePerSqm: number;
  fairMarketPricePerSqm: number;
  fairMarketTotal: number;
  fastSaleTotal: number;
  optimisticCeilingTotal: number;
  priceDiffFromMarketPct: number; // بالسالب يعني أرخص من السوق
  estimatedDaysOnMarket: {
    fastSale: string;
    fairMarket: string;
    optimistic: string;
  };
  installmentGap: InstallmentGapResult;
  dealBreakdown: DealScoreResult['breakdown'];
  prosList: string[];
  risksList: string[];
  unifiedBrokerReport: string;
  isSub65Score: boolean;
}

/**
 * دالة التقييم الشامل الموحد
 * تجمع بين الـ AVM والـ Deal Score وفحص الأقساط المخفية في مصدر حقيقة واحد
 */
export function getUnifiedPropertyValuation(input: UnifiedValuationInput): UnifiedValuationOutput {
  const safePrice = Math.max(Number(input.unitPrice) || 0, 1000);
  const safeArea = Math.max(Number(input.areaSqm) || 0, 10);
  const safeYears = input.installmentYears !== undefined ? Math.max(Number(input.installmentYears), 0) : 0;

  // 1. Calculate Analytical Valuation (AVM)
  const avmResult: AnalyticalValuationResult = calculateAnalyticalValuation({
    areaSqm: safeArea,
    areaNameOrSlug: input.locationOrArea,
    finishing: input.finishingType,
    view: input.viewAndLocationRating,
    floor: input.floor,
    paymentMethod: input.paymentType || (safeYears > 0 ? 'تقسيط' : 'كاش'),
    askingPrice: safePrice,
  });

  // 2. Check Installment Sanity & Hidden Gap
  const gapResult = checkInstallmentGap({
    totalPrice: safePrice,
    downPayment: input.downPayment,
    downPaymentPct: input.downPaymentPct,
    installmentYears: safeYears,
    advertisedMonthly: input.advertisedMonthly,
    advertisedQuarterly: input.advertisedQuarterly,
  });

  // 3. Calculate Deal Score with unified benchmark from AVM
  const dealResult: DealScoreResult = calculatePropertyDealScore({
    unitPrice: safePrice,
    areaSqm: safeArea,
    locationOrArea: input.locationOrArea,
    paymentType: input.paymentType,
    downPaymentPct: input.downPaymentPct,
    installmentYears: safeYears,
    developerName: input.developerName,
    deliveryDateOrYears: input.deliveryDateOrYears,
    finishingType: input.finishingType,
    viewAndLocationRating: input.viewAndLocationRating,
    customMarketAvgPricePerSqm: avmResult.baseMarketPricePerSqm,
  });

  // 4. Harmonize Deal Score with AVM price difference
  let finalScore = dealResult.totalScore;
  const priceDiffPct = avmResult.askingPriceAnalysis?.diffFromFairValuePct ?? dealResult.priceDiffPercentage;

  // If price is heavily overpriced (>15% above AVM), cap the score at 64 to avoid misleading buyers
  if (priceDiffPct > 15) {
    finalScore = Math.min(finalScore, 64);
  } else if (priceDiffPct <= -15 && finalScore < 75) {
    // If priced very attractively below fair market value, boost score
    finalScore = Math.min(finalScore + 10, 95);
  }

  // Deduct penalty if hidden installment gap was detected
  if (gapResult.hasGap) {
    finalScore = Math.max(finalScore - 8, 35);
  }

  const isSub65 = finalScore < 65;

  // Combine and deduplicate pros and risks
  const pros = Array.from(new Set([...dealResult.prosList])).slice(0, 5);
  const risks = Array.from(new Set([
    ...(gapResult.hasGap && gapResult.warningMessage ? [gapResult.warningMessage] : []),
    ...dealResult.risksList
  ])).slice(0, 5);

  const formattedFair = avmResult.fairMarketValue.total.toLocaleString('ar-EG');
  const formattedFast = avmResult.fastSaleValue.total.toLocaleString('ar-EG');
  const formattedDiff = Math.abs(Math.round(priceDiffPct));
  const diffSignText = priceDiffPct < 0 ? `أرخص من القيمة العادلة بـ ${formattedDiff}% (ميزة سعرية)` : `أعلى من القيمة العادلة بـ ${formattedDiff}% (سعر مبالغ فيه)`;

  const locLower = (input.locationOrArea || '').toLowerCase();
  const isNewCairo = locLower.includes('تجمع') || locLower.includes('cairo') || locLower.includes('قاهرة جديدة');
  const twoTierNote = isNewCairo
    ? `• **فروق أسعار التجمع الخامس الدقيقة:**\n  - خارج الكمبوند (شقق منفصلة عمارات في بيت الوطن، الأندلس، النرجس): السعر العادل المعياري هو ~26,000 إلى ~30,000 ج/م² نصف تشطيب.\n  - داخل كمبوندات التجمع الكبرى (الجولدن سكوير، هايد بارك، ميفيدا): السعر العادل يرتفع إلى ~42,000 إلى ~55,000 ج/م² نصف تشطيب.`
    : '';

  const unifiedReport = [
    `📊 **التقييم الشامل الموحد للصفقة (سكنى بوت):**`,
    `• **سكور الصفقة النهائي:** **${finalScore}/100** — (${dealResult.verdictLabel})`,
    `• **السعر السوقي العادل (AVM):** ${formattedFair} ج.م (${avmResult.fairMarketValue.pricePerSqm.toLocaleString('ar-EG')} ج/م²)`,
    twoTierNote,
    `• **سعر البيع السريع (تسييل):** ${formattedFast} ج.م`,
    `• **مقارنة السعر المطلوب:** ${diffSignText}`,
    gapResult.hasGap ? `• **فحص الأقساط:** ${gapResult.warningMessage}` : '',
    `• **زمن البيع المتوقع:** ${avmResult.estimatedDaysOnMarket.fairMarket} بالسعر العادل، و ${avmResult.estimatedDaysOnMarket.fastSale} بسعر البيع السريع.`,
    `• **خلاصة رأي المستشار:** ${dealResult.summaryArabic}`,
  ].filter(Boolean).join('\n');

  return {
    propertyId: input.propertyId,
    totalScore: finalScore,
    verdictLabel: dealResult.verdictLabel,
    pricePerSqm: dealResult.calculatedPricePerSqm,
    fairMarketPricePerSqm: avmResult.fairMarketValue.pricePerSqm,
    fairMarketTotal: avmResult.fairMarketValue.total,
    fastSaleTotal: avmResult.fastSaleValue.total,
    optimisticCeilingTotal: avmResult.optimisticCeiling.total,
    priceDiffFromMarketPct: priceDiffPct,
    estimatedDaysOnMarket: avmResult.estimatedDaysOnMarket,
    installmentGap: gapResult,
    dealBreakdown: dealResult.breakdown,
    prosList: pros,
    risksList: risks,
    unifiedBrokerReport: unifiedReport,
    isSub65Score: isSub65,
  };
}

/**
 * دالة البحث عن "البديل الأذكى تلقائياً" (Auto Counter-Offer)
 * تسحب تلقائياً من الكاش وحدة بديلة بنفس الميزانية بسكور فوق 75
 */
export function findSmartCounterOffer(
  currentProperty: Property,
  allProperties: Property[]
): {
  found: boolean;
  alternative?: Property;
  alternativeScore?: number;
  recommendationReason?: string;
} {
  const currentPrice = currentProperty.total_price;
  const currentArea = currentProperty.compound?.city || (currentProperty as any).location_text || '';

  const candidates = allProperties.filter(p => {
    if (p.id === currentProperty.id) return false;
    // Price within +- 25% of current unit
    const pPrice = p.total_price;
    if (pPrice < currentPrice * 0.70 || pPrice > currentPrice * 1.30) return false;
    return true;
  });

  let bestMatch: Property | null = null;
  let bestScore = 0;

  for (const c of candidates) {
    const valuation = getUnifiedPropertyValuation({
      propertyId: c.id,
      unitPrice: c.total_price,
      areaSqm: c.area_sqm,
      locationOrArea: c.compound?.area_name || c.compound?.city || 'القاهرة الجديدة',
      installmentYears: c.installment_years,
      downPaymentPct: c.down_payment_pct,
      developerName: c.compound?.developer?.name,
    });

    if (valuation.totalScore >= 75 && valuation.totalScore > bestScore) {
      bestScore = valuation.totalScore;
      bestMatch = c;
    }
  }

  if (bestMatch && bestScore >= 75) {
    return {
      found: true,
      alternative: bestMatch,
      alternativeScore: bestScore,
      recommendationReason: `💡 **بديل أذكى بنفس الميزانية:** إذا كانت الوحدة الحالية غير مناسبة، نرشح لك **${bestMatch.title}** بسكور صفقة **${bestScore}/100**، وسعر إجمالي ${bestMatch.total_price.toLocaleString('ar-EG')} ج.م بتقسيط أفضل وقيمة استثمارية أعلى.`,
    };
  }

  return { found: false };
}
