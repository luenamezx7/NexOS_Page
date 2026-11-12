'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { usePrefersReducedMotion } from '@/lib/use-prefers-reduced-motion';
import { useLocale } from '@/lib/locale';
import siteArtwork from '../../design-/rebrand-nexos/nfcs/CONTEXT-AI-VIDEOS/imgg1.png';
import menuArtwork from '../../design-/rebrand-nexos/nfcs/CONTEXT-AI-VIDEOS/imgg2.png';
import styles from './DigitalSolutions.module.css';
import { WarpCarousel, type WarpCarouselHandle } from './ui/warp-carousel';

const examples = [
  { id: 'menu', title: 'Cardápio digital', description: 'Itens e informações que o cliente pode consultar no próprio celular.', image: menuArtwork },
  { id: 'portfolio', title: 'Portfólio', description: 'Trabalhos apresentados com contexto e um caminho para o contato.', image: siteArtwork },
  { id: 'site', title: 'Site vitrine', description: 'Sua marca, seus serviços e formas de contato em um só lugar.', image: '/ezway-demo-studio.jpg' },
  { id: 'landing', title: 'Landing page', description: 'Uma página dedicada para apresentar uma oferta com clareza.', image: '/ezway-demo-cafe.jpg' },
] as const;

export function Services({ className = '', selectedUse }: { className?: string; selectedUse?: string }) {
  const { t } = useLocale();
  const ref = useRef<HTMLElement>(null);
  const ringRef = useRef<WarpCarouselHandle>(null);
  const [active, setActive] = useState(0);
  const reducedMotion = usePrefersReducedMotion();

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
    if (reducedMotion || !ref.current) return;
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
      const paint = (progress: number) => {
        ringRef.current?.paint(progress * (count - 1));
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
    });
    return () => { disposed = true; cleanup(); };
  }, [reducedMotion]);

  return <section ref={ref} id="services" aria-labelledby="services-title" className={`${styles.journey} ${className}`}>
    <WarpCarousel className={styles.stage} ariaLabel={t('Demonstrações de soluções digitais')} ringRef={ringRef}
      cards={examples.map((example, index) => <div key={example.id} className={styles.deviceSlot} data-arc-device data-warp-card={index} data-active={active === index} aria-hidden={reducedMotion ? undefined : active !== index}>
        <div className={styles.device}>
          {/* Device frame exported from the existing Figma asset. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className={styles.macbookFrame} src="/mackbook_1.svg" alt="" width={2180} height={1324} draggable={false} />
          <div className={styles.macbookScreen}>
            {index < 2 ? <Image src={example.image} alt="" fill sizes="(max-width: 767px) 90vw, 720px" quality={85} className={styles.screenImage} /> :
              <div className={`${styles.demoScreen} ${index === 3 ? styles.demoLanding : ''}`}>
                <div className={styles.demoNav}><span>{index === 2 ? 'atelier espaço' : 'grão & casa'}</span><span>{index === 2 ? 'Estúdio  /  Projetos  /  Contato' : 'Cafés  /  Sobre  /  Contato'}</span></div>
                <div className={styles.demoPhoto}><Image src={example.image} alt="" fill sizes="(max-width: 767px) 90vw, 720px" className={styles.screenImage} /></div>
                <div className={styles.demoCopy}><strong>{index === 2 ? 'Espaços feitos para viver.' : 'Uma pausa para o seu dia.'}</strong><span>{index === 2 ? 'Arquitetura e interiores' : 'Café de bairro'}</span></div>
              </div>}
            <div className={styles.notch} aria-hidden="true" />
          </div>
        </div>
        <p className={styles.staticCaption}>{t(example.title)}<span>{t(example.description)}</span></p>
      </div>)}>
      <h2 id="services-title" className={styles.journeyTitle}>{t('Sites, cardápios e páginas para o seu negócio.')}</h2>
      <div className={styles.arcBottom}>
        <div className={styles.arcCaption} aria-live="polite"><span>{t('Exemplo ilustrativo')} {String(active + 1).padStart(2, '0')} / 04</span><h3>{t(examples[active].title)}</h3><p>{t(examples[active].description)}</p></div>
      </div>
    </WarpCarousel>
    <div className={styles.steps} aria-hidden="true">{examples.map(example => <div key={example.id} />)}</div>
    {selectedUse ? <p className="sr-only">{t('Solução selecionada')}: {t(selectedUse)}</p> : null}
  </section>;
}
