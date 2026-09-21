"use client";
import { useEffect, useRef } from "react";
import { Renderer, Program, Mesh, Triangle, Vec2 } from "ogl";

const vertex = `attribute vec2 position; void main(){gl_Position=vec4(position,0.,1.);}`;

const fragment = `
#ifdef GL_ES
precision highp float;
#endif
uniform vec2 uResolution;
uniform float uTime;
uniform float uSpeed;

float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
float noise(vec2 p){
  vec2 i=floor(p); vec2 f=fract(p);
  float a=hash(i); float b=hash(i+vec2(1.,0.)); float c=hash(i+vec2(0.,1.)); float d=hash(i+vec2(1.,1.));
  vec2 u=f*f*(3.-2.*f);
  return mix(a,b,u.x)+ (c-a)*u.y*(1.-u.x) + (d-b)*u.x*u.y;
}

void main(){
  vec2 frag = gl_FragCoord.xy;
  vec2 uv = (frag - 0.5*uResolution)/min(uResolution.x,uResolution.y);
  // tempo suave como DarkVeil
  float t = uTime * uSpeed * 0.28;

  // Curva em S — pico central como na referência
  // onda base + segunda harmônica para dobra suave
  float wave = sin(uv.x*1.85 + t*0.55)*0.18 + sin(uv.x*3.2 - t*0.38)*0.06;
  // offset vertical para pico em ~0.06
  float ridge = uv.y - (wave + 0.06);
  // largura da seda + falloff
  float d = abs(ridge);
  // rim de luz principal — fino e intenso no topo da dobra
  float rim = exp(-d*18.0) * 1.25;
  // halo mais largo e suave
  float halo = exp(-d*4.5) * 0.32;
  // sombra sob a dobra
  float shadow = smoothstep(0.0, 0.22, -ridge) * 0.55 * (1.0 - rim*0.6);

  // base preta profunda
  vec3 col = vec3(0.018);
  // luz seda — branco levemente azulado como na foto
  vec3 silk = vec3(1.0, 1.0, 1.02);
  col += rim * silk * 1.0;
  col += halo * vec3(0.92,0.94,1.0) * 0.55;
  col -= shadow * 0.35;

  // vinheta escura nas bordas
  float vign = 1.0 - dot(uv,uv)*0.42;
  col *= vign;

  // grain ultra fino — como na referência, pontilhado
  float n = hash(frag + t*12.0);
  col += (n - 0.5) * 0.018;

  // dither leve para 8bit banding
  col += (hash(frag*0.5) - 0.5) * 0.006;

  gl_FragColor = vec4(clamp(col,0.0,1.0),1.0);
}
`;

export default function SilkVeil({ speed = 0.5 }: { speed?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current!;
    const parent = canvas.parentElement!;
    const renderer = new Renderer({ dpr: Math.min(window.devicePixelRatio, 2), canvas, alpha: false });
    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 1);
    const geo = new Triangle(gl);
    const program = new Program(gl, {
      vertex, fragment,
      uniforms: {
        uResolution: { value: new Vec2() },
        uTime: { value: 0 },
        uSpeed: { value: speed },
      },
    });
    const mesh = new Mesh(gl, { geometry: geo, program });
    const resize = () => {
      const w = parent.clientWidth, h = parent.clientHeight;
      renderer.setSize(w, h);
      program.uniforms.uResolution.value.set(w, h);
    };
    window.addEventListener("resize", resize);
    resize();
    const start = performance.now();
    let raf = 0;
    const loop = () => {
      program.uniforms.uTime.value = (performance.now() - start) / 1000;
      renderer.render({ scene: mesh });
      raf = requestAnimationFrame(loop);
    };
    loop();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, [speed]);
  return <canvas ref={ref} className="silkveil-canvas" style={{ width: "100%", height: "100%", display: "block" }} />;
}
