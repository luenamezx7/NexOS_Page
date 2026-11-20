'use client';

import { scheduleScrollRefresh } from '@/lib/schedule-scroll-refresh';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import { solutions } from '@/config/solutions';
import { commercialHref } from '@/lib/commercial';
import { useLocale } from '@/lib/locale';
import { usePrefersReducedMotion } from '@/lib/use-prefers-reduced-motion';
import { usePresentationActive } from '@/lib/use-presentation-active';
import { Button } from '../ui/cnippet-button';
import styles from './Management.module.css';

const loginImage = '/images/crm/controle-ezway-login.png';

export function Management() {
  const { t } = useLocale();
  const stageRef = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();
  const presenting = usePresentationActive();

  useEffect(() => {
    if (presenting || reduced) return;
    let disposed = false;
    let cleanup = () => {};
    void Promise.all([import('gsap'), import('gsap/ScrollTrigger')]).then(([{ gsap }, { ScrollTrigger }]) => {
      const stage = stageRef.current;
      if (disposed || !stage) return;
      gsap.registerPlugin(ScrollTrigger);
      const context = gsap.context(() => {
        stage.querySelectorAll<HTMLElement>('[data-management-fade]').forEach(element => {
          gsap.timeline({
            scrollTrigger: {
              trigger: element, start: 'clamp(top 95%)', end: 'clamp(bottom 5%)',
              scrub: .35, invalidateOnRefresh: true,
            },
          })
            .fromTo(element, { opacity: .2 }, { opacity: 1, duration: .18, ease: 'none' })
            .to(element, { opacity: 1, duration: .64 })
            .to(element, { opacity: .2, duration: .18, ease: 'none' });
        });
      }, stage);
      cleanup = () => context.revert();
      scheduleScrollRefresh(ScrollTrigger);
      void document.fonts.ready.then(() => { if (!disposed) scheduleScrollRefresh(ScrollTrigger); });
    }).catch(() => cleanup());
    return () => { disposed = true; cleanup(); };
  }, [presenting, reduced]);

  const solution = solutions.find(item => item.id === 'gestao')!;
  return <section id="gestao" aria-labelledby="management-title" className={styles.section}>
    <div ref={stageRef} className={styles.container} data-management-stage>
      <header className={styles.header} data-management-fade>
        <p className={styles.eyebrow}>{t('CONTROLE & GESTÃO')}</p>
        <h2 data-heading-static id="management-title">{t('Seu negócio, mais organizado.')}</h2>
        <p>{t('Acompanhe clientes, vendas e financeiro em um só lugar.')}</p>
      </header>
      <figure className={styles.demo} data-management-fade>
        <a id="management-demo" className={styles.screen} href={loginImage} target="_blank" rel="noopener noreferrer" aria-label={t('Ampliar tela do CRM')}>
          <Image src={loginImage} alt={t('Tela de login do Controle · ezway')} width={2880} height={1800} sizes="(max-width: 968px) calc(100vw - 48px), 920px" quality={90} className={styles.screenshot} />
        </a>
      </figure>
      <div className={styles.action} data-management-fade>
        <Button variant="secondary" size="xl" render={<a href={commercialHref(t(solution.message))} target="_blank" rel="noopener noreferrer" />} data-cta-section="gestao" data-cta-solution="gestao">{t(solution.cta)}</Button>
      </div>
    </div>
  </section>;
}
