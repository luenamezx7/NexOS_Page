"use client";
import { useEffect, useRef } from "react";

// Fallback completo para @reactbits-starter/dither-cursor-tw
// Efeito pixelado com trail + campo base estático, sem REACTBITS_LICENSE_KEY
export function DitherCursor({
  className = "",
  dotSize = 3,
  trailLength = 18,
  color = "255,46,106",
}: {
  className?: string;
  dotSize?: number;
  trailLength?: number;
  color?: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w = 0, h = 0, raf = 0;
    const trail: { x: number; y: number }[] = [];
    let mx = window.innerWidth / 2;
    let my = window.innerHeight / 2;

    const onMove = (e: PointerEvent) => { mx = e.clientX; my = e.clientY; };
    const onTouch = (e: TouchEvent) => { const t = e.touches[0]; if (t) { mx = t.clientX; my = t.clientY; } };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("touchmove", onTouch, { passive: true });

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      w = rect.width; h = rect.height;
      if (w === 0 || h === 0) { w = canvas.clientWidth; h = canvas.clientHeight; }
      const dpr = Math.min(window.devicePixelRatio, 2);
      canvas.width = Math.max(1, w * dpr);
      canvas.height = Math.max(1, h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      mx = w / 2; my = h / 2;
    };
    resize();
    window.addEventListener("resize", resize);
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    if (canvas.parentElement) ro.observe(canvas.parentElement);

    const bayer = [
      [0, 8, 2, 10],
      [12, 4, 14, 6],
      [3, 11, 1, 9],
      [15, 7, 13, 5],
    ];

    let t = 0;
    const draw = () => {
      t += 0.016;
      trail.unshift({ x: mx, y: my });
      if (trail.length > trailLength) trail.pop();
      ctx.clearRect(0, 0, w, h);

      // Campo base estático sutil — garante efeito visível mesmo parado
      if (!reduce) {
        ctx.fillStyle = `rgba(${color},0.04)`;
        const step = 7;
        for (let y = 0; y < h; y += step) {
          for (let x = 0; x < w; x += step) {
            const bx = (x / step) % 4;
            const by = (y / step) % 4;
            const v = bayer[Math.floor(by) % 4][Math.floor(bx) % 4] / 16;
            if (v > 0.72) ctx.fillRect(x, y, 1, 1);
          }
        }
      }

      // Trail dither
      trail.forEach((p, i) => {
        const k = 1 - i / trailLength;
        const alpha = (reduce ? 0.5 : k) * 0.62;
        const size = dotSize * (0.7 + k * 0.9);
        const step = Math.max(2, Math.round(size * 0.45));
        for (let y = -size; y <= size; y += step) {
          for (let x = -size; x <= size; x += step) {
            const d = Math.hypot(x, y);
            if (d > size) continue;
            const bx = ((Math.floor(p.x + x) % 4) + 4) % 4;
            const by = ((Math.floor(p.y + y) % 4) + 4) % 4;
            const thresh = (bayer[by][bx] / 16) * 0.88;
            if (k < thresh * 0.7) continue;
            ctx.fillStyle = `rgba(${color},${alpha})`;
            ctx.fillRect(p.x + x, p.y + y, Math.max(1, step - 1), Math.max(1, step - 1));
          }
        }
      });

      if (!reduce) raf = requestAnimationFrame(draw);
    };

    if (reduce) {
      // reduced: desenha uma vez estático
      ctx.fillStyle = `rgba(${color},0.06)`;
      ctx.fillRect(0, 0, w, h);
    } else {
      draw();
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("touchmove", onTouch);
      window.removeEventListener("resize", resize);
      ro.disconnect();
    };
  }, [dotSize, trailLength, color]);

  return <canvas ref={ref} className={className} style={{ width: "100%", height: "100%", display: "block" }} aria-hidden="true" />;
}

export default DitherCursor;
