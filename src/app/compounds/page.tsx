import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import { Building2, Search, ArrowLeft, ShieldCheck, Sparkles, Calculator, MapPin, TrendingUp } from 'lucide-react';
import { getAllCompounds } from '@/lib/compounds-data';

export const metadata: Metadata = {
  title: 'دليل أسعار وجداول أقساط كمبوندات مصر 2026 | إيوان بوت Ewanbot',
  description: 'دليل شامل لأسعار وجداول أقساط أكثر من 600 كمبوند رسمي ومعتمد في التجمع الخامس، الشيخ زايد، العاصمة الإدارية، 6 أكتوبر والساحل الشمالي. احسب قسطك بدون مكالمات سيلز.',
  alternates: {
    canonical: 'https://ewanbot.com/compounds',
  },
  openGraph: {
    title: 'دليل أسعار وجداول أقساط كمبوندات مصر 2026 | إيوان بوت',
    description: 'قارن أسعار المتر وأقل مقدم وأطول فترة سداد في كمبوندات مصر بالذكاء الاصطناعي وبدون مكالمات سيلز مزعجة.',
    url: 'https://ewanbot.com/compounds',
    siteName: 'إيوان بوت | Ewanbot',
    images: [
      {
        url: 'https://ewanbot.com/og-image.png',
        width: 1200,
        height: 630,
        alt: 'دليل كمبوندات مصر 2026',
      },
    ],
  },
};

export default function CompoundsIndexPage() {
  const compounds = getAllCompounds();

  const fmt = (n: number) =>
    (n / 1_000_000).toLocaleString('ar-EG', { maximumFractionDigits: 2 });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-amber-500 selection:text-black">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none opacity-20 bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:24px_24px]" />

      {/* Navigation Header */}
      <header className="relative z-10 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md sticky top-0 px-4 py-3.5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="h-9 w-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 group-hover:scale-105 transition">
              🏠
            </div>
            <div>
              <span className="font-black text-base tracking-tight text-white group-hover:text-amber-400 transition">
                إيوان بوت <span className="text-amber-400">Ewanbot</span>
              </span>
              <span className="block text-[10px] text-zinc-400">مستشارك العقاري الذكي</span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/calculator"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-bold text-zinc-300 hover:text-white hover:border-amber-500/40 transition"
            >
              <Calculator className="h-3.5 w-3.5 text-amber-400" />
              <span>حاسبة الميزانية</span>
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-black shadow-md transition"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>ابدأ الشات الذكي</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 pt-12 pb-10 px-4 text-center max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold mb-4">
          <ShieldCheck className="h-4 w-4" />
          <span>بيانات رسمية معتمدة محدثة لعام 2026</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-white leading-tight mb-4">
          دليل أسعار وجداول أقساط <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 bg-clip-text text-transparent">
            كمبوندات مصر 2026
          </span>
        </h1>

        <p className="text-zinc-400 text-sm sm:text-base max-w-2xl mx-auto mb-8 leading-relaxed">
          تصفح أسعار المتر وأقل مقدم وأطول فترة سداد لأكثر من {compounds.length} كمبوند معتمد في القاهرة الجديدة، الشيخ زايد، العاصمة الإدارية، والساحل الشمالي.
        </p>

        {/* Marketing Hook Banner */}
        <div className="bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-amber-500/15 border border-amber-500/30 rounded-2xl p-5 mb-10 text-center shadow-lg backdrop-blur-sm">
          <div className="text-sm sm:text-base font-bold text-amber-300 mb-2">
            💡 لا تدع شركات التسويق تزعجك بمكالمات السيلز!
          </div>
          <p className="text-xs sm:text-sm text-zinc-300 mb-4 max-w-xl mx-auto">
            يمكنك مقارنة أي كمبوند وحساب أقساطك الشهرية بالمليم في ثوانٍ معدودة عبر ذكاء إيوان بوت وبدون تسجيل رقم هاتفك.
          </p>
          <Link
            href="/?chat=عايز%20أقارن%20بين%20أفضل%20كمبوندات%20التجمع%20وزايد%20من%20حيث%20السعر%20والأقساط"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-sm shadow-md transition transform hover:-translate-y-0.5"
          >
            <Sparkles className="h-4 w-4" />
            <span>قارن بين أي كمبوندين فوراً مع Ewanbot</span>
          </Link>
        </div>
      </section>

      {/* Compounds Grid */}
      <main className="relative z-10 max-w-6xl mx-auto px-4 pb-20">
        <div className="flex items-center justify-between mb-6 pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-amber-400" />
            <h2 className="text-lg font-bold text-white">
              أبرز الكمبوندات المتاحة ({compounds.length})
            </h2>
          </div>
          <span className="text-xs text-zinc-400">تحديث شهري مباشر</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {compounds.slice(0, 150).map((c) => (
            <Link
              key={c.slug}
              href={`/compounds/${encodeURIComponent(c.slug)}`}
              className="group block rounded-2xl border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-900/90 hover:border-amber-500/50 p-4 transition duration-200 shadow-sm hover:shadow-amber-500/5"
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="min-w-0">
                  <h3 className="font-bold text-sm text-white group-hover:text-amber-400 transition truncate">
                    كمبوند {c.name}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-zinc-400 mt-0.5">
                    <MapPin className="h-3 w-3 text-amber-500/70" />
                    <span>{c.location || 'مصر'}</span>
                  </div>
                </div>
                <span className="shrink-0 rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-bold text-amber-400 border border-amber-500/20">
                  {c.units_count} وحدة
                </span>
              </div>

              {/* Quick Specs */}
              <div className="grid grid-cols-2 gap-2 text-xs bg-zinc-950/60 rounded-xl p-2.5 mb-3 border border-zinc-800/80">
                <div>
                  <span className="text-zinc-500 text-[10px] block">الأسعار تبدأ من</span>
                  <span className="font-black text-amber-400">{fmt(c.min_price)} مليون ج.م</span>
                </div>
                <div>
                  <span className="text-zinc-500 text-[10px] block">أطول فترة تقسيط</span>
                  <span className="font-bold text-zinc-200">حتى {c.max_installment_years} سنوات</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-zinc-400 group-hover:text-amber-400 transition pt-1">
                <span className="font-semibold">تفاصيل الأسعار والوحدات</span>
                <ArrowLeft className="h-3.5 w-3.5 transform group-hover:-translate-x-1 transition" />
              </div>
            </Link>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 bg-black/60 py-8 px-4 text-center text-xs text-zinc-500">
        <p>© 2026 إيوان بوت (Ewanbot) — المنصة الذكية المعتمدة لعقارات مصر.</p>
      </footer>
    </div>
  );
}
