'use client';

import React from 'react';
import Link from 'next/navigation';
import { UserRole } from '@/lib/types';
import { Locale, translations } from '@/lib/i18n';
import { 
  Factory, 
  Tv, 
  CreditCard, 
  Globe, 
  UserCheck, 
  ShieldAlert, 
  SlidersHorizontal,
  Wrench,
  Cpu
} from 'lucide-react';

interface NavbarProps {
  locale: Locale;
  setLocale: (loc: Locale) => void;
  activeRole: UserRole;
  setActiveRole: (role: UserRole) => void;
  activeMachineId?: string;
  onSelectMachine?: (id: string) => void;
  machines?: Array<{ id: string; name: string; code: string; current_status: string }>;
}

export default function Navbar({
  locale,
  setLocale,
  activeRole,
  setActiveRole,
  activeMachineId,
  onSelectMachine,
  machines = [],
}: NavbarProps) {
  const t = translations[locale];

  return (
    <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-white shadow-xl">
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-600 to-red-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
            <Factory className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-amber-300 bg-clip-text text-transparent">
                {t.brand}
              </span>
              <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                PWA Ready
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block truncate max-w-xs">
              {t.tagline}
            </p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
          <a
            href="/"
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
          >
            <Cpu className="w-4 h-4 text-amber-400" />
            <span>{t.nav.chat}</span>
          </a>

          <a
            href="/tv-board"
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
          >
            <Tv className="w-4 h-4 text-cyan-400" />
            <span>{t.nav.andon_tv}</span>
          </a>

          <a
            href="/pricing"
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
          >
            <CreditCard className="w-4 h-4 text-emerald-400" />
            <span>{t.nav.pricing}</span>
          </a>
        </nav>

        {/* Right Controls: Role Selector & Language Toggle */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-2 md:pt-0 border-slate-800">
          {/* Role selector dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-800/90 px-2 py-1 rounded-lg border border-slate-700 text-xs">
            <UserCheck className="w-3.5 h-3.5 text-amber-400" />
            <select
              value={activeRole}
              onChange={(e) => setActiveRole(e.target.value as UserRole)}
              className="bg-transparent text-slate-200 font-medium focus:outline-none cursor-pointer"
            >
              <option value="operator" className="bg-slate-900 text-white">
                {t.roles.operator}
              </option>
              <option value="supervisor" className="bg-slate-900 text-white">
                {t.roles.supervisor}
              </option>
              <option value="maintenance" className="bg-slate-900 text-white">
                {t.roles.maintenance}
              </option>
              <option value="admin" className="bg-slate-900 text-white">
                {t.roles.admin}
              </option>
            </select>
          </div>

          {/* Language Switcher */}
          <button
            onClick={() => setLocale(locale === 'ar' ? 'en' : 'ar')}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold transition"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{locale === 'ar' ? 'English' : 'العربية'}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
