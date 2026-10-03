import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, ArrowUpRight, KeyRound, Package, UserRound } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import styles from './LoginForm.module.css';

export function AuthHeader() {
  return <header className={styles.header}>
    <Link href="/" aria-label="NexOS — página inicial"><Image src="/nexos-branca-transparente.svg" alt="NexOS" width={110} height={26} priority className="logo-invert h-6 w-auto" /></Link>
    <div className={styles.headerActions}><Link href="/" className={styles.backLink}><ArrowLeft size={16} aria-hidden="true" /> Voltar ao site</Link><ThemeToggle /></div>
  </header>;
}

export function AuthStory({ recovery = false }: { recovery?: boolean }) {
  return <aside className={styles.story} aria-label={recovery ? 'Recuperação de acesso NexOS' : 'Sua conta NexOS'}>
    <p className={styles.storyLabel}>NexOS / {recovery ? 'recuperação' : 'seu espaço digital'}</p>
    <h2 className={styles.storyHeading}>{recovery ? 'Recupere o acesso.' : 'Seus pedidos.'}<br /><span className="brand-heading">{recovery ? 'Siga em frente.' : 'Seu controle.'}</span></h2>
    <p className={styles.storyDescription}>{recovery ? 'Defina uma nova senha e volte à sua conta. Seus pedidos e dados continuam no mesmo lugar.' : 'Acompanhe pedidos, atualize seus dados e cuide do seu acesso em um só lugar.'}</p>
    <ul className={styles.storyFeatures}>
      <li><Package size={17} aria-hidden="true" /><span>Seus pedidos</span></li>
      <li><UserRound size={17} aria-hidden="true" /><span>Seus dados</span></li>
      <li><KeyRound size={17} aria-hidden="true" /><span>Seu acesso</span></li>
    </ul>
    <Link href="/#services" className={styles.storyLink}>Conhecer as soluções <ArrowUpRight size={15} aria-hidden="true" /></Link>
  </aside>;
}
