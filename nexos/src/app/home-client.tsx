"use client";

import { Header } from '@/components/Header';
import { Hero } from '@/components/Hero';
import { Services } from '@/components/Services';
import { Testimonials } from '@/components/Testimonials';
import { Contact } from '@/components/Contact';
import { Footer } from '@/components/Footer';
import { ThinkingOrbWrapper } from '@/components/ThinkingOrbWrapper';
import { useState, useEffect } from "react";

export default function HomeClient() {
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div 
        className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black text-white select-none"
        aria-label="Carregando plataforma NexOS"
      >
        <ThinkingOrbWrapper state="searching" size={64} label="INITIALIZING NEXOS..." />
      </div>
    );
  }

  return (
    <>
      <Header />
      <main id="main-content" role="main">
        <Hero />
        <Services />
        <Testimonials />
        <Contact />
      </main>
      <Footer />
    </>
  );
}