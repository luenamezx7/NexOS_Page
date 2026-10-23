'use client';

/**
 * Botão de alternância de tema (claro/escuro).
 * 44x44px, ícones Sun/Moon, borda hairline.
 */
import { Moon, Sun } from 'lucide-react';
import { useTheme } from './ThemeProvider';
import { cn } from '@/lib/utils';

export function ThemeToggle({ className }: { className?: string } = {}) {
  const { theme, toggle } = useTheme();
  return (
    <button type="button" onClick={toggle} aria-label={theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'} className={cn('grid size-11 shrink-0 place-items-center rounded-lg border border-ink/10 text-ink/80 transition-colors hover:bg-ink/5 focus-visible:outline-2', className)}>
      {theme === 'dark' ? <Sun size={18} strokeWidth={1.75} aria-hidden="true" /> : <Moon size={18} strokeWidth={1.75} aria-hidden="true" />}
    </button>
  );
}
