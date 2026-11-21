import React from 'react';
import type { Metadata } from 'next';

const SITE_URL = 'https://www.ewanbot.com';

export const metadata: Metadata = {
  title: 'بوابة الشركات والمطورين العقاريين (B2B) وويدجت الشات الذكي',
  description:
    'ركّب مساعداً عقارياً بالذكاء الاصطناعي (White-Label Widget) بعلامة شركتك على موقعك، واحصل على تقارير ذكاء الطلب وليدز مؤهلة بموافقة العميل وAPI التقييم العقاري للبنوك.',
  alternates: {
    canonical: `${SITE_URL}/partners`,
  },
  openGraph: {
    title: 'حلول الذكاء الاصطناعي وبيانات الطلب لشركات العقارات | إيوان بوت B2B',
    description:
      'ويدجت شات عقاري بعلامة شركتك + تقارير الطلب الفعلي + ليدز مؤهلة بـ Intent Score للمطورين وشركات البروكرج.',
    url: `${SITE_URL}/partners`,
    siteName: 'إيوان بوت | Ewanbot',
    images: [
      {
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'بوابة الشركات والمطورين العقاريين - إيوان بوت',
      },
    ],
    locale: 'ar_EG',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'بوابة الشركات والمطورين العقاريين B2B | إيوان بوت',
    description:
      'مساعد عقاري ذكي بعلامة شركتك وتقارير الطلب الحقيقي وليدز مؤهلة للمطورين والوسطاء.',
    images: [`${SITE_URL}/og-image.png`],
  },
};

const partnersJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'الرئيسية', item: SITE_URL },
    { '@type': 'ListItem', position: 2, name: 'بوابة الشركات والمطورين', item: `${SITE_URL}/partners` },
  ],
};

export default function PartnersLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(partnersJsonLd) }}
      />
      {children}
    </>
  );
}
