'use client';

import { ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from 'react';
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

export function HoverLink({ children, className, ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a className={cn(styles.button, className)} {...props}>
      <MetallicSurface />
      <span className={styles.label}>{children}</span>
      <span className={styles.icon} aria-hidden="true"><ArrowUpRight size={18} strokeWidth={1.75} /></span>
    </a>
  );
}
