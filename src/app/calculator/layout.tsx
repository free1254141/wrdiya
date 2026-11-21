import React from 'react';
import type { Metadata } from 'next';

const SITE_URL = 'https://www.ewanbot.com';

export const metadata: Metadata = {
  title: 'حاسبة الميزانية العقارية والأقساط 2026 — اعرف الكمبوند المناسب لمقدمك',
  description:
    'أدخل المقدم المتاح معك وقسطك الشهري لتعرف فوراً أفضل الكمبوندات والشقق المناسبة لميزانيتك في مصر 2026، وقارن عائد العقار مقابل الذهب وشهادات البنك مجاناً وبدون رقم تليفون.',
  alternates: {
    canonical: `${SITE_URL}/calculator`,
  },
  openGraph: {
    title: 'حاسبة الميزانية العقارية ومقارنة العقار بالذهب والشهادات 2026 | إيوان بوت',
    description:
      'معاك مقدم كام؟ اعرف قوتك الشرائية والكمبوندات المناسبة لميزانيتك من بين 663+ كمبوند معتمد في مصر فوراً.',
    url: `${SITE_URL}/calculator`,
    siteName: 'إيوان بوت | Ewanbot',
    images: [
      {
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'حاسبة الميزانية العقارية في مصر 2026 - إيوان بوت',
      },
    ],
    locale: 'ar_EG',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'حاسبة الميزانية العقارية والأقساط 2026 | إيوان بوت',
    description:
      'احسب قوتك الشرائية واعرف الكمبوندات المناسبة لمقدمك وقسطك الشهري فوراً بدون تسجيل رقم.',
    images: [`${SITE_URL}/og-image.png`],
  },
};

const calculatorJsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'الرئيسية', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: 'حاسبة الميزانية العقارية', item: `${SITE_URL}/calculator` },
      ],
    },
    {
      '@type': 'WebApplication',
      name: 'حاسبة الميزانية العقارية والأقساط في مصر 2026 — إيوان بوت',
      url: `${SITE_URL}/calculator`,
      applicationCategory: 'FinanceApplication',
      operatingSystem: 'All',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'EGP' },
    },
  ],
};

export default function CalculatorLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(calculatorJsonLd) }}
      />
      {children}
    </>
  );
}
