import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/** transitions.dev cross-fade between a loading placeholder and real content. */
export function SkeletonReveal({ loading, skeleton, children, className }: {
  loading: boolean;
  skeleton: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn('t-skel', !loading && 'is-revealed', className)} data-flow aria-busy={loading}>
    <div className="t-skel-skeleton" aria-hidden={!loading}>{skeleton}</div>
    <div className="t-skel-content" inert={loading || undefined}>{children}</div>
  </div>;
}
