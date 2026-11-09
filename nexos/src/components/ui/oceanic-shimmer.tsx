'use client';

import { useId } from 'react';
import { cn } from '@/lib/utils';

// Oceanic Shimmer, from the 21st.dev Gradient Builder, recolored for ezway.
// Live CSS gradients and static grain; no canvas, animation loop, or remote assets.
// Original recipe: https://21st.dev/community/gradients/editor?from=edd345b3-bbfc-488d-9798-87a22acf7276
export function GradientBackground({ className }: { className?: string }) {
  const grainId = `oceanic-grain-${useId().replace(/:/g, '')}`;

  return (
    <div
      aria-hidden="true"
      data-gradient-background="oceanic-shimmer"
      className={cn('pointer-events-none relative isolate size-full overflow-hidden', className)}
      style={{ containerType: 'size' }}
    >
      <div
        data-gradient-colors
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: '#000000',
          backgroundImage:
            'url("data:image/svg+xml,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'120\' height=\'120\'><filter id=\'n\'><feTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'2\' stitchTiles=\'stitch\'/></filter><rect width=\'100%\' height=\'100%\' filter=\'url(%23n)\' opacity=\'0.075\'/></svg>"), radial-gradient(150% 48.4% at 41.58% 0%, rgba(200, 255, 102, 0.86) 0%, rgba(200, 255, 102, 0) 53%), radial-gradient(150% 48.4% at 42.42% 24%, rgba(148, 224, 31, 0.88) 0%, rgba(148, 224, 31, 0) 53%), radial-gradient(150% 48.4% at 51.19% 48%, rgba(99, 157, 28, 0.68) 0%, rgba(99, 157, 28, 0) 53%), radial-gradient(150% 48.4% at 53.67% 68%, rgba(36, 59, 22, 0.48) 0%, rgba(36, 59, 22, 0) 53%), linear-gradient(180deg, #243b16 0%, #0d0f0d 55%, #000000 88%)',
          backgroundSize: '120px 120px, auto, auto, auto, auto, auto',
          backgroundBlendMode: 'overlay, normal, normal, normal, normal, normal',
        }}
      />
      <svg
        aria-hidden="true"
        focusable="false"
        className="opacity-[0.09]"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', mixBlendMode: 'overlay' }}
      >
        <filter id={grainId}>
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#${grainId})`} />
      </svg>
    </div>
  );
}
