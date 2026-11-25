'use client';

import { useEffect, useId, useRef } from 'react';
import { heroGlassMap } from '@/lib/hero-glass-map';

/** A small, static lens bends only the backdrop. Safari keeps the frosted fallback. */
export function PortalGlassOptics() {
  const id = `portal-lens-${useId().replace(/[^a-zA-Z0-9-]/g, '')}`;
  const ref = useRef<SVGSVGElement>(null);
  useEffect(() => {
    const host = ref.current?.closest<HTMLElement>('[data-client-portal]');
    if (!host || !/(Chrome|Chromium|Edg)\//.test(navigator.userAgent) || /iPhone|iPad|iPod/.test(navigator.userAgent) || !CSS.supports('backdrop-filter', `url("#${id}")`)) return;
    host.style.setProperty('--portal-filter', `blur(14px) url("#${id}") saturate(115%)`);
    return () => { host.style.removeProperty('--portal-filter'); };
  }, [id]);
  return <svg ref={ref} width="0" height="0" aria-hidden="true" focusable="false" style={{ position: 'absolute', pointerEvents: 'none' }}>
    <defs><filter id={id} x="0" y="0" width="1" height="1" filterUnits="objectBoundingBox" primitiveUnits="objectBoundingBox" colorInterpolationFilters="sRGB">
      <feImage href={heroGlassMap} x="0" y="0" width="1" height="1" preserveAspectRatio="none" result="lens" />
      <feDisplacementMap in="SourceGraphic" in2="lens" scale=".025" xChannelSelector="R" yChannelSelector="G" />
    </filter></defs>
  </svg>;
}
