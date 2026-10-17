'use client';

/**
 * Ciclo de robôs (animação de ícones).
 * Alterna entre ícones de robô com transição suave.
 */
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { usePrefersReducedMotion as useReducedMotion } from '@/lib/use-prefers-reduced-motion';
import Image from 'next/image';

const ROBOT_IMAGES = ['/nexosrobot-1.svg', '/nexosrobot-2.svg', '/nexosrobot-3.svg'] as const;

const FLUID_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

interface RobotCyclerProps {
  className?: string;
  style?: React.CSSProperties;
  intervalMs?: number;
  fadeMs?: number;
  /** preload all 3 on mount to avoid flash */
  preload?: boolean;
}

export function RobotCycler({
  className = '',
  style,
  intervalMs = 1600,
  fadeMs = 600,
  preload = true,
}: RobotCyclerProps) {
  const reduce = useReducedMotion() ?? false;
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (preload) {
      ROBOT_IMAGES.forEach((src) => {
        const img = new window.Image();
        img.src = src;
      });
    }
  }, [preload]);

  useEffect(() => {
    if (reduce) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % ROBOT_IMAGES.length);
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs, reduce]);

  return (
    <span
      aria-hidden="true"
      className={`relative inline-flex items-center justify-center overflow-hidden will-change-transform ${className}`}
      style={style}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.img
          key={reduce ? 0 : index}
          src={ROBOT_IMAGES[reduce ? 0 : index]}
          alt=""
          draggable={false}
          initial={false}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduce ? 0 : fadeMs / 1000, ease: FLUID_EASE }}
          className="absolute inset-0 h-full w-full object-contain will-change-transform"
          style={{ backfaceVisibility: 'hidden' } as React.CSSProperties}
          width={112}
          height={28}
        />
      </AnimatePresence>
      {/* spacer mantém proporção 307/257 sem layout shift e sem gargalo (decode off-main) */}
      <Image
        src={ROBOT_IMAGES[0]}
        alt=""
        aria-hidden="true"
        className="invisible block h-full w-auto object-contain"
        draggable={false}
        decoding="async"
        width={112}
        height={28}
      />
    </span>
  );
}

export default RobotCycler;
