'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useLocale } from '@/lib/locale';
import siteArtwork from '../../design-/rebrand-nexos/nfcs/CONTEXT-AI-VIDEOS/imgg1.png';
import menuArtwork from '../../design-/rebrand-nexos/nfcs/CONTEXT-AI-VIDEOS/imgg2.png';
import styles from './DigitalSolutions.module.css';

const artworks = [
  { image: siteArtwork, alt: 'Site ilustrativo de arquitetura' },
  { image: menuArtwork, alt: 'Cardápio ilustrativo de cafeteria' },
] as const;

export function Services({ className = '' }: { className?: string; selectedUse?: string }) {
  const { t } = useLocale();
  const ref = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  const [motionReady, setMotionReady] = useState(false);
  const [artworkFocus, setArtworkFocus] = useState(false);

  useEffect(() => {
    let disposed = false;
    let cleanup = () => {};
    void Promise.all([import('gsap'), import('gsap/ScrollTrigger')]).then(([{ gsap }, { ScrollTrigger }]) => {
      if (disposed || !ref.current) return;
      gsap.registerPlugin(ScrollTrigger);
      const mm = gsap.matchMedia();
      mm.add('(min-width: 0px)', () => {
        const journey = ref.current?.querySelector<HTMLElement>('[data-services-journey]');
        const device = ref.current?.querySelector<HTMLElement>('[data-macbook-motion]');
        const slides = ref.current?.querySelectorAll<HTMLElement>('[data-macbook-slide]');
        if (!journey || !device || !slides || slides.length !== artworks.length) return;
        setMotionReady(true);

        const update = (progress: number, isActive: boolean) => {
          setActive(progress < .5 ? 0 : 1);
          setArtworkFocus(isActive);
        };
        const trigger = {
          trigger: journey,
          start: 'top top',
          end: 'bottom bottom',
          invalidateOnRefresh: true,
          onUpdate: (self: { progress: number; isActive: boolean }) => update(self.progress, self.isActive),
          onEnter: () => setArtworkFocus(true),
          onEnterBack: () => setArtworkFocus(true),
          onLeave: () => setArtworkFocus(false),
          onLeaveBack: () => setArtworkFocus(false),
        };

        if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
          const scroll = ScrollTrigger.create(trigger);
          requestAnimationFrame(() => ScrollTrigger.refresh());
          return () => { scroll.kill(); setMotionReady(false); setArtworkFocus(false); };
        }

        const timeline = gsap.timeline({ scrollTrigger: { ...trigger, scrub: true } });
        timeline.fromTo(device, { y: 32 }, { y: -18, ease: 'none', duration: 1 }, 0)
          .fromTo(slides[0], { xPercent: 0 }, { xPercent: -100, ease: 'none', duration: .44 }, .28)
          .fromTo(slides[1], { xPercent: 100 }, { xPercent: 0, ease: 'none', duration: .44 }, .28);
        requestAnimationFrame(() => ScrollTrigger.refresh());
        return () => { timeline.scrollTrigger?.kill(); timeline.kill(); setMotionReady(false); setArtworkFocus(false); };
      });
      cleanup = () => mm.revert();
    });
    return () => { disposed = true; cleanup(); };
  }, []);

  return <section ref={ref} id="services" aria-labelledby="services-title" data-artwork-focus={artworkFocus} className={`${styles.journey} ${className}`}>
    <div className={styles.journeyContainer}>
      <div className={styles.journeyGrid} data-services-journey data-motion-ready={motionReady}>
        <div className={styles.stage} data-journey-visual>
          <div className={styles.macbook}>
            <div className={styles.macbookMotion} data-macbook-motion>
              <h2 id="services-title" className={styles.journeyTitle}>{t('Sites para seu negócio, cardápios ou vídeos com IA?')}</h2>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className={styles.macbookFrame} src="/mackbook_1.svg" alt="" width={2180} height={1324} draggable={false} aria-hidden="true" />
              <div className={styles.macbookScreen} data-macbook-screen>
                {artworks.map((artwork, index) => <div key={artwork.alt} className={styles.macbookSlide} data-macbook-slide data-active={index === active} aria-hidden={index !== active}>
                  <Image src={artwork.image} alt={t(artwork.alt)} fill sizes="(max-width: 767px) 80vw, 720px" quality={90} loading="eager" style={{ objectFit: 'cover' }} />
                </div>)}
              </div>
            </div>
          </div>
        </div>
        <div className={styles.steps} aria-hidden="true"><div /><div /></div>
      </div>
    </div>
  </section>;
}
