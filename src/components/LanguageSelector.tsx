'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Locale } from '@/lib/i18n';
import { Globe, Check, ChevronDown } from 'lucide-react';

export default function LanguageSelector() {
  const { locale, setLocale, languages, currentLanguage, isRtl } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (code: Locale) => {
    setLocale(code);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 sm:gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-2 sm:px-2.5 py-1.5 text-xs font-bold text-slate-700 shadow-xs transition hover:bg-slate-100 hover:text-black dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
        title="Change Language"
        aria-expanded={isOpen}
      >
        <span className="text-sm leading-none">{currentLanguage.flag}</span>
        <span className="hidden sm:inline text-[11px] font-bold">{currentLanguage.nativeName}</span>
        <ChevronDown className={`h-3 w-3 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div
          className={`absolute top-full mt-2 w-52 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl backdrop-blur-md z-50 dark:border-zinc-800 dark:bg-zinc-950 ${
            isRtl ? 'left-0' : 'right-0'
          }`}
        >
          <div className="px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500">
            {isRtl ? 'اختر لغة العقارات المفضلة' : 'Select Preferred Language'}
          </div>

          <div className="flex flex-col gap-0.5">
            {languages.map((lang) => {
              const isActive = lang.code === locale;
              return (
                <button
                  key={lang.code}
                  onClick={() => handleSelect(lang.code)}
                  className={`flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-xs transition ${
                    isActive
                      ? 'bg-amber-500/10 font-bold text-amber-600 dark:bg-amber-500/15 dark:text-amber-400'
                      : 'text-slate-700 hover:bg-slate-100 dark:text-zinc-300 dark:hover:bg-zinc-900'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">{lang.flag}</span>
                    <div className="text-left rtl:text-right">
                      <div className="font-semibold">{lang.nativeName}</div>
                      <div className="text-[10px] text-slate-400 dark:text-zinc-500">{lang.country}</div>
                    </div>
                  </div>

                  {isActive && <Check className="h-4 w-4 text-amber-500 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
