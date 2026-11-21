import React from 'react';
import type { Metadata } from 'next';

const SITE_URL = 'https://www.ewanbot.com';

export const metadata: Metadata = {
  title: 'باقة البروكر والمسوقين العقاريين (Pro) — الأسعار والاشتراك',
  description:
    'اشترك في باقة إيوان بوت برو (Pro) للبروكر والمسوقين العقاريين في مصر: 300 استفسار ذكي شهرياً، سكور الصفقات الاستثماري، التقييم العادل AVM، وتقارير مقارنة لعملائك.',
  alternates: {
    canonical: `${SITE_URL}/pricing`,
  },
  openGraph: {
    title: 'باقة البروكر والمسوقين العقاريين (Pro) | إيوان بوت Ewanbot',
    description:
      'أدوات الذكاء الاصطناعي الاحترافية للوسطاء العقاريين في مصر: 300 استفسار شهرياً، سكور الصفقات، وحاسبة الأقساط الدقيقة.',
    url: `${SITE_URL}/pricing`,
    siteName: 'إيوان بوت | Ewanbot',
    images: [
      {
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'باقات وأسعار إيوان بوت للبروكر',
      },
    ],
    locale: 'ar_EG',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'باقة البروكر العقاري (Pro) | إيوان بوت',
    description:
      '300 استفسار شهرياً وأدوات تقييم ومقارنة احترافية للوسطاء العقاريين في مصر.',
    images: [`${SITE_URL}/og-image.png`],
  },
};

const pricingJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'الرئيسية', item: SITE_URL },
    { '@type': 'ListItem', position: 2, name: 'الباقات والأسعار', item: `${SITE_URL}/pricing` },
  ],
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pricingJsonLd) }}
      />
      {children}
    </>
  );
}
