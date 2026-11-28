'use client';

import { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { ScrollFillText } from '../ui/scroll-fill-headline';
import { TiltedGridHero } from '../ui/tilted-grid-hero';
import { ScrollReveal } from '../ScrollReveal';
import styles from './MascotSolutions.module.css';
import { useLocale } from '@/lib/locale';

const SUPPORT_CARDS = [
  { id: 'conversation', bg: '#ff168d', ink: '#000000', muted: '#4a0026', kicker: 'Primeira conversa', title: 'Vamos entender seu negócio.', description: 'Converse com a ezway para escolher o que faz sentido para você.' },
  { id: 'human', bg: '#ffffff', ink: '#111111', muted: '#5c5c63', kicker: 'Atendimento', title: 'Gente de verdade do outro lado.', description: 'Você fala com a equipe da ezway pelo WhatsApp, sem fila de robô.' },
  { id: 'guidance', bg: '#000000', ink: '#ffffff', muted: '#b3b3b8', kicker: 'Placas', title: 'Orientação para usar sua placa.', description: 'Conte com a equipe para entender o acesso pelo NFC e QR Code.' },
  { id: 'scope', bg: '#7c3aed', ink: '#ffffff', muted: '#e3d6ff', kicker: 'Clareza', title: 'Tudo combinado antes de começar.', description: 'Escopo, etapas e valores alinhados com você, sem surpresa no caminho.' },
  { id: 'destination', bg: '#b9ef75', ink: '#000000', muted: '#344a1c', kicker: 'Destino da placa', title: 'Mudou o link? Fale com a gente.', description: 'A equipe confere as opções disponíveis para o destino da sua placa.' },
  { id: 'mobile', bg: '#ff7a1a', ink: '#1f0b00', muted: '#4d2300', kicker: 'Celular primeiro', title: 'Pensado para quem chega pelo celular.', description: 'Páginas leves para quem vem do Instagram, do WhatsApp ou da placa.' },
  { id: 'project', bg: '#141414', ink: '#ffffff', muted: '#b3b3b8', kicker: 'Seu projeto', title: 'Dúvidas sobre o seu projeto?', description: 'Converse com a ezway para alinhar os próximos passos.' },
  { id: 'after', bg: '#d7ecff', ink: '#06203a', muted: '#2d4a66', kicker: 'Depois da entrega', title: 'Seguimos juntos depois da entrega.', description: 'Ajustes e próximos passos combinados com você, no seu ritmo.' },
] as const;

const escapeSvg = (value: string) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

function wrap(text: string, limit: number) {
  return text.split(/\s+/).reduce<string[]>((lines, word) => {
    const last = lines.length - 1;
    if (last < 0 || lines[last].length + word.length + 1 > limit) lines.push(word);
    else lines[last] += ` ${word}`;
    return lines;
  }, []);
}

/** The original card (solid colour, large title and description) with a glass sheen: a diagonal light, a soft streak and a bright top rim. */
function supportImage(card: (typeof SUPPORT_CARDS)[number], title: string, description: string) {
  const titleLines = wrap(title, 20);
  const bodyLines = wrap(description, 26);
  const heading = titleLines.map((line, index) => `<tspan x="88" y="${150 + index * 104}">${escapeSvg(line)}</tspan>`).join('');
  const bodyTop = Math.max(460, 150 + titleLines.length * 104 + 60);
  const body = bodyLines.map((line, index) => `<tspan x="88" y="${bodyTop + index * 88}">${escapeSvg(line)}</tspan>`).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="828" viewBox="0 0 1200 828"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".34"/><stop offset=".38" stop-color="#fff" stop-opacity=".06"/><stop offset=".55" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".14"/></linearGradient><linearGradient id="s" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".22"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs><rect width="1200" height="828" fill="${card.bg}"/><rect width="1200" height="828" fill="url(#g)"/><path d="M-80 828 L520 -40 L700 -40 L100 828 Z" fill="url(#s)" opacity=".7"/><rect x="0" y="0" width="1200" height="5" fill="#fff" opacity=".45"/><g fill="${card.ink}" font-family="Arial, Helvetica, sans-serif"><text font-size="100" font-weight="700" letter-spacing="-3">${heading}</text><text font-size="72" font-weight="400">${body}</text></g></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function MascotSolutions() {
  const { t } = useLocale();
  const [manualStep, setManualStep] = useState(0);
  const items = useMemo(() => SUPPORT_CARDS.map(card => {
    const title = t(card.title), description = t(card.description);
    return { id: card.id, title, description, src: supportImage(card, title, description) };
  }), [t]);

  return <section id="mascot-solutions" aria-labelledby="mascot-solutions-title" className={styles.section}>
    <div className={styles.container}>
      <h2 id="mascot-solutions-title" data-heading-static data-scroll-fill-heading className={styles.title}><ScrollFillText lines={[t('Suporte para o próximo passo.')]} /></h2>
      <ScrollReveal><p className={styles.intro}>{t('Da escolha da placa às dúvidas sobre o projeto, fale com a equipe da ezway.')}</p></ScrollReveal>
    </div>
    <TiltedGridHero
      images={items.map(item => ({ src: item.src, alt: `${item.title} ${item.description}` }))}
      manualStep={manualStep} className={styles.band} tileHeight={65} aspectRatio={1.45} gap={14} axis={50} curve={46} fade={12} speed={6}
      role="region" aria-label={t('Suporte da ezway')} aria-roledescription={t('Carrossel')}
    />
    <div className={styles.controls}>
      <button type="button" aria-label={t('Suporte anterior')} onClick={() => setManualStep(value => value - 1)}><ArrowLeft size={18} aria-hidden="true" /></button>
      <button type="button" aria-label={t('Próximo suporte')} onClick={() => setManualStep(value => value + 1)}><ArrowRight size={18} aria-hidden="true" /></button>
    </div>
    {/* The curved band repeats decorative slices; expose each message just once. */}
    <ul className="sr-only">{items.map(item => <li key={item.id}><strong>{item.title}</strong> {item.description}</li>)}</ul>
  </section>;
}

export default MascotSolutions;
