'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { Header } from '@/components/Header';
import { Hero } from '@/components/Hero';
import { ScrollProgress } from '@/components/ScrollProgress';
import { SectionBackground } from '@/components/sections/SectionBackground';
import { LandingPageBlur } from '@/components/sections/LandingPageBlur';
import { ProofStrip } from '@/components/sections/ProofStrip';
import { FloatingWhatsApp } from '@/components/sections/FloatingWhatsApp';
import BrandEntrance from '@/components/BrandEntrance';
import { useLocale } from '@/lib/locale';

const Services = dynamic(() => import('@/components/Services').then(m => m.Services));
const AboutUs = dynamic(() => import('@/components/AboutUs').then(m => m.AboutUs));
const Plans = dynamic(() => import('@/components/sections/Plans').then(m => m.Plans));
const ContactForm = dynamic(() => import('@/components/sections/ContactForm').then(m => m.ContactForm));
const FAQ = dynamic(() => import('@/components/FAQ').then(m => m.FAQ));
const MascotSolutions = dynamic(() => import('@/components/sections/MascotSolutions').then(m => m.MascotSolutions));
const Footer = dynamic(() => import('@/components/Footer').then(m => m.Footer));
const SocialInvite = dynamic(() => import('@/components/sections/SocialInvite').then(m => m.SocialInvite));
const BrandClosing = dynamic(() => import('@/components/sections/BrandClosing').then(m => m.BrandClosing));

// Split bundles without removing the commercial content from the server HTML.
const EasyChat = dynamic(() => import('@/components/sections/EasyChat').then(m => m.EasyChat));
const DeliveryProcess = dynamic(() => import('@/components/sections/DeliveryProcess').then(m => m.DeliveryProcess));
const PlacaNFCSection = dynamic(() => import('@/components/sections/PlacaNFCSection').then(m => m.PlacaNFCSection));
const CTAFinal = dynamic(() => import('@/components/sections/CTAFinal').then(m => m.CTAFinal));
const FisicoDigitalSection = dynamic(() => import('@/components/sections/FisicoDigitalSection').then(m => m.FisicoDigitalSection));

export default function HomeClient() {
  const { t } = useLocale();
  const [entrance, setEntrance] = useState({ visible: true, key: 0 });
  const entranceGeneration = useRef(0);
  const heroRef = useRef<HTMLElement>(null);
  const focusRaf = useRef(0);

  const replayPresentation = useCallback(() => {
    cancelAnimationFrame(focusRaf.current);
    entranceGeneration.current += 1;
    setEntrance({ visible: true, key: entranceGeneration.current });
  }, []);

  const handleEntranceComplete = useCallback((entered: boolean) => {
    if (entrance.key !== entranceGeneration.current) return;
    setEntrance({ visible: false, key: entrance.key });
    if (!entered) return;
    focusRaf.current = requestAnimationFrame(() => {
      if (entrance.key === 0 && location.hash && location.hash !== '#hero') {
        // The intro also runs on deep links; restore their destination after it closes.
        window.dispatchEvent(new HashChangeEvent('hashchange'));
      } else {
        heroRef.current?.focus({ preventScroll: true });
      }
    });
  }, [entrance.key]);

  useEffect(() => () => cancelAnimationFrame(focusRaf.current), []);

  return (
    <main className="landing-page w-full max-w-full overflow-x-clip bg-canvas text-ink">
      {entrance.visible && <BrandEntrance key={entrance.key} onComplete={handleEntranceComplete} />}
      <div>
         <a href="#main-content" className="skip-link">{t('Pular para o conteúdo')}</a>
        <Header />
        <ScrollProgress />
        <div className="relative">
          <div id="main-content" tabIndex={-1} className="relative">
            <Hero ref={heroRef} />
            <ProofStrip />
            <SectionBackground index={0} scene="waves" experience="studio">
              <FisicoDigitalSection />
            </SectionBackground>
            <SectionBackground index={1} experience="solutions">
              <Services />
            </SectionBackground>
            <SectionBackground index={2} scene="product" experience="nfc">
              <PlacaNFCSection />
            </SectionBackground>
            <SectionBackground index={3} scene="waves" experience="process">
              <DeliveryProcess />
            </SectionBackground>
            <SectionBackground index={4} experience="applications">
              <MascotSolutions />
            </SectionBackground>
            <SectionBackground index={5} experience="plans"><Plans /></SectionBackground>
            <SectionBackground index={6} experience="easychat">
              <EasyChat />
            </SectionBackground>
            <SectionBackground index={7} experience="about">
              <AboutUs />
            </SectionBackground>
            <SectionBackground index={8} experience="contact">
              <FAQ />
              <ContactForm />
              <CTAFinal />
              <SocialInvite />
            </SectionBackground>
          </div>
          <Footer onViewPresentation={replayPresentation} />
          <BrandClosing />
        </div>
      </div>
      <LandingPageBlur />
      <FloatingWhatsApp />
    </main>
  );
}
