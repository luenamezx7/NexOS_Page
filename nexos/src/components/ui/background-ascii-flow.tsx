'use client';

import { useEffect, useRef } from 'react';

const DIR_CHARS = ['-', '|', '/', '\\'] as const;
const NOISE_FREQ = 0.05;
const FIELD_SPEED = 0.06;
const CURL_SCALE = 46;
const TRAIL_LEN = 4;
const VORTEX_RADIUS = 120;

function hash2(x: number, y: number, seed: number) {
  const s = Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453;
  return s - Math.floor(s);
}
function smooth(t: number) { return t * t * (3 - 2 * t); }
function noise2D(x: number, y: number, seed: number) {
  const ix = Math.floor(x), iy = Math.floor(y);
  const tx = smooth(x - ix), ty = smooth(y - iy);
  const a = hash2(ix, iy, seed), b = hash2(ix + 1, iy, seed);
  const c = hash2(ix, iy + 1, seed), d = hash2(ix + 1, iy + 1, seed);
  return a + (b - a) * tx + (c + (d - c) * tx - a - (b - a) * tx) * ty;
}
function potential(x: number, y: number, t: number) {
  return noise2D(x * NOISE_FREQ, y * NOISE_FREQ + t, 11.3) * 0.7
    + noise2D(x * NOISE_FREQ * 2.3 - t * 0.6, y * NOISE_FREQ * 2.3, 47.9) * 0.3;
}
function curlVel(x: number, y: number, t: number, eps: number): [number, number] {
  return [
    (potential(x, y + eps, t) - potential(x, y - eps, t)) / (2 * eps) * CURL_SCALE,
    -(potential(x + eps, y, t) - potential(x - eps, y, t)) / (2 * eps) * CURL_SCALE,
  ];
}
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function dirChar(vx: number, vy: number) {
  const a = (Math.atan2(vy, vx) % Math.PI + Math.PI) % Math.PI;
  return DIR_CHARS[Math.round(a / (Math.PI / 4)) % 4];
}

export interface SlipstreamProps { cellSize?: number; className?: string }

/** Curl-noise ASCII field. Sleeps offscreen; pointer input stays behind the UI. */
export function Slipstream({ cellSize = 14, className = '' }: SlipstreamProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const size = Math.max(8, cellSize);
    let reduced = motionQuery.matches;
    let width = 0, height = 0, cellW = size, cols = 0, rows = 0;
    let fg = '', muted = '', raf = 0, last = 0, t = 0;
    let disposed = false, ready = false, visible = false;
    let count = 0;
    let px = new Float32Array(0), py = new Float32Array(0);
    let histX = new Float32Array(0), histY = new Float32Array(0);
    let heads = new Int32Array(0), live = new Int32Array(0);
    let velX = new Float32Array(0), velY = new Float32Array(0);
    const vortex = { x: -1e5, y: -1e5, has: false, strength: 0 };

    function readTokens() {
      fg = getComputedStyle(canvas!).color;
      muted = getComputedStyle(canvas!).getPropertyValue('--ns-muted').trim() || fg;
    }
    function resize() {
      const rect = canvas!.getBoundingClientRect();
      width = rect.width; height = rect.height;
      if (width < 2 || height < 2) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas!.width = Math.round(width * dpr); canvas!.height = Math.round(height * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx!.font = `${size}px ${getComputedStyle(canvas!).fontFamily}`;
      cellW = Math.max(4, ctx!.measureText('MMMMMMMMMM').width / 10);
      ctx!.textAlign = 'center'; ctx!.textBaseline = 'middle';
      cols = Math.ceil(width / cellW); rows = Math.ceil(height / size);
      count = Math.max(60, Math.min(width < 768 ? 80 : 130, Math.floor(cols * rows * 0.045)));
      px = new Float32Array(count); py = new Float32Array(count);
      histX = new Float32Array(count * TRAIL_LEN); histY = new Float32Array(count * TRAIL_LEN);
      heads = new Int32Array(count); live = new Int32Array(count);
      velX = new Float32Array(count); velY = new Float32Array(count);
      const rand = mulberry32(0xf1044);
      for (let i = 0; i < count; i++) {
        px[i] = rand() * width; py[i] = rand() * height;
      }
      draw();
    }
    function draw() {
      if (!width || !height) return;
      ctx!.clearRect(0, 0, width, height);
      ctx!.fillStyle = muted;
      // Two passes preserve the supplied field's relative speed/alpha shaping.
      const velocities: [number, number, number][] = [];
      let max = 1e-6;
      for (let y = 0; y < rows; y += 3) for (let x = 0; x < cols; x += 3) {
        const [vx, vy] = curlVel(x * cellW, y * size, t, 1.5);
        const speed = Math.hypot(vx, vy);
        velocities.push([vx, vy, speed]); max = Math.max(max, speed);
      }
      let index = 0;
      for (let y = 0; y < rows; y += 3) for (let x = 0; x < cols; x += 3) {
        const [vx, vy, speed] = velocities[index++];
        const norm = speed / max;
        if (norm < 0.4) continue;
        ctx!.globalAlpha = Math.pow((norm - 0.4) / 0.6, 2.2) * 0.55;
        ctx!.fillText(dirChar(vx, vy), x * cellW + cellW / 2, y * size + size / 2);
      }
      ctx!.fillStyle = fg;
      for (let i = 0; i < count; i++) for (let s = 0; s < live[i]; s++) {
        const slot = (heads[i] - s + TRAIL_LEN) % TRAIL_LEN;
        ctx!.globalAlpha = (1 - s / TRAIL_LEN) * (0.35 + 0.65 * Math.min(1, Math.hypot(velX[i], velY[i]) / (CURL_SCALE * 0.6)));
        ctx!.fillText(dirChar(velX[i], velY[i]), histX[i * TRAIL_LEN + slot], histY[i * TRAIL_LEN + slot]);
      }
      ctx!.globalAlpha = 1;
    }
    function step(dt: number) {
      t += dt * FIELD_SPEED;
      vortex.strength += ((vortex.has ? 1 : 0) - vortex.strength) * 0.06;
      for (let i = 0; i < count; i++) {
        let [vx, vy] = curlVel(px[i], py[i], t, 1.5 * cellW);
        const dx = px[i] - vortex.x, dy = py[i] - vortex.y;
        const dist = Math.hypot(dx, dy);
        if (vortex.strength > 0.01 && dist < VORTEX_RADIUS) {
          const mag = (1 - dist / VORTEX_RADIUS) * 2.4 * vortex.strength * 20;
          vx += -dy / (dist || 1e-3) * mag; vy += dx / (dist || 1e-3) * mag;
        }
        px[i] = (px[i] + vx * dt + width) % width;
        py[i] = (py[i] + vy * dt + height) % height;
        velX[i] = vx; velY[i] = vy;
        heads[i] = (heads[i] + 1) % TRAIL_LEN;
        histX[i * TRAIL_LEN + heads[i]] = px[i]; histY[i * TRAIL_LEN + heads[i]] = py[i];
        live[i] = Math.min(TRAIL_LEN, live[i] + 1);
      }
    }
    function loop(now: number) {
      raf = 0;
      if (disposed || reduced || !visible || document.hidden) return;
      // 30fps is enough for ambient type, reducing canvas work on mobile.
      if (!last || now - last >= 32) {
        step(last ? Math.min(0.05, (now - last) / 1000) : 1 / 30);
        draw(); last = now;
      }
      raf = requestAnimationFrame(loop);
    }
    function syncLoop() {
      cancelAnimationFrame(raf); raf = 0; last = 0;
      if (!ready || disposed) return;
      if (reduced) { draw(); return; }
      if (visible && !document.hidden) raf = requestAnimationFrame(loop);
    }
    function onPointer(e: PointerEvent) {
      if (reduced || !visible || e.pointerType === 'touch') return;
      const rect = canvas!.getBoundingClientRect();
      vortex.x = e.clientX - rect.left; vortex.y = e.clientY - rect.top;
      vortex.has = vortex.x >= 0 && vortex.x <= width && vortex.y >= 0 && vortex.y <= height;
    }
    function onLeave() { vortex.has = false; }
    function onMotion() { reduced = motionQuery.matches; syncLoop(); }
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    const intersection = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; syncLoop(); });
    intersection.observe(canvas);
    const themes = new MutationObserver(() => { readTokens(); if (reduced) draw(); });
    themes.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'style'] });
    document.fonts.ready.then(() => {
      if (disposed) return;
      readTokens(); resize(); ready = true; syncLoop();
    });
    window.addEventListener('pointermove', onPointer, { passive: true });
    document.addEventListener('pointerleave', onLeave);
    document.addEventListener('visibilitychange', syncLoop);
    motionQuery.addEventListener('change', onMotion);
    return () => {
      disposed = true; cancelAnimationFrame(raf);
      resizeObserver.disconnect(); intersection.disconnect(); themes.disconnect();
      window.removeEventListener('pointermove', onPointer);
      document.removeEventListener('pointerleave', onLeave);
      document.removeEventListener('visibilitychange', syncLoop);
      motionQuery.removeEventListener('change', onMotion);
    };
  }, [cellSize]);

  return <canvas ref={canvasRef} aria-hidden="true" className={`pointer-events-none block h-full w-full font-mono text-foreground ${className}`} />;
}

export default Slipstream;
