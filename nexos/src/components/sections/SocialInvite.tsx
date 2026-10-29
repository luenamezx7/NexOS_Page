import { ArrowUpRight } from 'lucide-react';
import { config } from '@/config';
import { ScrollReveal } from '../ScrollReveal';
import styles from './BrandClosing.module.css';

export function SocialInvite() {
  const instagram = config.footer.social.find(link => link.icon === 'Instagram');
  if (!instagram) return null;
  const handle = new URL(instagram.href).pathname.replaceAll('/', '');

  return <section id="instagram" className={styles.socialSection} aria-labelledby="instagram-title">
    <div className={styles.socialInner}>
      <ScrollReveal className={styles.socialCopy}>
        <span className={styles.socialIcon} aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" /></svg>
        </span>
        <div><p className={styles.socialLabel}>NOSSO LADO MAIS PRÓXIMO / @{handle}</p><h2 id="instagram-title">Visite nosso Instagram.</h2><p>Ideias, bastidores e novas conexões da NexOS.</p></div>
      </ScrollReveal>
      <ScrollReveal delay={.08}>
        <a href={instagram.href} target="_blank" rel="noopener noreferrer" className={styles.socialButton}>Visitar Instagram <ArrowUpRight size={18} aria-hidden="true" /></a>
      </ScrollReveal>
    </div>
  </section>;
}
