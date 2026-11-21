import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import {
  Building2,
  MapPin,
  Sparkles,
  ShieldCheck,
  ArrowLeft,
  ChevronRight,
  Calculator,
  Scale,
  HelpCircle,
  TrendingUp,
} from 'lucide-react';
import {
  getAllAreas,
  getAreaBySlug,
  getCompoundMetrics,
} from '@/lib/compounds-data';
import SubpageSidebarShell from '@/components/SubpageSidebarShell';

const SITE_URL = 'https://www.ewanbot.com';

interface Props {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return getAllAreas().map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const area = getAreaBySlug(slug);

  if (!area) {
    return { title: 'منطقة غير موجودة' };
  }

  const minM = area.minPrice > 0 ? (area.minPrice / 1_000_000).toFixed(1) : '3.0';
  const title = `أسعار كمبوندات ${area.nameAr} 2026 — سعر المتر وجداول الأقساط`;
  const description = `قارن ${area.compoundsCount} كمبوند ومشروع عقاري في ${area.nameAr} لعام 2026. تبدأ الأسعار من ${minM} مليون ج.م، مقدم من ${area.minDownPaymentPct}% وتقسيط حتى ${area.maxInstallmentYears} سنوات بدون مكالمات سيلز.`;
  const canonicalUrl = `${SITE_URL}/areas/${area.slug}`;

  return {
    title,
    description,
    keywords: area.keywords,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${title} | إيوان بوت Ewanbot`,
      description,
      url: canonicalUrl,
      siteName: 'إيوان بوت | Ewanbot',
      images: [
        {
          url: `${SITE_URL}/og-image.png`,
          width: 1200,
          height: 630,
          alt: `كمبوندات وأسعار ${area.nameAr} 2026`,
        },
      ],
      locale: 'ar_EG',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | إيوان بوت`,
      description,
      images: [`${SITE_URL}/og-image.png`],
    },
  };
}

export default async function AreaLandingPage({ params }: Props) {
  const { slug } = await params;
  const area = getAreaBySlug(slug);

  if (!area) {
    notFound();
  }

  const otherAreas = getAllAreas().filter((a) => a.slug !== area.slug);

  const fmt = (n?: number) =>
    typeof n === 'number' && Number.isFinite(n) && n > 0
      ? n.toLocaleString('ar-EG', { maximumFractionDigits: 0 })
      : '—';

  const fmtM = (n: number) =>
    n > 0 ? (n / 1_000_000).toLocaleString('ar-EG', { maximumFractionDigits: 2 }) : '—';

  const chatPrompt = encodeURIComponent(
    `عايز أفضل كمبوندات وشقق متاحة بالتقسيط في ${area.nameAr} بأسعار 2026 وأقل مقدم`
  );

  const areaUrl = `${SITE_URL}/areas/${area.slug}`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'الرئيسية', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'دليل الكمبوندات', item: `${SITE_URL}/compounds` },
          { '@type': 'ListItem', position: 3, name: area.shortNameAr, item: areaUrl },
        ],
      },
      {
        '@type': 'CollectionPage',
        name: `دليل كمبوندات وأسعار ${area.nameAr} 2026`,
        description: area.descriptionAr,
        url: areaUrl,
        mainEntity: {
          '@type': 'ItemList',
          numberOfItems: area.compoundsCount,
          itemListElement: area.compounds.slice(0, 30).map((c, idx) => ({
            '@type': 'ListItem',
            position: idx + 1,
            name: `كمبوند ${c.name}`,
            url: `${SITE_URL}/compounds/${encodeURIComponent(c.slug)}`,
          })),
        },
      },
      {
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: `كم يبلغ متوسط سعر المتر في كمبوندات ${area.shortNameAr} لعام 2026؟`,
            acceptedAnswer: {
              '@type': 'Answer',
              text:
                area.avgPricePerSqm > 0
                  ? `يبلغ متوسط سعر المتر في مشاريع وكمبوندات ${area.nameAr} حوالي ${fmt(area.avgPricePerSqm)} جنيه مصري للمتر المربع استناداً إلى تحليل ${area.compoundsCount} كمبوند مسجل على إيوان بوت.`
                  : `تختلف أسعار المتر في ${area.nameAr} حسب نوع الوحدة والمطور ومساحة المشروع، ويمكنك مقارنة كل مشروع على حدة عبر إيوان بوت.`,
            },
          },
          {
            '@type': 'Question',
            name: `ما هي أقل أسعار الوحدات وأنظمة التقسيط في ${area.shortNameAr}؟`,
            acceptedAnswer: {
              '@type': 'Answer',
              text: `تبدأ أسعار الوحدات في ${area.nameAr} من ${fmtM(area.minPrice)} مليون جنيه مصري، بمقدم يبدأ من ${area.minDownPaymentPct}% وفترات تقسيط تصل إلى ${area.maxInstallmentYears} سنوات.`,
            },
          },
          {
            '@type': 'Question',
            name: `كيف أقارن بين كمبوندات ${area.shortNameAr} بدون مكالمات سيلز؟`,
            acceptedAnswer: {
              '@type': 'Answer',
              text: `يمكنك استخدام حلبة المقارنة المباشرة أو المستشار الذكي في إيوان بوت (Ewanbot) لمقارنة أي كمبوندين في ${area.shortNameAr} من حيث السعر والمقدم والأقساط مجاناً وبدون إدخال رقم هاتفك.`,
            },
          },
        ],
      },
    ],
  };

  return (
    <SubpageSidebarShell>
      <div
        className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-amber-500 selection:text-black"
        dir="rtl"
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />

        {/* Header */}
        <header className="sticky top-0 z-50 border-b border-zinc-800/80 bg-zinc-950/95 backdrop-blur-md px-4 py-3">
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-2">
            <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-zinc-400 min-w-0">
              <Link href="/" className="hover:text-amber-400 transition shrink-0">الرئيسية</Link>
              <ChevronRight className="h-3.5 w-3.5 text-zinc-600 rotate-180 shrink-0" />
              <Link href="/compounds" className="hover:text-amber-400 transition shrink-0">الكمبوندات</Link>
              <ChevronRight className="h-3.5 w-3.5 text-zinc-600 rotate-180 shrink-0" />
              <span className="text-zinc-200 font-semibold truncate">{area.shortNameAr}</span>
            </nav>

            <Link
              href={`/?chat=${chatPrompt}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-black shadow-md transition shrink-0"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>استشر البوت عن {area.shortNameAr}</span>
            </Link>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-4 py-8 sm:py-10">
          {/* Hero */}
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold mb-3">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>دليل السوق المحدث لعام 2026 • {area.compoundsCount} مشروع معتمد</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black text-white leading-tight mb-3">
              أسعار وجداول أقساط كمبوندات{' '}
              <span className="text-amber-400">{area.nameAr}</span> 2026
            </h1>

            <p className="text-sm text-zinc-400 max-w-3xl leading-relaxed">
              {area.descriptionAr}
            </p>
          </div>

          {/* Area Market Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-8">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4 text-center">
              <span className="text-zinc-500 text-xs block mb-1">عدد الكمبوندات</span>
              <span className="text-lg sm:text-2xl font-black text-white font-mono">
                {area.compoundsCount}
              </span>
              <span className="text-[10px] text-zinc-400 block mt-0.5">
                مشروع ({area.unitsCount} وحدة)
              </span>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4 text-center">
              <span className="text-zinc-500 text-xs block mb-1">متوسط سعر المتر</span>
              <span className="text-lg sm:text-2xl font-black text-amber-400 font-mono">
                {fmt(area.avgPricePerSqm)}
              </span>
              <span className="text-[10px] text-zinc-400 block mt-0.5">ج.م / م²</span>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4 text-center">
              <span className="text-zinc-500 text-xs block mb-1">تبدأ الأسعار من</span>
              <span className="text-lg sm:text-2xl font-black text-emerald-400 font-mono">
                {fmtM(area.minPrice)} مليون
              </span>
              <span className="text-[10px] text-zinc-400 block mt-0.5">
                بمقدم يبدأ من {area.minDownPaymentPct}%
              </span>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4 text-center">
              <span className="text-zinc-500 text-xs block mb-1">أطول فترة سداد</span>
              <span className="text-lg sm:text-2xl font-black text-white font-mono">
                حتى {area.maxInstallmentYears} سنوات
              </span>
              <span className="text-[10px] text-zinc-400 block mt-0.5">أقساط بدون فوائد</span>
            </div>
          </div>

          {/* Quick Action Strip */}
          <div className="flex flex-wrap items-center gap-2.5 mb-8">
            <Link
              href={`/?chat=${chatPrompt}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs sm:text-sm transition"
            >
              <Sparkles className="h-4 w-4" />
              <span>رشّح لي أفضل صفقة في {area.shortNameAr}</span>
            </Link>
            <Link
              href="/compare"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-700 bg-zinc-900 hover:border-amber-500/50 text-white font-bold text-xs sm:text-sm transition"
            >
              <Scale className="h-4 w-4 text-amber-400" />
              <span>قارن كمبوندين وجهاً لوجه</span>
            </Link>
            <Link
              href="/calculator"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-700 bg-zinc-900 hover:border-amber-500/50 text-white font-bold text-xs sm:text-sm transition"
            >
              <Calculator className="h-4 w-4 text-emerald-400" />
              <span>احسب الكمبوند المناسب لمقدمك</span>
            </Link>
          </div>

          {/* All Compounds in Area */}
          <section className="mb-12">
            <div className="flex items-center justify-between mb-5 pb-3 border-b border-zinc-800">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Building2 className="h-5 w-5 text-amber-400" />
                <span>جميع كمبوندات {area.shortNameAr} ({area.compoundsCount})</span>
              </h2>
              <Link
                href="/market-index"
                className="inline-flex items-center gap-1 text-xs text-amber-400 hover:underline font-bold"
              >
                <TrendingUp className="h-3.5 w-3.5" />
                <span>مؤشر الأسعار</span>
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {area.compounds.map((c) => {
                const metrics = getCompoundMetrics(c);
                return (
                  <div
                    key={c.slug}
                    className="group rounded-2xl border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-900/90 hover:border-amber-500/50 p-4 transition flex flex-col justify-between gap-3"
                  >
                    <Link href={`/compounds/${encodeURIComponent(c.slug)}`} className="block">
                      <div className="flex items-start justify-between gap-2 mb-2.5">
                        <div className="min-w-0">
                          <h3 className="font-bold text-sm text-white group-hover:text-amber-400 transition truncate">
                            كمبوند {c.name}
                          </h3>
                          <div className="flex items-center gap-1 text-xs text-zinc-400 mt-0.5">
                            <MapPin className="h-3 w-3 text-amber-500/70 shrink-0" />
                            <span className="truncate">{c.location}</span>
                          </div>
                        </div>
                        <span className="shrink-0 rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-bold text-amber-400 border border-amber-500/20">
                          {c.units_count} وحدة
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs bg-zinc-950/60 rounded-xl p-2.5 border border-zinc-800/80">
                        <div>
                          <span className="text-zinc-500 text-[10px] block">الأسعار تبدأ من</span>
                          <span className="font-black text-amber-400">{fmtM(c.min_price)} مليون ج.م</span>
                        </div>
                        <div>
                          <span className="text-zinc-500 text-[10px] block">
                            {metrics.avgPricePerSqm > 0 ? 'متوسط المتر' : 'التقسيط'}
                          </span>
                          <span className="font-bold text-zinc-200">
                            {metrics.avgPricePerSqm > 0
                              ? `${fmt(metrics.avgPricePerSqm)} ج.م/م²`
                              : `حتى ${c.max_installment_years} سنوات`}
                          </span>
                        </div>
                      </div>
                    </Link>

                    <div className="flex items-center justify-between gap-2 pt-1 text-xs">
                      <Link
                        href={`/compounds/${encodeURIComponent(c.slug)}`}
                        className="inline-flex items-center gap-1 font-semibold text-zinc-300 hover:text-amber-400 transition"
                      >
                        <span>الأسعار والأقساط</span>
                        <ArrowLeft className="h-3.5 w-3.5" />
                      </Link>
                      <Link
                        href={`/compare?c1=${encodeURIComponent(c.slug)}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-950 px-2.5 py-1 text-[11px] font-bold text-zinc-400 hover:text-amber-400 hover:border-amber-500/40 transition"
                      >
                        <Scale className="h-3 w-3" />
                        <span>قارن</span>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Area FAQ */}
          <section className="mb-12 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
            <h2 className="text-base sm:text-lg font-bold text-white mb-4 flex items-center gap-2">
              <HelpCircle className="h-4 w-4 text-amber-400" />
              <span>أسئلة شائعة حول أسعار العقارات في {area.shortNameAr} 2026</span>
            </h2>
            <div className="space-y-3 text-xs sm:text-sm">
              <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
                <h3 className="font-bold text-amber-300 mb-1">
                  كم يبلغ متوسط سعر المتر في كمبوندات {area.shortNameAr} لعام 2026؟
                </h3>
                <p className="text-zinc-400 leading-relaxed">
                  يبلغ متوسط سعر المتر في مشاريع {area.nameAr} حوالي {fmt(area.avgPricePerSqm)} جنيه مصري للمتر المربع استناداً إلى {area.compoundsCount} كمبوند مسجل في قاعدة بيانات إيوان بوت.
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
                <h3 className="font-bold text-amber-300 mb-1">
                  ما هو أقل سعر وأطول نظام تقسيط في {area.shortNameAr}؟
                </h3>
                <p className="text-zinc-400 leading-relaxed">
                  تبدأ الأسعار من {fmtM(area.minPrice)} مليون ج.م، مع مقدم تعاقد يبدأ من {area.minDownPaymentPct}% وتقسيط يصل حتى {area.maxInstallmentYears} سنوات.
                </p>
              </div>
            </div>
          </section>

          {/* Cross-link to Other Areas */}
          <section>
            <h2 className="text-base font-bold text-zinc-200 mb-3">
              استكشف أسعار الكمبوندات في مدن ومناطق مصر الأخرى
            </h2>
            <div className="flex flex-wrap gap-2">
              {otherAreas.map((other) => (
                <Link
                  key={other.slug}
                  href={`/areas/${other.slug}`}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900/70 hover:border-amber-500/50 hover:text-amber-400 px-3.5 py-2 text-xs font-bold text-zinc-300 transition"
                >
                  <MapPin className="h-3.5 w-3.5 text-amber-500/70" />
                  <span>{other.shortNameAr}</span>
                  <span className="text-[10px] text-zinc-500">({other.compoundsCount})</span>
                </Link>
              ))}
            </div>
          </section>
        </main>

        <footer className="border-t border-zinc-900 bg-black/60 py-6 px-4 text-center text-xs text-zinc-500">
          <p>© 2026 إيوان بوت (Ewanbot) — المنصة الذكية المعتمدة لعقارات مصر.</p>
        </footer>
      </div>
    </SubpageSidebarShell>
  );
}
