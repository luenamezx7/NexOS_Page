"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { usePresentationActive } from '@/lib/use-presentation-active';
import type { MarqueeLogo } from './ui/remocn-perspective-marquee';
import styles from './HeroToolsMarquee.module.css';

const logos: MarqueeLogo[] = [
  { name: 'ChatGPT', src: '/images/brands/chatgpt.svg' },
  { name: 'Claude', src: '/images/brands/claude.svg' },
  { name: 'Figma', src: '/images/brands/figma.svg' },
  { name: 'GitHub', src: '/images/brands/github.svg' },
];

function StaticLogos() {
  return <div className={styles.staticLogos} aria-hidden="true">
    {logos.map(logo => <Image key={logo.name} src={logo.src} alt="" width={76} height={76} />)}
  </div>;
}

const MarqueePlayer = dynamic(() => import('./ui/perspective-marquee-player'), {
  ssr: false, loading: StaticLogos,
});

const subscribeReduced = (callback: () => void) => {
  const media = window.matchMedia('(prefers-reduced-motion: reduce)');
  media.addEventListener('change', callback);
  return () => media.removeEventListener('change', callback);
};
const subscribeVisibility = (callback: () => void) => {
  document.addEventListener('visibilitychange', callback);
  return () => document.removeEventListener('visibilitychange', callback);
};
const getReduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const getVisible = () => !document.hidden;

export function HeroToolsMarquee() {
  const ref = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);
  const [inView, setInView] = useState(false);
  const [size, setSize] = useState({ width: 1200, height: 260 });
  const reduced = useSyncExternalStore(subscribeReduced, getReduced, () => false);
  const visible = useSyncExternalStore(subscribeVisibility, getVisible, () => true);
  const presenting = usePresentationActive();
  const playing = inView && visible && !reduced && !presenting;

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const preloadObserver = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setNear(true); preloadObserver.disconnect(); }
    }, { rootMargin: '300px' });
    const visibilityObserver = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: .05 });
    const resizeObserver = new ResizeObserver(([entry]) => setSize({ width: entry.contentRect.width, height: entry.contentRect.height }));
    preloadObserver.observe(element);
    visibilityObserver.observe(element);
    resizeObserver.observe(element);
    return () => { preloadObserver.disconnect(); visibilityObserver.disconnect(); resizeObserver.disconnect(); };
  }, []);

  return <div ref={ref} className={styles.marquee} data-hero-tools-marquee data-playing={playing}>
    <ul className="sr-only">{logos.map(logo => <li key={logo.name}>{logo.name}</li>)}</ul>
    <div className={styles.visual} aria-hidden="true">
      {near && !reduced
        ? <MarqueePlayer width={size.width} height={size.height} playing={playing} inputProps={{
          logos, logoSize: size.width < 768 ? 48 : 76,
          background: '#000000', fadeColor: '#000000',
          rotateY: -28, rotateX: 8, perspective: 1200, pixelsPerFrame: 2, speed: 1,
        }} />
        : <StaticLogos />}
    </div>
  </div>;
}
