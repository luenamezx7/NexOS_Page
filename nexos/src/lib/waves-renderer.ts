import { WAVES_FRAGMENT_SHADER, WAVES_VERTEX_SHADER } from './shaders/waves';

export type WavesState = 'pending' | 'animated' | 'still' | 'paused' | 'fallback' | 'context-lost';
export interface WavesOptions { width: number; height: number; visible: boolean; reduced: boolean }

/** Shared by the worker and the compatibility renderer. Only native WebGL1. */
export function createWavesRenderer(
  canvas: HTMLCanvasElement | OffscreenCanvas,
  options: WavesOptions,
  onState: (state: WavesState) => void,
) {
  const gl = canvas.getContext('webgl', {
    alpha: false, antialias: false, depth: false, stencil: false, powerPreference: 'low-power',
  }) as WebGLRenderingContext | null;
  let program: WebGLProgram | null = null;
  let buffer: WebGLBuffer | null = null;
  const shaders: WebGLShader[] = [];
  let scene: WebGLUniformLocation | null = null;
  let raf = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let lastTime = 0;
  let lastDrawTime = 0;
  let elapsed = 0;
  let frames = 0;
  let ready = false;
  let disposed = false;
  let current = { ...options };

  function pause() {
    if (raf) cancelAnimationFrame(raf);
    clearTimeout(timer);
    raf = 0;
    timer = undefined;
    lastTime = 0;
    lastDrawTime = 0;
  }

  function release() {
    pause();
    ready = false;
    if (buffer) gl?.deleteBuffer(buffer);
    if (program) gl?.deleteProgram(program);
    for (const shader of shaders) gl?.deleteShader(shader);
    shaders.length = 0;
    buffer = null;
    program = null;
  }

  function compile(type: number, source: string) {
    const shader = gl!.createShader(type);
    if (!shader) throw new Error('Shader allocation failed');
    shaders.push(shader);
    gl!.shaderSource(shader, source);
    gl!.compileShader(shader);
    if (!gl!.getShaderParameter(shader, gl!.COMPILE_STATUS)) throw new Error('Shader compilation failed');
    return shader;
  }

  function draw() {
    if (!ready || disposed || !current.visible || gl!.isContextLost()) return;
    gl!.uniform4f(scene, canvas.width, canvas.height, elapsed * -0.73, 4.0);
    gl!.drawArrays(gl!.TRIANGLES, 0, 3);
    frames++;
  }

  function schedule() {
    if (typeof requestAnimationFrame === 'function') raf = requestAnimationFrame(frame);
    else timer = setTimeout(() => frame(performance.now()), 1000 / 30);
  }

  function frame(time: number) {
    raf = 0;
    timer = undefined;
    if (disposed || !ready || gl!.isContextLost()) return;
    if (!current.visible || current.reduced) {
      onState(current.visible ? 'still' : frames ? 'paused' : 'pending');
      lastTime = 0;
      return;
    }
    if (lastTime) elapsed += (time - lastTime) / 1000;
    lastTime = time;
    if (!lastDrawTime || time - lastDrawTime >= 1000 / 30) {
      draw();
      lastDrawTime = time;
    }
    schedule();
  }

  function update(next: Partial<WavesOptions>) {
    current = { ...current, ...next };
    pause();
    if (!ready || disposed || gl!.isContextLost()) return;
    if (canvas.width !== current.width || canvas.height !== current.height) {
      canvas.width = current.width;
      canvas.height = current.height;
    }
    gl!.viewport(0, 0, current.width, current.height);
    if (!current.visible) { onState(frames ? 'paused' : 'pending'); return; }
    draw();
    onState(current.reduced ? 'still' : 'animated');
    if (!current.reduced) schedule();
  }

  function initialize() {
    release();
    if (!gl) { onState('fallback'); return; }
    if (disposed || gl.isContextLost()) return;
    try {
      const vertex = compile(gl.VERTEX_SHADER, WAVES_VERTEX_SHADER);
      const fragment = compile(gl.FRAGMENT_SHADER, WAVES_FRAGMENT_SHADER);
      program = gl.createProgram();
      if (!program) throw new Error('Program allocation failed');
      gl.attachShader(program, vertex);
      gl.attachShader(program, fragment);
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error('Program linking failed');
      gl.useProgram(program);
      buffer = gl.createBuffer();
      if (!buffer) throw new Error('Buffer allocation failed');
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      const position = gl.getAttribLocation(program, 'a_position');
      gl.enableVertexAttribArray(position);
      gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
      gl.uniform3fv(gl.getUniformLocation(program, 'u_colors[0]'), new Float32Array([
        // NexOS rose palette: #180810, #D60070, #FF459F, #FFF3FA.
        24 / 255, 8 / 255, 16 / 255, 214 / 255, 0, 112 / 255,
        1, 69 / 255, 159 / 255, 1, 243 / 255, 250 / 255,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      ]));
      gl.uniform4f(gl.getUniformLocation(program, 'u_shape'), 2.00, 0.54, 0.47, 0.04);
      gl.uniform4f(gl.getUniformLocation(program, 'u_surface'), 1.54, 1.16, 0.00, 1.00);
      gl.uniform4f(gl.getUniformLocation(program, 'u_finish'), 0.00, 0.21, 0.002, 0.10);
      gl.uniform4f(gl.getUniformLocation(program, 'u_transform'), 4012.0, 5.65, 0.12, 0.0);
      gl.uniform4f(gl.getUniformLocation(program, 'u_space'), 0.11, -0.19, 0.0, 0.0);
      gl.uniform4f(gl.getUniformLocation(program, 'u_cursor'), 0.0, 2.0, 0.65, 0.46);
      scene = gl.getUniformLocation(program, 'u_scene');
      ready = true;
      update({});
    } catch {
      release();
      onState('fallback');
    }
  }

  function contextLost(event: Event) {
    event.preventDefault();
    pause();
    ready = false;
    frames = 0;
    program = null;
    buffer = null;
    shaders.length = 0;
    onState('context-lost');
  }

  function inspect() {
    const uniform = (name: string) => {
      const location = program && gl?.getUniformLocation(program, name);
      return location ? Array.from(gl!.getUniform(program!, location) as Float32Array) : [];
    };
    return { frames, elapsed, width: canvas.width, height: canvas.height,
      shape: uniform('u_shape'), surface: uniform('u_surface'), finish: uniform('u_finish'),
      transform: uniform('u_transform'), space: uniform('u_space'), cursor: uniform('u_cursor'),
      error: gl?.getError() ?? 0,
    };
  }

  canvas.addEventListener('webglcontextlost', contextLost);
  canvas.addEventListener('webglcontextrestored', initialize);
  initialize();
  return {
    update, inspect,
    destroy() {
      disposed = true;
      canvas.removeEventListener('webglcontextlost', contextLost);
      canvas.removeEventListener('webglcontextrestored', initialize);
      release();
    },
  };
}

export type WavesRenderer = ReturnType<typeof createWavesRenderer>;
