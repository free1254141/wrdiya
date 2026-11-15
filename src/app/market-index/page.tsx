import React, { Suspense } from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import {
  TrendingUp,
  Building2,
  MapPin,
  ArrowLeft,
  ShieldCheck,
  Sparkles,
  Scale,
} from 'lucide-react';
import { getMonthlyMarketIndex } from '@/lib/demand-analytics';
import { DEVELOPER_RELIABILITY_INDEX } from '@/lib/developer-reliability';
import { queryNewsDisclosures } from '@/lib/news-disclosures';
import NewsDisclosuresFeed from '@/components/NewsDisclosuresFeed';

export const metadata: Metadata = {
  title: 'مؤشر إيوان لأسعار العقارات في مصر 2026 | متوسط سعر المتر والأقساط',
  description:
    'التقرير الشهري لأسعار العقارات في مصر 2026: متوسط سعر المتر الفعلي، أقل مقدم، وأطول فترة سداد في التجمع الخامس، الشيخ زايد، 6 أكتوبر، العاصمة الإدارية والساحل الشمالي.',
  alternates: {
    canonical: 'https://ewanbot.com/market-index',
  },
  openGraph: {
    title: 'مؤشر إيوان لأسعار العقارات في مصر 2026 | Ewanbot Market Index',
    description:
      'بيانات حية من أكثر من 660 كمبوند رسمي في مصر — متوسط أسعار المتر وأنظمة السداد لكل مدينة.',
    url: 'https://ewanbot.com/market-index',
    siteName: 'إيوان بوت | Ewanbot',
    images: [
      {
        url: 'https://ewanbot.com/og-image.png',
        width: 1200,
        height: 630,
        alt: 'مؤشر إيوان لأسعار العقارات في مصر',
      },
    ],
  },
};

async function NewsRadarSection() {
  const newsData = await queryNewsDisclosures({ limit: 60 });
  return (
    <NewsDisclosuresFeed
      initialItems={newsData.items}
      totalAvailable={newsData.totalAvailable}
      byCategory={newsData.byCategory}
      bySentiment={newsData.bySentiment}
    />
  );
}

export default function MarketIndexPage() {
  const index = getMonthlyMarketIndex();

  const fmt = (n: number) => n.toLocaleString('ar-EG', { maximumFractionDigits: 0 });
  const fmtM = (n: number) =>
    (n / 1_000_000).toLocaleString('ar-EG', { maximumFractionDigits: 2 });

  return (
    <div
      className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-amber-500 selection:text-black"
      dir="rtl"
    >
      <div className="fixed inset-0 pointer-events-none opacity-20 bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:24px_24px]" />

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-zinc-800/80 bg-zinc-950/95 backdrop-blur-md px-4 py-3.5">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-2">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              🏠
            </div>
            <div>
              <span className="font-black text-base text-white">
                إيوان بوت <span className="text-amber-400">Ewanbot</span>
              </span>
              <span className="block text-[10px] text-zinc-400">
                مؤشر الأسعار الشهري
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href="/partners"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-bold hover:bg-emerald-500/25 transition"
            >
              <span>💼 للشركات والمطورين</span>
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs sm:text-sm transition"
            >
              <span>افتح الشات</span>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-6xl mx-auto px-4 py-8 sm:py-12">
        {/* Hero */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold mb-3">
            <TrendingUp className="h-3.5 w-3.5" />
            <span>تحديث نوفمبر 2026 • بيانات موثقة من السوق</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-white mb-3">
            مؤشر إيوان لأسعار العقارات في مصر 📊
          </h1>
          <p className="text-sm text-zinc-400 max-w-2xl mx-auto">
            متوسطات سعر المتر الفعلية، وأنظمة المقدم والأقساط في المدن الجديدة المصرية استناداً إلى تحليل {index.totalCompounds} كمبوند رسمي.
          </p>
        </div>

        {/* National Highlight */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 text-center">
            <div className="text-xs text-amber-300 font-bold mb-1">
              المتوسط العام لسعر المتر (المدن الجديدة)
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white font-mono">
              {fmt(index.nationalAvgPricePerSqm)} ج.م/م²
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/75 p-5 text-center">
            <div className="text-xs text-zinc-400 font-bold mb-1">
              المشاريع والكمبوندات المغطاة
            </div>
            <div className="text-2xl sm:text-3xl font-black text-amber-400 font-mono">
              {index.totalCompounds} كمبوند
            </div>
          </div>

          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 text-center">
            <div className="text-xs text-emerald-300 font-bold mb-1">
              أطول فترة سداد متاحة في السوق
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white font-mono">
              حتى 10 سنوات
            </div>
          </div>
        </div>

        {/* Regional Index Table */}
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 overflow-hidden shadow-xl mb-10">
          <div className="p-5 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-black text-base text-white flex items-center gap-2">
              <MapPin className="h-4 w-4 text-amber-400" />
              <span>تفصيل الأسعار وأنظمة السداد حسب المدينة</span>
            </h2>
            <span className="text-xs text-zinc-400 flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              محدث تلقائياً من قاعدة بيانات Ewanbot
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs sm:text-sm">
              <thead className="bg-zinc-950/90 text-zinc-400 border-b border-zinc-800">
                <tr>
                  <th className="p-4">المدينة / المنطقة</th>
                  <th className="p-4">عدد المشاريع</th>
                  <th className="p-4">متوسط سعر المتر</th>
                  <th className="p-4">تبدأ الأسعار من</th>
                  <th className="p-4">متوسط المقدم</th>
                  <th className="p-4">أطول تقسيط</th>
                  <th className="p-4">أوفر مشروع حالياً</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/70">
                {index.cities.map((c) => (
                  <tr key={c.city} className="hover:bg-amber-500/5 transition">
                    <td className="p-4 font-bold text-white whitespace-nowrap">{c.city}</td>
                    <td className="p-4 text-zinc-300">{c.compoundsCount}</td>
                    <td className="p-4 font-black text-amber-400 whitespace-nowrap">
                      {c.avgPricePerSqm > 0 ? `${fmt(c.avgPricePerSqm)} ج.م` : '—'}
                    </td>
                    <td className="p-4 font-bold text-emerald-400 whitespace-nowrap">
                      {c.minPriceEgp > 0 ? `${fmtM(c.minPriceEgp)} مليون` : '—'}
                    </td>
                    <td className="p-4 text-zinc-300">{c.avgDownPaymentPct}%</td>
                    <td className="p-4 text-zinc-300">{c.maxInstallmentYears} سنوات</td>
                    <td className="p-4 whitespace-nowrap">
                      {c.cheapestCompound ? (
                        <Link
                          href={`/compounds/${encodeURIComponent(c.cheapestCompound.slug)}`}
                          className="text-amber-300 hover:underline font-bold"
                        >
                          {c.cheapestCompound.name}
                        </Link>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Developer Reliability & EGX Index */}
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 overflow-hidden shadow-xl mb-10">
          <div className="p-5 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-black text-base text-white flex items-center gap-2">
                <Building2 className="h-4 w-4 text-emerald-400" />
                <span>مؤشر ملاءة ومصداقية المطورين (البورصة المصرية وسجل التسليم)</span>
              </h2>
              <p className="text-[11px] text-zinc-400 mt-1">
                تقييم استرشادي مبني على الإفصاحات المالية العامة بالبورصة المصرية وسجل التسليمات السابقة
              </p>
            </div>
            <span className="text-[11px] rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 font-bold text-emerald-300">
              EGX & Delivery Track Record
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs sm:text-sm">
              <thead className="bg-zinc-950/90 text-zinc-400 border-b border-zinc-800">
                <tr>
                  <th className="p-4">المطور العقاري</th>
                  <th className="p-4">التصنيف / البورصة</th>
                  <th className="p-4">الملاءة</th>
                  <th className="p-4">سكور التسليم</th>
                  <th className="p-4">نقطة القوة وملاحظة إيوان بوت</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/70">
                {DEVELOPER_RELIABILITY_INDEX.map((dev) => (
                  <tr key={dev.id} className="hover:bg-emerald-500/5 transition">
                    <td className="p-4 font-bold text-white whitespace-nowrap">
                      <div>{dev.nameAr}</div>
                      <div className="text-[11px] text-zinc-400 font-normal">{dev.nameEn}</div>
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      {dev.egxTicker ? (
                        <span className="rounded-md bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[11px] font-mono font-bold text-amber-300">
                          {dev.egxTicker}
                        </span>
                      ) : (
                        <span className="text-[11px] text-zinc-400">مطور قطاع خاص</span>
                      )}
                    </td>
                    <td className="p-4 font-black text-emerald-400">{dev.solvencyTier}</td>
                    <td className="p-4 font-black text-white font-mono">{dev.deliveryScore}/100</td>
                    <td className="p-4 text-xs text-zinc-300 max-w-md">
                      <div>{dev.keyStrengthAr}</div>
                      <div className="text-[11px] text-amber-300/90 mt-1">💡 {dev.noteAr}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Live News & EGX Disclosures Radar */}
        <Suspense
          fallback={
            <div className="rounded-3xl border border-zinc-800 bg-zinc-900/60 p-8 text-center text-sm text-zinc-400 mb-10">
              جاري تحميل رادار الأخبار وإفصاحات البورصة المصرية...
            </div>
          }
        >
          <NewsRadarSection />
        </Suspense>

        {/* B2B / Press CTA */}
        <div className="rounded-3xl border border-emerald-500/35 bg-gradient-to-br from-emerald-500/10 via-zinc-900 to-amber-500/10 p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-lg sm:text-xl font-black text-white mb-2">
              هل تمثل شركة تطوير عقاري، شركة سمسرة، أو بنك تمويل؟
            </h3>
            <p className="text-xs sm:text-sm text-zinc-300 max-w-2xl leading-relaxed">
              احصل على بيانات الطلب الحقيقية (الميزانيات والمناطق الأكثر بحثاً)، ليدز مؤهلة بموافقة العميل، أو ركّب نسخة إيوان بوت بعلامة شركتك على موقعك خلال دقائق.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 shrink-0">
            <Link
              href="/partners"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-sm transition"
            >
              <Building2 className="h-4 w-4" />
              <span>بوابة الشركات والويدجت</span>
            </Link>
            <Link
              href="/compare"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white font-bold text-sm transition"
            >
              <Scale className="h-4 w-4 text-amber-400" />
              <span>قارن كمبوندين</span>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
