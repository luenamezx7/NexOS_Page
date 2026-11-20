'use client';

import { useId, useSyncExternalStore } from 'react';
import { heroGlassMap } from '@/lib/hero-glass-map';

const subscribe = () => () => {};
const supportsRefraction = () => /(?:Chrome|Chromium|Edg)\//.test(navigator.userAgent)
  && !/iPhone|iPad|iPod/.test(navigator.userAgent)
  && CSS.supports('backdrop-filter', 'url("#navigation-glass")');

/** Refracts only the backdrop. Navigation labels stay on an independent layer. */
export function NavigationGlass({ variant = 'navigation' }: { variant?: 'navigation' | 'panel' | 'card' } = {}) {
  const id = `navigation-glass-${useId().replace(/:/g, '')}`;
  const refractive = useSyncExternalStore(subscribe, supportsRefraction, () => false);

  return <>
    <svg width="0" height="0" aria-hidden="true" focusable="false" className="navigation-glass-definitions">
      <defs>
        <filter id={id} x="0" y="0" width="1" height="1" filterUnits="objectBoundingBox" primitiveUnits="objectBoundingBox" colorInterpolationFilters="sRGB">
          <feImage href={heroGlassMap} x="0" y="0" width="1" height="1" preserveAspectRatio="none" result="lens" />
          <feDisplacementMap in="SourceGraphic" in2="lens" scale={variant === 'card' ? '.28' : '.055'} xChannelSelector="R" yChannelSelector="G" result="refracted" />
          {variant === 'card' ? <>
            <feColorMatrix in="lens" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 1 0 0" result="edgeAlpha" />
            <feComponentTransfer in="edgeAlpha" result="edgeMask">
              <feFuncA type="gamma" amplitude="1" exponent=".85" offset="0" />
            </feComponentTransfer>
            <feComposite in="refracted" in2="edgeMask" operator="in" result="bentEdges" />
            <feComposite in="SourceGraphic" in2="edgeMask" operator="out" result="clearCentre" />
            <feComposite in="bentEdges" in2="clearCentre" operator="arithmetic" k2="1" k3="1" />
          </> : <feGaussianBlur in="refracted" stdDeviation=".003 .07" edgeMode="duplicate" />}
        </filter>
      </defs>
    </svg>
    <div
      aria-hidden="true"
      className="navigation-glass"
      data-glass-variant={variant}
      data-refraction={refractive || undefined}
      style={refractive ? { backdropFilter: `${variant === 'panel' ? 'blur(32px) ' : ''}url("#${id}") saturate(${variant === 'panel' ? '115' : '135'}%)` } : undefined}
    />
  </>;
}
