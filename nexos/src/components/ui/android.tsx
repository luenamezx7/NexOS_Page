'use client';

import { useId, type SVGProps } from 'react';
import { cn } from '@/lib/utils';
import styles from './android.module.css';

export interface AndroidProps extends SVGProps<SVGSVGElement> {
  width?: number;
  height?: number;
  src?: string;
  videoSrc?: string;
}

/** Magic UI Android frame, with a fixed coordinate system and per-instance screen clip. */
export function Android({ width = 380, height = 830, src, videoSrc, className, ...props }: AndroidProps) {
  const clipId = `android-screen-${useId().replace(/:/g, '')}`;

  return (
    <svg width={width} height={height} viewBox="0 0 380 830" fill="none" xmlns="http://www.w3.org/2000/svg" className={cn(styles.device, className)} {...props}>
      <defs>
        <clipPath id={clipId}>
          <rect x="9" y="14" width="360" height="800" rx="33" ry="25" />
        </clipPath>
      </defs>
      <path d="M376 153H378C379.105 153 380 153.895 380 155V249C380 250.105 379.105 251 378 251H376V153Z" className={styles.frame} />
      <path d="M376 301H378C379.105 301 380 301.895 380 303V351C380 352.105 379.105 353 378 353H376V301Z" className={styles.frame} />
      <path d="M0 42C0 18.8041 18.804 0 42 0H336C359.196 0 378 18.804 378 42V788C378 811.196 359.196 830 336 830H42C18.804 830 0 811.196 0 788V42Z" className={styles.frame} />
      <path d="M2 43C2 22.0132 19.0132 5 40 5H338C358.987 5 376 22.0132 376 43V787C376 807.987 358.987 825 338 825H40C19.0132 825 2 807.987 2 787V43Z" className={styles.body} />
      <g clipPath={`url(#${clipId})`}>
        <rect x="9" y="14" width="360" height="800" className={styles.screen} />
        {src && !videoSrc && <image href={src} x="9" y="14" width="360" height="800" preserveAspectRatio="xMidYMid slice" />}
        {videoSrc && <foreignObject x="9" y="14" width="360" height="800"><video className={styles.video} src={videoSrc} poster={src} autoPlay loop muted playsInline /></foreignObject>}
      </g>
      <circle cx="189" cy="28" r="9" className={styles.body} />
      <circle cx="189" cy="28" r="4" className={styles.lens} />
    </svg>
  );
}
