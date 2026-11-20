'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useLocale } from '@/lib/locale';
import styles from './ScrollProgress.module.css';

export function ScrollProgress() {
  const fill = useRef<HTMLDivElement>(null);
  const { t } = useLocale();
  const pathname = usePathname();

  useEffect(() => {
    let frame = 0;
    let maximum = 0;
    let physicalWidth = 0;
    let lastTransform = '';
    let lastPercent = -1;
    const landing = pathname === '/' ? document.querySelector<HTMLElement>('.landing-page') : null;
    const update = () => {
      frame = 0;
      const edge = landing?.dataset.edgeSpring;
      if (edge === 'top' || edge === 'bottom') return;
      const progress = maximum ? Math.min(1, Math.max(0, window.scrollY / maximum)) : 0;
      if (fill.current) {
        // Align the moving edge with physical pixels to keep it sharp while scrolling.
        const crispProgress = physicalWidth ? Math.round(progress * physicalWidth) / physicalWidth : 0;
        const transform = `scaleX(${crispProgress})`;
        const percent = Math.round(progress * 100);
        if (transform !== lastTransform) {
          fill.current.style.transform = transform;
          lastTransform = transform;
        }
        if (percent !== lastPercent) {
          fill.current.parentElement?.setAttribute('aria-valuenow', String(percent));
          lastPercent = percent;
        }
      }
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    // Geometry changes on resize/content growth, not on every scroll frame.
    const measure = () => {
      maximum = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      physicalWidth = (fill.current?.offsetWidth ?? 0) * window.devicePixelRatio;
      schedule();
    };
    const resize = new ResizeObserver(measure);
    resize.observe(document.documentElement);
    if (fill.current) resize.observe(fill.current);
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', measure);
    measure();
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', measure);
    };
  }, [pathname]);

  return <div className={styles.track} data-scroll-progress role="progressbar" aria-label={t('Progresso da página')} aria-valuemin={0} aria-valuemax={100} aria-valuenow={0}>
    <div ref={fill} className={styles.fill} aria-hidden="true" />
  </div>;
}
