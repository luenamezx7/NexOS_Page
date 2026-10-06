'use client';

import { Sparkles } from 'lucide-react';
import { forwardRef, useEffect, useRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { FRAGMENT_SHADER, VERTEX_SHADER } from './metallic-button-shaders';
import styles from './metallic-button.module.css';
import { useTheme } from '@/components/ThemeProvider';

interface MetallicShaderUniforms {
  colorBack: string; colorTint: string; repetition: number; softness: number; angle: number;
  scale: number; distortion: number; shiftRed: number; shiftBlue: number;
}

export function parseColor(value: string): [number, number, number, number] {
  let hex = value.trim().replace(/^#/, '');
  if (hex.length === 3 || hex.length === 4) hex = [...hex].map(c => c + c).join('');
  if (hex.length === 6) hex += 'ff';
  if (!/^[\da-f]{8}$/i.test(hex)) return [1, 1, 1, 1];
  return [0, 2, 4, 6].map(offset => parseInt(hex.slice(offset, offset + 2), 16) / 255) as [number, number, number, number];
}

function createShader(gl: WebGL2RenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source); gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) { gl.deleteShader(shader); return null; }
  return shader;
}

/** Supplied shader mount, adapted to pause offscreen/hidden and release all GPU resources. */
class MetallicShaderMount {
  private gl: WebGL2RenderingContext | null = null;
  private program: WebGLProgram | null = null;
  private buffer: WebGLBuffer | null = null;
  private canvas: HTMLCanvasElement;
  private locations: Record<string, WebGLUniformLocation | null> = {};
  private raf = 0;
  private last = 0;
  private time = 0;
  private resizeObserver: ResizeObserver;
  private disposed = false;
  constructor(private parent: HTMLElement, private uniforms: MetallicShaderUniforms, private speed: number) {
    this.canvas = document.createElement('canvas'); this.canvas.setAttribute('aria-hidden', 'true'); parent.prepend(this.canvas);
    this.resizeObserver = new ResizeObserver(this.resize);
    const gl = this.canvas.getContext('webgl2', { antialias: false, premultipliedAlpha: true, alpha: true });
    if (!gl) return;
    this.gl = gl;
    const vertex = createShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
    const fragment = createShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    if (!vertex || !fragment) { if (vertex) gl.deleteShader(vertex); if (fragment) gl.deleteShader(fragment); return; }
    const program = gl.createProgram();
    if (!program) { gl.deleteShader(vertex); gl.deleteShader(fragment); return; }
    gl.attachShader(program, vertex); gl.attachShader(program, fragment); gl.linkProgram(program);
    gl.deleteShader(vertex); gl.deleteShader(fragment);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) { gl.deleteProgram(program); return; }
    this.program = program;
    this.buffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(position); gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    for (const name of ['u_time', 'u_resolution', 'u_pixelRatio', 'u_colorBack', 'u_colorTint', 'u_softness', 'u_repetition', 'u_shiftRed', 'u_shiftBlue', 'u_distortion', 'u_contour', 'u_angle', 'u_originX', 'u_originY', 'u_worldWidth', 'u_worldHeight', 'u_fit', 'u_scale', 'u_rotation', 'u_offsetX', 'u_offsetY']) this.locations[name] = gl.getUniformLocation(program, name);
    this.resizeObserver.observe(parent); this.resize(); this.setSpeed(speed);
  }
  private resize = () => {
    if (!this.gl || this.disposed) return;
    const width = this.parent.clientWidth, height = this.parent.clientHeight;
    if (!width || !height) return;
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    const scale = Math.min(dpr, Math.sqrt(96000 / (width * height)));
    this.canvas.width = Math.max(1, Math.round(width * scale)); this.canvas.height = Math.max(1, Math.round(height * scale));
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height); this.draw();
  };
  private draw = () => {
    const gl = this.gl;
    if (!gl || !this.program || this.disposed || gl.isContextLost()) return;
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); gl.useProgram(this.program);
    const u = this.uniforms, loc = this.locations;
    gl.uniform2f(loc.u_resolution, this.canvas.width, this.canvas.height);
    gl.uniform4fv(loc.u_colorBack, parseColor(u.colorBack)); gl.uniform4fv(loc.u_colorTint, parseColor(u.colorTint));
    const values: Record<string, number> = { u_time: this.time, u_pixelRatio: this.canvas.width / Math.max(1, this.parent.clientWidth), u_repetition: u.repetition, u_softness: u.softness, u_angle: u.angle, u_distortion: u.distortion, u_shiftRed: u.shiftRed, u_shiftBlue: u.shiftBlue, u_contour: 0, u_scale: u.scale, u_fit: 1, u_rotation: 0, u_offsetX: 0.1, u_offsetY: -0.1, u_originX: 0.5, u_originY: 0.5, u_worldWidth: 0, u_worldHeight: 0 };
    for (const [name, value] of Object.entries(values)) gl.uniform1f(loc[name] ?? null, value);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  };
  private frame = (now: number) => {
    this.raf = 0;
    if (this.disposed || this.speed === 0 || document.hidden) return;
    if (!this.last || now - this.last >= 33) { this.time += (this.last ? Math.min((now - this.last) / 1000, 0.1) : 0) * this.speed; this.last = now; this.draw(); }
    this.raf = requestAnimationFrame(this.frame);
  };
  setSpeed(speed: number) {
    this.speed = speed; cancelAnimationFrame(this.raf); this.raf = 0; this.last = 0;
    if (this.disposed || !this.program) return;
    this.draw();
    if (speed && !document.hidden) this.raf = requestAnimationFrame(this.frame);
  }
  setUniforms(uniforms: MetallicShaderUniforms) { this.uniforms = uniforms; this.draw(); }
  dispose() {
    this.disposed = true; cancelAnimationFrame(this.raf); this.resizeObserver.disconnect();
    if (this.gl) { if (this.buffer) this.gl.deleteBuffer(this.buffer); if (this.program) this.gl.deleteProgram(this.program); this.gl.getExtension('WEBGL_lose_context')?.loseContext(); }
    this.canvas.remove(); this.gl = null; this.program = null;
  }
}

export interface MetallicSurfaceProps {
  baseColor?: string; sheenColor?: string; bandCount?: number; edgeBlur?: number; flowAngle?: number;
  zoom?: number; warp?: number; redFringe?: number; blueFringe?: number;
  idleSpeed?: number; hoverSpeed?: number; clickSpeed?: number; disabled?: boolean;
}

/** The same finish can be inserted into existing hold buttons and semantic links. */
export function MetallicSurface({ baseColor, sheenColor, bandCount = 4, edgeBlur = 0.5, flowAngle = 45, zoom = 8, warp = 0, redFringe, blueFringe = 0.3, idleSpeed = 0, hoverSpeed = 0.8, clickSpeed = 1.4, disabled = false }: MetallicSurfaceProps) {
  const { theme } = useTheme();
  const resolvedBase = baseColor ?? (theme === 'light' ? '#08436f' : '#8a0648');
  const resolvedSheen = sheenColor ?? (theme === 'light' ? '#86cbf9' : '#ff168d');
  const resolvedRedFringe = redFringe ?? (theme === 'light' ? 0 : 0.3);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const surface = ref.current;
    const button = surface?.closest('button, a');
    if (!surface || !button) return;
    const query = matchMedia('(prefers-reduced-motion: reduce)');
    const desktop = matchMedia('(min-width: 768px) and (pointer: fine)');
    let mount: MetallicShaderMount | null = null, visible = false, hovered = false, pressed = false;
    let idle: number | undefined;
    function cancelIdle() { if (idle !== undefined) { if ('cancelIdleCallback' in window) window.cancelIdleCallback(idle); else clearTimeout(idle); idle = undefined; } }
    const uniforms = { colorBack: resolvedBase, colorTint: resolvedSheen, repetition: bandCount, softness: edgeBlur, angle: flowAngle, scale: zoom, distortion: warp, shiftRed: resolvedRedFringe, shiftBlue: blueFringe };
    function sync() {
      if (!visible || document.hidden || !desktop.matches || query.matches || disabled) {
        cancelIdle(); mount?.dispose(); mount = null; surface!.dataset.renderMode = 'css'; return;
      }
      const speed = query.matches || disabled ? 0 : pressed ? clickSpeed : hovered ? hoverSpeed : idleSpeed;
      if (mount) mount.setSpeed(speed);
      else if (idle === undefined) {
        const start = () => { idle = undefined; if (!visible || document.hidden || !desktop.matches || query.matches || disabled) return; mount = new MetallicShaderMount(surface!, uniforms, pressed ? clickSpeed : hovered ? hoverSpeed : idleSpeed); surface!.dataset.renderMode = 'webgl'; };
        idle = typeof window.requestIdleCallback === 'function' ? window.requestIdleCallback(start, { timeout: 2500 }) : window.setTimeout(start, 800);
      }
    }
    const enter = () => { hovered = true; sync(); };
    const leave = () => { hovered = false; pressed = false; sync(); };
    const down = () => { pressed = true; sync(); };
    const up = () => { pressed = false; sync(); };
    const keydown = (event: Event) => { const key = (event as KeyboardEvent).key; if (key === 'Enter' || key === ' ') down(); };
    const events: [string, EventListener][] = [['pointerenter', enter], ['pointerleave', leave], ['pointerdown', down], ['pointerup', up], ['pointercancel', up], ['focus', enter], ['blur', leave], ['keydown', keydown], ['keyup', up]];
    for (const [name, listener] of events) button.addEventListener(name, listener);
    const intersection = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); }); intersection.observe(surface);
    query.addEventListener('change', sync); desktop.addEventListener('change', sync); document.addEventListener('visibilitychange', sync);
    return () => { cancelIdle(); intersection.disconnect(); mount?.dispose(); for (const [name, listener] of events) button.removeEventListener(name, listener); query.removeEventListener('change', sync); desktop.removeEventListener('change', sync); document.removeEventListener('visibilitychange', sync); };
  }, [resolvedBase, resolvedSheen, bandCount, edgeBlur, flowAngle, zoom, warp, resolvedRedFringe, blueFringe, idleSpeed, hoverSpeed, clickSpeed, disabled]);
  return <span ref={ref} className={styles.surface} data-metallic-surface data-render-mode="css" aria-hidden="true" />;
}

export interface MetallicButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, MetallicSurfaceProps {
  label?: string; viewMode?: 'text' | 'icon';
}

export const MetallicButton = forwardRef<HTMLButtonElement, MetallicButtonProps>(function MetallicButton({ label = 'Continuar', viewMode = 'text', children, className, baseColor, sheenColor, bandCount, edgeBlur, flowAngle, zoom, warp, redFringe, blueFringe, idleSpeed, hoverSpeed, clickSpeed, disabled, type = 'button', ...props }, ref) {
  return <button ref={ref} type={type} disabled={disabled} aria-label={viewMode === 'icon' ? label : undefined} className={cn(styles.button, viewMode === 'icon' && styles.iconButton, className)} {...props}>
    <MetallicSurface {...{ baseColor, sheenColor, bandCount, edgeBlur, flowAngle, zoom, warp, redFringe, blueFringe, idleSpeed, hoverSpeed, clickSpeed, disabled }} />
    <span className={styles.content}>{viewMode === 'icon' ? <Sparkles size={16} aria-hidden="true" /> : children ?? label}</span>
  </button>;
});

export default MetallicButton;
