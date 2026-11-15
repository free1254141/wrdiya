'use client';

import React, { useState, useMemo } from 'react';
import {
  X,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Calculator,
  ShieldAlert,
  Coins,
} from 'lucide-react';

interface HiddenGapDetectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendToChat: (prompt: string) => void;
}

export default function HiddenGapDetectorModal({
  isOpen,
  onClose,
  onSendToChat,
}: HiddenGapDetectorModalProps) {
  const [totalPrice, setTotalPrice] = useState<number>(6000000);
  const [downPaymentPct, setDownPaymentPct] = useState<number>(10);
  const [advertisedMonthly, setAdvertisedMonthly] = useState<number>(45000);
  const [years, setYears] = useState<number>(8);
  const [areaSqm, setAreaSqm] = useState<number>(140);

  const analysis = useMemo(() => {
    const dpAmount = Math.round(totalPrice * (downPaymentPct / 100));
    const months = Math.max(1, years * 12);
    const totalAdvertisedInstallments = advertisedMonthly * months;
    const totalCovered = dpAmount + totalAdvertisedInstallments;
    const hiddenGap = Math.max(0, totalPrice - totalCovered);
    const hiddenGapPct = totalPrice > 0 ? Math.round((hiddenGap / totalPrice) * 100) : 0;
    const trueEqualMonthly = Math.round((totalPrice - dpAmount) / months);
    const extraPerMonth = Math.max(0, trueEqualMonthly - advertisedMonthly);
    const pricePerSqm = areaSqm > 0 ? Math.round(totalPrice / areaSqm) : 0;

    return {
      dpAmount,
      totalAdvertisedInstallments,
      hiddenGap,
      hiddenGapPct,
      trueEqualMonthly,
      extraPerMonth,
      pricePerSqm,
      hasGap: hiddenGap > 50000,
    };
  }, [totalPrice, downPaymentPct, advertisedMonthly, years, areaSqm]);

  if (!isOpen) return null;

  const fmt = (n: number) => n.toLocaleString('ar-EG', { maximumFractionDigits: 0 });

  const handleAskBot = () => {
    const msg = `معايا عرض سعر من سيلز وعايز تحللهولي: السعر الإجمالي ${fmt(totalPrice)} جنيه، مساحة ${areaSqm} متر، مقدم ${downPaymentPct}%، قسط شهري معلن ${fmt(advertisedMonthly)} جنيه على ${years} سنوات. هل فيه دفعات مخفية وهل سعر المتر ده عادل في 2026؟`;
    onClose();
    onSendToChat(msg);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto"
      dir="rtl"
    >
      <div className="relative w-full max-w-xl rounded-3xl border border-zinc-800 bg-zinc-950 text-zinc-100 shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/80 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-black text-sm sm:text-base text-white">
                كاشف الأقساط المخفية وعروض السيلز 🕵️‍♂️
              </h2>
              <p className="text-[11px] text-zinc-400">
                اكتشف دفعات الاستلام والدفعات السنوية غير المعلنة في 5 ثوانٍ
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition"
            aria-label="إغلاق"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[82vh] overflow-y-auto">
          {/* Inputs Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1">
                السعر الإجمالي للوحدة (ج.م)
              </label>
              <input
                type="number"
                step={100000}
                min={500000}
                value={totalPrice}
                onChange={(e) => setTotalPrice(Math.max(0, Number(e.target.value)))}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm font-bold text-amber-400 focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1">
                المساحة بالمتر المربع (م²)
              </label>
              <input
                type="number"
                min={30}
                value={areaSqm}
                onChange={(e) => setAreaSqm(Math.max(1, Number(e.target.value)))}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm font-bold text-white focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1">
                نسبة المقدم (%)
              </label>
              <input
                type="number"
                min={0}
                max={90}
                value={downPaymentPct}
                onChange={(e) =>
                  setDownPaymentPct(Math.min(90, Math.max(0, Number(e.target.value))))
                }
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm font-bold text-white focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1">
                عدد سنوات التقسيط
              </label>
              <input
                type="number"
                min={1}
                max={15}
                value={years}
                onChange={(e) =>
                  setYears(Math.min(15, Math.max(1, Number(e.target.value))))
                }
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm font-bold text-white focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-zinc-300 mb-1">
                القسط الشهري المعلن في العرض (ج.م / شهر)
              </label>
              <input
                type="number"
                step={1000}
                min={0}
                value={advertisedMonthly}
                onChange={(e) =>
                  setAdvertisedMonthly(Math.max(0, Number(e.target.value)))
                }
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm font-bold text-emerald-400 focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Result Card */}
          <div
            className={`rounded-2xl border p-4 ${
              analysis.hasGap
                ? 'border-red-500/40 bg-red-500/10'
                : 'border-emerald-500/40 bg-emerald-500/10'
            }`}
          >
            <div className="flex items-start gap-2.5 mb-3">
              {analysis.hasGap ? (
                <AlertTriangle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
              )}
              <div>
                <h3
                  className={`font-black text-sm ${
                    analysis.hasGap ? 'text-red-300' : 'text-emerald-300'
                  }`}
                >
                  {analysis.hasGap
                    ? `⚠️ انتبه! هناك ${fmt(analysis.hiddenGap)} ج.م دفعات مخفية (${analysis.hiddenGapPct}% من السعر)`
                    : '✅ الخطة متوازنة ولا توجد فجوة دفعات مخفية كبيرة'}
                </h3>
                <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
                  {analysis.hasGap
                    ? 'السيلز يعلن قسطاً شهرياً منخفضاً، لكن المبلغ المتبقي سيتم طلبه منك كدفعة استلام أو دفعات سنوية/ربع سنوية إضافية.'
                    : 'إجمالي المقدم + الأقساط الشهرية يغطي كامل ثمن الوحدة تقريباً.'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs bg-zinc-950/75 rounded-xl p-3 border border-zinc-800/80">
              <div>
                <span className="text-zinc-400 text-[10px] block">المقدم الفعلي</span>
                <span className="font-bold text-white">{fmt(analysis.dpAmount)} ج.م</span>
              </div>
              <div>
                <span className="text-zinc-400 text-[10px] block">القسط الشهري الحقيقي المتساوي</span>
                <span className="font-black text-amber-400">
                  {fmt(analysis.trueEqualMonthly)} ج.م/شهر
                </span>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <span className="text-zinc-400 text-[10px] block">سعر المتر الفعلي</span>
                <span className="font-bold text-cyan-300 flex items-center gap-1">
                  <Coins className="h-3 w-3" />
                  {fmt(analysis.pricePerSqm)} ج.م/م²
                </span>
              </div>
            </div>
          </div>

          {/* CTA */}
          <button
            type="button"
            onClick={handleAskBot}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-black text-sm shadow-lg flex items-center justify-center gap-2 transition"
          >
            <Sparkles className="h-4 w-4" />
            <span>حلل هذا العرض مع إيوان بوت وقارنه بالسوق</span>
          </button>
        </div>
      </div>
    </div>
  );
}
