'use client';

import Image from 'next/image';
import styles from './MascotSolutions.module.css';
import { useLocale } from '@/lib/locale';

const SOLUTIONS: { id: string; summary: string; image: string; alt: string }[] = [
  {
    id: '01',
    summary: 'Placa NFC: aproxime o celular para abrir o contato do negócio.',
    image: '/images/mascot-solutions/01-atendimento-direto.png',
    alt: 'Mascote ezway em pé junto a um balcão, aproximando um smartphone de uma placa NFC de mesa. Ondas discretas indicam a conexão. Na tela do celular, interface simplificada de conversa com detalhe verde do WhatsApp.',
  },
  {
    id: '02',
    summary: 'Sites e portfólios apresentam sua marca e seus serviços.',
    image: '/images/mascot-solutions/02-marca-apresentada.png',
    alt: 'Mascote ezway apresentando um notebook aberto sobre pedestal minimalista. Na tela, site empresarial elegante com imagem principal, blocos organizados e detalhes violetas. Uma pata indica a tela em gesto de apresentação.',
  },
  {
    id: '03',
    summary: 'Cardápios digitais organizam informações no celular.',
    image: '/images/mascot-solutions/03-informacao-lugar-certo.png',
    alt: 'Mascote ezway sentado em banco baixo, segurando smartphone voltado para o observador e apontando para a tela com a outra pata. Na tela, cardápio digital com três fotografias de pratos e linhas gráficas para nomes e preços. Pequeno apoio com xícara ao lado.',
  },
  {
    id: '04',
    summary: 'Atendimento humano para entender o que seu negócio precisa.',
    image: '/images/mascot-solutions/04-equipe-por-perto.png',
    alt: 'Mascote ezway de corpo inteiro, levemente inclinado à frente em postura receptiva. Uma pata aberta em gesto acolhedor, a outra segura tablet fino junto ao corpo.',
  },
];

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
                <Image src={solution.image} alt={t(solution.alt)} width={1610} height={977} sizes="(max-width: 767px) 78vw, 370px" loading="lazy" />
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
