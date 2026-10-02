'use client';

import { ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ButtonHTMLAttributes } from 'react';
import styles from './hover-button.module.css';
import { MetallicSurface } from './metallic-button';

export function HoverButton({ children, className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" className={cn(styles.button, className)} {...props}>
      <MetallicSurface disabled={props.disabled} />
      <span className={styles.label}>{children}</span>
      <span className={styles.icon} aria-hidden="true"><ArrowUpRight size={18} strokeWidth={1.75} /></span>
    </button>
  );
}
