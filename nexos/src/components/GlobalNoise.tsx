'use client';

import { useRef, useEffect } from 'react';
import { Renderer, Program, Mesh, Triangle, Vec2 } from 'ogl';

import './GlobalNoise.css';

const vertex = `
attribute vec2 position;
void main(){gl_Position=vec4(position,0.0,1.0);}
`;

const fragment = `
#ifdef GL_ES
precision lowp float;
#endif
uniform vec2 uResolution;
uniform float uTime;
uniform float uNoiseIntensity;
uniform float uScanlineIntensity;
uniform float uScanlineFrequency;

float rand(vec2 c){return fract(sin(dot(c,vec2(12.9898,78.233)))*43758.5453);}

void main(){
    vec2 uv = gl_FragCoord.xy / uResolution.xy;
    
    vec3 color = vec3(0.0);
    
    float scanline = sin(gl_FragCoord.y * uScanlineFrequency) * 0.5 + 0.5;
    color -= (scanline * scanline) * uScanlineIntensity;
    
    color += (rand(gl_FragCoord.xy + uTime) - 0.5) * uNoiseIntensity;
    
    gl_FragColor = vec4(color, 1.0);
}
`;

export default function GlobalNoise({
  noiseIntensity = 0.03,
  scanlineIntensity = 0.02,
  scanlineFrequency = 1.0,
  speed = 1.0
}: {
  noiseIntensity?: number;
  scanlineIntensity?: number;
  scanlineFrequency?: number;
  speed?: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current as HTMLCanvasElement;
    if (!canvas) return;

    const renderer = new Renderer({
      dpr: Math.min(window.devicePixelRatio, 2),
      canvas,
      alpha: true,
      premultipliedAlpha: true
    });

    const gl = renderer.gl;
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    const geometry = new Triangle(gl);
    const program = new Program(gl, {
      vertex,
      fragment,
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: new Vec2() },
        uNoiseIntensity: { value: noiseIntensity },
        uScanlineIntensity: { value: scanlineIntensity },
        uScanlineFrequency: { value: scanlineFrequency }
      }
    });

    const mesh = new Mesh(gl, { geometry, program });

    const resize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      renderer.setSize(w, h);
      program.uniforms.uResolution.value.set(w, h);
    };

    window.addEventListener('resize', resize);
    resize();

    const start = performance.now();
    let frame = 0;

    const loop = () => {
      program.uniforms.uTime.value = ((performance.now() - start) / 1000) * speed;
      renderer.render({ scene: mesh });
      frame = requestAnimationFrame(loop);
    };

    loop();

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', resize);
    };
  }, [noiseIntensity, scanlineIntensity, scanlineFrequency, speed]);

  return <canvas ref={ref} className="global-noise-canvas" />;
}