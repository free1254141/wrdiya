'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Locale } from '@/lib/i18n';
import { Check, ChevronUp } from 'lucide-react';

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
      {/* Dropdown Menu - Opens UPWARDS so it never falls off the screen */}
      {isOpen && (
        <div
          className="absolute bottom-full mb-2 w-56 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl backdrop-blur-md z-50 dark:border-zinc-800 dark:bg-zinc-950 right-0 max-h-72 overflow-y-auto"
          dir={isRtl ? 'rtl' : 'ltr'}
        >
          <div className="px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500">
            {isRtl ? 'اختر لغة التطبيق' : 'Select Language'}
          </div>

          <div className="flex flex-col gap-1">
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
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg leading-none">{lang.flag}</span>
                    <div className="text-right rtl:text-right ltr:text-left">
                      <div className="font-semibold text-xs">{lang.nativeName}</div>
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

      {/* Trigger Button in Sidebar Footer */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-100 hover:text-black dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
        title={isRtl ? 'تغيير اللغة' : 'Change Language'}
        aria-expanded={isOpen}
      >
        <span className="text-base leading-none">{currentLanguage.flag}</span>
        <span className="text-xs font-bold">{currentLanguage.nativeName}</span>
        <ChevronUp className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
    </div>
  );
}
