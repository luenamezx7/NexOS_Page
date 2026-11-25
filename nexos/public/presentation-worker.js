"use strict";(()=>{var N=`
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec3 u_colors[8];
uniform vec4 u_scene;
uniform vec4 u_shape;
uniform vec4 u_surface;
uniform vec4 u_finish;
uniform vec4 u_transform;
uniform vec4 u_space;
uniform vec4 u_cursor;
#define u_resolution u_scene.xy
#define u_time u_scene.z
#define u_colorCount u_scene.w
#define u_scale u_shape.x
#define u_intensity u_shape.y
#define u_paramA u_shape.z
#define u_warp u_shape.w
#define u_detail u_surface.x
#define u_contrast u_surface.y
#define u_brightness u_surface.z
#define u_saturation u_surface.w
#define u_hue u_finish.x
#define u_vignette u_finish.y
#define u_blur u_finish.z
#define u_grain u_finish.w
#ifdef GL_FRAGMENT_PRECISION_HIGH
#define u_seed u_transform.x
#else
#define u_seed mod(u_transform.x, 31.0)
#endif
#define u_rotate u_transform.y
#define u_drift u_transform.z
#define u_oklab u_transform.w
#define u_offset u_space.xy
#define u_mouse u_space.zw
#define u_cursorPresence u_cursor.x
#define u_cursorEffect u_cursor.y
#define u_cursorStrength u_cursor.z
#define u_cursorRadius u_cursor.w
float hash21(vec2 p) {
#ifndef GL_FRAGMENT_PRECISION_HIGH
  p = mod(p, 31.0);
#endif
  p = fract(p * vec2(234.34, 435.345));
  p += dot(p, p + 34.23);
  return fract(p.x * p.y);
}
float grainHash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
vec2 hash22(vec2 p) {
#ifndef GL_FRAGMENT_PRECISION_HIGH
  p = mod(p, 31.0);
#endif
  float n = sin(dot(p, vec2(41.0, 289.0)));
  return fract(vec2(15731.743, 7892.321) * n);
}
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash21(i), hash21(i + vec2(1.0, 0.0)), u.x),
    mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), u.x),
    u.y);
}
float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p = p * 2.03 + vec2(17.0, 9.2);
    a *= 0.5;
  }
  return v;
}
vec3 srgbToLinear(vec3 c) {
  return mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)), step(0.04045, c));
}
vec3 linearToSrgb(vec3 c) {
  return mix(c * 12.92, 1.055 * pow(max(c, vec3(0.0)), vec3(1.0 / 2.4)) - 0.055,
    step(0.0031308, c));
}
vec3 linToOklab(vec3 c) {
  float l = 0.4122214708 * c.r + 0.5363325363 * c.g + 0.0514459929 * c.b;
  float m = 0.2119034982 * c.r + 0.6806995451 * c.g + 0.1073969566 * c.b;
  float s = 0.0883024619 * c.r + 0.2817188376 * c.g + 0.6299787005 * c.b;
  l = pow(max(l, 0.0), 1.0 / 3.0);
  m = pow(max(m, 0.0), 1.0 / 3.0);
  s = pow(max(s, 0.0), 1.0 / 3.0);
  return vec3(
    0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s);
}
vec3 oklabToLin(vec3 c) {
  float l = c.x + 0.3963377774 * c.y + 0.2158037573 * c.z;
  float m = c.x - 0.1055613458 * c.y - 0.0638541728 * c.z;
  float s = c.x - 0.0894841775 * c.y - 1.2914855480 * c.z;
  l = l * l * l; m = m * m * m; s = s * s * s;
  return vec3(
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s);
}
vec3 mixColour(vec3 a, vec3 b, float t) {
  if (u_oklab > 0.5) {
    vec3 la = linToOklab(srgbToLinear(a));
    vec3 lb = linToOklab(srgbToLinear(b));
    return clamp(linearToSrgb(oklabToLin(mix(la, lb, t))), 0.0, 1.0);
  }
  return mix(a, b, t);
}
vec3 palette(float x) {
  float n = max(u_colorCount - 1.0, 1.0);
  float f = clamp(x, 0.0, 1.0) * n;
  vec3 col = u_colors[0];
  for (int i = 0; i < 7; i++) {
    if (float(i) < n)
      col = mixColour(col, u_colors[i + 1],
        smoothstep(0.0, 1.0, clamp(f - float(i), 0.0, 1.0)));
  }
  return col;
}
vec3 hueRotate(vec3 col, float a) {
  const mat3 toYIQ = mat3(0.299, 0.596, 0.211,
                          0.587, -0.274, -0.523,
                          0.114, -0.322, 0.312);
  const mat3 toRGB = mat3(1.0, 1.0, 1.0,
                          0.956, -0.272, -1.106,
                          0.621, -0.647, 1.703);
  vec3 yiq = toYIQ * col;
  float ca = cos(a), sa = sin(a);
  yiq = vec3(yiq.x, yiq.y * ca - yiq.z * sa, yiq.y * sa + yiq.z * ca);
  return toRGB * yiq;
}
vec3 shade(vec2 uv, vec2 p, float t) {
  vec2 q = p * 1.6;
  float amp = 0.25 + u_intensity * 0.85;
  for (float i = 1.0; i < 5.0; i += 1.0) {
    q.x += amp / i * cos(i * 2.4 * q.y + t * 0.8 + u_seed);
    q.y += amp / i * cos(i * 1.7 * q.x + t * 0.6);
  }
  return palette(0.5 + 0.5 * sin(q.x + q.y));
}
void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  vec2 screenUv = uv;
  vec2 p = (gl_FragCoord.xy - 0.5 * u_resolution.xy)
    / min(u_resolution.x, u_resolution.y);
  float cursorMask = 0.0;
  // Cursor modes 1\u20133 are local distortions. Push shifts screen-space
  // coordinates before field transforms, so Zoom/Rotate don't change its feel.
  if (u_cursorPresence > 0.001) {
    vec2 cursor = (0.5 * u_mouse * u_resolution.xy)
      / min(u_resolution.x, u_resolution.y);
    vec2 cursorDelta = p - cursor;
    if (u_cursorEffect < 0.5) {
      p += cursor * u_cursorPresence * u_cursorStrength * 0.55;
    } else {
      float cursorDistance = length(cursorDelta);
      vec2 cursorDirection = cursorDelta / max(cursorDistance, 0.0001);
      cursorMask = u_cursorPresence * (1.0 - smoothstep(0.0, u_cursorRadius, cursorDistance));
      if (u_cursorEffect < 1.5) {
        p -= cursorDirection * cursorMask * u_cursorStrength * 0.24;
      } else if (u_cursorEffect < 2.5) {
        float cursorAngle = cursorMask * u_cursorStrength * 2.2;
        float cc = cos(cursorAngle), cs = sin(cursorAngle);
        p = cursor + mat2(cc, -cs, cs, cc) * cursorDelta;
      } else if (u_cursorEffect < 3.5) {
        float ripple = sin(cursorDistance / max(u_cursorRadius, 0.001) * 18.0 - u_time * 5.0);
        p -= cursorDirection * ripple * cursorMask * u_cursorStrength * 0.07;
      }
    }
  }
  uv = p * min(u_resolution.x, u_resolution.y) / u_resolution.xy + 0.5;
  p *= u_scale;
  if (abs(u_rotate) > 0.0001) {
    float cr = cos(u_rotate), sr = sin(u_rotate);
    p = mat2(cr, -sr, sr, cr) * p;
  }
  p += u_offset;
  if (u_drift > 0.0001) p += u_drift * vec2(sin(u_time * 0.31), cos(u_time * 0.23));
  if (u_warp > 0.0) {
    p += u_warp * (vec2(fbm(p * u_detail + u_seed), fbm(p * u_detail + vec2(5.2, 1.3))) - 0.5);
  }
  vec3 col;
  if (u_blur > 0.0) {
    float e = u_blur;
    float pe = e * u_scale;
    vec2 uvE = vec2(e) * min(u_resolution.x, u_resolution.y) / u_resolution.xy;
    col  = shade(uv, p, u_time) * 0.36;
    col += shade(uv + vec2(uvE.x, 0.0), p + vec2(pe, 0.0), u_time) * 0.16;
    col += shade(uv - vec2(uvE.x, 0.0), p - vec2(pe, 0.0), u_time) * 0.16;
    col += shade(uv + vec2(0.0, uvE.y), p + vec2(0.0, pe), u_time) * 0.16;
    col += shade(uv - vec2(0.0, uvE.y), p - vec2(0.0, pe), u_time) * 0.16;
  } else { col = shade(uv, p, u_time); }
  if (abs(u_contrast - 1.0) > 0.0001) col = (col - 0.5) * u_contrast + 0.5;
  if (abs(u_saturation - 1.0) > 0.0001) {
    float luma = dot(col, vec3(0.299, 0.587, 0.114));
    col = mix(vec3(luma), col, u_saturation);
  }
  if (abs(u_hue) > 0.0001) col = hueRotate(col, u_hue);
  if (abs(u_brightness) > 0.0001) col += u_brightness;
  if (u_vignette > 0.0001) {
    float vd = length(screenUv - 0.5) * 1.41421356;
    col *= 1.0 - u_vignette * smoothstep(0.35, 1.0, vd);
  }
  if (u_cursorPresence > 0.001 && u_cursorEffect > 3.5)
    col += (vec3(0.18) + col * 0.12) * cursorMask * u_cursorStrength;
  if (u_grain > 0.0001)
    col += (grainHash(gl_FragCoord.xy + vec2(u_seed * 17.0, u_seed * 31.0)) - 0.5) * u_grain;
  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`;var F={tileSize:256,logoScale:.7,finalScale:.69,logoOffset:[0,0],opticalDepth:1.1,dispersion:1.7,colorBleed:1.25,doubleBevel:1,bevelWidth:.14,corner:4.8,cornerPull:2.1,cornerWidth:2.2,cornerFocus:.58,edgeSmear:2.85,stretch:0,tilt:.35,bulge:1,specular:1,halo:0,shadow:1,ripple:1,bounce:0,response:.42,startSize:.2,startZoom:2.6,glide:2.3,present:2.4,drift:.12,swell:.5,focus:1,sheen:1,lightTurn:.9},l=512,Q=.75;function X(){return typeof document>"u"?new OffscreenCanvas(l,l):document.createElement("canvas")}function z(o){return o.getContext("2d",{willReadFrequently:!0})}function K(o,t,e,r,a){let n=X();n.width=l,n.height=l;let c=z(n),s=Math.min(l/t,l/e),u=(l-t*s)/2,p=(l-e*s)/2;c.drawImage(a??o,u,p,t*s,e*s);let i=c.getImageData(0,0,l,l).data,f=!0;for(let h=3;h<i.length;h+=388)if(i[h]<250){f=!1;break}let w=[i[0],i[1],i[2]],E=(h,d,v)=>Math.min(1,Math.max(0,(Math.hypot(h-w[0],d-w[1],v-w[2])/441-.08)/.2)),m=l,x=l,g=-1,_=-1;for(let h=0;h<l;h++)for(let d=0;d<l;d++){let v=(h*l+d)*4;(f?E(i[v],i[v+1],i[v+2])*255:i[v+3])>8&&(d<m&&(m=d),d>g&&(g=d),h<x&&(x=h),h>_&&(_=h))}if(g<0)throw new Error("The image is empty. Use a logo with visible pixels.");let C=g-m+1,T=_-x+1,S=l*Q/Math.max(C,T),L=X();L.width=l,L.height=l;let R=z(L);R.imageSmoothingQuality="high";let k=l/2-(m+C/2-u)*S,ie=l/2-(x+T/2-p)*S;if(R.drawImage(o,k,ie,t*s*S,e*s*S),f){let h=R.getImageData(0,0,l,l),d=h.data;for(let v=0;v<d.length;v+=4)d[v+3]=Math.round(d[v+3]*E(d[v],d[v+1],d[v+2]));R.putImageData(h,0,0)}if(r){let h=R.getImageData(0,0,l,l);for(let d=0;d<h.data.length;d+=4){let v=(.2126*h.data[d]+.7152*h.data[d+1]+.0722*h.data[d+2])/255;h.data[d+3]=Math.round(h.data[d+3]*(1-v)),h.data[d]=h.data[d+1]=h.data[d+2]=255}R.putImageData(h,0,0)}return L}function V(o){let t=l*l,e=z(o).getImageData(0,0,l,l).data,r=1e20,a=new Float64Array(t),n=new Float64Array(t);for(let i=0;i<t;i++){let f=e[i*4+3]/255;if(f>=1)a[i]=0,n[i]=r;else if(f<=0)a[i]=r,n[i]=0;else{let w=.5-f;a[i]=w>0?w*w:0,n[i]=w<0?w*w:0}}let c=new Float64Array(l),s=new Float64Array(l+1),u=new Uint16Array(l);Z(a,c,u,s,r),Z(n,c,u,s,r);let p=new Float32Array(t);for(let i=0;i<t;i++)p[i]=(Math.sqrt(a[i])-Math.sqrt(n[i]))/l;return p}function Z(o,t,e,r,a){for(let n=0;n<l;n++)Y(o,n,l,t,e,r,a);for(let n=0;n<l;n++)Y(o,n*l,1,t,e,r,a)}function Y(o,t,e,r,a,n,c){a[0]=0,n[0]=-c,n[1]=c,r[0]=o[t];for(let s=1,u=0,p=0;s<l;s++){r[s]=o[t+s*e];let i=s*s;do{let f=a[u];p=(r[s]-r[f]+i-f*f)/(s-f)/2}while(p<=n[u]&&--u>-1);u++,a[u]=s,n[u]=p,n[u+1]=c}for(let s=0,u=0;s<l;s++){for(;n[u+1]<s;)u++;let p=a[u],i=s-p;o[t+s*e]=r[p]+i*i}}function J(o,t,e,r){let a=K(o,t,e,!1);return{canvas:a,sdf:V(a),eyesSdf:r?V(K(r,t,e,!1,o)):void 0}}var le=`#version 300 es
in vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }`,ue=`#version 300 es
precision highp float;
out vec4 outColor;

uniform vec2 uCenter;      // device px, GL coords
uniform float uTile;       // tile size, device px
uniform sampler2D uSdf;    // signed distance, texture units, + outside
uniform sampler2D uEyes;
uniform float uBlink;
uniform float uHasEyes;
uniform sampler2D uCol;    // premultiplied colour, mipmapped
uniform float uTexSize;
uniform float uBoxFrac;

uniform float uPlateScale; // plate size relative to the tile
uniform float uShapeN;     // superellipse exponent: 2 = circle
uniform float uCornerN;    // final exponent, used by the ghost
uniform float uOptics;     // 1 = full refraction, 0 = flat
uniform float uPlateAlpha; // 1 = glass shown, 0 = bare logo
uniform float uLogoHalf;   // logo half size in plate units (zoom included)
uniform vec2 uLogoOff;     // where the logo's centre sits, plate units (it scales about this point)
uniform float uBold;       // stroke swell, in logo half-size units
uniform float uBlur;       // edge softness, plate units
uniform float uFrost;      // milky lift inside a young bubble
uniform float uDome;       // lens bulge height
uniform float uDrop;       // 1 while the glass is still a round droplet, 0 once it has spread into the tile
uniform float uPinch;      // the tile face's stretch toward its corners (pincushion), at the rim
uniform float uTilt;       // how much more the rising diagonal's corners stretch than the other two (0\u20131)
uniform float uRim;
uniform float uHalo;
uniform float uShadow;
uniform float uGhost;
uniform float uRipR;       // ripple radius, plate sizes
uniform float uRipA;
uniform float uBare;       // 1 once the logo may show without glass (the ending)
uniform float uReach;      // the rim band's full width, plate units (the pull depth is sized by it)
uniform float uCornerPull; // how much harder the corners pull than the sides
uniform float uStreak;     // how far a corner smears content along the rim, in band widths
uniform float uWiden;      // how much wider the folding band grows toward the corners
uniform float uSlab;       // how far the slab stands above the logo below its rounded edge, plate units
uniform float uEtaSpread;  // index spread across the spectrum (red highest)
uniform float uFocus;      // how far in along the diagonal a corner focuses, plate units
uniform float uFocusK;     // how quickly the view slides back from the focus across the band
uniform float uFocusSplit; // how much further in red meets than violet, plate units
uniform float uRimLine;    // how far across the band the sight line takes to turn in to the focus
uniform float uCornerOn;   // 0 while the glass is a round droplet, 1 once it has spread into the tile
uniform float uDissolve;   // 0 \u2192 1 as the glass lets go of the logo
uniform float uGlow;       // colour bleed in the rim, plate units on screen
uniform float uFaceDisp;   // lateral colour across the face: red/violet scale apart by \xB1this
uniform float uVivid;      // chroma lift of the dispersed light

uniform float uKeep;
uniform float uSheen;
uniform float uSweep;
uniform float uLightAng;
uniform float uLightGlass;
uniform float uDisp;
uniform float uDouble;
uniform float uBevelW;
uniform float uSpec;
uniform float uIconPlate;
uniform float uUseColor;
uniform float uLightScene; // 1 = light backdrop, 0 = dark

uniform vec3 uBg;
uniform vec3 uPlateCol;
uniform vec3 uLogoCol;

vec2 rot(vec2 v, float a) { float c = cos(a), s = sin(a); return vec2(c*v.x-s*v.y, s*v.x+c*v.y); }

float px; // one device pixel in plate units

// aa: footprint of one screen pixel at q, plate units (one pixel where nothing bends the view).
vec4 logoAt(vec2 q, float blur, float aa) {
  float L = uLogoHalf;
  float k = 0.5 * uBoxFrac / L;                    // plate units -> texture units
  vec2 uv = vec2(0.5 + (q.x - uLogoOff.x) * k, 0.5 - (q.y - uLogoOff.y) * k);
  float d = texture(uSdf, uv).r / k;
  if (uHasEyes > 0.5) {
    // The eye field shares the body's crop. Scale only the holes around their
    // original centre, leaving the outline and mouth completely unchanged.
    vec2 eyeUv = vec2(uv.x, clamp(0.6037 + (uv.y - 0.6037) / uBlink, 0.0, 1.0));
    float eyeD = texture(uEyes, eyeUv).r * uBlink / k;
    d = max(d, -eyeD);
  }               // plate units
  float w = 0.75 * aa + blur;
  float a = 1.0 - smoothstep(-w, w, d - uBold * L);
  vec3 c = uLogoCol;
  if (uUseColor > 0.5) {
    float lod = log2(max(1.0, w * k * uTexSize));
    vec4 c0 = textureLod(uCol, uv, lod);
    vec4 c1 = textureLod(uCol, uv, lod + 3.0);
    vec4 c2 = textureLod(uCol, uv, 7.0);
    c = c2.rgb / max(c2.a, 1e-4);
    c = mix(c, c1.rgb / max(c1.a, 1e-4), smoothstep(0.0, 0.06, c1.a));
    c = mix(c, c0.rgb / max(c0.a, 1e-4), smoothstep(0.02, 0.3, c0.a));
  }
  return vec4(c, a);
}

// Superellipse field. Returns signed distance (plate units, \u2212 inside); g = 1 on the rim.
float shape(vec2 p, float scale, float n, out vec2 nOut, out float g, out vec2 dg) {
  vec2 pp = p / scale;
  vec2 a = max(abs(pp), vec2(1e-6));
  g = pow(pow(a.x, n) + pow(a.y, n), 1.0 / n);
  dg = sign(pp) * pow(a, vec2(n - 1.0)) * pow(max(g, 1e-6), 1.0 - n);
  float dgl = max(length(dg), 1e-6);
  nOut = dg / dgl;
  return (g - 1.0) / dgl * scale;
}

// Curvature radius (plate units) of the shape's contour through p.
float contourRadius(vec2 p, float scale, float n) {
  vec2 a = max(abs(p / scale), vec2(1e-4));
  vec2 a1 = pow(a, vec2(n - 1.0));
  vec2 a2 = pow(a, vec2(n - 2.0));
  float k = (n - 1.0) * (a2.x * a1.y * a1.y + a2.y * a1.x * a1.x) / pow(max(dot(a1, a1), 1e-30), 1.5);
  return scale / max(k, 1e-3);
}

// Where the glass at x = s / bwF across its rounded edge looks. The tile is a slab standing uSlab above
// the logo, its edge a quarter-round of radius bwF. A straight-down sight line meets the edge tilted by
// \u03B8 (sin \u03B8 = 1 \u2212 x), bends inward by \u03B8 \u2212 \u03B8r (Snell, index eta) and reaches the logo plane displaced by
// z\xB7tan(\u03B8 \u2212 \u03B8r), z the height of the surface. So the outer rim looks deepest and the view eases back to
// the face across the edge: whatever lies within reach is drawn out to the rim, mirrored and compressed
// near it, and meets itself at the inner edge of the bevel, where a stroke near the rim melts into it.
// Rays from a curved stretch of rim converge on its centre of curvature R; they reach a little past it
// and no further. The young droplet's dome pulls every sample toward the middle.
vec2 refractSample(float x, float bwF, float eta, float R, vec2 dirOut, vec2 p, float dome, float offMul) {
  float u = clamp(1.0 - x, 0.0, 0.995);
  float th = asin(u), thr = asin(u / eta);
  float z = uSlab + bwF * sqrt(1.0 - u * u);
  float off = offMul * z * tan(th - thr);
  off = off / (1.0 + off / (6.0 * R));
  return p - (dirOut * off + p * dome) * uOptics;
}

float gauss(float x, float c, float w) { float d = (x - c) / w; return exp(-0.5 * d * d); }
float band(float x, float a, float b, float w) { return smoothstep(a - w, a, x) * (1.0 - smoothstep(b, b + w, x)); }

// Visible spectrum, red (0) to violet (1), weighted so a dark edge seen through the glass fringes
// gold \u2192 orange \u2192 red on one side and cyan \u2192 sky \u2192 blue \u2192 ultramarine on the other (solved over 12
// samples; red reaches into the yellows so warm fringes never read lime).
float bump(float x, float c, float w) { float d = (x - c) / w; return exp(-0.5 * d * d); }
vec3 spectrum(float x) {
  return vec3(bump(x, 0.34, 0.2) + 0.08 * bump(x, 0.93, 0.05), bump(x, 0.58, 0.1), bump(x, 0.8, 0.11));
}

float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }

void main() {
  px = 2.0 / uTile;
  vec2 p = (gl_FragCoord.xy - uCenter) * px;       // plate units, y up

  vec4 lg = logoAt(p, uBlur, px);
  vec3 plain = mix(uBg, lg.rgb, lg.a * uBare);

  vec2 nOut, dg; float g;
  float sd = shape(p, uPlateScale, uShapeN, nOut, g, dg);
  float s = -sd;
  float bw = max(uBevelW, 0.004) * uPlateScale;
  float x = clamp(s / bw, 0.0, 1.0);
  float R = contourRadius(p, uPlateScale, uShapeN);
  vec2 pq = p * p;
  float diag = 4.0 * pq.x * pq.y / max((pq.x + pq.y) * (pq.x + pq.y), 1e-6);   // 1 on the diagonals, 0 on the axes
  // The tile sits slightly tipped along its rising diagonal, so light crosses more glass at the lower-left
  // and upper-right corners: they stretch and pull harder than the other two (as in the reference).
  float tilt = mix(1.0 - uTilt, 1.0, smoothstep(-0.02, 0.02, p.x * p.y));
  float pinchPart = uPinch * min(g * g, 1.0) * diag * diag * tilt;
  float dome = uDome * (1.0 - min(g * g, 1.0)) + pinchPart;
  // Light through the rim bends mostly straight across it and a little toward the middle, so near a
  // corner the dark of the logo is drawn along both neighbouring edges.
  vec2 dirOut = normalize(mix(nOut, p / max(length(p), 1e-4), 0.2));
  // A rounded corner curves both ways, so it bends light harder than a straight side: the corners draw
  // content in from deep inside (the reference stretches the heads and the beam's end into them) while
  // the middles of the sides stay light. The extra pull fades out gradually along the two edges next to
  // a corner (it follows how diagonal the position is, not just the edge's direction), so what a corner
  // draws in wraps along them, about halfway to the middle of each side.
  float cornerness = max(smoothstep(0.1, 0.9, 4.0 * nOut.x * nOut.x * nOut.y * nOut.y), smoothstep(0.15, 0.75, diag));
  float offMul = 1.0 + 0.4 * max(uCornerPull - 1.0, 0.0) * tilt * cornerness * uCornerOn;
  // Around a corner the curved edge focuses: every sight line through it, along the arc and along the
  // stretches of edge next to it, meets at one point a little way in along the diagonal. The rim sees
  // that point itself and the view slides back to the face across the band, so whatever lies there (the
  // head, the end of the beam) is spread all round the corner and down both edges.
  vec2 focus = sign(p) * (pow(0.5, 1.0 / uShapeN) - uFocus * 0.70710678) * uPlateScale;
  float focusW = tilt * cornerness * uOptics * uCornerOn;
  // The folding band itself also widens toward those corners, so what the rim draws in from the logo
  // shows as a broad smear hugging the corner rather than a hairline, while along the straight sides it
  // stays as narrow as the bevel. It keeps its width while the glass lets go, so smears fade in place.
  // (Only once the droplet has spread into the tile: a round droplet has no corners.)
  float bwF = max(uReach, 0.004) * (1.0 + uWiden * tilt * cornerness * uCornerOn);
  float xf = clamp(s / bwF, 0.0, 1.0);
  // Footprint of one pixel after refraction (centre wavelength). Measured here, in uniform control flow,
  // so the logo is filtered wherever the glass compresses it instead of breaking into shards.
  vec2 qc = refractSample(xf, bwF, 1.5, R, dirOut, p, dome, offMul);
  float foot = max(max(length(dFdx(qc)), length(dFdy(qc))), 0.25 * px);

  // Backdrop: anticipation ghost, ripple, soft lift shadow and glow.
  vec3 bg = uBg;
  vec3 lift = mix(uBg + vec3(0.06), mix(uBg, vec3(1.0), 0.55), uLightScene);
  if (uGhost > 0.001) {
    vec2 gn, gdg; float gg;
    float gsd = shape(p, 1.0, uCornerN, gn, gg, gdg);
    bg = mix(bg, lift, uGhost * 0.12 * (1.0 - smoothstep(-0.16, 0.14, gsd)));
    bg *= 1.0 - uGhost * 0.03 * uLightScene * exp(-max(gsd, 0.0) / 0.12) * step(0.0, gsd);
  }
  float outside = max(sd, 0.0);
  if (uRipA > 0.001) {
    float d0 = (uRipR - 1.0) * uPlateScale;
    float rx = (sd - d0) / 0.022;
    float ring = exp(-rx * rx);
    bg += uRipA * ring * (0.04 * (0.55 + 0.45 * dot(nOut, normalize(vec2(-0.5, 0.8))))) * mix(0.5, 1.0, uLightScene);
    bg -= uRipA * 0.016 * uLightScene * exp(-(rx - 1.6) * (rx - 1.6));
  }
  // The droplet's soft shadow: about 3 % at its edge and still half that a droplet radius away.
  float shadowFall = max(sd, 0.0) / (0.9 * uPlateScale);
  bg *= 1.0 - uShadow * 0.03 * exp(-shadowFall * shadowFall) * step(0.0, sd);
  vec3 haloCol = mix(vec3(0.62, 0.69, 0.80), vec3(1.0), uLightScene);
  bg = mix(bg, haloCol, clamp(uHalo * (0.30 * exp(-outside / (0.025 * uPlateScale)) + 0.07 * exp(-outside / (0.12 * uPlateScale))), 0.0, 1.0) * step(0.0, sd));

  vec3 col = bg;
  float soft = px + uBlur * 0.8 + 0.06 * uDissolve * (1.0-uKeep) * uPlateScale;
  if (sd < soft) {
    // Surface for lighting: a superellipse quarter (k = 2.6), flat towards the face and steep at the rim.
    float y1 = 1.0 - x;
    const float K = 2.6;
    float base1 = max(1.0 - pow(y1, K), 1e-4);
    float db = min(pow(y1, K - 1.0) * pow(base1, 1.0 / K - 1.0), 25.0);   // slope of the rim
    // Second, lower step just inside the first one: its slope draws the faint inner line.
    float s1 = bw * 0.62;
    float w2 = bw * 0.22;
    float t2 = clamp((s - s1) / w2, -1.0, 1.0);
    float dh2 = uDouble * bw * 0.16;
    float dd = dh2 * 0.5 * cos(t2 * 1.5707963) * 1.5707963 / w2 * step(abs(t2), 0.999);
    // Lens bulge across the whole face (the young bubble); shades the surface.
    vec2 gDome = -uDome * 2.0 * g * dg * step(g, 1.0);
    vec2 grad = -(db + dd) * nOut + gDome;         // height gradient

    vec3 back = mix(uBg, uPlateCol, uIconPlate);
    vec3 liftG = mix(back + vec3(0.06), mix(back, vec3(1.0), 0.55), uLightGlass);
    // Light bent this far also defocuses: blur grows with the refraction distance. On top of that, in
    // the rim band only, a soft glow of fixed size on screen, so colour bleeds smoothly where the fold
    // compresses the view (foot / px is how much it compresses here). It is capped: right at the edge
    // the compression runs past 20\xD7, and an uncapped glow would reach strokes the rim does not see.
    float rblur = uBlur + 0.05 * length(qc - p) + min(uGlow * uOptics * (1.0 - xf) * foot / px, 0.04);

    // Colour. Each wavelength refracts by its own index, so the displacement, and with it the colour
    // split, grows with how strongly the edge bends the view and vanishes on the flat face: the logo
    // stays crisp while everything the edge draws in fans into colour. Red is made the most strongly bent,
    // which puts the warm line where a smear meets the rim and the broad cyan glow on its inner side, the
    // order in Apple's capture.
    // Around a corner, light also runs along the curved edge, so what the corner draws in is smeared
    // along the rim and wraps the corner. The samples spread along the edge in golden-ratio order, so
    // every colour covers the whole smear.
    float cornerW = smoothstep(0.1, 0.9, 4.0 * nOut.x * nOut.x * nOut.y * nOut.y);
    float streak = 0.35 * uStreak * bw * mix(0.15, 1.0, cornerW) * pow(1.0 - xf, 1.5) * uOptics;
    vec2 tangent = vec2(-nOut.y, nOut.x);
    vec3 acc = vec3(0.0), wsum = vec3(0.0);
    for (int i = 0; i < 20; i++) {
      float lam = (float(i) + 0.5) / 20.0;
      float c = uDisp * (1.0 - 2.0 * lam);   // + red \u2026 \u2212 violet
      vec2 along = tangent * (streak * 2.0 * (fract(float(i) * 0.618034 + 0.31) - 0.5));
      float cf = uDisp * (1.0 - 2.0 * lam) * (lam > 0.5 ? 1.0 : 0.5);
      vec2 sp = refractSample(xf, bwF, 1.5 + uEtaSpread * c, R, dirOut, p + along,
                              dome + pinchPart * 0.3 * c, offMul);
      // The corner's focus splits by colour too: red meets a little further in, so it stays on the
      // stroke a little longer across the band and the smear's inner side glows cyan. Right at the rim
      // the sight line grazes and first sees the edge itself; blue turns in to the focus sooner than red,
      // so where a smear meets the rim it ends in a thin warm line.
      vec2 focusL = focus - sign(p) * (0.70710678 * uFocusSplit * c * uPlateScale);
      float wFocus = pow(1.0 - xf, uFocusK) * smoothstep(0.0, uRimLine * (1.0 + 0.6 * c), xf);
      sp = mix(sp, mix(p + along, focusL, wFocus), focusW);
      // Across the face the glass is a gentle lens that spreads colour too: edges of the logo facing the
      // rim carry a thin warm line and edges facing the middle a cyan one, as measured on the reference's
      // stem. Red is also a little out of focus, which turns the cyan side into a soft glow.
      // (Only on the flat face: inside the edge band the refraction would magnify this small offset into
      // a broad bar of colour.)
      float faceOnly = smoothstep(0.7, 1.0, xf) * uOptics;
      sp *= 1.0 + uFaceDisp * cf * faceOnly;
      vec4 l = logoAt(sp, rblur + 0.12 * streak + uFaceDisp * 0.5 * max(c, 0.0) * faceOnly, foot);
      vec3 w = spectrum(lam);
      acc += mix(back, l.rgb, l.a) * w;
      wsum += w;
    }
    vec3 trans = acc / wsum;
    // Split light reads as colour, not grey: lift the chroma of whatever the dispersion separated
    // (neutral greys are untouched), so the cyan glow and the gold rim line are as vivid as in the
    // reference, where the cyan is brighter than the backdrop itself.
    float tl = dot(trans, vec3(0.2126, 0.7152, 0.0722));
    trans = clamp(tl + (trans - tl) * (1.0 + uVivid * uOptics), 0.0, 1.0);
    // A young droplet is milky; it clears as it grows. The haze only ever lightens: on a light backdrop
    // it brightens what is light behind it and leaves dark content dark (in the reference the magnified
    // logo stays navy in the milk); on a dark backdrop it lifts the dark and leaves a white logo white.
    float hazeLum = dot(trans, vec3(0.2126, 0.7152, 0.0722));
    float hazeGate = mix(1.0 - smoothstep(0.25, 0.75, hazeLum), smoothstep(0.25, 0.75, hazeLum), uLightGlass);
    trans = mix(trans, liftG, uFrost * 0.45 * hazeGate);

    // How much glass is left: shading and highlights thin out as the glass lets go, so it never
    // lingers as an empty outline.
    float glassAmt = pow(1.0 - uDissolve, 1.5);
    float lit = uSpec * glassAmt;
    vec3 rimCol = mix(vec3(0.80, 0.87, 0.97), vec3(1.0), uLightGlass);

    // Light backdrop, fitted to luminance profiles measured across the reference capture's rim.
    // The thick rounded edge scatters the light of the surroundings, so it glows softly white over a
    // face that stays clear (diffuse light, the frosted look of thick glass):
    //  \xB7 the droplet, while round, glows in a broad band about a tenth of its radius wide, some 15
    //    levels above the backdrop, with a crisp bright line at the very edge;
    //  \xB7 the tile it spreads into keeps a quieter band, about 7 levels up, from just inside the edge
    //    to a tenth of the tile in, with a bright inner lip about 0.15 of the tile in;
    //  \xB7 at the very edge a hairline catches a soft overhead light: bright along the top and right,
    //    turning to a thin dark silhouette line down the left and along the bottom.
    // The glow lifts only what is light behind it, so dark content drawn into the rim keeps its colour.
    float sc = uPlateScale;
    float tLum = dot(trans, vec3(0.2126, 0.7152, 0.0722));
    float lightOnly = smoothstep(0.35, 0.85, tLum);
    float hw = smoothstep(-0.85, 0.5, dot(nOut, rot(vec2(0.5, 0.866), uLightAng)));
    float tileBand = band(s, 0.016 * sc, 0.075 * sc, 0.022 * sc);
    float dropBand = (1.0 - smoothstep(0.06 * sc, 0.13 * sc, s)) * smoothstep(0.0, 0.004 * sc, s);
    float glow = mix(0.32 * tileBand, 0.75 * dropBand, uDrop) * lightOnly;
    float edgeLine = gauss(s, 0.005 * sc, 0.0045 * sc);
    float lip = gauss(s, 0.15 * sc, 0.007 * sc) * uDouble * (1.0 - uDrop);
    vec3 lightGlass = mix(trans, vec3(1.0), glow * glassAmt);
    lightGlass += (0.075 * hw * edgeLine + 0.06 * (0.4 + 0.6 * hw) * lip) * lit;
    lightGlass *= 1.0 - 0.05 * (1.0 - hw) * edgeLine * glassAmt * (1.0 - uDrop);
    lightGlass = mix(lightGlass, vec3(1.0), 0.55 * uDrop * glassAmt * edgeLine);

    // Dark backdrop: a cool rim light that grows toward the steep edge, and a small key highlight.
    vec3 Nl = normalize(vec3(-grad, 1.0));
    float edge = 1.0 - Nl.z;
    vec2 ldir = rot(normalize(vec2(-0.62, 0.78)), uLightAng);
    float side = dot(nOut, ldir);
    float fres = pow(edge, 1.5);
    vec3 rim = rimCol * fres * (0.35 + 0.65 * max(side, -side * 0.8)) * uRim * 0.65;
    vec3 Hv = normalize(normalize(vec3(-0.45, 0.6, 0.66)) + vec3(0.0, 0.0, 1.0));
    float sp = pow(max(dot(Nl, Hv), 0.0), 140.0) * 0.8 * smoothstep(0.0, 0.25, y1);
    vec3 darkGlass = trans * (1.0 - 0.25 * fres) + (rim + vec3(sp)) * lit;

    // On the dark backdrop the droplet wears a soft bright rim; it thins away once the tile has formed.
    darkGlass = mix(darkGlass, rimCol, uDrop * 0.4 * uSpec * (1.0 - smoothstep(0.0, 0.1 * uPlateScale, s)));
    vec3 glass = mix(darkGlass, lightGlass, uLightGlass);
    float sweepD = dot(p / uPlateScale, normalize(vec2(0.8, 0.6))) - uSweep;
    float sheen = uSheen * glassAmt * exp(-sweepD*sweepD / 0.03) * (0.55 + 0.45*(1.0-x));
    glass = mix(glass, vec3(1.0), sheen * mix(0.22, 0.42, uLightGlass));

    // The edge starts soft and sharpens as the bubble condenses, and softens again as the glass
    // dissolves: blur and scale arrive and leave together.
    float cov = clamp(0.5 - sd / soft, 0.0, 1.0);
    col = mix(bg, glass, cov);
  }

  vec3 outc = mix(plain, col, uPlateAlpha);
  outc += (hash(gl_FragCoord.xy) - 0.5) / 255.0;
  // Composite the black-backed optical pass over the live Silk surface.
  // RGB is unpremultiplied because the WebGL context requests that format.
  float alpha = clamp(max(max(outc.r, outc.g), outc.b), 0.0, 1.0);
  outColor = vec4(clamp(outc / max(alpha, 1e-5), 0.0, 1.0), alpha);
}`,ee=o=>Math.max(0,Math.min(1,o)),D=(o,t,e)=>o+(t-o)*e,b=(o,t,e)=>{let r=ee((e-o)/(t-o));return r*r*(3-2*r)},P=(o,t,e)=>{let r=ee((e-o)/(t-o));return r*r*r*(r*(r*6-15)+10)};function A(o,t,e){if(o<=0)return 0;let r=2*Math.PI/t;if(e>=1)return 1-Math.exp(-r*o)*(1+r*o);let a=r*Math.sqrt(1-e*e);return 1-Math.exp(-e*r*o)*(Math.cos(a*o)+e*r/a*Math.sin(a*o))}var $=new Map;function j(o,t,e){let r=`${o}/${t}/${e}`,a=$.get(r);if(a===void 0){let n=0,c=3;for(let s=0;s<40;s++){let u=(n+c)/2;A(u,t,e)<o?n=u:c=u}$.set(r,a=c)}return a}var U=o=>o.present+1.1;function ce(o,t){let e=t.present,r=1-t.bounce,a=A(o+.01,t.response,r),n=j(.85,t.response,r)-.01,c=j(.92,t.response,r)-.01,s=A(o-c,.4,1),u=1-b(.05,1,s),p=b(0,.08,o),i=t.drift*A(o-.3,2.2,1),f=.25*A(o,.7,1)+.75*P(0,t.glide,o),w=A(o-.5,2.4,1),E=A(o-e,.95,1),m=A(o-e-.05,.65,1),x=.15*t.bulge*(1-b(.4,.95,a)),g=(1+(t.startZoom-1)*(1-f))*(1-.045*w)*D(1,t.finalScale,E),_=D(t.bevelWidth,Math.max(t.bevelWidth,.4),u),C=D(t.startSize,1,a)*(1+i)*(1+.14*m);return{uPlateScale:C,uShapeN:D(2,t.corner,s),uCornerN:t.corner,uOptics:1-b(.55,1,m),uPlateAlpha:p*(1-b(.45,1,m)),uLogoHalf:t.logoScale*g,uLogoOff:[t.logoOffset[0]*g,t.logoOffset[1]*g],uKeep:0,uSheen:t.sheen,uSweep:D(-1.6,1.6,P(.9,e-.1,o)),uLightAng:t.lightTurn*P(.4,e+.4,o),uBold:t.swell*.03*(1-f),uBlur:t.focus*.05*(1-b(.3,.95,a)),uFrost:t.focus*(1-b(.5,.95,a)),uPinch:.38*t.stretch*b(.1,.9,s)*b(.75,.97,f),uTilt:t.tilt,uDome:x,uDrop:u,uRim:1+.8*u,uHalo:t.halo*(.5+.5*u),uShadow:t.shadow*b(.45,.8,a)*(1-b(0,.6,s)),uGhost:b(0,.03,o)*(1-b(.04,.08,o)),uRipR:1+.9*Math.max(0,o-n),uRipA:t.ripple*b(n,n+.06,o)*Math.exp(-Math.max(0,o-n)/.6),uBare:b(e-.25,e,o),uReach:_*C,uCornerPull:t.cornerPull,uStreak:t.edgeSmear,uWiden:t.cornerWidth,uSlab:.3*t.opticalDepth,uEtaSpread:.06,uFocus:t.cornerFocus,uFocusK:1,uFocusSplit:.056*t.colorBleed,uRimLine:.09,uCornerOn:b(.35,1,s),uGlow:.012*t.colorBleed,uFaceDisp:.012*t.dispersion,uVivid:.85,uDissolve:m,uDisp:t.dispersion,uDouble:t.doubleBevel,uBevelW:_*(1-m),uSpec:t.specular,uIconPlate:0,uUseColor:0,uLightScene:0,uLightGlass:0,uBg:[0,0,0],uPlateCol:[0,0,0],uLogoCol:[1,1,1]}}function te(o,t){let e=o.getContext("webgl2",{alpha:!0,antialias:!1,premultipliedAlpha:!1});if(!e)return null;let r=[],a=e.createProgram(),n=e.createBuffer(),c=e.createTexture(),s=e.createTexture(),u=e.createTexture(),p=()=>{r.forEach(i=>e.deleteShader(i)),e.deleteBuffer(n),e.deleteTexture(c),e.deleteTexture(s),e.deleteTexture(u),e.deleteProgram(a)};try{if(!a||!n||!c||!s||!u)throw new Error("Glass allocation failed");for(let[m,x]of[[e.VERTEX_SHADER,le],[e.FRAGMENT_SHADER,ue]]){let g=e.createShader(m);if(!g)throw new Error("Glass shader allocation failed");if(r.push(g),e.shaderSource(g,x),e.compileShader(g),!e.getShaderParameter(g,e.COMPILE_STATUS))throw new Error(e.getShaderInfoLog(g)||"Glass shader failed");e.attachShader(a,g)}if(e.linkProgram(a),!e.getProgramParameter(a,e.LINK_STATUS))throw new Error(e.getProgramInfoLog(a)||"Glass link failed");e.useProgram(a),e.bindBuffer(e.ARRAY_BUFFER,n),e.bufferData(e.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),e.STATIC_DRAW);let i=e.getAttribLocation(a,"aPos");e.enableVertexAttribArray(i),e.vertexAttribPointer(i,2,e.FLOAT,!1,0,0);let f={},w=e.getProgramParameter(a,e.ACTIVE_UNIFORMS);for(let m=0;m<w;m++){let x=e.getActiveUniform(a,m);f[x.name]=e.getUniformLocation(a,x.name)}e.uniform1i(f.uSdf,0),e.uniform1i(f.uCol,1),e.uniform1i(f.uEyes,2);let E=m=>{e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,m),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE)};return{setLogo(m){e.activeTexture(e.TEXTURE2),e.bindTexture(e.TEXTURE_2D,u),e.texImage2D(e.TEXTURE_2D,0,e.R16F,l,l,0,e.RED,e.FLOAT,m.eyesSdf??m.sdf),E(e.LINEAR),e.uniform1f(f.uHasEyes,m.eyesSdf?1:0),e.activeTexture(e.TEXTURE0),e.bindTexture(e.TEXTURE_2D,c),e.texImage2D(e.TEXTURE_2D,0,e.R16F,l,l,0,e.RED,e.FLOAT,m.sdf),E(e.LINEAR),e.activeTexture(e.TEXTURE1),e.bindTexture(e.TEXTURE_2D,s),e.pixelStorei(e.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!0),e.texImage2D(e.TEXTURE_2D,0,e.RGBA8,e.RGBA,e.UNSIGNED_BYTE,m.canvas),e.pixelStorei(e.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1),e.generateMipmap(e.TEXTURE_2D),E(e.LINEAR_MIPMAP_LINEAR)},render(m,x,g=1){let _=t?.()??{width:o.clientWidth,height:o.clientHeight,dpr:devicePixelRatio||1},C=Math.min(_.dpr,2),T=Math.max(1,Math.round(_.width*C)),S=Math.max(1,Math.round(_.height*C));(o.width!==T||o.height!==S)&&(o.width=T,o.height=S),e.viewport(0,0,T,S),e.useProgram(a),e.uniform2f(f.uCenter,T/2,S/2),e.uniform1f(f.uTile,Math.min(x.tileSize,Math.min(T,S)/C/1.75)*C),e.uniform1f(f.uBlink,g),e.uniform1f(f.uTexSize,l),e.uniform1f(f.uBoxFrac,Q);let L=ce(m,x);for(let[R,k]of Object.entries(L))typeof k=="number"?e.uniform1f(f[R],k):k.length===2?e.uniform2fv(f[R],k):e.uniform3fv(f[R],k);e.drawArrays(e.TRIANGLES,0,3)},finish:()=>e.finish(),dispose:p}}catch(i){throw p(),i}}var oe=[{d:"M376.57,844.14 C361.85,826.80 348.21,807.73 341.57,785.43 C336.08,767.22 333.81,748.08 334.00,729.00 C336.61,668.57 364.46,611.05 406.71,568.71 C480.81,502.40 585.00,463.22 685.14,481.86 C741,486 796,514 827.00,549.29 C877.76,601.21 911.41,672.92 907.00,747.00 C905.14,762.56 901.52,777.72 896.43,792.43 C892.93,800.17 890.04,808.25 885.29,815.29 C880.58,825.47 872.83,833.97 866.57,843.00 C826,902 738,935 622,935 C508,935 419,904 376.57,844.14 Z ",hole:!1,eye:!1},{d:"M 683.77 508.23 C 707.40 510.73 729.90 516.64 750.84 523.33 C 753.34 523.96 755.87 524.54 758.60 524.67 C 761.74 524.78 764.76 524.26 767.55 523.51 C 779.73 518.60 777.87 508.33 772.27 501.01 C 764.06 490.09 747.26 482.21 729.88 476.57 C 713.89 471.97 696.76 469.54 679.49 468.64 C 672.85 468.64 666.22 468.64 659.58 468.64 C 646.55 469.62 633.59 470.85 620.89 472.64 C 530.10 487.71 441.66 514.63 380.29 567.29 C 372.93 576.22 366.82 586.23 359.71 595.00 C 372.40 533.68 422.55 502.15 475.63 478.35 C 481.49 474.51 488.15 470.97 491.87 466.07 C 494.22 462.55 495.24 458.71 495.28 454.84 C 492.87 447.17 486.26 439.97 487.55 431.93 C 488.60 426.67 491.13 421.65 494.91 416.82 C 499.47 412.31 504.56 407.99 510.46 403.97 C 559.35 375.09 627.51 366.89 689.18 353.87 C 697.52 351.99 705.78 350.00 713.12 346.81 C 752.42 334.09 762.77 299.24 724.85 286.65 C 720.20 284.63 714.41 283.44 708.65 282.58 C 707.03 282.10 703.09 282.27 703.87 280.75 C 707.11 279.08 711.53 278.27 715.58 277.23 C 774.76 269.62 842.99 292.76 843.73 327.62 C 844.31 332.67 843.28 337.97 840.76 343.08 C 838.06 350.03 832.74 357.06 825.11 363.01 C 818.87 368.29 811.48 373.35 802.45 376.97 C 791.77 381.92 779.96 385.71 767.71 388.68 C 756.69 392.07 744.96 394.55 734.63 398.72 C 722.03 404.07 710.36 411.47 708.57 421.05 C 707.80 427.92 711.95 434.78 719.51 439.96 C 725.71 443.87 733.64 446.66 741.26 449.43 C 749.44 452.06 758.22 453.97 765.95 457.16 C 814.13 471.92 852.41 505.77 834.51 536.62 C 833.80 540.66 827.66 543.72 827.00 549.29 L 683.77 508.23 Z",hole:!1,eye:!1},{d:"M 861.19 365.68 C 861.51 365.52 862.06 365.55 862.34 365.76 C 879.31 377.58 888.45 393.97 886.05 409.34 C 882.72 423.22 867.80 434.92 847.24 440.75 C 826.98 448.03 789.17 445.62 786.22 428.68 C 783.27 412.92 807.27 403.94 827.06 398.70 C 848.26 393.09 861.03 379.96 861.19 365.68 Z",hole:!1,eye:!1},{d:"M503.57,610.29 C497.06,634.25 497.27,671.74 465.71,676.71 C461.38,678.11 456.80,678.73 452.29,679.29 C446.30,680.18 440.31,680.92 434.29,681.29 C427.34,682.47 419.75,682.09 413.14,683.71 C439.20,694.81 474.90,694.88 490.71,722.29 C500.75,741.16 502.33,762.95 506.43,783.71 C510.70,767.26 511.92,749.37 518.29,733.29 C528.90,703.65 563.69,700.46 590.00,695.86 C582.20,693.39 573.54,692.05 565.57,689.43 C560.93,687.55 555.99,686.73 551.43,684.57 C517.77,676.39 508.69,639.88 503.57,610.29 Z",hole:!0,eye:!0},{d:"M751.00,610.86 C750.21,611.17 750.25,612.23 749.86,612.86 C745.87,641.50 735.49,675.66 704.14,684.14 C699.52,686.07 694.81,687.71 690.00,689.00 C681.86,691.99 672.59,692.59 664.86,696.00 C690.72,700.65 724.69,703.54 735.71,732.29 C742.54,748.44 743.52,766.60 748.00,783.14 C752.45,763.14 753.34,740.98 763.43,722.43 C779.29,695.13 814.81,694.51 841.00,683.86 C834.79,681.81 827.36,682.55 820.71,681.29 C816.48,680.84 812.18,681.08 808.00,680.00 C802.74,679.77 797.35,679.15 792.29,677.71 C789.59,677.26 786.96,676.58 784.43,675.57 C756.25,667.78 757.45,633.52 751.00,610.86 Z",hole:!0,eye:!0},{d:"M599.29,775.29 C588.41,776.99 591.12,794.38 602.00,793.00 C613.67,793.00 625.33,793.00 637.00,793.00 C645.79,792.62 661.90,796.31 662.00,783.00 C659.32,770.82 643.92,776.13 635.00,775.00 C623.10,775.19 611.14,774.62 599.29,775.29 Z",hole:!0,eye:!1}];var O=globalThis;function fe(o){let t=o.getContext("webgl",{alpha:!1,antialias:!1,depth:!1,stencil:!1});if(!t)throw new Error("Silk WebGL unavailable");let e=t.createProgram();for(let[c,s]of[[t.VERTEX_SHADER,"attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}"],[t.FRAGMENT_SHADER,N]]){let u=t.createShader(c);if(t.shaderSource(u,s),t.compileShader(u),!t.getShaderParameter(u,t.COMPILE_STATUS))throw new Error("Silk shader failed");t.attachShader(e,u),t.deleteShader(u)}if(t.linkProgram(e),!t.getProgramParameter(e,t.LINK_STATUS))throw new Error("Silk linking failed");t.useProgram(e),t.bindBuffer(t.ARRAY_BUFFER,t.createBuffer()),t.bufferData(t.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),t.STATIC_DRAW);let r=t.getAttribLocation(e,"p");t.enableVertexAttribArray(r),t.vertexAttribPointer(r,2,t.FLOAT,!1,0,0),t.uniform3fv(t.getUniformLocation(e,"u_colors[0]"),new Float32Array([.039,.059,0,.075,.208,.051,.851,.996,.604,.075,.094,.004,0,0,0,0,0,0,0,0,0,0,0,0]));for(let[c,s]of Object.entries({u_shape:[1.26,.09,.5,0],u_surface:[2.4,1.11,0,1],u_finish:[0,0,0,.22],u_transform:[1581,0,0,0],u_space:[-.23,0,0,0],u_cursor:[0,2,.65,.46]}))t.uniform4fv(t.getUniformLocation(e,c),s);let a=t.getUniformLocation(e,"u_scene"),n=!1;return(c,s)=>{let u=Math.min(c.dpr,2),p=Math.max(1,Math.round(c.width*u)),i=Math.max(1,Math.round(c.height*u));(o.width!==p||o.height!==i)&&(o.width=p,o.height=i,t.viewport(0,0,p,i)),t.uniform4f(a,p,i,s*.31,4),t.drawArrays(t.TRIANGLES,0,3),n||(t.finish(),n=!0)}}function he(){let o=new OffscreenCanvas(512,512),t=new OffscreenCanvas(512,512),e=o.getContext("2d"),r=t.getContext("2d");for(let a of[e,r])a.scale(512/770,512/770),a.translate(-240,-215),a.fillStyle="#fff";for(let a of oe){let n=a.eye?r:e;n.globalCompositeOperation=a.hole&&!a.eye?"destination-out":"source-over",n.fill(new Path2D(a.d))}return J(o,512,512,t)}var y,q,M,G=0,I=0,B=0,ae="",W=!1,re=!1,se=[],ne=o=>o*o*(3-2*o);function H(o){if(I=0,W)return;let t=Math.max(0,o-G),e=Math.min(1,t/2200);B&&t>300&&B-G>300&&se.push(o-B),B=o;let r=1;y.reduced||(t>=2600&&t<2850?r=1-.955*ne((t-2600)/250):t>=2850&&t<3050?r=.045:t>=3050&&t<3400&&(r=.045+.955*ne((t-3050)/350))),q(y.background,y.reduced?0:t/1e3),M?.render(y.reduced?U(F):e*U(F),F,r);let a=e<1&&!y.reduced?"playing":"complete",n=r<.2?"closed":r>.95?"open":"moving",c=`${a}/${n}`;if(c!==ae&&(ae=c,O.postMessage({type:"state",phase:a,eye:n})),!re&&t>=4800||y.reduced){re=!0;let s=[...se].sort((u,p)=>u-p);O.postMessage({type:"metrics",frames:s.length,max:Math.max(0,...s),p95:s[Math.floor(s.length*.95)]||0})}t<6200&&!y.reduced&&(I=requestAnimationFrame(H))}O.onmessage=({data:o})=>{try{if(o.type==="init"){if(y=o,q=fe(o.silk),M=te(o.logo,()=>y.foreground),!M)throw new Error("Glass WebGL2 unavailable");M.setLogo(he()),q(y.background,0),M.render(0,F),M.finish(),G=performance.now(),O.postMessage({type:"ready",epoch:performance.timeOrigin+G}),H(G+1)}else y={...y,...o},W=o.paused,I&&cancelAnimationFrame(I),I=0,W||H(performance.now())}catch(t){O.postMessage({type:"failure",message:t instanceof Error?t.message:"Renderer failed"})}};})();
