'use client';

import { usePathname } from 'next/navigation';
import GradualBlur from '@/components/GradualBlur';

export function PageBlur() {
  const pathname = usePathname();
  // Decorative page blur must not obscure security messages or form controls.
  if (['/login', '/entrar', '/conta', '/dashboard'].some(path => pathname === path || pathname.startsWith(`${path}/`))) return null;
  return <GradualBlur target="page" position="bottom" height="6rem" strength={5} divCount={1} curve="bezier" exponential opacity={1} animated="scroll" hideAtSelector="footer" />;
}
