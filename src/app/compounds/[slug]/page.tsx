import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { 
  Building2, 
  MapPin, 
  Sparkles, 
  ShieldCheck, 
  Clock, 
  ArrowLeft, 
  CheckCircle2, 
  Calculator,
  ChevronRight,
  HelpCircle,
  Eye
} from 'lucide-react';
import { getCompoundBySlug, getTopCompounds, getAllCompounds } from '@/lib/compounds-data';

interface Props {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  const compounds = getTopCompounds(100);
  return compounds.map((c) => ({
    slug: c.slug,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const compound = getCompoundBySlug(slug);

  if (!compound) {
    return {
      title: 'كمبوند غير موجود | إيوان بوت',
    };
  }

  const minPriceMillion = (compound.min_price / 1_000_000).toFixed(2);
  const title = `أسعار وجدول أقساط كمبوند ${compound.name} ${compound.location} 2026 | إيوان بوت`;
  const description = `تعرف على أسعار وحدات كمبوند ${compound.name} الرسمية لعام 2026. تبدأ الأسعار من ${minPriceMillion} مليون ج.م بمقدم ${compound.min_down_payment_pct}% وتقسيط حتى ${compound.max_installment_years} سنوات بدون مكالمات سيلز مزعجة.`;

  return {
    title,
    description,
    alternates: {
      canonical: `https://ewanbot.com/compounds/${encodeURIComponent(compound.slug)}`,
    },
    openGraph: {
      title,
      description,
      url: `https://ewanbot.com/compounds/${encodeURIComponent(compound.slug)}`,
      siteName: 'إيوان بوت | Ewanbot',
      images: [
        {
          url: compound.images?.[0] || 'https://ewanbot.com/og-image.png',
          width: 1200,
          height: 630,
          alt: `كمبوند ${compound.name}`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [compound.images?.[0] || 'https://ewanbot.com/og-image.png'],
    },
  };
}

export default async function SingleCompoundPage({ params }: Props) {
  const { slug } = await params;
  const compound = getCompoundBySlug(slug);

  if (!compound) {
    notFound();
  }

  const related = getTopCompounds(6).filter((c) => c.slug !== compound.slug);

  const fmt = (n?: number) =>
    typeof n === 'number' && Number.isFinite(n)
      ? n.toLocaleString('ar-EG', { maximumFractionDigits: 0 })
      : '—';

  const fmtM = (n: number) =>
    (n / 1_000_000).toLocaleString('ar-EG', { maximumFractionDigits: 2 });

  const chatPrompt = encodeURIComponent(`عايز أعرف كل تفاصيل كمبوند ${compound.name} في ${compound.location} وأسعاره وأقساطه المتاحة`);

  // FAQ structured data for Google Rich Snippets
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `ما هي أسعار كمبوند ${compound.name} لعام 2026؟`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `تبدأ أسعار الوحدات في كمبوند ${compound.name} من حوالي ${fmtM(compound.min_price)} مليون جنيه مصري وتصل إلى ${fmtM(compound.max_price)} مليون جنيه مصري حسب نوع ومساحة الوحدة.`,
        },
      },
      {
        '@type': 'Question',
        name: `ما هو أقل مقدم لشراء وحدة في كمبوند ${compound.name}؟`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `أقل نسبة مقدم تعاقد في كمبوند ${compound.name} هي ${compound.min_down_payment_pct}%، مع فترات سداد ميسرة تصل إلى ${compound.max_installment_years} سنوات.`,
        },
      },
      {
        '@type': 'Question',
        name: `كيف أحسب القسط الشهري لكمبوند ${compound.name} بدون مكالمات سيلز؟`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `يمكنك استخدام مستشارك العقاري الذكي عبر منصة إيوان بوت (Ewanbot) للحصول على الحسبة الدقيقة والمقارنات الفورية بدون الحاجة لترك رقم هاتفك.`,
        },
      },
    ],
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-amber-500 selection:text-black">
      {/* JSON-LD Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      {/* Header */}
      <header className="border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-20 px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <Link href="/" className="hover:text-amber-400 transition">الرئيسية</Link>
            <ChevronRight className="h-3.5 w-3.5 text-zinc-600 rotate-180" />
            <Link href="/compounds" className="hover:text-amber-400 transition">الكمبوندات</Link>
            <ChevronRight className="h-3.5 w-3.5 text-zinc-600 rotate-180" />
            <span className="text-zinc-200 font-semibold truncate max-w-[140px] sm:max-w-none">{compound.name}</span>
          </div>

          <Link
            href={`/?chat=${chatPrompt}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-black shadow-md transition"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>اسأل الشات عن {compound.name}</span>
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Title Area */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold mb-3">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>بيانات رسمية معتمدة {compound.location}</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-white leading-tight mb-2">
            أسعار وجدول أقساط كمبوند <span className="text-amber-400">{compound.name}</span> 2026
          </h1>

          <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-zinc-400">
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-amber-400" />
              <span>{compound.location}</span>
            </span>
            <span>•</span>
            <span className="text-emerald-400 font-semibold">متاح {compound.units_count} وحدة مسجلة في قاعدة البيانات</span>
            <span>•</span>
            <span>تحديث شهر نوفمبر 2026</span>
          </div>
        </div>

        {/* Highlight Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-8">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4 text-center">
            <span className="text-zinc-500 text-xs block mb-1">الأسعار تبدأ من</span>
            <span className="text-lg sm:text-2xl font-black text-amber-400">{fmtM(compound.min_price)} مليون</span>
            <span className="text-[10px] text-zinc-400 block mt-0.5">جنيه مصري</span>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4 text-center">
            <span className="text-zinc-500 text-xs block mb-1">أقل مقدم تعاقد</span>
            <span className="text-lg sm:text-2xl font-black text-white">{compound.min_down_payment_pct}%</span>
            <span className="text-[10px] text-zinc-400 block mt-0.5">بدءاً من {fmt(compound.min_price * (compound.min_down_payment_pct / 100))} ج.م</span>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4 text-center">
            <span className="text-zinc-500 text-xs block mb-1">أطول فترة تقسيط</span>
            <span className="text-lg sm:text-2xl font-black text-white">{compound.max_installment_years} سنوات</span>
            <span className="text-[10px] text-zinc-400 block mt-0.5">أقساط متساوية وبدون فوائد</span>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4 text-center">
            <span className="text-zinc-500 text-xs block mb-1">أقل قسط شهري</span>
            <span className="text-lg sm:text-2xl font-black text-emerald-400">{fmt(compound.min_monthly_installment)}</span>
            <span className="text-[10px] text-zinc-400 block mt-0.5">ج.م / شهرياً</span>
          </div>
        </div>

        {/* THE MARKETING HOOK (الحيلة التسويقية في منتصف الصفحة) */}
        <div className="my-8 rounded-3xl border-2 border-amber-500/50 bg-gradient-to-br from-amber-500/20 via-zinc-900/95 to-zinc-950 p-6 sm:p-8 text-center shadow-xl shadow-amber-500/10 relative overflow-hidden">
          <div className="relative z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 border border-amber-500/40 text-amber-300 text-xs font-bold mb-3">
              <span>🔒 خصوصية تامة • بدون مكالمات سيلز مزعجة</span>
            </div>

            <h2 className="text-xl sm:text-3xl font-black text-white mb-3">
              احسب قسطك الشهري بدقة وقارن الوحدات المتاحة فوراً في كمبوند {compound.name}
            </h2>

            <p className="text-xs sm:text-sm text-zinc-300 max-w-2xl mx-auto mb-6 leading-relaxed">
              لا داعي لتسجيل رقم هاتفك واستقبال عشرات المكالمات من الوسطاء. اسأل إيوان بوت مباشرة واعرف الأقساط الحقيقية وتفاصيل الاستلام والموقع فوراً.
            </p>

            <Link
              href={`/?chat=${chatPrompt}`}
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-black text-sm sm:text-base shadow-lg shadow-amber-500/30 transition transform hover:-translate-y-0.5"
            >
              <Sparkles className="h-5 w-5" />
              <span>احسب قسطك الشهري وقارن الوحدات فوراً مع Ewanbot بدون تسجيل رقم</span>
            </Link>
          </div>
        </div>

        {/* Live Sample Units Table */}
        {compound.sample_units && compound.sample_units.length > 0 && (
          <div className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <Building2 className="h-4 w-4 text-amber-400" />
                <span>نماذج من الوحدات المتاحة في كمبوند {compound.name}</span>
              </h3>
              <span className="text-xs text-zinc-400">أسعار رسمية محدثة</span>
            </div>

            <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/70">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs sm:text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-800 bg-zinc-950/80 text-zinc-400 font-bold">
                      <th className="py-3 px-4">نوع الوحدة</th>
                      <th className="py-3 px-4">المساحة والغرف</th>
                      <th className="py-3 px-4">السعر الإجمالي</th>
                      <th className="py-3 px-4">المقدم والتقسيط</th>
                      <th className="py-3 px-4 text-center">الإجراء</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/80">
                    {compound.sample_units.map((u, idx) => (
                      <tr key={u.id || idx} className="hover:bg-amber-500/5 transition">
                        <td className="py-3 px-4 font-bold text-white whitespace-nowrap">
                          {u.unit_type}
                        </td>
                        <td className="py-3 px-4 text-zinc-300 whitespace-nowrap">
                          {u.area_sqm} م² {u.bedrooms ? `• ${u.bedrooms} غرف` : ''}
                        </td>
                        <td className="py-3 px-4 font-black text-amber-400 whitespace-nowrap">
                          {fmt(u.price)} ج.م
                        </td>
                        <td className="py-3 px-4 text-zinc-300 text-xs whitespace-nowrap">
                          <div>مقدم {u.down_payment_pct}% ({fmt(u.price * (u.down_payment_pct / 100))} ج.م)</div>
                          <div className="text-emerald-400 font-semibold mt-0.5">
                            قسط شهري: {fmt(u.monthly_installment)} ج.م ({u.installment_years} سنوات)
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <Link
                            href={`/?chat=${encodeURIComponent(`عايز أعرف تفاصيل الوحدة رقم ${idx + 1} في كمبوند ${compound.name} بمساحة ${u.area_sqm}م`)}`}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-amber-500/20 hover:bg-amber-500 text-amber-400 hover:text-black font-bold text-xs transition"
                          >
                            <Eye className="h-3 w-3" />
                            <span>استشر البوت</span>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* FAQ Section */}
        <div className="mb-12 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
          <h3 className="text-base sm:text-lg font-bold text-white mb-4 flex items-center gap-2">
            <HelpCircle className="h-4 w-4 text-amber-400" />
            <span>الأسئلة الشائعة حول كمبوند {compound.name}</span>
          </h3>

          <div className="space-y-4 text-xs sm:text-sm">
            <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
              <h4 className="font-bold text-amber-300 mb-1">
                ما هي أسعار كمبوند {compound.name} لعام 2026؟
              </h4>
              <p className="text-zinc-400 leading-relaxed">
                تبدأ أسعار الوحدات في كمبوند {compound.name} من حوالي {fmtM(compound.min_price)} مليون جنيه وتصل إلى {fmtM(compound.max_price)} مليون جنيه مصري حسب نوع ومساحة الوحدة وطريقة السداد.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
              <h4 className="font-bold text-amber-300 mb-1">
                ما هو أقل مقدم لشراء شقة في كمبوند {compound.name}؟
              </h4>
              <p className="text-zinc-400 leading-relaxed">
                أقل مقدم تعاقد متاح هو {compound.min_down_payment_pct}%، مع فترات سداد مريحة تصل إلى {compound.max_installment_years} سنوات بأقساط شهرية متساوية.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
              <h4 className="font-bold text-amber-300 mb-1">
                هل يتطلب معرفة أسعار الكمبوند إدخال رقم هاتفي؟
              </h4>
              <p className="text-zinc-400 leading-relaxed">
                لا إطلاقاً، منصة إيوان بوت (Ewanbot) تتيح لك المقارنة والحساب الفوري مجاناً وبدون أي تسجيل رقم هاتف للحفاظ على خصوصيتك ومنع الإزعاج.
              </p>
            </div>
          </div>
        </div>

        {/* Related Compounds */}
        {related.length > 0 && (
          <div>
            <h3 className="text-sm sm:text-base font-bold text-zinc-300 mb-3">
              كمبوندات أخرى مميزة قد تهمك
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {related.map((rc) => (
                <Link
                  key={rc.slug}
                  href={`/compounds/${encodeURIComponent(rc.slug)}`}
                  className="p-3 rounded-xl border border-zinc-800 bg-zinc-900/60 hover:border-amber-500/40 transition block text-xs"
                >
                  <span className="font-bold text-white block truncate mb-1">كمبوند {rc.name}</span>
                  <span className="text-[11px] text-amber-400 block">يبدأ من {fmtM(rc.min_price)} مليون</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 bg-black/60 py-6 px-4 text-center text-xs text-zinc-500">
        <p>© 2026 إيوان بوت (Ewanbot) — المنصة الذكية المعتمدة لعقارات مصر.</p>
      </footer>
    </div>
  );
}
