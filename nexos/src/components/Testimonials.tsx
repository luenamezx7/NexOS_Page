'use client';

import { useState, useCallback, useEffect } from 'react';
import styles from './Testimonials.module.css';
import { config } from '@/config';
import { ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import { SlideUpText } from './SlideUpText';

export function Testimonials() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);

  const next = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % config.testimonials.length);
  }, []);

  const prev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + config.testimonials.length) % config.testimonials.length);
  }, []);

  useEffect(() => {
    const interval = setInterval(next, 6000);
    return () => clearInterval(interval);
  }, [next]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;
    if (Math.abs(diff) > 50) {
      if (diff > 0) next();
      else prev();
    }
    setTouchStart(null);
  };

  const testimonial = config.testimonials[currentIndex];
  const initials = testimonial.author.split(' ').map(n => n[0]).join('');

  return (
    <section id="testimonials" className={styles.section} aria-labelledby="testimonials-title">
      <div className={styles.container}>
        <header className={styles.sectionHeader}>
          <h2 id="testimonials-title" className={styles.sectionTitle}>
            <SlideUpText
              split="words"
              stagger={0.08}
              delay={0.1}
              inView={true}
              transition={{ type: 'tween', ease: [0.625, 0.05, 0, 1], duration: 0.6 }}
            >
              Cases & Depoimentos
            </SlideUpText>
          </h2>
          <p className={styles.sectionSubtitle}>
            Resultados reais de times que confiaram na gente para construir seus produtos.
          </p>
        </header>

        <div
          className={styles.carousel}
          role="region"
          aria-roledescription="carousel"
          aria-label="Depoimentos de clientes"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <button
            className={`${styles.navButton} ${styles.prevButton}`}
            onClick={prev}
            aria-label="Depoimento anterior"
            disabled={config.testimonials.length <= 1}
          >
            <ChevronLeft size={24} strokeWidth={2.5} aria-hidden="true" />
          </button>

          <div className={styles.track} aria-live="polite">
            <article className={styles.card}>
              <div className={styles.cardGlow} aria-hidden="true" />
              <div className={styles.quoteIcon} aria-hidden="true">
                <Quote size={32} strokeWidth={1.5} />
              </div>
              <blockquote className={styles.content}>
                <p className={styles.text}>&ldquo;{testimonial.content}&rdquo;</p>
              </blockquote>
              <footer className={styles.author}>
                <div className={styles.avatar} aria-hidden="true">
                  <svg viewBox="0 0 56 56" width="56" height="56" aria-hidden="true">
                    <circle cx="28" cy="28" r="28" fill="currentColor" />
                    <text x="50%" y="55%" dominantBaseline="middle" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="16" fontWeight="600" fill="var(--color-canvas)">
                      {initials}
                    </text>
                  </svg>
                </div>
                <div className={styles.authorInfo}>
                  <cite className={styles.authorName}>{testimonial.author}</cite>
                  <p className={styles.authorRole}>{testimonial.role} @ {testimonial.company}</p>
                </div>
              </footer>
            </article>
          </div>

          <button
            className={`${styles.navButton} ${styles.nextButton}`}
            onClick={next}
            aria-label="Próximo depoimento"
            disabled={config.testimonials.length <= 1}
          >
            <ChevronRight size={24} strokeWidth={2.5} aria-hidden="true" />
          </button>
        </div>

        <div className={styles.dots} role="tablist" aria-label="Navegação dos depoimentos">
          {config.testimonials.map((_, index) => (
            <button
              key={index}
              className={`${styles.dot} ${index === currentIndex ? styles.dotActive : ''}`}
              onClick={() => setCurrentIndex(index)}
              role="tab"
              aria-selected={index === currentIndex}
              aria-label={`Ir para depoimento ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}