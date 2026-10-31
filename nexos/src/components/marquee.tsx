'use client';

import { Children, type CSSProperties, type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import styles from './marquee.module.css';

// Installed from https://spell.sh/r/marquee.json. Public API preserved.
// Local hardening: static stylesheet (stable keyframes), accessible copies,
// viewport-filling groups, focus pause and reduced-motion fallback.
interface MarqueeProps extends HTMLAttributes<HTMLDivElement> {
  duration?: number;
  pauseOnHover?: boolean;
  direction?: 'left' | 'right' | 'up' | 'down';
  fade?: boolean;
  fadeAmount?: number;
}

export function Marquee({ children, className, duration = 20, pauseOnHover = false, direction = 'left', fade = true, fadeAmount = 10, style, ...props }: MarqueeProps) {
  const items = Children.toArray(children);
  const vertical = direction === 'up' || direction === 'down';
  const mask = `linear-gradient(to ${vertical ? 'bottom' : 'right'}, transparent, black ${fadeAmount}%, black ${100 - fadeAmount}%, transparent)`;
  return <div {...props} data-direction={direction} data-pause-hover={pauseOnHover} className={cn(styles.root, className)} style={{ '--marquee-duration': `${duration}s`, ...(fade ? { maskImage: mask, WebkitMaskImage: mask } : {}), ...style } as CSSProperties}>
    <div className={styles.track} data-marquee-track>
      {[false, true].map(duplicate => <div key={String(duplicate)} className={styles.group} aria-hidden={duplicate || undefined} inert={duplicate || undefined}>
        {items.map((item, i) => <div key={i} className={styles.item}>{item}</div>)}
      </div>)}
    </div>
  </div>;
}
