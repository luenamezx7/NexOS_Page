'use client';

import { useEffect, useRef, useState } from 'react';
import type { Globe as GlobeInstance } from 'cobe';
import { Pause, Play, RotateCcw } from 'lucide-react';
import styles from './globe.module.css';

/** COBE v2. A single renderer, visibility-gated RAF and time-based rotation. */
export function Globe() {
  const root = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const renderer = useRef<GlobeInstance | null>(null);
  const interaction = useRef({ phi: .3, dragging: false, x: 0 });
  const [status, setStatus] = useState('loading');
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(false);
  const syncRef = useRef<() => void>(() => {});

  useEffect(() => {
    const element = root.current;
    const surface = canvas.current;
    if (!element || !surface) return;
    let disposed = false, visible = false, frame = 0, last = 0;
    let initializing = false;
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    const draw = () => renderer.current?.update({ phi: interaction.current.phi });
    const tick = (now: number) => {
      frame = 0;
      if (disposed || !visible || document.hidden || pausedRef.current || preference.matches || !renderer.current) return;
      if (!last) last = now;
      if (now - last >= 1000 / 30) {
        if (!interaction.current.dragging) interaction.current.phi += Math.min(now - last, 80) * .000065;
        last = now;
        draw();
      }
      frame = requestAnimationFrame(tick);
    };
    const sync = () => {
      cancelAnimationFrame(frame); frame = 0; last = 0;
      if (visible && !document.hidden && !pausedRef.current && !preference.matches && renderer.current) frame = requestAnimationFrame(tick);
    };
    syncRef.current = sync;
    const resize = () => {
      const width = Math.max(1, element.clientWidth);
      const dpr = Math.min(devicePixelRatio || 1, 1.5);
      renderer.current?.update({ width: Math.round(width * dpr), height: Math.round(width * dpr), devicePixelRatio: dpr });
      draw();
    };
    const initialize = async () => {
      if (initializing || renderer.current) return;
      initializing = true;
      try {
        const { default: createGlobe } = await import('cobe');
        if (disposed) return;
        const width = element.clientWidth;
        const dpr = Math.min(devicePixelRatio || 1, 1.5);
        renderer.current = createGlobe(surface, {
          width: width * dpr, height: width * dpr, devicePixelRatio: dpr,
          phi: interaction.current.phi, theta: .18, dark: 1, diffuse: 1.8,
          mapSamples: 10000, mapBrightness: 5, mapBaseBrightness: .03,
          baseColor: [.18, .045, .27], markerColor: [.85, .94, .44], glowColor: [.3, .045, .5], markers: [],
        });
        setStatus('ready'); sync();
      } catch { if (!disposed) setStatus('unavailable'); }
    };
    const visibility = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) void initialize();
      sync();
    }, { threshold: .01 });
    visibility.observe(element);
    const size = new ResizeObserver(resize);
    size.observe(element);
    document.addEventListener('visibilitychange', sync);
    preference.addEventListener('change', sync);
    return () => {
      disposed = true; cancelAnimationFrame(frame); visibility.disconnect(); size.disconnect();
      document.removeEventListener('visibilitychange', sync); preference.removeEventListener('change', sync);
      renderer.current?.destroy(); renderer.current = null;
    };
  }, []);

  const rotate = (amount: number) => { interaction.current.phi += amount; renderer.current?.update({ phi: interaction.current.phi }); };
  return <figure className={styles.figure}>
    <div ref={root} className={styles.globe} data-globe-state={status}>
      <div className={styles.fallback} aria-hidden="true"><span /><span /><span /></div>
      <canvas ref={canvas} className={styles.canvas} tabIndex={status === 'ready' ? 0 : -1} role="img" aria-label="Globo interativo ilustrativo. Arraste horizontalmente ou use as setas esquerda e direita para girar."
        onKeyDown={event => { if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); rotate(event.key === 'ArrowLeft' ? -.12 : .12); } }}
        onPointerDown={event => { interaction.current.dragging = true; interaction.current.x = event.clientX; event.currentTarget.setPointerCapture(event.pointerId); }}
        onPointerMove={event => { if (interaction.current.dragging) { rotate((event.clientX - interaction.current.x) * .006); interaction.current.x = event.clientX; } }}
        onPointerUp={() => { interaction.current.dragging = false; }} onPointerCancel={() => { interaction.current.dragging = false; }} onLostPointerCapture={() => { interaction.current.dragging = false; }} />
    </div>
    <figcaption className={styles.caption}><span>Uma conexão abre possibilidades.<small>Representação visual, sem indicação de unidades ou clientes.</small></span>
      {status !== 'unavailable' && <div className={styles.controls}><button type="button" aria-label={paused ? 'Retomar rotação do globo' : 'Pausar rotação do globo'} aria-pressed={paused} onClick={() => { pausedRef.current = !pausedRef.current; setPaused(pausedRef.current); syncRef.current(); }}>{paused ? <Play size={15} /> : <Pause size={15} />}</button><button type="button" aria-label="Girar globo para a esquerda" onClick={() => rotate(-.3)}><RotateCcw size={15} /></button></div>}
    </figcaption>
  </figure>;
}
