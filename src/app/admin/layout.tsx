import React from 'react';
import type { Metadata } from 'next';
import AdminAuthGuard from './AdminAuthGuard';

export const metadata: Metadata = {
  title: 'Ewanbot - لوحة التحكم والإدارة',
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminAuthGuard>
      <div className="h-screen w-screen overflow-y-auto overflow-x-hidden bg-black text-white font-sans selection:bg-amber-500 selection:text-black">
        {children}
      </div>
    </AdminAuthGuard>
  );
}
