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

export function HighlightedText({
  children,
  className,
  from = "bottom",
  delay = 0,
  inView = false,
  once = true,
}: HighlightedTextProps) {
  const reduceMotion = useReducedMotion();
  const vertical = from === 'top' || from === 'bottom';
  const origin = from === 'right' ? 'right' : from === 'bottom' ? 'bottom' : from === 'top' ? 'top' : 'left';

  return (
    <motion.span
      data-highlighted-text
      className={cn(
        "relative inline align-baseline",
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
        variants={{ hidden: { [vertical ? 'scaleY' : 'scaleX']: 0, transformOrigin: origin }, visible: { [vertical ? 'scaleY' : 'scaleX']: 1, transformOrigin: origin } }}
        transition={{
          type: 'spring',
          damping: 30,
          stiffness: 300,
          delay: reduceMotion ? 0 : delay,
        }}
      />
      <span className="relative z-10 px-[0.15em] text-inherit" data-highlight-ink>
        {children}
      </span>
    </motion.span>
  );
}

export default HighlightedText;
