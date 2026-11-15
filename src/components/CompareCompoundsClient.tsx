'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Scale,
  Search,
  MapPin,
  Sparkles,
  Printer,
  Share2,
  Check,
  Trophy,
  Building2,
  ArrowLeft,
  ShieldCheck,
  Coins,
  Clock,
  Ruler,
  ArrowLeftRight,
} from 'lucide-react';
import {
  getAllCompounds,
  getCompoundBySlug,
  getCompoundMetrics,
  CompoundSEOData,
} from '@/lib/compounds-data';

export default function CompareCompoundsClient() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const allCompounds = useMemo(() => getAllCompounds(), []);

  // Resolve initial slugs from URL or pick top 2 distinct compounds
  const initialC1 = useMemo(() => {
    const q1 = searchParams.get('c1');
    return (q1 && getCompoundBySlug(q1)) || allCompounds[0];
  }, [searchParams, allCompounds]);

  const initialC2 = useMemo(() => {
    const q2 = searchParams.get('c2');
    const found = q2 && getCompoundBySlug(q2);
    if (found && found.slug !== initialC1?.slug) return found;
    return allCompounds.find((c) => c.slug !== initialC1?.slug) || allCompounds[1];
  }, [searchParams, allCompounds, initialC1]);

  const [c1, setC1] = useState<CompoundSEOData>(initialC1);
  const [c2, setC2] = useState<CompoundSEOData>(initialC2);
  const [query1, setQuery1] = useState('');
  const [query2, setQuery2] = useState('');
  const [openDropdown, setOpenDropdown] = useState<1 | 2 | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (initialC1) setC1(initialC1);
    if (initialC2) setC2(initialC2);
  }, [initialC1, initialC2]);

  const updateSelection = (slot: 1 | 2, compound: CompoundSEOData) => {
    const next1 = slot === 1 ? compound : c1;
    const next2 = slot === 2 ? compound : c2;
    if (slot === 1) setC1(compound);
    else setC2(compound);
    setOpenDropdown(null);
    setQuery1('');
    setQuery2('');
    router.replace(
      `/compare?c1=${encodeURIComponent(next1.slug)}&c2=${encodeURIComponent(next2.slug)}`,
      { scroll: false }
    );
  };

  const swapCompounds = () => {
    const prev1 = c1;
    const prev2 = c2;
    setC1(prev2);
    setC2(prev1);
    router.replace(
      `/compare?c1=${encodeURIComponent(prev2.slug)}&c2=${encodeURIComponent(prev1.slug)}`,
      { scroll: false }
    );
  };

  const filteredList1 = useMemo(() => {
    const q = query1.trim().toLowerCase();
    const list = q
      ? allCompounds.filter(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            c.location.toLowerCase().includes(q)
        )
      : allCompounds;
    return list.slice(0, 25);
  }, [allCompounds, query1]);

  const filteredList2 = useMemo(() => {
    const q = query2.trim().toLowerCase();
    const list = q
      ? allCompounds.filter(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            c.location.toLowerCase().includes(q)
        )
      : allCompounds;
    return list.slice(0, 25);
  }, [allCompounds, query2]);

  // Build dynamic popular matchups from real dataset
  const popularMatchups = useMemo(() => {
    const pairs: Array<{ label: string; a: CompoundSEOData; b: CompoundSEOData }> = [];
    const findByKw = (kw: string) =>
      allCompounds.find((c) => c.name.includes(kw));

    const candidates: Array<[string, string, string]> = [
      ['ماونتن فيو', 'بالم هيلز', 'ماونتن فيو vs بالم هيلز'],
      ['بادية', 'أو ويست', 'بادية vs أو ويست'],
      ['تاج سيتي', 'سراي', 'تاج سيتي vs سراي'],
      ['زيد', 'هايد بارك', 'زيد vs هايد بارك'],
    ];

    for (const [k1, k2, label] of candidates) {
      const a = findByKw(k1);
      const b = findByKw(k2);
      if (a && b && a.slug !== b.slug) {
        pairs.push({ label, a, b });
      }
    }

    if (pairs.length < 2 && allCompounds.length >= 4) {
      pairs.push({
        label: `${allCompounds[0].name} vs ${allCompounds[1].name}`,
        a: allCompounds[0],
        b: allCompounds[1],
      });
      pairs.push({
        label: `${allCompounds[2].name} vs ${allCompounds[3].name}`,
        a: allCompounds[2],
        b: allCompounds[3],
      });
    }
    return pairs.slice(0, 4);
  }, [allCompounds]);

  const m1 = useMemo(() => getCompoundMetrics(c1), [c1]);
  const m2 = useMemo(() => getCompoundMetrics(c2), [c2]);

  const fmt = (n?: number) =>
    typeof n === 'number' && Number.isFinite(n) && n > 0
      ? n.toLocaleString('ar-EG', { maximumFractionDigits: 0 })
      : '—';

  const fmtM = (n: number) =>
    (n / 1_000_000).toLocaleString('ar-EG', { maximumFractionDigits: 2 });

  // Determine objective winners per metric
  const cheaperPerSqm =
    m1.avgPricePerSqm > 0 && m2.avgPricePerSqm > 0
      ? m1.avgPricePerSqm <= m2.avgPricePerSqm
        ? 1
        : 2
      : 0;
  const lowerMinPrice = c1.min_price <= c2.min_price ? 1 : 2;
  const lowerDownPayment = m1.minDownPaymentEgp <= m2.minDownPaymentEgp ? 1 : 2;
  const longerInstallment =
    c1.max_installment_years >= c2.max_installment_years ? 1 : 2;
  const lowerMonthly =
    c1.min_monthly_installment <= c2.min_monthly_installment ? 1 : 2;

  const score1 =
    (cheaperPerSqm === 1 ? 1 : 0) +
    (lowerMinPrice === 1 ? 1 : 0) +
    (lowerDownPayment === 1 ? 1 : 0) +
    (longerInstallment === 1 ? 1 : 0) +
    (lowerMonthly === 1 ? 1 : 0);
  const score2 =
    (cheaperPerSqm === 2 ? 1 : 0) +
    (lowerMinPrice === 2 ? 1 : 0) +
    (lowerDownPayment === 2 ? 1 : 0) +
    (longerInstallment === 2 ? 1 : 0) +
    (lowerMonthly === 2 ? 1 : 0);

  const shareUrl = `https://ewanbot.com/compare?c1=${encodeURIComponent(c1.slug)}&c2=${encodeURIComponent(c2.slug)}`;

  const handleShare = async () => {
    const text = `⚔️ مقارنة عقارية من إيوان بوت (Ewanbot):\n\n1️⃣ ${c1.name} (${c1.location})\n- يبدأ من: ${fmtM(c1.min_price)} مليون | قسط شهري: ${fmt(c1.min_monthly_installment)} ج.م\n- سعر المتر: ~${fmt(m1.avgPricePerSqm)} ج.م\n\n2️⃣ ${c2.name} (${c2.location})\n- يبدأ من: ${fmtM(c2.min_price)} مليون | قسط شهري: ${fmt(c2.min_monthly_installment)} ج.م\n- سعر المتر: ~${fmt(m2.avgPricePerSqm)} ج.م\n\n📊 التقرير الكامل هنا:\n${shareUrl}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `مقارنة: ${c1.name} ضد ${c2.name} | إيوان بوت`,
          text,
          url: shareUrl,
        });
        return;
      } catch {
        // Fallback to clipboard
      }
    }
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  const chatPrompt = encodeURIComponent(
    `قارن لي بصراحة بين كمبوند "${c1.name}" (${c1.location}) وكمبوند "${c2.name}" (${c2.location}) من حيث المميزات والعيوب، القيمة مقابل السعر، وسعر المتر المتوقع لإعادة البيع في 2026.`
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-amber-500 selection:text-black print:bg-white print:text-black">
      {/* Background Decor (hidden when printing) */}
      <div className="fixed inset-0 pointer-events-none opacity-20 bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:24px_24px] print:hidden" />

      {/* Header (hidden when printing) */}
      <header className="relative z-20 border-b border-zinc-800/80 bg-zinc-950/85 backdrop-blur-md sticky top-0 px-4 py-3.5 print:hidden">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-2">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              🏠
            </div>
            <div>
              <span className="font-black text-base text-white">
                إيوان بوت <span className="text-amber-400">Ewanbot</span>
              </span>
              <span className="block text-[10px] text-zinc-400">
                حلبة المقارنة الصريحة
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href="/compounds"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-amber-500/40 text-zinc-200 text-xs font-bold transition"
            >
              <Building2 className="h-3.5 w-3.5 text-amber-400" />
              <span>دليل الكمبوندات</span>
            </Link>
            <Link
              href="/calculator"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-amber-500/40 text-zinc-200 text-xs font-bold transition"
            >
              <span>🧮 الحاسبة</span>
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs sm:text-sm shadow-sm transition"
            >
              <span>افتح الشات</span>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Print-only Letterhead */}
      <div className="hidden print:block border-b-2 border-amber-500 pb-4 mb-6 px-6 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-black">
              تقرير المقارنة العقارية — إيوان بوت (Ewanbot)
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              مقارنة موثقة بالأسعار الفعلية وأنظمة السداد — ewanbot.com
            </p>
          </div>
          <div className="text-left text-xs text-gray-500">
            تاريخ التقرير: {new Date().toLocaleDateString('ar-EG')}
          </div>
        </div>
      </div>

      <main className="relative z-10 max-w-5xl mx-auto px-4 py-8 sm:py-10 print:py-2">
        {/* Hero Title */}
        <div className="text-center mb-7 print:hidden">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold mb-3">
            <Scale className="h-3.5 w-3.5" />
            <span>مقارنة أرقام حقيقية بدون مجاملة مطورين</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-white leading-tight mb-2">
            حلبة مقارنة الكمبوندات وجهاً لوجه ⚔️
          </h1>
          <p className="text-sm text-zinc-400 max-w-2xl mx-auto">
            اختر أي مشروعين من بين {allCompounds.length} كمبوند مصري، واعرف الأرخص في سعر المتر، والأسهل في المقدم والأقساط، وحمّل التقرير PDF لمشاركته مع عائلتك.
          </p>
        </div>

        {/* Popular Matchups */}
        {popularMatchups.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-2 mb-6 print:hidden">
            <span className="text-xs text-zinc-500 font-semibold">مقارنات سريعة:</span>
            {popularMatchups.map((m, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setC1(m.a);
                  setC2(m.b);
                  router.replace(
                    `/compare?c1=${encodeURIComponent(m.a.slug)}&c2=${encodeURIComponent(m.b.slug)}`,
                    { scroll: false }
                  );
                }}
                className="px-3 py-1.5 rounded-full border border-zinc-800 bg-zinc-900/80 hover:border-amber-500/50 text-xs font-bold text-zinc-300 hover:text-amber-400 transition"
              >
                ⚔️ {m.label}
              </button>
            ))}
          </div>
        )}

        {/* Selectors Grid */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-3 items-center mb-8 print:hidden">
          {/* Selector 1 */}
          <div className="relative">
            <label className="block text-xs font-bold text-amber-400 mb-1.5">
              المشروع الأول
            </label>
            <button
              type="button"
              onClick={() => setOpenDropdown(openDropdown === 1 ? null : 1)}
              className="w-full text-right rounded-2xl border border-zinc-700 bg-zinc-900/90 hover:border-amber-500/60 p-3.5 flex items-center justify-between transition"
            >
              <div>
                <div className="font-black text-sm text-white">{c1.name}</div>
                <div className="text-xs text-zinc-400 flex items-center gap-1 mt-0.5">
                  <MapPin className="h-3 w-3 text-amber-400" />
                  <span>{c1.location}</span>
                </div>
              </div>
              <Search className="h-4 w-4 text-zinc-400 shrink-0" />
            </button>

            {openDropdown === 1 && (
              <div className="absolute z-30 mt-2 w-full rounded-2xl border border-zinc-700 bg-zinc-900 shadow-2xl p-2.5">
                <input
                  type="text"
                  autoFocus
                  value={query1}
                  onChange={(e) => setQuery1(e.target.value)}
                  placeholder="ابحث باسم الكمبوند أو المدينة..."
                  className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 mb-2"
                />
                <div className="max-h-60 overflow-y-auto space-y-1">
                  {filteredList1.map((item) => (
                    <button
                      key={item.slug}
                      type="button"
                      onClick={() => updateSelection(1, item)}
                      className={`w-full text-right px-3 py-2 rounded-xl text-xs transition flex items-center justify-between ${
                        item.slug === c1.slug
                          ? 'bg-amber-500/20 text-amber-300 font-bold'
                          : 'hover:bg-zinc-800 text-zinc-200'
                      }`}
                    >
                      <span className="truncate">{item.name}</span>
                      <span className="text-[10px] text-zinc-400 shrink-0 ms-2">
                        {item.location}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Swap Button */}
          <div className="flex justify-center pt-5">
            <button
              type="button"
              onClick={swapCompounds}
              title="تبديل المشروعين"
              className="h-10 w-10 rounded-full border border-zinc-700 bg-zinc-900 hover:border-amber-500 hover:text-amber-400 flex items-center justify-center text-zinc-400 transition"
            >
              <ArrowLeftRight className="h-4 w-4" />
            </button>
          </div>

          {/* Selector 2 */}
          <div className="relative">
            <label className="block text-xs font-bold text-emerald-400 mb-1.5">
              المشروع الثاني
            </label>
            <button
              type="button"
              onClick={() => setOpenDropdown(openDropdown === 2 ? null : 2)}
              className="w-full text-right rounded-2xl border border-zinc-700 bg-zinc-900/90 hover:border-emerald-500/60 p-3.5 flex items-center justify-between transition"
            >
              <div>
                <div className="font-black text-sm text-white">{c2.name}</div>
                <div className="text-xs text-zinc-400 flex items-center gap-1 mt-0.5">
                  <MapPin className="h-3 w-3 text-emerald-400" />
                  <span>{c2.location}</span>
                </div>
              </div>
              <Search className="h-4 w-4 text-zinc-400 shrink-0" />
            </button>

            {openDropdown === 2 && (
              <div className="absolute z-30 mt-2 w-full rounded-2xl border border-zinc-700 bg-zinc-900 shadow-2xl p-2.5">
                <input
                  type="text"
                  autoFocus
                  value={query2}
                  onChange={(e) => setQuery2(e.target.value)}
                  placeholder="ابحث باسم الكمبوند أو المدينة..."
                  className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 mb-2"
                />
                <div className="max-h-60 overflow-y-auto space-y-1">
                  {filteredList2.map((item) => (
                    <button
                      key={item.slug}
                      type="button"
                      onClick={() => updateSelection(2, item)}
                      className={`w-full text-right px-3 py-2 rounded-xl text-xs transition flex items-center justify-between ${
                        item.slug === c2.slug
                          ? 'bg-emerald-500/20 text-emerald-300 font-bold'
                          : 'hover:bg-zinc-800 text-zinc-200'
                      }`}
                    >
                      <span className="truncate">{item.name}</span>
                      <span className="text-[10px] text-zinc-400 shrink-0 ms-2">
                        {item.location}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Toolbar: Print PDF & Share WhatsApp */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6 print:hidden">
          <div className="text-xs text-zinc-400 flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>البيانات محدثة من قاعدة بيانات إيوان بوت الرسمية 2026</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 text-xs font-bold transition"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-emerald-400" />
              ) : (
                <Share2 className="h-3.5 w-3.5" />
              )}
              <span>{copied ? 'تم نسخ ملخص الواتساب!' : 'مشاركة ملخص واتساب'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white text-xs font-bold transition"
            >
              <Printer className="h-3.5 w-3.5 text-amber-400" />
              <span>تحميل / طباعة PDF</span>
            </button>
          </div>
        </div>

        {/* Comparison Table */}
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/75 overflow-hidden shadow-xl mb-8 print:border-gray-300 print:bg-white print:shadow-none">
          <div className="grid grid-cols-3 border-b border-zinc-800 bg-zinc-950/90 p-4 text-xs sm:text-sm font-black print:bg-gray-100 print:border-gray-300">
            <div className="text-zinc-400 print:text-gray-700">معيار المقارنة</div>
            <div className="text-amber-400 text-center print:text-amber-700">
              {c1.name}
            </div>
            <div className="text-emerald-400 text-center print:text-emerald-700">
              {c2.name}
            </div>
          </div>

          {/* Row: Location */}
          <div className="grid grid-cols-3 border-b border-zinc-800/70 p-4 items-center text-xs sm:text-sm print:border-gray-200">
            <div className="text-zinc-400 font-semibold flex items-center gap-1.5 print:text-gray-700">
              <MapPin className="h-3.5 w-3.5 text-zinc-500" />
              <span>المنطقة</span>
            </div>
            <div className="text-center font-bold text-white print:text-black">
              {c1.location}
            </div>
            <div className="text-center font-bold text-white print:text-black">
              {c2.location}
            </div>
          </div>

          {/* Row: Avg Price / sqm */}
          <div className="grid grid-cols-3 border-b border-zinc-800/70 p-4 items-center text-xs sm:text-sm print:border-gray-200">
            <div className="text-zinc-400 font-semibold flex items-center gap-1.5 print:text-gray-700">
              <Coins className="h-3.5 w-3.5 text-amber-400" />
              <span>متوسط سعر المتر</span>
            </div>
            <div className="text-center">
              <span className="font-black text-white print:text-black">
                {m1.avgPricePerSqm > 0 ? `${fmt(m1.avgPricePerSqm)} ج.م` : '—'}
              </span>
              {cheaperPerSqm === 1 && (
                <span className="block text-[10px] text-emerald-400 font-bold mt-0.5 print:text-emerald-700">
                  ✓ أوفر سعراً للمتر
                </span>
              )}
            </div>
            <div className="text-center">
              <span className="font-black text-white print:text-black">
                {m2.avgPricePerSqm > 0 ? `${fmt(m2.avgPricePerSqm)} ج.م` : '—'}
              </span>
              {cheaperPerSqm === 2 && (
                <span className="block text-[10px] text-emerald-400 font-bold mt-0.5 print:text-emerald-700">
                  ✓ أوفر سعراً للمتر
                </span>
              )}
            </div>
          </div>

          {/* Row: Min Price */}
          <div className="grid grid-cols-3 border-b border-zinc-800/70 p-4 items-center text-xs sm:text-sm print:border-gray-200">
            <div className="text-zinc-400 font-semibold print:text-gray-700">
              الأسعار تبدأ من
            </div>
            <div className="text-center">
              <span className="font-black text-amber-400 print:text-amber-700">
                {fmtM(c1.min_price)} مليون ج.م
              </span>
              {lowerMinPrice === 1 && (
                <span className="block text-[10px] text-emerald-400 font-bold mt-0.5 print:text-emerald-700">
                  ✓ أقل نقطة دخول
                </span>
              )}
            </div>
            <div className="text-center">
              <span className="font-black text-emerald-400 print:text-emerald-700">
                {fmtM(c2.min_price)} مليون ج.م
              </span>
              {lowerMinPrice === 2 && (
                <span className="block text-[10px] text-emerald-400 font-bold mt-0.5 print:text-emerald-700">
                  ✓ أقل نقطة دخول
                </span>
              )}
            </div>
          </div>

          {/* Row: Min Down Payment */}
          <div className="grid grid-cols-3 border-b border-zinc-800/70 p-4 items-center text-xs sm:text-sm print:border-gray-200">
            <div className="text-zinc-400 font-semibold print:text-gray-700">
              أقل مقدم مطلوب
            </div>
            <div className="text-center">
              <span className="font-bold text-white print:text-black">
                {c1.min_down_payment_pct}% ({fmt(m1.minDownPaymentEgp)} ج.م)
              </span>
              {lowerDownPayment === 1 && (
                <span className="block text-[10px] text-emerald-400 font-bold mt-0.5 print:text-emerald-700">
                  ✓ أقل كاش مطلوب
                </span>
              )}
            </div>
            <div className="text-center">
              <span className="font-bold text-white print:text-black">
                {c2.min_down_payment_pct}% ({fmt(m2.minDownPaymentEgp)} ج.م)
              </span>
              {lowerDownPayment === 2 && (
                <span className="block text-[10px] text-emerald-400 font-bold mt-0.5 print:text-emerald-700">
                  ✓ أقل كاش مطلوب
                </span>
              )}
            </div>
          </div>

          {/* Row: Max Installments */}
          <div className="grid grid-cols-3 border-b border-zinc-800/70 p-4 items-center text-xs sm:text-sm print:border-gray-200">
            <div className="text-zinc-400 font-semibold flex items-center gap-1.5 print:text-gray-700">
              <Clock className="h-3.5 w-3.5 text-zinc-500" />
              <span>أطول فترة سداد</span>
            </div>
            <div className="text-center">
              <span className="font-bold text-white print:text-black">
                {c1.max_installment_years} سنوات
              </span>
              {longerInstallment === 1 && c1.max_installment_years !== c2.max_installment_years && (
                <span className="block text-[10px] text-emerald-400 font-bold mt-0.5 print:text-emerald-700">
                  ✓ فترة تقسيط أطول
                </span>
              )}
            </div>
            <div className="text-center">
              <span className="font-bold text-white print:text-black">
                {c2.max_installment_years} سنوات
              </span>
              {longerInstallment === 2 && c1.max_installment_years !== c2.max_installment_years && (
                <span className="block text-[10px] text-emerald-400 font-bold mt-0.5 print:text-emerald-700">
                  ✓ فترة تقسيط أطول
                </span>
              )}
            </div>
          </div>

          {/* Row: Min Monthly Installment */}
          <div className="grid grid-cols-3 border-b border-zinc-800/70 p-4 items-center text-xs sm:text-sm print:border-gray-200">
            <div className="text-zinc-400 font-semibold print:text-gray-700">
              أقل قسط شهري
            </div>
            <div className="text-center">
              <span className="font-bold text-white print:text-black">
                {fmt(c1.min_monthly_installment)} ج.م
              </span>
              {lowerMonthly === 1 && (
                <span className="block text-[10px] text-emerald-400 font-bold mt-0.5 print:text-emerald-700">
                  ✓ أريح قسط شهري
                </span>
              )}
            </div>
            <div className="text-center">
              <span className="font-bold text-white print:text-black">
                {fmt(c2.min_monthly_installment)} ج.م
              </span>
              {lowerMonthly === 2 && (
                <span className="block text-[10px] text-emerald-400 font-bold mt-0.5 print:text-emerald-700">
                  ✓ أريح قسط شهري
                </span>
              )}
            </div>
          </div>

          {/* Row: Areas & Units */}
          <div className="grid grid-cols-3 p-4 items-center text-xs sm:text-sm">
            <div className="text-zinc-400 font-semibold flex items-center gap-1.5 print:text-gray-700">
              <Ruler className="h-3.5 w-3.5 text-zinc-500" />
              <span>المساحات والوحدات</span>
            </div>
            <div className="text-center text-zinc-200 print:text-black">
              {c1.min_area_sqm} - {c1.max_area_sqm} م² ({c1.units_count} وحدة)
            </div>
            <div className="text-center text-zinc-200 print:text-black">
              {c2.min_area_sqm} - {c2.max_area_sqm} م² ({c2.units_count} وحدة)
            </div>
          </div>
        </div>

        {/* Smart AI Verdict Box */}
        <div className="rounded-3xl border border-amber-500/35 bg-gradient-to-br from-amber-500/10 via-zinc-900/90 to-emerald-500/10 p-6 mb-8 print:border-gray-300 print:bg-gray-50">
          <div className="flex items-center gap-2 text-amber-400 font-black text-base mb-3 print:text-black">
            <Trophy className="h-5 w-5" />
            <span>الخلاصة الرقمية السريعة من إيوان بوت:</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm text-zinc-300 print:text-gray-800">
            <div className="rounded-2xl bg-zinc-950/60 border border-zinc-800 p-4 print:bg-white print:border-gray-200">
              <div className="font-black text-amber-400 mb-1 print:text-amber-700">
                اختر {c1.name} إذا كنت تبحث عن:
              </div>
              <ul className="space-y-1 text-xs leading-relaxed">
                <li>• {cheaperPerSqm === 1 ? 'سعر متر أوفر وأعلى قيمة مقابل السعر.' : `السكن والاستثمار في ${c1.location}.`}</li>
                <li>• {lowerDownPayment === 1 ? `أقل كاش مقدم (${fmt(m1.minDownPaymentEgp)} ج.م).` : `تشكيلة مساحات من ${c1.min_area_sqm} إلى ${c1.max_area_sqm} م².`}</li>
                <li>• نقاط تفوق رقمية: {score1} من 5 معايير مالية.</li>
              </ul>
            </div>

            <div className="rounded-2xl bg-zinc-950/60 border border-zinc-800 p-4 print:bg-white print:border-gray-200">
              <div className="font-black text-emerald-400 mb-1 print:text-emerald-700">
                اختر {c2.name} إذا كنت تبحث عن:
              </div>
              <ul className="space-y-1 text-xs leading-relaxed">
                <li>• {cheaperPerSqm === 2 ? 'سعر متر أوفر وأعلى قيمة مقابل السعر.' : `السكن والاستثمار في ${c2.location}.`}</li>
                <li>• {lowerDownPayment === 2 ? `أقل كاش مقدم (${fmt(m2.minDownPaymentEgp)} ج.م).` : `تشكيلة مساحات من ${c2.min_area_sqm} إلى ${c2.max_area_sqm} م².`}</li>
                <li>• نقاط تفوق رقمية: {score2} من 5 معايير مالية.</li>
              </ul>
            </div>
          </div>

          {/* Deep AI Chat CTA */}
          <div className="mt-5 text-center print:hidden">
            <Link
              href={`/?chat=${chatPrompt}`}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-sm shadow-lg transition"
            >
              <Sparkles className="h-4 w-4" />
              <span>اسأل إيوان بوت عن عيوب ومميزات هذه المقارنة بصراحة الآن</span>
            </Link>
          </div>
        </div>

        {/* Links to individual compound pages */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 print:hidden">
          <Link
            href={`/compounds/${encodeURIComponent(c1.slug)}`}
            className="rounded-2xl border border-zinc-800 bg-zinc-900/60 hover:border-amber-500/50 p-4 flex items-center justify-between transition"
          >
            <div>
              <span className="text-[11px] text-zinc-400 block">صفحة الكمبوند الأول</span>
              <span className="font-bold text-sm text-white">أسعار وأقساط {c1.name}</span>
            </div>
            <ArrowLeft className="h-4 w-4 text-amber-400" />
          </Link>
          <Link
            href={`/compounds/${encodeURIComponent(c2.slug)}`}
            className="rounded-2xl border border-zinc-800 bg-zinc-900/60 hover:border-emerald-500/50 p-4 flex items-center justify-between transition"
          >
            <div>
              <span className="text-[11px] text-zinc-400 block">صفحة الكمبوند الثاني</span>
              <span className="font-bold text-sm text-white">أسعار وأقساط {c2.name}</span>
            </div>
            <ArrowLeft className="h-4 w-4 text-emerald-400" />
          </Link>
        </div>
      </main>
    </div>
  );
}
