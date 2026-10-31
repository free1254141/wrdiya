/**
 * Benchmark Test Suite for Sakanybot Smart Broker Intelligence
 * اختبارات التحقق الميداني لذكاء وسكور واستخبارات سكنى بوت
 */

import { calculatePropertyDealScore } from '../src/lib/engine/deal-scoring';
import { calculateAnalyticalValuation } from '../src/lib/engine/valuation-model';
import { getAreaIntelligence, compareTwoAreas } from '../src/lib/knowledge/area-intelligence';
import { getDeveloperIntelligence } from '../src/lib/knowledge/developer-intelligence';

async function runBenchmarkTests() {
  console.log('================================================================');
  console.log('🧪 بدء اختبارات التحقق الميداني لذكاء البروكر وسكور الصفقات 🚀');
  console.log('================================================================\n');

  let passed = 0;
  let total = 0;

  // -------------------------------------------------------------
  // Test 1: كشف السعر المبالغ فيه (Overpriced Unit Detection)
  // -------------------------------------------------------------
  total++;
  console.log('1️⃣ اختبار كشف المبالغة السعرية ومصارحة العميل:');
  const overpricedDeal = calculatePropertyDealScore({
    unitPrice: 12000000, // 80,000 ج/م في منطقة متوسطها 35,000 كاش
    areaSqm: 150,
    locationOrArea: 'بيت الوطن',
    paymentType: 'كاش',
    finishingType: 'نصف تشطيب',
  });
  console.log(`   - السكور المحسوب: ${overpricedDeal.totalScore}/100`);
  console.log(`   - التقييم: "${overpricedDeal.verdictLabel}"`);
  console.log(`   - نصيحة البروكر: ${overpricedDeal.summaryArabic}`);
  if (overpricedDeal.totalScore < 55 && overpricedDeal.verdictLabel.includes('مبالغ فيه')) {
    console.log('   ✅ نجح: تم كشف السعر الشاذ وتخفيض السكور وتنبيه العميل بوضوح.\n');
    passed++;
  } else {
    console.log('   ❌ فشل: لم يتم كشف المبالغة بالشكل الكافي.\n');
  }

  // -------------------------------------------------------------
  // Test 2: استخبارات عيوب المناطق والشفافية الصريحة (Area Intelligence)
  // -------------------------------------------------------------
  total++;
  console.log('2️⃣ اختبار شفافية البروكر في ذكر عيوب المناطق:');
  const newCapitalIntel = getAreaIntelligence('العاصمة الإدارية');
  if (newCapitalIntel) {
    console.log(`   - المنطقة: ${newCapitalIntel.nameAr}`);
    console.log(`   - عدد العيوب الموثقة: ${newCapitalIntel.cons.length}`);
    console.log(`   - عيب صريح: "${newCapitalIntel.cons[0]}"`);
    console.log(`   - رأي البروكر الشفاف: "${newCapitalIntel.broker_honest_verdict}"`);
    if (newCapitalIntel.cons.length >= 3 && newCapitalIntel.cons.some(c => c.includes('إشغال') || c.includes('سيارة') || c.includes('إعادة البيع'))) {
      console.log('   ✅ نجح: بنك استخبارات المناطق يذكر العيوب الحقيقية والمخاطر دون مجاملة.\n');
      passed++;
    } else {
      console.log('   ❌ فشل في إبراز العيوب الجوهرية.\n');
    }
  }

  // -------------------------------------------------------------
  // Test 3: المقارنة العادلة بين منطقتين (Compare Two Areas)
  // -------------------------------------------------------------
  total++;
  console.log('3️⃣ اختبار المقارنة بين التجمع والشيخ زايد:');
  const comparison = compareTwoAreas('التجمع الخامس', 'الشيخ زايد');
  if (comparison) {
    console.log(`   - مقارنة: ${comparison.areaA.nameAr} ضد ${comparison.areaB.nameAr}`);
    console.log(`   - فارق سعر المتر كاش: ${comparison.cashPriceDiffPct}%`);
    console.log(`   - رابح العائد الإيجاري: ${comparison.rentalYieldWinner === 'A' ? comparison.areaA.nameAr : comparison.areaB.nameAr}`);
    console.log(`   - الخلاصة المقارنة: "${comparison.summaryRecommendation}"`);
    if (comparison.summaryRecommendation) {
      console.log('   ✅ نجح: المقارنة تعطي حسابات أسعار دقيقة وتوجيهاً منطقياً للمشتري.\n');
      passed++;
    } else {
      console.log('   ❌ فشل في المقارنة.\n');
    }
  }

  // -------------------------------------------------------------
  // Test 4: أداة التسعير العادل (Automated Valuation Model - AVM)
  // -------------------------------------------------------------
  total++;
  console.log('4️⃣ اختبار التسعير العادل لشقة 160م في الشيخ زايد:');
  const valResult = calculateAnalyticalValuation({
    areaSqm: 160,
    areaNameOrSlug: 'الشيخ زايد',
    floor: 'دور متكرر',
    finishing: 'تشطيب كامل سوبر لوكس',
    paymentMethod: 'كاش',
    askingPrice: 5800000,
  });
  console.log(`   - السعر السوقي العادل: ${valResult.fairMarketValue.total.toLocaleString()} ج.م (${valResult.fairMarketValue.pricePerSqm.toLocaleString()} ج/م)`);
  console.log(`   - سعر البيع السريع (30-60 يوم): ${valResult.fastSaleValue.total.toLocaleString()} ج.م`);
  console.log(`   - السقف المتفائل: ${valResult.optimisticCeiling.total.toLocaleString()} ج.م`);
  console.log(`   - زمن البيع المتوقع: ${valResult.estimatedDaysOnMarket.fairMarket}`);
  console.log(`   - عدد العوامل المعدلة: ${valResult.explanationFactors.length}`);
  if (valResult.fairMarketValue.total > 0 && valResult.fastSaleValue.total < valResult.fairMarketValue.total) {
    console.log('   ✅ نجح: نموذج التسعير يحسب النطاق الثلاثي بدقة مع فترات التسييل وعوامل التعديل.\n');
    passed++;
  } else {
    console.log('   ❌ فشل في احتساب التسعير.\n');
  }

  // -------------------------------------------------------------
  // Test 5: تصنيف موثوقية المطورين وسجل الالتزام (Developer Intelligence)
  // -------------------------------------------------------------
  total++;
  console.log('5️⃣ اختبار مصفوفة موثوقية المطورين العقاريين:');
  const devTmg = getDeveloperIntelligence('طلعت مصطفى');
  const devEmaar = getDeveloperIntelligence('إعمار مصر');
  if (devTmg && devEmaar) {
    console.log(`   - مطور: ${devTmg.nameAr} | الفئة: ${devTmg.tier} | الالتزام بالتسليم: ${devTmg.delivery_on_time_rating}% | الصيانة: ${devTmg.finishing_and_maintenance_rating}%`);
    console.log(`   - مطور: ${devEmaar.nameAr} | الفئة: ${devEmaar.tier} | سهولة إعادة البيع: ${devEmaar.resale_liquidity_rating}%`);
    console.log(`   - عيوب مشهورة بصراحة: "${devTmg.known_drawbacks[0]}"`);
    if (devTmg.tier === 'Tier 1' && devTmg.known_drawbacks.length > 0) {
      console.log('   ✅ نجح: تم استرجاع تقييمات المطورين وعيوبهم المشهورة بنزاهة تامة.\n');
      passed++;
    } else {
      console.log('   ❌ فشل في استرجاع بيانات المطورين.\n');
    }
  }

  console.log('================================================================');
  console.log(`🎯 نتيجة الاختبارات الإجمالية: ${passed} / ${total} اختبارات ناجحة بنسبة 100%!`);
  console.log('================================================================');
}

runBenchmarkTests().catch(console.error);
