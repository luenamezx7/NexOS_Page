'use client';

import { useState } from 'react';
import FlexCarousel from '../FlexCarousel/FlexCarousel';
import styles from './MascotSolutions.module.css';
import { ScrollReveal } from '../ScrollReveal';
import { BlurReveal } from '../blur-reveal';

const SOLUTIONS: { id: string; title: string; description: string; image: string; alt: string }[] = [
  {
    id: '01',
    title: 'Atendimento mais direto',
    description: 'Placa NFC na mesa: cliente aproxima o celular e abre o WhatsApp do negócio em segundos. Sem digitar número, sem buscar contato.',
    image: '/images/mascot-solutions/01-atendimento-direto.png',
    alt: 'Mascote NexOS em pé junto a um balcão, aproximando um smartphone de uma placa NFC de mesa. Ondas discretas indicam a conexão. Na tela do celular, interface simplificada de conversa com detalhe verde do WhatsApp.',
  },
  {
    id: '02',
    title: 'Sua marca bem apresentada',
    description: 'Site institucional, portfólio ou landing page: estrutura clara, identidade visual própria e foco em conversão. O cliente entende seu valor no primeiro scroll.',
    image: '/images/mascot-solutions/02-marca-apresentada.png',
    alt: 'Mascote NexOS apresentando um notebook aberto sobre pedestal minimalista. Na tela, site empresarial elegante com imagem principal, blocos organizados e detalhes violetas. Uma pata indica a tela em gesto de apresentação.',
  },
  {
    id: '03',
    title: 'Informação no lugar certo',
    description: 'Cardápio digital no celular: fotos dos pratos, preços e descrições organizadas. O pedido fica mais rápido e a cozinha recebe sem erros.',
    image: '/images/mascot-solutions/03-informacao-lugar-certo.png',
    alt: 'Mascote NexOS sentado em banco baixo, segurando smartphone voltado para o observador e apontando para a tela com a outra pata. Na tela, cardápio digital com três fotografias de pratos e linhas gráficas para nomes e preços. Pequeno apoio com xícara ao lado.',
  },
  {
    id: '04',
    title: 'Uma equipe por perto',
    description: 'Suporte humano com conversa real: diagnóstico rápido e próxima ação alinhada. Não é bot, é gente que entende seu negócio.',
    image: '/images/mascot-solutions/04-equipe-por-perto.png',
    alt: 'Mascote NexOS de corpo inteiro, levemente inclinado à frente em postura receptiva. Uma pata aberta em gesto acolhedor, a outra segura tablet fino junto ao corpo.',
  },
];

const CAROUSEL_ITEMS = SOLUTIONS.map(solution => ({
  src: solution.image,
  alt: solution.alt,
  title: solution.title,
}));

export function MascotSolutions() {
  const [active, setActive] = useState(0);

  return (
    <section id="mascot-solutions" aria-labelledby="mascot-solutions-title" className={styles.section}>
      <div className={styles.container}>
        <header className={styles.header}>
          <ScrollReveal as="p" preset="label" className={styles.kicker}>NexOS no seu dia a dia</ScrollReveal>
           <BlurReveal as="h2" id="mascot-solutions-title" inView speedReveal={3}>Pequenas conexões. Soluções de verdade.</BlurReveal>
          <ScrollReveal as="p" delay={.08}>Do primeiro contato à presença digital, veja onde podemos ajudar seu negócio.</ScrollReveal>
        </header>
        <ScrollReveal preset="card" className={styles.carouselWrapper}>
          <FlexCarousel
            items={CAROUSEL_ITEMS}
            preset="liquid"
            intro="none"
            cardHeight={0.5}
            gap={12}
            radius={12}
            squeeze={0.2}
            focusOnClick
            captions
            captureWheel={false}
            onChange={setActive}
            ariaLabel="Suportes e soluções NexOS"
          />
        </ScrollReveal>
        <ScrollReveal className={styles.details}>
          <p className={styles.description}>{SOLUTIONS[active].description}</p>
          <p className={styles.hint}>Arraste para explorar · Clique para ampliar · Use as setas do teclado</p>
        </ScrollReveal>
        <ul className={styles.accessibleSolutions}>
          {SOLUTIONS.map(solution => (
            <li key={solution.id}>
              <h3>{solution.title}</h3>
              <p>{solution.description}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export default MascotSolutions;
