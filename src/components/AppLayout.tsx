'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth, DEMO_PROFILES } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { UserRole } from '@/lib/types';
import { 
  Factory, 
  LayoutDashboard, 
  Users, 
  Cpu, 
  PackageCheck, 
  BarChart3, 
  Tv, 
  Bot, 
  Settings, 
  CreditCard,
  LogOut, 
  Sun, 
  Moon, 
  Globe, 
  Clock, 
  Menu, 
  X, 
  ChevronDown, 
  Sparkles, 
  Bell, 
  Search, 
  ChevronRight,
  AlertTriangle,
  Building2,
  Sliders,
  ExternalLink
} from 'lucide-react';

interface AppLayoutProps {
  children: React.ReactNode;
  pageTitle?: string;
  pageSubtitle?: string;
  actionButton?: React.ReactNode;
}

export default function AppLayout({
  children,
  pageTitle,
  pageSubtitle,
  actionButton,
}: AppLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, factory, activeRole, setActiveRole, signOut } = useAuth();
  const { locale, toggleLocale } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  const isAr = locale === 'ar';
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const navItems = [
    {
      name: isAr ? 'صالة الإنتاج الرئيسية' : 'Floor Overview',
      href: '/',
      icon: LayoutDashboard,
      badge: 'Live',
      badgeColor: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    },
    {
      name: isAr ? 'إدارة الورديات وتسكين العمال' : 'Shift Roster & Staff',
      href: '/roster',
      icon: Users,
    },
    {
      name: isAr ? 'الماكينات وبلاغات الأعطال' : 'Machines & Andon',
      href: '/machines',
      icon: Cpu,
      badge: '1 Down',
      badgeColor: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
    },
    {
      name: isAr ? 'تسجيل الإنتاج وتتبع الجودة' : 'Production & Quality',
      href: '/production',
      icon: PackageCheck,
    },
    {
      name: isAr ? 'تحليلات OEE والتقارير' : 'OEE Analytics',
      href: '/analytics',
      icon: BarChart3,
    },
    {
      name: isAr ? 'محطة مساعد وردية الذكي' : 'AI Industrial Copilot',
      href: '/copilot',
      icon: Bot,
      badge: 'AI',
      badgeColor: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    },
    {
      name: isAr ? 'شاشة البث الصناعي (TV)' : 'Andon TV Board',
      href: '/tv-board',
      icon: Tv,
      target: '_blank',
    },
    {
      name: isAr ? 'إعدادات المنشأة والخطوط' : 'Plant Settings',
      href: '/settings',
      icon: Settings,
    },
  ];

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'operator':
        return { label: isAr ? '👷 فني تشغيل' : '👷 Operator', color: 'border-amber-400/40 bg-amber-500/15 text-amber-400' };
      case 'supervisor':
        return { label: isAr ? '📋 مشرف وردية' : '📋 Supervisor', color: 'border-blue-400/40 bg-blue-500/15 text-blue-400' };
      case 'maintenance':
        return { label: isAr ? '🛠️ فني صيانة' : '🛠️ Maintenance', color: 'border-emerald-400/40 bg-emerald-500/15 text-emerald-400' };
      case 'admin':
        return { label: isAr ? '👔 مدير المصنع' : '👔 Plant GM', color: 'border-purple-400/40 bg-purple-500/15 text-purple-400' };
      default:
        return { label: isAr ? 'مسؤول' : 'Staff', color: 'border-zinc-500 bg-zinc-800 text-zinc-300' };
    }
  };

  const activeBadge = getRoleBadge(activeRole);

  return (
    <div className={`min-h-screen bg-[#07090e] text-zinc-100 flex flex-col font-sans ${isAr ? 'rtl' : 'ltr'}`} dir={isAr ? 'rtl' : 'ltr'}>
      
      {/* ============================================================== */}
      {/* 1. TOP GLOBAL APP BAR */}
      {/* ============================================================== */}
      <header className="sticky top-0 z-40 bg-[#0a0e17]/95 backdrop-blur-md border-b border-zinc-800 px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3 shadow-md">
        
        {/* Left: Mobile hamburger & Brand */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-300 hover:text-white"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="wrdya-brand-mark w-9 h-9 shrink-0">
              <div className="wrdya-brand-mark__core">
                <Factory className="w-5 h-5 text-amber-400 group-hover:scale-105 transition" />
              </div>
            </div>
            <div className="hidden sm:block">
              <div className="flex items-center gap-1.5">
                <span className="font-black text-base text-white tracking-tight">وردية</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  Wrdya AI
                </span>
              </div>
              <p className="text-[10px] text-zinc-400 truncate max-w-[180px]">
                {factory?.name || (isAr ? 'مصنع النيل للبلاستيك' : 'Nile Polymer Plant')}
              </p>
            </div>
          </Link>
        </div>

        {/* Center: Shift & Floor Status Telemetry Pill */}
        <div className="hidden md:flex items-center gap-3 px-3.5 py-1.5 rounded-full bg-zinc-900/90 border border-zinc-800 text-xs">
          <div className="flex items-center gap-1.5 text-zinc-300 font-medium">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>{isAr ? 'الوردية الصباحية' : 'Morning Shift'}</span>
            <span className="text-zinc-500 font-mono text-[11px]">(07:00 - 15:00)</span>
          </div>

          <span className="w-1 h-3 bg-zinc-700 rounded-full" />

          <div className="flex items-center gap-2 text-[11px]">
            <span className="flex items-center gap-1 text-emerald-400 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 pulse-emerald" />
              {isAr ? '3 تعمل' : '3 Running'}
            </span>
            <span className="flex items-center gap-1 text-rose-400 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
              {isAr ? '1 متوقفة' : '1 Down'}
            </span>
            <span className="px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
              OEE 78.4%
            </span>
          </div>
        </div>

        {/* Right: Actions, Theme, Language & User Role Dropdown */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          
          {/* Light / Dark Mode Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-amber-400 border border-zinc-800 transition cursor-pointer"
            title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4 text-zinc-200" />}
          </button>

          {/* Language Switcher */}
          <button
            type="button"
            onClick={toggleLocale}
            className="flex items-center gap-1 text-xs px-2.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 font-bold transition cursor-pointer"
            title={isAr ? 'English' : 'العربية'}
          >
            <Globe className="w-3.5 h-3.5 text-cyan-400" />
            <span>{isAr ? 'EN' : 'عربي'}</span>
          </button>

          {/* Pricing Link */}
          <Link
            href="/pricing"
            className="hidden sm:flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-amber-400 border border-zinc-800 font-bold transition"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>{isAr ? 'الباقات' : 'Pricing'}</span>
          </Link>

          {/* User & Role Switcher Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setRoleMenuOpen(!roleMenuOpen)}
              className="flex items-center gap-2 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-zinc-900 border border-zinc-700 hover:border-amber-400 transition cursor-pointer"
            >
              <div className="w-7 h-7 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-sm">
                {user?.avatar || '👤'}
              </div>
              <div className="text-right hidden sm:block">
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span className="truncate max-w-[90px]">{user?.name || (isAr ? 'المستخدم' : 'User')}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded border font-semibold ${activeBadge.color}`}>
                    {activeBadge.label.split(' ')[1]}
                  </span>
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
            </button>

            {/* Dropdown Menu */}
            {roleMenuOpen && (
              <div className="absolute left-0 rtl:right-auto rtl:left-0 mt-2 w-64 rounded-xl bg-[#0d121c] border-2 border-zinc-700 p-2 text-right shadow-2xl z-50 animate-in fade-in zoom-in-95">
                <div className="p-2 border-b border-zinc-800 mb-2">
                  <p className="text-xs font-bold text-white">{user?.name}</p>
                  <p className="text-[11px] text-zinc-400">{user?.email}</p>
                  <p className="text-[10px] text-amber-400 mt-1 font-mono">{factory?.name}</p>
                </div>

                <p className="text-[11px] font-bold text-amber-400 px-2 mb-1.5 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  {isAr ? 'تبديل الصلاحية للمعاينة السريعة:' : 'Quick Role Switch (Demo):'}
                </p>

                <div className="space-y-1">
                  {(['operator', 'supervisor', 'maintenance', 'admin'] as UserRole[]).map((r) => {
                    const profile = DEMO_PROFILES[r];
                    const isCurrent = activeRole === r;
                    return (
                      <button
                        key={r}
                        type="button"
                        onClick={() => {
                          setActiveRole(r);
                          setRoleMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                          isCurrent
                            ? 'bg-amber-500 text-black'
                            : 'text-zinc-300 hover:bg-zinc-800 hover:text-white'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span>{profile.avatar}</span>
                          <span>{profile.name}</span>
                        </span>
                        <span className="text-[10px] opacity-75">
                          {r === 'admin' ? 'إدارة' : r === 'maintenance' ? 'صيانة' : r === 'supervisor' ? 'إشراف' : 'تشغيل'}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="border-t border-zinc-800 mt-2 pt-2 space-y-1">
                  <Link
                    href="/settings"
                    onClick={() => setRoleMenuOpen(false)}
                    className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white transition"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    <span>{isAr ? 'إعدادات المنشأة' : 'Plant Settings'}</span>
                  </Link>

                  <button
                    type="button"
                    onClick={() => {
                      setRoleMenuOpen(false);
                      handleSignOut();
                    }}
                    className="w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold transition cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>{isAr ? 'تسجيل الخروج' : 'Sign Out'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>

      </header>

      {/* ============================================================== */}
      {/* 2. BODY LAYOUT: SIDEBAR + MAIN CONTENT */}
      {/* ============================================================== */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        
        {/* ============================================================ */}
        {/* SIDEBAR NAVIGATION (Desktop Persistent, Mobile Drawer) */}
        {/* ============================================================ */}
        <aside
          className={`fixed lg:sticky top-0 lg:top-[57px] h-screen lg:h-[calc(100vh-57px)] w-64 bg-[#0a0e17] lg:bg-transparent border-r rtl:border-r-0 rtl:border-l border-zinc-800 p-4 flex flex-col justify-between z-50 transition-transform duration-300 ${
            mobileMenuOpen 
              ? 'translate-x-0' 
              : isAr 
                ? 'translate-x-full lg:translate-x-0' 
                : '-translate-x-full lg:translate-x-0'
          }`}
        >
          {/* Top Section */}
          <div className="space-y-6">
            {/* Mobile close button */}
            <div className="lg:hidden flex items-center justify-between pb-3 border-b border-zinc-800">
              <span className="font-bold text-sm text-white">
                {isAr ? 'أدوات منصة وردية' : 'Wrdya Tools'}
              </span>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Specialized Tools Navigation List */}
            <nav className="space-y-1.5">
              <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                {isAr ? 'الأدوات المتخصصة للمصنع' : 'Dedicated Plant Tools'}
              </div>

              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    target={item.target}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition group ${
                      isActive
                        ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                        : 'text-zinc-300 hover:bg-zinc-900 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-black' : 'text-amber-400 group-hover:scale-110 transition'}`} />
                      <span>{item.name}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {item.badge && (
                        <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded border font-semibold ${
                          isActive ? 'bg-black/20 text-black border-black/30' : item.badgeColor
                        }`}>
                          {item.badge}
                        </span>
                      )}
                      {item.target === '_blank' && (
                        <ExternalLink className="w-3 h-3 opacity-60" />
                      )}
                    </div>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Bottom Sidebar Card: Plant Profile Info */}
          <div className="pt-4 border-t border-zinc-800/80 space-y-3">
            <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs">
              <div className="flex items-center justify-between text-zinc-400 text-[10px] font-mono mb-1">
                <span>{isAr ? 'كود المصنع:' : 'Plant Code:'}</span>
                <span className="text-amber-400 font-bold">{factory?.code || 'WRD-EG-742'}</span>
              </div>
              <p className="font-bold text-white text-xs truncate">
                {factory?.name || (isAr ? 'مصنع النيل للصناعات' : 'Nile Industrial Plant')}
              </p>
              <div className="flex items-center gap-2 text-[10px] text-zinc-400 mt-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>{factory?.shiftModel === '2_shifts_12h' ? '2 وردية × 12 س' : '3 ورديات × 8 س'}</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-zinc-500 px-1">
              <span>Wrdya AI OS v3.0</span>
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 pulse-emerald" />
                {isAr ? 'متصل' : 'Connected'}
              </span>
            </div>
          </div>
        </aside>

        {/* Mobile backdrop */}
        {mobileMenuOpen && (
          <div
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          />
        )}

        {/* ============================================================ */}
        {/* MAIN CONTENT WORKSPACE */}
        {/* ============================================================ */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">
          
          {/* Page Heading Bar */}
          {(pageTitle || actionButton) && (
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800/80">
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                  <span>{pageTitle}</span>
                </h1>
                {pageSubtitle && (
                  <p className="text-xs sm:text-sm text-zinc-400 mt-1">
                    {pageSubtitle}
                  </p>
                )}
              </div>

              {actionButton && (
                <div className="shrink-0 flex items-center gap-2">
                  {actionButton}
                </div>
              )}
            </div>
          )}

          {/* Children View Content */}
          {children}

        </main>

      </div>
    </div>
  );
}
