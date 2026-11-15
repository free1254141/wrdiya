'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  MessageSquare,
  Plus,
  Building2,
  Calculator,
  Scale,
  TrendingUp,
  Briefcase,
  Zap,
  PanelRightClose,
  PanelRightOpen,
  Sparkles,
  Menu,
  X,
} from 'lucide-react';

interface StoredSession {
  id: string;
  title?: string;
}

const NAV_ITEMS = [
  { href: '/', label: 'الشات الرئيسي (المستشار)', Icon: Sparkles },
  { href: '/compounds', label: 'دليل الكمبوندات (663)', Icon: Building2 },
  { href: '/compare', label: 'قارن كمبوندين وجهاً لوجه', Icon: Scale },
  { href: '/calculator', label: 'حاسبة الميزانية والذهب', Icon: Calculator },
  { href: '/market-index', label: 'مؤشر السوق والإفصاحات', Icon: TrendingUp },
  { href: '/partners', label: 'بوابة الشركات والويدجت', Icon: Briefcase },
  { href: '/pricing', label: 'الباقات والأسعار', Icon: Zap },
];

export default function SubpageSidebarShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname() || '';
  const [desktopOpen, setDesktopOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [recentSessions, setRecentSessions] = useState<StoredSession[]>([]);

  useEffect(() => {
    try {
      const raw =
        localStorage.getItem('skanybot_sessions') ||
        localStorage.getItem('aqar_ai_sessions');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setRecentSessions(parsed.slice(0, 5));
        }
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(href + '/');
  };

  const SidebarInner = ({ onCloseMobile }: { onCloseMobile?: () => void }) => (
    <div className="flex flex-col h-full bg-zinc-950 border-l border-zinc-800/80 text-zinc-100 select-none">
      {/* Brand + Collapse */}
      <div className="p-4 border-b border-zinc-800/80 flex items-center justify-between gap-2">
        <Link
          href="/"
          onClick={onCloseMobile}
          className="flex items-center gap-2.5 min-w-0"
        >
          <div className="h-9 w-9 rounded-xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
            🏠
          </div>
          <div className="min-w-0">
            <div className="font-black text-sm text-white truncate">
              إيوان بوت <span className="text-amber-400">Ewanbot</span>
            </div>
            <div className="text-[10px] text-zinc-400 truncate">
              مستشارك العقاري الذكي
            </div>
          </div>
        </Link>

        {onCloseMobile ? (
          <button
            type="button"
            onClick={onCloseMobile}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
            title="إغلاق القائمة"
          >
            <X className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setDesktopOpen(false)}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
            title="إخفاء الشريط الجانبي"
          >
            <PanelRightClose className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* New Chat Button */}
      <div className="p-3">
        <Link
          href="/"
          onClick={onCloseMobile}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs py-2.5 px-3 shadow-md shadow-amber-500/15 transition"
        >
          <Plus className="h-4 w-4" />
          <span>محادثة جديدة مع الشات بوت</span>
        </Link>
      </div>

      {/* Navigation Links */}
      <div className="px-3 py-1 flex-1 overflow-y-auto space-y-5">
        <div>
          <div className="px-2 mb-2 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
            صفحات وأدوات المنصة
          </div>
          <nav className="space-y-1">
            {NAV_ITEMS.map(({ href, label, Icon }) => {
              const active = isActive(href);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={onCloseMobile}
                  className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold transition ${
                    active
                      ? 'bg-amber-500/15 text-amber-300 border border-amber-500/35'
                      : 'text-zinc-300 hover:bg-zinc-900 hover:text-white border border-transparent'
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 shrink-0 ${
                      active ? 'text-amber-400' : 'text-zinc-400'
                    }`}
                  />
                  <span className="truncate">{label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Recent Chats */}
        {recentSessions.length > 0 && (
          <div>
            <div className="px-2 mb-2 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
              آخر محادثاتك
            </div>
            <div className="space-y-1">
              {recentSessions.map((s) => (
                <Link
                  key={s.id}
                  href="/"
                  onClick={onCloseMobile}
                  className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200 transition"
                >
                  <MessageSquare className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
                  <span className="truncate">{s.title || 'محادثة عقارية'}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-zinc-800/80 text-[11px] text-zinc-500 text-center">
        Ewanbot AI • السوق العقاري المصري 2026
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-100" dir="rtl">
      {/* Desktop Sidebar */}
      {desktopOpen && (
        <aside className="hidden lg:block w-72 shrink-0 sticky top-0 h-screen z-40 print:hidden">
          <SidebarInner />
        </aside>
      )}

      {/* Desktop Re-open Toggle */}
      {!desktopOpen && (
        <button
          type="button"
          onClick={() => setDesktopOpen(true)}
          className="hidden lg:inline-flex fixed bottom-5 right-5 z-50 items-center gap-1.5 rounded-full bg-zinc-900/95 border border-amber-500/40 px-3.5 py-2 text-xs font-bold text-amber-300 shadow-lg hover:bg-zinc-800 transition cursor-pointer print:hidden"
          title="إظهار الشريط الجانبي"
        >
          <PanelRightOpen className="h-4 w-4" />
          <span>القائمة</span>
        </button>
      )}

      {/* Mobile Floating Drawer Toggle */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed bottom-5 right-5 z-50 inline-flex items-center gap-1.5 rounded-full bg-amber-500 text-black px-3.5 py-2.5 text-xs font-black shadow-xl hover:bg-amber-400 transition cursor-pointer print:hidden"
        title="فتح القائمة الجانبية"
      >
        <Menu className="h-4 w-4" />
        <span>القائمة</span>
      </button>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex print:hidden">
          <div className="w-72 max-w-[85vw] h-full shadow-2xl">
            <SidebarInner onCloseMobile={() => setMobileOpen(false)} />
          </div>
          <div
            className="flex-1 bg-black/60 backdrop-blur-xs"
            onClick={() => setMobileOpen(false)}
          />
        </div>
      )}

      {/* Main Page Content */}
      <div className="flex-1 min-w-0 flex flex-col">{children}</div>
    </div>
  );
}
