import { cn } from '@/lib/utils';
import styles from './BrandWordmark.module.css';

/** The same logo face and metallic purple finish in the intro and closing scene. */
export function BrandWordmark({ as: Tag = 'span', animated = false }: { as?: 'span' | 'h2'; animated?: boolean }) {
  return <Tag className={cn(styles.wordmark, animated && styles.animated)}>ez<span className={styles.way}>way</span></Tag>;
}
