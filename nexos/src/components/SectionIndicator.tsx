'use client';

import { useEffect, useState } from 'react';
import { motion, useReducedMotion, useScroll, useSpring } from 'motion/react';
import styles from './SectionIndicator.module.css';

const SECTIONS = [
  { id: 'hero', label: 'Início', number: '01' },
  { id: 'showcase', label: 'Placa Inteligente', number: '02' },
  { id: 'services', label: 'Serviços', number: '03' },
  { id: 'testimonials', label: 'Ecossistema', number: '04' },
  { id: 'faq', label: 'FAQ', number: '05' },
  { id: 'contact', label: 'Contato', number: '06' },
];

export function SectionIndicator() {
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 140, damping: 32 });
  const [activeId, setActiveId] = useState('hero');

  useEffect(() => {
    const observed = new Set<Element>();
    const observer = new IntersectionObserver(entries => {
      const visible = entries.find(entry => entry.isIntersecting);
      if (visible) setActiveId(visible.target.id);
    }, { rootMargin: '-40% 0px -40% 0px', threshold: 0 });
    const observeSections = () => {
      for (const section of SECTIONS) {
        const element = document.getElementById(section.id);
        if (element && !observed.has(element)) { observed.add(element); observer.observe(element); }
      }
    };
    observeSections();
    // Below-fold dynamic sections can mount after the navigation does.
    const mounts = new MutationObserver(observeSections);
    mounts.observe(document.getElementById('main-content') ?? document.body, { childList: true, subtree: true });
    return () => { mounts.disconnect(); observer.disconnect(); };
  }, []);

  return (
    <nav aria-label="Navegação de seções" className={styles.nav}>
      <div className={styles.track} aria-hidden="true"><motion.span style={{ scaleY: reduce ? scrollYProgress : progress }} /></div>
      <ul>{SECTIONS.map(section => (
        <li key={section.id}>
          <button type="button" aria-label={`Ir para ${section.label}`} aria-current={activeId === section.id ? 'true' : undefined} onClick={() => document.getElementById(section.id)?.scrollIntoView({ behavior: reduce ? 'instant' : 'smooth', block: 'start' })}>
            <span className={styles.dot} aria-hidden="true" />
            <span className={styles.label} aria-hidden="true">{section.number} / {section.label}</span>
          </button>
        </li>
      ))}</ul>
    </nav>
  );
}

export default SectionIndicator;
