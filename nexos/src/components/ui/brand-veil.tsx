'use client';

import { useRef } from 'react';
import dynamic from 'next/dynamic';
import { useInView } from 'motion/react';
import { usePresentationActive, usePresentationRevealing } from '@/lib/use-presentation-active';

const DarkVeil = dynamic(() => import('../DarkVeil'), { ssr: false });

/** Shared hero/footer recipe. Mount the GPU effect only as its surface approaches. */
export function BrandVeil() {
  const ref = useRef<HTMLDivElement>(null);
  const near = useInView(ref, { margin: '200px', once: true });
  const entryOpen = usePresentationActive();
  const revealing = usePresentationRevealing();

  return (
    <div ref={ref} data-brand-veil aria-hidden="true" className="brand-veil">
      {near && (!entryOpen || revealing) && <DarkVeil
        color="#7c3aed"
        speed={0.05}
        scale={1.35}
        rotation={181}
        flow={3}
        warp={2}
        variation={12}
        glow={0.85}
        brightness={1.8}
        quality={1}
        dpr={1}
        mouseInteraction={false}
        mouseStrength={0.4}
        intro={false}
      />}
    </div>
  );
}
