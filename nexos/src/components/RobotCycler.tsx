'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';

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

  // reduced-motion: mostra só o primeiro sem animação
  if (reduce) {
    return (
      <img
        src={ROBOT_IMAGES[0]}
        alt=""
        aria-hidden="true"
        className={className}
        style={style}
        draggable={false}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className={`relative inline-flex items-center justify-center overflow-hidden will-change-transform ${className}`}
      style={style}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.img
          key={index}
          src={ROBOT_IMAGES[index]}
          alt=""
          draggable={false}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: fadeMs / 1000, ease: FLUID_EASE }}
          className="absolute inset-0 h-full w-full object-contain will-change-transform"
          style={{ backfaceVisibility: 'hidden' } as React.CSSProperties}
        />
      </AnimatePresence>
      {/* spacer mantém proporção 307/257 sem layout shift e sem gargalo (decode off-main) */}
      <img
        src={ROBOT_IMAGES[0]}
        alt=""
        aria-hidden="true"
        className="invisible block h-full w-auto object-contain"
        draggable={false}
        decoding="async"
      />
    </span>
  );
}

export default RobotCycler;
