'use client';

import { useRef, type RefObject } from 'react';
import { CalendarClock, MessageCircle, MapPin, ShoppingBag, Store } from 'lucide-react';
import { AnimatedBeam } from './ui/animated-beam';
import styles from './EasyWayIntegrations.module.css';
import { useLocale } from '@/lib/locale';

function Point({ id, label, icon: Icon, nodeRef }: { id: string; label: string; icon: typeof Store; nodeRef: RefObject<HTMLDivElement | null> }) {
  return <li className={styles.app} data-app={id}><div ref={nodeRef} className={styles.appIcon} data-integration-node><Icon strokeWidth={1.6} aria-hidden="true" /></div><span>{label}</span></li>;
}

export function EasyWayIntegrations() {
  const { t } = useLocale();
  const containerRef = useRef<HTMLDivElement>(null);
  const centerRef = useRef<HTMLDivElement>(null);
  const discovery = useRef<HTMLDivElement>(null);
  const contact = useRef<HTMLDivElement>(null);
  const routine = useRef<HTMLDivElement>(null);
  const sales = useRef<HTMLDivElement>(null);
  const presence = useRef<HTMLDivElement>(null);
  return <figure className={styles.figure} aria-label={t('Pontos do negócio conectados pela ezway')}>
    <div ref={containerRef} className={styles.diagram} data-integrations>
      <AnimatedBeam containerRef={containerRef} fromRef={discovery} toRef={centerRef} duration={4.8} repeatDelay={1.5} />
      <AnimatedBeam containerRef={containerRef} fromRef={contact} toRef={centerRef} delay={.7} duration={4.8} repeatDelay={1.5} />
      <AnimatedBeam containerRef={containerRef} fromRef={routine} toRef={centerRef} delay={1.4} duration={4.8} repeatDelay={1.5} />
      <AnimatedBeam containerRef={containerRef} fromRef={sales} toRef={centerRef} delay={2.1} duration={4.8} repeatDelay={1.5} />
      <AnimatedBeam containerRef={containerRef} fromRef={presence} toRef={centerRef} delay={2.8} duration={4.8} repeatDelay={1.5} />
      <div ref={centerRef} className={styles.center} data-integration-center><span role="img" aria-label="Logo ezway" className={styles.wordmark}>ez<span className={styles.way} data-brand-way>way</span></span></div>
      <ul className={styles.apps} aria-label={t('Pontos do seu negócio')}>
        <Point id="discovery" label={t('Descoberta')} icon={MapPin} nodeRef={discovery} />
        <Point id="contact" label={t('Atendimento')} icon={MessageCircle} nodeRef={contact} />
        <Point id="routine" label={t('Rotina')} icon={CalendarClock} nodeRef={routine} />
        <Point id="sales" label={t('Vendas')} icon={ShoppingBag} nodeRef={sales} />
        <Point id="presence" label={t('Sua presença')} icon={Store} nodeRef={presence} />
      </ul>
    </div><figcaption>{t('Mais caminhos entre seu negócio e seus clientes.')}</figcaption>
  </figure>;
}
