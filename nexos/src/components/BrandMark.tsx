import Image from 'next/image';
import styles from './BrandMark.module.css';

export function BrandMark({ registered = false }: { registered?: boolean } = {}) {
  return <span className={styles.mark}>
    <span className={styles.lockup} aria-hidden="true">
      <Image src="/logo-ghost.svg" alt="" width={64} height={64} className={styles.mascot} unoptimized />
      <span className={styles.wordmark} data-wordmark="ez">ez</span><span className={styles.way} data-brand-way>way</span>
      {registered && <sup className={styles.registered} data-brand-registered aria-hidden="true">®</sup>}
    </span>
  </span>;
}
