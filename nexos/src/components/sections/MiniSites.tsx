'use client';

import { useEffect, useRef } from 'react';
import { ArrowUpRight, AtSign, MessageCircle, ShoppingBag } from 'lucide-react';
import { useLocale } from '@/lib/locale';
import { commercialHref } from '@/lib/commercial';
import { usePresentationActive } from '@/lib/use-presentation-active';
import { motionError, recordMotion } from '@/lib/motion-diagnostics';
import { Button } from '../ui/cnippet-button';
import { Iphone15Pro } from '../ui/iphone-15-pro';
import { ScrollFillText } from '../ui/scroll-fill-headline';
import styles from './MiniSites.module.css';

type PreviewMode = 'links' | 'catalogue';

/** Container units compose the preview at the shared frame's 393 × 852 screen ratio. */
function MiniSiteScreen({ mode }: { mode: PreviewMode }) {
  const { t } = useLocale();
  return <div className={styles.screenViewport}>
    <div className={styles.screenContent}>
      <div className={styles.profile}>
        <span className={styles.avatar} aria-hidden="true"><ShoppingBag strokeWidth={1.5} /></span>
        <p className={styles.brand}>{t('Sua marca')}</p>
        <p className={styles.bio}>{t('Seu negócio começa por aqui.')}</p>
      </div>
      {mode === 'links' ? <ul className={styles.links}>
        <li><ShoppingBag /><span>{t('Conheça nosso catálogo')}</span><ArrowUpRight /></li>
        <li><MessageCircle /><span>{t('Converse no WhatsApp')}</span><ArrowUpRight /></li>
        <li><AtSign /><span>{t('Acompanhe no Instagram')}</span><ArrowUpRight /></li>
      </ul> : <ul className={styles.catalogue}>
        <li><div className={styles.productArt} aria-hidden="true"><ShoppingBag strokeWidth={1} /></div><span>{t('Seu produto')}</span><small>{t('Foto e descrição')}</small></li>
        <li><div className={styles.serviceArt} aria-hidden="true"><MessageCircle strokeWidth={1} /></div><span>{t('Seu serviço')}</span><small>{t('Detalhes e contato')}</small></li>
      </ul>}
      <p className={styles.exampleNote}>{t('Exemplo ilustrativo')}</p>
    </div>
  </div>;
}

export function MiniSites() {
  const { t } = useLocale();
  const stageRef = useRef<HTMLDivElement>(null);
  const presenting = usePresentationActive();

  useEffect(() => {
    if (presenting) return;
    let disposed = false;
    let revert = () => {};
    void Promise.all([import('gsap'), import('gsap/ScrollTrigger')]).then(([{ gsap }, { ScrollTrigger }]) => {
      const stage = stageRef.current;
      if (disposed || !stage) return;
      gsap.registerPlugin(ScrollTrigger);
      const sides = stage.querySelectorAll('[data-mini-site-side]');
      const context = gsap.context(() => {
        gsap.fromTo(sides, { xPercent: 0, yPercent: 0, rotation: 0, scale: 1 }, {
          xPercent: index => (index === 0 ? -1 : 1) * (innerWidth < 768 ? 34 : 40),
          yPercent: 3, rotation: index => index === 0 ? -5 : 5, scale: .94,
          ease: 'power2.out',
          scrollTrigger: { id: 'mini-sites-phones', trigger: stage, start: 'clamp(top 85%)', end: 'clamp(top 38%)', scrub: .65, invalidateOnRefresh: true },
        });
      }, stage);
      stage.dataset.fanReady = 'true';
      revert = () => { context.revert(); delete stage.dataset.fanReady; };
    }).catch(error => recordMotion('miniSitesGsap', 'initialization-error', motionError(error)));
    return () => { disposed = true; revert(); };
  }, [presenting]);

  return <section id="mini-sites" className={styles.section} aria-labelledby="mini-sites-title">
    <div className={styles.inner}>
      <div className={styles.copy}>
        <h2 id="mini-sites-title" data-heading-static data-scroll-fill-heading className={styles.title}><ScrollFillText lines={[t('Mini-Sites')]} /></h2>
        <p className={styles.lead}>{t('Seu catálogo e seus links. No mesmo endereço.')}</p>
        <p className={styles.description}>{t('Sites simples, bonitos e objetivos para apresentar seus produtos e organizar seus links. Coloque na bio do Instagram e facilite o próximo passo de quem chega até você.')}</p>
        <ul className={styles.uses}>
          <li>{t('Catálogo de produtos ou serviços')}</li>
          <li>{t('WhatsApp, redes sociais e outros links')}</li>
          <li>{t('Uma página com a identidade do seu negócio')}</li>
        </ul>
      </div>
      <div className={styles.example}>
        <div ref={stageRef} className={styles.mockups} data-mini-site-mockups>
          <div className={`${styles.phoneAnchor} ${styles.leftPhone}`} aria-hidden="true">
            <div className={styles.phoneMotion} data-mini-site-side="left"><Iphone15Pro><MiniSiteScreen mode="catalogue" /></Iphone15Pro></div>
          </div>
          <div className={`${styles.phoneAnchor} ${styles.rightPhone}`} aria-hidden="true">
            <div className={styles.phoneMotion} data-mini-site-side="right"><Iphone15Pro><MiniSiteScreen mode="links" /></Iphone15Pro></div>
          </div>
          <div id="mini-site-preview" className={`${styles.phoneAnchor} ${styles.centerPhone}`} role="group" aria-label={t('Exemplo ilustrativo de Mini-Site')}>
            <Iphone15Pro><MiniSiteScreen mode="links" /></Iphone15Pro>
          </div>
        </div>
      </div>
      <div className={styles.action}>
        <Button size="xl" render={<a href={commercialHref(t('Olá! Quero um Mini-Site para apresentar meu catálogo e organizar os links da bio do Instagram.'))} target="_blank" rel="noopener noreferrer" />} data-cta-section="mini-sites" data-cta-solution="biolink">{t('Quero meu Mini-Site')}</Button>
      </div>
    </div>
  </section>;
}
