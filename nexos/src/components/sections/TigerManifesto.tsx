'use client';

import Image from 'next/image';
import { useRef } from 'react';
import { motion, useInView, useScroll, useSpring, useTransform, type MotionValue } from 'motion/react';
import { usePrefersReducedMotion } from '@/lib/use-prefers-reduced-motion';
import tigerPortrait from '../../../design-/VIDEOS-IA/Tigre_Upscale_2x_4096x3058.png';
import styles from './TigerManifesto.module.css';

const still = { opacity: 1, y: 0 };

function useTextReveal(progress: MotionValue<number>, start: number, end: number) {
  const opacity = useTransform(progress, [start, end], [0, 1]);
  const y = useTransform(progress, [start, end], ['105%', '0%']);
  return { opacity, y };
}

export function TigerManifesto() {
  const sectionRef = useRef<HTMLElement>(null);
  const reduce = usePrefersReducedMotion();
  const near = useInView(sectionRef, { margin: '100% 0px', once: true });
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end end'] });
  const progress = useSpring(scrollYProgress, { stiffness: 95, damping: 28, mass: 0.6, restDelta: 0.001 });

  // The aperture opens over the visor before the portrait and copy settle.
  // Motion values keep this scroll choreography outside React's render loop.
  const imageOpacity = useTransform(progress, [0.02, 0.3], [0, 1]);
  const imageScale = useTransform(progress, [0, 0.64], [1.065, 1]);
  const upperShutterY = useTransform(progress, [0.02, 0.46], ['0%', '-103%']);
  const lowerShutterY = useTransform(progress, [0.06, 0.56], ['0%', '103%']);
  const cueOpacity = useTransform(progress, [0, 0.12, 0.3], [1, 1, 0]);
  const introReveal = useTextReveal(progress, 0.24, 0.4);
  const firstLineReveal = useTextReveal(progress, 0.36, 0.56);
  const secondLineReveal = useTextReveal(progress, 0.44, 0.66);
  const descriptionOpacity = useTransform(progress, [0.62, 0.78], [0, 1]);
  const descriptionY = useTransform(progress, [0.62, 0.78], [20, 0]);

  return (
    <section
      ref={sectionRef}
      id="manifesto"
      aria-labelledby="manifesto-title"
      className={styles.section}
    >
      <div className={styles.stage}>
        <motion.div className={styles.portrait} style={{ opacity: reduce ? 1 : imageOpacity, scale: reduce ? 1 : imageScale }}>
          <Image
            src={tigerPortrait}
            alt="Tigre branco da NexOS com capuz escuro e visor roxo, com um reflexo laranja sobre uma paisagem de montanhas."
            fill
            // Account for the full image width behind the portrait crop, also on high-DPI phones.
            sizes="(max-width: 767px) max(100vw, 102svh), max(76vw, 134svh)"
            quality={90}
            loading={near ? 'eager' : 'lazy'}
            className={styles.image}
          />
        </motion.div>
        <div className={styles.scrim} aria-hidden="true" />

        {!reduce && <>
          <motion.div data-manifesto-shutter aria-hidden="true" className={`${styles.shutter} ${styles.upperShutter}`} style={{ y: upperShutterY }} />
          <motion.div data-manifesto-shutter aria-hidden="true" className={`${styles.shutter} ${styles.lowerShutter}`} style={{ y: lowerShutterY }} />
        </>}

        <div className={styles.content}>
          <div className={styles.line}>
            <motion.p className={styles.intro} style={reduce ? still : introReveal}>Instinto para criar.</motion.p>
          </div>
          <h2 id="manifesto-title" className={styles.heading}>
            <span className={styles.line}>
              <motion.span style={reduce ? still : firstLineReveal}>Visão para{' '}</motion.span>
            </span>
            <span className={styles.line}>
              <motion.span style={reduce ? still : secondLineReveal}>ir <span className={styles.lensAccent}>além.</span></motion.span>
            </span>
          </h2>
          <motion.p className={styles.description} style={reduce ? still : { opacity: descriptionOpacity, y: descriptionY }}>
            Design com identidade. Tecnologia com propósito.
            <br />Uma presença que só pode ser sua.
          </motion.p>
        </div>

        <motion.div aria-hidden="true" className={styles.scrollCue} style={{ opacity: reduce ? 0 : cueOpacity }}>
          <span />Role para revelar
        </motion.div>
      </div>
      <noscript><style>{'#manifesto { min-height: 100svh; } #manifesto [data-manifesto-shutter] { display: none; }'}</style></noscript>
    </section>
  );
}
