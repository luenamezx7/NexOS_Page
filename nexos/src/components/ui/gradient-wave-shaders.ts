/** Simplex noise and vertex-wave blending adapted from the supplied MiniGl component. */
const noise = `
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
float snoise(vec3 v) {
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m *= m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}`;

export const waveVertexShader = `
precision highp float;
attribute vec2 a_position;
uniform vec2 u_resolution;
uniform float u_time;
uniform float u_noiseSpeed;
uniform vec2 u_noiseFrequency;
uniform vec4 u_deform;
uniform vec4 u_deformNoise;
uniform float u_deformSpeed;
uniform vec3 u_colors[8];
uniform int u_colorCount;
varying vec3 v_color;
${noise}
void main() {
  float time = u_time * u_noiseSpeed;
  vec2 uv = a_position * 0.5 + 0.5;
  vec2 coord = u_resolution * a_position * u_noiseFrequency;
  float offset = u_resolution.x * 0.5 * u_deform.x * mix(u_deform.z, u_deform.y, uv.y);
  float wave = snoise(vec3(coord * u_deformNoise.xy + vec2(time * u_deformNoise.z, 0.0), time * u_deformSpeed + u_deformNoise.w)) * u_deform.w;
  wave = max(0.0, wave * (1.0 - pow(abs(a_position.y), 2.0)));
  vec2 pos = a_position * u_resolution * 0.5;
  pos.y += u_resolution.y * 0.5 * a_position.y + u_resolution.x * a_position.x * 0.5 * u_deform.x + wave - offset;
  v_color = u_colors[0];
  // Eight supported colors, without indexing the original four-slot active-color vector.
  for (int i = 1; i < 8; i++) {
    if (i < u_colorCount) {
      float layer = float(i);
      vec2 frequency = vec2(2.0, 3.0) + layer / float(u_colorCount);
      float blend = smoothstep(0.1, 0.63 + 0.07 * layer, snoise(vec3(coord * frequency + vec2(time * (6.5 + 0.3 * layer), 0.0), time * (11.0 + 0.3 * layer) + 5.0 + 10.0 * layer)) * 0.5 + 0.5);
      v_color = mix(v_color, u_colors[i], pow(blend, 4.0));
    }
  }
  gl_Position = vec4(pos * 2.0 / u_resolution, 0.0, 1.0);
}`;

export const waveFragmentShader = `
precision mediump float;
uniform float u_shadowPower;
uniform float u_darkenTop;
varying vec3 v_color;
void main() {
  vec3 color = v_color;
  color *= 1.0 - u_darkenTop * pow(gl_FragCoord.y / max(1.0, u_shadowPower * 200.0), 2.0) * 0.15;
  gl_FragColor = vec4(color, 1.0);
}`;
