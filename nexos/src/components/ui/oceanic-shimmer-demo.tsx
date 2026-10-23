import { GradientBackground } from '@/components/ui/oceanic-shimmer';

export default function GradientBackgroundDemo() {
  return (
    <div className="relative h-[440px] w-full overflow-hidden rounded-xl">
      <GradientBackground className="absolute inset-0" />
    </div>
  );
}
