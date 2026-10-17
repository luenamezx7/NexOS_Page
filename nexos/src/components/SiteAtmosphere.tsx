'use client';

import { Slipstream } from './ui/background-ascii-flow';
import dynamic from 'next/dynamic';
import { useTheme } from './ThemeProvider';
import { useSyncExternalStore } from 'react';
import { usePathname } from 'next/navigation';

const Topography = dynamic(() => import('./ui/Topography'), { ssr: false });
function subscribeEntry(callback: () => void) {
  document.addEventListener('nexos-entry-change', callback);
  return () => document.removeEventListener('nexos-entry-change', callback);
}

export function CloudSky() {
  return <div className="day-clouds" aria-hidden="true"><span className="sky-cloud sky-cloud-one" /><span className="sky-cloud sky-cloud-two" /><span className="sky-cloud sky-cloud-three" /></div>;
}

/** One shared, non-interactive star layer for every route and landing section. */
export function SiteAtmosphere() {
  const pathname = usePathname();
  const { theme } = useTheme();
  const entryOpen = useSyncExternalStore(subscribeEntry, () => Boolean(document.querySelector('.waves-entry[open]')), () => true);
  // The landing owns its scenes: no global waves behind the ASCII hero.
  if (pathname === '/') return null;
  return <div className="site-atmosphere" aria-hidden="true">
    {theme === 'light' && <div className="day-topography"><Topography lowColor="#2470b3" midColor="#86cbf9" highColor="#fdf6ec" lightMode paused={entryOpen} mouseInteraction={false} maxFPS={24} dprLimit={1} /></div>}
    <CloudSky />
    <div className="night-sky"><Slipstream density={1.3} seed={731} /></div>
  </div>;
}
