'use client';

import { useRef, type ReactNode } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { cn } from '@/lib/utils';

/** The phone straightens and crosses its title; scroll remains native. */
export function PhoneScrollHero({ titleComponent, children, className }: { titleComponent: ReactNode; children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const rotateX = useTransform(scrollYProgress, [0, .55, 1], [20, 0, 0]);
  const phoneY = useTransform(scrollYProgress, [0, .55, 1], [30, -32, -50]);
  const scale = useTransform(scrollYProgress, [0, .55, 1], [.94, 1, 1]);
  return <div ref={ref} className={cn('relative mx-auto flex min-h-[650px] flex-col items-center justify-center py-16 text-center max-md:min-h-[520px]', className)} style={{ perspective: 1200 }}>
    <motion.div className="relative z-0 max-w-4xl">{titleComponent}</motion.div>
    <motion.div className="relative z-10 -mt-2 md:-mt-8" style={reduce ? undefined : { rotateX, y: phoneY, scale }}>{children}</motion.div>
  </div>;
}
