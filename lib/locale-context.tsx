'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import en, { Translations } from '@/messages/en';
import ar from '@/messages/ar';

type Locale = 'en' | 'ar';

const MESSAGES: Record<Locale, Translations> = { en, ar };
const STORAGE_KEY = 'instaoffer_locale';

interface LocaleContextType {
  locale: Locale;
  t: Translations;
  setLocale: (l: Locale) => void;
  isRTL: boolean;
}

const LocaleContext = createContext<LocaleContextType>({
  locale: 'en',
  t: en,
  setLocale: () => {},
  isRTL: false,
});

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');

  // Hydrate from localStorage
  useEffect(() => {
    const saved = (typeof localStorage !== 'undefined' && localStorage.getItem(STORAGE_KEY)) as Locale | null;
    if (saved === 'ar' || saved === 'en') setLocaleState(saved);
  }, []);

  // Apply dir + lang to <html>
  useEffect(() => {
    const html = document.documentElement;
    html.lang = locale;
    html.dir  = locale === 'ar' ? 'rtl' : 'ltr';
  }, [locale]);

  function setLocale(l: Locale) {
    setLocaleState(l);
    localStorage.setItem(STORAGE_KEY, l);
  }

  return (
    <LocaleContext.Provider value={{ locale, t: MESSAGES[locale], setLocale, isRTL: locale === 'ar' }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  return useContext(LocaleContext);
}
