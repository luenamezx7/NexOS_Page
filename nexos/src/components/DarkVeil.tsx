'use client';

import { useEffect, useRef, type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { COMPOSITE, FIELD, QUAD_VERTEX } from './DarkVeil.shaders';
import './DarkVeil.css';

export interface DarkVeilProps extends HTMLAttributes<HTMLDivElement> {
  color?: string;
  speed?: number;
  scale?: number;
  rotation?: number;
  flow?: number;
  warp?: number;
  variation?: number;
  brightness?: number;
  sheen?: number;
  glow?: number;
  grain?: number;
  quality?: number;
  mouseInteraction?: boolean;
  mouseStrength?: number;
  intro?: boolean;
  fade?: number;
  opacity?: number;
  lightMode?: boolean;
  paused?: boolean;
  dpr?: number;
}

interface VeilProgram {
  program: WebGLProgram;
  uniforms: Record<string, WebGLUniformLocation | null>;
}

const INTRO_SECONDS = 1.8;
const MAX_FIELD_PIXELS = 900000;
const FRAME_INTERVAL = 1000 / 30;
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function variationOffsets(variation: number) {
  const n = Number(variation) || 0;
  if (!n) return [0, 0, 0];
  const wave = (k: number) => {
    const v = Math.sin(n * 12.9898 + k * 78.233) * 43758.5453;
    return v - Math.floor(v) - 0.5;
  };
  return [wave(1), wave(2), wave(3)];
}

function compile(gl: WebGL2RenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader;
  gl.deleteShader(shader);
  return null;
}

function link(gl: WebGL2RenderingContext, fragmentSource: string): VeilProgram | null {
  const vertex = compile(gl, gl.VERTEX_SHADER, QUAD_VERTEX);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, fragmentSource);
  const program = gl.createProgram();
  if (!vertex || !fragment || !program) {
    if (vertex) gl.deleteShader(vertex);
    if (fragment) gl.deleteShader(fragment);
    if (program) gl.deleteProgram(program);
    return null;
  }
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.bindAttribLocation(program, 0, 'aPosition');
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    return null;
  }
  const uniforms: VeilProgram['uniforms'] = {};
  const count: number = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
  for (let i = 0; i < count; i++) {
    const info = gl.getActiveUniform(program, i);
    if (info) uniforms[info.name] = gl.getUniformLocation(program, info.name);
  }
  return { program, uniforms };
}

/** React Bits DarkVeil, with typed props and a visibility-aware, resize-safe renderer. */
export function DarkVeil({
  color = '#6b12ff', speed = 0.5, scale = 1, rotation = 0, flow = 1, warp = 0,
  variation = 0, brightness = 1, sheen = 0, glow = 0.4, grain = 0.03,
  quality = 0.5, mouseInteraction = true, mouseStrength = 1, intro = true,
  fade = 0, opacity = 1, lightMode = false, paused = false, dpr, className, ...rest
}: DarkVeilProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wakeRef = useRef<(() => void) | null>(null);
  const settings = {
    color: String(color), speed, scale: Math.max(0.1, scale), rotation,
    flow: Math.max(0, flow), warp: Math.max(0, warp), variation,
    brightness: Math.max(0, brightness), sheen: Math.max(0, sheen), glow: Math.max(0, glow),
    grain: Math.max(0, grain), quality: clamp(quality, 0.25, 1), mouseInteraction,
    mouseStrength: Math.max(0, mouseStrength), intro, fade: clamp(fade, 0, 1),
    opacity: clamp(opacity, 0, 1), lightMode, paused, dpr,
  };
  const settingsRef = useRef(settings);

  useEffect(() => {
    settingsRef.current = settings;
    wakeRef.current?.();
  });

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;
    const setRenderState = (value: string) => {
      if (container.dataset.renderState !== value) container.dataset.renderState = value;
    };
    let gl: WebGL2RenderingContext | null;
    try {
      gl = canvas.getContext('webgl2', {
        alpha: true, premultipliedAlpha: true, antialias: false,
        depth: false, stencil: false, powerPreference: 'high-performance',
      });
    } catch { gl = null; }
    if (!gl) { setRenderState('unavailable'); return; }
    const context = gl;
    const floatTargets = Boolean(context.getExtension('EXT_color_buffer_float'));
    const fieldProgram = link(context, FIELD);
    const compositeProgram = link(context, COMPOSITE);
    if (!fieldProgram || !compositeProgram) {
      if (fieldProgram) context.deleteProgram(fieldProgram.program);
      if (compositeProgram) context.deleteProgram(compositeProgram.program);
      setRenderState('unavailable');
      return;
    }

    const buffer = context.createBuffer();
    const vao = context.createVertexArray();
    const texture = context.createTexture();
    const framebuffer = context.createFramebuffer();
    const release = () => {
      context.bindFramebuffer(context.FRAMEBUFFER, null);
      context.bindVertexArray(null);
      context.deleteTexture(texture);
      context.deleteFramebuffer(framebuffer);
      context.deleteProgram(fieldProgram.program);
      context.deleteProgram(compositeProgram.program);
      context.deleteBuffer(buffer);
      context.deleteVertexArray(vao);
    };
    if (!buffer || !vao || !texture || !framebuffer) {
      release(); setRenderState('unavailable'); return;
    }
    context.bindVertexArray(vao);
    context.bindBuffer(context.ARRAY_BUFFER, buffer);
    context.bufferData(context.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), context.STATIC_DRAW);
    context.enableVertexAttribArray(0);
    context.vertexAttribPointer(0, 2, context.FLOAT, false, 0, 0);

    const target = { width: 0, height: 0 };
    const sizeTarget = (width: number, height: number) => {
      if (target.width === width && target.height === height) return;
      target.width = width; target.height = height;
      context.activeTexture(context.TEXTURE0);
      context.bindTexture(context.TEXTURE_2D, texture);
      // texStorage2D is immutable and fails on a second resize. Mutable storage
      // lets the same framebuffer safely follow desktop/mobile orientation changes.
      context.texImage2D(context.TEXTURE_2D, 0, floatTargets ? context.RGBA16F : context.RGBA8,
        width, height, 0, context.RGBA, floatTargets ? context.HALF_FLOAT : context.UNSIGNED_BYTE, null);
      context.texParameteri(context.TEXTURE_2D, context.TEXTURE_MIN_FILTER, context.LINEAR_MIPMAP_LINEAR);
      context.texParameteri(context.TEXTURE_2D, context.TEXTURE_MAG_FILTER, context.LINEAR);
      context.texParameteri(context.TEXTURE_2D, context.TEXTURE_WRAP_S, context.CLAMP_TO_EDGE);
      context.texParameteri(context.TEXTURE_2D, context.TEXTURE_WRAP_T, context.CLAMP_TO_EDGE);
      context.bindFramebuffer(context.FRAMEBUFFER, framebuffer);
      context.framebufferTexture2D(context.FRAMEBUFFER, context.COLOR_ATTACHMENT0, context.TEXTURE_2D, texture, 0);
    };

    const probe = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    const colorCache = new Map<string, number[]>();
    const toLinear = (value: string) => {
      const cached = colorCache.get(value);
      if (cached) return cached;
      let rgb = [1, 1, 1];
      if (probe) {
        probe.clearRect(0, 0, 1, 1);
        probe.fillStyle = '#ffffff'; probe.fillStyle = value;
        probe.fillRect(0, 0, 1, 1);
        const [r, g, b] = probe.getImageData(0, 0, 1, 1).data;
        rgb = [r, g, b].map(v => Math.pow(v / 255, 2.2));
      }
      colorCache.set(value, rgb);
      return rgb;
    };
    const view = { width: 1, height: 1, fieldWidth: 1, fieldHeight: 1 };
    const pointer = { x: 0, y: 0, inside: false };
    const state = {
      clock: 0, intro: settingsRef.current.intro && !reduce.matches && !settingsRef.current.paused ? 0 : 1,
      touch: 0, x: 0, y: 0, dragX: 0, dragY: 0, lightX: 0.5, lightY: 0.15,
    };
    let raf = 0, last = 0, visible = false, disposed = false, lost = false;

    const render = () => {
      if (disposed || lost) return;
      const s = settingsRef.current;
      const presence = state.intro ** 3 * (state.intro * (state.intro * 6 - 15) + 10);
      context.bindVertexArray(vao);
      sizeTarget(view.fieldWidth, view.fieldHeight);
      const f = fieldProgram.uniforms;
      context.bindFramebuffer(context.FRAMEBUFFER, framebuffer);
      context.viewport(0, 0, target.width, target.height);
      context.useProgram(fieldProgram.program);
      const angle = s.rotation * Math.PI / 180;
      const [sx, sy, sz] = variationOffsets(s.variation);
      context.uniform2f(f.uView, view.width, view.height);
      context.uniform2f(f.uScale, view.width / target.width, view.height / target.height);
      context.uniform1f(f.uZoom, s.scale);
      context.uniform2f(f.uTurn, Math.cos(angle), Math.sin(angle));
      context.uniform1f(f.uTime, state.clock);
      context.uniform1f(f.uFlow, s.flow);
      context.uniform1f(f.uWarp, s.warp);
      context.uniform3f(f.uSeed, 0.3948333106474662 + sx, 0.36 + sy, 0.14 + sz);
      context.uniform4f(f.uPointer, state.x, state.y, state.touch * s.mouseStrength * 0.9, 0.42);
      context.uniform2f(f.uDrag, state.dragX * 2 / view.height, state.dragY * 2 / view.height);
      context.uniform1f(f.uUnfold, (1 - presence) * 0.45);
      context.uniform1f(f.uDither, floatTargets ? 0 : 1 / 255);
      context.drawArrays(context.TRIANGLES, 0, 3);
      context.bindTexture(context.TEXTURE_2D, texture);
      context.generateMipmap(context.TEXTURE_2D);

      const c = compositeProgram.uniforms;
      const tint = toLinear(s.color);
      const tone = 0.2126 * tint[0] + 0.7152 * tint[1] + 0.0722 * tint[2];
      const depth = Math.min(1, 0.2 / Math.max(tone, 0.001));
      const ink = tint.map(v => Math.pow(Math.min(1, v * depth), 1 / 2.2));
      context.bindFramebuffer(context.FRAMEBUFFER, null);
      context.viewport(0, 0, canvas.width, canvas.height);
      context.useProgram(compositeProgram.program);
      context.uniform2f(c.uResolution, canvas.width, canvas.height);
      context.uniform2f(c.uTexel, 1 / target.width, 1 / target.height);
      context.uniform3fv(c.uColor, tint);
      context.uniform3fv(c.uInk, ink);
      context.uniform1f(c.uGain, 1.15 * s.brightness);
      context.uniform1f(c.uSheen, 0.5 * s.sheen);
      context.uniform1f(c.uGlow, s.glow);
      context.uniform1f(c.uPresence, presence);
      context.uniform1f(c.uGrain, s.grain);
      context.uniform1f(c.uFade, s.fade);
      context.uniform1f(c.uOpacity, s.opacity);
      context.uniform1f(c.uTime, state.clock % 1000);
      context.uniform1f(c.uLightMode, s.lightMode ? 1 : 0);
      context.uniform4f(c.uLight, state.lightX * view.width / view.height, 1 - state.lightY, state.touch * s.mouseStrength, 0);
      context.activeTexture(context.TEXTURE0);
      context.bindTexture(context.TEXTURE_2D, texture);
      context.uniform1i(c.uField, 0);
      context.drawArrays(context.TRIANGLES, 0, 3);
    };

    const frame = (now: number) => {
      raf = 0;
      if (disposed || lost || !visible || document.hidden) return;
      if (last && now - last < FRAME_INTERVAL) { raf = requestAnimationFrame(frame); return; }
      const s = settingsRef.current;
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 30;
      last = now;
      const moving = !s.paused && !reduce.matches && s.speed !== 0;
      if (moving) state.clock += dt * s.speed;
      if (!s.intro || reduce.matches || s.paused) state.intro = 1;
      else if (state.intro < 1) state.intro = Math.min(1, state.intro + dt / INTRO_SECONDS);
      const engaged = s.mouseInteraction && pointer.inside && !reduce.matches && !s.paused;
      if (engaged && state.touch < 0.01) { state.x = pointer.x; state.y = pointer.y; }
      const follow = 1 - Math.exp(-dt * 9);
      const prevX = state.x, prevY = state.y;
      state.x += (pointer.x - state.x) * follow;
      state.y += (pointer.y - state.y) * follow;
      const velX = (state.x - prevX) / Math.max(dt, 0.001);
      const velY = (state.y - prevY) / Math.max(dt, 0.001);
      const dragBlend = 1 - Math.exp(-dt * 5);
      state.dragX += (clamp(velX * 0.12, -120, 120) - state.dragX) * dragBlend;
      state.dragY += (clamp(-velY * 0.12, -120, 120) - state.dragY) * dragBlend;
      state.touch += ((engaged ? 1 : 0) - state.touch) * (1 - Math.exp(-dt * (engaged ? 3 : 1.6)));
      const lightGoalX = engaged ? pointer.x / view.width : 0.5;
      const lightGoalY = engaged ? pointer.y / view.height : 0.15;
      const lightFollow = 1 - Math.exp(-dt * 4);
      state.lightX += (lightGoalX - state.lightX) * lightFollow;
      state.lightY += (lightGoalY - state.lightY) * lightFollow;
      render();
      setRenderState(moving ? 'animated' : 'static');
      const settling = !reduce.matches && !s.paused && (
        state.intro < 1 || Math.abs((engaged ? 1 : 0) - state.touch) > 0.002 ||
        Math.abs(state.dragX) + Math.abs(state.dragY) > 0.05 ||
        Math.abs(pointer.x - state.x) + Math.abs(pointer.y - state.y) > 0.3 ||
        Math.abs(lightGoalX - state.lightX) + Math.abs(lightGoalY - state.lightY) > 0.0005
      );
      if (moving || settling) raf = requestAnimationFrame(frame);
      else last = 0;
    };
    const wake = () => {
      if (!raf && visible && !document.hidden && !disposed && !lost) raf = requestAnimationFrame(frame);
    };
    const stop = () => { cancelAnimationFrame(raf); raf = 0; last = 0; };
    const resize = () => {
      const s = settingsRef.current;
      const width = Math.max(1, container.clientWidth), height = Math.max(1, container.clientHeight);
      const ratio = clamp(s.dpr || window.devicePixelRatio || 1, 0.25, 2);
      view.width = width; view.height = height;
      canvas.width = Math.max(1, Math.round(width * ratio));
      canvas.height = Math.max(1, Math.round(height * ratio));
      const fieldScale = Math.min(s.quality, Math.sqrt(MAX_FIELD_PIXELS / (width * height)));
      view.fieldWidth = Math.max(1, Math.round(width * fieldScale));
      view.fieldHeight = Math.max(1, Math.round(height * fieldScale));
      if (!raf) render();
      wake();
    };
    const onPointerMove = (event: PointerEvent) => {
      if (!settingsRef.current.mouseInteraction || reduce.matches || settingsRef.current.paused) return;
      const rect = container.getBoundingClientRect();
      pointer.x = event.clientX - rect.left; pointer.y = event.clientY - rect.top;
      pointer.inside = pointer.x >= 0 && pointer.y >= 0 && pointer.x <= rect.width && pointer.y <= rect.height;
      wake();
    };
    const onPointerLeave = () => { pointer.inside = false; wake(); };
    const onVisibility = () => {
      stop();
      if (document.hidden) setRenderState('paused');
      else wake();
    };
    const onReducedMotion = () => { stop(); pointer.inside = false; wake(); };
    const onContextLost = (event: Event) => { event.preventDefault(); lost = true; stop(); setRenderState('unavailable'); };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    const intersection = new IntersectionObserver(entries => {
      visible = entries.some(entry => entry.isIntersecting);
      stop();
      if (visible) wake();
      else setRenderState('paused');
    });
    intersection.observe(container);
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', onPointerLeave);
    document.addEventListener('visibilitychange', onVisibility);
    reduce.addEventListener('change', onReducedMotion);
    canvas.addEventListener('webglcontextlost', onContextLost);
    resize();

    let lastQuality = settingsRef.current.quality, lastDpr = settingsRef.current.dpr;
    wakeRef.current = () => {
      const s = settingsRef.current;
      if (s.quality !== lastQuality || s.dpr !== lastDpr) {
        lastQuality = s.quality; lastDpr = s.dpr; resize();
      } else { if (!raf && visible) render(); wake(); }
    };
    return () => {
      disposed = true; stop(); wakeRef.current = null;
      resizeObserver.disconnect(); intersection.disconnect();
      window.removeEventListener('pointermove', onPointerMove);
      document.documentElement.removeEventListener('pointerleave', onPointerLeave);
      document.removeEventListener('visibilitychange', onVisibility);
      reduce.removeEventListener('change', onReducedMotion);
      canvas.removeEventListener('webglcontextlost', onContextLost);
      release();
      // Strict Mode reuses the canvas on effect replay: keep the context alive.
    };
  }, []);

  return (
    <div ref={containerRef} className={cn('dark-veil-container', className)} data-dark-veil {...rest}>
      <canvas ref={canvasRef} className="dark-veil-canvas" aria-hidden="true" />
    </div>
  );
}

export default DarkVeil;
