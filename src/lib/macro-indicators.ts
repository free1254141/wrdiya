export interface MacroBenchmarks {
  updatedAt: string;
  bankCdAnnualPct: number;
  goldAnnualGrowthPct: number;
  propertyAnnualGrowthPct: number;
  propertyRentalYieldPct: number;
  inflationPct: number;
  sourceLabelAr: string;
}

export const EGYPT_MACRO_BENCHMARKS_2026: MacroBenchmarks = {
  updatedAt: 'نوفمبر 2026',
  bankCdAnnualPct: 22.0, // متوسط عائد الشهادات البنكية السنوية
  goldAnnualGrowthPct: 26.0, // متوسط التحوط السنوي بالذهب في مصر
  propertyAnnualGrowthPct: 22.0, // متوسط نمو قيمة العقار الرأسمالي سنوياً
  propertyRentalYieldPct: 6.5, // متوسط العائد الإيجاري بعد الاستلام
  inflationPct: 21.0,
  sourceLabelAr: 'مؤشرات البنك المركزي المصري ومتوسطات السوق العقاري 2026',
};

export interface InvestmentComparisonResult {
  totalCashPaid: number;
  propertyFutureValue: number;
  propertyRentalEarned: number;
  propertyTotalWealth: number;
  bankFinalWealth: number;
  goldFinalWealth: number;
  winner: 'real_estate' | 'gold' | 'bank';
  winnerLabelAr: string;
}

export function compareRealEstateVsBankVsGold(params: {
  downPayment: number;
  monthlyInstallment: number;
  years?: number;
  bankRatePct?: number;
  goldGrowthPct?: number;
  propertyGrowthPct?: number;
  rentalYieldPct?: number;
}): InvestmentComparisonResult {
  const years = Math.max(1, Math.min(15, params.years ?? 7));
  const dp = Math.max(0, params.downPayment);
  const monthly = Math.max(0, params.monthlyInstallment);
  const bankRate = (params.bankRatePct ?? EGYPT_MACRO_BENCHMARKS_2026.bankCdAnnualPct) / 100;
  const goldRate = (params.goldGrowthPct ?? EGYPT_MACRO_BENCHMARKS_2026.goldAnnualGrowthPct) / 100;
  const propRate = (params.propertyGrowthPct ?? EGYPT_MACRO_BENCHMARKS_2026.propertyAnnualGrowthPct) / 100;
  const rentYield = (params.rentalYieldPct ?? EGYPT_MACRO_BENCHMARKS_2026.propertyRentalYieldPct) / 100;

  const totalCashPaid = dp + monthly * 12 * years;

  // 1. Real Estate on Installments (Leveraged asset appreciation on full unit price)
  const initialUnitPrice = totalCashPaid;
  const propertyFutureValue = Math.round(initialUnitPrice * Math.pow(1 + propRate, years));

  // Assume handover in year 3 -> rental income earned from year 4 to year N
  let propertyRentalEarned = 0;
  for (let y = 4; y <= years; y++) {
    const valAtYear = initialUnitPrice * Math.pow(1 + propRate, y - 1);
    propertyRentalEarned += Math.round(valAtYear * rentYield);
  }
  const propertyTotalWealth = propertyFutureValue + propertyRentalEarned;

  // 2. Bank CDs (DCA compounding annually with monthly contributions)
  let bankWealth = dp;
  const annualContribution = monthly * 12;
  for (let y = 1; y <= years; y++) {
    bankWealth = (bankWealth + annualContribution * 0.5) * (1 + bankRate) + annualContribution * 0.5;
  }
  const bankFinalWealth = Math.round(bankWealth);

  // 3. Gold (DCA compounding annually)
  let goldWealth = dp;
  for (let y = 1; y <= years; y++) {
    goldWealth = (goldWealth + annualContribution * 0.5) * (1 + goldRate) + annualContribution * 0.5;
  }
  const goldFinalWealth = Math.round(goldWealth);

  let winner: 'real_estate' | 'gold' | 'bank' = 'real_estate';
  let winnerLabelAr = 'العقار بالتقسيط 🏆 (بفضل الرافعة المالية وتآكل القسط بالتضخم)';

  if (goldFinalWealth > propertyTotalWealth && goldFinalWealth >= bankFinalWealth) {
    winner = 'gold';
    winnerLabelAr = 'الذهب 🥇 (بناءً على نسبة النمو المدخلة)';
  } else if (bankFinalWealth > propertyTotalWealth && bankFinalWealth > goldFinalWealth) {
    winner = 'bank';
    winnerLabelAr = 'الشهادات البنكية 🏦 (للسيولة الشهرية والعائد المضمون)';
  }

  return {
    totalCashPaid,
    propertyFutureValue,
    propertyRentalEarned,
    propertyTotalWealth,
    bankFinalWealth,
    goldFinalWealth,
    winner,
    winnerLabelAr,
  };
}
