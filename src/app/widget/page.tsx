import React, { Suspense } from 'react';
import { Metadata } from 'next';
import WhiteLabelWidgetClient from '@/components/WhiteLabelWidgetClient';

export const metadata: Metadata = {
  title: 'مساعد العقارات الذكي | Ewanbot Widget',
  robots: { index: false, follow: false },
};

export default function WidgetPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen bg-zinc-950 text-zinc-400 flex items-center justify-center text-xs">
          جاري تشغيل المساعد الذكي...
        </div>
      }
    >
      <WhiteLabelWidgetClient />
    </Suspense>
  );
}
