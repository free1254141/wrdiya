import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import EwanbotChatClient from '@/components/EwanbotChatClient';
import { getAllAreas, getTopCompounds } from '@/lib/compounds-data';

const SITE_URL = 'https://www.ewanbot.com';

export const metadata: Metadata = {
  title: {
    absolute: 'إيوان بوت | Ewanbot — مستشارك العقاري الذكي للشراء والبيع في مصر',
  },
  description:
    'إيوان بوت (Ewanbot): مستشارك العقاري بالذكاء الاصطناعي وبحث مباشر في أكثر من 663 كمبوند و2,800 وحدة معتمدة في مصر. قارن أسعار المتر والأقساط في التجمع الخامس، الشيخ زايد، العاصمة الإدارية، 6 أكتوبر، المستقبل سيتي، والساحل الشمالي بدون مكالمات سيلز مزعجة.',
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    title: 'إيوان بوت | Ewanbot — مستشارك العقاري الذكي في مصر',
    description:
      'تصفح وقارن أكثر من 663 كمبوند و2,800 عقار معتمد في مصر بالأسعار وخطط التقسيط الرسمية بدون مكالمات سيلز.',
    url: SITE_URL,
    siteName: 'إيوان بوت | Ewanbot',
    images: [
      {
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'إيوان بوت Ewanbot - مستشارك العقاري الذكي في مصر',
      },
    ],
    locale: 'ar_EG',
    type: 'website',
  },
};

const homepageFaqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  '@id': `${SITE_URL}/#faq`,
  mainEntity: [
    {
      '@type': 'Question',
      name: 'ما هو إيوان بوت (Ewanbot) وكيف يساعدني في شراء أو بيع العقارات في مصر؟',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'إيوان بوت هو مستشارك العقاري بالذكاء الاصطناعي ودليل بحث مباشر يضم أكثر من 663 كمبوند و2,800 وحدة معتمدة في مصر (القاهرة الجديدة والتجمع الخامس، الشيخ زايد، العاصمة الإدارية، 6 أكتوبر، المستقبل سيتي، والساحل الشمالي). يساعد المشترين في مقارنة الأسعار وحساب الأقساط بدقة، كما يتيح للملاك عرض وحداتهم للبيع مجاناً بدون مكالمات سيلز مزعجة.',
      },
    },
    {
      '@type': 'Question',
      name: 'ما هي أنظمة التقسيط وخطط السداد المتاحة في الكمبوندات المصرية؟',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'يوفر إيوان بوت حاسبة أقساط وميزانية فورية مرتبطة ببيانات أكثر من 663 كمبوند؛ حيث تبدأ المقدمات من 5% و10% بفترات تقسيط تصل إلى 8 و10 سنوات، مع خيارات كاش واستلام فوري.',
      },
    },
    {
      '@type': 'Question',
      name: 'كيف أقارن بين كمبوندين في مصر من حيث سعر المتر والمقدم بدون تسجيل رقم؟',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'يمكنك فتح حلبة المقارنة المباشرة على ewanbot.com/compare واختيار أي كمبوندين للمقارنة الفورية وجهاً لوجه من حيث متوسط سعر المتر، أقل مقدم، القسط الشهري، وأطول فترة سداد مع إمكانية تحميل التقرير PDF مجاناً.',
      },
    },
    {
      '@type': 'Question',
      name: 'كيف أعرض شقتي أو فيلتي أو قطعة أرض للبيع على إيوان بوت؟',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'يمكنك عرض وحدتك مجاناً بالضغط على زر (وحداتي المعروضة للبيع) أو إخبار الشات بوت برغبتك في البيع ليفتح لك نموذج إضافة الوحدة مباشرة؛ حيث تدخل المساحة والسعر والموقع وترفع صور وحدتك لتُعرض فوراً للمشترين الجادين.',
      },
    },
  ],
};

export default function HomePage() {
  const areas = getAllAreas();
  const topCompounds = getTopCompounds(12);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homepageFaqJsonLd) }}
      />
      <EwanbotChatClient />

      {/* Semantic Crawl Navigation for Search Engines & Screen Readers */}
      <nav aria-label="دليل عقارات ومناطق مصر على إيوان بوت" className="sr-only">
        <h2>أدوات وصفحات إيوان بوت العقارية</h2>
        <ul>
          <li><Link href="/compounds">دليل أسعار وجداول أقساط كمبوندات مصر 2026 (663 كمبوند)</Link></li>
          <li><Link href="/compare">حلبة مقارنة الكمبوندات وجهاً لوجه</Link></li>
          <li><Link href="/calculator">حاسبة الميزانية العقارية ومقارنة العقار بالذهب والشهادات</Link></li>
          <li><Link href="/market-index">مؤشر إيوان الشهري لأسعار العقارات في مصر 2026</Link></li>
          <li><Link href="/partners">بوابة الشركات والمطورين العقاريين B2B</Link></li>
          <li><Link href="/pricing">باقات وأسعار إيوان بوت للبروكر</Link></li>
        </ul>
        <h2>كمبوندات حسب المنطقة والمدينة في مصر</h2>
        <ul>
          {areas.map((area) => (
            <li key={area.slug}>
              <Link href={`/areas/${area.slug}`}>
                كمبوندات وأسعار {area.nameAr} 2026 ({area.compoundsCount} مشروع)
              </Link>
            </li>
          ))}
        </ul>
        <h2>أبرز الكمبوندات الأكثر بحثاً في مصر</h2>
        <ul>
          {topCompounds.map((c) => (
            <li key={c.slug}>
              <Link href={`/compounds/${encodeURIComponent(c.slug)}`}>
                أسعار وأقساط كمبوند {c.name} — {c.location}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
