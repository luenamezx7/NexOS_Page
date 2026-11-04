import Link from 'next/link';
import { ArrowUpRight, KeyRound, ShieldCheck, UserRound } from 'lucide-react';
import styles from './LoginForm.module.css';
import { PageHeader } from '../PageChrome';
import { ScrollReveal } from '../ScrollReveal';

export function AuthHeader() {
  return <PageHeader />;
}

export function AuthStory({ recovery = false }: { recovery?: boolean }) {
  return <aside className={styles.story} aria-label={recovery ? 'Recuperação de acesso ezway' : 'Sua conta ezway'}>
    <p className={styles.storyLabel}>ezway / {recovery ? 'recuperação' : 'seu espaço digital'}</p>
    <ScrollReveal as="h2" preset="title" className={styles.storyHeading}>{recovery ? 'Recupere o acesso.' : 'Seu espaço.'}<br /><span className="brand-heading">{recovery ? 'Siga em frente.' : 'Seu acesso.'}</span></ScrollReveal>
    <ScrollReveal as="p" delay={.08} className={styles.storyDescription}>{recovery ? 'Defina uma nova senha e volte a acessar sua conta com segurança.' : 'Entre na sua conta para atualizar seus dados e gerenciar a segurança do seu acesso.'}</ScrollReveal>
    <ul className={styles.storyFeatures}>
      <li><ShieldCheck size={17} aria-hidden="true" /><span>Acesso protegido</span></li>
      <li><UserRound size={17} aria-hidden="true" /><span>Seus dados</span></li>
      <li><KeyRound size={17} aria-hidden="true" /><span>Segurança da conta</span></li>
    </ul>
    <Link href="/#services" className={styles.storyLink}>Conhecer as soluções <ArrowUpRight size={15} aria-hidden="true" /></Link>
  </aside>;
}
