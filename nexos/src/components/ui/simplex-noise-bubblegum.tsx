"use client";

// 21st.dev Shader Builder / Paper Shaders Simplex Noise, Apache-2.0.
// Adaptation: checked compilation, text alpha mask, context recovery and paused rendering.
import { useEffect, useRef, useState } from 'react';
import { FRAG, UNIFORMS as U, VERT } from './simplex-noise-bubblegum-shader';

const pendingContextReleases = new WeakMap<HTMLCanvasElement, number>();

export function ShaderBackground({ className, colors, textMask = false, paused = false }: {
  className?: string;
  colors?: [number, number, number][];
  /** Clip the shader to sibling elements marked with data-shader-text. */
  textMask?: boolean;
  paused?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [contextVersion, setContextVersion] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const release = pendingContextReleases.get(canvas);
    if (release !== undefined) window.clearTimeout(release);
    pendingContextReleases.delete(canvas);
    const gl = canvas.getContext('webgl', { antialias: false, alpha: true, premultipliedAlpha: false });
    if (!gl) { canvas.dataset.shaderState = 'fallback'; return; }
    const compile = (type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) throw new Error('Shader allocation failed');
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const message = gl.getShaderInfoLog(shader);
        gl.deleteShader(shader);
        throw new Error(message || 'Shader compilation failed');
      }
      return shader;
    };
    let vertex: WebGLShader | null = null;
    let fragment: WebGLShader | null = null;
    let program: WebGLProgram | null = null;
    let buffer: WebGLBuffer | null = null;
    let texture: WebGLTexture | null = null;
    const disposeResources = () => {
      gl.deleteShader(vertex); gl.deleteShader(fragment);
      gl.deleteTexture(texture); gl.deleteBuffer(buffer); gl.deleteProgram(program);
    };
    try {
      vertex = compile(gl.VERTEX_SHADER, VERT);
      fragment = compile(gl.FRAGMENT_SHADER, FRAG);
      program = gl.createProgram();
      if (!program) throw new Error('Program allocation failed');
      gl.attachShader(program, vertex); gl.attachShader(program, fragment); gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) || 'Shader link failed');
      gl.useProgram(program);
      buffer = gl.createBuffer(); texture = gl.createTexture();
      if (!buffer || !texture) throw new Error('WebGL allocation failed');
    } catch {
      canvas.dataset.shaderState = 'fallback';
      disposeResources();
      return;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,3,-1,-1,3]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(position); gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    const location = (name: string) => gl.getUniformLocation(program!, name);
    const scene = location('u_scene');
    const palette = colors?.length ? colors.slice(0, 8) : U.colors.slice(0, U.colorCount);
    const paddedPalette = Array.from({ length: 8 }, (_, i) => palette[Math.min(i, palette.length - 1)]);
    gl.uniform3fv(location('u_colors[0]'), new Float32Array(paddedPalette.flat()));
    gl.uniform4f(location('u_shape'), U.scale, U.intensity, U.paramA, U.warp);
    gl.uniform4f(location('u_surface'), U.detail, U.contrast, U.brightness, U.saturation);
    gl.uniform4f(location('u_finish'), U.hue, U.vignette, U.blur, U.grain);
    gl.uniform4f(location('u_transform'), U.seed, U.rotate, U.drift, U.oklab);
    gl.uniform4f(location('u_space'), U.offsetX, U.offsetY, 0, 0);
    gl.uniform4f(location('u_cursor'), 0, U.cursorEffect, U.cursorStrength, U.cursorRadius);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.uniform1i(location('u_mask'), 0);

    const mask = document.createElement('canvas');
    const ctx = mask.getContext('2d')!;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const forcedColors = window.matchMedia('(forced-colors: active)');
    let inView = false, disposed = false, lost = false, raf = 0;
    let dirty = true, lastFrame = 0, elapsed = 0, frames = 0;
    let bounds = canvas.getBoundingClientRect();

    const updateMask = () => {
      bounds = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const pixelScale = Math.min(1, Math.sqrt(2_000_000 / Math.max(1, bounds.width * bounds.height * dpr * dpr)));
      const ratio = dpr * pixelScale;
      canvas.width = Math.max(1, Math.round(bounds.width * ratio));
      canvas.height = Math.max(1, Math.round(bounds.height * ratio));
      gl.viewport(0, 0, canvas.width, canvas.height);
      mask.width = canvas.width; mask.height = canvas.height;
      ctx.setTransform(canvas.width / Math.max(1, bounds.width), 0, 0, canvas.height / Math.max(1, bounds.height), 0, 0);
      ctx.fillStyle = '#fff';
      if (textMask) {
        canvas.parentElement?.querySelectorAll<HTMLElement>('[data-shader-text]').forEach(element => {
          const rect = element.getBoundingClientRect();
          const style = getComputedStyle(element);
          ctx.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
          ctx.letterSpacing = style.letterSpacing === 'normal' ? '0px' : style.letterSpacing;
          const metrics = ctx.measureText(element.textContent || '');
          const ascent = metrics.fontBoundingBoxAscent ?? parseFloat(style.fontSize) * .8;
          const descent = metrics.fontBoundingBoxDescent ?? parseFloat(style.fontSize) * .2;
          const baseline = rect.top - bounds.top + (rect.height - ascent - descent) / 2 + ascent;
          ctx.fillText(element.textContent || '', rect.left - bounds.left, baseline);
        });
      } else ctx.fillRect(0, 0, bounds.width, bounds.height);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, mask);
      dirty = false;
    };
    const canDraw = () => !disposed && !lost && inView && !document.hidden && !forcedColors.matches;
    const stop = () => {
      cancelAnimationFrame(raf); raf = 0; lastFrame = 0;
      canvas.dataset.shaderPlaying = 'false';
    };
    const requestRender = () => { if (canDraw() && !raf) raf = requestAnimationFrame(render); };
    const render = (now: number) => {
      raf = 0;
      if (!canDraw()) return;
      if (lastFrame && now - lastFrame < 1000 / 30) { requestRender(); return; }
      if (!reduced.matches && !paused && lastFrame) elapsed += Math.min((now - lastFrame) / 1000, .1);
      lastFrame = now;
      if (dirty) updateMask();
      gl.uniform4f(scene, canvas.width, canvas.height, elapsed * U.timeScale, palette.length);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      canvas.dataset.shaderState = 'ready';
      canvas.dataset.shaderFrame = String(++frames);
      canvas.dataset.shaderPlaying = String(!reduced.matches && !paused);
      if (!reduced.matches && !paused) requestRender();
    };
    const layout = () => { dirty = true; requestRender(); };
    const visibility = () => { stop(); requestRender(); };
    const preferences = () => {
      if (forcedColors.matches) canvas.dataset.shaderState = 'fallback';
      stop(); requestRender();
    };
    const onLost = (event: Event) => { event.preventDefault(); lost = true; stop(); canvas.dataset.shaderState = 'fallback'; };
    const onRestored = () => setContextVersion(value => value + 1);
    const resizeObserver = new ResizeObserver(layout);
    resizeObserver.observe(canvas);
    const observer = new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; visibility(); });
    observer.observe(canvas);
    canvas.addEventListener('webglcontextlost', onLost);
    canvas.addEventListener('webglcontextrestored', onRestored);
    document.addEventListener('visibilitychange', visibility);
    document.fonts.addEventListener('loadingdone', layout);
    window.addEventListener('resize', layout);
    reduced.addEventListener('change', preferences);
    forcedColors.addEventListener('change', preferences);
    void document.fonts.ready.then(() => { if (!disposed) layout(); });
    return () => {
      disposed = true; stop(); observer.disconnect(); resizeObserver.disconnect();
      canvas.removeEventListener('webglcontextlost', onLost);
      canvas.removeEventListener('webglcontextrestored', onRestored);
      document.removeEventListener('visibilitychange', visibility);
      document.fonts.removeEventListener('loadingdone', layout);
      window.removeEventListener('resize', layout);
      reduced.removeEventListener('change', preferences);
      forcedColors.removeEventListener('change', preferences);
      disposeResources();
      canvas.dataset.shaderState = 'idle';
      const timer = window.setTimeout(() => {
        if (pendingContextReleases.get(canvas) !== timer) return;
        pendingContextReleases.delete(canvas);
        gl.getExtension('WEBGL_lose_context')?.loseContext();
      }, 0);
      pendingContextReleases.set(canvas, timer);
    };
  }, [textMask, paused, colors, contextVersion]);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" data-bubblegum-shader
    style={{ display: 'block', width: '100%', height: '100%', pointerEvents: 'none' }} />;
}
