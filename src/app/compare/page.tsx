import React from 'react';
import { Metadata } from 'next';
import CompareCompoundsClient from '@/components/CompareCompoundsClient';

const SITE_URL = 'https://www.ewanbot.com';

export const metadata: Metadata = {
  title: 'حلبة مقارنة أسعار وأقساط كمبوندات مصر 2026 وجهاً لوجه',
  description:
    'قارن بصراحة بين أي كمبوندين في التجمع الخامس، الشيخ زايد، 6 أكتوبر، العاصمة الإدارية والساحل الشمالي. اعرف سعر المتر الفعلي، أقل مقدم، والقسط الحقيقي وحمّل التقرير PDF بدون سيلز.',
  alternates: {
    canonical: `${SITE_URL}/compare`,
  },
  openGraph: {
    title: 'حلبة مقارنة الكمبوندات وجهاً لوجه 2026 | إيوان بوت Ewanbot',
    description:
      'قارن أسعار المتر وأنظمة السداد بين 663+ كمبوند في مصر وحمّل تقرير المقارنة PDF فوراً بدون مكالمات سيلز.',
    url: `${SITE_URL}/compare`,
    siteName: 'إيوان بوت | Ewanbot',
    images: [
      {
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'حلبة مقارنة كمبوندات مصر 2026 - إيوان بوت',
      },
    ],
    locale: 'ar_EG',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'حلبة مقارنة كمبوندات مصر 2026 وجهاً لوجه | إيوان بوت',
    description:
      'قارن سعر المتر والمقدم والأقساط بين أي كمبوندين في مصر وحمّل التقرير PDF فوراً.',
    images: [`${SITE_URL}/og-image.png`],
  },
};

const compareJsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'الرئيسية', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: 'حلبة مقارنة الكمبوندات', item: `${SITE_URL}/compare` },
      ],
    },
    {
      '@type': 'WebApplication',
      name: 'حلبة مقارنة كمبوندات مصر 2026 — إيوان بوت',
      url: `${SITE_URL}/compare`,
      applicationCategory: 'RealEstateApplication',
      operatingSystem: 'All',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'EGP' },
    },
  ],
};

export default function ComparePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(compareJsonLd) }}
      />
      <CompareCompoundsClient />
    </>
  );
}
