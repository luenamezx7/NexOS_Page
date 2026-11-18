'use client';

import { usePrefersReducedMotion } from '@/lib/use-prefers-reduced-motion';
import { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { Header } from '@/components/Header';
import { Hero } from '@/components/Hero';
import { Management } from '@/components/sections/Management';
import { BusinessExamples } from '@/components/sections/BusinessExamples';
import { Ecosystem } from '@/components/sections/Ecosystem';
import { HeroBrandStrip } from '@/components/HeroBrandStrip';
import { SectionBackground } from '@/components/sections/SectionBackground';
import { ProofStrip } from '@/components/sections/ProofStrip';
import { PlateManagement } from '@/components/sections/PlateManagement';
import { HomepageJourneyMotion } from '@/components/sections/HomepageJourneyMotion';
import BrandEntrance from '@/components/BrandEntrance';
import { useLocale } from '@/lib/locale';
import { RealEstateVideo } from '@/components/sections/RealEstateVideo';
import { MotionDiagnosticsLoader } from '@/components/MotionDiagnosticsLoader';
import { HeadingScrollMotion } from '@/components/HeadingScrollMotion';

const Services = dynamic(() => import('@/components/Services').then(m => m.Services));
const AboutUs = dynamic(() => import('@/components/AboutUs').then(m => m.AboutUs));
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

export default function HomeClient() {
  const { t } = useLocale();
  const reduce = usePrefersReducedMotion();
  const [entrance, setEntrance] = useState({ visible: true, key: 0 });
  const [selectedPlateUse, setSelectedPlateUse] = useState<string>();
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
    // Reduced motion bypasses BrandEntrance's scroll reset. Land before
    // releasing the cover, including browser reload restores.
    // Explicit deep links still belong to the section-navigation controller.
    if (entered && (entrance.key > 0 || !location.hash || location.hash === '#hero')) {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
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
    <main data-motion-detail={reduce ? 'reduced' : 'full'} className="landing-page w-full max-w-full overflow-x-clip bg-canvas text-ink">
      <HomepageJourneyMotion />
      <HeadingScrollMotion />
      <MotionDiagnosticsLoader />
      {entrance.visible && <BrandEntrance key={entrance.key} onComplete={handleEntranceComplete} />}
      <div>
         <a href="#main-content" className="skip-link">{t('Pular para o conteúdo')}</a>
        <Header />
        <div className="relative">
          <div id="main-content" tabIndex={-1} className="relative">
               <Hero ref={heroRef} />
               <Management />
               <Ecosystem />
               <SectionBackground index={3} experience="easychat"><EasyChat /></SectionBackground>
               <SectionBackground index={1} experience="solutions">
                  <Services selectedUse={selectedPlateUse} />
               </SectionBackground>
               <div className="chapter-surface-frame">
               <SectionBackground index={0} scene="product" experience="nfc">
                  <HeroBrandStrip />
                  <PlacaNFCSection onSelectUse={setSelectedPlateUse} />
                  <PlateManagement />
               </SectionBackground>
               </div>
               <SectionBackground index={1} experience="real-estate-video"><RealEstateVideo videoSrc="/media/gloved-hand-connecting-iphone.mp4" posterSrc="/media/gloved-hand-connecting-iphone-poster.jpg" /></SectionBackground>

             <details className="business-examples-disclosure"><summary>{t('Soluções para cada negócio')}</summary><BusinessExamples /></details>
             <div className="chapter-surface-frame">
             <SectionBackground index={4} scene="waves" experience="process">
               <DeliveryProcess />
             </SectionBackground>
             </div>
             <SectionBackground index={5} experience="applications">
               <MascotSolutions />
             </SectionBackground>
             <ProofStrip />
             <div className="about-surface-frame">
               <SectionBackground index={7} experience="about">
                 <AboutUs />
               </SectionBackground>
             </div>
               <SectionBackground index={8} experience="contact">
                <FAQ />
                 <CTAFinal />
             </SectionBackground>
             <SocialInvite />
          </div>
           <div className="footer-transition"><Footer onViewPresentation={replayPresentation} /></div>
          <BrandClosing />
        </div>
      </div>
    </main>
  );
}
