'use client';

import Image from 'next/image';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import styles from './iphone-15-pro.module.css';

/** The project's iPhone 15 Pro flat mockup: the device frame only, with the
 *  wallpaper removed so live content shows through the screen. */
export function Iphone15Pro({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn(styles.phone, className)} data-iphone15pro>
    <div className={styles.screen}>{children}</div>
    <Image className={styles.frame} src="/mockups/iphone-15-pro.svg" alt="" width={423} height={882} unoptimized aria-hidden="true" />
  </div>;
}
