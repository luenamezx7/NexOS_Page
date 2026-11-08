'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight, Nfc } from 'lucide-react';
import { commercialHref } from '@/lib/commercial';
import { useLocale } from '@/lib/locale';
import { HighlightedText } from './highlighted-text';
import styles from './DigitalSolutions.module.css';

const menu = {
  Cafés: [{ name: 'Espresso da casa', price: 'R$ 9' }, { name: 'Cappuccino', price: 'R$ 14' }, { name: 'Café coado', price: 'R$ 10' }],
  Comidas: [{ name: 'Croissant de manteiga', price: 'R$ 16' }, { name: 'Toast da casa', price: 'R$ 22' }, { name: 'Bolo do dia', price: 'R$ 15' }],
} as const;

function MenuPreview() {
  const { t } = useLocale();
  const [category, setCategory] = useState<keyof typeof menu>('Cafés');
  return <div className={styles.demoPhone}>
    <div className={styles.menuHero}><Image src="/ezway-demo-cafe.jpg" alt={t('Café servido em uma cafeteria fictícia')} fill sizes="(max-width: 767px) 90vw, 480px" /><span>grão & casa <small>CAFÉ DE BAIRRO · EXEMPLO</small></span></div>
    <div className={styles.menuBody}><p>{t('Bem-vindo. Escolha o que combina com seu momento.')}</p><div className={styles.categories} role="group" aria-label={t('Categorias do cardápio')}>{(Object.keys(menu) as Array<keyof typeof menu>).map(item => <button type="button" key={item} aria-pressed={category === item} onClick={() => setCategory(item)}>{t(item)}</button>)}</div><ul aria-live="polite">{menu[category].map((item, i) => <li key={item.name}><span>{String(i + 1).padStart(2, '0')}</span>{t(item.name)} <strong>{item.price}</strong></li>)}</ul><small>{t('Marca e cardápio fictícios · exemplo ilustrativo')}</small></div>
  </div>;
}

function PortfolioPreview() {
  const { t } = useLocale();
  return <div className={styles.portfolioDemo}>
    <div className={styles.portfolioTop}><strong>forma<span>.</span>estúdio</strong><span>{t('Projetos')} &nbsp; / &nbsp; {t('Contato')}</span></div>
    <div className={styles.portfolioImage}><Image src="/ezway-demo-studio.jpg" alt={t('Ambiente de trabalho para o portfólio fictício de um estúdio criativo')} fill sizes="(max-width: 767px) 90vw, 600px" /></div>
    <div className={styles.portfolioBottom}><small>01 / 03 &nbsp; · &nbsp; {t('EXEMPLO ILUSTRATIVO')}</small><strong>{t('Ideias que ganham forma.')}</strong><span>{t('Identidade · digital · espaços')}</span></div>
  </div>;
}

function EzwayPreview() {
  const { t } = useLocale();
  return <div className={styles.ezwayDemo}><Nfc size={36} aria-hidden="true" /><strong>ez<span>way</span></strong><p>{t('Você escolhe o destino. A gente cria o caminho até ele.')}</p><span>{t('Placa NFC · Cardápio · Site · Portfólio')}</span></div>;
}

const scenes = [
  { question: 'Cardápio?', description: 'Seu cliente consulta opções pelo celular, sem esperar um cardápio impresso.', href: '/cardapio-digital', link: 'Ver cardápios digitais' },
  { question: 'Portfólio?', description: 'Seu trabalho apresentado com clareza, projetos e um jeito fácil de entrar em contato.', href: '/criacao-de-sites', link: 'Ver sites e portfólios' },
  { question: 'A ezway também faz para você.', description: 'Já tem um link? A placa pode levar até ele. Precisa de um cardápio ou site? Criamos com você.', href: '', link: 'Conversar sobre meu projeto' },
] as const;

export function Services({ className = '', selectedUse }: { className?: string; selectedUse?: string }) {
  const { t } = useLocale();
  const ref = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (!ref.current) return;
    let disposed = false;
    let cleanup = () => {};
    void Promise.all([import('gsap'), import('gsap/ScrollTrigger')]).then(([{ gsap }, { ScrollTrigger }]) => {
      if (disposed || !ref.current) return;
      gsap.registerPlugin(ScrollTrigger);
      const mm = gsap.matchMedia();
      mm.add('(min-width: 768px) and (prefers-reduced-motion: no-preference)', () => {
        const steps = gsap.utils.toArray<HTMLElement>('[data-services-step]', ref.current!);
        steps.forEach((step, i) => {
          ScrollTrigger.create({ trigger: step, start: 'top center', end: 'bottom center', onEnter: () => setActive(i), onEnterBack: () => setActive(i) });
          gsap.fromTo(step, { y: 30, opacity: .65 }, { y: 0, opacity: 1, ease: 'none', scrollTrigger: { trigger: step, start: 'top 85%', end: 'top 45%', scrub: .5 } });
        });
      });
      cleanup = () => mm.revert();
    });
    return () => { disposed = true; cleanup(); };
  }, []);

  const visuals = [<MenuPreview key="menu" />, <PortfolioPreview key="portfolio" />, <EzwayPreview key="ezway" />];
  return <section ref={ref} id="services" aria-labelledby="services-title" className={`${styles.journey} ${className}`}>
    <div className={styles.journeyContainer}>
      <header className={styles.journeyHeader}><span className={styles.journeyKicker}>{t('Depois da placa')}</span><h2 id="services-title">{t('O que seu cliente encontra')} <HighlightedText inView from="left">{t('depois da placa?')}</HighlightedText></h2><p>{t('Um toque abre o destino que você escolher. Veja como isso pode aparecer para o seu cliente.')}</p>{selectedUse && <small>{t('Você escolheu:')} {t(selectedUse)}</small>}</header>
      <div className={styles.journeyGrid}>
        <div className={styles.steps}>{scenes.map((scene, i) => <article key={scene.question} data-services-step className={styles.step}><span className={styles.stepNumber}>0{i + 1} / 03</span><h3>{t(scene.question)}</h3><p>{t(scene.description)}</p><Link href={scene.href || commercialHref('Olá! Quero conversar sobre um projeto digital com a ezway.')} target={scene.href ? undefined : '_blank'} rel={scene.href ? undefined : 'noopener noreferrer'}>{t(scene.link)} <ArrowUpRight size={17} aria-hidden="true" /></Link><div className={styles.mobileVisual}>{visuals[i]}</div></article>)}</div>
        <div className={styles.stage} data-journey-visual>{visuals.map((visual, i) => <div className={styles.stageScene} key={i} data-active={i === active} aria-hidden={i !== active} inert={i !== active}>{visual}</div>)}</div>
      </div>
    </div>
  </section>;
}
