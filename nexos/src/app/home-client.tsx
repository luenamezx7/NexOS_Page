'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { Header } from '@/components/Header';
import { Hero } from '@/components/Hero';
import { ProductShowcase } from '@/components/ProductShowcase';
import { SectionIndicator } from '@/components/SectionIndicator';
import WavesEntrance from '@/components/WavesEntrance';
import { usePresentationVisit } from '@/components/PresentationVisitProvider';

// Split client bundles while keeping commercial content in the server HTML.
const Services = dynamic(() => import('@/components/Services').then(m => m.Services));
const Testimonials = dynamic(() => import('@/components/Testimonials').then(m => m.Testimonials));
const FAQ = dynamic(() => import('@/components/FAQ').then(m => m.FAQ));
const Contact = dynamic(() => import('@/components/Contact').then(m => m.Contact));
const Footer = dynamic(() => import('@/components/Footer').then(m => m.Footer));

export default function HomeClient() {
  const { eligible, consume } = usePresentationVisit();
  // The entry is visual only: all commercial sections remain in the initial HTML.
  const [entrance, setEntrance] = useState({ visible: eligible, replay: false, key: 0 });
  const entranceGeneration = useRef(0);
  const heroRef = useRef<HTMLElement>(null);
  const focusRaf = useRef(0);

  const replayPresentation = useCallback(() => {
    cancelAnimationFrame(focusRaf.current);
    entranceGeneration.current += 1;
    setEntrance({ visible: true, replay: true, key: entranceGeneration.current });
  }, []);

  const handleEntranceComplete = useCallback((entered: boolean) => {
    // A pending skip/exit from an older presentation must not close a fresh replay.
    if (entrance.key !== entranceGeneration.current) return;
    setEntrance({ visible: false, replay: false, key: entrance.key });
    if (!entered) return;
    focusRaf.current = requestAnimationFrame(() => {
      heroRef.current?.focus({ preventScroll: true });
    });
  }, [entrance.key]);

  useEffect(() => () => cancelAnimationFrame(focusRaf.current), []);
  useEffect(() => { consume(); }, [consume]);

  return (
    <main className="landing-page w-full max-w-full overflow-x-clip bg-canvas text-ink">
      {entrance.visible && <WavesEntrance key={entrance.key} replay={entrance.replay} onComplete={handleEntranceComplete} />}
      <div>
        <a href="#main-content" className="skip-link">Pular para o conteúdo</a>
        <Header />
        <SectionIndicator />
        <div className="relative">
          <div id="main-content" tabIndex={-1} className="relative">
            <Hero ref={heroRef} />
            <ProductShowcase />
            <Services />
            <Testimonials />
            <FAQ />
            <Contact />
          </div>
          <Footer onViewPresentation={replayPresentation} />
        </div>
      </div>
    </main>
  );
}
