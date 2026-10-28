'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Locale, translations } from '@/lib/i18n';

interface LanguageContextType {
  locale: Locale;
  setLocale: (loc: Locale) => void;
  toggleLocale: () => void;
  t: typeof translations.ar;
  dir: 'rtl' | 'ltr';
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('ar');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('wrdya_locale') as Locale | null;
      if (saved === 'ar' || saved === 'en') {
        setLocaleState(saved);
        applyLocale(saved);
      } else {
        applyLocale('ar');
      }
    } catch {
      applyLocale('ar');
    }
  }, []);

  const applyLocale = (loc: Locale) => {
    const root = document.documentElement;
    root.setAttribute('lang', loc);
    root.setAttribute('dir', loc === 'ar' ? 'rtl' : 'ltr');
    if (loc === 'ar') {
      root.classList.remove('ltr');
      root.classList.add('rtl');
    } else {
      root.classList.remove('rtl');
      root.classList.add('ltr');
    }
  };

  const setLocale = (loc: Locale) => {
    setLocaleState(loc);
    try {
      localStorage.setItem('wrdya_locale', loc);
    } catch {}
    applyLocale(loc);
  };

  const toggleLocale = () => {
    setLocale(locale === 'ar' ? 'en' : 'ar');
  };

  const t = translations[locale] || translations.ar;
  const dir = locale === 'ar' ? 'rtl' : 'ltr';

  return (
    <LanguageContext.Provider value={{ locale, setLocale, toggleLocale, t, dir }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}
