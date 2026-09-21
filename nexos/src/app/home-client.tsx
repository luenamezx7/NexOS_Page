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
import TextPressure from '@/components/TextPressure';
import { useTheme } from '@/components/ThemeProvider';
import { LampContainer } from '@/components/ui/lamp';


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

type Stage = 'loading' | 'intro' | 'main';

const FLUID_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];
const LOADING_MS = 2200;

const INTRO_TEXT = 'NEXOS, A PERFORMANCE QUE SEU BUSINESS MERECE.';

function LoadingScreen() {
  return (
    <motion.div
      role="status"
      aria-label="Carregando plataforma NexOS"
      exit={{ opacity: 0, filter: 'blur(6px)' }}
      transition={{ duration: 0.6, ease: FLUID_EASE }}
      className="fixed inset-0 z-[999] flex items-center justify-center bg-canvas will-change-transform"
    >
      <ThinkingOrbWrapper state="searching" size={64} label="INITIALIZING NEXOS..." />
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
      exit={reduce ? { opacity: 0 } : { opacity: 0, y: -90, filter: 'blur(8px)' }}
      transition={{ duration: 0.7, ease: FLUID_EASE }}
      className="fixed inset-0 z-[900] flex min-h-dvh flex-col justify-center overflow-hidden overflow-x-clip bg-canvas will-change-transform"
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <LampContainer className="!min-h-dvh !rounded-none border-0 !bg-canvas">
          <span className="sr-only">Lamp background</span>
        </LampContainer>
      </div>
      <div className="grid-pattern-subtle opacity-80 dark:opacity-10" aria-hidden="true" />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, ease: FLUID_EASE }}
        className="absolute inset-0 w-full max-w-full overflow-hidden px-4 will-change-transform sm:px-6 md:px-8"
        aria-label="Nexos, a performance que seu business merece."
      >
        <TextPressure
          text={INTRO_TEXT}
          fontFamily="Dirtyline"
          fontUrl=""
          width={true}
          weight={true}
          italic={false}
          alpha={true}
          stroke={false}
          scale={false}
          textColor={theme === 'dark' ? '#FFFFFF' : '#131316'}
          strokeColor={theme === 'dark' ? '#FFFFFF' : '#131316'}
          minFontSize={24}
        />
      </motion.div>

      <motion.button
        type="button"
        onClick={finish}
        aria-label="Continuar para o site"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.9, ease: FLUID_EASE }}
        className="absolute bottom-[calc(2.5rem+env(safe-area-inset-bottom))] left-1/2 z-10 flex min-h-[44px] min-w-[44px] -translate-x-1/2 flex-col items-center gap-3 px-4 font-mono text-[11px] uppercase tracking-[0.22em] text-ink/40 transition-colors duration-300 hover:text-ink/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink"
      >
        <span className="animate-scroll-hint grid place-items-center" aria-hidden="true">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path d="M12 5v14M19 12l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <span>Role para entrar</span>
      </motion.button>
    </motion.div>
  );
}

export default function HomeClient() {
  const [stage, setStage] = useState<Stage>('loading');
  const heroRef = useRef<HTMLElement>(null);
  const introDoneRef = useRef<boolean>(false);

  const handleIntroComplete = useCallback(() => {
    if (introDoneRef.current) return;
    introDoneRef.current = true;
    setStage('main');
  }, []);

  useEffect(() => {
    if (stage !== 'loading') return;
    const timer: ReturnType<typeof setTimeout> = setTimeout(() => setStage('intro'), LOADING_MS);
    return () => clearTimeout(timer);
  }, [stage]);

  useEffect(() => {
    if (stage !== 'main') return;
    window.scrollTo(0, 0);
    const raf: number = requestAnimationFrame(() => {
      const t: ReturnType<typeof setTimeout> = setTimeout(() => {
        if (heroRef.current) {
          heroRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 150);
      return () => clearTimeout(t);
    });
    return () => cancelAnimationFrame(raf);
  }, [stage]);

  return (
    <main className="w-full max-w-full overflow-x-clip bg-canvas text-ink">
      <AnimatePresence>{stage === 'loading' && <LoadingScreen key="loading" />}</AnimatePresence>

      <AnimatePresence>{stage === 'intro' && <IntroSection key="intro" onComplete={handleIntroComplete} />}</AnimatePresence>

      {stage === 'main' && (
        <>
          <Header />
          <SectionIndicator />
          <motion.div
            initial={{ opacity: 0, y: 40 }}
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
