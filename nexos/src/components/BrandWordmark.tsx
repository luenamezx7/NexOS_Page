import { cn } from '@/lib/utils';
import styles from './BrandWordmark.module.css';

/** The same logo face and CTA-pink accent in the intro and closing scene. */
export function BrandWordmark({ as: Tag = 'span', animated = false, className }: { as?: 'span' | 'h2'; animated?: boolean; className?: string }) {
  return <Tag className={cn(styles.wordmark, animated && styles.animated, className)}>ez<span className={styles.way} data-brand-way>way</span></Tag>;
}
