import { waveFragmentShader, waveVertexShader } from './gradient-wave-shaders';

export interface WaveOptions {
  colors: readonly string[];
  shadowPower: number;
  darkenTop: boolean;
  noiseSpeed: number;
  noiseFrequency: readonly [number, number];
  deform: {
    incline: number; offsetTop: number; offsetBottom: number;
    noiseFreq: readonly [number, number]; noiseAmp: number;
    noiseSpeed: number; noiseFlow: number; noiseSeed: number;
  };
}

/** One typed WebGL context; geometry follows the host, never the window's scroll height. */
export class Gradient {
  private gl: WebGLRenderingContext;
  private program: WebGLProgram;
  private vertices: WebGLBuffer;
  private indices: WebGLBuffer;
  private uniforms = new Map<string, WebGLUniformLocation | null>();
  private count = 0;
  private width = 0;
  private height = 0;
  private time = 0;
  private last = 0;
  private drawnAt = 0;
  private raf = 0;
  private playing = false;
  private disposed = false;
  private fps: number;

  constructor(private canvas: HTMLCanvasElement, options: WaveOptions, private lowPower: boolean) {
    const gl = canvas.getContext('webgl', { antialias: false, alpha: false, depth: false, powerPreference: 'low-power' });
    if (!gl) throw new Error('WebGL unavailable');
    this.gl = gl;
    this.fps = lowPower ? 24 : 30;
    const shaders: WebGLShader[] = [];
    const buffers: WebGLBuffer[] = [];
    let program: WebGLProgram | null = null;
    try {
      for (const [type, source] of [[gl.VERTEX_SHADER, waveVertexShader], [gl.FRAGMENT_SHADER, waveFragmentShader]] as const) {
        const shader = gl.createShader(type);
        if (!shader) throw new Error('Unable to create wave shader');
        shaders.push(shader);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader) ?? 'Wave shader compilation failed');
      }
      program = gl.createProgram();
      if (!program) throw new Error('Unable to create wave program');
      this.program = program;
      shaders.forEach(shader => gl.attachShader(this.program, shader));
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) ?? 'Wave linking failed');
      shaders.forEach(shader => gl.detachShader(this.program, shader));
      for (let i = 0; i < 2; i++) {
        const buffer = gl.createBuffer();
        if (!buffer) throw new Error('Unable to create wave geometry');
        buffers.push(buffer);
      }
      [this.vertices, this.indices] = buffers;
      gl.useProgram(program);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.vertices);
      const location = gl.getAttribLocation(program, 'a_position');
      if (location < 0) throw new Error('Wave position attribute unavailable');
      gl.enableVertexAttribArray(location);
      gl.vertexAttribPointer(location, 2, gl.FLOAT, false, 0, 0);
      this.update(options);
    } catch (error) {
      buffers.forEach(buffer => gl.deleteBuffer(buffer));
      if (program) gl.deleteProgram(program);
      throw error;
    } finally {
      shaders.forEach(shader => gl.deleteShader(shader));
    }
  }

  private uniform(name: string) {
    if (!this.uniforms.has(name)) this.uniforms.set(name, this.gl.getUniformLocation(this.program, name));
    return this.uniforms.get(name)!;
  }

  update(options: WaveOptions) {
    const gl = this.gl;
    gl.useProgram(this.program);
    const colors = new Float32Array(24);
    options.colors.forEach((hex, i) => {
      const color = parseInt(hex.slice(1), 16);
      colors.set([((color >> 16) & 255) / 255, ((color >> 8) & 255) / 255, (color & 255) / 255], i * 3);
    });
    gl.uniform3fv(this.uniform('u_colors[0]'), colors);
    gl.uniform1i(this.uniform('u_colorCount'), options.colors.length);
    gl.uniform1f(this.uniform('u_noiseSpeed'), options.noiseSpeed);
    gl.uniform2fv(this.uniform('u_noiseFrequency'), [...options.noiseFrequency]);
    gl.uniform4f(this.uniform('u_deform'), options.deform.incline, options.deform.offsetTop, options.deform.offsetBottom, options.deform.noiseAmp);
    gl.uniform4f(this.uniform('u_deformNoise'), ...options.deform.noiseFreq, options.deform.noiseFlow, options.deform.noiseSeed);
    gl.uniform1f(this.uniform('u_deformSpeed'), options.deform.noiseSpeed);
    gl.uniform1f(this.uniform('u_shadowPower'), options.shadowPower);
    gl.uniform1f(this.uniform('u_darkenTop'), Number(options.darkenTop));
  }

  resize(width: number, height: number) {
    const w = Math.max(1, Math.round(width));
    const h = Math.max(1, Math.round(height));
    if (w === this.width && h === this.height) return;
    this.width = w; this.height = h;
    // A soft background does not need retina resolution or a full-screen multi-pass effect.
    const scale = Math.min(1, Math.sqrt((this.lowPower ? 450000 : 900000) / (w * h)));
    this.canvas.width = Math.max(1, Math.round(w * scale));
    this.canvas.height = Math.max(1, Math.round(h * scale));
    const gl = this.gl;
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.useProgram(this.program);
    gl.uniform2f(this.uniform('u_resolution'), w, h);
    const xs = Math.min(40, Math.max(12, Math.ceil(w * .02)));
    const ys = Math.min(52, Math.max(16, Math.ceil(h * .05)));
    const points = new Float32Array((xs + 1) * (ys + 1) * 2);
    const indices = new Uint16Array(xs * ys * 6);
    for (let y = 0; y <= ys; y++) {
      for (let x = 0; x <= xs; x++) {
        const i = y * (xs + 1) + x;
        points.set([x / xs * 2 - 1, 1 - y / ys * 2], i * 2);
        if (x < xs && y < ys) indices.set([i, i + xs + 1, i + 1, i + 1, i + xs + 1, i + xs + 2], (y * xs + x) * 6);
      }
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertices);
    gl.bufferData(gl.ARRAY_BUFFER, points, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indices);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
    this.count = indices.length;
  }

  render() {
    if (this.disposed || !this.count || this.gl.isContextLost()) return;
    const gl = this.gl;
    gl.useProgram(this.program);
    gl.uniform1f(this.uniform('u_time'), this.time);
    gl.clearColor(0.97, 0.97, 0.98, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawElements(gl.TRIANGLES, this.count, gl.UNSIGNED_SHORT, 0);
  }

  private animate = (timestamp: number) => {
    if (!this.playing) return;
    this.time += this.last ? Math.min(timestamp - this.last, 67) : 0;
    this.last = timestamp;
    if (timestamp - this.drawnAt >= 1000 / this.fps) {
      this.render(); this.drawnAt = timestamp;
    }
    this.raf = requestAnimationFrame(this.animate);
  };

  start() {
    if (this.playing || this.disposed) return;
    this.playing = true; this.last = 0; this.drawnAt = 0;
    this.raf = requestAnimationFrame(this.animate);
  }

  stop() {
    this.playing = false; this.last = 0;
    cancelAnimationFrame(this.raf);
  }

  dispose() {
    if (this.disposed) return;
    this.stop(); this.disposed = true;
    this.gl.deleteBuffer(this.vertices);
    this.gl.deleteBuffer(this.indices);
    this.gl.deleteProgram(this.program);
    this.gl.getExtension('WEBGL_lose_context')?.loseContext();
  }
}
