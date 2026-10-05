'use client';

import { useEffect, useLayoutEffect, useRef } from 'react';

export interface SlipstreamProps {
  cellSize?: number; className?: string; density?: number; seed?: number;
  presentation?: boolean; interactive?: boolean; paused?: boolean;
}
interface Star { x: number; y: number; radius: number; phase: number; rate: number; glint: boolean; offsetX: number; offsetY: number }

function randomGenerator(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Stratified white ASCII stars: even coverage, independent twinkle, no React animation state. */
export function Slipstream({ cellSize = 14, className = '', density = 1.4, seed = 0xf1044, presentation = false, interactive = true, paused = false }: SlipstreamProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  const pausedRef = useRef(paused);
  useLayoutEffect(() => {
    pausedRef.current = paused;
    ref.current?.dispatchEvent(new Event('nexos-ascii-state'));
  }, [paused]);
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const query = matchMedia('(prefers-reduced-motion: reduce)');
    const desktop = matchMedia('(min-width: 768px) and (pointer: fine)');
    let entryOpen = Boolean(document.querySelector('.waves-entry[open]'));
    const animated = () => (presentation || desktop.matches) && !query.matches && !pausedRef.current && (presentation || !entryOpen);
    let stars: Star[] = [], width = 0, height = 0, raf = 0, last = 0, time = 0;
    let visible = false, disposed = false, shadow = '#ffffff';
    const sprites = document.createElement('canvas'); sprites.width = 192; sprites.height = 32;
    const sprite = sprites.getContext('2d');
    if (!sprite) return;
    function bakeStars() {
      sprite!.clearRect(0, 0, 192, 32); sprite!.fillStyle = '#ffffff'; sprite!.shadowColor = shadow;
      sprite!.shadowBlur = 4; sprite!.beginPath(); sprite!.arc(16, 16, 2, 0, Math.PI * 2); sprite!.fill();
      sprite!.shadowBlur = 8; sprite!.font = `${Math.max(10, cellSize)}px monospace`;
      sprite!.textAlign = 'center'; sprite!.textBaseline = 'middle'; sprite!.fillText('+', 48, 16);
      sprite!.shadowBlur = 4;
      ['-', '|', '/', '\\'].forEach((glyph, index) => sprite!.fillText(glyph, 80 + index * 32, 16));
    }
    const pointer = { x: -1000, y: -1000, active: false };
    function onPointer(event: PointerEvent) {
      if (!interactive || !animated() || !visible || event.pointerType === 'touch') return;
      const rect = canvas!.getBoundingClientRect();
      pointer.x = event.clientX - rect.left; pointer.y = event.clientY - rect.top;
      pointer.active = pointer.x >= 0 && pointer.x <= width && pointer.y >= 0 && pointer.y <= height;
      canvas!.dataset.asciiFlow = pointer.active ? 'active' : 'idle';
    }
    function onLeave() { pointer.active = false; canvas!.dataset.asciiFlow = 'idle'; }
    function readTheme() {
      shadow = getComputedStyle(canvas!).getPropertyValue('--star-shadow').trim() || '#ffffff';
      bakeStars();
      if (!animated() && !pausedRef.current) draw();
    }
    function resize() {
      const rect = canvas!.getBoundingClientRect();
      width = rect.width; height = rect.height;
      if (width < 2 || height < 2) return;
      const dpr = Math.min(devicePixelRatio || 1, 1.5);
      canvas!.width = Math.round(width * dpr); canvas!.height = Math.round(height * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx!.textAlign = 'center'; ctx!.textBaseline = 'middle';
      ctx!.font = `${Math.max(10, cellSize)}px monospace`;
      const count = Math.min(420, Math.max(70, Math.round(width * height / 5000 * density)));
      const columns = Math.max(1, Math.round(Math.sqrt(count * width / height)));
      const rows = Math.ceil(count / columns);
      const random = randomGenerator(seed);
      stars = Array.from({ length: rows * columns }, (_, i) => ({
        x: (i % columns + 0.15 + random() * 0.7) / columns,
        y: (Math.floor(i / columns) + 0.15 + random() * 0.7) / rows,
        radius: 0.55 + random() * 0.65,
        phase: random() * Math.PI * 2,
        rate: 0.35 + random() * 0.65,
        glint: i % 7 === 0,
        offsetX: 0, offsetY: 0,
      }));
      readTheme(); draw();
    }
    function draw() {
      if (!width || !height) return;
      ctx!.clearRect(0, 0, width, height);
      for (const star of stars) {
        const wave = (Math.sin((animated() ? time * star.rate : 0) + star.phase) + 1) / 2;
        const alpha = 0.28 + wave * 0.66;
        const baseX = star.x * width, baseY = star.y * height;
        const dx = baseX - pointer.x, dy = baseY - pointer.y;
        const distance = pointer.active ? Math.hypot(dx, dy) : 1;
        const influence = animated() && pointer.active ? Math.max(0, 1 - distance / 180) ** 2 : 0;
        const flowX = -dy / (distance || 1) * influence * 48;
        const flowY = dx / (distance || 1) * influence * 48;
        star.offsetX += (flowX - star.offsetX) * 0.16;
        star.offsetY += (flowY - star.offsetY) * 0.16;
        const x = baseX + star.offsetX + (animated() ? Math.sin(time * 0.06 + star.phase) * 2 : 0);
        const y = baseY + star.offsetY + (animated() ? Math.cos(time * 0.08 + star.phase) * 3 : 0);
        ctx!.globalAlpha = alpha;
        // Cached glow sprites avoid hundreds of shadow-blur operations per frame.
        const flowing = influence > 0.055;
        const size = flowing || star.glint ? 32 : 18 * star.radius;
        const angle = flowing ? (Math.atan2(flowY, flowX) % Math.PI + Math.PI) % Math.PI : 0;
        const glyph = [0, 2, 1, 3][Math.round(angle / (Math.PI / 4)) % 4];
        const source = flowing ? (2 + glyph) * 32 : star.glint ? 32 : 0;
        if (flowing) {
          ctx!.globalAlpha = alpha * influence * 0.4;
          ctx!.drawImage(sprites, source, 0, 32, 32, x - flowX * 0.32 - size / 2, y - flowY * 0.32 - size / 2, size, size);
          ctx!.globalAlpha = alpha;
        }
        ctx!.drawImage(sprites, source, 0, 32, 32, x - size / 2, y - size / 2, size, size);
      }
      ctx!.globalAlpha = 1; ctx!.shadowBlur = 0;
    }
    function loop(now: number) {
      raf = 0;
      if (disposed || !visible || document.hidden || !animated()) return;
      if (!last || now - last >= 33) { time += last ? Math.min((now - last) / 1000, 0.1) : 0; last = now; draw(); }
      raf = requestAnimationFrame(loop);
    }
    function sync() {
      cancelAnimationFrame(raf); raf = 0; last = 0;
      if (disposed) return;
      entryOpen = Boolean(document.querySelector('.waves-entry[open]'));
      if (pausedRef.current) { canvas!.dataset.motion = 'paused'; return; }
      canvas!.dataset.motion = animated() ? 'animated' : 'static';
      if (!animated()) { pointer.active = false; draw(); }
      else if (visible && !document.hidden) raf = requestAnimationFrame(loop);
    }
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    const intersection = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; canvas.dataset.asciiFlow = pointer.active && visible ? 'active' : 'idle'; sync(); });
    intersection.observe(canvas);
    const themeObserver = new MutationObserver(readTheme);
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'style'] });
    query.addEventListener('change', sync); desktop.addEventListener('change', sync); document.addEventListener('visibilitychange', sync);
    document.addEventListener('nexos-entry-change', sync);
    canvas.addEventListener('nexos-ascii-state', sync);
    if (interactive) {
      window.addEventListener('pointermove', onPointer, { passive: true }); document.addEventListener('pointerleave', onLeave);
    }
    resize();
    return () => {
      disposed = true; cancelAnimationFrame(raf); resizeObserver.disconnect(); intersection.disconnect(); themeObserver.disconnect();
      query.removeEventListener('change', sync); desktop.removeEventListener('change', sync); document.removeEventListener('visibilitychange', sync);
      document.removeEventListener('nexos-entry-change', sync);
      canvas.removeEventListener('nexos-ascii-state', sync);
      if (interactive) {
        window.removeEventListener('pointermove', onPointer); document.removeEventListener('pointerleave', onLeave);
      }
    };
  }, [cellSize, density, seed, presentation, interactive]);
  return <canvas ref={ref} aria-hidden="true" className={`pointer-events-none block h-full w-full ${className}`} />;
}

export default Slipstream;
