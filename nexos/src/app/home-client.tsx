"use client";

import { Header } from '@/components/Header';
import { Hero } from '@/components/Hero';
import { Services } from '@/components/Services';
import { Testimonials } from '@/components/Testimonials';
import { Contact } from '@/components/Contact';
import { Footer } from '@/components/Footer';
import { ThinkingOrbWrapper } from '@/components/ThinkingOrbWrapper';
import TextPressure from '@/components/TextPressure';
import AnimatedGradient from '@/components/AnimatedGradient';
import { useState, useEffect, useCallback, useRef } from "react";

export default function HomeClient() {
  const [stage, setStage] = useState<'loading' | 'intro' | 'main'>('loading');
  const heroRef = useRef<HTMLElement>(null);
  const introContainerRef = useRef<HTMLDivElement>(null);

  const handleIntroComplete = useCallback(() => {
    setStage('main');
    setTimeout(() => {
      if (heroRef.current) {
        heroRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setStage('intro');
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  // Auto-complete intro after scrolling through 200vh
  useEffect(() => {
    if (stage !== 'intro') return;

    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const progress = scrollTop / maxScroll;

      if (progress >= 0.95) {
        handleIntroComplete();
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [stage, handleIntroComplete]);

  if (stage === 'loading') {
    return (
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black text-white select-none"
        aria-label="Carregando plataforma NexOS"
        style={{ height: '100vh', width: '100vw' }}
      >
        <ThinkingOrbWrapper state="searching" size={64} label="INITIALIZING NEXOS..." />
      </div>
    );
  }

  if (stage === 'intro') {
    return (
      <div
        ref={introContainerRef}
        className="relative bg-black text-white select-none"
        style={{ height: '200vh', width: '100vw' }}
        aria-label="Apresentação NexOS"
      >
        <div
          className="relative flex items-center justify-center min-h-screen"
          style={{ height: '100vh' }}
        >
          <AnimatedGradient config={{ preset: "Mist" }} noise={{ opacity: 0.15, scale: 0.8 }} />
          <TextPressure
            text="NEXOS, A PERFORMANCE QUE SEU BUSINESS MERECE."
            fontFamily="Geist"
            fontUrl="https://fonts.googleapis.com/css2?family=Geist:wght@100..900&display=swap"
            width={true}
            weight={true}
            italic={false}
            alpha={false}
            flex={true}
            stroke={false}
            scale={false}
            textColor="#FFFFFF"
            strokeColor="#FFFFFF"
            minFontSize={36}
          />
        </div>
      </div>
    );
  }

  return (
    <>
      <Header />
      <main id="main-content" role="main">
        <Hero ref={heroRef} />
        <Services />
        <Testimonials />
        <Contact />
      </main>
      <Footer />
    </>
  );
}