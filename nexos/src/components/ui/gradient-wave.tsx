'use client';

import { motionMedia } from '@/lib/motion-policy';

import { useEffect, useMemo, useRef, type CSSProperties } from 'react';
import { cn } from '@/lib/utils';
import { motionError, recordMotion } from '@/lib/motion-diagnostics';
import type { Gradient, WaveOptions } from './gradient-wave-renderer';
import styles from './gradient-wave.module.css';

const defaultColors = ['#38bdf8', '#ffffff', '#38bdf8', '#ffffff', '#38bdf8', '#ffffff'];

export interface GradientWaveProps {
  colors?: readonly string[];
  isPlaying?: boolean;
  className?: string;
  shadowPower?: number;
  darkenTop?: boolean;
  noiseSpeed?: number;
  noiseFrequency?: readonly [number, number];
  deform?: Partial<WaveOptions['deform']>;
}

/** Decorative MiniGl-style waves, adapted for a measured host and React's lifecycle. */
export function GradientWave({ colors = defaultColors, isPlaying = true, className, shadowPower = 8, darkenTop = false, noiseSpeed = .00001, noiseFrequency = [.0001, .0009], deform }: GradientWaveProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<Gradient | null>(null);
  const syncRef = useRef<(() => void) | null>(null);
  const playingRef = useRef(isPlaying);
  // Values, rather than array/object identity, control uniform updates. Never recreate WebGL on a caption render.
  const paletteKey = colors.filter(color => /^#[\da-f]{6}$/i.test(color)).slice(0, 8).join(',') || defaultColors.join(',');
  const { incline = .5, offsetTop = -.5, offsetBottom = -.5, noiseFreq = [3, 4], noiseAmp = 250, noiseSpeed: deformSpeed = 10, noiseFlow = 5, noiseSeed = 5 } = deform ?? {};
  const options = useMemo<WaveOptions>(() => ({
    colors: paletteKey.split(','), shadowPower, darkenTop, noiseSpeed,
    noiseFrequency: [noiseFrequency[0], noiseFrequency[1]],
    deform: { incline, offsetTop, offsetBottom, noiseFreq: [noiseFreq[0], noiseFreq[1]], noiseAmp, noiseSpeed: deformSpeed, noiseFlow, noiseSeed },
    // Tuples are compared by their scalar values, including when callers pass inline props.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [paletteKey, shadowPower, darkenTop, noiseSpeed, noiseFrequency[0], noiseFrequency[1], incline, offsetTop, offsetBottom, noiseFreq[0], noiseFreq[1], noiseAmp, deformSpeed, noiseFlow, noiseSeed]);
  const optionsRef = useRef(options);

  useEffect(() => {
    optionsRef.current = options;
    rendererRef.current?.update(options);
    rendererRef.current?.render();
  }, [options]);

  useEffect(() => {
    playingRef.current = isPlaying;
    syncRef.current?.();
  }, [isPlaying]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const canvas = host.querySelector('canvas')!;
    const reduce = motionMedia('(prefers-reduced-motion: reduce)');
    const lowPower = matchMedia('(pointer: coarse)').matches;
    let disposed = false, visible = false, loading = false, contextLost = false;
    const measure = () => {
      if (contextLost) return;
      rendererRef.current?.resize(host.clientWidth, host.clientHeight);
      rendererRef.current?.render();
    };
    const initialize = async () => {
      if (disposed || loading || rendererRef.current || reduce.matches || !visible || document.hidden) return;
      loading = true;
      host.dataset.waveState = 'loading';
      try {
        const { Gradient } = await import('./gradient-wave-renderer');
        if (disposed || reduce.matches || !visible || document.hidden) return;
        rendererRef.current = new Gradient(canvas, optionsRef.current, lowPower);
        canvas.style.opacity = '1';
        measure();
        sync();
      } catch (error) {
        canvas.style.opacity = '0';
        host.dataset.waveState = 'fallback';
        recordMotion('gradientWave', 'fallback', motionError(error));
      } finally { loading = false; }
    };
    const sync = () => {
      if (disposed) return;
      host.dataset.waveActive = String(visible && !document.hidden && playingRef.current && !reduce.matches);
      if (reduce.matches) {
        rendererRef.current?.stop();
        canvas.style.opacity = '0';
        host.dataset.waveState = 'static';
      } else if (rendererRef.current && !contextLost) {
        canvas.style.opacity = '1';
        const play = visible && !document.hidden && playingRef.current;
        if (play) rendererRef.current.start();
        else rendererRef.current.stop();
        host.dataset.waveState = play ? 'running' : 'paused';
      } else { void initialize(); }
    };
    const lost = (event: Event) => {
      event.preventDefault();
      contextLost = true;
      rendererRef.current?.stop();
      canvas.style.opacity = '0';
      host.dataset.waveState = 'fallback';
    };
    const restored = () => {
      // The browser has invalidated all old resources; rebuild against the restored context.
      rendererRef.current = null;
      contextLost = false;
      sync();
    };
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); }, { threshold: .01 });
    const resize = new ResizeObserver(measure);
    observer.observe(host);
    resize.observe(host);
    reduce.addEventListener('change', sync);
    document.addEventListener('visibilitychange', sync);
    window.addEventListener('resize', measure);
    canvas.addEventListener('webglcontextlost', lost);
    canvas.addEventListener('webglcontextrestored', restored);
    syncRef.current = sync;
    sync();
    return () => {
      disposed = true;
      observer.disconnect(); resize.disconnect();
      reduce.removeEventListener('change', sync);
      document.removeEventListener('visibilitychange', sync);
      window.removeEventListener('resize', measure);
      canvas.removeEventListener('webglcontextlost', lost);
      canvas.removeEventListener('webglcontextrestored', restored);
      rendererRef.current?.dispose(); rendererRef.current = null;
      syncRef.current = null;
    };
  }, []);

  const fallback = { '--wave-fallback': `linear-gradient(125deg, ${options.colors.join(', ')})` } as CSSProperties;
  return <div ref={hostRef} className={cn(styles.root, className)} style={fallback} aria-hidden="true" data-gradient-wave data-wave-state="idle">
    <span className={styles.fallback} />
    <canvas className={styles.canvas} data-gradient-canvas />
  </div>;
}
