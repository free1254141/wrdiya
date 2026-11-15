import React, { Suspense } from 'react';
import { Metadata } from 'next';
import CompareCompoundsClient from '@/components/CompareCompoundsClient';

export const metadata: Metadata = {
  title: 'مقارنة أسعار وأقساط كمبوندات مصر 2026 وجهاً لوجه | إيوان بوت Ewanbot',
  description:
    'قارن بصراحة بين أي كمبوندين في التجمع الخامس، الشيخ زايد، 6 أكتوبر، العاصمة الإدارية والساحل الشمالي. اعرف سعر المتر الفعلي، أقل مقدم، والقسط الحقيقي بدون سيلز.',
  alternates: {
    canonical: 'https://ewanbot.com/compare',
  },
  openGraph: {
    title: 'حلبة مقارنة الكمبوندات وجهاً لوجه 2026 | إيوان بوت',
    description:
      'قارن أسعار المتر وأنظمة السداد بين 660+ كمبوند في مصر وحمّل تقرير المقارنة PDF فوراً.',
    url: 'https://ewanbot.com/compare',
    siteName: 'إيوان بوت | Ewanbot',
    images: [
      {
        url: 'https://ewanbot.com/og-image.png',
        width: 1200,
        height: 630,
        alt: 'مقارنة كمبوندات مصر 2026',
      },
    ],
  },
};

export default function ComparePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 text-zinc-400 flex items-center justify-center text-sm font-bold">
          جاري تحميل حلبة المقارنة...
        </div>
      }
    >
      <CompareCompoundsClient />
    </Suspense>
  );
}
