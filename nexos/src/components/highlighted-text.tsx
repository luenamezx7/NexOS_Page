'use client';

import { motion, useReducedMotion } from 'motion/react';
import { cn } from '@/lib/utils';

type From = "left" | "right" | "top" | "bottom";

interface HighlightedTextProps {
  children: React.ReactNode;
  className?: string;
  from?: From;
  delay?: number;
  inView?: boolean;
  once?: boolean;
}

const fromVariants = {
  left: {
    hidden: { x: "-100%" },
    visible: { x: "0%" },
  },
  right: {
    hidden: { x: "100%" },
    visible: { x: "0%" },
  },
  top: {
    hidden: { y: "-100%" },
    visible: { y: "0%" },
  },
  bottom: {
    hidden: { y: "100%" },
    visible: { y: "0%" },
  },
};

export function HighlightedText({
  children,
  className,
  from = "bottom",
  delay = 0,
  inView = false,
  once = true,
}: HighlightedTextProps) {
  const variants = fromVariants[from];
  const reduceMotion = useReducedMotion();

  return (
    <motion.span
      data-highlighted-text
      className={cn(
        "relative inline-flex overflow-hidden align-baseline",
        className,
      )}
      initial={reduceMotion ? false : 'hidden'}
      whileInView={inView && !reduceMotion ? 'visible' : undefined}
      animate={inView && !reduceMotion ? undefined : 'visible'}
      viewport={{ once }}
    >
      <motion.span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 rounded-sm"
        style={{ background: 'color-mix(in srgb, var(--pink-soft) 32%, transparent)' }}
        variants={variants}
        transition={{
          type: 'spring',
          damping: 30,
          stiffness: 300,
          delay: reduceMotion ? 0 : delay,
        }}
      />
      <span className="relative z-10 px-[0.15em] text-inherit">
        {children}
      </span>
    </motion.span>
  );
}

export default HighlightedText;
