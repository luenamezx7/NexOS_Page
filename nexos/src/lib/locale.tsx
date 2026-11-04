'use client';

import { createContext, useContext, useEffect, useSyncExternalStore, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { en } from './translations-en';
import { es } from './translations-es';

export type Locale = 'pt' | 'en' | 'es';
type Translation = (text: string) => string;
const LocaleContext = createContext<{ locale: Locale; setLocale: (locale: Locale) => void; t: Translation }>({
  locale: 'pt', setLocale: () => {}, t: text => text,
});
const STORAGE_KEY = 'easyway-language';
const CHANGE_EVENT = 'easyway-language-change';
export const publicTranslationPaths = new Set(['/', '/criacao-de-sites', '/landing-pages', '/cardapio-digital', '/placa-nfc']);
const storedLocale = (): Locale => {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === 'en' || value === 'es' ? value : 'pt';
  }
  catch { return 'pt'; }
};
const serverLocale = (): Locale => 'pt';
const subscribe = (notify: () => void) => {
  const onStorage = (event: StorageEvent) => { if (event.key === STORAGE_KEY || event.key === null) notify(); };
  window.addEventListener('storage', onStorage);
  window.addEventListener(CHANGE_EVENT, notify);
  return () => { window.removeEventListener('storage', onStorage); window.removeEventListener(CHANGE_EVENT, notify); };
};

export function LocaleProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const locale = useSyncExternalStore(subscribe, storedLocale, serverLocale);
  const activeLocale = publicTranslationPaths.has(pathname) ? locale : 'pt';
  useEffect(() => {
    document.documentElement.lang = activeLocale === 'pt' ? 'pt-BR' : activeLocale;
  }, [activeLocale]);
  const changeLocale = (value: Locale) => {
    try { localStorage.setItem(STORAGE_KEY, value); } catch { /* Storage can be disabled. */ }
    window.dispatchEvent(new Event(CHANGE_EVENT));
  };
  const t: Translation = text => activeLocale === 'en' ? en[text] ?? text : activeLocale === 'es' ? es[text] ?? text : text;
  return <LocaleContext.Provider value={{ locale: activeLocale, setLocale: changeLocale, t }}>{children}</LocaleContext.Provider>;
}

export function useLocale() { return useContext(LocaleContext); }
