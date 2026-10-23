'use client';

import { useRef } from 'react';
import dynamic from 'next/dynamic';
import { useInView } from 'motion/react';
import { usePresentationActive, usePresentationRevealing } from '@/lib/use-presentation-active';
import { useTheme } from '../ThemeProvider';
import { GRAINIENT_PALETTES } from '@/lib/brand-palette';

const Grainient = dynamic(() => import('../Grainient'), { ssr: false });

/** Shared hero/footer recipe. Mount the GPU effect only as its surface approaches. */
export function BrandVeil({ variant = 'default' }: { variant?: 'default' | 'hero' } = {}) {
  const ref = useRef<HTMLDivElement>(null);
  const near = useInView(ref, { margin: '200px', once: true });
  const entryOpen = usePresentationActive();
  const revealing = usePresentationRevealing();
  const { theme } = useTheme();
  const grainAmount = variant === 'hero'
    ? (theme === 'dark' ? 0.12 : 0.09)
    : (theme === 'dark' ? 0.055 : 0.035);

  return (
    <div ref={ref} data-brand-veil data-variant={variant} aria-hidden="true" className="brand-veil">
      {near && (!entryOpen || revealing) && <Grainient
        colors={GRAINIENT_PALETTES[theme]}
        angle={variant === 'hero' ? 0 : 55}
        flow={0.65}
        silk={0.45}
        speed={0.55}
        grainAmount={grainAmount}
        grainSize={variant === 'hero' ? 1.5 : 1.2}
        grainAnimated={false}
        maxFPS={30}
        dpr={1}
        interactive={false}
        clickSwirl={false}
        intro={false}
      />}
    </div>
  );
}
