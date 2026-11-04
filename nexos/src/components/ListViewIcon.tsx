'use client';

import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { usePrefersReducedMotion } from '@/lib/use-prefers-reduced-motion';

const LINE_STEP = 5;
const LINE_TRAVEL: Record<number, number> = { 0: LINE_STEP, 1: LINE_STEP, 2: -LINE_STEP * 2 };

export interface ListViewIconProps {
  isActive: boolean;
  className?: string;
}

export function ListViewIcon({ isActive, className }: ListViewIconProps) {
  const reduce = usePrefersReducedMotion();
  return (
    <motion.span className={cn('inline-flex h-4 w-4 flex-col items-center justify-center gap-[3px]', className)} aria-hidden="true">
      {[0, 1, 2].map(i => (
        <motion.span
          key={i}
          className="h-[2px] w-3 rounded-full bg-current"
          animate={isActive ? { y: LINE_TRAVEL[i], opacity: [0.55, 1, 1] } : { y: 0, opacity: 0.9 }}
          transition={{ duration: reduce ? 0 : 0.36, delay: reduce || i === 0 ? 0 : i * 0.02, ease: 'easeOut' }}
        />
      ))}
    </motion.span>
  );
}
