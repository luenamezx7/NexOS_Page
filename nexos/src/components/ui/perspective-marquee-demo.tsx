"use client";

import PerspectiveMarqueePlayer from './perspective-marquee-player';
import type { PerspectiveMarqueeProps } from './remocn-perspective-marquee';

const settings = { rotateY: -28, rotateX: 8, perspective: 1200, pixelsPerFrame: 2, speed: 1, fontSize: 84 };

export default function Demo(props: PerspectiveMarqueeProps) {
  return <div className="h-screen w-screen">
    <PerspectiveMarqueePlayer width={1200} height={900} playing inputProps={{ ...settings, ...props }} />
  </div>;
}
