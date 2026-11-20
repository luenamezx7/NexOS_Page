'use client';

import { useRef } from 'react';
import Image from 'next/image';
import { ArrowUpRight, Check, FileText, MessageCircle } from 'lucide-react';
import { Iphone } from '../ui/iphone';
import { Avatar, AvatarFallback } from '../ui/avatar';
import portfolioArtwork from '../../../design-/rebrand-nexos/nfcs/CONTEXT-AI-VIDEOS/imgg1.png';
import { publicSolutions, type Solution } from '@/config/solutions';
import { useLocale } from '@/lib/locale';
import { StackedCards } from '@/components/ui/glass-cards';
import styles from './Ecosystem.module.css';
import { ScrollFillText } from '../ui/scroll-fill-headline';

const chapterIds = ['site', 'menu', 'nfc', 'portfolio', 'landing', 'easychat', 'suporte'];
const chapters = chapterIds.map(id => publicSolutions.find(solution => solution.id === id)!);

function ChapterPreview({ solution }: { solution: Solution }) {
  const { t } = useLocale();
  if (solution.id === 'nfc') {
    return <div className={styles.productScene} data-preview="nfc">
      <Image src="/nfcs/nfccardapio.svg" alt={t(solution.asset!.alt)} fill sizes="(max-width: 767px) 300px, 500px" className={styles.plate} />
      <span className={styles.scan}><MessageCircle size={16} aria-hidden="true" /> NFC + QR Code</span>
    </div>;
  }

  if (solution.id === 'menu' || solution.id === 'easychat') {
    const chat = solution.id === 'easychat';
    return <div className={styles.phoneScene} data-preview={solution.id}>
      <Iphone className={styles.phone}>
        <div className={styles.phoneScreen}>
          <div className={styles.phoneHeader}>{chat ? 'EasyChat' : 'ezway'}<span>{t(chat ? 'Em desenvolvimento' : 'Cardápio digital')}</span></div>
          {chat ? <div className={styles.messages}>
            <p>{t('Preciso de um contrato para o meu cliente.')}</p>
            <p>{t('Preparei um rascunho para você revisar.')}</p>
            <div className={styles.file}><FileText size={22} /><span>{t('Contrato para revisão.pdf')}<small>{t('Revise antes de compartilhar.')}</small></span></div>
          </div> : <div className={styles.menuScreen}>
            <div className={styles.menuPhoto}><Image src="/ezway-demo-cafe.jpg" alt="" fill sizes="220px" /></div>
            <strong>{t('Cardápio digital')}</strong>
            <div className={styles.menuRow}><span>{t('Bebidas')}</span><ArrowUpRight size={15} /></div>
            <div className={styles.menuRow}><span>{t('Informações')}</span><ArrowUpRight size={15} /></div>
          </div>}
        </div>
      </Iphone>
    </div>;
  }

  if (solution.id === 'suporte') {
    return <div className={styles.supportScene} data-preview="suporte">
      <div className={styles.team}><Avatar size="lg"><AvatarFallback>ez</AvatarFallback></Avatar><span>ezway<strong>{t('Suporte e acompanhamento')}</strong></span></div>
      <ol className={styles.process}>
        {['Diagnóstico', 'Definição da solução', 'Implementação', 'Entrega'].map(step => <li key={step}><span><Check size={14} /></span>{t(step)}</li>)}
      </ol>
    </div>;
  }

  const image = solution.id === 'portfolio' ? portfolioArtwork : solution.asset!.src;
  return <div className={styles.browserScene} data-preview={solution.id}>
    <div className={styles.browser}>
      <div className={styles.browserBar}><i /><i /><i /><span>{t('Exemplo ilustrativo')}</span></div>
      <div className={styles.browserImage}>
        <Image src={image} alt={t('Exemplo ilustrativo')} fill sizes="(max-width: 767px) 320px, 540px" />
        <div className={styles.browserCopy} aria-hidden="true"><span>{solution.id === 'portfolio' ? t('Projetos') : 'ezway'}</span><strong>{t(solution.id === 'portfolio' ? 'Ideias que ganham forma.' : solution.id === 'landing' ? 'Uma página. Uma oferta clara.' : 'Um site à altura do seu negócio.')}</strong><span>{t('Contato')} <ArrowUpRight size={12} /></span></div>
      </div>
    </div>
  </div>;
}

export function Ecosystem() {
  const { t } = useLocale();
  const stageRef = useRef<HTMLDivElement>(null);
  const colors: Record<string, { color: string; ink?: string }> = {
    site: { color: '#ff78bb' }, menu: { color: 'var(--brand-lime)' }, nfc: { color: '#000000', ink: '#fffaf6' },
    portfolio: { color: '#d1c5f1' }, landing: { color: '#f6e8a9' }, easychat: { color: '#b9dcf3' }, suporte: { color: 'var(--brand-lime)' },
  };
  const cards = chapters.map((solution: Solution) => ({
    id: solution.id, title: t(solution.name), description: t(solution.need), category: t(solution.category),
    ...colors[solution.id], badge: solution.availability === 'development' ? t('Em desenvolvimento') : undefined,
    children: <ChapterPreview solution={solution} />,
  }));

  return <section id="ecossistema" aria-labelledby="ecosystem-title" className={styles.section}>
    <div className={styles.container}>
      <div ref={stageRef} className={styles.stage} data-ecosystem-stage>
      <h2 data-heading-static data-scroll-fill-heading id="ecosystem-title"><ScrollFillText lines={[t('Além da gestão.')]} /></h2>
      <p className={styles.lead}>{t('Sites, cardápios e placas para apresentar seu negócio e facilitar o contato.')}</p>
      <StackedCards items={cards} stageRef={stageRef} />
      </div>
      <p className={styles.note}>{t('Você escolhe o que precisa. O escopo é combinado no diagnóstico.')}</p>
    </div>
  </section>;
}
