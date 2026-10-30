import { cn } from '@/lib/utils';
import { raithonRealm } from '@/lib/brand-font';
import styles from './BrandWordmark.module.css';

/** The same logo face and metallic purple finish in the intro and closing scene. */
export function BrandWordmark({ as: Tag = 'span', animated = false }: { as?: 'span' | 'h2'; animated?: boolean }) {
  return <Tag className={cn(styles.wordmark, raithonRealm.variable, animated && styles.animated)}>NEXOS</Tag>;
}
