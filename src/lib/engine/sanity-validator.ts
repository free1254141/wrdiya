// ==============================================================================
// Sakanybot - Math & Sanity Validator (طبقة الفحص الحسابي والمنطقي للأقساط والصفقات)
// ==============================================================================

export interface InstallmentGapResult {
  hasGap: boolean;
  totalPrice: number;
  downPayment: number;
  remainingBalance: number;
  installmentYears: number;
  totalMonths: number;
  advertisedMonthly: number;
  trueCalculatedMonthly: number;
  totalAdvertisedPaidAcrossDuration: number;
  hiddenGapAmount: number;
  hiddenGapPct: number;
  warningMessage?: string;
  adviceMessage?: string;
}

/**
 * دالة كشف الأقساط المخفية (Hidden Installment Gap Detector)
 * تقارن بين القسط الشهري الحسابي الدقيق (السعر - المقدم) ÷ الشهور
 * وبين القسط المعلن في الإعلان لكشف دفعات الاستلام أو الدفعات السنوية غير المعلنة.
 */
export function checkInstallmentGap(params: {
  totalPrice: number;
  downPayment?: number;
  downPaymentPct?: number;
  installmentYears: number;
  advertisedMonthly?: number;
  advertisedQuarterly?: number;
}): InstallmentGapResult {
  const totalPrice = Math.max(Number(params.totalPrice) || 0, 0);
  const years = Math.max(Number(params.installmentYears) || 0, 0);
  const totalMonths = Math.max(years * 12, 1);

  let downPayment = 0;
  if (params.downPayment !== undefined && params.downPayment !== null) {
    downPayment = Math.max(Number(params.downPayment), 0);
  } else if (params.downPaymentPct !== undefined && params.downPaymentPct !== null) {
    downPayment = Math.round((totalPrice * Math.min(Math.max(Number(params.downPaymentPct), 0), 100)) / 100);
  }

  const remainingBalance = Math.max(totalPrice - downPayment, 0);
  const trueCalculatedMonthly = Math.round(remainingBalance / totalMonths);

  let advertisedMonthly = 0;
  if (params.advertisedMonthly && Number(params.advertisedMonthly) > 0) {
    advertisedMonthly = Math.round(Number(params.advertisedMonthly));
  } else if (params.advertisedQuarterly && Number(params.advertisedQuarterly) > 0) {
    advertisedMonthly = Math.round(Number(params.advertisedQuarterly) / 3);
  }

  // If no advertised monthly was specified or duration is 0, no gap calculation possible
  if (years <= 0 || advertisedMonthly <= 0 || remainingBalance <= 0) {
    return {
      hasGap: false,
      totalPrice,
      downPayment,
      remainingBalance,
      installmentYears: years,
      totalMonths,
      advertisedMonthly: advertisedMonthly || trueCalculatedMonthly,
      trueCalculatedMonthly,
      totalAdvertisedPaidAcrossDuration: remainingBalance,
      hiddenGapAmount: 0,
      hiddenGapPct: 0,
    };
  }

  const totalAdvertisedPaid = advertisedMonthly * totalMonths;
  const hiddenGapAmount = Math.max(remainingBalance - totalAdvertisedPaid, 0);
  const hiddenGapPct = remainingBalance > 0 ? (hiddenGapAmount / remainingBalance) * 100 : 0;

  // We consider it a significant hidden gap if diff is > 15,000 EGP or > 3% of remaining balance
  const hasGap = hiddenGapAmount > 15_000 && hiddenGapPct >= 3.0;

  let warningMessage: string | undefined;
  let adviceMessage: string | undefined;

  if (hasGap) {
    const formattedGap = hiddenGapAmount.toLocaleString('ar-EG');
    const formattedTrueMonthly = trueCalculatedMonthly.toLocaleString('ar-EG');
    const formattedAdvertised = advertisedMonthly.toLocaleString('ar-EG');

    warningMessage = `🚨 **تنبيه حسابي صارم من سكنى بوت:** هناك مبلغ **${formattedGap} جنيه دفعات مخفية** (دفعات استلام أو دفعات سنوية Bullet Payments) غير محسوبة في القسط الشهري المعلن (${formattedAdvertised} ج/شهر)!`;
    adviceMessage = `القسط الشهري المتساوي الحقيقي بدون دفعات سنوية مفاجئة هو **${formattedTrueMonthly} ج/شهر** لمدة ${years} سنوات. اسأل البائع أو شركة التطوير فوراً عن جدول الدفعات السنوية وميعاد دفعة الاستلام.`;
  }

  return {
    hasGap,
    totalPrice,
    downPayment,
    remainingBalance,
    installmentYears: years,
    totalMonths,
    advertisedMonthly,
    trueCalculatedMonthly,
    totalAdvertisedPaidAcrossDuration: totalAdvertisedPaid,
    hiddenGapAmount,
    hiddenGapPct: Math.round(hiddenGapPct * 10) / 10,
    warningMessage,
    adviceMessage,
  };
}

/**
 * فحص التطابق المنطقي للكمبوند والمطور
 * يمنع الخلط بين أسماء المشاريع والمولات والمطورين (مثل الخلط بين مول ريجنسي وكمبوند البوسكو)
 */
export function validateProjectSanity(compoundTitle: string, locationOrDeveloper?: string): {
  isValid: boolean;
  normalizedCompound: string;
  detectedDeveloper?: string;
  notes?: string;
} {
  const title = (compoundTitle || '').toLowerCase();
  const loc = (locationOrDeveloper || '').toLowerCase();

  // Known pairings to enforce sanity
  if (title.includes('bosco') || title.includes('بوسكو')) {
    return {
      isValid: true,
      normalizedCompound: 'كمبوند إل بوسكو (IL Bosco)',
      detectedDeveloper: 'مصر إيطاليا العقارية (Misr Italia)',
      notes: 'مشروع سكني متكامل في العاصمة الإدارية أو المستقبل سيتي، وليس مولاً تجارياً منفصلاً.',
    };
  }

  if (title.includes('regency') || title.includes('ريجنسي')) {
    return {
      isValid: true,
      normalizedCompound: 'مول ريجنسي (Regency)',
      detectedDeveloper: 'ريجنسي للتنمية العمرانية',
      notes: 'مشروع تجاري/إداري وليس كمبوند سكني.',
    };
  }

  return {
    isValid: true,
    normalizedCompound: compoundTitle,
    detectedDeveloper: locationOrDeveloper,
  };
}
