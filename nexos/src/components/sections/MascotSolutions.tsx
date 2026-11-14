'use client';

import { useState } from 'react';
import { TiltedGridHero } from '../ui/tilted-grid-hero';
import { ScrollReveal } from '../ScrollReveal';
import styles from './MascotSolutions.module.css';
import { useLocale } from '@/lib/locale';

const SUPPORT_CARDS = [
  { id: 'conversation', background: '#ff168d', ink: '#09090b', title: 'Vamos entender seu negócio.', description: 'Converse com a ezway para escolher o que faz sentido para você.' },
  { id: 'guidance', background: '#09090b', ink: '#ffffff', title: 'Orientação para usar sua placa.', description: 'Conte com a equipe para entender o acesso pelo NFC e QR Code.' },
  // Same green as the site's scroll progress line.
  { id: 'destination', background: '#22c55e', ink: '#09090b', title: 'Mudou o link? Fale com a gente.', description: 'A equipe confere as opções disponíveis para o destino da sua placa.' },
  { id: 'project', background: '#7c3aed', ink: '#ffffff', title: 'Dúvidas sobre o seu projeto?', description: 'Converse com a ezway para alinhar os próximos passos.' },
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

/** Four native SVG images: solid color and localized text, with no image-generation or network cost. */
function supportImage(background: string, ink: string, title: string, description: string) {
  const titleLines = wrap(title, 20);
  const bodyLines = wrap(description, 26);
  const heading = titleLines.map((line, index) => `<tspan x="88" y="${150 + index * 104}">${escapeSvg(line)}</tspan>`).join('');
  const bodyTop = Math.max(460, 150 + titleLines.length * 104 + 60);
  const body = bodyLines.map((line, index) => `<tspan x="88" y="${bodyTop + index * 88}">${escapeSvg(line)}</tspan>`).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="828" viewBox="0 0 1200 828"><rect width="1200" height="828" fill="${background}"/><g fill="${ink}" font-family="Arial, Helvetica, sans-serif"><text font-size="100" font-weight="700" letter-spacing="-3">${heading}</text><text font-size="72" font-weight="400">${body}</text></g></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function MascotSolutions() {
  const { t } = useLocale();
  const [paused, setPaused] = useState(false);
  const items = SUPPORT_CARDS.map(item => ({ ...item, title: t(item.title), description: t(item.description) }));

  return <section id="mascot-solutions" aria-labelledby="mascot-solutions-title" className={styles.section}>
    <div className={styles.container}>
      <h2 id="mascot-solutions-title" className="mb-8 text-center text-3xl font-semibold md:text-5xl">{t('Suporte para o próximo passo.')}</h2>
      <ScrollReveal><p className={styles.intro}>{t('Da escolha da placa às dúvidas sobre o projeto, fale com a equipe da ezway.')}</p></ScrollReveal>
      <TiltedGridHero
        images={items.map(item => ({ src: supportImage(item.background, item.ink, item.title, item.description), alt: `${item.title} ${item.description}` }))}
        paused={paused} className={styles.band} tileHeight={65} aspectRatio={1.45} axis={50} curve={62} fade={14} speed={5}
        role="region" aria-label={t('Suporte da ezway')} aria-roledescription={t('Carrossel')}
      />
      <button type="button" className={styles.pause} aria-pressed={paused} onClick={() => setPaused(value => !value)}>{t(paused ? 'Retomar animação' : 'Pausar animação')}</button>
      {/* The faceted animation repeats decorative slices; expose each message just once. */}
      <ul className={styles.visuallyHidden}>{items.map(item => <li key={item.id}><strong>{item.title}</strong> {item.description}</li>)}</ul>
    </div>
  </section>;
}

export default MascotSolutions;
