import Image from 'next/image';
import { unbounded } from '@/lib/brand-font';
import nexbotAnimated from '../../design-/rebrand-nexos/nexbotlogo.animated.svg';
import nexbotStatic from '../../design-/rebrand-nexos/nexbotlogostatic.svg';
import styles from './BrandMark.module.css';

export function BrandMark({ animated = false }: { animated?: boolean }) {
  return <span className={`${styles.mark} ${unbounded.variable}`}>
    <span className={styles.lockup} aria-hidden="true">
      <span className={styles.wordmark} data-wordmark="nexos">nexos</span><span className={styles.lab} data-brand-lab>lab</span>
    </span>
    <Image src={animated ? nexbotAnimated : nexbotStatic} alt="Logo do mascote Nexbot da NexOS" width={58} height={58} className={styles.mascot} unoptimized />
  </span>;
}
