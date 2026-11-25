'use client';

import { forwardRef, useEffect, useImperativeHandle, useRef, useSyncExternalStore } from 'react';
import ButtonWithIcon from './ui/button-witn-icon';
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
import { GlowingBadge } from './unlumen-ui/primitives/glowing-badge';
import { ShaderBackground } from './ui/simplex-noise-bubblegum';

const subscribeHydration = () => () => {};
const subscribeReducedMotion = (onChange: () => void) => {
  const media = window.matchMedia('(prefers-reduced-motion: reduce)');
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
};
const getReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const avatarWord = { pt: ['Pres', 'ença'], en: ['Pres', 'ence'], es: ['Pres', 'encia'] } as const;
const presenceColors: [number, number, number][] = [
  [1, 63 / 255, 159 / 255], [1, 116 / 255, 189 / 255],
  [1, 170 / 255, 216 / 255], [1, 116 / 255, 189 / 255], [1, 63 / 255, 159 / 255],
];
const heroSentence = {
  pt: ['Conectamos ', 'IA', ' ao seu negócio', 'e ampliamos seus ', 'resultados'],
  en: ['We connect ', 'AI', ' to your business', 'and grow your ', 'results'],
  es: ['Conectamos ', 'IA', ' a tu negocio', 'y ampliamos tus ', 'resultados'],
} as const;

export const Hero = forwardRef<HTMLElement, { className?: string }>(function Hero({ className = '' }, ref) {
  const { t, locale } = useLocale();
  const reducedMotion = useSyncExternalStore(subscribeReducedMotion, getReducedMotion, () => false);
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
           <p className={styles.eyebrow} data-hero-enter>
             <GlowingBadge variant="neutral" className={styles.eyebrowBadge} dotColor="#ff3f9f" glowColor="rgb(255 63 159 / 28%)">{t('GESTÃO · ATENDIMENTO · PRESENÇA DIGITAL')}</GlowingBadge>
           </p>
             <h1 id="hero-title" data-heading-static data-hero-enter className="hero-heading">
               <span className="hero-title-line">{heroSentence[locale][0]}<span className={styles.titleAccent}>{heroSentence[locale][1]}</span>{heroSentence[locale][2]}</span>{' '}
               <span className="hero-title-line">{heroSentence[locale][3]}<span className={styles.titleAccent}>{heroSentence[locale][4]}</span></span>
             </h1>
             <p className="hero-description" data-hero-enter>{t('Organize clientes, acompanhe vendas e cuide do financeiro. Da gestão à presença digital, encontre o próximo passo do seu negócio.')}</p>
           <div className="hero-actions" data-hero-enter>
              <ButtonWithIcon href={commercialHref(t(diagnosticMessage))} target="_blank" rel="noopener noreferrer" data-cta-section="hero" data-cta-solution="diagnostico">{t('Conversar sobre meu negócio')}</ButtonWithIcon>
              <a className="hero-secondary-action" href="#ecossistema" onClick={event => { event.preventDefault(); scrollToSection('#ecossistema'); }}>{t('Conhecer as soluções')}</a>
           </div>
        </div>
        <div className={styles.managementScene} data-avatar-scene>
          <span
            className={styles.avatarWord}
            data-avatar-word
            role="img"
            aria-label={avatarWord[locale].join('')}
            data-reduced-motion={reducedMotion}
          ><span className={styles.presenceShape} data-presence-shape><span data-shader-text data-presence-half="left" aria-hidden="true">{avatarWord[locale][0]}</span><span data-shader-text data-presence-half="right" aria-hidden="true">{avatarWord[locale][1]}</span>
            <ShaderBackground key={locale} className={styles.presenceShader} colors={presenceColors} textMask paused={!showHero} />
            </span>
          </span>
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
      <div className={styles.sectionFade} aria-hidden="true" />
    </section>
  );
});

export default Hero;
