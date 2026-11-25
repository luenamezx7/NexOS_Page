"use client";

import { useEffect, useRef, useState } from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';

export interface MarqueeLogo {
  name: string;
  src: string;
}

export interface PerspectiveMarqueeProps {
  items?: string[];
  logos?: MarqueeLogo[];
  logoSize?: number;
  fontSize?: number;
  color?: string;
  fontWeight?: number;
  pixelsPerFrame?: number;
  rotateY?: number;
  rotateX?: number;
  perspective?: number;
  fadeColor?: string;
  background?: string;
  speed?: number;
  className?: string;
}

const DEFAULT_ITEMS = ['Vercel', 'Linear', 'Stripe', 'Figma', 'Notion', 'Raycast', 'Arc', 'Cursor'];

export function PerspectiveMarquee({
  items = DEFAULT_ITEMS, logos, logoSize = 76, fontSize = 84, color = '#fafafa',
  fontWeight = 700, pixelsPerFrame = 2, rotateY = -28, rotateX = 8,
  perspective = 1200, fadeColor = '#050505', background = '#050505', speed = 1, className,
}: PerspectiveMarqueeProps) {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();
  const groupRef = useRef<HTMLDivElement>(null);
  const [measuredWidths, setMeasuredWidths] = useState<number[]>([]);
  const useLogos = Boolean(logos?.length);
  const entries = useLogos ? logos! : items.map(name => ({ name, src: '' }));
  const itemPadding = Math.round((useLogos ? logoSize : fontSize) * .9);

  useEffect(() => {
    const group = groupRef.current;
    if (!group) return;
    const measure = () => {
      const widths = Array.from(group.children, child => parseFloat(getComputedStyle(child).width));
      setMeasuredWidths(previous => previous.length === widths.length && previous.every((value, i) => value === widths[i]) ? previous : widths);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(group);
    return () => observer.disconnect();
  }, [items, logos, fontSize, fontWeight, logoSize]);

  const widths = entries.map((entry, i) => measuredWidths[i] || (useLogos ? logoSize : entry.name.length * fontSize * .6) + itemPadding);
  const cycleWidth = widths.reduce((sum, value) => sum + value, 0);
  const travel = frame * speed * pixelsPerFrame;
  const offset = cycleWidth ? -((travel % cycleWidth + cycleWidth) % cycleWidth) : 0;
  const copies = cycleWidth ? Math.ceil(width / cycleWidth) + 2 : 0;
  const starts = widths.map((_, i) => widths.slice(0, i).reduce((sum, value) => sum + value, 0));

  return <div className={className} aria-hidden="true" data-perspective-marquee style={{
    position: 'absolute', inset: 0, background, display: 'flex', alignItems: 'center',
    overflow: 'hidden', perspective: `${perspective}px`,
  }}>
    <div style={{ width: '100%', transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`, transformStyle: 'preserve-3d' }}>
      <div data-marquee-track style={{ display: 'flex', width: 'max-content', whiteSpace: 'nowrap', transform: `translateX(${offset}px)` }}>
        {Array.from({ length: copies }, (_, copy) => <div key={copy} ref={copy === 0 ? groupRef : undefined} style={{ display: 'flex', flexShrink: 0 }}>
          {entries.map((entry, i) => {
            const center = copy * cycleWidth + starts[i] + (widths[i] - itemPadding) / 2 + offset;
            const distance = Math.min(1, Math.abs((center - width / 2) / (width / 2)));
            return <span key={`${entry.name}-${i}`} style={{
              display: 'inline-flex', alignItems: 'center', flexShrink: 0, paddingRight: itemPadding,
              fontFamily: 'var(--font-display), sans-serif', fontSize, fontWeight, color,
              letterSpacing: '-.03em', filter: `blur(${distance * 6}px)`, opacity: 1 - distance * .4,
            }}>
              {useLogos
                // Local SVGs retain their original aspect ratios inside equal optical boxes.
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={entry.src} alt="" width={logoSize} height={logoSize} draggable={false} style={{ width: logoSize, height: logoSize, objectFit: 'contain' }} />
                : entry.name}
            </span>;
          })}
        </div>)}
      </div>
    </div>
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: `linear-gradient(90deg, ${fadeColor}, transparent 18%, transparent 82%, ${fadeColor})` }} />
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: `linear-gradient(180deg, ${fadeColor}, transparent 25%, transparent 75%, ${fadeColor})` }} />
  </div>;
}

export default PerspectiveMarquee;
