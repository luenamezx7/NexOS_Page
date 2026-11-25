/** Liquid glass optics from zanwei/glass-icon-reveal (MIT).
 * React port follows the supplied 21st.dev reveal; see glass-logo-LICENSE.txt.
 */
export interface GlassTuning {
  opticalDepth: number; dispersion: number; colorBleed: number; doubleBevel: number;
  bevelWidth: number; corner: number; cornerPull: number; cornerWidth: number;
  cornerFocus: number; edgeSmear: number; stretch: number; tilt: number; bulge: number;
  specular: number; halo: number; shadow: number; ripple: number; bounce: number;
  response: number; startSize: number; startZoom: number; glide: number; present: number;
  drift: number; swell: number; focus: number; sheen: number; lightTurn: number;
}
export interface GlassSettings extends GlassTuning {
  tileSize: number; logoScale: number; finalScale: number; logoOffset: [number, number];
}
export const glassSettings: GlassSettings = {
  tileSize: 256, logoScale: .7, finalScale: .69, logoOffset: [0, 0],
  opticalDepth: 1.1, dispersion: 1.7, colorBleed: 1.25, doubleBevel: 1, bevelWidth: .14,
  corner: 4.8, cornerPull: 2.1, cornerWidth: 2.2, cornerFocus: .58, edgeSmear: 2.85,
  stretch: 0, tilt: .35, bulge: 1, specular: 1, halo: 0, shadow: 1, ripple: 1,
  bounce: 0, response: .42, startSize: .2, startZoom: 2.6, glide: 2.3, present: 2.4,
  drift: .12, swell: .5, focus: 1, sheen: 1, lightTurn: .9,
};
export interface LogoData { canvas: HTMLCanvasElement | OffscreenCanvas; sdf: Float32Array<ArrayBuffer>; eyesSdf?: Float32Array<ArrayBuffer>; }
const TEX = 512;          // logo texture size
const BOX = 0.75;          // fraction of the texture the logo box fills (the rest is room for the SDF)

type RasterCanvas = HTMLCanvasElement | OffscreenCanvas;
function rasterCanvas(): RasterCanvas {
  return typeof document === 'undefined' ? new OffscreenCanvas(TEX, TEX) : document.createElement('canvas');
}
function rasterContext(canvas: RasterCanvas) {
  return canvas.getContext('2d', { willReadFrequently: true }) as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('This image could not be read.'));
    img.src = src;
  });
}

function svgToUrl(text: string) {
  const doc = new DOMParser().parseFromString(text, 'image/svg+xml');
  const svg = doc.documentElement;
  if (!svg || svg.nodeName.toLowerCase() !== 'svg') throw new Error('This SVG could not be read.');
  let w = parseFloat(svg.getAttribute('width') || ''), h = parseFloat(svg.getAttribute('height') || '');
  const vb = (svg.getAttribute('viewBox') || '').split(/[\s,]+/).map(Number);
  if (vb.length === 4 && vb[2] > 0 && vb[3] > 0) { w = vb[2]; h = vb[3]; }
  if (!(w > 0 && h > 0)) { w = h = 100; }
  const s = TEX / Math.max(w, h);
  svg.setAttribute('width', String(Math.round(w * s)));
  svg.setAttribute('height', String(Math.round(h * s)));
  const out = new XMLSerializer().serializeToString(svg).replace(/currentColor/g, '#ffffff');
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(out);
}

// Draw a source into a TEX×TEX canvas, cropped to its visible pixels and fitted into the logo box.
function fitToTexture(source: CanvasImageSource, sw: number, sh: number, cutoutLightDetails: boolean, alignmentSource?: CanvasImageSource) {
  const tmp = rasterCanvas();
  tmp.width = TEX; tmp.height = TEX;
  const tc = rasterContext(tmp);
  const s0 = Math.min(TEX / sw, TEX / sh);
  const dx0 = (TEX - sw * s0) / 2, dy0 = (TEX - sh * s0) / 2;
  tc.drawImage(alignmentSource ?? source, dx0, dy0, sw * s0, sh * s0);
  const d = tc.getImageData(0, 0, TEX, TEX).data;

  // Opaque images (JPG, flat PNG): key out the corner colour so the mark becomes the shape.
  let opaque = true;
  for (let i = 3; i < d.length; i += 4 * 97) { if (d[i] < 250) { opaque = false; break; } }
  const key = [d[0], d[1], d[2]];
  const keyAlpha = (r: number, g: number, b: number) => Math.min(1, Math.max(0, (Math.hypot(r - key[0], g - key[1], b - key[2]) / 441 - 0.08) / 0.2));

  let x0 = TEX, y0 = TEX, x1 = -1, y1 = -1;
  for (let y = 0; y < TEX; y++) {
    for (let x = 0; x < TEX; x++) {
      const i = (y * TEX + x) * 4;
      const a = opaque ? keyAlpha(d[i], d[i + 1], d[i + 2]) * 255 : d[i + 3];
      if (a > 8) {
        if (x < x0) x0 = x; if (x > x1) x1 = x;
        if (y < y0) y0 = y; if (y > y1) y1 = y;
      }
    }
  }
  if (x1 < 0) throw new Error('The image is empty. Use a logo with visible pixels.');
  const bw = x1 - x0 + 1, bh = y1 - y0 + 1;
  const s = TEX * BOX / Math.max(bw, bh);

  const out = rasterCanvas();
  out.width = TEX; out.height = TEX;
  const oc = rasterContext(out);
  oc.imageSmoothingQuality = 'high';
  const ox = TEX / 2 - (x0 + bw / 2 - dx0) * s;
  const oy = TEX / 2 - (y0 + bh / 2 - dy0) * s;
  oc.drawImage(source, ox, oy, sw * s0 * s, sh * s0 * s);
  if (opaque) {
    const im = oc.getImageData(0, 0, TEX, TEX), e = im.data;
    for (let i = 0; i < e.length; i += 4) e[i + 3] = Math.round(e[i + 3] * keyAlpha(e[i], e[i + 1], e[i + 2]));
    oc.putImageData(im, 0, 0);
  }
  if (cutoutLightDetails) {
    // The brand artwork paints white eyes/mouth over a black body. Alpha alone
    // merges them; use the dark ink coverage so the features become real holes.
    const image = oc.getImageData(0, 0, TEX, TEX);
    for (let i = 0; i < image.data.length; i += 4) {
      const luminance = (.2126 * image.data[i] + .7152 * image.data[i+1] + .0722 * image.data[i+2]) / 255;
      image.data[i+3] = Math.round(image.data[i+3] * (1-luminance));
      image.data[i] = image.data[i+1] = image.data[i+2] = 255;
    }
    oc.putImageData(image, 0, 0);
  }
  return out;
}

// Signed distance field from alpha (TinySDF method): + outside, − inside, in texture units.
function buildSdf(canvas: RasterCanvas) {
  const n = TEX * TEX;
  const alpha = rasterContext(canvas).getImageData(0, 0, TEX, TEX).data;
  const INF = 1e20;
  const outer = new Float64Array(n), inner = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const a = alpha[i * 4 + 3] / 255;
    if (a >= 1) { outer[i] = 0; inner[i] = INF; }
    else if (a <= 0) { outer[i] = INF; inner[i] = 0; }
    else {
      const dd = 0.5 - a;
      outer[i] = dd > 0 ? dd * dd : 0;
      inner[i] = dd < 0 ? dd * dd : 0;
    }
  }
  const f = new Float64Array(TEX), z = new Float64Array(TEX + 1), v = new Uint16Array(TEX);
  edt(outer, f, v, z, INF);
  edt(inner, f, v, z, INF);
  const sdf = new Float32Array(n);
  for (let i = 0; i < n; i++) sdf[i] = (Math.sqrt(outer[i]) - Math.sqrt(inner[i])) / TEX;
  return sdf;
}
function edt(grid: Float64Array, f: Float64Array, v: Uint16Array, z: Float64Array, INF: number) {
  for (let x = 0; x < TEX; x++) edt1d(grid, x, TEX, f, v, z, INF);
  for (let y = 0; y < TEX; y++) edt1d(grid, y * TEX, 1, f, v, z, INF);
}
function edt1d(grid: Float64Array, offset: number, stride: number, f: Float64Array, v: Uint16Array, z: Float64Array, INF: number) {
  v[0] = 0; z[0] = -INF; z[1] = INF; f[0] = grid[offset];
  for (let q = 1, k = 0, s = 0; q < TEX; q++) {
    f[q] = grid[offset + q * stride];
    const q2 = q * q;
    do {
      const r = v[k];
      s = (f[q] - f[r] + q2 - r * r) / (q - r) / 2;
    } while (s <= z[k] && --k > -1);
    k++; v[k] = q; z[k] = s; z[k + 1] = INF;
  }
  for (let q = 0, k = 0; q < TEX; q++) {
    while (z[k + 1] < q) k++;
    const r = v[k], qr = q - r;
    grid[offset + q * stride] = f[r] + qr * qr;
  }
}


export function makeGlassLogo(source: CanvasImageSource, width: number, height: number, eyes?: CanvasImageSource): LogoData {
  const canvas = fitToTexture(source, width, height, false);
  return { canvas, sdf: buildSdf(canvas), eyesSdf: eyes ? buildSdf(fitToTexture(eyes, width, height, false, source)) : undefined };
}

const logoCache = new Map<string, Promise<LogoData>>();
export function loadGlassLogo(logo: string, cutoutLightDetails = false) {
  const key = `${logo}/${cutoutLightDetails}`;
  let job = logoCache.get(key);
  if (!job) {
    job = loadImage(logo.trimStart().startsWith('<') ? svgToUrl(logo) : logo).then(image => {
      const canvas = fitToTexture(image, image.naturalWidth, image.naturalHeight, cutoutLightDetails);
      return { canvas, sdf: buildSdf(canvas) };
    });
    logoCache.set(key, job);
    job.catch(() => logoCache.delete(key));
  }
  return job;
}
const VERT = `#version 300 es
in vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }`;

const FRAG = `#version 300 es
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
uniform float uTilt;       // how much more the rising diagonal's corners stretch than the other two (0–1)
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
uniform float uDissolve;   // 0 → 1 as the glass lets go of the logo
uniform float uGlow;       // colour bleed in the rim, plate units on screen
uniform float uFaceDisp;   // lateral colour across the face: red/violet scale apart by ±this
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

// Superellipse field. Returns signed distance (plate units, − inside); g = 1 on the rim.
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
// θ (sin θ = 1 − x), bends inward by θ − θr (Snell, index eta) and reaches the logo plane displaced by
// z·tan(θ − θr), z the height of the surface. So the outer rim looks deepest and the view eases back to
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
// gold → orange → red on one side and cyan → sky → blue → ultramarine on the other (solved over 12
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
    // the compression runs past 20×, and an uncapped glow would reach strokes the rim does not see.
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
      float c = uDisp * (1.0 - 2.0 * lam);   // + red … − violet
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
    //  · the droplet, while round, glows in a broad band about a tenth of its radius wide, some 15
    //    levels above the backdrop, with a crisp bright line at the very edge;
    //  · the tile it spreads into keeps a quieter band, about 7 levels up, from just inside the edge
    //    to a tenth of the tile in, with a bright inner lip about 0.15 of the tile in;
    //  · at the very edge a hairline catches a soft overhead light: bright along the top and right,
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
}`;


const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const mix = (a: number, b: number, t: number) => a + (b-a)*t;
const smooth = (a: number, b: number, x: number) => { const t = clamp01((x-a)/(b-a)); return t*t*(3-2*t); };
const smoother = (a: number, b: number, x: number) => { const t = clamp01((x-a)/(b-a)); return t*t*t*(t*(t*6-15)+10); };
function spring(t: number, response: number, damping: number) {
  if (t <= 0) return 0;
  const w = 2*Math.PI/response;
  if (damping >= 1) return 1-Math.exp(-w*t)*(1+w*t);
  const wd = w*Math.sqrt(1-damping*damping);
  return 1-Math.exp(-damping*w*t)*(Math.cos(wd*t)+damping*w/wd*Math.sin(wd*t));
}
const reachCache = new Map<string, number>();
function timeToReach(level: number, response: number, damping: number) {
  const key = `${level}/${response}/${damping}`;
  let t = reachCache.get(key);
  if (t === undefined) {
    let lo = 0, hi = 3;
    for (let i=0; i<40; i++) { const mid=(lo+hi)/2; if (spring(mid,response,damping)<level) lo=mid; else hi=mid; }
    reachCache.set(key, t=hi);
  }
  return t;
}
export const glassEnd = (p: GlassSettings) => p.present + 1.1;
export function glassFrame(T: number, P: GlassSettings) {
  const tx=P.present, damping=1-P.bounce;
  const grow=spring(T+.01,P.response,damping);
  const tl=timeToReach(.85,P.response,damping)-.01;
  const tm=timeToReach(.92,P.response,damping)-.01;
  const morph=spring(T-tm,.4,1), drop=1-smooth(.05,1,morph);
  const appear=smooth(0,.08,T), drift=P.drift*spring(T-.3,2.2,1);
  const zoomIn=.25*spring(T,.7,1)+.75*smoother(0,P.glide,T);
  const settle=spring(T-.5,2.4,1), exit=spring(T-tx,.95,1), release=spring(T-tx-.05,.65,1);
  const dome=.15*P.bulge*(1-smooth(.4,.95,grow));
  const view=(1+(P.startZoom-1)*(1-zoomIn))*(1-.045*settle)*mix(1,P.finalScale,exit);
  const bandW=mix(P.bevelWidth,Math.max(P.bevelWidth,.4),drop);
  const plateScale=mix(P.startSize,1,grow)*(1+drift)*(1+.14*release);
  return {
    uPlateScale:plateScale, uShapeN:mix(2,P.corner,morph), uCornerN:P.corner,
    uOptics:1-smooth(.55,1,release), uPlateAlpha:appear*(1-smooth(.45,1,release)),
    uLogoHalf:P.logoScale*view, uLogoOff:[P.logoOffset[0]*view,P.logoOffset[1]*view],
    uKeep:0, uSheen:P.sheen, uSweep:mix(-1.6,1.6,smoother(.9,tx-.1,T)),
    uLightAng:P.lightTurn*smoother(.4,tx+.4,T), uBold:P.swell*.03*(1-zoomIn),
    uBlur:P.focus*.05*(1-smooth(.3,.95,grow)), uFrost:P.focus*(1-smooth(.5,.95,grow)),
    uPinch:.38*P.stretch*smooth(.1,.9,morph)*smooth(.75,.97,zoomIn), uTilt:P.tilt,
    uDome:dome, uDrop:drop, uRim:1+.8*drop, uHalo:P.halo*(.5+.5*drop),
    uShadow:P.shadow*smooth(.45,.8,grow)*(1-smooth(0,.6,morph)),
    uGhost:smooth(0,.03,T)*(1-smooth(.04,.08,T)), uRipR:1+.9*Math.max(0,T-tl),
    uRipA:P.ripple*smooth(tl,tl+.06,T)*Math.exp(-Math.max(0,T-tl)/.6),
    uBare:smooth(tx-.25,tx,T), uReach:bandW*plateScale, uCornerPull:P.cornerPull,
    uStreak:P.edgeSmear, uWiden:P.cornerWidth, uSlab:.3*P.opticalDepth, uEtaSpread:.06,
    uFocus:P.cornerFocus, uFocusK:1, uFocusSplit:.056*P.colorBleed, uRimLine:.09,
    uCornerOn:smooth(.35,1,morph), uGlow:.012*P.colorBleed, uFaceDisp:.012*P.dispersion,
    uVivid:.85, uDissolve:release, uDisp:P.dispersion, uDouble:P.doubleBevel,
    uBevelW:bandW*(1-release), uSpec:P.specular, uIconPlate:0, uUseColor:0,
    uLightScene:0, uLightGlass:0, uBg:[0,0,0], uPlateCol:[0,0,0], uLogoCol:[1,1,1],
  };
}

export function createGlassRenderer(canvas: HTMLCanvasElement | OffscreenCanvas, measure?: () => { width: number; height: number; dpr: number }) {
  const gl=canvas.getContext('webgl2',{alpha:true,antialias:false,premultipliedAlpha:false}) as WebGL2RenderingContext | null;
  if (!gl) return null;
  const shaders: WebGLShader[]=[];
  const program=gl.createProgram();
  const buffer=gl.createBuffer(), sdfTex=gl.createTexture(), colTex=gl.createTexture(), eyesTex=gl.createTexture();
  const dispose=() => {
    shaders.forEach(shader=>gl.deleteShader(shader));
    gl.deleteBuffer(buffer); gl.deleteTexture(sdfTex); gl.deleteTexture(colTex); gl.deleteTexture(eyesTex); gl.deleteProgram(program);
  };
  try {
    if (!program || !buffer || !sdfTex || !colTex || !eyesTex) throw new Error('Glass allocation failed');
    for (const [kind,source] of [[gl.VERTEX_SHADER,VERT],[gl.FRAGMENT_SHADER,FRAG]] as const) {
      const shader=gl.createShader(kind);
      if (!shader) throw new Error('Glass shader allocation failed');
      shaders.push(shader); gl.shaderSource(shader,source); gl.compileShader(shader);
      if (!gl.getShaderParameter(shader,gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader)||'Glass shader failed');
      gl.attachShader(program,shader);
    }
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program,gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program)||'Glass link failed');
    gl.useProgram(program); gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);
    const pos=gl.getAttribLocation(program,'aPos');
    gl.enableVertexAttribArray(pos); gl.vertexAttribPointer(pos,2,gl.FLOAT,false,0,0);
    const U: Record<string,WebGLUniformLocation|null>={};
    const count=gl.getProgramParameter(program,gl.ACTIVE_UNIFORMS) as number;
    for (let i=0;i<count;i++) { const info=gl.getActiveUniform(program,i)!; U[info.name]=gl.getUniformLocation(program,info.name); }
    gl.uniform1i(U.uSdf,0); gl.uniform1i(U.uCol,1); gl.uniform1i(U.uEyes,2);
    const params=(filter:number)=> {
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,filter);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    };
    return {
      setLogo(logo:LogoData) {
        gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D,eyesTex);
        gl.texImage2D(gl.TEXTURE_2D,0,gl.R16F,TEX,TEX,0,gl.RED,gl.FLOAT,logo.eyesSdf ?? logo.sdf); params(gl.LINEAR);
        gl.uniform1f(U.uHasEyes,logo.eyesSdf ? 1 : 0);
        gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D,sdfTex);
        gl.texImage2D(gl.TEXTURE_2D,0,gl.R16F,TEX,TEX,0,gl.RED,gl.FLOAT,logo.sdf); params(gl.LINEAR);
        gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D,colTex);
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,true);
        gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA8,gl.RGBA,gl.UNSIGNED_BYTE,logo.canvas);
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,false); gl.generateMipmap(gl.TEXTURE_2D); params(gl.LINEAR_MIPMAP_LINEAR);
      },
      render(time:number,P:GlassSettings,blink=1) {
        const size = measure?.() ?? { width: (canvas as HTMLCanvasElement).clientWidth, height: (canvas as HTMLCanvasElement).clientHeight, dpr: devicePixelRatio || 1 };
        const dpr=Math.min(size.dpr,2), w=Math.max(1,Math.round(size.width*dpr)), h=Math.max(1,Math.round(size.height*dpr));
        if (canvas.width!==w||canvas.height!==h) { canvas.width=w; canvas.height=h; }
        gl.viewport(0,0,w,h); gl.useProgram(program);
        gl.uniform2f(U.uCenter,w/2,h/2); gl.uniform1f(U.uTile,Math.min(P.tileSize,Math.min(w,h)/dpr/1.75)*dpr);
        gl.uniform1f(U.uBlink,blink);
        gl.uniform1f(U.uTexSize,TEX); gl.uniform1f(U.uBoxFrac,BOX);
        const fr=glassFrame(time,P);
        for (const [key,value] of Object.entries(fr)) {
          if (typeof value==='number') gl.uniform1f(U[key],value);
          else if (value.length===2) gl.uniform2fv(U[key],value);
          else gl.uniform3fv(U[key],value);
        }
        gl.drawArrays(gl.TRIANGLES,0,3);
      },
      finish: () => gl.finish(),
      dispose,
    };
  } catch (error) { dispose(); throw error; }
}
