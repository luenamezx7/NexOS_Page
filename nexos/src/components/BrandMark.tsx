import Image from 'next/image';
import localFont from 'next/font/local';
import styles from './BrandMark.module.css';

const aLotOfLove = localFont({
  src: '../../design-/FONTES/kiloton/a_lot_of_love/alot of love.ttf',
  variable: '--font-brand-love',
  weight: '400',
  style: 'normal',
  display: 'swap',
  preload: false,
});

export function BrandMark() {
  return <span className={`${styles.mark} ${aLotOfLove.variable}`}>
    <span className={styles.wordmark} aria-hidden="true">NexOS</span>
    <Image src="/mascote-lobo-header.svg" alt="Mascote lobo da NexOS com viseira multicolorida" width={48} height={48} className={styles.mascot} />
  </span>;
}
