'use client';

import { GlowingBadge, type GlowingBadgeVariant } from './primitives/glowing-badge';

export function GlowingBadgeDemo({ pulse = true, dot = true }: { pulse?: boolean; dot?: boolean }) {
  const examples: { variant: GlowingBadgeVariant; label: string }[] = [
    { variant: 'success', label: 'Live' },
    { variant: 'neutral', label: 'Ghost' },
    { variant: 'info', label: 'In Progress' },
    { variant: 'warning', label: 'Pending' },
    { variant: 'error', label: 'Offline' },
    { variant: 'default', label: 'Draft' },
  ];

  return <div className="flex flex-wrap items-center justify-center gap-3 p-8">
    {examples.map(({ variant, label }) => <GlowingBadge key={variant} variant={variant} pulse={pulse} dot={dot}>{label}</GlowingBadge>)}
  </div>;
}
