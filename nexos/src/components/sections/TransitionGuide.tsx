'use client';

import ReactBitsScrollReveal from '@/components/ui/ReactBitsScrollReveal';
import styles from './TransitionGuide.module.css';

export function TransitionGuide({ text, afterProduct = false }: { text: string; afterProduct?: boolean }) {
  return <div className={styles.guide} data-after-product={afterProduct}>
    <ReactBitsScrollReveal highlightColor={null} mode="scrub" splitBy="words" effect="fade"
      stagger={.095} duration={.8} smoothing={.2} baseOpacity={0} baseRotation={0} baseOffset={0}
      enableBlur blurStrength={4} wordAnimationEnd="top center" containerClassName={styles.title}>
      {text}
    </ReactBitsScrollReveal>
  </div>;
}
