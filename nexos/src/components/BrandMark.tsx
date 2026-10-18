import Image from 'next/image';
import styles from './BrandMark.module.css';

export function BrandMark() {
  return <span className={styles.mark}>
    <Image src="/mascote-lobo-header.svg" alt="Mascote lobo da NexOS com viseira multicolorida" width={48} height={48} className={styles.mascot} />
    <span className={styles.wordmark} aria-hidden="true">NexOS</span>
  </span>;
}
