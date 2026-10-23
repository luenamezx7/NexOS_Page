'use client';

import Image from 'next/image';
import { motion, type Variants } from 'motion/react';
import { usePrefersReducedMotion } from '@/lib/use-prefers-reduced-motion';
import tigerPortrait from '../../../design-/VIDEOS-IA/Tigre_Upscale_2x_4096x3058.png';
import styles from './TigerManifesto.module.css';

const reveal: Variants = {
  hidden: { opacity: 0, y: '110%' },
  visible: (index: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.95, delay: index * 0.16, ease: [0.16, 1, 0.3, 1] },
  }),
};

const staticReveal: Variants = {
  hidden: { opacity: 1, y: 0 },
  visible: { opacity: 1, y: 0, transition: { duration: 0 } },
};

export function TigerManifesto() {
  const reduce = usePrefersReducedMotion();

  return (
    <motion.section
      id="manifesto"
      aria-labelledby="manifesto-title"
      className={styles.section}
      initial={reduce ? false : 'hidden'}
      whileInView="visible"
      animate={reduce ? 'visible' : undefined}
      viewport={{ once: true, amount: 0.3 }}
    >
      <Image
        src={tigerPortrait}
        alt="Tigre branco da NexOS com capuz escuro e visor roxo refletindo uma paisagem de montanhas."
        fill
        sizes="100vw"
        placeholder="blur"
        className={styles.image}
      />
      <div className={styles.scrim} aria-hidden="true" />

      <div className={styles.content}>
        <h2 id="manifesto-title" className={styles.heading}>
          <span className={styles.line}>
            <motion.span variants={reduce ? staticReveal : reveal} custom={0}>Instinto para criar.</motion.span>
          </span>
          <span className={styles.line}>
            <motion.span variants={reduce ? staticReveal : reveal} custom={1} className={styles.accent}>Visão para ir além.</motion.span>
          </span>
        </h2>
        <motion.p
          className={styles.description}
          variants={reduce ? staticReveal : {
            hidden: { opacity: 0, y: 18 },
            visible: { opacity: 1, y: 0, transition: { duration: 0.8, delay: 0.42, ease: [0.16, 1, 0.3, 1] } },
          }}
        >
          Design com identidade. Tecnologia com propósito.
          <br />Uma presença que só pode ser sua.
        </motion.p>
      </div>
    </motion.section>
  );
}
