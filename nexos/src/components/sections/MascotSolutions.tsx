'use client';

import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRef, useState, useCallback, useEffect } from 'react';
import styles from './MascotSolutions.module.css';

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

export function MascotSolutions() {
  const stripRef = useRef<HTMLUListElement>(null);
  const [showPrev, setShowPrev] = useState(false);
  const [showNext, setShowNext] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; scrollLeft: number } | null>(null);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updateArrowVisibility = useCallback(() => {
    const strip = stripRef.current;
    if (!strip) return;
    const { scrollLeft, scrollWidth, clientWidth } = strip;
    setShowPrev(scrollLeft > 8);
    setShowNext(scrollLeft + clientWidth < scrollWidth - 8);
  }, []);

  const handleScroll = useCallback(() => {
    updateArrowVisibility();
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = setTimeout(() => { /* noop */ }, 150);
  }, [updateArrowVisibility]);

  const scrollTo = (direction: 'prev' | 'next') => {
    const strip = stripRef.current;
    if (!strip) return;
    const itemWidth = 360; // item width + gap
    const scrollAmount = direction === 'prev' ? -itemWidth : itemWidth;
    strip.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLUListElement>) => {
    const strip = stripRef.current;
    if (!strip) return;
    // Only enable drag on the track itself, not on buttons/links inside
    const target = e.target as HTMLElement;
    if (target.closest('button, a')) return;
    
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, scrollLeft: strip.scrollLeft };
    strip.style.scrollBehavior = 'auto';
    strip.setPointerCapture(e.pointerId);
    e.preventDefault();
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLUListElement>) => {
    if (!isDragging || !dragStartRef.current) return;
    const strip = stripRef.current;
    if (!strip) return;
    const dx = e.clientX - dragStartRef.current.x;
    strip.scrollLeft = dragStartRef.current.scrollLeft - dx;
  }, [isDragging]);

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLUListElement>) => {
    if (!isDragging) return;
    const strip = stripRef.current;
    if (strip) {
      strip.style.scrollBehavior = 'smooth';
      strip.releasePointerCapture(e.pointerId);
    }
    setIsDragging(false);
    dragStartRef.current = null;
  }, [isDragging]);

  useEffect(() => {
    const strip = stripRef.current;
    if (!strip) return;
    strip.addEventListener('scroll', handleScroll, { passive: true });
    updateArrowVisibility();
    return () => {
      strip.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, [handleScroll, updateArrowVisibility]);

  useEffect(() => {
    const handleResize = () => updateArrowVisibility();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [updateArrowVisibility]);

  return (
    <section id="mascot-solutions" aria-labelledby="mascot-solutions-title" className={styles.section}>
      <div className={styles.container}>
        <header className={styles.header}>
          <p className={styles.kicker}>NexOS no seu dia a dia</p>
          <h2 id="mascot-solutions-title">Pequenas conexões.<br />Soluções de verdade.</h2>
          <p>Do primeiro contato à presença digital, veja onde podemos ajudar seu negócio.</p>
        </header>
        <div className={styles.carouselWrapper}>
          <button
            type="button"
            className={`${styles.navButton} ${styles.navPrev} ${showPrev ? styles.visible : ''}`}
            onClick={() => scrollTo('prev')}
            aria-label="Solução anterior"
            disabled={!showPrev}
          >
            <ChevronLeft size={24} strokeWidth={2.5} aria-hidden="true" />
          </button>
          <ul
            ref={stripRef}
            className={styles.strip}
            aria-label="Suportes e soluções NexOS"
            tabIndex={0}
            onScroll={handleScroll}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
          >
            {SOLUTIONS.map(solution => (
              <li key={solution.id} className={styles.item}>
                <figure>
                  <div className={styles.photo}>
                    <Image
                      src={solution.image}
                      alt={solution.alt}
                      fill
                      sizes="(max-width: 767px) 75vw, 340px"
                      className={styles.photoImg}
                    />
                    <span className={styles.index} aria-hidden="true">{solution.id}</span>
                  </div>
                  <figcaption>
                    <h3>{solution.title}</h3>
                    <p>{solution.description}</p>
                  </figcaption>
                </figure>
              </li>
            ))}
          </ul>
          <button
            type="button"
            className={`${styles.navButton} ${styles.navNext} ${showNext ? styles.visible : ''}`}
            onClick={() => scrollTo('next')}
            aria-label="Próxima solução"
            disabled={!showNext}
          >
            <ChevronRight size={24} strokeWidth={2.5} aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  );
}

export default MascotSolutions;