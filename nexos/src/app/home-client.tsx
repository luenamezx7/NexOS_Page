'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { Header } from '@/components/Header';
import { Hero } from '@/components/Hero';
import { Services } from '@/components/Services';
import { Testimonials } from '@/components/Testimonials';
import { Contact } from '@/components/Contact';
import { Footer } from '@/components/Footer';
import { ThinkingOrbWrapper } from '@/components/ThinkingOrbWrapper';
import TextPressure from '@/components/TextPressure';
import DarkVeil from '@/components/DarkVeil';

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
      className="fixed inset-0 z-[999] flex items-center justify-center bg-[#050505] will-change-transform"
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
      className="fixed inset-0 z-[900] flex flex-col justify-center overflow-hidden bg-[#050505] will-change-transform"
    >
      <div className="veil-wrap" aria-hidden="true">
        <DarkVeil
          hueShift={275}
          noiseIntensity={0.08}
          speed={0.5}
          scanlineFrequency={0.3}
          warpAmount={3}
        />
      </div>
      <div className="grid-pattern-subtle" aria-hidden="true" />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, ease: FLUID_EASE }}
        className="absolute inset-0 will-change-transform"
        aria-label="Nexos, a performance que seu business merece."
      >
        <TextPressure
          text={INTRO_TEXT}
          fontFamily="Space Grotesk"
          fontUrl="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300..700&display=swap"
          width={true}
          weight={true}
          italic={false}
          alpha={true}
          stroke={false}
          scale={false}
          textColor="#FFFFFF"
          strokeColor="#FFFFFF"
          minFontSize={36}
        />
      </motion.div>

      <motion.button
        type="button"
        onClick={finish}
        aria-label="Continuar para o site"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.9, ease: FLUID_EASE }}
        className="absolute bottom-10 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-3 font-mono text-[11px] uppercase tracking-[0.22em] text-white/40 transition-colors duration-300 hover:text-white/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
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
    <main className="w-full max-w-full overflow-x-hidden bg-[#050505] text-white">
      <AnimatePresence>{stage === 'loading' && <LoadingScreen key="loading" />}</AnimatePresence>

      <AnimatePresence>{stage === 'intro' && <IntroSection key="intro" onComplete={handleIntroComplete} />}</AnimatePresence>

      {stage === 'main' && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: FLUID_EASE }}
          className="will-change-transform"
        >
          <Header />
          <div id="main-content" role="main">
            <Hero ref={heroRef} />
            <Services />
            <Testimonials />
            <Contact />
          </div>
          <Footer />
        </motion.div>
      )}
    </main>
  );
}
