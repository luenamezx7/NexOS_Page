'use client';

import { motion } from 'motion/react';
import { usePrefersReducedMotion as useReducedMotion } from '@/lib/use-prefers-reduced-motion';
import { cn } from '@/lib/utils';

type From = "left" | "right" | "top" | "bottom";

interface HighlightedTextProps {
  children: React.ReactNode;
  className?: string;
  multiline?: boolean;
  from?: From;
  delay?: number;
  inView?: boolean;
  once?: boolean;
}

export function HighlightedText({
  children,
  className,
  multiline = false,
  from = "bottom",
  delay = 0,
  inView = false,
  once = true,
}: HighlightedTextProps) {
  const reduceMotion = useReducedMotion();
  const vertical = from === 'top' || from === 'bottom';
  const origin = from === 'right' ? 'right' : from === 'bottom' ? 'bottom' : from === 'top' ? 'top' : 'left';

  if (multiline) return (
    <motion.span
      data-highlighted-text
      className={cn('relative inline align-baseline', className)}
      initial={reduceMotion ? false : 'hidden'}
      whileInView={inView && !reduceMotion ? 'visible' : undefined}
      animate={inView && !reduceMotion ? undefined : 'visible'}
      viewport={{ once }}
    >
      <motion.span
        data-highlight-ink
        className="relative px-[0.15em] text-inherit [box-decoration-break:clone] [-webkit-box-decoration-break:clone]"
        style={{ backgroundImage: 'linear-gradient(color-mix(in srgb, var(--pink-soft) 32%, transparent), color-mix(in srgb, var(--pink-soft) 32%, transparent))', backgroundRepeat: 'no-repeat' }}
        variants={{ hidden: { backgroundSize: '0% 100%' }, visible: { backgroundSize: '100% 100%' } }}
        transition={{ duration: .65, ease: 'easeOut', delay: reduceMotion ? 0 : delay }}
      >{children}</motion.span>
    </motion.span>
  );

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
