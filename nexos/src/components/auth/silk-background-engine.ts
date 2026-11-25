import { silkFragmentShader } from './silk-shader';

const vertexSource = 'attribute vec2 a_position; void main() { gl_Position = vec4(a_position, 0.0, 1.0); }';
const colors = new Float32Array([
  .039, .059, .000, .075, .208, .051, .851, .996, .604, .075, .094, .004,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
]);


/** Shared by the parser-time opening and the login React wrapper. */
export function createSilkBackground(canvas: HTMLCanvasElement) {
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const contrast = matchMedia('(forced-colors: active)');
    let gl: WebGLRenderingContext | null = null;
    let program: WebGLProgram | null = null;
    let buffer: WebGLBuffer | null = null;
    let vertex: WebGLShader | null = null;
    let fragment: WebGLShader | null = null;
    let scene: WebGLUniformLocation | null = null;
    let raf = 0, elapsed = 0;
    let previous: number | null = null;
    let lost = false, disposed = false;
    let ratioQuery: MediaQueryList | null = null;

    const stop = () => { cancelAnimationFrame(raf); raf = 0; previous = null; };
    const release = () => {
      if (gl && !gl.isContextLost()) {
        if (buffer) gl.deleteBuffer(buffer);
        if (program) gl.deleteProgram(program);
        if (vertex) gl.deleteShader(vertex);
        if (fragment) gl.deleteShader(fragment);
      }
      buffer = null; program = null; vertex = null; fragment = null; scene = null;
    };
    const fail = () => { stop(); release(); canvas.dataset.silkState = 'fallback'; };
    const render = () => {
      if (!gl || !program || lost || disposed || document.hidden || contrast.matches) return;
      gl.useProgram(program);
      gl.uniform4f(scene, canvas.width, canvas.height, elapsed * .31, 4);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    const frame = (now: number) => {
      raf = 0;
      if (disposed || lost || document.hidden || !program) return;
      // Some engines update matches before delivering the media change event.
      if (reduced.matches || contrast.matches) { sync(); return; }
      if (previous !== null) elapsed += Math.min((now - previous) / 1000, .1);
      previous = now;
      render();
      raf = requestAnimationFrame(frame);
    };
    const sync = () => {
      stop();
      if (!program || lost || disposed) return;
      canvas.dataset.silkState = document.hidden || contrast.matches ? 'paused' : reduced.matches ? 'static' : 'running';
      render();
      if (!document.hidden && !reduced.matches && !contrast.matches) raf = requestAnimationFrame(frame);
    };
    const measure = () => {
      if (!gl || lost || disposed) return;
      const rect = canvas.getBoundingClientRect();
      const limits = gl.getParameter(gl.MAX_VIEWPORT_DIMS) as Int32Array;
      const dpr = Math.min(devicePixelRatio || 1, 2, limits[0] / Math.max(rect.width, 1), limits[1] / Math.max(rect.height, 1));
      const width = Math.max(1, Math.round(rect.width * dpr));
      const height = Math.max(1, Math.round(rect.height * dpr));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width; canvas.height = height;
        gl.viewport(0, 0, width, height);
      }
      render();
    };
    const initialize = () => {
      if (disposed) return;
      try {
        gl = canvas.getContext('webgl', { alpha: false, antialias: false, depth: false, stencil: false, preserveDrawingBuffer: false });
        if (!gl) { fail(); return; }
        const compile = (kind: number, source: string) => {
          const shader = gl!.createShader(kind);
          if (!shader) throw new Error('Shader allocation failed');
          gl!.shaderSource(shader, source); gl!.compileShader(shader);
          if (!gl!.getShaderParameter(shader, gl!.COMPILE_STATUS)) {
            gl!.deleteShader(shader); throw new Error('Shader compilation failed');
          }
          return shader;
        };
        vertex = compile(gl.VERTEX_SHADER, vertexSource);
        fragment = compile(gl.FRAGMENT_SHADER, silkFragmentShader);
        program = gl.createProgram();
        if (!program) throw new Error('Program allocation failed');
        gl.attachShader(program, vertex); gl.attachShader(program, fragment); gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error('Shader linking failed');
        gl.useProgram(program);
        buffer = gl.createBuffer();
        if (!buffer) throw new Error('Buffer allocation failed');
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
        const position = gl.getAttribLocation(program, 'a_position');
        gl.enableVertexAttribArray(position); gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
        gl.uniform3fv(gl.getUniformLocation(program, 'u_colors[0]'), colors);
        gl.uniform4f(gl.getUniformLocation(program, 'u_shape'), 1.26, .09, .50, .00);
        gl.uniform4f(gl.getUniformLocation(program, 'u_surface'), 2.40, 1.11, .00, 1.00);
        gl.uniform4f(gl.getUniformLocation(program, 'u_finish'), .00, .00, .000, .22);
        gl.uniform4f(gl.getUniformLocation(program, 'u_transform'), 1581, 0, 0, 0);
        gl.uniform4f(gl.getUniformLocation(program, 'u_space'), -.23, 0, 0, 0);
        gl.uniform4f(gl.getUniformLocation(program, 'u_cursor'), 0, 2, .65, .46);
        scene = gl.getUniformLocation(program, 'u_scene');
        measure(); sync();
      } catch { fail(); }
    };
    const onLost = (event: Event) => {
      event.preventDefault(); lost = true; stop(); release(); canvas.dataset.silkState = 'fallback';
    };
    const onRestored = () => { lost = false; initialize(); };
    const watchRatio = () => {
      ratioQuery?.removeEventListener('change', onRatio);
      ratioQuery = matchMedia(`(resolution: ${devicePixelRatio || 1}dppx)`);
      ratioQuery.addEventListener('change', onRatio);
    };
    const onRatio = () => { watchRatio(); measure(); };
    const resize = new ResizeObserver(measure);
    resize.observe(canvas);
    document.addEventListener('visibilitychange', sync);
    reduced.addEventListener('change', sync);
    contrast.addEventListener('change', sync);
    window.addEventListener('resize', measure);
    canvas.addEventListener('webglcontextlost', onLost);
    canvas.addEventListener('webglcontextrestored', onRestored);
    watchRatio(); initialize();
    const dispose = () => {
      disposed = true; stop(); resize.disconnect(); release();
      ratioQuery?.removeEventListener('change', onRatio);
      document.removeEventListener('visibilitychange', sync);
      reduced.removeEventListener('change', sync); contrast.removeEventListener('change', sync);
      window.removeEventListener('resize', measure);
      canvas.removeEventListener('webglcontextlost', onLost);
      canvas.removeEventListener('webglcontextrestored', onRestored);
    };
    return { dispose };
}
