import { cn } from '@/lib/utils';
import styles from './BrandWordmark.module.css';

/** The same logo face and CTA-pink accent in the intro and closing scene. */
export function BrandWordmark({ as: Tag = 'span', animated = false, registered = false, className }: { as?: 'span' | 'h2'; animated?: boolean; registered?: boolean; className?: string }) {
  return <Tag className={cn(styles.wordmark, animated && styles.animated, className)}>ez<span className={styles.way} data-brand-way>way</span>{registered && <sup className={styles.registered} data-brand-registered aria-hidden="true">®</sup>}</Tag>;
}
