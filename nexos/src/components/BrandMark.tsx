import Image from 'next/image';
import { raithonRealm } from '@/lib/brand-font';
import albinoTiger from '../../design-/img-ref/tigre_albino_capuz_fino.svg';
import styles from './BrandMark.module.css';

export function BrandMark() {
  return <span className={`${styles.mark} ${raithonRealm.variable}`}>
    <span className={styles.wordmark} data-wordmark="nexos" aria-hidden="true">nexos</span>
    <Image src={albinoTiger} alt="Mascote tigre albino da NexOS com viseira roxa" width={48} height={48} className={styles.mascot} />
  </span>;
}
