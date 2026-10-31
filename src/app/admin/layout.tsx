import React from 'react';
import type { Metadata } from 'next';
import AdminAuthGuard from './AdminAuthGuard';

export const metadata: Metadata = {
  title: 'Sakanybot - لوحة التحكم والإدارة',
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminAuthGuard>
      <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-amber-500 selection:text-black">
        {children}
      </div>
    </AdminAuthGuard>
  );
}
