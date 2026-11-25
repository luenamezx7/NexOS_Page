import { silkFragmentShader } from '../auth/silk-shader';
import { createGlassRenderer, glassEnd, glassSettings, makeGlassLogo } from './glass-logo-engine';
import { mascotPaths } from './mascot-reveal-paths.generated';

interface Size { width: number; height: number; dpr: number; }
interface WorkerMessage {
  type: 'init' | 'resize' | 'pause' | 'motion';
  silk?: OffscreenCanvas; logo?: OffscreenCanvas;
  background: Size; foreground: Size; reduced: boolean; paused: boolean;
}
const worker = globalThis as unknown as {
  onmessage: (event: MessageEvent<WorkerMessage>) => void;
  postMessage: (data: unknown) => void;
};

function silkPass(canvas: OffscreenCanvas) {
  const gl = canvas.getContext('webgl', { alpha: false, antialias: false, depth: false, stencil: false })!;
  if (!gl) throw new Error('Silk WebGL unavailable');
  const program = gl.createProgram()!;
  for (const [type, source] of [[gl.VERTEX_SHADER, 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}'], [gl.FRAGMENT_SHADER, silkFragmentShader]] as const) {
    const shader = gl.createShader(type)!; gl.shaderSource(shader, source); gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error('Silk shader failed');
    gl.attachShader(program, shader); gl.deleteShader(shader);
  }
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error('Silk linking failed');
  gl.useProgram(program); gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,3,-1,-1,3]), gl.STATIC_DRAW);
  const pos = gl.getAttribLocation(program, 'p'); gl.enableVertexAttribArray(pos); gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);
  gl.uniform3fv(gl.getUniformLocation(program, 'u_colors[0]'), new Float32Array([.039,.059,0,.075,.208,.051,.851,.996,.604,.075,.094,.004,0,0,0,0,0,0,0,0,0,0,0,0]));
  for (const [name, values] of Object.entries({u_shape:[1.26,.09,.5,0],u_surface:[2.4,1.11,0,1],u_finish:[0,0,0,.22],u_transform:[1581,0,0,0],u_space:[-.23,0,0,0],u_cursor:[0,2,.65,.46]})) gl.uniform4fv(gl.getUniformLocation(program,name),values);
  const scene = gl.getUniformLocation(program,'u_scene');
  let prepared=false;
  return (size: Size, time: number) => {
    const dpr = Math.min(size.dpr,2), width=Math.max(1,Math.round(size.width*dpr)), height=Math.max(1,Math.round(size.height*dpr));
    if (canvas.width!==width || canvas.height!==height) { canvas.width=width; canvas.height=height; gl.viewport(0,0,width,height); }
    gl.uniform4f(scene,width,height,time*.31,4); gl.drawArrays(gl.TRIANGLES,0,3);
    if (!prepared) { gl.finish(); prepared=true; }
  };
}
function logoData() {
  const body = new OffscreenCanvas(512,512), eyes = new OffscreenCanvas(512,512);
  const bc = body.getContext('2d')!, ec=eyes.getContext('2d')!;
  for (const ctx of [bc,ec]) { ctx.scale(512/770,512/770); ctx.translate(-240,-215); ctx.fillStyle='#fff'; }
  for (const shape of mascotPaths) {
    const ctx=shape.eye?ec:bc;
    ctx.globalCompositeOperation=shape.hole&&!shape.eye?'destination-out':'source-over';
    ctx.fill(new Path2D(shape.d));
  }
  return makeGlassLogo(body,512,512,eyes);
}
let current: WorkerMessage, drawSilk: ReturnType<typeof silkPass>, glass: ReturnType<typeof createGlassRenderer>;
let started=0, frame=0, previous=0, lastState='', paused=false, metricsSent=false;
const intervals: number[]=[];
const ease = (n: number) => n*n*(3-2*n);
function draw(now: number) {
  frame=0;
  if (paused) return;
  const elapsed=Math.max(0,now-started), t=Math.min(1,elapsed/2200);
  if (previous && elapsed>300 && previous-started>300) intervals.push(now-previous);
  previous=now;
  let blink=1;
  if (!current.reduced) {
    if (elapsed>=2600 && elapsed<2850) blink=1-.955*ease((elapsed-2600)/250);
    else if (elapsed>=2850 && elapsed<3050) blink=.045;
    else if (elapsed>=3050 && elapsed<3400) blink=.045+.955*ease((elapsed-3050)/350);
  }
  drawSilk(current.background,current.reduced?0:elapsed/1000);
  glass?.render(current.reduced?glassEnd(glassSettings):t*glassEnd(glassSettings),glassSettings,blink);
  const phase=t<1&&!current.reduced?'playing':'complete', eye=blink<.2?'closed':blink>.95?'open':'moving';
  const state=`${phase}/${eye}`;
  if (state!==lastState) { lastState=state; worker.postMessage({type:'state',phase,eye}); }
  if ((!metricsSent && elapsed >= 4800) || current.reduced) {
    metricsSent=true;
    const sorted=[...intervals].sort((a,b)=>a-b);
    worker.postMessage({type:'metrics',frames:sorted.length,max:Math.max(0,...sorted),p95:sorted[Math.floor(sorted.length*.95)]||0});
  }
  if (elapsed<6200&&!current.reduced) frame=requestAnimationFrame(draw);
}
worker.onmessage = ({data}) => {
  try {
    if (data.type==='init') {
      current=data; drawSilk=silkPass(data.silk!);
      glass=createGlassRenderer(data.logo!,()=>current.foreground);
      if (!glass) throw new Error('Glass WebGL2 unavailable');
      glass.setLogo(logoData());
      // Compile the first GPU draws before starting the visible spring clock.
      drawSilk(current.background,0); glass.render(0,glassSettings); glass.finish();
      started=performance.now();
      worker.postMessage({type:'ready',epoch:performance.timeOrigin+started});
      draw(started+1);
    } else {
      current={...current,...data}; paused=data.paused;
      if (frame) cancelAnimationFrame(frame); frame=0;
      if (!paused) draw(performance.now());
    }
  } catch (error) { worker.postMessage({type:'failure',message:error instanceof Error?error.message:'Renderer failed'}); }
};
