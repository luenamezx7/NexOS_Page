import Image from 'next/image';
import localFont from 'next/font/local';
import styles from './BrandMark.module.css';

const aerobusDotty = localFont({
  src: '../../design-/FONTES/aerobus_dotty/aerobusdotty.ttf',
  variable: '--font-brand-logo',
  weight: '400',
  style: 'normal',
  display: 'swap',
  preload: false,
});

export function BrandMark() {
  return <span className={`${styles.mark} ${aerobusDotty.variable}`}>
    <span className={styles.wordmark} aria-hidden="true">nexos</span>
    <Image src="/mascote-lobo-header.svg" alt="Mascote lobo da NexOS com viseira multicolorida" width={48} height={48} className={styles.mascot} />
  </span>;
}
