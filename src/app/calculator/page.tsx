'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  Calculator, 
  Sparkles, 
  Building2, 
  MapPin, 
  Share2, 
  Check, 
  ArrowLeft, 
  ShieldCheck, 
  Coins, 
  TrendingUp,
  MessageCircle
} from 'lucide-react';
import { getAllCompounds, CompoundSEOData } from '@/lib/compounds-data';

export default function BudgetCalculatorPage() {
  const [downPayment, setDownPayment] = useState<number>(500000);
  const [monthlyInstallment, setMonthlyInstallment] = useState<number>(25000);
  const [selectedArea, setSelectedArea] = useState<string>('all');
  const [copied, setCopied] = useState<boolean>(false);

  const allCompounds = useMemo(() => getAllCompounds(), []);

  // Quick Presets
  const downPaymentPresets = [
    { label: '250 ألف', value: 250000 },
    { label: '500 ألف', value: 500000 },
    { label: '1 مليون', value: 1000000 },
    { label: '2 مليون', value: 2000000 },
    { label: '3 مليون+', value: 3000000 },
  ];

  const monthlyPresets = [
    { label: '15 ألف', value: 15000 },
    { label: '25 ألف', value: 25000 },
    { label: '40 ألف', value: 40000 },
    { label: '60 ألف', value: 60000 },
    { label: '100 ألف+', value: 100000 },
  ];

  const areas = [
    { label: 'كل المدن', value: 'all' },
    { label: 'التجمع الخامس والقاهرة الجديدة', value: 'التجمع' },
    { label: 'الشيخ زايد و6 أكتوبر', value: 'زايد' },
    { label: 'العاصمة الإدارية', value: 'العاصمة' },
    { label: 'الساحل الشمالي ورأس الحكمة', value: 'الساحل' },
    { label: 'العين السخنة', value: 'السخنة' },
    { label: 'المستقبل سيتي والشروق', value: 'المستقبل' },
  ];

  // Estimated purchasing power on a standard 7-year installment
  const totalBuyingPower = useMemo(() => {
    return downPayment + (monthlyInstallment * 12 * 7);
  }, [downPayment, monthlyInstallment]);

  // Filter and match compounds based on user budget
  const matchedCompounds = useMemo(() => {
    return allCompounds.filter((c) => {
      // Area filter
      if (selectedArea !== 'all') {
        const matchesArea = c.location.includes(selectedArea) || c.name.includes(selectedArea);
        if (!matchesArea) return false;
      }

      // Down payment check: compound min required DP should be reasonably close to user DP
      const minRequiredDp = c.min_price * (c.min_down_payment_pct / 100);
      const dpMatch = downPayment >= minRequiredDp * 0.85; // 15% margin

      // Monthly check: user monthly should afford compound's lowest monthly
      const monthlyMatch = monthlyInstallment >= c.min_monthly_installment * 0.85;

      // Or total price within total buying power
      const priceMatch = c.min_price <= totalBuyingPower * 1.15;

      return (dpMatch && monthlyMatch) || (dpMatch && priceMatch) || (priceMatch && monthlyMatch);
    }).slice(0, 8);
  }, [allCompounds, downPayment, monthlyInstallment, selectedArea, totalBuyingPower]);

  const fmt = (n: number) =>
    n.toLocaleString('ar-EG', { maximumFractionDigits: 0 });

  const fmtM = (n: number) =>
    (n / 1_000_000).toLocaleString('ar-EG', { maximumFractionDigits: 2 });

  const shareText = `معايا مقدم ${fmt(downPayment)} ج.م وقسط شهري ${fmt(monthlyInstallment)} ج.م، وحسبت الكمبوندات المناسبة ليا في مصر عبر حاسبة إيوان بوت وطلعلي ${matchedCompounds.length} كمبوند معتمد! جرب بنفسك: https://ewanbot.com/calculator`;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'معاك مقدم كام؟ اعرف الكمبوندات المناسبة لميزانيتك فوراً',
          text: shareText,
          url: 'https://ewanbot.com/calculator',
        });
        return;
      } catch (err) {
        // Fallback to clipboard
      }
    }
    await navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const areaLabel = areas.find(a => a.value === selectedArea)?.label || 'مصر';
  const chatPrompt = encodeURIComponent(`معايا مقدم ${fmt(downPayment)} جنيه، وقسط شهري في حدود ${fmt(monthlyInstallment)} جنيه، وعايز أفضل الخيارات والشقق المتاحة المناسبة ليا في ${areaLabel}`);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-amber-500 selection:text-black">
      {/* Background Glow */}
      <div className="fixed inset-0 pointer-events-none opacity-20 bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:24px_24px]" />

      {/* Header */}
      <header className="relative z-10 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md sticky top-0 px-4 py-3.5">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              🏠
            </div>
            <div>
              <span className="font-black text-base text-white">إيوان بوت <span className="text-amber-400">Ewanbot</span></span>
              <span className="block text-[10px] text-zinc-400">حاسبة الميزانية الذكية</span>
            </div>
          </Link>

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-black shadow-md transition"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>الشات العقاري</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-4xl mx-auto px-4 py-8">
        {/* Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold mb-3">
            <Calculator className="h-4 w-4" />
            <span>أداة مجانية 100% • بدون تسجيل رقم تليفون</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-white leading-tight mb-3">
            معاك مقدم كام؟ <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 bg-clip-text text-transparent">
              اعرف الكمبوندات المناسبة لميزانيتك فوراً
            </span>
          </h1>

          <p className="text-zinc-400 text-xs sm:text-sm max-w-xl mx-auto">
            أدخل قيمة المقدم المتاح معك وقسطك الشهري المستطاع، وستقوم الأداة بمطابقة أكثر من 2,800 وحدة وكمبوند معتمد في مصر لترشيح أفضل الفرص المناسبة لك بالمليم.
          </p>
        </div>

        {/* Interactive Calculator Card */}
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-5 sm:p-7 shadow-xl backdrop-blur-md mb-8">
          {/* Input 1: Down Payment */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs sm:text-sm font-bold text-zinc-200">
                1. قيمة المقدم المتاح معك حالياً (كاش):
              </label>
              <span className="text-base sm:text-xl font-black text-amber-400 font-mono">
                {fmt(downPayment)} ج.م
              </span>
            </div>

            <input
              type="range"
              min="100000"
              max="5000000"
              step="50000"
              value={downPayment}
              onChange={(e) => setDownPayment(Number(e.target.value))}
              className="w-full accent-amber-500 h-2 bg-zinc-800 rounded-lg cursor-pointer mb-3"
            />

            {/* Presets */}
            <div className="flex flex-wrap gap-1.5">
              {downPaymentPresets.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setDownPayment(p.value)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                    downPayment === p.value
                      ? 'bg-amber-500 text-black font-black'
                      : 'bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Input 2: Monthly Installment */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs sm:text-sm font-bold text-zinc-200">
                2. القسط الشهري الذي تستطيع تحمله:
              </label>
              <span className="text-base sm:text-xl font-black text-emerald-400 font-mono">
                {fmt(monthlyInstallment)} ج.م / شهر
              </span>
            </div>

            <input
              type="range"
              min="10000"
              max="150000"
              step="5000"
              value={monthlyInstallment}
              onChange={(e) => setMonthlyInstallment(Number(e.target.value))}
              className="w-full accent-emerald-500 h-2 bg-zinc-800 rounded-lg cursor-pointer mb-3"
            />

            {/* Presets */}
            <div className="flex flex-wrap gap-1.5">
              {monthlyPresets.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setMonthlyInstallment(p.value)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                    monthlyInstallment === p.value
                      ? 'bg-emerald-500 text-black font-black'
                      : 'bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Input 3: Preferred Area */}
          <div className="mb-6">
            <label className="text-xs sm:text-sm font-bold text-zinc-200 block mb-2">
              3. المنطقة أو المدينة المفضلة:
            </label>
            <div className="flex flex-wrap gap-1.5">
              {areas.map((a) => (
                <button
                  key={a.value}
                  type="button"
                  onClick={() => setSelectedArea(a.value)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    selectedArea === a.value
                      ? 'bg-amber-500 text-black shadow-md'
                      : 'bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700'
                  }`}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>

          {/* Purchasing Power Summary */}
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-right">
            <div>
              <span className="text-xs text-amber-300 font-semibold block">
                🎯 إجمالي قوتك الشرائية التقديرية بالتقسيط (على 7 سنوات):
              </span>
              <span className="text-xl sm:text-2xl font-black text-white font-mono">
                {fmtM(totalBuyingPower)} مليون جنيه مصري
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleShare}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold transition border border-zinc-700"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Share2 className="h-3.5 w-3.5 text-amber-400" />}
                <span>{copied ? 'تم نسخ الرابط!' : 'شارك نتيجتك'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Results Section */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Building2 className="h-4 w-4 text-amber-400" />
              <span>الكمبوندات والفرص المطابقة لميزانيتك ({matchedCompounds.length})</span>
            </h2>
            <span className="text-xs text-zinc-400">تحديث فوري</span>
          </div>

          {matchedCompounds.length === 0 ? (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8 text-center text-zinc-400">
              <p className="mb-3">لم يتم العثور على كمبوندات مطابقة تماماً لهذه الأرقام في المنطقة المحددة.</p>
              <button
                type="button"
                onClick={() => setSelectedArea('all')}
                className="px-4 py-1.5 rounded-xl bg-amber-500 text-black text-xs font-black"
              >
                عرض كل المدن في مصر
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {matchedCompounds.map((c) => (
                <div
                  key={c.slug}
                  className="rounded-2xl border border-zinc-800 bg-zinc-900/70 hover:border-amber-500/50 p-4 transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <h3 className="font-bold text-sm text-white">{c.name}</h3>
                        <div className="flex items-center gap-1 text-xs text-zinc-400 mt-0.5">
                          <MapPin className="h-3 w-3 text-amber-400" />
                          <span>{c.location}</span>
                        </div>
                      </div>
                      <span className="rounded-md bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-400 border border-amber-500/20">
                        مقدم {c.min_down_payment_pct}%
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs bg-zinc-950/60 rounded-xl p-2.5 my-3 border border-zinc-800/80">
                      <div>
                        <span className="text-zinc-500 text-[10px] block">السعر الإجمالي يبدأ من</span>
                        <span className="font-black text-amber-400">{fmtM(c.min_price)} مليون</span>
                      </div>
                      <div>
                        <span className="text-zinc-500 text-[10px] block">القسط يبدأ من</span>
                        <span className="font-bold text-emerald-400">{fmt(c.min_monthly_installment)} ج.م/شهر</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-zinc-800/80">
                    <Link
                      href={`/compounds/${encodeURIComponent(c.slug)}`}
                      className="flex-1 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold text-center transition"
                    >
                      جدول الأقساط الكامل
                    </Link>
                    <Link
                      href={`/?chat=${encodeURIComponent(`عايز أعرف شقة في كمبوند ${c.name} تناسب مقدم ${fmt(downPayment)} وقسط شهري ${fmt(monthlyInstallment)}`)}`}
                      className="flex-1 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-black text-center transition"
                    >
                      استشر Ewanbot
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Deep Chat CTA */}
          <div className="mt-8 rounded-2xl border-2 border-amber-500/40 bg-gradient-to-r from-amber-500/15 via-zinc-900 to-amber-500/15 p-6 text-center">
            <h3 className="text-base sm:text-xl font-black text-white mb-2">
              عايز تفاصيل الوحدات المتاحة وحاسبة الأقساط بالمليم بدون سيلز؟
            </h3>
            <p className="text-xs sm:text-sm text-zinc-300 max-w-lg mx-auto mb-4">
              ادخل شات إيوان بوت واطلب مقارنة تفصيلية بين أي كمبوندين أو ابحث عن شقق استلام فوري أو تحت الإنشاء فوراً.
            </p>
            <Link
              href={`/?chat=${chatPrompt}`}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-sm shadow-md transition"
            >
              <Sparkles className="h-4 w-4" />
              <span>افتح الشات بالذكاء الاصطناعي مع ميزانيتك الآن</span>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 bg-black/60 py-6 px-4 text-center text-xs text-zinc-500">
        <p>© 2026 إيوان بوت (Ewanbot) — المنصة الذكية المعتمدة لعقارات مصر.</p>
      </footer>
    </div>
  );
}
