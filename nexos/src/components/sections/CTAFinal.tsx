import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { config } from '@/config';
import styles from './Sections.module.css';

export function CTAFinal() {
  const whatsapp = `https://wa.me/${config.whatsapp.number}?text=${encodeURIComponent(config.whatsapp.message)}`;
  return <section id="cta-final" aria-labelledby="cta-title" className={styles.section}>
    <div className={`${styles.container} ${styles.finalCta}`}>
      <div className={styles.eyebrow}><span>08 / SEU PRÓXIMO PASSO</span><span>NEXOS LAB</span></div>
      <div className={styles.ctaLayout}>
        <h2 id="cta-title">Sua próxima ideia.<br /><span>Vamos colocar no ar?</span></h2>
        <ArrowDownRight className={styles.ctaArrow} strokeWidth={1} aria-hidden="true" />
      </div>
      <div className={styles.ctaBottom}><p>Um projeto digital, uma placa conectada ou uma ideia que ainda está tomando forma.</p><div className={styles.ctaActions}>
        <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="btn-primary-nex">Conversar com a NexOS <ArrowUpRight size={18} aria-hidden="true" /></a>
        <a href="mailto:nexosperformance@gmail.com" className={styles.textLink}>Prefiro conversar por e-mail <ArrowUpRight size={16} aria-hidden="true" /></a>
      </div></div>
    </div>
  </section>;
}
