import Image from 'next/image';
import localFont from 'next/font/local';
import purpleWolf from '../../design-/img-ref/mascote_lobo_roxo.svg';
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
    <Image src={purpleWolf} alt="Mascote lobo da NexOS com viseira roxa" width={48} height={48} className={styles.mascot} />
  </span>;
}
