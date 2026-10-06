'use client';

// React Bits Topography, adapted to TypeScript and this application's lifecycle.
// The supplied elevation/contour fragment shader is preserved.
import { useEffect, useLayoutEffect, useRef } from 'react';
import { Renderer, Program, Mesh, Triangle } from 'ogl';
import './Topography.css';

export interface TopographyProps {
  lowColor?: string; midColor?: string; highColor?: string; speed?: number;
  morphAmount?: number; morphSpeed?: number; bands?: number; thickness?: number;
  scale?: number; pixelSize?: number; glow?: number;
  colorMode?: 'elevation' | 'uniform' | 'alternating'; contrast?: number; brightness?: number;
  fillBands?: boolean; opacity?: number; grain?: boolean; grainIntensity?: number;
  mouseInteraction?: boolean; mouseRadius?: number; mouseStrength?: number;
  lightMode?: boolean; className?: string;
  active?: boolean; paused?: boolean; maxFPS?: number; dprLimit?: number;
}

const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [parseInt(result[1], 16) / 255, parseInt(result[2], 16) / 255, parseInt(result[3], 16) / 255] : [1, 1, 1];
};
const colorModeToFloat = (mode: string) => mode === 'uniform' ? 1.0 : mode === 'alternating' ? 2.0 : 0.0;

const vertex = `#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const fragment = `#version 300 es
precision highp float;
uniform vec2 iResolution;
uniform float iTime;
uniform float uMorphAmount;
uniform float uBands;
uniform float uThickness;
uniform float uScale;
uniform float uPixelSize;
uniform float uGlow;
uniform float uColorMode;
uniform float uContrast;
uniform float uBrightness;
uniform float uFillBands;
uniform float uOpacity;
uniform float uLightMode;
uniform vec3 uLow;
uniform vec3 uMid;
uniform vec3 uHigh;
uniform vec2 uMouse;
uniform float uMouseEnabled;
uniform float uMouseRadius;
uniform float uMouseStrength;
uniform float uMouseActive;
uniform float uGrain;
uniform float uGrainIntensity;
uniform vec4 uCtrlA;
uniform vec4 uCtrlB;
uniform vec4 uCtrlC;
uniform vec4 uCtrlD;
out vec4 fragColor;

float bez(float t, vec4 c) {
  float w = 6.2831853 * t;
  return 0.5 * (c.x * sin(w) + c.y * cos(w) + c.z * sin(2.0 * w) + c.w * cos(2.0 * w));
}

float field(vec2 uv) {
  vec2 a = vec2(bez(uv.x, uCtrlA), bez(uv.x, uCtrlB));
  vec2 b = vec2(bez(uv.y, uCtrlC), bez(uv.y, uCtrlD));
  return distance(a, b);
}

vec3 elevationColor(float e) {
  vec3 c = mix(uLow, uMid, smoothstep(0.0, 0.5, e));
  c = mix(c, uHigh, smoothstep(0.5, 1.0, e));
  return c;
}

void main() {
  vec2 res = iResolution.xy;
  vec2 uv = gl_FragCoord.xy / res;

  vec2 suv = (uv - 0.5) / max(uScale, 0.001) + 0.5;

  vec2 sampleUv = suv;
  if (uPixelSize > 1.0) {
    vec2 px = res / uPixelSize;
    sampleUv = (floor(suv * px) + 0.5) / px;
  }

  float fv = field(sampleUv);

  if (uMouseEnabled > 0.5) {
    vec2 d = uv - uMouse;
    d.x *= res.x / max(res.y, 1.0);
    float r = max(uMouseRadius, 0.001);
    float bump = exp(-dot(d, d) / (r * r)) * uMouseStrength * uMouseActive;
    fv += bump;
  }

  float f = fv * uBands;
  float frac = fract(f);
  float lineDist = min(frac, 1.0 - frac);

  float aa = fwidth(f) + 0.0001;
  float mask = 1.0 - smoothstep(uThickness - aa, uThickness + aa, lineDist);

  float glowR = uThickness + uGlow * 0.5 + aa;
  float glow = (1.0 - smoothstep(uThickness, glowR, lineDist)) * step(0.0001, uGlow);

  float elev = clamp(fv / (uMorphAmount * 2.5 + 0.001), 0.0, 1.0);

  vec3 lineCol;
  if (uColorMode < 0.5) {
    lineCol = elevationColor(elev);
  } else if (uColorMode < 1.5) {
    lineCol = uMid;
  } else {
    float parity = mod(floor(f), 2.0);
    lineCol = mix(uMid, uHigh, parity);
  }

  float coverage = clamp(mask + glow * 0.55, 0.0, 1.0);
  coverage = pow(coverage, max(uContrast, 0.001));

  vec3 outColor = lineCol;
  float outAlpha = coverage;

  if (uFillBands > 0.5) {
    vec3 fillCol = elevationColor(elev);
    float fillA = 0.1 * elev;
    outColor = mix(fillCol, lineCol, coverage);
    outAlpha = clamp(coverage + fillA, 0.0, 1.0);
  }

  if (uGrain > 0.5) {
    float g = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233)) + iTime) * 43758.5453);
    outAlpha += (g - 0.5) * uGrainIntensity;
  }

  outColor *= uBrightness;
  outColor = clamp(outColor, 0.0, 1.0);

  float a = clamp(outAlpha, 0.0, 1.0) * uOpacity;
  if (uLightMode > 0.5) {
    float peak = max(outColor.r, max(outColor.g, outColor.b));
    vec3 chroma = pow(clamp(outColor / max(peak, 0.0001), 0.0, 1.0), vec3(1.18));
    fragColor = vec4(mix(vec3(1.0), chroma, a * 0.94), 1.0);
  } else {
    fragColor = vec4(outColor * a, a);
  }
}
`;

const CTRL_INDICES = [[1, -2, 3, -4], [9, -8, 7, -6], [5, 2, 5, -5], [-1, -3, 8, 9]];
type Controls = { sync: () => void; redraw: () => void };
const ctxMap = new WeakMap<HTMLDivElement, Controls>();

export default function Topography({
  lowColor = '#5227FF', midColor = '#FF9FFC', highColor = '#FFFFFF', speed = 0.35,
  morphAmount = 3.0, morphSpeed = 0.05, bands = 2.0, thickness = 0.01, scale = 1.0,
  pixelSize = 1.0, glow = 0.5, colorMode = 'elevation', contrast = 3.0, brightness = 1.0,
  fillBands = false, opacity = 1.0, grain = true, grainIntensity = 0.05,
  mouseInteraction = true, mouseRadius = 0.3, mouseStrength = 0.4,
  lightMode = false, className = '', active = true, paused = false, maxFPS = 30, dprLimit = 2,
}: TopographyProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const settings = useRef({ lowColor, midColor, highColor, speed, morphAmount, morphSpeed, bands, thickness,
    scale, pixelSize, glow, colorMode, contrast, brightness, fillBands, opacity, grain, grainIntensity,
    mouseInteraction, mouseRadius, mouseStrength, lightMode, active, paused, maxFPS, dprLimit });

  useLayoutEffect(() => {
    settings.current = { lowColor, midColor, highColor, speed, morphAmount, morphSpeed, bands, thickness,
      scale, pixelSize, glow, colorMode, contrast, brightness, fillBands, opacity, grain, grainIntensity,
      mouseInteraction, mouseRadius, mouseStrength, lightMode, active, paused, maxFPS, dprLimit };
    ctxMap.get(containerRef.current!)?.sync();
  }, [lowColor, midColor, highColor, speed, morphAmount, morphSpeed, bands, thickness, scale, pixelSize,
    glow, colorMode, contrast, brightness, fillBands, opacity, grain, grainIntensity,
    mouseInteraction, mouseRadius, mouseStrength, lightMode, active, paused, maxFPS, dprLimit]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let renderer: Renderer;
    try {
      renderer = new Renderer({ webgl: 2, alpha: true, premultipliedAlpha: true, antialias: false,
        depth: false, stencil: false, powerPreference: 'low-power', dpr: Math.min(devicePixelRatio || 1, settings.current.dprLimit, 2) });
      if (!renderer.isWebgl2) { renderer.gl?.getExtension('WEBGL_lose_context')?.loseContext(); container.dataset.motion = 'fallback'; return; }
    } catch { container.dataset.motion = 'fallback'; return; }
    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 0);
    const canvas = gl.canvas;
    canvas.setAttribute('aria-hidden', 'true');
    container.appendChild(canvas);
    const geometry = new Triangle(gl);
    const program = new Program(gl, { vertex, fragment, depthTest: false, depthWrite: false, cullFace: false,
      uniforms: {
        iTime: { value: 0 }, iResolution: { value: new Float32Array([1, 1]) },
        uMorphAmount: { value: 3 }, uBands: { value: 2 }, uThickness: { value: 0.01 },
        uScale: { value: 1 }, uPixelSize: { value: 1 }, uGlow: { value: 0.5 }, uColorMode: { value: 0 },
        uContrast: { value: 3 }, uBrightness: { value: 1 }, uFillBands: { value: 0 }, uOpacity: { value: 1 },
        uLightMode: { value: 0 }, uGrain: { value: 1 }, uGrainIntensity: { value: 0.05 },
        uLow: { value: new Float32Array([1, 1, 1]) }, uMid: { value: new Float32Array([1, 1, 1]) }, uHigh: { value: new Float32Array([1, 1, 1]) },
        uMouse: { value: new Float32Array([0.5, 0.5]) }, uMouseEnabled: { value: 1 },
        uMouseRadius: { value: 0.3 }, uMouseStrength: { value: 0.4 }, uMouseActive: { value: 0 },
        uCtrlA: { value: new Float32Array(4) }, uCtrlB: { value: new Float32Array(4) },
        uCtrlC: { value: new Float32Array(4) }, uCtrlD: { value: new Float32Array(4) },
      } });
    if (!gl.getProgramParameter(program.program, gl.LINK_STATUS)) {
      program.remove(); geometry.remove(); canvas.remove(); gl.getExtension('WEBGL_lose_context')?.loseContext(); container.dataset.motion = 'fallback'; return;
    }
    const mesh = new Mesh(gl, { geometry, program });
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    const pointer = matchMedia('(pointer: fine)');
    const currentMouse = [0.5, 0.5], targetMouse = [0.5, 0.5];
    let mouseActive = 0, mouseTarget = 0, raf = 0, lastTime = 0, lastDraw = 0, time = 0;
    let visible = true, disposed = false, lost = false;
    const ctrlArrays = [program.uniforms.uCtrlA.value, program.uniforms.uCtrlB.value, program.uniforms.uCtrlC.value, program.uniforms.uCtrlD.value] as Float32Array[];

    function applyProps() {
      const p = settings.current, u = program.uniforms;
      for (const [key, value] of Object.entries({ uMorphAmount: p.morphAmount, uBands: p.bands, uThickness: p.thickness,
        uScale: p.scale, uPixelSize: p.pixelSize, uGlow: p.glow, uColorMode: colorModeToFloat(p.colorMode),
        uContrast: p.contrast, uBrightness: p.brightness, uFillBands: Number(p.fillBands), uOpacity: p.opacity,
        uLightMode: Number(p.lightMode), uGrain: Number(p.grain), uGrainIntensity: p.grainIntensity,
        uMouseEnabled: Number(p.mouseInteraction && pointer.matches), uMouseRadius: p.mouseRadius, uMouseStrength: p.mouseStrength })) u[key].value = value;
      u.uLow.value.set(hexToRgb(p.lowColor)); u.uMid.value.set(hexToRgb(p.midColor)); u.uHigh.value.set(hexToRgb(p.highColor));
    }
    function draw() {
      if (disposed || lost || document.hidden) return;
      const p = settings.current, u = program.uniforms;
      u.iTime.value = time;
      for (let group = 0; group < 4; group++) for (let j = 0; j < 4; j++) {
        const index = CTRL_INDICES[group][j];
        ctrlArrays[group][j] = p.morphAmount * Math.sin(time * p.speed * Math.sin(index * p.morphSpeed) + index);
      }
      for (let j = 0; j < 2; j++) currentMouse[j] += 0.05 * (targetMouse[j] - currentMouse[j]);
      u.uMouse.value.set(currentMouse);
      mouseActive += 0.05 * (mouseTarget - mouseActive); u.uMouseActive.value = mouseActive;
      renderer.render({ scene: mesh });
    }
    function stop() { cancelAnimationFrame(raf); raf = 0; lastTime = 0; lastDraw = 0; }
    function loop(now: number) {
      raf = 0;
      if (disposed || lost || document.hidden || !visible || !settings.current.active || settings.current.paused || motion.matches) return;
      if (lastTime) time += (now - lastTime) * 0.001;
      lastTime = now;
      if (!lastDraw || now - lastDraw >= 1000 / Math.max(1, settings.current.maxFPS)) { draw(); lastDraw = now; }
      raf = requestAnimationFrame(loop);
    }
    function sync() {
      stop(); applyProps();
      if (disposed || lost) return;
      const p = settings.current;
      if (p.paused || !p.active || document.hidden || !visible) { container!.dataset.motion = 'paused'; return; }
      draw();
      container!.dataset.motion = motion.matches ? 'static' : 'animated';
      if (!motion.matches) raf = requestAnimationFrame(loop);
    }
    function setSize() {
      if (disposed || lost) return;
      const rect = container!.getBoundingClientRect();
      renderer.dpr = Math.min(devicePixelRatio || 1, settings.current.dprLimit, 2);
      renderer.setSize(Math.max(1, Math.floor(rect.width)), Math.max(1, Math.floor(rect.height)));
      program.uniforms.iResolution.value.set([gl.drawingBufferWidth, gl.drawingBufferHeight]);
      applyProps(); draw();
    }
    function onMouseMove(event: PointerEvent) {
      if (!settings.current.mouseInteraction || !pointer.matches || settings.current.paused || event.pointerType === 'touch') return;
      const rect = canvas.getBoundingClientRect();
      targetMouse[0] = (event.clientX - rect.left) / Math.max(1, rect.width);
      targetMouse[1] = 1 - (event.clientY - rect.top) / Math.max(1, rect.height);
      mouseTarget = 1;
    }
    const onMouseLeave = () => { mouseTarget = 0; };
    const onContextLost = (event: Event) => { event.preventDefault(); lost = true; stop(); container!.dataset.motion = 'fallback'; };
    const ro = new ResizeObserver(setSize); ro.observe(container);
    const io = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); }, { threshold: 0 }); io.observe(container);
    ctxMap.set(container, { sync, redraw: setSize });
    window.addEventListener('pointermove', onMouseMove, { passive: true });
    document.addEventListener('pointerleave', onMouseLeave);
    document.addEventListener('visibilitychange', sync);
    motion.addEventListener('change', sync); pointer.addEventListener('change', sync);
    canvas.addEventListener('webglcontextlost', onContextLost);
    setSize(); sync();
    return () => {
      disposed = true; stop(); ro.disconnect(); io.disconnect(); ctxMap.delete(container);
      window.removeEventListener('pointermove', onMouseMove); document.removeEventListener('pointerleave', onMouseLeave);
      document.removeEventListener('visibilitychange', sync);
      motion.removeEventListener('change', sync); pointer.removeEventListener('change', sync);
      canvas.removeEventListener('webglcontextlost', onContextLost);
      program.remove(); geometry.remove(); canvas.remove();
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    };
  }, []);

  return <div ref={containerRef} className={`topography-container ${className}`.trim()} data-topography="" aria-hidden="true" />;
}
