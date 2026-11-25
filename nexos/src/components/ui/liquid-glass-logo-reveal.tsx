'use client';

import { motionMedia } from '@/lib/motion-policy';

import { useEffect, useId, useRef, type RefObject } from 'react';
import { getPresentationRuntime } from './presentation-runtime';
import { cn } from '@/lib/utils';
import { createGlassRenderer, glassEnd, glassSettings, loadGlassLogo, type GlassTuning } from './glass-logo-engine';

/**
 * Glass-tile reveal adapted for photographic NFC plates from the 21st.dev
 * Liquid Glass Logo Reveal (MIT), based on zanwei/glass-icon-reveal (MIT).
 * The supplied snippet has malformed tokens and renders a 21st.dev mark;
 * this version refracts the actual plate photo, leaving its live QR untouched.
 */
const VERTEX = `#version 300 es
in vec2 aPosition;
void main() { gl_Position = vec4(aPosition, 0.0, 1.0); }`;

const FRAGMENT = `#version 300 es
precision highp float;
uniform sampler2D uPhoto;
uniform vec2 uResolution;
uniform vec4 uImageRect;
uniform float uTime;
out vec4 outColor;

float ease(float t) { t = clamp(t, 0.0, 1.0); return t * t * (3.0 - 2.0 * t); }
vec3 samplePhoto(vec2 p, vec2 offset) {
  vec2 uv = (p + offset - uImageRect.xy) / uImageRect.zw;
  return texture(uPhoto, vec2(uv.x, 1.0 - uv.y)).rgb;
}
void main() {
  vec2 p = vec2(gl_FragCoord.x, uResolution.y - gl_FragCoord.y) / uResolution;
  vec2 center = vec2(0.5, 0.48);
  vec2 q = (p - center) / vec2(0.46, 0.32);
  float grow = ease(uTime / 0.43);
  float size = mix(0.09, 1.0, grow);
  float shape = pow(pow(abs(q.x / size), 4.6) + pow(abs(q.y / size), 4.6), 1.0 / 4.6);
  float antialias = max(fwidth(shape), 0.006);
  float coverage = 1.0 - smoothstep(1.0 - antialias, 1.0 + antialias, shape);
  float rim = exp(-pow((shape - 0.92) / 0.085, 2.0));
  float softRim = exp(-pow((shape - 0.7) / 0.25, 2.0));
  float release = 1.0 - ease((uTime - 0.67) / 0.33);
  float lens = (0.018 * (1.0 - grow) + 0.011 * rim) * release;
  vec2 radial = normalize(q + vec2(0.0001));
  vec2 bend = radial * lens;
  vec3 color = vec3(
    samplePhoto(p, bend * 1.35).r,
    samplePhoto(p, bend).g,
    samplePhoto(p, bend * 0.55).b
  );
  vec2 light = normalize(vec2(-0.7, -0.7));
  float glint = pow(max(dot(-radial, light), 0.0), 2.0) * rim;
  color = mix(color, vec3(0.95, 0.89, 1.0), (0.24 * glint + 0.08 * softRim) * release);
  outColor = vec4(color, coverage * release * 0.94);
}`;

function createRenderer(canvas: HTMLCanvasElement, photo: HTMLImageElement) {
  const gl = canvas.getContext('webgl2', { alpha: true, antialias: false, premultipliedAlpha: false });
  if (!gl) return null;
  const shader = (type: number, source: string) => {
    const result = gl.createShader(type);
    if (!result) throw new Error('WebGL shader allocation failed');
    gl.shaderSource(result, source);
    gl.compileShader(result);
    if (!gl.getShaderParameter(result, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(result) || 'WebGL shader failed');
    return result;
  };
  const vertex = shader(gl.VERTEX_SHADER, VERTEX);
  const fragment = shader(gl.FRAGMENT_SHADER, FRAGMENT);
  const program = gl.createProgram();
  if (!program) return null;
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) || 'WebGL link failed');
  gl.useProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program, 'aPosition');
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

  const texture = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, photo);
  gl.uniform1i(gl.getUniformLocation(program, 'uPhoto'), 0);

  return {
    draw(time: number) {
      const frame = canvas.getBoundingClientRect();
      const image = photo.getBoundingClientRect();
      const dpr = Math.min(devicePixelRatio || 1, 1.5);
      const width = Math.max(1, Math.round(frame.width * dpr));
      const height = Math.max(1, Math.round(frame.height * dpr));
      if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
      gl.viewport(0, 0, width, height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform2f(gl.getUniformLocation(program, 'uResolution'), width, height);
      gl.uniform4f(gl.getUniformLocation(program, 'uImageRect'), (image.left - frame.left) / frame.width, (image.top - frame.top) / frame.height, image.width / frame.width, image.height / frame.height);
      gl.uniform1f(gl.getUniformLocation(program, 'uTime'), time);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
    dispose() {
      gl.deleteTexture(texture);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    },
  };
}

interface LiquidGlassLogoRevealProps {
  /** The existing, visible image stays in the DOM as a no-WebGL fallback. */
  imageRef: RefObject<HTMLImageElement | null>;
  className?: string;
}

export function LiquidGlassLogoReveal({ imageRef, className }: LiquidGlassLogoRevealProps) {
  const hostRef = useRef<HTMLSpanElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!host || !canvas || !image || motionMedia('(prefers-reduced-motion: reduce)').matches) return;
    let renderer: ReturnType<typeof createRenderer> = null;
    let frame = 0;
    let started = false;
    let cancelled = false;
    let visible = false;

    const begin = () => {
      if (started || cancelled || !visible || !image.complete || !image.naturalWidth) return;
      try { renderer = createRenderer(canvas, image); }
      catch (error) { console.warn('Plate glass reveal unavailable:', error); }
      if (!renderer) return;
      started = true;
      host.dataset.glassReveal = 'playing';
      const start = performance.now();
      const tick = (now: number) => {
        if (cancelled) return;
        const progress = Math.min(1, (now - start) / 2300);
        renderer?.draw(progress);
        if (progress < 1) frame = requestAnimationFrame(tick);
        else { host.dataset.glassReveal = 'complete'; renderer?.dispose(); renderer = null; }
      };
      frame = requestAnimationFrame(tick);
    };
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; if (visible) begin(); }, { threshold: 0.15 });
    observer.observe(host);
    image.addEventListener('load', begin);
    return () => {
      cancelled = true;
      observer.disconnect();
      image.removeEventListener('load', begin);
      cancelAnimationFrame(frame);
      renderer?.dispose();
    };
  }, [imageRef]);

  return <span ref={hostRef} className={cn('pointer-events-none absolute inset-0', className)} aria-hidden="true" data-glass-reveal="idle"><canvas ref={canvasRef} className="block size-full" /></span>;
}

/** White mascot reveal. The presentation owns the clock, exit and focus. */
export interface GlassIconRevealProps {
  logo: string;
  fallbackLogo?: string;
  fallbackMarkup?: string;
  cutoutLightDetails?: boolean;
  className?: string;
  label?: string;
  tileSize?: number;
  tuning?: Partial<GlassTuning>;
}

export function GlassIconReveal({ logo, fallbackLogo = logo, fallbackMarkup, cutoutLightDetails = false, className, label = 'Mascote ezway', tileSize = 256, tuning }: GlassIconRevealProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const logoCanvasRef = useRef<HTMLCanvasElement>(null);
  const maskId = useId().replace(/:/g, '');
  const tuningKey = JSON.stringify(tuning ?? {});
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const owner = host.closest<HTMLDialogElement>('[data-presentation]');
    if (owner && getPresentationRuntime(owner)) return;
    const settings = { ...glassSettings, tileSize, ...JSON.parse(tuningKey) };
    const canvas = logoCanvasRef.current;
    if (!canvas) return;
    canvas.setAttribute('aria-hidden', 'true');
    canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
    let renderer: ReturnType<typeof createGlassRenderer> = null;
    let disposed = false, ready = false, visible = true, lost = false;
    let frame = 0;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const dialog = host.closest<HTMLDialogElement>('[data-presentation]');
    const value = dialog ? getComputedStyle(dialog).getPropertyValue('--entry-duration').trim() : '5000ms';
    const duration = (parseFloat(value) || 5000) * (value.endsWith('ms') ? 1 : 1000);
    // Anchored before texture preparation, so a late asset cannot extend the opening.
    const started = performance.now();
    const stop = () => { cancelAnimationFrame(frame); frame = 0; };
    const fail = () => { stop(); ready = false; host.dataset.logoReveal = 'fallback'; renderer?.dispose(); renderer = null; };
    const draw = (now: number) => {
      frame = 0;
      if (disposed || lost || !ready || !renderer || document.hidden || !visible) return;
      const elapsed = Math.min(1, Math.max(0, (now - started) / Math.min(duration, 2200)));
      renderer.render(reduced.matches ? glassEnd(settings) : elapsed * glassEnd(settings), settings);
      host.dataset.logoReveal = elapsed < 1 && !reduced.matches ? 'playing' : 'complete';
      if (elapsed < 1 && !reduced.matches) frame = requestAnimationFrame(draw);
    };
    const sync = () => {
      stop();
      if (!disposed && ready && visible && !document.hidden && !lost) frame = requestAnimationFrame(draw);
    };
    const initialize = async () => {
      try {
        // Build the alpha field before allocating GPU resources, and reuse it on replay.
        const data = await loadGlassLogo(logo, cutoutLightDetails);
        if (disposed || lost) return;
        renderer = createGlassRenderer(canvas);
        if (!renderer) { fail(); return; }
        renderer.setLogo(data); ready = true; sync();
      } catch { if (!disposed) fail(); }
    };
    const onLost = (event: Event) => { event.preventDefault(); lost = true; fail(); };
    const onRestored = () => { lost = false; void initialize(); };
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); });
    const resize = new ResizeObserver(sync);
    observer.observe(host); resize.observe(host);
    document.addEventListener('visibilitychange', sync);
    reduced.addEventListener('change', sync);
    canvas.addEventListener('webglcontextlost', onLost);
    canvas.addEventListener('webglcontextrestored', onRestored);
    host.dataset.logoReveal = 'loading';
    void initialize();
    return () => {
      disposed = true; stop(); observer.disconnect(); resize.disconnect();
      document.removeEventListener('visibilitychange', sync); reduced.removeEventListener('change', sync);
      canvas.removeEventListener('webglcontextlost', onLost); canvas.removeEventListener('webglcontextrestored', onRestored);
      renderer?.dispose();
    };
  }, [logo, cutoutLightDetails, tileSize, tuningKey]);

  return <div ref={hostRef} suppressHydrationWarning role="img" aria-label={label} data-logo-reveal="loading" className={cn('relative isolate overflow-hidden select-none', className)}>
    <canvas ref={logoCanvasRef} suppressHydrationWarning data-logo-canvas aria-hidden="true" className="absolute inset-0 block size-full" />
    <span data-logo-fallback suppressHydrationWarning aria-hidden="true" style={{ position: 'absolute', inset: 0, margin: 'auto', width: 'min(139px, 31.1%)', height: 'min(139px, 31.1%)', background: fallbackMarkup ? undefined : '#fff', mask: fallbackMarkup ? undefined : `url("${fallbackLogo}") center / contain no-repeat`, WebkitMask: fallbackMarkup ? undefined : `url("${fallbackLogo}") center / contain no-repeat` }} dangerouslySetInnerHTML={fallbackMarkup ? { __html: fallbackMarkup.replaceAll('__MASCOT_MASK__', maskId) } : undefined} />
  </div>;
}
