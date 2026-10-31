// ==============================================================================
// Sakanybot (سكنى بوت) - Real Estate Deal Scoring Engine (0-100)
// خوارزمية التقييم والسكور الرياضي الموزون للصفقات العقارية في مصر
// ==============================================================================

import { getAreaIntelligence } from '../knowledge/area-intelligence';
import { getDeveloperIntelligence } from '../knowledge/developer-intelligence';

export interface DealScoreInput {
  unitPrice: number; // السعر الإجمالي للوحدة بالجنيه المصري
  areaSqm: number; // مساحة الوحدة بالمتر المربع
  locationOrArea: string; // المنطقة أو الحي (مثال: بيت الوطن، مدينتي، R7، زايد...)
  paymentType?: 'كاش' | 'تقسيط' | string;
  downPaymentPct?: number; // نسبة المقدم (مثلاً 10 تعني 10%)
  installmentYears?: number; // مدة التقسيط بالسنوات (مثلاً 7)
  developerName?: string; // اسم المطور العقاري إن وجد
  deliveryDateOrYears?: string | number; // 'فوري' أو سنة الاستلام مثل 2025 أو عدد السنوات المتبقية
  finishingType?: 'طوب أحمر' | 'محارة' | 'نصف تشطيب' | 'تشطيب كامل' | 'الترا لوكس' | string;
  viewAndLocationRating?: 'بحري صريح / لاندسكيب وبحيرات' | 'واجهة مفتوحة / شارع رئيسي' | 'جانبي' | 'خلفي / منور' | string;
  customMarketAvgPricePerSqm?: number; // متوسط سعري مخصص للحي إن رغب المستخدم بتجاوز قاعدة المعرفة
}

export type VerdictLabel = 
  | 'صفقة لقطة استثمارية'
  | 'سعر ممتاز مناسب للسكن'
  | 'سعر عادل معقول'
  | 'سعر مبالغ فيه عن السوق'
  | 'صفقة عالية المخاطر';

export interface FactorScoreBreakdown {
  score: number; // النقاط المكتسبة
  maxScore: number; // الحد الأقصى للنقاط
  percentage: number; // النسبة المئوية
  status: 'ممتاز' | 'جيد جداً' | 'متوسط' | 'ضعيف' | 'سلبي';
  notes: string; // شرح موجز صريح
}

export interface DealScoreResult {
  totalScore: number; // السكور الإجمالي من 0 إلى 100
  verdictLabel: VerdictLabel;
  badgeColor: 'emerald' | 'blue' | 'amber' | 'orange' | 'rose';
  hexColor: string;
  calculatedPricePerSqm: number;
  benchmarkPricePerSqm: number;
  priceDiffPercentage: number; // الفارق المئوي عن السوق (-15% يعني أرخص بـ 15%)
  breakdown: {
    priceCompetitiveness: FactorScoreBreakdown; // وزن 30 نقطة
    paymentFlexibility: FactorScoreBreakdown; // وزن 20 نقطة
    developerCredibility: FactorScoreBreakdown; // وزن 15 نقطة
    deliveryRisk: FactorScoreBreakdown; // وزن 15 نقطة
    finishingQuality: FactorScoreBreakdown; // وزن 10 نقاط
    locationAndView: FactorScoreBreakdown; // وزن 10 نقاط
  };
  summaryArabic: string; // التقرير التحليلي النهائي بلغة البروكر المحترف
  prosList: string[];
  risksList: string[];
}

/**
 * خوارزمية التقييم الشامل للصفقة العقارية من 0 إلى 100
 */
export function calculatePropertyDealScore(params: DealScoreInput): DealScoreResult {
  const {
    unitPrice,
    areaSqm,
    locationOrArea,
    paymentType = 'تقسيط',
    downPaymentPct,
    installmentYears,
    developerName,
    deliveryDateOrYears,
    finishingType = 'نصف تشطيب',
    viewAndLocationRating = 'واجهة مفتوحة / شارع رئيسي',
    customMarketAvgPricePerSqm
  } = params;

  const prosList: string[] = [];
  const risksList: string[] = [];

  // التحقق من صحة المدخلات الأساسية
  const safeAreaSqm = Math.max(1, areaSqm || 100);
  const safeUnitPrice = Math.max(0, unitPrice || 0);
  const calculatedPricePerSqm = Math.round(safeUnitPrice / safeAreaSqm);

  const isCash = paymentType.includes('كاش') || (installmentYears !== undefined && installmentYears <= 0);

  // استخراج معيار المنطقة من قاعدة المعرفة
  const areaIntel = getAreaIntelligence(locationOrArea);
  let benchmarkPricePerSqm = customMarketAvgPricePerSqm || 0;

  if (!benchmarkPricePerSqm) {
    if (areaIntel) {
      benchmarkPricePerSqm = isCash 
        ? areaIntel.avg_price_per_sqm_cash 
        : areaIntel.avg_price_per_sqm_installments;
    } else {
      // متوسط عام افتراضي للقاهرة الجديدة وأكتوبر إن لم يتم التعرف على المنطقة بدقة
      benchmarkPricePerSqm = isCash ? 30000 : 45000;
    }
  }

  // حساب الفارق المئوي بين سعر المتر المعروض وسعر السوق المعياري
  const priceDiffPercentage = benchmarkPricePerSqm > 0
    ? Math.round(((calculatedPricePerSqm - benchmarkPricePerSqm) / benchmarkPricePerSqm) * 100)
    : 0;

  // --------------------------------------------------------------------------
  // العامل 1: تنافسية سعر المتر مقارنة بمتوسط الحي (الوزن: 30 نقطة)
  // --------------------------------------------------------------------------
  let priceScore = 20;
  let priceStatus: FactorScoreBreakdown['status'] = 'متوسط';
  let priceNotes = '';

  if (priceDiffPercentage <= -20) {
    priceScore = 30;
    priceStatus = 'ممتاز';
    priceNotes = `سعر المتر (${calculatedPricePerSqm.toLocaleString('ar-EG')} ج) يقل بأكثر من ${Math.abs(priceDiffPercentage)}% عن متوسط المنطقة المعياري؛ لقطة سعرية نادرة.`;
    prosList.push(`سعر متر تنافسي للغاية يقل بنسبة ${Math.abs(priceDiffPercentage)}% عن أسعار الحي.`);
  } else if (priceDiffPercentage <= -10) {
    priceScore = 27;
    priceStatus = 'ممتاز';
    priceNotes = `سعر المتر أقل بنسبة ${Math.abs(priceDiffPercentage)}% من متوسط المنطقة؛ فرصة ممتازة لهامش ربح فوري.`;
    prosList.push(`سعر أقل من متوسط السوق بنسبة ${Math.abs(priceDiffPercentage)}%.`);
  } else if (priceDiffPercentage <= -3) {
    priceScore = 24;
    priceStatus = 'جيد جداً';
    priceNotes = `سعر المتر مناسب جداً ويقل بنسبة ${Math.abs(priceDiffPercentage)}% عن المتوسط.`;
  } else if (priceDiffPercentage <= 4) {
    priceScore = 21;
    priceStatus = 'جيد جداً';
    priceNotes = `سعر المتر متطابق مع القيمة العادلة لأسعار السوق الحالية في ${areaIntel ? areaIntel.nameAr : locationOrArea}.`;
  } else if (priceDiffPercentage <= 15) {
    priceScore = 15;
    priceStatus = 'متوسط';
    priceNotes = `سعر المتر أعلى بنسبة ${priceDiffPercentage}% من متوسط المنطقة؛ يتطلب وجود مميزات تشطيب أو موقع استثنائي لتبريره.`;
    risksList.push(`سعر المتر أعلى من متوسط الحي بنسبة ${priceDiffPercentage}%.`);
  } else if (priceDiffPercentage <= 28) {
    priceScore = 9;
    priceStatus = 'ضعيف';
    priceNotes = `سعر المتر مبالغ فيه وأعلى بنسبة ${priceDiffPercentage}% من المعروض المماثل.`;
    risksList.push(`مبالغة سعرية بنسبة ${priceDiffPercentage}% قد تصعب عملية إعادة البيع السريعة.`);
  } else {
    priceScore = 4;
    priceStatus = 'سلبي';
    priceNotes = `سعر مضاربي مرتفع جداً يتجاوز متوسط الحي بأكثر من ${priceDiffPercentage}% بدون مبرر اقتصادي واضح.`;
    risksList.push(`مخاطرة سعرية عالية؛ السعر يفوق السوق بـ ${priceDiffPercentage}%.`);
  }

  // --------------------------------------------------------------------------
  // العامل 2: مرونة خطة السداد (الوزن: 20 نقطة)
  // --------------------------------------------------------------------------
  let paymentScore = 12;
  let paymentStatus: FactorScoreBreakdown['status'] = 'متوسط';
  let paymentNotes = '';

  if (isCash) {
    if (priceDiffPercentage <= -12) {
      paymentScore = 19;
      paymentStatus = 'ممتاز';
      paymentNotes = 'شراء كاش مصحوب بخصم سيولة نقدي قوي ومجزٍ يعوض تجميد رأس المال بالكامل.';
      prosList.push('خصم كاش نقدي مغرٍ يعزز العائد على رأس المال فوراً.');
    } else {
      paymentScore = 12;
      paymentStatus = 'متوسط';
      paymentNotes = 'بيع كاش يتطلب دفع كامل الثمن نقداً؛ لا يوفر رافعة مالية ولكنه يجنب المشتري أي التزامات وأقساط مستقبلية.';
    }
  } else {
    const dp = downPaymentPct ?? 15;
    const years = installmentYears ?? 6;

    let dpPoints = 5;
    if (dp <= 5) dpPoints = 10;
    else if (dp <= 10) dpPoints = 9;
    else if (dp <= 15) dpPoints = 7;
    else if (dp <= 20) dpPoints = 5;
    else if (dp <= 30) dpPoints = 3;
    else dpPoints = 1;

    let yrPoints = 5;
    if (years >= 8) yrPoints = 10;
    else if (years >= 7) yrPoints = 9;
    else if (years >= 5) yrPoints = 7;
    else if (years >= 3) yrPoints = 5;
    else yrPoints = 3;

    paymentScore = Math.min(20, dpPoints + yrPoints);

    if (paymentScore >= 17) {
      paymentStatus = 'ممتاز';
      paymentNotes = `خطة سداد فائقة المرونة: مقدم ${dp}% مع تقسيط مريح على ${years} سنوات يقلل عبء الأقساط الشهرية.`;
      prosList.push(`تسهيلات سداد ممتازة (مقدم ${dp}% وأقساط حتى ${years} سنوات).`);
    } else if (paymentScore >= 13) {
      paymentStatus = 'جيد جداً';
      paymentNotes = `خطة سداد متوازنة (مقدم ${dp}% وأقساط على ${years} سنوات).`;
    } else if (paymentScore >= 9) {
      paymentStatus = 'متوسط';
      paymentNotes = `خطة سداد مقبولة ولكن سنوات التقسيط (${years}) أو نسبة المقدم (${dp}%) تشكل ضغطاً مالياً.`;
    } else {
      paymentStatus = 'ضعيف';
      paymentNotes = `شروط دفع متشددة (مقدم مرتفع ${dp}% أو سنوات تقسيط قصيرة ${years} سنوات).`;
      risksList.push('أقساط سنوية أو ربع سنوية ثقيلة نتيجة قصر مدة السداد.');
    }
  }

  // --------------------------------------------------------------------------
  // العامل 3: قوة المطور وسابقة الأعمال (الوزن: 15 نقطة)
  // --------------------------------------------------------------------------
  let devScore = 8;
  let devStatus: FactorScoreBreakdown['status'] = 'متوسط';
  let devNotes = '';

  const devIntel = developerName ? getDeveloperIntelligence(developerName) : null;

  if (devIntel) {
    if (devIntel.tier === 'Tier 1') {
      devScore = devIntel.delivery_on_time_rating >= 92 ? 15 : 14;
      devStatus = 'ممتاز';
      devNotes = `مطور فئة أولى معتمد (${devIntel.nameAr}) بسابقة أعمال تاريخية وموثوقية عالية في إعادة البيع والإدارة.`;
      prosList.push(`مطور موثوق فئة أولى (${devIntel.nameAr}) يضمن سيولة إعادة البيع.`);
    } else if (devIntel.tier === 'Tier 2') {
      devScore = devIntel.delivery_on_time_rating >= 86 ? 12 : 11;
      devStatus = 'جيد جداً';
      devNotes = `مطور معروف ومستقر (${devIntel.nameAr}) ذو مشروعات قائمة وملاءة مالية جيدة.`;
    } else {
      devScore = 9;
      devStatus = 'متوسط';
      devNotes = `مطور صاعد أو فئة ثالثة (${devIntel.nameAr})؛ يُنصح بمتابعة رخصة البناء وتراخيص الأرض بدقة.`;
      risksList.push('يجب فحص الموقف الإنشائي والقانوني لرخصة الأرض مع جهاز المدينة.');
    }
  } else if (developerName && developerName.trim().length > 2) {
    devScore = 7;
    devStatus = 'متوسط';
    devNotes = `شركة تطوير متوسطة أو فردية (${developerName}) غير مصنفة ضمن كبرى الشركات، تتطلب فحصاً قانونياً للعقد.`;
    risksList.push(`المطور (${developerName}) غير مدرج ضمن كبار المطورين المعتمدين؛ يلزم مراجعة التراخيص وسوابق الأعمال.`);
  } else {
    devScore = 6;
    devStatus = 'متوسط';
    devNotes = 'عمارة منفردة أو مطور غير محدد؛ يعتمد التقييم على قوة الموقع والتسليم الفعلي على أرض الواقع.';
  }

  // --------------------------------------------------------------------------
  // العامل 4: موعد الاستلام ومخاطر الانتظار (الوزن: 15 نقطة)
  // --------------------------------------------------------------------------
  let deliveryScore = 10;
  let deliveryStatus: FactorScoreBreakdown['status'] = 'متوسط';
  let deliveryNotes = '';

  const delStr = String(deliveryDateOrYears || '').toLowerCase();
  let remainingYears = 2; // افتراضي سنتين

  if (delStr.includes('فوري') || delStr.includes('جاهز') || delStr.includes('ready') || delStr === '0') {
    remainingYears = 0;
  } else if (!isNaN(Number(deliveryDateOrYears))) {
    const num = Number(deliveryDateOrYears);
    if (num > 2020) {
      const currentYear = new Date().getFullYear();
      remainingYears = Math.max(0, num - currentYear);
    } else {
      remainingYears = num;
    }
  } else {
    // محاولة استخراج رقم من النص
    const match = delStr.match(/\d+/);
    if (match) {
      const parsed = parseInt(match[0], 10);
      if (parsed > 2020) {
        remainingYears = Math.max(0, parsed - new Date().getFullYear());
      } else {
        remainingYears = parsed;
      }
    }
  }

  if (remainingYears === 0) {
    deliveryScore = 15;
    deliveryStatus = 'ممتاز';
    deliveryNotes = 'استلام فوري؛ صفر مخاطرة إنشائية، إمكانية المعاينة على الطبيعة والسكن أو التأجير فوراً.';
    prosList.push('استلام فوري يوفر عائداً إيجارياً مباشراً وينفي أي مخاطر تأخير.');
  } else if (remainingYears <= 1) {
    deliveryScore = 13;
    deliveryStatus = 'جيد جداً';
    deliveryNotes = 'استلام قريب خلال سنة؛ نسبة الإنجاز بالموقع مرتفعة ومخاطر التعثر الإنشائي محدودة جداً.';
    prosList.push('موعد استلام قريب خلال 12 شهراً.');
  } else if (remainingYears <= 2.5) {
    deliveryScore = 11;
    deliveryStatus = 'جيد جداً';
    deliveryNotes = `استلام خلال سنتين؛ وتيرة إنشاءات متوازنة تتيح التوازن بين الأقساط وموعد السكن.`;
  } else if (remainingYears <= 3.5) {
    deliveryScore = 8;
    deliveryStatus = 'متوسط';
    deliveryNotes = `استلام خلال 3 إلى 4 سنوات؛ يتطلب صبراً ومتابعة دورية لتقدم الأعمال الخرسانية والتشطيب.`;
    risksList.push('أفق استلام طويل (3-4 سنوات) يعرض الوحدة لفرص بديلة خلال فترة الانتظار.');
  } else {
    deliveryScore = 5;
    deliveryStatus = 'ضعيف';
    deliveryNotes = `استلام بعد 4 أو 5 سنوات أو أكثر؛ مخاطر انتظار طويلة وتأثر بتقلبات أسعار مواد البناء وتكاليف التعويم.`;
    risksList.push('فترة انتظار طويلة جداً تزيد من مخاطر تأخر التسليم وتجمد السيولة.');
  }

  // --------------------------------------------------------------------------
  // العامل 5: مستوى التشطيب (الوزن: 10 نقاط)
  // --------------------------------------------------------------------------
  let finishScore = 6;
  let finishStatus: FactorScoreBreakdown['status'] = 'متوسط';
  let finishNotes = '';

  const fStr = finishingType.toLowerCase();
  if (fStr.includes('الترا') || fStr.includes('ألترا') || fStr.includes('ultra') || fStr.includes('سوبر لوكس بالفرش')) {
    finishScore = 10;
    finishStatus = 'ممتاز';
    finishNotes = 'تشطيب ألترا لوكس فاخر وجاهز للسكن؛ يوفر على المشتري تكاليف وخامات التشطيب المرتفعة.';
    prosList.push('تشطيب كامل فاخر يوفر مجهود وتكاليف التشطيب المرتفعة بالوقت الحالي.');
  } else if (fStr.includes('كامل') || fStr.includes('لوكس') || fStr.includes('سوبر') || fStr.includes('finished')) {
    finishScore = 8;
    finishStatus = 'جيد جداً';
    finishNotes = 'تشطيب كامل جيد يوفر سرعة الانتقال أو سهولة التأجير الفوري.';
    prosList.push('تشطيب كامل يقلل زمن التجهيز.');
  } else if (fStr.includes('نصف') || fStr.includes('semi')) {
    finishScore = 6;
    finishStatus = 'متوسط';
    finishNotes = 'نصف تشطيب (محارة وحلوق ووصلات تأسيس)؛ يمنحك حرية اختيار الديكورات لكنه يتطلب ميزانية إضافية.';
  } else {
    finishScore = 3;
    finishStatus = 'ضعيف';
    finishNotes = 'طوب أحمر / محارة فقط؛ يتطلب ميزانية تشطيب ضخمة لا تقل عن 4000 - 6000 جنيه للمتر في الوقت الراهن.';
    risksList.push('تحتاج الوحدة إلى ميزانية تشطيب نقدية إضافية ضخمة قبل السكن.');
  }

  // --------------------------------------------------------------------------
  // العامل 6: الموقع والفيو (الوزن: 10 نقاط)
  // --------------------------------------------------------------------------
  let viewScore = 7;
  let viewStatus: FactorScoreBreakdown['status'] = 'متوسط';
  let viewNotes = '';

  const vStr = viewAndLocationRating.toLowerCase();
  if (vStr.includes('بحري') || vStr.includes('لاندسكيب') || vStr.includes('بحيرات') || vStr.includes('لاجون') || vStr.includes('prime')) {
    viewScore = 10;
    viewStatus = 'ممتاز';
    viewNotes = 'إطلالة بحرية مفتوحة ومميزة على لاندسكيب أو بحيرات تمنح الوحدة تهوية استثنائية وأعلى قيمة عند إعادة البيع.';
    prosList.push('إطلالة مميزة وواجهة بحرية ترفع من رغبة المشترين والمستأجرين.');
  } else if (vStr.includes('مفتوح') || vStr.includes('رئيسي') || vStr.includes('حديقة') || vStr.includes('شارع عريض')) {
    viewScore = 8;
    viewStatus = 'جيد جداً';
    viewNotes = 'واجهة أمامية مفتوحة تطل على شارع واسع أو حديقة مع خصوصية جيدة وإضاءة طبيعية وافرة.';
  } else if (vStr.includes('جانبي') || vStr.includes('شارع فرعي')) {
    viewScore = 6;
    viewStatus = 'متوسط';
    viewNotes = 'إطلالة جانبية مقبولة على شارع فرعي أو ممر داخلي.';
  } else {
    viewScore = 3;
    viewStatus = 'ضعيف';
    viewNotes = 'إطلالة خلفية أو تطل على منور داخلي ضيق؛ تقلل من سهولة البيع وتتطلب تنازلاً في السعر.';
    risksList.push('الإطلالة الخلفية أو غير المفتوحة تقلل من جاذبية الوحدة عند إعادة البيع.');
  }

  // --------------------------------------------------------------------------
  // حساب المجموع الكلي وتحديد التصنيف النهائي
  // --------------------------------------------------------------------------
  const totalScore = Math.min(100, Math.max(0, priceScore + paymentScore + devScore + deliveryScore + finishScore + viewScore));

  let verdictLabel: VerdictLabel;
  let badgeColor: DealScoreResult['badgeColor'];
  let hexColor: string;

  if (totalScore >= 86) {
    verdictLabel = 'صفقة لقطة استثمارية';
    badgeColor = 'emerald';
    hexColor = '#10B981';
  } else if (totalScore >= 73) {
    verdictLabel = 'سعر ممتاز مناسب للسكن';
    badgeColor = 'blue';
    hexColor = '#3B82F6';
  } else if (totalScore >= 58) {
    verdictLabel = 'سعر عادل معقول';
    badgeColor = 'amber';
    hexColor = '#F59E0B';
  } else if (totalScore >= 45) {
    verdictLabel = 'سعر مبالغ فيه عن السوق';
    badgeColor = 'orange';
    hexColor = '#F97316';
  } else {
    verdictLabel = 'صفقة عالية المخاطر';
    badgeColor = 'rose';
    hexColor = '#EF4444';
  }

  // صياغة خلاصة البروكر الذكية
  const areaNameDisplay = areaIntel ? areaIntel.nameAr : locationOrArea;
  let summaryArabic = '';

  if (totalScore >= 86) {
    summaryArabic = `صفقة استثنائية بسكور (${totalScore}/100). الوحدة في (${areaNameDisplay}) تمثل "فرصة لقطة" نادرة بفضل سعر المتر التنافسي (${calculatedPricePerSqm.toLocaleString('ar-EG')} ج/م) الذي يقل عن متوسط السوق بنسبة ${Math.abs(priceDiffPercentage)}%، مع قوة في خطة السداد وسرعة التسليم. ننصح بحجزها فوراً بعد الفحص القانوني الروتيني.`;
  } else if (totalScore >= 73) {
    summaryArabic = `عرض سكني قوي وموثوق بسكور (${totalScore}/100). السعر في (${areaNameDisplay}) متوازن جداً ومعقول، ومواصفات الوحدة والمطور تضمن أمان الاستثمار وراحة السكن العائلي بدون أي مجازفات كبرى. خيار رائع للشراء بهدف الاستقرار أو الحفظ المالي.`;
  } else if (totalScore >= 58) {
    summaryArabic = `صفقة بسعر عادل ومتطابق مع السوق بسكور (${totalScore}/100). السعر المعروض (${calculatedPricePerSqm.toLocaleString('ar-EG')} ج/م) لا يتضمن هامش لقطة ولكنه يعكس السعر الحالي العادل للحي بدون مبالغة فجة. يمكن التفاوض للحصول على خصم 5-8% إضافي أو مد سنوات الأقساط لترقيتها إلى صفقة ممتازة.`;
  } else if (totalScore >= 45) {
    summaryArabic = `سعر أعلى من متوسط الحي بسكور (${totalScore}/100). السعر الإجمالي يتضمن زيادة قدرها ${priceDiffPercentage}% عن متوسط المنطقة المعياري في (${areaNameDisplay}). لا ننصح بالشراء بهذا الرقم إلا إذا كان البائع مستعداً لخصم تفاوضي حقيقي لتصحيح التقييم.`;
  } else {
    summaryArabic = `تنبيه مخاطر عقارية بسكور (${totalScore}/100). الصفقة تشتمل على عوامل سلبية مؤثرة (إما مبالغة سعرية حادة تفوق قدرة المنطقة على الاستيعاب، أو موعد استلام بعيد جداً مع مطور غير معتمد، أو شروط دفع مجحفة). يُنصح بالحذر الشديد والبحث عن بدائل أكثر استقراراً.`;
  }

  return {
    totalScore,
    verdictLabel,
    badgeColor,
    hexColor,
    calculatedPricePerSqm,
    benchmarkPricePerSqm,
    priceDiffPercentage,
    breakdown: {
      priceCompetitiveness: {
        score: priceScore,
        maxScore: 30,
        percentage: Math.round((priceScore / 30) * 100),
        status: priceStatus,
        notes: priceNotes
      },
      paymentFlexibility: {
        score: paymentScore,
        maxScore: 20,
        percentage: Math.round((paymentScore / 20) * 100),
        status: paymentStatus,
        notes: paymentNotes
      },
      developerCredibility: {
        score: devScore,
        maxScore: 15,
        percentage: Math.round((devScore / 15) * 100),
        status: devStatus,
        notes: devNotes
      },
      deliveryRisk: {
        score: deliveryScore,
        maxScore: 15,
        percentage: Math.round((deliveryScore / 15) * 100),
        status: deliveryStatus,
        notes: deliveryNotes
      },
      finishingQuality: {
        score: finishScore,
        maxScore: 10,
        percentage: Math.round((finishScore / 10) * 100),
        status: finishStatus,
        notes: finishNotes
      },
      locationAndView: {
        score: viewScore,
        maxScore: 10,
        percentage: Math.round((viewScore / 10) * 100),
        status: viewStatus,
        notes: viewNotes
      }
    },
    summaryArabic,
    prosList,
    risksList
  };
}
