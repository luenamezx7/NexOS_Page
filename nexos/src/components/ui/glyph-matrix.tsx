'use client';

import { useEffect, useRef, type HTMLAttributes } from 'react';
import { useInView } from 'motion/react';
import { cn } from '@/lib/utils';
import { useDocumentVisible } from '@/lib/use-document-visible';
import { usePrefersReducedMotion } from '@/lib/use-prefers-reduced-motion';
import styles from './glyph-matrix.module.css';

export interface GlyphMatrixProps extends HTMLAttributes<HTMLCanvasElement> {
  glyphs?: string;
  cellSize?: number;
  mutationRate?: number;
  interval?: number;
  fadeBottom?: number;
  color?: string;
}

/** Magic UI Glyph Matrix, with bounded resolution and visibility-aware drawing. */
export function GlyphMatrix({ glyphs = '01·•+*/\\<>=', cellSize = 14, mutationRate = .04, interval = 90, fadeBottom = .6, color = '#6B7280', className, ...props }: GlyphMatrixProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const visible = useInView(canvasRef, { amount: .01 });
  const documentVisible = useDocumentVisible();
  const reduce = usePrefersReducedMotion();
  const active = visible && documentVisible && !reduce;

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const characters = Array.from(glyphs || '01');
    const size = Math.max(8, cellSize);
    const rate = Math.min(1, Math.max(0, mutationRate));
    const fade = Math.min(1, Math.max(0, fadeBottom));
    const probe = document.createElement('canvas');
    probe.width = probe.height = 1;
    const probeCtx = probe.getContext('2d');
    if (!probeCtx) return;
    probeCtx.fillStyle = '#6B7280';
    probeCtx.fillStyle = color;
    probeCtx.fillRect(0, 0, 1, 1);
    const [r, g, b, colorAlpha] = probeCtx.getImageData(0, 0, 1, 1).data;

    let width = 0, height = 0, cols = 0, rows = 0;
    let cells: string[] = [], alphas: number[] = [];
    let timer = 0, frame = 0;
    const randomGlyph = () => characters[Math.floor(Math.random() * characters.length)];

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.font = `${size - 2}px ui-monospace, SFMono-Regular, Menlo, monospace`;
      ctx.textBaseline = 'top';
      for (let y = 0; y < rows; y++) {
        const rowAlpha = (1 - y / Math.max(1, rows) * fade) * colorAlpha / 255;
        for (let x = 0; x < cols; x++) {
          const i = y * cols + x;
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alphas[i] * rowAlpha})`;
          ctx.fillText(cells[i], x * size, y * size);
        }
      }
    };

    const resize = () => {
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.ceil(width / size);
      rows = Math.ceil(height / size);
      cells = Array.from({ length: cols * rows }, randomGlyph);
      alphas = cells.map(() => .05 + Math.random() * .35);
      draw();
    };

    const tick = () => {
      const total = cells.length;
      for (let n = 0; n < Math.floor(total * rate); n++) {
        const i = Math.floor(Math.random() * total);
        cells[i] = randomGlyph();
        alphas[i] = .05 + Math.random() * .45;
      }
      draw();
      timer = window.setTimeout(() => { frame = requestAnimationFrame(tick); }, Math.max(60, interval));
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    if (active) timer = window.setTimeout(() => { frame = requestAnimationFrame(tick); }, Math.max(60, interval));
    return () => { clearTimeout(timer); cancelAnimationFrame(frame); observer.disconnect(); };
  }, [glyphs, cellSize, mutationRate, interval, fadeBottom, color, active]);

  return <canvas ref={canvasRef} className={cn(styles.canvas, className)} data-glyph-matrix data-motion={active ? 'animated' : 'static'} {...props} aria-hidden="true" />;
}
