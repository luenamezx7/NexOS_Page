import { createSilkBackground } from '../auth/silk-background-engine';
import { createGlassRenderer, glassEnd, glassSettings, makeGlassLogo, type LogoData } from './glass-logo-engine';

interface PresentationRuntime { startedAt: number; dispose: () => void; mode?: 'worker' | 'main'; metrics?: { frames: number; max: number; p95: number }; }
declare global {
  interface Window { __ezwayPresentations?: WeakMap<HTMLDialogElement, PresentationRuntime>; }
}
export function getPresentationRuntime(dialog: HTMLDialogElement) {
  return window.__ezwayPresentations?.get(dialog);
}

function startWorkerPresentation(dialog: HTMLDialogElement, silk: HTMLCanvasElement, logo: HTMLCanvasElement, host: HTMLElement): PresentationRuntime | undefined {
  if (typeof Worker === 'undefined' || typeof logo.transferControlToOffscreen !== 'function') return;
  const background = () => ({ width: silk.clientWidth, height: silk.clientHeight, dpr: Math.min(devicePixelRatio || 1, 2) });
  const foreground = () => ({ width: logo.clientWidth, height: logo.clientHeight, dpr: Math.min(devicePixelRatio || 1, 2) });
  let worker: Worker;
  try { worker = new Worker('/presentation-worker.js'); } catch { return; }
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const state = () => ({ background: background(), foreground: foreground(), reduced: reduced.matches, paused: document.hidden });
  const resize = new ResizeObserver(() => worker.postMessage({ type: 'resize', ...state() }));
  const sync = () => worker.postMessage({ type: 'pause', ...state() });
  const fail = () => { host.dataset.logoReveal = 'fallback'; silk.dataset.silkState = 'fallback'; worker.terminate(); };
  const registry = window.__ezwayPresentations ??= new WeakMap();
  const runtime: PresentationRuntime = { startedAt: performance.now(), mode: 'worker', dispose: () => {
    resize.disconnect(); document.removeEventListener('visibilitychange', sync); reduced.removeEventListener('change', sync);
    worker.terminate(); registry.delete(dialog);
  } };
  worker.onmessage = ({data}) => {
    if (data.type === 'ready') {
      runtime.startedAt = data.epoch - performance.timeOrigin;
      dialog.dispatchEvent(new Event('nexos-presentation-ready'));
    } else if (data.type === 'state') {
      host.dataset.logoReveal = data.phase; host.dataset.eyeBlink = data.eye;
    } else if (data.type === 'metrics') runtime.metrics = { frames: data.frames, max: data.max, p95: data.p95 };
    else if (data.type === 'failure') fail();
  };
  worker.onerror = fail;
  try {
    const b = background(), f = foreground();
    silk.width = Math.max(1,Math.round(b.width*b.dpr)); silk.height = Math.max(1,Math.round(b.height*b.dpr));
    logo.width = Math.max(1,Math.round(f.width*f.dpr)); logo.height = Math.max(1,Math.round(f.height*f.dpr));
    const silkOffscreen = silk.transferControlToOffscreen(), logoOffscreen = logo.transferControlToOffscreen();
    registry.set(dialog, runtime);
    // The actual canvases are visible from the first worker draw; no DOM message
    // or React commit is needed to keep their frames moving during hydration.
    silk.dataset.silkState = reduced.matches ? 'static' : 'running'; host.dataset.logoReveal = 'playing';
    worker.postMessage({ type: 'init', silk: silkOffscreen, logo: logoOffscreen, ...state() }, [silkOffscreen, logoOffscreen]);
    resize.observe(host); resize.observe(silk);
    document.addEventListener('visibilitychange', sync); reduced.addEventListener('change', sync);
    return runtime;
  } catch { fail(); registry.set(dialog,runtime); return runtime; }
}

let cachedLogo: LogoData | undefined;
/** Rasterize the actual brand paths synchronously: no image request or decode stage. */
function logoFromPaths(host: HTMLElement) {
  if (cachedLogo) return cachedLogo;
  const mask = host.querySelector('mask');
  if (!mask) throw new Error('Mascot paths missing');
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;
  const eyes = document.createElement('canvas');
  eyes.width = eyes.height = 1024;
  const eyesCtx = eyes.getContext('2d')!;
  ctx.scale(1024 / 770, 1024 / 770); ctx.translate(-240, -215);
  const paint = (element: Element) => {
    if (element.classList.contains('ezway-intro-fire-still')) return;
    ctx.save();
    const translation = element.getAttribute('transform')?.match(/translate\(\s*([-\d.]+)[,\s]+([-\d.]+)\s*\)/);
    if (translation) ctx.translate(Number(translation[1]), Number(translation[2]));
    if (element.tagName.toLowerCase() === 'path') {
      const white = element.getAttribute('fill') === '#fff';
      const path = new Path2D(element.getAttribute('d') || '');
      if (element.closest('.eye-ezway-intro-blink')) {
        eyesCtx.setTransform(ctx.getTransform()); eyesCtx.fillStyle = '#fff'; eyesCtx.fill(path);
      } else {
        ctx.globalCompositeOperation = white ? 'source-over' : 'destination-out';
        ctx.fillStyle = '#fff'; ctx.fill(path);
      }
    }
    for (const child of element.children) paint(child);
    ctx.restore();
  };
  for (const child of mask.children) paint(child);
  cachedLogo = makeGlassLogo(canvas, canvas.width, canvas.height, eyes);
  return cachedLogo;
}

/** A single renderer starts while HTML is parsed; hydration adopts it without replay. */
export function startPresentationRuntime(dialog: HTMLDialogElement): PresentationRuntime | undefined {
  const existing = getPresentationRuntime(dialog);
  if (existing) return existing;
  const silkCanvas = dialog.querySelector<HTMLCanvasElement>('[data-silk-background]');
  const canvas = dialog.querySelector<HTMLCanvasElement>('[data-logo-canvas]');
  const host = dialog.querySelector<HTMLElement>('[data-logo-reveal]');
  if (!silkCanvas || !canvas || !host) return;
  const offscreen = startWorkerPresentation(dialog, silkCanvas, canvas, host);
  if (offscreen) return offscreen;
  const silk = createSilkBackground(silkCanvas);
  let renderer: ReturnType<typeof createGlassRenderer> = null;
  let frame = 0, disposed = false;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const settings = { ...glassSettings };
  const stop = () => { cancelAnimationFrame(frame); frame = 0; };
  try {
    const logo = logoFromPaths(host);
    renderer = createGlassRenderer(canvas);
    renderer?.setLogo(logo);
  } catch { renderer?.dispose(); renderer = null; }
  // Start the clock only after both full-resolution renderers exist. This synchronous
  // setup runs in the parser script, before React's chunks or the first content paint.
  const startedAt = performance.now();
  const native = host.querySelector<HTMLElement>('[data-logo-fallback]');
  const fitNative = () => {
    const tile = Math.min(settings.tileSize, Math.min(host.clientWidth, host.clientHeight) / 1.75);
    if (native) native.style.width = native.style.height = `${tile * .7 * .69 * .955 * 770 / 658}px`;
  };
  const draw = (now: number) => {
    frame = 0;
    if (disposed || document.hidden) return;
    const elapsed = Math.max(0, now - startedAt);
    const t = Math.min(1, elapsed / 2200);
    if (!renderer) { host.dataset.logoReveal = 'fallback'; fitNative(); return; }
    let blink = 1;
    const ease = (n: number) => n * n * (3 - 2 * n);
    if (!reduced.matches) {
      if (elapsed >= 2600 && elapsed < 2850) blink = 1 - .955 * ease((elapsed - 2600) / 250);
      else if (elapsed >= 2850 && elapsed < 3050) blink = .045;
      else if (elapsed >= 3050 && elapsed < 3400) blink = .045 + .955 * ease((elapsed - 3050) / 350);
    }
    renderer.render(reduced.matches ? glassEnd(settings) : t * glassEnd(settings), settings, blink);
    // Attributes describe progress only; the same canvas stays visible throughout.
    host.dataset.logoReveal = t < 1 && !reduced.matches ? 'playing' : 'complete';
    host.dataset.eyeBlink = blink < .2 ? 'closed' : blink > .95 ? 'open' : 'moving';
    if (elapsed < 5000 && !reduced.matches) frame = requestAnimationFrame(draw);
  };
  const sync = () => { stop(); if (!disposed && !document.hidden) draw(performance.now()); };
  const onLost = (event: Event) => {
    event.preventDefault(); stop(); renderer?.dispose(); renderer = null;
    host.dataset.logoReveal = 'fallback'; fitNative();
  };
  const resize = new ResizeObserver(sync);
  resize.observe(host);
  document.addEventListener('visibilitychange', sync);
  reduced.addEventListener('change', sync);
  canvas.addEventListener('webglcontextlost', onLost);
  const registry = window.__ezwayPresentations ??= new WeakMap();
  const runtime = { startedAt, dispose: () => {
    disposed = true; stop(); resize.disconnect(); renderer?.dispose(); silk.dispose();
    document.removeEventListener('visibilitychange', sync); reduced.removeEventListener('change', sync);
    canvas.removeEventListener('webglcontextlost', onLost); registry.delete(dialog);
  } };
  registry.set(dialog, runtime);
  draw(startedAt + 1);
  return runtime;
}
