'use client';

import { useRef } from 'react';
import { useInView } from 'motion/react';
import { usePresentationActive } from '@/lib/use-presentation-active';
import { cn } from '@/lib/utils';

/** A compositor-only, narrow spectrum: paused offscreen and during the intro. */
export function VisorSpectrum({ className }: { className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const visible = useInView(ref);
  const entryOpen = usePresentationActive();
  return <span ref={ref} className={cn('visor-spectrum', className)} data-visor-motion={visible && !entryOpen ? 'on' : 'off'} aria-hidden="true" />;
}
