'use client';

import { useRef, useEffect } from 'react';
import { Renderer, Program, Mesh, Triangle, Vec2 } from 'ogl';

import './AnimatedGradient.css';

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
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uColor3;
uniform float uRotation;
uniform float uProportion;
uniform float uScale;
uniform float uSpeed;
uniform float uDistortion;
uniform float uSwirl;
uniform float uSwirlIterations;
uniform float uSoftness;
uniform float uOffset;
uniform float uShape;
uniform float uShapeSize;
#define iTime uTime
#define iResolution uResolution

vec3 hsv2rgb(vec3 c){
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

float noise(vec2 p){
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

float fbm(vec2 p, int octaves){
    float value = 0.0;
    float amplitude = 0.5;
    for(int i = 0; i < 8; i++){
        if(i >= octaves) break;
        value += amplitude * noise(p);
        p *= 2.0;
        amplitude *= 0.5;
    }
    return value;
}

vec2 rotate(vec2 p, float angle){
    float s = sin(angle);
    float c = cos(angle);
    return vec2(c * p.x - s * p.y, s * p.x + c * p.y);
}

float shapeChecks(vec2 p, float size){
    vec2 q = floor(p * size);
    return mod(q.x + q.y, 2.0);
}

float shapeStripes(vec2 p, float size){
    return mod(floor(p.x * size), 2.0);
}

float shapeEdge(vec2 p, float size){
    return step(0.5, mod(p.x * size, 1.0));
}

float getShape(vec2 p, float shape, float shapeSize){
    if(shape < 0.33) return shapeChecks(p, shapeSize);
    else if(shape < 0.66) return shapeStripes(p, shapeSize);
    else return shapeEdge(p, shapeSize);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord){
    vec2 uv = fragCoord / uResolution.xy;
    uv -= 0.5;
    uv.x *= uResolution.x / uResolution.y;
    
    float time = uTime * uSpeed * 0.01 + uOffset * 0.01;
    
    uv = rotate(uv, radians(uRotation));
    uv *= uScale;
    
    float swirlAngle = uSwirl * 0.01 * 6.28318;
    float swirlRadius = length(uv);
    float swirlStrength = swirlAngle * (1.0 - swirlRadius) * uSwirlIterations * 0.1;
    uv = rotate(uv, swirlStrength);
    
    vec2 noiseUV = uv * uDistortion * 0.01 + time * 0.1;
    float n = fbm(noiseUV, 4);
    uv += vec2(n, n) * uDistortion * 0.01;
    
    float pattern = getShape(uv, uShape, uShapeSize * 0.1);
    
    float proportion = uProportion * 0.01;
    float soft = uSoftness * 0.01;
    
    float gradient = smoothstep(proportion - soft, proportion + soft, pattern);
    
    vec3 col1 = uColor1;
    vec3 col2 = uColor2;
    vec3 col3 = uColor3;
    
    vec3 color = mix(col1, col2, gradient);
    color = mix(color, col3, gradient * 0.5);
    
    color += n * 0.1;
    
    fragColor = vec4(color, 1.0);
}

void main(){
    vec4 col;
    mainImage(col, gl_FragCoord.xy);
    gl_FragColor = col;
}
`;

function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [
    parseInt(result[1], 16) / 255,
    parseInt(result[2], 16) / 255,
    parseInt(result[3], 16) / 255
  ] : [0, 0, 0];
}

const presets: Record<string, {
  color1: string;
  color2: string;
  color3: string;
  rotation: number;
  proportion: number;
  scale: number;
  speed: number;
  distortion: number;
  swirl: number;
  swirlIterations: number;
  softness: number;
  offset: number;
  shape: number;
  shapeSize: number;
}> = {
  Prism: {
    color1: '#1a1a2e',
    color2: '#16213e',
    color3: '#0f3460',
    rotation: 45,
    proportion: 35,
    scale: 1,
    speed: 25,
    distortion: 12,
    swirl: 60,
    swirlIterations: 10,
    softness: 100,
    offset: 0,
    shape: 0.1,
    shapeSize: 10,
  },
  Aurora: {
    color1: '#0d1b2a',
    color2: '#1b263b',
    color3: '#415a77',
    rotation: 30,
    proportion: 40,
    scale: 1.2,
    speed: 15,
    distortion: 8,
    swirl: 40,
    swirlIterations: 8,
    softness: 80,
    offset: 0,
    shape: 0.5,
    shapeSize: 15,
  },
  Ember: {
    color1: '#1a0a0a',
    color2: '#2d1212',
    color3: '#4a1a1a',
    rotation: 60,
    proportion: 30,
    scale: 0.8,
    speed: 30,
    distortion: 15,
    swirl: 80,
    swirlIterations: 12,
    softness: 90,
    offset: 0,
    shape: 0.2,
    shapeSize: 8,
  },
  Mist: {
    color1: '#0a0f1a',
    color2: '#1a1f2e',
    color3: '#2d3748',
    rotation: 15,
    proportion: 45,
    scale: 1.5,
    speed: 10,
    distortion: 20,
    swirl: 30,
    swirlIterations: 6,
    softness: 100,
    offset: 0,
    shape: 0.4,
    shapeSize: 20,
  },
};

type PresetName = keyof typeof presets;

type Config = 
  | { preset: PresetName }
  | { 
      preset: 'custom';
      color1: string;
      color2: string;
      color3: string;
      rotation?: number;
      proportion?: number;
      scale?: number;
      speed?: number;
      distortion?: number;
      swirl?: number;
      swirlIterations?: number;
      softness?: number;
      offset?: number;
      shape?: 'Checks' | 'Stripes' | 'Edge';
      shapeSize?: number;
    };

type NoiseConfig = {
  opacity: number;
  scale?: number;
};

type Props = {
  config?: Config;
  noise?: NoiseConfig;
  radius?: string;
  className?: string;
  style?: React.CSSProperties;
};

export default function AnimatedGradient({
  config = { preset: 'Prism' },
  noise,
  radius = '0px',
  className = '',
  style,
}: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  
  let cfg: typeof presets.Prism;
  
  if ('preset' in config && config.preset !== 'custom') {
    cfg = presets[config.preset];
  } else if (config.preset === 'custom') {
    const shapeMap: Record<string, number> = {
      'Checks': 0.1,
      'Stripes': 0.5,
      'Edge': 0.9,
    };
    cfg = {
      color1: config.color1,
      color2: config.color2,
      color3: config.color3,
      rotation: config.rotation ?? 0,
      proportion: config.proportion ?? 35,
      scale: config.scale ?? 1,
      speed: config.speed ?? 25,
      distortion: config.distortion ?? 12,
      swirl: config.swirl ?? 80,
      swirlIterations: config.swirlIterations ?? 10,
      softness: config.softness ?? 100,
      offset: config.offset ?? 0,
      shape: shapeMap[config.shape ?? 'Checks'] ?? 0.1,
      shapeSize: config.shapeSize ?? 10,
    };
  } else {
    cfg = presets.Prism;
  }

  const [color1, color2, color3] = [cfg.color1, cfg.color2, cfg.color3].map(hexToRgb);
  const shape = cfg.shape;

  useEffect(() => {
    const canvas = ref.current as HTMLCanvasElement;
    const parent = canvas.parentElement as HTMLElement;

    const renderer = new Renderer({
      dpr: Math.min(window.devicePixelRatio, 2),
      canvas,
      alpha: true,
      premultipliedAlpha: true,
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
        uColor1: { value: color1 },
        uColor2: { value: color2 },
        uColor3: { value: color3 },
        uRotation: { value: cfg.rotation },
        uProportion: { value: cfg.proportion },
        uScale: { value: cfg.scale },
        uSpeed: { value: cfg.speed },
        uDistortion: { value: cfg.distortion },
        uSwirl: { value: cfg.swirl },
        uSwirlIterations: { value: cfg.swirlIterations },
        uSoftness: { value: cfg.softness },
        uOffset: { value: cfg.offset },
        uShape: { value: shape },
        uShapeSize: { value: cfg.shapeSize },
      },
    });

    const mesh = new Mesh(gl, { geometry, program });

    const resize = () => {
      const w = parent.clientWidth;
      const h = parent.clientHeight;
      renderer.setSize(w, h);
      program.uniforms.uResolution.value.set(w, h);
    };

    window.addEventListener('resize', resize);
    resize();

    const start = performance.now();
    let frame = 0;

    const loop = () => {
      program.uniforms.uTime.value = (performance.now() - start) / 1000;
      renderer.render({ scene: mesh });
      frame = requestAnimationFrame(loop);
    };

    loop();

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', resize);
    };
  }, [color1, color2, color3, cfg.rotation, cfg.proportion, cfg.scale, cfg.speed, cfg.distortion, cfg.swirl, cfg.swirlIterations, cfg.softness, cfg.offset, shape, cfg.shapeSize]);

  return (
    <div
      className={`animated-gradient-container ${className}`}
      style={{
        position: 'absolute',
        inset: 0,
        borderRadius: radius,
        overflow: 'hidden',
        ...style,
      }}
      aria-hidden="true"
    >
      <canvas ref={ref} className="animated-gradient-canvas" />
      {noise && (
        <div
          className="animated-gradient-noise"
          style={{
            position: 'absolute',
            inset: 0,
            opacity: noise.opacity,
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='${noise.scale ?? 0.9}' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            pointerEvents: 'none',
          }}
        />
      )}
    </div>
  );
}