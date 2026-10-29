'use client';

import { useRef } from 'react';
import dynamic from 'next/dynamic';
import { motion, useInView, useScroll, useTransform } from 'motion/react';
import { usePrefersReducedMotion } from '@/lib/use-prefers-reduced-motion';
import { GRAINIENT_PALETTES } from '@/lib/brand-palette';
import { usePresentationActive, usePresentationRevealing } from '@/lib/use-presentation-active';
import { useTheme } from '../ThemeProvider';

const Grainient = dynamic(() => import('../Grainient'), { ssr: false });

/** A pronounced grain field under quiet CSS lighting. */
export function BrandVeil({ variant = 'default' }: { variant?: 'default' | 'hero' | 'interior' } = {}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = usePrefersReducedMotion();
  const { theme } = useTheme();
  const near = useInView(ref, { margin: '160px', once: true });
  const visible = useInView(ref, { amount: .01 });
  const entryOpen = usePresentationActive();
  const revealing = usePresentationRevealing();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [24, -24]);

  return (
    <div ref={ref} data-brand-veil data-variant={variant} aria-hidden="true" className="brand-veil">
      {variant === 'hero' && <div className="hero-grain-field">
        {near && (!entryOpen || revealing) && <Grainient
          colors={GRAINIENT_PALETTES[theme]}
          angle={0}
          flow={.35}
          silk={.5}
          speed={.24}
          contrast={.9}
          saturation={.8}
          grainAmount={theme === 'dark' ? .24 : .2}
          grainSize={1.65}
          grainAnimated={false}
          maxFPS={24}
          dpr={1}
          paused={!visible}
          interactive={false}
          clickSwirl={false}
          intro={false}
        />}
      </div>}
      {variant === 'hero' && <span className="hero-overhead-light" />}
      <motion.div className="brand-veil-light" style={{ y: reduce || variant === 'interior' ? 0 : y }}>
        <span className="brand-veil-orbit" />
      </motion.div>
    </div>
  );
}
