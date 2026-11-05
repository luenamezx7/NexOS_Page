'use client';

import Image from 'next/image';
import { ArrowUpRight, Globe2, MessageCircle, Nfc, QrCode, UtensilsCrossed } from 'lucide-react';
import styles from './MascotSolutions.module.css';
import { useLocale } from '@/lib/locale';

const SOLUTIONS = [
  { id: '01', scene: 'plate', summary: 'A placa facilita o acesso ao endereço escolhido.', label: 'Primeiro contato', title: 'Um gesto. Um endereço.', icon: Nfc },
  { id: '02', scene: 'site', summary: 'O site apresenta sua marca e seus serviços.', label: 'Sua presença', title: 'Sua marca em destaque.', icon: Globe2 },
  { id: '03', scene: 'menu', summary: 'O cardápio organiza a consulta no celular.', label: 'À mesa', title: 'Escolhas mais simples.', icon: UtensilsCrossed },
  { id: '04', scene: 'team', summary: 'A equipe ajuda a escolher e desenvolver a solução.', label: 'Com a ezway', title: 'Vamos alinhar juntos.', icon: MessageCircle },
] as const;

export function MascotSolutions() {
  const { t } = useLocale();
  return (
    <section id="mascot-solutions" aria-labelledby="mascot-solutions-title" className={styles.section}>
      <div className={styles.container}>
        <h2 id="mascot-solutions-title" className={styles.visuallyHidden}>{t('ezway no seu dia a dia — Pequenas conexões. Soluções de verdade.')}</h2>
        <div className={styles.carouselWrapper} role="region" aria-roledescription="carousel" aria-label={t('Suportes e soluções ezway')} tabIndex={0}>
          <ul className={styles.track}>
             {SOLUTIONS.map(solution => <li key={solution.id}>
               <figure>
                 <div className={styles.scene} data-scene={solution.scene} role="img" aria-label={t(solution.summary)}>
                   <span className={styles.sceneIndex}>{solution.id} / 04</span>
                   <div className={styles.mascot}><Image src="/logo-ghost.svg" alt="" width={166} height={166} unoptimized loading="lazy" /></div>
                   <div className={styles.sceneCard} aria-hidden="true">
                     <solution.icon size={24} strokeWidth={1.6} />
                     <span className={styles.sceneMockup}>
                       {solution.scene === 'plate' && <span className={styles.miniPlate}><Nfc size={13} /> ezway <QrCode size={19} /></span>}
                       {solution.scene === 'site' && <span className={styles.miniSite}><i /><i /><i /><strong>ezway</strong><span /></span>}
                       {solution.scene === 'menu' && <span className={styles.miniMenu}><i /><i /><i /></span>}
                       {solution.scene === 'team' && <span className={styles.miniChat}><i /><i /><i /></span>}
                     </span>
                     <span>{t(solution.label)}</span>
                     <strong>{t(solution.title)}</strong>
                     <span className={styles.sceneSignal}>{solution.scene === 'plate' ? <QrCode size={20} /> : <ArrowUpRight size={20} />}</span>
                   </div>
                 </div>
                 <figcaption>{t(solution.summary)}</figcaption>
              </figure>
            </li>)}
          </ul>
        </div>
      </div>
    </section>
  );
}

export default MascotSolutions;
