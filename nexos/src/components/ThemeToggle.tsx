'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from './ThemeProvider';

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button type="button" onClick={toggle} aria-label={theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'} className="grid h-[44px] w-[44px] shrink-0 place-items-center rounded-lg border border-ink/10 text-ink/80 transition-colors hover:bg-ink/5 focus-visible:outline-2">
      {theme === 'dark' ? <Sun size={18} strokeWidth={1.75} aria-hidden="true" /> : <Moon size={18} strokeWidth={1.75} aria-hidden="true" />}
    </button>
  );
}
