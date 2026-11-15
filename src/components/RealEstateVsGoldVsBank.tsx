'use client';

import React, { useState, useMemo } from 'react';
import { TrendingUp, Landmark, Coins, Building2, Trophy } from 'lucide-react';
import {
  EGYPT_MACRO_BENCHMARKS_2026,
  compareRealEstateVsBankVsGold,
} from '@/lib/macro-indicators';

interface RealEstateVsGoldVsBankProps {
  downPayment: number;
  monthlyInstallment: number;
}

export default function RealEstateVsGoldVsBank({
  downPayment,
  monthlyInstallment,
}: RealEstateVsGoldVsBankProps) {
  const [years, setYears] = useState<number>(7);
  const [bankRate, setBankRate] = useState<number>(
    EGYPT_MACRO_BENCHMARKS_2026.bankCdAnnualPct
  );
  const [goldRate, setGoldRate] = useState<number>(
    EGYPT_MACRO_BENCHMARKS_2026.goldAnnualGrowthPct
  );
  const [propRate, setPropRate] = useState<number>(
    EGYPT_MACRO_BENCHMARKS_2026.propertyAnnualGrowthPct
  );

  const result = useMemo(
    () =>
      compareRealEstateVsBankVsGold({
        downPayment,
        monthlyInstallment,
        years,
        bankRatePct: bankRate,
        goldGrowthPct: goldRate,
        propertyGrowthPct: propRate,
      }),
    [downPayment, monthlyInstallment, years, bankRate, goldRate, propRate]
  );

  const fmtM = (n: number) =>
    (n / 1_000_000).toLocaleString('ar-EG', { maximumFractionDigits: 2 });

  return (
    <section className="my-10 rounded-3xl border border-zinc-800 bg-zinc-900/75 p-6 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-5">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-amber-400" />
            <span>أيهما أفضل لميزانيتك: العقار بالتقسيط أم الشهادات البنكية أم الذهب؟</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            مقارنة استثمارية لمدة {years} سنوات بنفس المقدم والقسط الشهري ({EGYPT_MACRO_BENCHMARKS_2026.sourceLabelAr})
          </p>
        </div>
        <span className="rounded-full bg-amber-500/15 border border-amber-500/30 px-3 py-1 text-[11px] font-bold text-amber-300">
          {EGYPT_MACRO_BENCHMARKS_2026.updatedAt}
        </span>
      </div>

      {/* Adjustable Rates */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 text-xs">
        <div className="rounded-xl bg-zinc-950 border border-zinc-800 p-3">
          <label className="text-zinc-400 block mb-1">مدة المقارنة (سنوات)</label>
          <input
            type="number"
            min={3}
            max={12}
            value={years}
            onChange={(e) => setYears(Math.max(3, Math.min(12, Number(e.target.value))))}
            className="w-full bg-transparent font-black text-white text-sm focus:outline-none"
          />
        </div>
        <div className="rounded-xl bg-zinc-950 border border-zinc-800 p-3">
          <label className="text-zinc-400 block mb-1">نمو العقار السنوي (%)</label>
          <input
            type="number"
            min={5}
            max={50}
            value={propRate}
            onChange={(e) => setPropRate(Math.max(0, Number(e.target.value)))}
            className="w-full bg-transparent font-black text-amber-400 text-sm focus:outline-none"
          />
        </div>
        <div className="rounded-xl bg-zinc-950 border border-zinc-800 p-3">
          <label className="text-zinc-400 block mb-1">عائد الشهادات السنوي (%)</label>
          <input
            type="number"
            min={5}
            max={40}
            value={bankRate}
            onChange={(e) => setBankRate(Math.max(0, Number(e.target.value)))}
            className="w-full bg-transparent font-black text-cyan-400 text-sm focus:outline-none"
          />
        </div>
        <div className="rounded-xl bg-zinc-950 border border-zinc-800 p-3">
          <label className="text-zinc-400 block mb-1">نمو الذهب السنوي (%)</label>
          <input
            type="number"
            min={5}
            max={50}
            value={goldRate}
            onChange={(e) => setGoldRate(Math.max(0, Number(e.target.value)))}
            className="w-full bg-transparent font-black text-yellow-300 text-sm focus:outline-none"
          />
        </div>
      </div>

      {/* 3 Scenario Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
        {/* Real Estate */}
        <div
          className={`rounded-2xl border p-4 transition ${
            result.winner === 'real_estate'
              ? 'border-amber-500 bg-amber-500/10'
              : 'border-zinc-800 bg-zinc-950/60'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="font-black text-sm text-white flex items-center gap-1.5">
              <Building2 className="h-4 w-4 text-amber-400" />
              شراء عقار بالتقسيط
            </span>
            {result.winner === 'real_estate' && (
              <span className="text-[10px] font-black bg-amber-500 text-black px-2 py-0.5 rounded-full">
                الأفضل 🏆
              </span>
            )}
          </div>
          <div className="text-2xl font-black text-amber-400 font-mono">
            {fmtM(result.propertyTotalWealth)} مليون ج.م
          </div>
          <p className="text-[11px] text-zinc-400 mt-1.5 leading-relaxed">
            قيمة الوحدة ({fmtM(result.propertyFutureValue)} م) + إيجارات بعد الاستلام ({fmtM(result.propertyRentalEarned)} م)
          </p>
        </div>

        {/* Gold */}
        <div
          className={`rounded-2xl border p-4 transition ${
            result.winner === 'gold'
              ? 'border-yellow-400 bg-yellow-500/10'
              : 'border-zinc-800 bg-zinc-950/60'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="font-black text-sm text-white flex items-center gap-1.5">
              <Coins className="h-4 w-4 text-yellow-300" />
              الاستثمار في الذهب
            </span>
            {result.winner === 'gold' && (
              <span className="text-[10px] font-black bg-yellow-400 text-black px-2 py-0.5 rounded-full">
                الأفضل 🥇
              </span>
            )}
          </div>
          <div className="text-2xl font-black text-yellow-300 font-mono">
            {fmtM(result.goldFinalWealth)} مليون ج.م
          </div>
          <p className="text-[11px] text-zinc-400 mt-1.5 leading-relaxed">
            تحوط ممتاز وسريع التسييل، لكنه لا يدر دخلاً إيجارياً شهرياً كالعقار.
          </p>
        </div>

        {/* Bank CDs */}
        <div
          className={`rounded-2xl border p-4 transition ${
            result.winner === 'bank'
              ? 'border-cyan-400 bg-cyan-500/10'
              : 'border-zinc-800 bg-zinc-950/60'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="font-black text-sm text-white flex items-center gap-1.5">
              <Landmark className="h-4 w-4 text-cyan-400" />
              شهادات بنكية ({bankRate}%)
            </span>
            {result.winner === 'bank' && (
              <span className="text-[10px] font-black bg-cyan-400 text-black px-2 py-0.5 rounded-full">
                الأفضل 🏦
              </span>
            )}
          </div>
          <div className="text-2xl font-black text-cyan-400 font-mono">
            {fmtM(result.bankFinalWealth)} مليون ج.م
          </div>
          <p className="text-[11px] text-zinc-400 mt-1.5 leading-relaxed">
            سيولة وعائد نقدي دوري، لكن القوة الشرائية لأصل المبلغ تتأثر بالتضخم.
          </p>
        </div>
      </div>

      <div className="rounded-xl bg-zinc-950/80 border border-zinc-800 p-3 text-xs text-zinc-300 flex items-center gap-2">
        <Trophy className="h-4 w-4 text-amber-400 shrink-0" />
        <span>
          <strong>الخلاصة الاستثمارية:</strong> بإجمالي مدفوعات {fmtM(result.totalCashPaid)} مليون ج.م على {years} سنوات، الخيار الأعلى عائداً هو: <span className="text-amber-400 font-bold">{result.winnerLabelAr}</span>
        </span>
      </div>
    </section>
  );
}
