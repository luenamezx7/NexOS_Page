import Image from 'next/image';
import landscape from '../../images/vv2tech.jpg';
import styles from './HeroBackground.module.css';

export function HeroBackground() {
  return <div className={styles.background} data-hero-background aria-hidden="true">
    {/* Cover crops this wide image inside a tall card; retain the full source resolution. */}
    <Image src={landscape} alt="" fill unoptimized preload className={styles.image} />
    <div className={styles.shade} />
  </div>;
}
