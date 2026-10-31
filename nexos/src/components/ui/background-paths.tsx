'use client';

import { useId, useRef } from 'react';
import { motion, useInView } from 'motion/react';
import { usePrefersReducedMotion } from '@/lib/use-prefers-reduced-motion';

/** Deterministic, low-count SVG paths: no WebGL or React state per frame. */
export function BackgroundPaths({ active = true }: { active?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const visible = useInView(ref, { amount: .01 });
  const reduce = usePrefersReducedMotion();
  const gradient = useId();
  return <div ref={ref} className="background-paths" aria-hidden="true" data-motion={active && visible && !reduce ? 'animated' : 'static'}>
    <svg viewBox="0 0 1440 850" fill="none" preserveAspectRatio="xMidYMid slice">
      <defs><linearGradient id={gradient} x1="100" y1="850" x2="1300" y2="50" gradientUnits="userSpaceOnUse"><stop stopColor="#971ef4" stopOpacity=".05" /><stop offset=".5" stopColor="#e873f8" stopOpacity=".5" /><stop offset="1" stopColor="#b459ff" stopOpacity=".6" /></linearGradient></defs>
      {Array.from({ length: 14 }, (_, i) => <motion.path key={i} d={`M ${-260 + i * 26} 910 C ${280 + i * 22} ${640 - i * 18}, ${650 - i * 9} ${110 + i * 18}, ${1600 - i * 16} ${-180 + i * 22}`} stroke={`url(#${gradient})`} strokeWidth=".8" strokeDasharray="100 18 4 18" initial={false} animate={active && visible && !reduce ? { strokeDashoffset: [0, -140] } : { strokeDashoffset: 0 }} transition={{ duration: 30 + i * 2, repeat: Infinity, ease: 'linear' }} />)}
    </svg>
  </div>;
}
