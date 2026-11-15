'use client';

import React, { useState } from 'react';
import { Sparkles, CheckCircle2, Loader2, TrendingUp } from 'lucide-react';

export default function MyPropertyValueCheck() {
  const [location, setLocation] = useState('التجمع الخامس');
  const [compoundName, setCompoundName] = useState('');
  const [areaSqm, setAreaSqm] = useState<number>(140);
  const [purchaseYear, setPurchaseYear] = useState<number>(2023);
  const [purchasePrice, setPurchasePrice] = useState<number>(3500000);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location,
          compoundName,
          areaSqm,
          purchaseYear,
          purchasePrice,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error || 'تعذر حساب التقييم');
      } else {
        setResult(data);
      }
    } catch {
      setError('حدث خطأ في الاتصال');
    } finally {
      setLoading(false);
    }
  };

  const fmt = (n: number) => n.toLocaleString('ar-EG', { maximumFractionDigits: 0 });

  return (
    <section className="my-10 rounded-3xl border border-emerald-500/35 bg-gradient-to-br from-emerald-500/10 via-zinc-900/90 to-zinc-950 p-6 shadow-xl">
      <div className="mb-5">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 text-[11px] font-bold text-emerald-300 mb-2">
          <TrendingUp className="h-3.5 w-3.5" />
          <span>مجهول الهوية تماماً (بدون اسم أو رقم هاتف)</span>
        </div>
        <h2 className="text-lg sm:text-xl font-black text-white">
          💎 كم تساوي شقتك اليوم؟ (أدخل سعر شرائك الحقيقي واحصل على تقييمها الفوري مجاناً)
        </h2>
        <p className="text-xs text-zinc-400 mt-1">
          مشاركتك بسعر الصفقة الفعلي يساعد في بناء أدق مؤشر أسعار حقيقي في مصر، وتحصل فوراً على تقدير القيمة السوقية اليوم.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
        <div>
          <label className="block text-[11px] font-bold text-zinc-300 mb-1">المدينة / المنطقة</label>
          <input
            type="text"
            required
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-[11px] font-bold text-zinc-300 mb-1">اسم الكمبوند (اختياري)</label>
          <input
            type="text"
            value={compoundName}
            onChange={(e) => setCompoundName(e.target.value)}
            placeholder="مثال: ماونتن فيو"
            className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-[11px] font-bold text-zinc-300 mb-1">المساحة (م²)</label>
          <input
            type="number"
            min={25}
            required
            value={areaSqm}
            onChange={(e) => setAreaSqm(Number(e.target.value))}
            className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs font-bold text-white focus:border-emerald-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-[11px] font-bold text-zinc-300 mb-1">سنة الشراء</label>
          <input
            type="number"
            min={2010}
            max={2026}
            value={purchaseYear}
            onChange={(e) => setPurchaseYear(Number(e.target.value))}
            className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs font-bold text-white focus:border-emerald-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-[11px] font-bold text-zinc-300 mb-1">السعر الفعلي وقت الشراء (ج.م)</label>
          <input
            type="number"
            min={200000}
            step={50000}
            required
            value={purchasePrice}
            onChange={(e) => setPurchasePrice(Number(e.target.value))}
            className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs font-bold text-amber-400 focus:border-emerald-500 focus:outline-none"
          />
        </div>

        <div className="sm:col-span-2 lg:col-span-5">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs sm:text-sm transition disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            <span>احسب قيمة شقتي اليوم مجاناً</span>
          </button>
        </div>
      </form>

      {error && (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-300">
          {error}
        </div>
      )}

      {result && (
        <div className="rounded-2xl border border-emerald-500/40 bg-zinc-950/90 p-4 mt-3">
          <div className="flex items-center gap-2 text-emerald-400 font-black text-sm mb-3">
            <CheckCircle2 className="h-4 w-4" />
            <span>نتيجة التقييم الفوري لوحدتك في 2026:</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800">
              <span className="text-zinc-400 block">القيمة السوقية العادلة اليوم</span>
              <span className="text-lg font-black text-amber-400 font-mono">
                {fmt(result.currentFairValue)} ج.م
              </span>
            </div>
            <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800">
              <span className="text-zinc-400 block">متوسط سعر المتر حالياً</span>
              <span className="text-lg font-black text-white font-mono">
                {fmt(result.pricePerSqmNow)} ج.م/م²
              </span>
            </div>
            <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800">
              <span className="text-zinc-400 block">الزيادة عن سعر شرائك</span>
              <span className={`text-lg font-black font-mono ${result.gainEgp >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {result.gainEgp >= 0 ? '+' : ''}{fmt(result.gainEgp)} ج.م ({result.gainPct}%)
              </span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
