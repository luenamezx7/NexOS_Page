'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { Header } from '@/components/Header';
import { Hero } from '@/components/Hero';
import { ProductShowcase } from '@/components/ProductShowcase';
import { Services } from '@/components/Services';
import { Testimonials } from '@/components/Testimonials';
import { FAQ } from '@/components/FAQ';
import { Contact } from '@/components/Contact';
import { Footer } from '@/components/Footer';
import { SectionIndicator } from '@/components/SectionIndicator';
import { ThinkingOrbWrapper } from '@/components/ThinkingOrbWrapper';
import BrandEntrance from '@/components/BrandEntrance';
import Topography from '@/components/Topography';
import { useTheme } from '@/components/ThemeProvider';


// Mesmo lazy do Hero: WebGL/canvas fora do bundle inicial, com fallback
// estático (a intro aparece após 2.2s de loading — tempo de sobra pro chunk).
function VeilFallback() {
  return <div className="absolute inset-0 bg-[radial-gradient(70%_60%_at_50%_35%,rgba(255, 92, 138,0.14),transparent_75%)]" aria-hidden="true" />;
}

const DarkVeil = dynamic(() => import('@/components/DarkVeil'), {
  ssr: false,
  loading: VeilFallback,
});

const Grainient = dynamic(() => import('@/components/Grainient'), {
  ssr: false,
  loading: VeilFallback,
});

type Stage = 'loading' | 'intro' | 'brand' | 'main';

const FLUID_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];
const LOADING_MS = 2200;
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
      <ThinkingOrbWrapper state="searching" size={64} label="Preparando sua experiência" />
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
  const { theme } = useTheme();
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
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        {theme === 'dark' ? <DarkVeil /> : <Grainient />}
      </div>
      <div className="grid-pattern-subtle opacity-80 dark:opacity-10" aria-hidden="true" />

      <motion.div
        initial={reduce ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: FLUID_EASE }}
        className="absolute inset-x-0 top-[16%] bottom-[20%] flex items-center justify-center px-6 sm:px-10 md:px-12"
        aria-label="Nexos, a performance que seu business merece."
      >
        <h1 className="font-old-english max-w-5xl text-center !text-[clamp(24px,min(6.4vw,8dvh),88px)] !font-normal !leading-[1.2] !tracking-tight">
          NexOS, a performance que seu business merece.
        </h1>
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
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path d="M12 5v14M19 12l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
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
  const { theme: mainTheme } = useTheme();
  const mainReduce = useReducedMotion();

  useEffect(() => {
    let seen = false;
    try { seen = sessionStorage.getItem(BOOT_SEEN_KEY) === '1'; } catch { seen = false; }
    if (!seen) return;
    skippedBootRef.current = true;
    introDoneRef.current = true;
    brandDoneRef.current = true;
    // rAF: pula o boot sem setState síncrono no effect (lint) e sem replay de 2,2s
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
          heroRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 150);
    });
    return () => { cancelAnimationFrame(raf); clearTimeout(timer); };
  }, [stage]);

  return (
    <main className="w-full max-w-full overflow-x-clip bg-canvas text-ink">
      <AnimatePresence>{stage === 'loading' && <LoadingScreen key="loading" />}</AnimatePresence>

      <AnimatePresence>{stage === 'intro' && <IntroSection key="intro" onComplete={handleIntroComplete} />}</AnimatePresence>

      <AnimatePresence>{stage === 'brand' && <BrandEntrance key="brand" onComplete={handleBrandComplete} />}</AnimatePresence>

      {stage === 'main' && (
        <>
          <Header />
          <SectionIndicator />
          {/* Topography global — apenas no modo claro, discorre por toda a página */}
          {mainTheme !== 'dark' && (
            <div className="pointer-events-none fixed inset-0 -z-10 opacity-100" aria-hidden="true">
              <Topography
                lowColor="#fdf6ec"
                midColor="#ff8fab"
                highColor="#231b14"
                speed={mainReduce ? 0 : 0.18}
                morphAmount={2.4}
                morphSpeed={0.035}
                bands={1.8}
                thickness={0.006}
                scale={2.6}
                pixelSize={1}
                glow={0.28}
                colorMode="elevation"
                contrast={2.0}
                brightness={0.9}
                fillBands={false}
                opacity={0.14}
                grain={true}
                grainIntensity={0.025}
                mouseInteraction={!mainReduce}
                mouseRadius={0.28}
                mouseStrength={0.22}
                lightMode={true}
              />
            </div>
          )}
          <motion.div
            initial={mainReduce ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: FLUID_EASE }}
            className="relative"
          >
            <div id="main-content" role="main" className="relative">
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
