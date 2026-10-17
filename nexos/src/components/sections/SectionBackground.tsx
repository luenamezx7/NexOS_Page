'use client';

import { useRef, type ReactNode } from 'react';
import dynamic from 'next/dynamic';
import { motion, useInView } from 'motion/react';
import { usePrefersReducedMotion as useReducedMotion } from '@/lib/use-prefers-reduced-motion';
import { useTheme } from '../ThemeProvider';
import GradualBlur from '../ui/GradualBlur';
import styles from './Sections.module.css';

const Topography = dynamic(() => import('../ui/Topography'), { ssr: false });

export function SectionBackground({
  children, index = 0, scene = 'plain',
}: { children: ReactNode; index?: number; scene?: 'plain' | 'waves' | 'product' | 'image' }) {
  const ref = useRef<HTMLDivElement>(null);
  const visible = useInView(ref, { margin: '160px' });
  const reduce = useReducedMotion();
  const { theme } = useTheme();

  return (
    <div ref={ref} className={styles.scene} data-tone={index % 2 ? 'alternate' : 'base'} data-scene={scene}>
      <div className={styles.scenery} aria-hidden="true">
        {scene === 'waves' && theme === 'light' && visible && (
          <Topography lowColor="#0052ff" midColor="#008cff" highColor="#fdf6ec" lightMode
            mouseInteraction={false} maxFPS={24} dprLimit={1} opacity={0.75} thickness={0.018} glow={0.65} className={styles.contours} />
        )}
        {(scene === 'product' || scene === 'image') && <motion.div className={styles.fieldImage}
          animate={!reduce && visible ? { x: [0, 18, 0], y: [0, -12, 0] } : { x: 0, y: 0 }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }} />}
        {scene !== 'plain' && <GradualBlur height="6rem" strength={1} layers={6} tint="var(--section-ground)" zIndex={1} />}
      </div>
      <motion.div className={styles.sceneContent} initial={reduce ? false : { opacity: 0, y: 44 }}
        whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.08 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>{children}</motion.div>
    </div>
  );
}

export default SectionBackground;
