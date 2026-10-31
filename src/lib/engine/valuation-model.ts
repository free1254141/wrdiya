// ==============================================================================
// Sakanybot (سكنى بوت) - Analytical Real Estate Valuation Model
// نموذج التقييم والتسعير التحليلي الدقيق للعقارات في السوق المصري
// ==============================================================================

import { getAreaIntelligence } from '../knowledge/area-intelligence';

export interface AnalyticalValuationParams {
  areaSqm: number; // مساحة الوحدة الإجمالية بالمتر المربع
  areaNameOrSlug: string; // اسم المنطقة الرئيسية (مثل بيت الوطن، النرجس، زايد، R7...)
  subDistrict?: string; // الحي الفرعي أو المربع (اختياري)
  bedrooms?: number; // عدد غرف النوم
  floor?: 'أرضي بحديقة' | 'أرضي مرتفع بدون حديقة' | 'دور متكرر' | 'أخير صريح' | 'روف وبنتهاوس' | string;
  finishing?: 'طوب أحمر' | 'محارة وتأسيس' | 'نصف تشطيب' | 'تشطيب كامل سوبر لوكس' | 'الترا سوبر لوكس بالتكييفات' | string;
  view?: 'بحري صريح / لاندسكيب وبحيرات' | 'واجهة رئيسية مفتوحة' | 'واجهة جانبية' | 'خلفي / منور' | string;
  paymentMethod?: 'كاش' | 'تقسيط' | string;
  askingPrice?: number; // السعر المطلوب الحالي (اختياري للمقارنة مع القيمة العادلة)
}

export interface ValueSummary {
  total: number; // السعر الإجمالي بالجنيه المصري
  pricePerSqm: number; // سعر المتر المربع بالجنيه المصري
}

export interface ValuationFactorDetail {
  factor: string; // اسم العامل (الدور، التشطيب، الواجهة...)
  impactPct: number; // نسبة التأثير المئوي (+4%, -8%, إلخ)
  sign: '+' | '-' | '=';
  description: string; // التوضيح الهندسي والسوقي للعامل
}

export interface AnalyticalValuationResult {
  baseMarketPricePerSqm: number; // السعر المعياري الأساسي للمتر قبل التعديلات
  fairMarketValue: ValueSummary; // السعر السوقي العادل والمتوازن
  fastSaleValue: ValueSummary; // سعر البيع السريع (تسييل خلال 30-60 يوماً بخصم سيولة 8-10%)
  optimisticCeiling: ValueSummary; // السقف السعري المتفائل الأقصى (يتطلب صبراً طويلاً)
  estimatedDaysOnMarket: {
    fastSale: string;
    fairMarket: string;
    optimistic: string;
  };
  confidenceLevel: 'عالية' | 'متوسطة' | 'تقديرية لندرة المعروض في الحي';
  explanationFactors: ValuationFactorDetail[];
  brokerValuationOpinion: string; // ملخص تحليلي صريح للبائع أو المشتري
  askingPriceAnalysis?: {
    askingPrice: number;
    diffFromFairValuePct: number;
    status: 'لقطة سعرية' | 'سعر عادل معقول' | 'أعلى من السوق قليلاً' | 'مبالغ فيه بشدة';
    negotiationAdvice: string;
  };
}

/**
 * حساب التقييم التحليلي المنهجي للعقار
 */
export function calculateAnalyticalValuation(params: AnalyticalValuationParams): AnalyticalValuationResult {
  const {
    areaSqm,
    areaNameOrSlug,
    subDistrict,
    bedrooms,
    floor = 'دور متكرر',
    finishing = 'نصف تشطيب',
    view = 'واجهة رئيسية مفتوحة',
    paymentMethod = 'كاش',
    askingPrice
  } = params;

  const safeAreaSqm = Math.max(1, areaSqm || 120);
  const isCash = paymentMethod.includes('كاش');

  // 1. استخراج السعر المرجعي الأساسي من استخبارات المناطق
  const areaIntel = getAreaIntelligence(areaNameOrSlug);
  let baseMarketPricePerSqm: number;
  let confidenceLevel: AnalyticalValuationResult['confidenceLevel'] = 'عالية';

  if (areaIntel) {
    baseMarketPricePerSqm = isCash 
      ? areaIntel.avg_price_per_sqm_cash 
      : areaIntel.avg_price_per_sqm_installments;
  } else {
    // منطقة عامة غير مسجلة بدقة
    baseMarketPricePerSqm = isCash ? 28000 : 42000;
    confidenceLevel = 'تقديرية لندرة المعروض في الحي';
  }

  const explanationFactors: ValuationFactorDetail[] = [];
  let totalAdjustmentMultiplier = 1.0;

  // --------------------------------------------------------------------------
  // عامل الدور (Floor Adjustment)
  // --------------------------------------------------------------------------
  const floorLower = floor.toLowerCase();
  let floorImpact = 0;
  let floorDesc = '';

  if (floorLower.includes('حديقة') || floorLower.includes('جاردن') || floorLower.includes('garden')) {
    floorImpact = 12; // +12%
    floorDesc = 'الدور الأرضي المرفق بحديقة خاصة يتمتع بطلب سكني عالي ومساحة ترفيه خارجية مرغوبة للعائلات.';
  } else if (floorLower.includes('متكرر') || floorLower.includes('أول') || floorLower.includes('ثاني') || floorLower.includes('ثالث')) {
    floorImpact = 4; // +4%
    floorDesc = 'الأدوار المتكررة المفضلة (أول إلى ثالث) تتجنب رطوبة الأرضي وحرارة الأخير وتتمتع بأعلى طلب وسهولة في البيع.';
  } else if (floorLower.includes('بنتهاوس') || floorLower.includes('روف') || floorLower.includes('roof')) {
    floorImpact = 7; // +7%
    floorDesc = 'وحدات البنتهاوس مع مساحة روف مفتوحة تمنح خصوصية وإطلالة واسعة وجلسات خارجية راقية.';
  } else if (floorLower.includes('أخير') || floorLower.includes('اخير') || floorLower.includes('last')) {
    floorImpact = -7; // -7%
    floorDesc = 'الدور الأخير بدون روف يتعرض لأشعة الشمس المباشرة ومخاطر تسريب الأمطار مما يتطلب عزل حراري ومائي ممتاز.';
  } else if (floorLower.includes('أرضي') || floorLower.includes('ارضي') || floorLower.includes('ground')) {
    floorImpact = -6; // -6%
    floorDesc = 'الدور الأرضي المرتفع بدون حديقة يعاني من قلة الخصوصية والتعرض للضوضاء والأتربة.';
  } else {
    floorImpact = 2;
    floorDesc = 'دور تقليدي متطابق مع المعايير العامة.';
  }

  totalAdjustmentMultiplier *= (1 + (floorImpact / 100));
  explanationFactors.push({
    factor: `الدور (${floor})`,
    impactPct: floorImpact,
    sign: floorImpact > 0 ? '+' : floorImpact < 0 ? '-' : '=',
    description: floorDesc
  });

  // --------------------------------------------------------------------------
  // عامل التشطيب (Finishing Adjustment)
  // --------------------------------------------------------------------------
  const finishLower = finishing.toLowerCase();
  let finishImpact = 0;
  let finishDesc = '';

  if (finishLower.includes('الترا') || finishLower.includes('ألترا') || finishLower.includes('ultra') || finishLower.includes('تكييفات')) {
    finishImpact = 25; // +25%
    finishDesc = 'تشطيب ألترا سوبر لوكس فاخر وخامات مستوردة بالتكييفات والمطبخ يوفر على المشتري تكاليف التشطيب المرتفعة بالوقت الحالي.';
  } else if (finishLower.includes('كامل') || finishLower.includes('سوبر لوكس') || finishLower.includes('finished')) {
    finishImpact = 16; // +16%
    finishDesc = 'تشطيب كامل جاهز للسكن أو التأجير المباشر دون الحاجة لسيولة إضافية للتجهيز.';
  } else if (finishLower.includes('نصف') || finishLower.includes('semi')) {
    finishImpact = 0; // 0% (Benchmark Base)
    finishDesc = 'نصف تشطيب (محارة وحلوق وعلب كهرباء)؛ يمثل معيار التسعير الأساسي في السوق المصري.';
  } else if (finishLower.includes('محارة') || finishLower.includes('طوب') || finishLower.includes('core')) {
    finishImpact = -10; // -10%
    finishDesc = 'طوب أحمر أو محارة غير مكتملة؛ يتطلب خصماً سعرياً لتعويض المشتري عن مجهود ومصاريف التأسيس الشاملة.';
  } else {
    finishImpact = 5;
    finishDesc = 'مستوى تشطيب متوسط مقبول.';
  }

  totalAdjustmentMultiplier *= (1 + (finishImpact / 100));
  explanationFactors.push({
    factor: `حالة التشطيب (${finishing})`,
    impactPct: finishImpact,
    sign: finishImpact > 0 ? '+' : finishImpact < 0 ? '-' : '=',
    description: finishDesc
  });

  // --------------------------------------------------------------------------
  // عامل الإطلالة والواجهة (View & Orientation Adjustment)
  // --------------------------------------------------------------------------
  const viewLower = view.toLowerCase();
  let viewImpact = 0;
  let viewDesc = '';

  if (viewLower.includes('بحري') || viewLower.includes('لاندسكيب') || viewLower.includes('بحيرات') || viewLower.includes('لاجون') || viewLower.includes('بحر')) {
    viewImpact = 10; // +10%
    viewDesc = 'واجهة بحرية صريحة وإطلالة واسعة على مسطحات خضراء أو مائية تضمن تهوية ممتازة وأعلى قيمة تسويقية.';
  } else if (viewLower.includes('مفتوح') || viewLower.includes('رئيسي') || viewLower.includes('شارع واسع') || viewLower.includes('حديقة')) {
    viewImpact = 4; // +4%
    viewDesc = 'واجهة أمامية مفتوحة غير مجروحة تطل على شارع عريض يمنح الشقة إضاءة طبيعية جيدة.';
  } else if (viewLower.includes('جانبي') || viewLower.includes('فرعي')) {
    viewImpact = 0; // 0%
    viewDesc = 'إطلالة جانبية مقبولة على ممر أو شارع فرعي بدون ميزة إضافية أو خصم.';
  } else if (viewLower.includes('خلفي') || viewLower.includes('منور') || viewLower.includes('back')) {
    viewImpact = -9; // -9%
    viewDesc = 'إطلالة خلفية أو تطل على مناور داخلية تحد من الإضاءة وتتطلب خصماً ملموساً لإقناع المشترين.';
  } else {
    viewImpact = 2;
    viewDesc = 'إطلالة عادية متوازنة.';
  }

  totalAdjustmentMultiplier *= (1 + (viewImpact / 100));
  explanationFactors.push({
    factor: `الإطلالة والواجهة (${view})`,
    impactPct: viewImpact,
    sign: viewImpact > 0 ? '+' : viewImpact < 0 ? '-' : '=',
    description: viewDesc
  });

  // --------------------------------------------------------------------------
  // عامل مساحة الوحدة والسيولة (Size & Liquidity Factor)
  // --------------------------------------------------------------------------
  if (safeAreaSqm >= 240) {
    const sizeDiscount = -3;
    totalAdjustmentMultiplier *= (1 + (sizeDiscount / 100));
    explanationFactors.push({
      factor: `المساحة الكبيرة (${safeAreaSqm}م²)`,
      impactPct: sizeDiscount,
      sign: '-',
      description: 'المساحات الكبيرة تتطلب ميزانية إجمالية ضخمة مما يقلص شريحة المشترين ويفرض خصماً طفيفاً في سعر المتر لتسريع البيع.'
    });
  } else if (safeAreaSqm <= 130 && safeAreaSqm >= 80) {
    const sizePremium = 3;
    totalAdjustmentMultiplier *= (1 + (sizePremium / 100));
    explanationFactors.push({
      factor: `مساحة عالية الطلب (${safeAreaSqm}م²)`,
      impactPct: sizePremium,
      sign: '+',
      description: 'المساحات المتوسطة الأكثر طلباً تتمتع بأعلى سرعة دوران نقدي وسهولة في إعادة البيع.'
    });
  }

  // --------------------------------------------------------------------------
  // حساب الأسعار النهائية (العادل، السريع، المتفائل)
  // --------------------------------------------------------------------------
  const calculatedFairPricePerSqm = Math.round(baseMarketPricePerSqm * totalAdjustmentMultiplier);
  const fairTotal = Math.round(calculatedFairPricePerSqm * safeAreaSqm);

  // سعر البيع السريع (بخصم سيولة 8-10% للبيع خلال 30-60 يوم)
  const fastSalePricePerSqm = Math.round(calculatedFairPricePerSqm * 0.91);
  const fastSaleTotal = Math.round(fairTotal * 0.91);

  // السقف المتفائل (أعلى سعر تفاوضي ممكن بزيادة 8-10% مع بطء البيع)
  const optimisticPricePerSqm = Math.round(calculatedFairPricePerSqm * 1.09);
  const optimisticTotal = Math.round(fairTotal * 1.09);

  // رأي وخلاصة البروكر الشفاف
  const areaLabel = areaIntel ? areaIntel.nameAr : areaNameOrSlug;
  const subLabel = subDistrict ? ` (${subDistrict})` : '';

  let brokerValuationOpinion = `بناءً على واقع السوق الحالي في ${areaLabel}${subLabel} لنظام البيع الـ (${isCash ? 'كاش ريزيل' : 'تقسيط مشروعات'})، فإن القيمة السوقية العادلة للوحدة هي (${fairTotal.toLocaleString('ar-EG')} جنيه) بمتوسط (${calculatedFairPricePerSqm.toLocaleString('ar-EG')} ج/م). `;
  
  if (isCash) {
    brokerValuationOpinion += `في حال الرغبة في التسييل النقدي العاجل خلال شهرين، ننصح بعرض الوحدة بـ (${fastSaleTotal.toLocaleString('ar-EG')} جنيه) لجذب المشترين الجادين فوراً. أما إذا لم تكن في عجلة من أمرك فيمكنك التمسك بسعر (${optimisticTotal.toLocaleString('ar-EG')} جنيه) مع الاستعداد للانتظار حتى 6 أشهر.`;
  } else {
    brokerValuationOpinion += `هذا التقييم يعكس الأقساط الموزعة على فترات السداد الشائعة بالمنطقة مع الأخذ بالاعتبار مستوى التشطيب ومواصفات الدور.`;
  }

  // --------------------------------------------------------------------------
  // مقارنة السعر المطلوب (Asking Price Analysis) في حال تم تزويده
  // --------------------------------------------------------------------------
  let askingPriceAnalysis: AnalyticalValuationResult['askingPriceAnalysis'];

  if (askingPrice && askingPrice > 0) {
    const diffPct = Math.round(((askingPrice - fairTotal) / fairTotal) * 100);
    let status: 'لقطة سعرية' | 'سعر عادل معقول' | 'أعلى من السوق قليلاً' | 'مبالغ فيه بشدة';
    let advice = '';

    if (diffPct <= -10) {
      status = 'لقطة سعرية';
      advice = `السعر المطلوب يقل بنسبة ${Math.abs(diffPct)}% عن القيمة العادلة؛ صفقة استثمارية رابحة فوراً للمشتري وتتطلب إتمام الفحص القانوني والتنفيذي فوراً دون تردد.`;
    } else if (diffPct <= 4) {
      status = 'سعر عادل معقول';
      advice = `السعر المطلوب عادل ومتطابق تماماً مع أسعار السوق الحقيقية للمنطقة والمواصفات؛ تفاوض للحصول على خصم 3-5% أو جدولة أقساط الصيانة.`;
    } else if (diffPct <= 14) {
      status = 'أعلى من السوق قليلاً';
      advice = `السعر المطلوب يزيد بنسبة ${diffPct}% عن القيمة العادلة؛ يجب التفاوض لإنزال السعر بنحو ${(askingPrice - fairTotal).toLocaleString('ar-EG')} جنيه للوصول لرقم متوازن.`;
    } else {
      status = 'مبالغ فيه بشدة';
      advice = `السعر المطلوب مغالى فيه ويزيد بنسبة ${diffPct}% عن السوق؛ لن يتم بيع الوحدة بسهولة بهذا السعر إلا بتقديم تنازلات وتخفيض حقيقي للقيمة.`;
    }

    askingPriceAnalysis = {
      askingPrice,
      diffFromFairValuePct: diffPct,
      status,
      negotiationAdvice: advice
    };
  }

  return {
    baseMarketPricePerSqm,
    fairMarketValue: {
      total: fairTotal,
      pricePerSqm: calculatedFairPricePerSqm
    },
    fastSaleValue: {
      total: fastSaleTotal,
      pricePerSqm: fastSalePricePerSqm
    },
    optimisticCeiling: {
      total: optimisticTotal,
      pricePerSqm: optimisticPricePerSqm
    },
    estimatedDaysOnMarket: {
      fastSale: 'من 20 إلى 45 يوماً',
      fairMarket: 'من 45 إلى 90 يوماً',
      optimistic: 'من 90 إلى 180 يوماً أو أكثر (عرضة لركود الإعلان)'
    },
    confidenceLevel,
    explanationFactors,
    brokerValuationOpinion,
    askingPriceAnalysis
  };
}
