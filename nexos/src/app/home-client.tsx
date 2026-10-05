'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { Header } from '@/components/Header';
import { Hero } from '@/components/Hero';
import { ProductShowcase } from '@/components/ProductShowcase';
import { SectionIndicator } from '@/components/SectionIndicator';
import { Slipstream } from '@/components/ui/background-ascii-flow';
import { ArrowDown } from 'lucide-react';
import { CloudSky } from '@/components/SiteAtmosphere';

// Split client bundles while keeping commercial content in the server HTML.
const Services = dynamic(() => import('@/components/Services').then(m => m.Services));
const Testimonials = dynamic(() => import('@/components/Testimonials').then(m => m.Testimonials));
const FAQ = dynamic(() => import('@/components/FAQ').then(m => m.FAQ));
const Contact = dynamic(() => import('@/components/Contact').then(m => m.Contact));
const Footer = dynamic(() => import('@/components/Footer').then(m => m.Footer));
const BrandEntrance = dynamic(() => import('@/components/BrandEntrance'), { ssr: false });


type Stage = 'intro' | 'brand' | 'main';

const FLUID_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

interface IntroSectionProps {
  onComplete: () => void;
}

function IntroSection({ onComplete }: IntroSectionProps) {
  const reduce = useReducedMotion() ?? false;
  const completedRef = useRef<boolean>(false);

  const finish = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    onComplete();
  }, [onComplete]);

  useEffect(() => {
    const onWheel = (e: WheelEvent): void => {
      if (Math.abs(e.deltaY) > 12 || Math.abs(e.deltaX) > 12) {
        e.preventDefault();
        finish();
      }
    };
    const onTouchMove = (e: TouchEvent): void => {
      e.preventDefault();
      finish();
    };
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === ' ' || e.key === 'ArrowDown' || e.key === 'Enter' || e.key === 'PageDown') {
        e.preventDefault();
        finish();
      }
    };

    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('keydown', onKey);
    };
  }, [finish]);

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label="Apresentação NexOS — role para entrar"
      exit={reduce ? { opacity: 0 } : { opacity: 0, y: -32, scale: 0.985 }}
      transition={{ duration: reduce ? 0.15 : 0.65, ease: FLUID_EASE }}
      className="fixed inset-0 z-[900] flex min-h-dvh flex-col justify-center overflow-hidden overflow-x-clip bg-canvas will-change-transform"
    >
      <CloudSky />
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <Slipstream className="intro-flow" cellSize={16} />
      </div>
      <div className="grid-pattern-subtle opacity-80 dark:opacity-10" aria-hidden="true" />

      <motion.div
        initial={false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: FLUID_EASE }}
        className="absolute inset-x-0 top-[16%] bottom-[20%] flex items-center justify-center px-6 sm:px-10 md:px-12"
        aria-label="Nexos, a performance que seu business merece."
      >
        <div className="intro-copy">
          <span className="intro-brand"><span className="intro-brand-name">NexOS</span><span className="intro-registration" aria-hidden="true">®</span></span>
          <h1>A performance que<br /><span className="intro-accent">seu business merece.</span></h1>
          <p>O próximo passo começa aqui.</p>
        </div>
      </motion.div>

      <motion.button
        type="button"
        autoFocus
        onClick={finish}
        aria-label="Continuar para o site"
        initial={false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.9, ease: FLUID_EASE }}
        className="absolute bottom-[calc(2.5rem+env(safe-area-inset-bottom))] left-1/2 z-10 flex min-h-[48px] -translate-x-1/2 items-center gap-3 whitespace-nowrap rounded-full border border-ink/15 bg-canvas/80 px-6 py-3 text-sm font-medium text-ink/80 transition-colors duration-300 hover:bg-ink/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink"
      >
        <span className="animate-scroll-hint grid place-items-center" aria-hidden="true">
          <ArrowDown size={22} strokeWidth={1.5} />
        </span>
        <span>Entrar na NexOS</span>
      </motion.button>
    </motion.div>
  );
}

export default function HomeClient() {
  // Every visitor receives the complete landing page without an interaction gate.
  const [stage, setStage] = useState<Stage>('main');
  const heroRef = useRef<HTMLElement>(null);
  const introDoneRef = useRef<boolean>(false);
  const brandDoneRef = useRef<boolean>(false);
  const presentationPlayedRef = useRef<boolean>(false);
  const mainReduce = useReducedMotion();

  const replayPresentation = useCallback(() => {
    introDoneRef.current = false;
    brandDoneRef.current = false;
    presentationPlayedRef.current = true;
    setStage('intro');
  }, []);

  const handleIntroComplete = useCallback(() => {
    if (introDoneRef.current) return;
    introDoneRef.current = true;
    setStage('brand');
  }, []);

  const handleBrandComplete = useCallback(() => {
    if (brandDoneRef.current) return;
    brandDoneRef.current = true;
    setStage('main');
  }, []);

  useEffect(() => {
    if (stage === 'main') return;
    const onEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      event.stopImmediatePropagation();
      setStage('main');
    };
    window.addEventListener('keydown', onEscape, true);
    return () => window.removeEventListener('keydown', onEscape, true);
  }, [stage]);

  useEffect(() => {
    if (stage !== 'main' || !presentationPlayedRef.current) return;
    window.scrollTo(0, 0);
    let timer: ReturnType<typeof setTimeout> | undefined;
    const raf: number = requestAnimationFrame(() => {
      timer = setTimeout(() => {
        if (heroRef.current) {
          heroRef.current.focus({ preventScroll: true });
          heroRef.current.scrollIntoView({ behavior: mainReduce ? 'instant' : 'smooth', block: 'start' });
        }
      }, 150);
    });
    return () => { cancelAnimationFrame(raf); clearTimeout(timer); };
  }, [stage, mainReduce]);

  return (
    <main className="landing-page w-full max-w-full overflow-x-clip bg-canvas text-ink">
      <AnimatePresence>{stage === 'intro' && <IntroSection key="intro" onComplete={handleIntroComplete} />}</AnimatePresence>

      <AnimatePresence>{stage === 'brand' && <BrandEntrance key="brand" onComplete={handleBrandComplete} />}</AnimatePresence>

      <div inert={stage !== 'main'}>
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
