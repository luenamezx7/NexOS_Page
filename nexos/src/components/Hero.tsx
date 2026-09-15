import styles from './Hero.module.css';
import { config } from '@/config';
import { Button } from './ui/Button';
import { ArrowRight } from 'lucide-react';
import DarkVeil from './DarkVeil';
import { SlideUpText } from './SlideUpText';

export function Hero() {
  return (
    <section id="hero" className={styles.hero} aria-labelledby="hero-title">
      <div className={styles.auroraLayer} aria-hidden="true">
        <div style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}>
          <DarkVeil
            hueShift={275}
            noiseIntensity={0.12}
            speed={0.7}
            scanlineFrequency={0.5}
            warpAmount={5}
          />
        </div>
        <div className={styles.gridPattern} />
      </div>
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.badge}>
            <span className={styles.badgeDot} aria-hidden="true"></span>
            <span>Novo: Starter Kit para MVPs em 4 semanas</span>
          </div>
          <h1 id="hero-title" className={styles.headline}>
            <SlideUpText
              split="words"
              stagger={0.08}
              delay={0.3}
              inView={true}
              transition={{ type: 'tween', ease: [0.625, 0.05, 0, 1], duration: 0.6 }}
              className="slide-up-text"
            >
              {config.hero.headline}
            </SlideUpText>
          </h1>
          <p className={styles.subheadline}>{config.hero.subheadline}</p>
          <div className={styles.ctaGroup}>
            <Button
              variant="primary"
              size="lg"
              aria-label={config.hero.ctaPrimary.label}
            >
              <a href={config.hero.ctaPrimary.href}>
                {config.hero.ctaPrimary.label}
                <ArrowRight size={20} strokeWidth={2.5} aria-hidden="true" />
              </a>
            </Button>
            <Button
              variant="secondary"
              size="lg"
              aria-label={config.hero.ctaSecondary.label}
            >
              <a href={config.hero.ctaSecondary.href}>{config.hero.ctaSecondary.label}</a>
            </Button>
          </div>
          <div className={styles.trust}>
            <span className={styles.trustLabel}>Confiado por startups e scale-ups</span>
            <div className={styles.trustAvatars} aria-hidden="true">
              <span className={styles.avatar}>MS</span>
              <span className={styles.avatar}>RO</span>
              <span className={styles.avatar}>CR</span>
              <span className={styles.avatar}>AF</span>
              <span className={styles.avatarMore}>+12</span>
            </div>
          </div>
        </div>
        <div className={styles.visual} aria-hidden="true">
          <div className={styles.window}>
            <div className={styles.windowHeader}>
              <div className={styles.windowControls}>
                <span className={styles.control} />
                <span className={styles.control} />
                <span className={styles.control} />
              </div>
              <div className={styles.windowTitle}>nexos.config.ts</div>
            </div>
            <pre className={styles.code}>
              <code className="mono">
</code>
            </pre>
          </div>
          <div className={styles.metrics}>
            <div className={styles.metric}>
              <span className={styles.metricValue}>40+</span>
              <span className={styles.metricLabel}>Projetos entregues</span>
            </div>
            <div className={styles.metric}>
              <span className={styles.metricValue}>98%</span>
              <span className={styles.metricLabel}>Satisfação do cliente</span>
            </div>
            <div className={styles.metric}>
              <span className={styles.metricValue}>6sem</span>
              <span className={styles.metricLabel}>MVP médio</span>
            </div>
          </div>
          <div className={styles.techIndicator} aria-hidden="true">
            <span className={styles.techDot}></span>
            <span className={styles.techLabel}>HOME</span>
          </div>
        </div>
      </div>
      <div className={styles.scrollIndicator} aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 5v14M19 12l-7 7-7-7" />
        </svg>
      </div>
    </section>
  );
}