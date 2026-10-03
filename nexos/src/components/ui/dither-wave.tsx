'use client';

import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

/** Original local wave/dithering implementation. No React Bits Pro source is bundled. */
export interface DitherWaveProps {
  width?: number | string;
  height?: number | string;
  speed?: number;
  intensity?: number;
  scale?: number;
  downScale?: number;
  primaryColor?: string;
  secondaryColor?: string;
  tertiaryColor?: string;
  opacity?: number;
  quality?: 'low' | 'medium' | 'high';
  maxFPS?: number;
  pauseWhenOffscreen?: boolean;
  className?: string;
  children?: ReactNode;
}

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
function color(value: string, element: HTMLElement): [number, number, number] {
  const token = /^var\((--[\w-]+)\)$/.exec(value.trim());
  let hex = (token ? getComputedStyle(element).getPropertyValue(token[1]) : value).trim().replace(/^#/, '');
  if (hex.length === 3) hex = [...hex].map(c => c + c).join('');
  if (!/^[\da-f]{6}$/i.test(hex)) hex = 'f3ead9';
  return [0, 2, 4].map(offset => parseInt(hex.slice(offset, offset + 2), 16)) as [number, number, number];
}

export default function DitherWave({ width = '100%', height = '100%', speed = 0.25, intensity = 0.7, scale = 7, downScale = 0.6, primaryColor = '#ff168d', secondaryColor = '#d60070', tertiaryColor = '#f3ead9', opacity = 1, quality = 'low', maxFPS = 20, pauseWhenOffscreen = true, className, children }: DitherWaveProps) {
  const wrapper = useRef<HTMLDivElement>(null);
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current, element = wrapper.current;
    const context = canvas?.getContext('2d', { alpha: false });
    if (!canvas || !context || !element) return;
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    let raf = 0, last = 0, time = 0, visible = false, disposed = false;
    let cols = 0, rows = 0, image: ImageData | undefined;
    let background: [number, number, number] = [243, 234, 217];
    let palette: [number, number, number][] = [];
    const interval = 1000 / Math.min(30, Math.max(1, maxFPS));
    function readColors() {
      background = color(tertiaryColor, element!);
      const start = color(primaryColor, element!), end = color(secondaryColor, element!);
      palette = Array.from({ length: cols }, (_, x) => {
        const mix = x / Math.max(1, cols - 1);
        return start.map((channel, i) => Math.round(channel + (end[i] - channel) * mix)) as [number, number, number];
      });
      draw();
    }
    function resize() {
      const rect = element!.getBoundingClientRect();
      if (rect.width < 2 || rect.height < 2) return;
      const cap = quality === 'high' ? 320 : quality === 'medium' ? 240 : 160;
      const cell = 4 + Math.max(0, downScale) * 6;
      cols = Math.max(16, Math.min(cap, Math.round(rect.width / cell)));
      rows = Math.max(16, Math.round(cols * rect.height / rect.width));
      // A bounded pixel buffer, scaled by the compositor, rather than a retina-sized shader.
      rows = Math.min(rows, Math.floor(40000 / cols));
      canvas!.width = cols; canvas!.height = rows;
      image = context!.createImageData(cols, rows);
      readColors();
    }
    function draw() {
      if (!image || !cols || !rows) return;
      const pixels = image.data;
      const amplitude = Math.max(0, Math.min(1, intensity));
      for (let y = 0; y < rows; y++) {
        const v = y / rows;
        const bend = Math.sin(v * scale * 0.9 + time * 0.8) * 0.75;
        const secondary = Math.cos(v * scale * 0.65 - time * 0.4) * 0.2;
        for (let x = 0; x < cols; x++) {
          const u = x / cols;
          const wave = (Math.sin(u * scale + bend - time) + 1) / 2;
          const coverage = Math.max(0, Math.min(1, (wave - 0.32 + secondary) * 1.35)) * amplitude;
          const ink = coverage > (BAYER[(y & 3) * 4 + (x & 3)] + 0.5) / 16 ? palette[x] : background;
          const offset = (y * cols + x) * 4;
          pixels[offset] = ink[0]; pixels[offset + 1] = ink[1]; pixels[offset + 2] = ink[2]; pixels[offset + 3] = 255;
        }
      }
      context!.putImageData(image, 0, 0);
    }
    function loop(now: number) {
      raf = 0;
      if (disposed || document.hidden || (pauseWhenOffscreen && !visible) || motion.matches) return;
      if (!last || now - last >= interval) {
        time += last ? Math.min((now - last) / 1000, 0.15) * speed : 0;
        last = now; draw();
      }
      raf = requestAnimationFrame(loop);
    }
    function sync() {
      cancelAnimationFrame(raf); raf = 0; last = 0;
      if (disposed) return;
      if (motion.matches || speed === 0) draw();
      else if (!document.hidden && (!pauseWhenOffscreen || visible)) raf = requestAnimationFrame(loop);
    }
    const resizeObserver = new ResizeObserver(resize); resizeObserver.observe(element);
    const intersection = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); }); intersection.observe(element);
    const theme = new MutationObserver(readColors); theme.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'style'] });
    document.addEventListener('visibilitychange', sync); motion.addEventListener('change', sync);
    resize();
    return () => {
      disposed = true; cancelAnimationFrame(raf); resizeObserver.disconnect(); intersection.disconnect(); theme.disconnect();
      document.removeEventListener('visibilitychange', sync); motion.removeEventListener('change', sync);
    };
  }, [speed, intensity, scale, downScale, primaryColor, secondaryColor, tertiaryColor, quality, maxFPS, pauseWhenOffscreen]);
  const dimensions: CSSProperties = { width, height, opacity };
  return <div ref={wrapper} data-dither-wave="local" className={cn('relative overflow-hidden', className)} style={dimensions}>
    <canvas ref={ref} className="pointer-events-none absolute inset-0 block h-full w-full [image-rendering:pixelated]" aria-hidden="true" />
    {children && <div className="relative">{children}</div>}
  </div>;
}
