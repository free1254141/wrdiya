'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth, DEMO_PROFILES } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { UserRole } from '@/lib/types';
import { Locale, translations } from '@/lib/i18n';
import { 
  Factory, 
  Tv, 
  CreditCard, 
  Globe, 
  LogOut, 
  LogIn, 
  ChevronDown, 
  Clock, 
  Sun, 
  Moon,
  Sparkles
} from 'lucide-react';

interface NavbarProps {
  locale?: Locale;
  setLocale?: (loc: Locale) => void;
}

export default function Navbar({ locale: propLocale, setLocale: propSetLocale }: NavbarProps = {}) {
  const router = useRouter();
  const { user, factory, activeRole, setActiveRole, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { locale: ctxLocale, setLocale: ctxSetLocale } = useLanguage();
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);

  const locale = propLocale || ctxLocale;
  const setLocale = propSetLocale || ctxSetLocale;

  const t = translations[locale];

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'operator':
        return { label: locale === 'ar' ? '👷 عامل تشغيل' : '👷 Operator', color: 'border-amber-400/50 bg-amber-500/15 text-amber-400' };
      case 'supervisor':
        return { label: locale === 'ar' ? '📋 مشرف وردية' : '📋 Supervisor', color: 'border-blue-400/50 bg-blue-500/15 text-blue-400' };
      case 'maintenance':
        return { label: locale === 'ar' ? '🛠️ فني صيانة' : '🛠️ Maintenance', color: 'border-emerald-400/50 bg-emerald-500/15 text-emerald-400' };
      case 'admin':
        return { label: locale === 'ar' ? '👔 مدير المصنع' : '👔 Manager', color: 'border-purple-400/50 bg-purple-500/15 text-purple-400' };
      default:
        return { label: 'مسؤول', color: 'border-zinc-500 bg-zinc-800 text-zinc-300' };
    }
  };

  const activeBadge = getRoleBadge(activeRole);

  return (
    <header className="sticky top-0 z-40 bg-[#0a0e17]/95 backdrop-blur-md border-b border-zinc-800 text-white shadow-xl">
      {/* 
        We use an explicit container where Brand stays on the right and controls stay on the left 
        without jumping or flipping places when toggling language (خلى الهيدر مايقلبش الايكونات ثابته مكانها)
      */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-3 flex-row-reverse">
        
        {/* Brand & Factory Status - Firmly Anchored on Right */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="wrdya-brand-mark w-10 h-10 shrink-0">
              <div className="wrdya-brand-mark__core">
                <Factory className="w-5 h-5 text-amber-400 group-hover:scale-110 transition duration-200" />
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2">
                <span className="font-black text-lg tracking-tight text-white flex items-center gap-1.5">
                  وردية <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">Wrdya AI</span>
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 pulse-emerald" />
                  {factory?.name ? factory.name : (locale === 'ar' ? 'المصنع نشط' : 'Active Plant')}
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 hidden md:block">
                {factory?.industry ? factory.industry : (locale === 'ar' ? 'تتبع أوقات التوقف • تسليم الورديات • مؤشرات OEE' : 'Downtime Tracking • Shift Handover • OEE')}
              </p>
            </div>
          </Link>
        </div>

        {/* Current Active Shift Pill - Centered on Large Screens */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs">
          <Clock className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-zinc-400">{locale === 'ar' ? 'الوردية الحالية:' : 'Current Shift:'}</span>
          <span className="font-bold text-zinc-200">{locale === 'ar' ? 'الصباحية (07:00 - 15:00)' : 'Morning (07:00 - 15:00)'}</span>
          <span className="text-emerald-400 font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-[10px]">
            OEE 78.4%
          </span>
        </div>

        {/* Fixed Controls - Firmly Anchored on Left */}
        <div className="flex items-center gap-2 sm:gap-3 flex-row">
          
          {/* Light / Dark Mode Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-amber-400 border border-zinc-800 transition"
            title={theme === 'dark' ? (locale === 'ar' ? 'التحويل للوضع الفاتح (Light Mode)' : 'Switch to Light Mode') : (locale === 'ar' ? 'التحويل للوضع الداكن (Dark Mode)' : 'Switch to Dark Mode')}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4 text-zinc-200" />}
          </button>

          {/* Language Switcher */}
          <button
            type="button"
            onClick={() => setLocale(locale === 'ar' ? 'en' : 'ar')}
            className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 font-bold transition"
            title={locale === 'ar' ? 'Switch language to English' : 'التحويل للغة العربية'}
          >
            <Globe className="w-3.5 h-3.5 text-cyan-400" />
            <span>{locale === 'ar' ? 'EN' : 'عربي'}</span>
          </button>

          {/* TV Andon Board Link */}
          <Link
            href="/tv-board"
            className="hidden sm:flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 transition"
            title={locale === 'ar' ? 'فتح شاشة المصنع التلفزيونية' : 'Open Andon TV Board'}
          >
            <Tv className="w-3.5 h-3.5 text-cyan-400" />
            <span>{locale === 'ar' ? 'شاشة الآندون (TV)' : 'Andon TV'}</span>
          </Link>

          {/* Pricing Link */}
          <Link
            href="/pricing"
            className="hidden sm:flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 transition"
          >
            <CreditCard className="w-3.5 h-3.5 text-amber-400" />
            <span>{locale === 'ar' ? 'الباقات' : 'Pricing'}</span>
          </Link>

          {/* User Account / Role Controller */}
          {user ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setRoleMenuOpen(!roleMenuOpen)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-zinc-900 border border-zinc-700 hover:border-amber-400 transition"
              >
                <div className="w-7 h-7 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-sm">
                  {user.avatar || '👤'}
                </div>
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-bold text-white flex items-center gap-1">
                    <span>{user.name}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded border font-semibold ${activeBadge.color}`}>
                      {user.role === 'admin' ? 'مدير' : user.role === 'maintenance' ? 'صيانة' : user.role === 'supervisor' ? 'مشرف' : 'تشغيل'}
                    </span>
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
              </button>

              {/* Role & Account Dropdown Menu */}
              {roleMenuOpen && (
                <div className="absolute left-0 mt-2 w-64 rounded-xl neobrutal-card bg-[#0d121c] border-2 border-zinc-700 p-2 text-right shadow-2xl z-50 animate-in fade-in zoom-in-95">
                  <div className="p-2 border-b border-zinc-800 mb-2">
                    <p className="text-xs font-bold text-white">{user.name}</p>
                    <p className="text-[11px] text-zinc-400">{user.email}</p>
                    <p className="text-[10px] text-zinc-500 mt-1">{user.department}</p>
                  </div>

                  <p className="text-[11px] font-bold text-amber-400 px-2 mb-1.5 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    {locale === 'ar' ? 'تبديل الصلاحية للمعاينة الفورية:' : 'Switch Role Demo:'}
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
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition ${
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

                  <div className="border-t border-zinc-800 mt-2 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setRoleMenuOpen(false);
                        handleSignOut();
                      }}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold transition"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>{locale === 'ar' ? 'تسجيل الخروج' : 'Sign Out'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="neobrutal-btn px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs flex items-center gap-1.5 transition"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>{locale === 'ar' ? 'تسجيل الدخول' : 'Sign In'}</span>
            </Link>
          )}

        </div>

      </div>
    </header>
  );
}
