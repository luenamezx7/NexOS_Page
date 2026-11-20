import { ArrowLeft, KeyRound, ShieldCheck, UserRound } from 'lucide-react';
import Link from 'next/link';
import { BrandMark } from '../BrandMark';
import styles from './LoginForm.module.css';
import { PageHeader } from '../PageChrome';
import { ScrollReveal } from '../ScrollReveal';

export function AuthHeader({ accountOnly = false }: { accountOnly?: boolean }) {
  return <PageHeader accountOnly={accountOnly} />;
}

/** Login identity stays in normal flow, without the site's navigation bar. */
export function AuthIdentity() {
  return <div className={styles.identity} data-auth-identity>
    <Link href="/" aria-label="ezway — página inicial" className={styles.identityBrand}><BrandMark registered /></Link>
    <Link href="/" className={styles.identityBack}><ArrowLeft size={16} aria-hidden="true" /><span>Voltar ao site</span></Link>
  </div>;
}

export function AuthStory({ recovery = false, premium = false }: { recovery?: boolean; premium?: boolean }) {
  if (premium) return <aside className={styles.premiumStory} aria-label={recovery ? 'Recuperação de acesso ezway' : 'Sua conta ezway'}>
    <div className={styles.premiumStoryCopy}>
      <h2>{recovery ? 'Recupere o acesso.' : 'Seu espaço.'}<br />{recovery ? 'Siga em frente.' : 'Seu acesso.'}</h2>
      <p>{recovery ? 'Defina uma nova senha e volte a acessar sua conta com segurança.' : 'Entre na sua conta para atualizar seus dados e gerenciar a segurança do seu acesso.'}</p>
    </div>
    <ul className={styles.premiumStoryFeatures}>
      <li><ShieldCheck size={18} aria-hidden="true" /><span>Acesso protegido</span></li>
      <li><UserRound size={18} aria-hidden="true" /><span>Seus dados</span></li>
      <li><KeyRound size={18} aria-hidden="true" /><span>Segurança da conta</span></li>
    </ul>
  </aside>;
  return <aside className={styles.story} aria-label={recovery ? 'Recuperação de acesso ezway' : 'Sua conta ezway'}>
    <p className={styles.storyLabel}>ezway / {recovery ? 'recuperação' : 'seu espaço digital'}</p>
    <ScrollReveal as="h2" preset="title" className={styles.storyHeading}>{recovery ? 'Recupere o acesso.' : 'Seu espaço.'}<br /><span className="brand-heading">{recovery ? 'Siga em frente.' : 'Seu acesso.'}</span></ScrollReveal>
    <ScrollReveal as="p" delay={.08} className={styles.storyDescription}>{recovery ? 'Defina uma nova senha e volte a acessar sua conta com segurança.' : 'Entre na sua conta para atualizar seus dados e gerenciar a segurança do seu acesso.'}</ScrollReveal>
    <ul className={styles.storyFeatures}>
      <li><ShieldCheck size={17} aria-hidden="true" /><span>Acesso protegido</span></li>
      <li><UserRound size={17} aria-hidden="true" /><span>Seus dados</span></li>
      <li><KeyRound size={17} aria-hidden="true" /><span>Segurança da conta</span></li>
    </ul>
  </aside>;
}
