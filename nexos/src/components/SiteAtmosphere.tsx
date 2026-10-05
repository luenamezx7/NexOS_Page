'use client';

import { Slipstream } from './ui/background-ascii-flow';
import dynamic from 'next/dynamic';
import { useTheme } from './ThemeProvider';
import { useDesktopEffects } from '@/lib/use-desktop-effects';

const DitherWave = dynamic(() => import('./ui/dither-wave'), { ssr: false });

export function CloudSky() {
  return <div className="day-clouds" aria-hidden="true"><span className="sky-cloud sky-cloud-one" /><span className="sky-cloud sky-cloud-two" /><span className="sky-cloud sky-cloud-three" /></div>;
}

/** One shared, non-interactive star layer for every route and landing section. */
export function SiteAtmosphere() {
  const { theme } = useTheme();
  const effects = useDesktopEffects();
  return <div className="site-atmosphere" aria-hidden="true">
    {effects && theme === 'light' && <div className="day-dither"><DitherWave primaryColor="var(--nex-pink-hot)" secondaryColor="var(--nex-pink)" tertiaryColor="#f3ead9" intensity={0.65} scale={8} quality="low" maxFPS={20} pauseWhenOffscreen /></div>}
    <CloudSky />
    <div className="night-sky"><Slipstream density={1.3} seed={731} /></div>
  </div>;
}
