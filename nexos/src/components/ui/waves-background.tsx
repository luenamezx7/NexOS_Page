'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { WavesOptions, WavesRenderer, WavesState } from '@/lib/waves-renderer';

/** WebGL1 on an OffscreenCanvas worker when available; native main-thread fallback. */
export function WavesBackground({ active, paused = false, onPaused }: { active: boolean; paused?: boolean; onPaused?: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pausedRef = useRef(paused);
  const updateRef = useRef<(() => void) | undefined>(undefined);
  const onPausedRef = useRef(onPaused);
  const [mainThread, setMainThread] = useState(false);

  useLayoutEffect(() => { onPausedRef.current = onPaused; }, [onPaused]);

  useLayoutEffect(() => {
    pausedRef.current = paused;
    const state = canvasRef.current?.dataset.state;
    if (paused && (!active || !updateRef.current || state === 'fallback' || state === 'context-lost')) onPausedRef.current?.();
    else updateRef.current?.();
  }, [paused, active]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !active) return;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)');
    let disposed = false;
    let worker: Worker | undefined;
    let renderer: WavesRenderer | undefined;
    const state = (next: WavesState) => {
      if (disposed) return;
      canvas.dataset.state = next;
      if (pausedRef.current && ['paused', 'pending', 'fallback', 'context-lost'].includes(next)) onPausedRef.current?.();
      if (canvas.dataset.renderer === 'main') {
        canvas.dataset.bufferWidth = String(canvas.width);
        canvas.dataset.bufferHeight = String(canvas.height);
      }
    };
    const dimensions = () => {
      const bounds = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      return { width: Math.max(1, Math.round(bounds.width * dpr)), height: Math.max(1, Math.round(bounds.height * dpr)) };
    };
    const options = (): WavesOptions => ({ ...dimensions(), visible: !document.hidden && !pausedRef.current, reduced: reduce.matches });
    function update() {
      if (disposed) return;
      if (worker) worker.postMessage({ type: 'update', options: options() });
      else renderer?.update(options());
    }
    updateRef.current = update;

    const useWorker = !mainThread && typeof Worker !== 'undefined' && typeof canvas.transferControlToOffscreen === 'function';
    if (useWorker) {
      try {
        worker = new Worker(new URL('./waves.worker.ts', import.meta.url), { type: 'module' });
        worker.onmessage = ({ data }: MessageEvent<{ type: string; state: WavesState; width: number; height: number }>) => {
          if (disposed || data.type !== 'state') return;
          if (data.state === 'fallback') setMainThread(true);
          else {
            state(data.state);
            canvas.dataset.bufferWidth = String(data.width);
            canvas.dataset.bufferHeight = String(data.height);
          }
        };
        worker.onerror = () => { if (!disposed) setMainThread(true); };
        const offscreen = canvas.transferControlToOffscreen();
        canvas.dataset.renderer = 'worker';
        worker.postMessage({ type: 'init', canvas: offscreen, options: options() }, [offscreen]);
      } catch {
        worker?.terminate();
        worker = undefined;
        // A fresh canvas is needed if ownership was transferred before failure.
        queueMicrotask(() => { if (!disposed) setMainThread(true); });
      }
    } else {
      canvas.dataset.renderer = 'main';
      void import('@/lib/waves-renderer').then(({ createWavesRenderer }) => {
        if (!disposed) renderer = createWavesRenderer(canvas, options(), state);
      }).catch(() => state('fallback'));
    }

    const observer = new ResizeObserver(update);
    observer.observe(canvas);
    document.addEventListener('visibilitychange', update);
    reduce.addEventListener('change', update);
    return () => {
      disposed = true;
      if (updateRef.current === update) updateRef.current = undefined;
      observer.disconnect();
      document.removeEventListener('visibilitychange', update);
      reduce.removeEventListener('change', update);
      worker?.terminate();
      renderer?.destroy();
    };
  }, [active, mainThread]);

  return <canvas key={mainThread ? 'main' : 'worker'} ref={canvasRef} className="waves-entry-canvas" data-waves-background="" data-state="pending" aria-hidden="true" />;
}
