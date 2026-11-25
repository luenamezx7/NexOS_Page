import { ShaderBackground } from './simplex-noise-bubblegum';

export default function ShaderBackgroundDemo() {
  return <div className="relative h-screen w-full overflow-hidden">
    <ShaderBackground className="h-full w-full" />
  </div>;
}
