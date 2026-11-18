'use client';

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

const waveColors = ['#f8f8fa', '#ffe2f1', '#d1c5f1', '#ffaad8'] as const;

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
      let manualBoundary: number | null = null;
      let lastActive = -1;
      let readScrollProgress = () => state.progress;
      const paint = (progress: number) => {
        const position = progress * (examples.length - 1);
        slides.forEach((slide, index) => {
          slide.style.opacity = String(Math.max(0, 1 - Math.abs(index - position)));
          slide.style.removeProperty('transform');
        });
        const focus = Math.round(position);
        if (focus !== lastActive) { lastActive = focus; setActive(focus); }
      };
      const follow = () => {
        const chapter = Math.round(readScrollProgress() * (examples.length - 1));
        if (manualBoundary === chapter) return;
        manualBoundary = null;
        paint(state.progress);
      };
      const context = gsap.context(() => {
        const animation = gsap.fromTo(state, { progress: 0 }, {
          progress: 1, ease: 'none', onUpdate: follow,
          scrollTrigger: {
            id: 'services-screens', trigger: root, start: 'top top',
            end: () => `+=${Math.max(1, root.offsetHeight - stage.offsetHeight)}`,
            scrub: .25, invalidateOnRefresh: true,
            onRefresh: self => { state.progress = self.progress; follow(); root.dataset.artworkFocus = String(self.isActive); },
            onToggle: self => { root.dataset.artworkFocus = String(self.isActive); },
          },
        });
        readScrollProgress = () => animation.scrollTrigger?.progress ?? state.progress;
      }, root);
      selectExampleRef.current = index => {
        manualBoundary = Math.round(readScrollProgress() * (examples.length - 1));
        paint(index / (examples.length - 1));
      };
      paint(state.progress);
      ScrollTrigger.refresh();
      void document.fonts.ready.then(() => { if (!disposed) ScrollTrigger.refresh(); });
      recordMotion('servicesGsap', 'initialized');
      cleanup = () => {
        selectExampleRef.current = null;
        context.revert();
        slides.forEach(slide => { slide.style.removeProperty('opacity'); slide.style.removeProperty('transform'); });
        delete root.dataset.artworkFocus;
      };
    }).catch(error => {
      if (!disposed) recordMotion('servicesGsap', 'initialization-error', motionError(error));
    });
    return () => { disposed = true; cleanup(); };
  }, [reducedMotion, presenting]);

  return <section ref={ref} id="services" aria-labelledby="services-title" className={`${styles.journey} ${className}`}>
    <div className={`${styles.stage} ${styles.fixedStage}`} data-services-journey>
      <GradientWave className={styles.waveBackground} colors={waveColors} isPlaying={!presenting} noiseSpeed={.000008} noiseFrequency={[.00015, .0006]} deform={{ incline: .12, noiseAmp: 180, noiseFlow: 3 }} />
      <h2 data-heading-static id="services-title" className={styles.journeyTitle}>{t('Sites, cardápios e páginas para o seu negócio.')}</h2>
      <div className={styles.fixedDevice} data-macbook-chassis>
        <div className={styles.device}>
          {/* Original chassis remains fixed while the screen contents change. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className={styles.macbookFrame} src="/mackbook_1.svg" alt="" width={2180} height={1324} draggable={false} />
          <div ref={screenRef} className={styles.macbookScreen}>
            {examples.map((example, index) => <div key={example.id} className={styles.screenSlide} data-macbook-slide data-active={active === index} aria-hidden={active !== index}>
              {index === 0 ? <div className={styles.menuDemo}><div className={styles.demoNav}><strong>grão & casa</strong><span>{t('Cardápio digital')}</span></div><div className={styles.menuHero}><Image src={example.image} alt="" fill sizes="(max-width: 767px) 90vw, 720px" className={styles.screenImage} /><strong>{t('Uma pausa para o seu dia.')}</strong></div><div className={styles.menuItems}><h4 data-heading-static>{t('Cafés da casa')}</h4><p>{t('Café coado')} · {t('Cappuccino')} · {t('Espresso')}</p><span>{t('Itens e informações que o cliente pode consultar no próprio celular.')}</span></div></div> : index === 1 ? <Image src={example.image} alt={t(example.title)} fill sizes="(max-width: 767px) 90vw, 720px" quality={90} className={styles.screenImage} /> :
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
        <div className={styles.exampleLinks}>{examples.map((example, index) => <button key={example.id} type="button" aria-label={`${t('Ver solução')}: ${t(example.title)}`} aria-pressed={active === index} onClick={() => {
          if (reducedMotion) { setActive(index); return; }
          selectExampleRef.current?.(index);
        }}>{index + 1}</button>)}</div>
      </div>
    </div>
    <div className={styles.steps} aria-hidden="true">{examples.map(example => <div key={example.id} />)}</div>
    {selectedUse ? <p className="sr-only">{t('Solução selecionada')}: {t(selectedUse)}</p> : null}
  </section>;
}
