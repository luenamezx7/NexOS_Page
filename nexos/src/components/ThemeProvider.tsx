'use client';

/**
 * Provider de tema — gerencia modo claro/escuro.
 * Default: preferência do sistema. Persiste em localStorage (nexos-theme).
 * Sincroniza entre abas via evento customizado.
 * Adiciona/remove classe .dark no <html>.
 */
import { createContext, useCallback, useContext, useEffect, useSyncExternalStore, type ReactNode } from 'react';

export type Theme = 'dark' | 'light';

interface ThemeContextValue {
  theme: Theme;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'dark',
  toggle: () => undefined,
});

const STORAGE_KEY = 'nexos-theme';

function applyTheme(theme: Theme): void {
  const root: HTMLElement = document.documentElement;
  root.classList.toggle('dark', theme === 'dark');
  root.style.colorScheme = `only ${theme}`;
  const meta = document.querySelector('meta[name="color-scheme"]');
  if (meta) meta.setAttribute('content', theme);
  document.querySelectorAll('meta[name="theme-color"]').forEach(element => {
    element.setAttribute('content', theme === 'dark' ? '#000000' : '#eff8ff');
  });
}

function subscribe(callback: () => void) {
  window.addEventListener('storage', callback);
  window.addEventListener('nexos-theme-change', callback);
  const preference = window.matchMedia('(prefers-color-scheme: dark)');
  preference.addEventListener('change', callback);
  return () => { window.removeEventListener('storage', callback); window.removeEventListener('nexos-theme-change', callback); preference.removeEventListener('change', callback); };
}
let fallback: Theme | undefined;
function snapshot(): Theme {
  try { const stored = localStorage.getItem(STORAGE_KEY); if (stored === 'light' || stored === 'dark') return stored; } catch {}
  return fallback ?? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
}
export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useSyncExternalStore(subscribe, snapshot, () => 'dark' as Theme);
  useEffect(() => { applyTheme(theme); }, [theme]);

  const toggle = useCallback(() => {
      const next: Theme = snapshot() === 'dark' ? 'light' : 'dark';
      fallback = next;
      applyTheme(next);
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        /* storage unavailable */
      }
      window.dispatchEvent(new Event('nexos-theme-change'));
  }, []);

  return <ThemeContext.Provider value={{ theme, toggle }}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}
