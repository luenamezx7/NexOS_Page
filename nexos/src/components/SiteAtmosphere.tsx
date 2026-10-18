'use client';

import { Slipstream } from './ui/background-ascii-flow';
import dynamic from 'next/dynamic';
import { useTheme } from './ThemeProvider';
import { usePathname } from 'next/navigation';
import { usePresentationActive } from '@/lib/use-presentation-active';

const Topography = dynamic(() => import('./ui/Topography'), { ssr: false });

export function CloudSky() {
  return <div className="day-clouds" aria-hidden="true"><span className="sky-cloud sky-cloud-one" /><span className="sky-cloud sky-cloud-two" /><span className="sky-cloud sky-cloud-three" /></div>;
}

/** One shared, non-interactive star layer for every route and landing section. */
export function SiteAtmosphere() {
  const pathname = usePathname();
  const { theme } = useTheme();
  const entryOpen = usePresentationActive();
  // The landing owns its scenes: no global waves behind the ASCII hero.
  if (pathname === '/') return null;
  return <div className="site-atmosphere" aria-hidden="true">
    {theme === 'light' && <div className="day-topography"><Topography lowColor="#0052ff" midColor="#008cff" highColor="#fdf6ec" lightMode paused={entryOpen} mouseInteraction={false} maxFPS={24} dprLimit={1} /></div>}
    <CloudSky />
    {theme === 'dark' && <div className="night-sky"><Slipstream density={1.3} seed={731} /></div>}
  </div>;
}
