'use client';

import { useRef, type ReactNode } from 'react';
import { motion, useInView } from 'motion/react';
import { usePrefersReducedMotion as useReducedMotion } from '@/lib/use-prefers-reduced-motion';
import styles from './Sections.module.css';
import { usePresentationActive } from '@/lib/use-presentation-active';

export function SectionBackground({
  children, index = 0, scene = 'plain', panel = false, experience,
}: { children: ReactNode; index?: number; scene?: 'plain' | 'waves' | 'product' | 'image'; panel?: boolean; experience?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const visible = useInView(ref, { amount: 0.01 });
  const entered = useInView(ref, { once: true, margin: '0px 0px -40px 0px' });
  const reduce = useReducedMotion();
  const entryOpen = usePresentationActive();

  return (
    <div ref={ref} className={styles.scene} data-home-experience={experience} data-section-panel={panel || undefined} data-entered={entered || reduce} data-tone={index % 2 ? 'alternate' : 'base'} data-scene={scene}>
      <div className={styles.scenery} aria-hidden="true">
        {(scene === 'product' || scene === 'image') && <motion.div className={styles.fieldImage}
          animate={!reduce && visible && !entryOpen ? { x: [0, 18, 0], y: [0, -12, 0] } : { x: 0, y: 0 }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }} />}
      </div>
      <div className={styles.sceneContent}>{children}</div>
    </div>
  );
}

export default SectionBackground;
