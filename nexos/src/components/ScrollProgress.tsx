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
    const update = () => {
      frame = 0;
      const maximum = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      const progress = maximum ? Math.min(1, Math.max(0, window.scrollY / maximum)) : 0;
      if (fill.current) {
        fill.current.style.transform = `scaleX(${progress})`;
        fill.current.parentElement?.setAttribute('aria-valuenow', String(Math.round(progress * 100)));
      }
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    const resize = new ResizeObserver(schedule);
    resize.observe(document.documentElement);
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    schedule();
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, [pathname]);

  return <div className={styles.track} data-scroll-progress role="progressbar" aria-label={t('Progresso da página')} aria-valuemin={0} aria-valuemax={100} aria-valuenow={0}>
    <div ref={fill} className={styles.fill} aria-hidden="true" />
  </div>;
}
