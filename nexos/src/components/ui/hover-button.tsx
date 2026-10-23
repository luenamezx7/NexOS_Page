'use client';

import { ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from 'react';
import styles from './hover-button.module.css';

export function HoverButton({ children, className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" className={cn('primary-action', styles.button, className)} {...props}>
      <span className={styles.label}>{children}</span>
      <span className={styles.icon} aria-hidden="true"><ArrowUpRight size={18} strokeWidth={1.75} /></span>
    </button>
  );
}

export function HoverLink({ children, className, ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a className={cn('primary-action', styles.button, className)} {...props}>
      <span className={styles.label}>{children}</span>
      <span className={styles.icon} aria-hidden="true"><ArrowUpRight size={18} strokeWidth={1.75} /></span>
    </a>
  );
}
