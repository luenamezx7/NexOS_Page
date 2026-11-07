'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useLocale } from '@/lib/locale';
import styles from './RouteLoadingProgress.module.css';

type Phase = 'idle' | 'loading' | 'complete';

/** A route transition indicator, separate from the homepage scroll progress. */
export function RouteLoadingProgress() {
  const pathname = usePathname();
  const { t } = useLocale();
  const [phase, setPhase] = useState<Phase>('idle');
  const phaseRef = useRef<Phase>('idle');
  const previousPath = useRef(pathname);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const clearTimer = () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = null;
    };
    const begin = () => {
      clearTimer();
      phaseRef.current = 'loading';
      setPhase('loading');
      // A failed navigation must never leave the indicator stuck on screen.
      timer.current = setTimeout(() => { phaseRef.current = 'idle'; setPhase('idle'); timer.current = null; }, 10000);
    };
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      const link = target.closest<HTMLAnchorElement>('a[href]');
      if (!link || link.hasAttribute('download') || (link.target && link.target !== '_self')) return;
      const destination = new URL(link.href, window.location.href);
      if (destination.origin !== window.location.origin || destination.pathname === window.location.pathname) return;

      begin();
    };
    const onPopState = () => { if (window.location.pathname !== previousPath.current) begin(); };
    document.addEventListener('click', onClick, true);
    window.addEventListener('popstate', onPopState);
    return () => { document.removeEventListener('click', onClick, true); window.removeEventListener('popstate', onPopState); clearTimer(); };
  }, []);

  useEffect(() => {
    if (previousPath.current === pathname) return;
    previousPath.current = pathname;
    if (phaseRef.current !== 'loading') return;
    if (timer.current) clearTimeout(timer.current);
    phaseRef.current = 'complete';
    setPhase('complete');
    timer.current = setTimeout(() => { phaseRef.current = 'idle'; setPhase('idle'); timer.current = null; }, 350);
  }, [pathname]);

  return <div className={styles.track} data-route-loading={phase} role={phase === 'idle' ? undefined : 'progressbar'} aria-label={phase === 'idle' ? undefined : t('Carregando página')} aria-hidden={phase === 'idle' ? true : undefined}>
    <span className={styles.fill} aria-hidden="true" />
  </div>;
}
