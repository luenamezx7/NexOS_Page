'use client';

import { useEffect, useRef } from 'react';
import { Mesh, Program, Renderer, Triangle, Vec2 } from 'ogl';

const vertex = `attribute vec2 position; void main(){gl_Position=vec4(position,0.,1.);}`;
// Low-resolution silk field: restrained rose/violet ribbons, transparent between folds.
const fragment = `
precision mediump float;
uniform vec2 uResolution;
uniform float uTime;
void main(){
  vec2 uv=gl_FragCoord.xy/uResolution;
  vec2 p=uv*vec2(2.4,1.5);
  float t=uTime*.12;
  float fold=sin(p.x*3.1+sin(p.y*2.3+t)*1.1-t);
  fold+=.45*sin(p.y*4.2+p.x*2.1+t*.7);
  float silk=pow(clamp(.5+.5*sin(fold*2.4+p.y*2.1),0.,1.),3.);
  float fade=smoothstep(.1,.85,uv.x)*(1.-smoothstep(.7,1.2,uv.y));
  vec3 tint=mix(vec3(.91,.0,.43),vec3(.44,.10,.72),uv.y*.7+uv.x*.3);
  gl_FragColor=vec4(tint,silk*fade*.7);
}`;

export default function DarkVeil() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let renderer: Renderer;
    try { renderer = new Renderer({ canvas, dpr: 1, alpha: true, antialias: false }); } catch { return; }
    const gl = renderer.gl;
    const geometry = new Triangle(gl);
    const program = new Program(gl, { vertex, fragment, transparent: true, uniforms: { uResolution: { value: new Vec2(1, 1) }, uTime: { value: 0 } } });
    const mesh = new Mesh(gl, { geometry, program });
    const query = matchMedia('(prefers-reduced-motion: reduce)');
    let visible = false, disposed = false, raf = 0, last = 0, time = 0;
    function draw() { if (!disposed) { program.uniforms.uTime.value = time; renderer.render({ scene: mesh }); } }
    function resize() {
      const rect = canvas!.getBoundingClientRect();
      // Render at 35% resolution, capped to 640px: no full-screen retina shader.
      const scale = Math.min(0.35, 640 / Math.max(1, rect.width));
      renderer.setSize(Math.max(1, Math.round(rect.width * scale)), Math.max(1, Math.round(rect.height * scale)));
      canvas!.style.width = '100%'; canvas!.style.height = '100%';
      program.uniforms.uResolution.value.set(gl.drawingBufferWidth, gl.drawingBufferHeight); draw();
    }
    function loop(now: number) {
      raf = 0;
      if (disposed || !visible || document.hidden || query.matches) return;
      if (!last || now - last >= 50) { time += last ? Math.min((now - last) / 1000, 0.1) : 0; last = now; draw(); }
      raf = requestAnimationFrame(loop);
    }
    function sync() {
      cancelAnimationFrame(raf); raf = 0; last = 0;
      if (query.matches) draw();
      else if (visible && !document.hidden && !disposed) raf = requestAnimationFrame(loop);
    }
    const resizeObserver = new ResizeObserver(resize); resizeObserver.observe(canvas);
    const intersection = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); }); intersection.observe(canvas);
    query.addEventListener('change', sync); document.addEventListener('visibilitychange', sync);
    resize();
    return () => {
      disposed = true; cancelAnimationFrame(raf); resizeObserver.disconnect(); intersection.disconnect();
      query.removeEventListener('change', sync); document.removeEventListener('visibilitychange', sync);
      // React Strict Mode reuses this canvas; do not lose its context during effect replay.
      geometry.remove(); program.remove(); gl.deleteShader(program.vertexShader); gl.deleteShader(program.fragmentShader);
    };
  }, []);
  return <canvas ref={ref} aria-hidden="true" />;
}
