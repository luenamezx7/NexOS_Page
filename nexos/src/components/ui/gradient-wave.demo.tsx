import { GradientWave } from './gradient-wave';

/** Standalone usage example; the homepage keeps its existing heading and layout. */
export default function DemoOne() {
  return <div className="relative flex h-screen w-full items-center justify-center">
    <GradientWave />
    <h1 className="relative z-10 text-center text-7xl font-bold tracking-tighter text-black">Gradient Wave</h1>
  </div>;
}
