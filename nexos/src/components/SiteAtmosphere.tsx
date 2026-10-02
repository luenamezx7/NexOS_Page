'use client';

import { Slipstream } from './ui/background-ascii-flow';

export function CloudSky() {
  return <div className="day-clouds" aria-hidden="true"><span className="sky-cloud sky-cloud-one" /><span className="sky-cloud sky-cloud-two" /><span className="sky-cloud sky-cloud-three" /></div>;
}

/** One shared, non-interactive star layer for every route and landing section. */
export function SiteAtmosphere() {
  return <div className="site-atmosphere" aria-hidden="true"><CloudSky /><div className="night-sky"><Slipstream density={0.8} seed={731} /></div></div>;
}
