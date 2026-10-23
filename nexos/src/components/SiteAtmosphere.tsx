'use client';

import { usePathname } from 'next/navigation';
import { BrandVeil } from './ui/brand-veil';

export function CloudSky() {
  return <div className="day-clouds" aria-hidden="true"><span className="sky-cloud sky-cloud-one" /><span className="sky-cloud sky-cloud-two" /><span className="sky-cloud sky-cloud-three" /></div>;
}

/** The same purple grain field as the landing, softened for internal page reading. */
export function SiteAtmosphere() {
  const pathname = usePathname();
  // The landing owns its individual scenes.
  if (pathname === '/') return null;
  return <div className="site-atmosphere interior-atmosphere" aria-hidden="true"><BrandVeil variant="interior" /></div>;
}
