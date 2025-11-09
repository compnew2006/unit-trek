import React, { createContext, useState, useEffect, ReactNode } from 'react';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { STORAGE_KEYS } from '../constants';

import enTranslations from '../translations/en.json';
import arTranslations from '../translations/ar.json';

// Initialize i18n
i18n.use(initReactI18next).init({
  resources: {
    en: { translation: enTranslations },
    ar: { translation: arTranslations },
  },
  lng: localStorage.getItem(STORAGE_KEYS.LOCALE) || 'en',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

interface LocaleContextType {
  locale: string;
  setLocale: (locale: string) => void;
  t: (key: string) => string;
  dir: 'ltr' | 'rtl';
}

export const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

export const LocaleProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState(localStorage.getItem(STORAGE_KEYS.LOCALE) || 'en');

  const setLocale = (newLocale: string) => {
    setLocaleState(newLocale);
    i18n.changeLanguage(newLocale);
    localStorage.setItem(STORAGE_KEYS.LOCALE, newLocale);
    document.documentElement.setAttribute('dir', newLocale === 'ar' ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', newLocale);
  };

  const t = (key: string): string => {
    return i18n.t(key);
  };

  useEffect(() => {
    document.documentElement.setAttribute('dir', locale === 'ar' ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', locale);
  }, [locale]);

  return (
    <LocaleContext.Provider
      value={{
        locale,
        setLocale,
        t,
        dir: locale === 'ar' ? 'rtl' : 'ltr',
      }}
    >
      {children}
    </LocaleContext.Provider>
  );
};
