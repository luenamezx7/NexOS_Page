import { ArrowUpRight } from 'lucide-react';
import type { AnchorHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import styles from './button-witn-icon.module.css';

/** Link version of the sliding-icon button: navigation stays a real link. */
export default function ButtonWithIcon({ children, className, ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a className={cn(styles.button, className)} {...props}>
      <span className={styles.label}>{children}</span>
      <span className={styles.icon} aria-hidden="true"><ArrowUpRight size={18} /></span>
    </a>
  );
}
