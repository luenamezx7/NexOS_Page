import { createWavesRenderer, type WavesRenderer, type WavesOptions } from '@/lib/waves-renderer';

type Message =
  | { type: 'init'; canvas: OffscreenCanvas; options: WavesOptions }
  | { type: 'update'; options: Partial<WavesOptions> }
  | { type: 'inspect' };

// Dedicated worker, not a service worker. No external imports at runtime.
const scope = self as unknown as {
  onmessage: ((event: MessageEvent<Message>) => void) | null;
  postMessage: (message: unknown) => void;
};
let renderer: WavesRenderer | undefined;
scope.onmessage = ({ data }) => {
  if (data.type === 'init') {
    renderer?.destroy();
    const canvas = data.canvas;
    renderer = createWavesRenderer(canvas, data.options, state => scope.postMessage({ type: 'state', state, width: canvas.width, height: canvas.height }));
  } else if (data.type === 'update') {
    renderer?.update(data.options);
  } else if (data.type === 'inspect') {
    scope.postMessage({ type: 'inspection', ...renderer?.inspect() });
  }
};
