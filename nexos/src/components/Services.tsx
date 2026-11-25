'use client';

import { scheduleScrollRefresh } from '@/lib/schedule-scroll-refresh';

import { ScrollFillText } from './ui/scroll-fill-headline';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { GradientWave } from './ui/gradient-wave';
import { usePrefersReducedMotion } from '@/lib/use-prefers-reduced-motion';
import { isEmbeddedBrowser } from '@/lib/scroll-profile';
import { useLocale } from '@/lib/locale';
import { usePresentationActive } from '@/lib/use-presentation-active';
import { motionError, recordMotion } from '@/lib/motion-diagnostics';
import siteArtwork from '../../design-/rebrand-nexos/nfcs/CONTEXT-AI-VIDEOS/imgg1.png';
import styles from './DigitalSolutions.module.css';

// Pink from BrandMark's way, with lighter and deeper tones of the same hue.
const waveColors = ['#ff3f9f', '#ffb8db', '#e92387', '#ff70b7'] as const;

const examples = [
  { id: 'menu', title: 'Cardápio digital', description: 'Itens e informações que o cliente pode consultar no próprio celular.', image: '/ezway-demo-cafe.jpg' },
  { id: 'portfolio', title: 'Portfólio', description: 'Trabalhos apresentados com contexto e um caminho para o contato.', image: siteArtwork },
  { id: 'site', title: 'Site vitrine', description: 'Sua marca, seus serviços e formas de contato em um só lugar.', image: '/ezway-demo-studio.jpg' },
  { id: 'landing', title: 'Landing page', description: 'Uma página dedicada para apresentar uma oferta com clareza.', image: '/ezway-demo-cafe.jpg' },
] as const;

export function Services({ className = '', selectedUse }: { className?: string; selectedUse?: string }) {
  const { t } = useLocale();
  const ref = useRef<HTMLElement>(null);
  const screenRef = useRef<HTMLDivElement>(null);
  const selectExampleRef = useRef<((index: number) => void) | null>(null);
  const [active, setActive] = useState(0);
  const reducedMotion = usePrefersReducedMotion();
  const presenting = usePresentationActive();

  useEffect(() => {
    const root = ref.current;
    const stage = root?.firstElementChild;
    if (!root || !stage) return;
    let width = window.innerWidth;
    const measure = () => {
      root.style.removeProperty('--journey-viewport-height');
      root.style.setProperty('--journey-viewport-height', getComputedStyle(stage).height);
    };
    const touch = matchMedia('(pointer: coarse)').matches || isEmbeddedBrowser(navigator.userAgent);
    if (touch) measure();
    const onResize = () => {
      if (window.innerWidth === width) return;
      width = window.innerWidth;
      if (touch) measure();
      else root.style.removeProperty('--journey-viewport-height');
    };
    window.addEventListener('resize', onResize);
    return () => { window.removeEventListener('resize', onResize); root.style.removeProperty('--journey-viewport-height'); };
  }, []);

  useEffect(() => {
    if (presenting) { recordMotion('servicesGsap', 'waiting-presentation'); return; }
    if (reducedMotion || !ref.current) {
      recordMotion('servicesGsap', reducedMotion ? 'blocked-reduced-motion' : 'missing-root');
      return;
    }
    recordMotion('servicesGsap', 'loading');
    let disposed = false;
    let cleanup = () => {};
    void Promise.all([import('gsap'), import('gsap/ScrollTrigger')]).then(([{ gsap }, { ScrollTrigger }]) => {
      const root = ref.current;
      if (disposed || !root) return;
      gsap.registerPlugin(ScrollTrigger);
      const stage = root.querySelector<HTMLElement>('[data-services-journey]')!;
      const slides = [...(screenRef.current?.querySelectorAll<HTMLElement>('[data-macbook-slide]') ?? [])];
      const state = { progress: 0 };
      const tokens = getComputedStyle(root);
      const pageDistance = parseFloat(tokens.getPropertyValue('--page-slide-distance')) || 8;
      const pageBlur = parseFloat(tokens.getPropertyValue('--page-blur')) || 3;
      let manualBoundary: number | null = null;
      let lastActive = -1;
      let readScrollProgress = () => state.progress;
      let paintedProgress = 0;
      let manualTween: ReturnType<typeof gsap.to> | undefined;
      const paint = (progress: number) => {
        paintedProgress = Math.max(0, Math.min(1, progress));
        const position = paintedProgress * (examples.length - 1);
        const current = Math.min(examples.length - 1, Math.floor(position));
        // Hold each screen long enough to read, then blend with zero velocity
        // at both ends. The opaque lower layer prevents a brightness dip.
        const hold = .24;
        const fraction = Math.max(0, Math.min(1, (position - current - hold) / (1 - hold)));
        const blend = fraction * fraction * (3 - 2 * fraction);
        slides.forEach((slide, index) => {
          const incoming = index === current + 1;
          const outgoing = index === current;
          const amount = incoming ? 1 - blend : outgoing ? blend : 1;
          slide.style.opacity = incoming ? String(blend) : outgoing ? String(1 - blend) : '0';
          slide.style.transform = `translate3d(${(incoming ? 1 : -1) * amount * pageDistance}px, 0, 0)`;
          slide.style.filter = amount ? `blur(${amount * pageBlur}px)` : 'none';
        });
        const focus = Math.min(examples.length - 1, current + (blend >= .5 ? 1 : 0));
        if (focus !== lastActive) { lastActive = focus; setActive(focus); }
      };
      const follow = () => {
        const chapter = Math.round(readScrollProgress() * (examples.length - 1));
        if (manualBoundary === chapter) return;
        manualTween?.kill();
        manualBoundary = null;
        paint(state.progress);
      };
      const context = gsap.context(() => {
        const animation = gsap.fromTo(state, { progress: 0 }, {
          progress: 1, ease: 'none', onUpdate: follow,
          scrollTrigger: {
            id: 'services-screens', trigger: root, start: 'top top',
            end: () => `+=${Math.max(1, root.offsetHeight - stage.offsetHeight)}`,
            scrub: .85, invalidateOnRefresh: true,
            onRefresh: self => { state.progress = self.progress; follow(); root.dataset.artworkFocus = String(self.isActive); },
            onToggle: self => { root.dataset.artworkFocus = String(self.isActive); },
          },
        });
        readScrollProgress = () => animation.scrollTrigger?.progress ?? state.progress;
      }, root);
      selectExampleRef.current = index => {
        manualTween?.kill();
        manualBoundary = Math.round(readScrollProgress() * (examples.length - 1));
        const selection = { progress: paintedProgress };
        manualTween = gsap.to(selection, { progress: index / (examples.length - 1), duration: .85, ease: 'power2.inOut', onUpdate: () => paint(selection.progress) });
      };
      paint(state.progress);
      root.dataset.screenTransition = 'ready';
      scheduleScrollRefresh(ScrollTrigger);
      void document.fonts.ready.then(() => { if (!disposed) scheduleScrollRefresh(ScrollTrigger); });
      recordMotion('servicesGsap', 'initialized');
      cleanup = () => {
        selectExampleRef.current = null;
        manualTween?.kill();
        context.revert();
        slides.forEach(slide => { slide.style.removeProperty('opacity'); slide.style.removeProperty('transform'); slide.style.removeProperty('filter'); });
        delete root.dataset.artworkFocus;
        delete root.dataset.screenTransition;
      };
    }).catch(error => {
      if (!disposed) recordMotion('servicesGsap', 'initialization-error', motionError(error));
    });
    return () => { disposed = true; cleanup(); };
  }, [reducedMotion, presenting]);

  return <section ref={ref} id="services" aria-labelledby="services-title" className={`${styles.journey} ${className}`}>
    <div className={`${styles.stage} ${styles.fixedStage}`} data-services-journey>
      <GradientWave className={styles.waveBackground} colors={waveColors} isPlaying={!presenting} noiseSpeed={.000008} noiseFrequency={[.00015, .0006]} deform={{ incline: .12, noiseAmp: 180, noiseFlow: 3 }} />
      <h2 data-heading-static data-scroll-fill-heading id="services-title" className={styles.journeyTitle}><ScrollFillText lines={[t('Sites, cardápios e páginas para o seu negócio.')]} /></h2>
      <div className={styles.fixedDevice} data-macbook-chassis>
        <div className={styles.device}>
          {/* Original chassis remains fixed while the screen contents change. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className={styles.macbookFrame} src="/mackbook_1.svg" alt="" width={2180} height={1324} draggable={false} />
          <div ref={screenRef} className={`t-page-slide ${styles.macbookScreen}`} data-scroll-driven>
            {examples.map((example, index) => <div key={example.id} className={`t-page ${styles.screenSlide}`} data-macbook-slide data-active={active === index} aria-hidden={active !== index}>
              {index === 0 ? <div className={styles.menuDemo}><div className={styles.demoNav}><strong>grão & casa</strong><span>{t('Cardápio digital')}</span></div><div className={styles.menuHero}><Image src={example.image} alt="" fill sizes="(max-width: 767px) 90vw, 720px" className={styles.screenImage} /><strong>{t('Uma pausa para o seu dia.')}</strong></div><div className={styles.menuItems}><h3 data-heading-static>{t('Cafés da casa')}</h3><p>{t('Café coado')} · {t('Cappuccino')} · {t('Espresso')}</p><span>{t('Itens e informações que o cliente pode consultar no próprio celular.')}</span></div></div> : index === 1 ? <Image src={example.image} alt={t(example.title)} fill sizes="(max-width: 767px) 90vw, 720px" quality={90} className={styles.screenImage} /> :
                <div className={`${styles.demoScreen} ${index === 3 ? styles.demoLanding : ''}`}>
                  <div className={styles.demoNav}><span>{index === 2 ? 'atelier espaço' : 'grão & casa'}</span><span>{t(index === 2 ? 'Estúdio  /  Projetos  /  Contato' : 'Cafés  /  Sobre  /  Contato')}</span></div>
                  <div className={styles.demoPhoto}><Image src={example.image} alt={t(example.title)} fill sizes="(max-width: 767px) 90vw, 720px" quality={90} className={styles.screenImage} /></div>
                  <div className={styles.demoCopy}><strong>{t(index === 2 ? 'Espaços feitos para viver.' : 'Uma pausa para o seu dia.')}</strong><span>{t(index === 2 ? 'Arquitetura e interiores' : 'Café de bairro')}</span></div>
                </div>}
            </div>)}
            <div className={styles.notch} aria-hidden="true" />
          </div>
        </div>
      </div>
      <div className={styles.arcBottom}>
        <div className={styles.arcCaption} aria-live="polite"><span>{String(active + 1).padStart(2, '0')} / 04</span><h3 data-heading-static>{t(examples[active].title)}</h3><p>{t(examples[active].description)}</p></div>
        <div className={styles.exampleLinks}>{examples.map((example, index) => <button key={example.id} type="button" aria-label={`${index + 1} ${t('Ver solução')}: ${t(example.title)}`} aria-pressed={active === index} onClick={() => {
          if (reducedMotion) { setActive(index); return; }
          selectExampleRef.current?.(index);
        }}><span aria-hidden="true">{index + 1}</span></button>)}</div>
      </div>
    </div>
    <div className={styles.steps} aria-hidden="true">{examples.map(example => <div key={example.id} />)}</div>
    {selectedUse ? <p className="sr-only">{t('Solução selecionada')}: {t(selectedUse)}</p> : null}
  </section>;
}
