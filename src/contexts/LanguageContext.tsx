'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Locale, translations, SUPPORTED_LANGUAGES, LanguageMeta } from '@/lib/i18n';

interface LanguageContextType {
  locale: Locale;
  setLocale: (loc: Locale) => void;
  toggleLocale: () => void;
  t: typeof translations.ar;
  dir: 'rtl' | 'ltr';
  isRtl: boolean;
  languages: LanguageMeta[];
  currentLanguage: LanguageMeta;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('ar');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('aqar_locale') as Locale | null;
      const valid = SUPPORTED_LANGUAGES.some(l => l.code === saved);
      if (saved && valid) {
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
    const isRtl = loc === 'ar';
    const direction = isRtl ? 'rtl' : 'ltr';

    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      root.setAttribute('lang', loc);
      root.setAttribute('dir', direction);

      if (isRtl) {
        root.classList.remove('ltr');
        root.classList.add('rtl');
      } else {
        root.classList.remove('rtl');
        root.classList.add('ltr');
      }

      if (document.body) {
        document.body.setAttribute('dir', direction);
        if (isRtl) {
          document.body.classList.remove('ltr');
          document.body.classList.add('rtl');
        } else {
          document.body.classList.remove('rtl');
          document.body.classList.add('ltr');
        }
      }
    }
  };

  const setLocale = (loc: Locale) => {
    setLocaleState(loc);
    try {
      localStorage.setItem('aqar_locale', loc);
    } catch {}
    applyLocale(loc);
  };

  const toggleLocale = () => {
    // Quick toggle between primary two, or cycle
    setLocale(locale === 'ar' ? 'en' : 'ar');
  };

  const t = translations[locale] || translations.ar;
  const isRtl = locale === 'ar';
  const dir = isRtl ? 'rtl' : 'ltr';
  const currentLanguage = SUPPORTED_LANGUAGES.find(l => l.code === locale) || SUPPORTED_LANGUAGES[0];

  return (
    <LanguageContext.Provider value={{
      locale,
      setLocale,
      toggleLocale,
      t,
      dir,
      isRtl,
      languages: SUPPORTED_LANGUAGES,
      currentLanguage
    }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
