'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { usePrefersReducedMotion } from '@/lib/use-prefers-reduced-motion';
import { useLocale } from '@/lib/locale';
import { useScrollContext } from './SmoothScrollProvider';
import { usePresentationActive } from '@/lib/use-presentation-active';
import { motionError, recordMotion } from '@/lib/motion-diagnostics';
import siteArtwork from '../../design-/rebrand-nexos/nfcs/CONTEXT-AI-VIDEOS/imgg1.png';
import menuArtwork from '../../design-/rebrand-nexos/nfcs/CONTEXT-AI-VIDEOS/imgg2.png';
import styles from './DigitalSolutions.module.css';

const examples = [
  { id: 'menu', title: 'Cardápio digital', description: 'Itens e informações que o cliente pode consultar no próprio celular.', image: menuArtwork },
  { id: 'portfolio', title: 'Portfólio', description: 'Trabalhos apresentados com contexto e um caminho para o contato.', image: siteArtwork },
  { id: 'site', title: 'Site vitrine', description: 'Sua marca, seus serviços e formas de contato em um só lugar.', image: '/ezway-demo-studio.jpg' },
  { id: 'landing', title: 'Landing page', description: 'Uma página dedicada para apresentar uma oferta com clareza.', image: '/ezway-demo-cafe.jpg' },
] as const;

export function Services({ className = '', selectedUse }: { className?: string; selectedUse?: string }) {
  const { t } = useLocale();
  const { lenis } = useScrollContext();
  const ref = useRef<HTMLElement>(null);
  const screenRef = useRef<HTMLDivElement>(null);
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
    if (width < 768) measure();
    const onResize = () => {
      if (window.innerWidth === width) return;
      width = window.innerWidth;
      if (width < 768) measure();
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
    void import('gsap/ScrollTrigger').then(({ ScrollTrigger }) => {
      if (disposed || !ref.current) return;
      const root = ref.current;
      // Safari's address bar resizes the visual viewport without changing layout width.
      ScrollTrigger.config({ ignoreMobileResize: true });
      const count = examples.length;
      let target = 0;
      let position = 0;
      let frame = 0;
      let lastTime = 0;
      const slides = [...(screenRef.current?.querySelectorAll<HTMLElement>('[data-macbook-slide]') ?? [])];
      const paint = (progress: number) => {
        const position = progress * (count - 1);
        slides.forEach((slide, index) => {
          const delta = index - position;
          const opacity = Math.max(0, 1 - Math.abs(delta));
          // Crossfade only the screen; camera, chassis and crop never change.
          slide.style.opacity = String(opacity);
          slide.style.transform = `translate3d(${Math.max(-12, Math.min(12, delta * 12))}px, 0, 0)`;
        });
        const focus = Math.round(progress * (count - 1));
        setActive(current => (focus === current ? current : focus));
      };
      const settle = (time: number) => {
        const elapsed = lastTime ? Math.min(time - lastTime, 64) : 16;
        lastTime = time;
        position += (target - position) * (1 - Math.exp(-elapsed / 175));
        if (Math.abs(target - position) < .0004) {
          position = target;
          frame = 0;
          lastTime = 0;
          paint(position);
          return;
        }
        paint(position);
        frame = requestAnimationFrame(settle);
      };
      const follow = (progress: number) => {
        target = progress;
        if (!frame) frame = requestAnimationFrame(settle);
      };
      const trigger = ScrollTrigger.create({
        trigger: root, start: 'top top', end: 'bottom bottom', invalidateOnRefresh: true,
        onUpdate: self => follow(self.progress),
        onRefresh: self => { target = position = self.progress; cancelAnimationFrame(frame); frame = 0; lastTime = 0; paint(position); root.dataset.artworkFocus = String(self.isActive); },
        onEnter: () => { root.dataset.artworkFocus = 'true'; },
        onEnterBack: () => { root.dataset.artworkFocus = 'true'; },
        onLeave: () => { root.dataset.artworkFocus = 'false'; },
        onLeaveBack: () => { root.dataset.artworkFocus = 'false'; },
      });
      root.dataset.artworkFocus = String(trigger.isActive);
      recordMotion('servicesGsap', 'initialized');
      const refresh = () => ScrollTrigger.refresh();
      document.fonts.ready.then(() => { if (!disposed) refresh(); });
      let viewportWidth = window.innerWidth;
      const onResize = () => {
        if (window.innerWidth === viewportWidth) return;
        viewportWidth = window.innerWidth;
        refresh();
      };
      window.addEventListener('resize', onResize);
      target = position = trigger.progress;
      paint(position);
      cleanup = () => { window.removeEventListener('resize', onResize); cancelAnimationFrame(frame); trigger.kill(); delete root.dataset.artworkFocus; };
    }).catch(error => {
      if (!disposed) recordMotion('servicesGsap', 'initialization-error', motionError(error));
    });
    return () => { disposed = true; cleanup(); };
  }, [reducedMotion, presenting]);

  return <section ref={ref} id="services" aria-labelledby="services-title" className={`${styles.journey} ${className}`}>
    <div className={`${styles.stage} ${styles.fixedStage}`} data-services-journey>
      <h2 id="services-title" className={styles.journeyTitle}>{t('Sites, cardápios e páginas para o seu negócio.')}</h2>
      <div className={styles.fixedDevice} data-macbook-chassis>
        <div className={styles.device}>
          {/* Original chassis remains fixed while the screen contents change. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className={styles.macbookFrame} src="/mackbook_1.svg" alt="" width={2180} height={1324} draggable={false} />
          <div ref={screenRef} className={styles.macbookScreen}>
            {examples.map((example, index) => <div key={example.id} className={styles.screenSlide} data-macbook-slide data-active={active === index} aria-hidden={active !== index}>
              {index < 2 ? <Image src={example.image} alt={t(example.title)} fill sizes="(max-width: 767px) 90vw, 720px" quality={90} className={styles.screenImage} /> :
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
        <div className={styles.arcCaption} aria-live="polite"><span>{t('Exemplo ilustrativo')} {String(active + 1).padStart(2, '0')} / 04</span><h3>{t(examples[active].title)}</h3><p>{t(examples[active].description)}</p></div>
        <div className={styles.exampleLinks}>{examples.map((example, index) => <button key={example.id} type="button" aria-label={`${t('Ver exemplo')}: ${t(example.title)}`} aria-pressed={active === index} onClick={() => {
          const root = ref.current;
          if (!root) return;
          const distance = Math.max(0, root.offsetHeight - innerHeight);
          if (reducedMotion) { setActive(index); return; }
          const top = root.getBoundingClientRect().top + scrollY + distance * index / 3;
          if (lenis) lenis.scrollTo(top, { duration: .65 });
          else window.scrollTo({ top, behavior: 'smooth' });
        }}>{index + 1}</button>)}</div>
      </div>
    </div>
    <div className={styles.steps} aria-hidden="true">{examples.map(example => <div key={example.id} />)}</div>
    {selectedUse ? <p className="sr-only">{t('Solução selecionada')}: {t(selectedUse)}</p> : null}
  </section>;
}
