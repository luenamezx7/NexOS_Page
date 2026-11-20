'use client';

import { forwardRef, useEffect, useImperativeHandle, useRef, useSyncExternalStore } from 'react';
import ButtonWithIcon from './ui/button-witn-icon';
import { TextType } from './ui/TextType';
import { HeroBackground } from './HeroBackground';
import { commercialHref } from '@/lib/commercial';
import { diagnosticMessage } from '@/config/solutions';
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';
import { usePresentationActive, usePresentationRevealing } from '@/lib/use-presentation-active';
import { useSectionScroll } from './SmoothScrollProvider';
import { useLocale } from '@/lib/locale';
import Image from 'next/image';
import styles from './Hero.module.css';
import { useHeroChoreography } from './use-hero-choreography';
import { NavigationGlass } from './NavigationGlass';

const subscribeHydration = () => () => {};
const heroWords = {
  pt: ['conectado', 'impulsionado', 'otimizado'],
  en: ['connected', 'powered', 'optimized'],
  es: ['conectado', 'impulsado', 'optimizado'],
} as const;
const heroSentence = { pt: ['Seu negócio', 'em uma aproximação'], en: ['Your business', 'with a single tap'], es: ['Tu negocio', 'con un solo toque'] } as const;

export const Hero = forwardRef<HTMLElement, { className?: string }>(function Hero({ className = '' }, ref) {
  const { t, locale } = useLocale();
  const scrollToSection = useSectionScroll();
  const navigationReady = useSyncExternalStore(subscribeHydration, () => true, () => false);
  const entryOpen = usePresentationActive();
  const revealing = usePresentationRevealing();
  const showHero = !entryOpen || revealing;
  const sectionRef = useRef<HTMLElement>(null);
  useHeroChoreography(sectionRef, showHero);
  useImperativeHandle(ref, () => sectionRef.current!);
  useEffect(() => {
    const hero = sectionRef.current;
    if (!hero) return;
    // Safari toolbar expansion changes the visible height during a touch gesture.
    // Keep the hero/quiz boundary at its initial small-viewport position; only
    // recalculate when the viewport width (or orientation) actually changes.
    let width = window.innerWidth;
    const measure = () => {
      hero.style.removeProperty('--hero-stable-height');
      hero.style.setProperty('--hero-stable-height', getComputedStyle(hero).minHeight);
    };
    if (width < 768) measure();
    const onResize = () => {
      if (window.innerWidth === width) return;
      width = window.innerWidth;
      if (width < 768) measure();
      else hero.style.removeProperty('--hero-stable-height');
    };
    window.addEventListener('resize', onResize);
    return () => { window.removeEventListener('resize', onResize); hero.style.removeProperty('--hero-stable-height'); };
  }, []);

  return (
    <section ref={sectionRef} id="hero" tabIndex={-1} aria-labelledby="hero-title" data-home-experience="hero" data-managed-section-links data-nav-ready={navigationReady} className={cn('landing-hero oceanic-surface', styles.hero, className)}>
      <HeroBackground />
      <motion.div className="hero-container" data-hero-scroll>
        <div className="hero-copy">
           <p className="hero-eyebrow" data-hero-enter><span aria-hidden="true" /> {t('GESTÃO · ATENDIMENTO · PRESENÇA DIGITAL')}</p>
             <h1 id="hero-title" data-heading-static data-hero-enter className="hero-heading" aria-label={`${heroSentence[locale][0]} ${heroWords[locale][0]} ${heroSentence[locale][1]}`}>
               <span className="hero-title-line" aria-hidden="true">{heroSentence[locale][0]}</span>
               <TextType key={locale} text={heroWords[locale]} />
               <span className="hero-title-line" aria-hidden="true">{heroSentence[locale][1]}</span>
             </h1>
             <p className="hero-description" data-hero-enter>{t('Organize clientes, acompanhe vendas e cuide do financeiro. Da gestão à presença digital, encontre o próximo passo do seu negócio.')}</p>
           <div className="hero-actions" data-hero-enter>
              <ButtonWithIcon href={commercialHref(t(diagnosticMessage))} target="_blank" rel="noopener noreferrer" data-cta-section="hero" data-cta-solution="diagnostico">{t('Conversar sobre meu negócio')}</ButtonWithIcon>
              <a className="hero-secondary-action" href="#ecossistema" onClick={event => { event.preventDefault(); scrollToSection('#ecossistema'); }}>{t('Conhecer as soluções')}</a>
           </div>
        </div>
        <div className={styles.managementScene} data-avatar-scene>
          <div className={styles.glassCard} aria-hidden="true" data-hero-glass>
            <NavigationGlass variant="card" />
          </div>
          <div className={styles.avatarFrame} aria-hidden="true" data-avatar-stage data-avatar-figure>
            <Image
            className={styles.avatar}
            src="/images/avatars/Man_wearing_white_outfit_pose_2fae7479_2K.png"
            alt=""
            width={1084}
            height={1451}
            sizes="(max-width: 407px) calc(100vw - 48px), 360px"
            quality={90}
            preload
            />
          </div>
        </div>
      </motion.div>
    </section>
  );
});

export default Hero;
