'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { Header } from '@/components/Header';
import { Hero } from '@/components/Hero';
import { ProductShowcase } from '@/components/ProductShowcase';
import { SectionIndicator } from '@/components/SectionIndicator';
import BrandEntrance from '@/components/BrandEntrance';
import { Slipstream } from '@/components/ui/background-ascii-flow';
import { ArrowDown } from 'lucide-react';
import { CloudSky } from '@/components/SiteAtmosphere';

// Lazy load heavy components below the fold
const Services = dynamic(() => import('@/components/Services').then(m => m.Services), { ssr: false, loading: () => null });
const Testimonials = dynamic(() => import('@/components/Testimonials').then(m => m.Testimonials), { ssr: false, loading: () => null });
const FAQ = dynamic(() => import('@/components/FAQ').then(m => m.FAQ), { ssr: false, loading: () => null });
const Contact = dynamic(() => import('@/components/Contact').then(m => m.Contact), { ssr: false, loading: () => null });
const Footer = dynamic(() => import('@/components/Footer').then(m => m.Footer), { ssr: false, loading: () => null });


type Stage = 'loading' | 'intro' | 'brand' | 'main';

const FLUID_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];
const LOADING_MS = 900;
const BOOT_SEEN_KEY = 'nexos-boot-seen';

function LoadingScreen() {
  const reduce = useReducedMotion();
  return (
    <motion.div
      role="status"
      aria-label="Carregando plataforma NexOS"
      exit={{ opacity: 0 }}
      transition={{ duration: reduce ? 0.15 : 0.45, ease: FLUID_EASE }}
      className="fixed inset-0 z-[999] flex flex-col items-center justify-center gap-8 bg-canvas"
    >
      <div className="flex flex-col items-center gap-3">
        <span className="font-display text-3xl font-semibold tracking-tighter">NexOS</span>
        <span className="font-mono text-xs text-muted-foreground">Preparando sua experiência</span>
      </div>
      <div className="h-px w-32 overflow-hidden bg-ink/10" aria-hidden="true">
        <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: reduce ? 0 : LOADING_MS / 1000, ease: 'easeInOut' }} className="h-full origin-left bg-[#db2777]" />
      </div>
    </motion.div>
  );
}

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
      role="region"
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
        initial={reduce ? false : { opacity: 0, y: 16 }}
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
        onClick={finish}
        aria-label="Continuar para o site"
        initial={reduce ? false : { opacity: 0, y: 12 }}
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
  const [stage, setStage] = useState<Stage>('loading');
  const heroRef = useRef<HTMLElement>(null);
  const introDoneRef = useRef<boolean>(false);
  const brandDoneRef = useRef<boolean>(false);
  const skippedBootRef = useRef<boolean>(false);
  const mainReduce = useReducedMotion();

  useEffect(() => {
    let seen = false;
    try { seen = sessionStorage.getItem(BOOT_SEEN_KEY) === '1'; } catch { seen = false; }
    if (!seen && !new URLSearchParams(window.location.search).has('checkout')) return;
    skippedBootRef.current = true;
    introDoneRef.current = true;
    brandDoneRef.current = true;
    // rAF: volta direto à landing nas visitas seguintes da mesma sessão.
    const id = requestAnimationFrame(() => setStage('main'));
    return () => cancelAnimationFrame(id);
  }, []);

  const handleIntroComplete = useCallback(() => {
    if (introDoneRef.current) return;
    introDoneRef.current = true;
    setStage('brand');
  }, []);

  const handleBrandComplete = useCallback(() => {
    if (brandDoneRef.current) return;
    brandDoneRef.current = true;
    try { sessionStorage.setItem(BOOT_SEEN_KEY, '1'); } catch { /* sem storage */ }
    setStage('main');
  }, []);

  useEffect(() => {
    if (stage !== 'loading') return;
    const timer: ReturnType<typeof setTimeout> = setTimeout(() => setStage('intro'), LOADING_MS);
    return () => clearTimeout(timer);
  }, [stage]);

  useEffect(() => {
    if (stage !== 'main' || skippedBootRef.current) return;
    window.scrollTo(0, 0);
    let timer: ReturnType<typeof setTimeout> | undefined;
    const raf: number = requestAnimationFrame(() => {
      timer = setTimeout(() => {
        if (heroRef.current) {
          heroRef.current.scrollIntoView({ behavior: mainReduce ? 'instant' : 'smooth', block: 'start' });
        }
      }, 150);
    });
    return () => { cancelAnimationFrame(raf); clearTimeout(timer); };
  }, [stage, mainReduce]);

  return (
    <main className="landing-page w-full max-w-full overflow-x-clip bg-canvas text-ink">
      <AnimatePresence>{stage === 'loading' && <LoadingScreen key="loading" />}</AnimatePresence>

      <AnimatePresence>{stage === 'intro' && <IntroSection key="intro" onComplete={handleIntroComplete} />}</AnimatePresence>

      <AnimatePresence>{stage === 'brand' && <BrandEntrance key="brand" onComplete={handleBrandComplete} />}</AnimatePresence>

      {stage === 'main' && (
        <>
          <a href="#main-content" className="skip-link">Pular para o conteúdo</a>
          <Header />
          <SectionIndicator />
          <motion.div
            initial={mainReduce ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: FLUID_EASE }}
            className="relative"
          >
            <div id="main-content" className="relative">
              <Hero ref={heroRef} />
              <ProductShowcase />
              <Services />
              <Testimonials />
              <FAQ />
              <Contact />
            </div>
            <Footer />
          </motion.div>
        </>
      )}
    </main>
  );
}
