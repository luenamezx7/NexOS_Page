'use client';

import { useCallback, useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from 'react';
import Image from 'next/image';
import { ArrowLeft, ArrowRight, ArrowUpRight, Check, Pause, Play, Star } from 'lucide-react';
import { GradientWave } from './ui/gradient-wave';
import { ScrollFillText } from './ui/scroll-fill-headline';
import { Button } from './ui/cnippet-button';
import { usePrefersReducedMotion } from '@/lib/use-prefers-reduced-motion';
import { useLocale } from '@/lib/locale';
import { usePresentationGate } from '@/lib/use-presentation-active';
import { commercialHref } from '@/lib/commercial';
import styles from './Services.module.css';

/*
 * Product presentation for sites, menus and pages.
 *
 * The screens advance on their own while the section is visible — independent
 * of scroll position (no pinning, no scrub, no artificial scroll distance).
 * Timing has a single source: the active item's CSS progress animation. Its
 * `animationend` advances the slide; pausing sets `animation-play-state`, so
 * resuming continues from the same point instead of skipping slides.
 */

const waveColors = ['#ff3f9f', '#ffb8db', '#e92387', '#ff70b7'] as const;
const SLIDE_MS = 4800;

const slides = [
  { id: 'site', kind: 'Site vitrine', title: 'Sua empresa apresentada por inteiro.', description: 'Serviços, diferenciais e formas de contato reunidos em um endereço próprio, com a identidade do seu negócio.', tags: ['Apresentação da empresa', 'Serviços e contato'] },
  { id: 'menu', kind: 'Cardápio digital', title: 'Itens fáceis de consultar no celular.', description: 'Categorias e descrições organizadas, acessadas por link, QR Code ou placa NFC no balcão.', tags: ['Categorias organizadas', 'Acesso por QR Code e NFC'] },
  { id: 'portfolio', kind: 'Portfólio', title: 'Seu trabalho com contexto.', description: 'Projetos apresentados com imagem, descrição e um caminho claro para quem quer conversar com você.', tags: ['Projetos por tipo', 'Caminho para contato'] },
  { id: 'landing', kind: 'Landing page', title: 'Uma oferta, um próximo passo.', description: 'Uma página dedicada a um objetivo: a mensagem concentrada e a ação principal sempre à vista.', tags: ['Página focada', 'Chamada para ação'] },
] as const;

function SiteScreen() {
  const { t } = useLocale();
  return <div className={`${styles.screen} ${styles.siteScreen}`}>
    <div className={styles.siteNav}><strong><i aria-hidden="true" />sorriso<span>vivo</span></strong><span className={styles.siteLinks}><span>{t('Tratamentos')}</span><span>{t('Equipe')}</span><span>{t('Convênios')}</span></span><span className={styles.siteNavCta}>{t('Agendar avaliação')}</span></div>
    <div className={styles.siteHero}>
      <div className={styles.siteHeroCopy}>
        <span className={styles.siteKicker}>{t('Odontologia integrada · Pinheiros')}</span>
        <strong>{t('Seu sorriso em boas mãos, do check-up à lente.')}</strong>
        <span className={styles.siteHeroLead}>{t('Atendimento sem pressa, tecnologia digital e um plano claro desde a primeira consulta.')}</span>
        <span className={styles.siteHeroActions}><b>{t('Agendar avaliação')}<ArrowUpRight aria-hidden="true" /></b><span><Star aria-hidden="true" fill="currentColor" />4,9 · {t('612 avaliações')}</span></span>
      </div>
      <div className={styles.siteHeroPhoto}><Image src="/examples/dentist.jpg" alt="" fill sizes="(max-width: 1023px) 40vw, 300px" className={styles.cover} /></div>
    </div>
    <div className={styles.siteCards}>{[['Clareamento', 'a partir de R$ 690'], ['Implantes', 'avaliação gratuita'], ['Ortodontia', 'alinhadores invisíveis']].map(([name, detail]) => <span key={name}><strong>{t(name)}</strong><small>{t(detail)}</small></span>)}</div>
  </div>;
}

function MenuScreen() {
  const { t } = useLocale();
  const items = [['Smash da Casa', 'Duplo blend, cheddar e cebola caramelizada', 'R$ 39', 'burger'], ['Pizza Calabresa', 'Massa de fermentação lenta', 'R$ 62', 'pizza'], ['Bowl Fit', 'Frango grelhado, grãos e legumes', 'R$ 34', 'bowl'], ['Torta da Vó', 'Chocolate meio amargo', 'R$ 18', 'cake']];
  return <div className={`${styles.screen} ${styles.menuScreen}`}>
    <aside className={styles.menuSide}><strong>brasa<span>&amp;</span>co.</strong>{['Destaques', 'Burgers', 'Pizzas', 'Saudáveis', 'Sobremesas'].map((name, index) => <span key={name} data-active={index === 0}>{t(name)}</span>)}<small>{t('Aberto hoje')}<br />18h – 00h</small></aside>
    <div className={styles.menuMain}>
      <div className={styles.menuBanner}><Image src="/examples/burger.jpg" alt="" fill sizes="(max-width: 1023px) 60vw, 420px" className={styles.cover} /><strong>{t('Brasa de verdade. Sabor que volta.')}</strong><span>{t('Frete grátis acima de R$ 80')}</span></div>
      <div className={styles.menuHeading}><strong>{t('Destaques da semana')}</strong><span>{t('Peça pelo QR Code da mesa')}</span></div>
      <ul className={styles.menuGrid}>{items.map(([name, detail, price, img]) => <li key={name}><span className={styles.menuPhoto}><Image src={`/examples/${img}.jpg`} alt="" fill sizes="120px" className={styles.cover} /></span><strong>{t(name)}</strong><small>{t(detail)}</small><span className={styles.menuPrice}>{price}<i aria-hidden="true">+</i></span></li>)}</ul>
    </div>
  </div>;
}

function PortfolioScreen() {
  const { t } = useLocale();
  return <div className={`${styles.screen} ${styles.portfolioScreen}`}>
    <div className={styles.folioNav}><strong>Estúdio Raiz</strong><span>{t('Projetos')}</span><span>{t('Sobre')}</span><span>{t('Contato')}</span></div>
    <div className={styles.folioIntro}><strong>{t('Arquitetura que respeita o lugar e quem vive nele.')}</strong><span>{t('48 projetos · residencial e comercial')}</span></div>
    <div className={styles.folioGrid}>{[['interior', 'Casa Alto de Pinheiros', '2026'], ['living', 'Apartamento Jardins', '2025'], ['cafe-interior', 'Café Vila Nova', '2025'], ['florist', 'Ateliê Flora', '2024']].map(([img, name, year]) => <figure key={img}><span><Image src={`/examples/${img}.jpg`} alt="" fill sizes="(max-width: 1023px) 30vw, 180px" className={styles.cover} /></span><figcaption><b>{t(name)}</b><small>{year}</small></figcaption></figure>)}</div>
  </div>;
}

function LandingScreen() {
  const { t } = useLocale();
  return <div className={`${styles.screen} ${styles.landingScreen}`}>
    <Image src="/examples/yoga.jpg" alt="" fill sizes="(max-width: 1023px) 80vw, 560px" className={styles.cover} />
    <div className={styles.landingCopy}>
      <span className={styles.landingEyebrow}>{t('Lua Yoga · Vila Madalena')}</span>
      <strong>{t('Respire fundo. Sua primeira aula é grátis.')}</strong>
      <p>{t('Turmas para iniciantes de manhã e à noite, com professoras certificadas.')}</p>
      <ul>{['Turmas de até 8 alunos', 'Tapete e acessórios inclusos', 'Cancelamento sem multa'].map(item => <li key={item}>{t(item)}</li>)}</ul>
      <span className={styles.landingCta}>{t('Agendar aula experimental')}<ArrowUpRight aria-hidden="true" /></span>
    </div>
  </div>;
}

/* Floating companions for each example: a phone view of the same page and a
   status chip. They live outside the screen so they can overlap its edges. */
const floats = {
  site: { img: 'dentist', phoneTitle: 'Seu sorriso em boas mãos.', phoneCta: 'Agendar', tone: '#0f766e', chip: ['Consulta agendada', 'Quinta, 10h · Dra. Lívia'] },
  menu: { img: 'burger', phoneTitle: 'Smash da Casa', phoneCta: 'Adicionar · R$ 39', tone: '#ea580c', chip: ['Pedido #482 confirmado', 'Mesa 12 · preparando'] },
  portfolio: { img: 'living', phoneTitle: 'Apartamento Jardins', phoneCta: 'Ver projeto', tone: '#3f3a2f', chip: ['Novo contato pelo site', 'Orçamento de reforma'] },
  landing: { img: 'yoga', phoneTitle: 'Sua primeira aula é grátis.', phoneCta: 'Quero agendar', tone: '#7c3aed', chip: ['Vaga garantida!', 'Sábado, 9h · Turma iniciante'] },
} as const;

function Floats({ id }: { id: keyof typeof floats }) {
  const { t } = useLocale();
  const f = floats[id];
  return <>
    <div className={styles.floatPhone} style={{ '--tone': f.tone } as CSSProperties}>
      <span className={styles.floatIsland} />
      <span className={styles.floatPhoto}><Image src={`/examples/${f.img}.jpg`} alt="" fill sizes="120px" className={styles.cover} /></span>
      <strong>{t(f.phoneTitle)}</strong>
      <span className={styles.floatLines}><i /><i /></span>
      <b>{t(f.phoneCta)}</b>
    </div>
    <div className={styles.floatChip} style={{ '--tone': f.tone } as CSSProperties}><span><Check aria-hidden="true" /></span><span><b>{t(f.chip[0])}</b><small>{t(f.chip[1])}</small></span></div>
  </>;
}

const screens = { site: SiteScreen, menu: MenuScreen, portfolio: PortfolioScreen, landing: LandingScreen } as const;

export function Services({ className = '', selectedUse }: { className?: string; selectedUse?: string }) {
  const { t } = useLocale();
  const reduced = usePrefersReducedMotion();
  const presenting = usePresentationGate();
  const sectionRef = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  const [previous, setPrevious] = useState<number | null>(null);
  const [cycle, setCycle] = useState(0);
  const [userPaused, setUserPaused] = useState<boolean | null>(null);
  const [inView, setInView] = useState(false);
  const [docHidden, setDocHidden] = useState(false);
  const [holding, setHolding] = useState(false);
  const [manual, setManual] = useState(false);
  // Screens mount once visited (plus the next one): never every image up front.
  const [visited, setVisited] = useState(() => new Set([0, 1]));
  const swipe = useRef<{ x: number; y: number } | null>(null);

  // Reduced motion: no autoplay by default; the visitor may still press play.
  const paused = userPaused ?? reduced;
  const playing = !paused && inView && !docHidden && !holding && !presenting;

  useEffect(() => {
    // Watch the carousel itself, not the whole (tall) section: a ratio of the
    // section was only reached when the visitor was already leaving it.
    const target = sectionRef.current?.querySelector('#services-carousel') ?? sectionRef.current;
    if (!target) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: .4 });
    observer.observe(target);
    const visibility = () => setDocHidden(document.hidden);
    document.addEventListener('visibilitychange', visibility);
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', visibility); };
  }, []);

  const activeRef = useRef(0);
  const go = useCallback((next: number, byUser: boolean) => {
    const current = activeRef.current;
    const target = (next + slides.length) % slides.length;
    if (target === current) return;
    activeRef.current = target;
    setPrevious(current);
    setActive(target);
    setVisited(seen => seen.has(target) && seen.has((target + 1) % slides.length) ? seen : new Set([...seen, target, (target + 1) % slides.length]));
    setCycle(value => value + 1);
    setManual(byUser);
  }, []);

  useEffect(() => {
    if (!reduced || !playing) return;
    const timer = setTimeout(() => go(activeRef.current + 1, false), SLIDE_MS);
    return () => clearTimeout(timer);
  }, [reduced, playing, cycle, go]);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowRight') { event.preventDefault(); go(active + 1, true); }
    else if (event.key === 'ArrowLeft') { event.preventDefault(); go(active - 1, true); }
  };
  // Horizontal swipe on the screen only; vertical page scroll stays native (touch-action: pan-y).
  const onPointerDown = (event: PointerEvent) => { if (event.pointerType !== 'mouse') swipe.current = { x: event.clientX, y: event.clientY }; };
  const onPointerUp = (event: PointerEvent) => {
    const start = swipe.current; swipe.current = null;
    if (!start) return;
    const dx = event.clientX - start.x, dy = event.clientY - start.y;
    if (Math.abs(dx) > 44 && Math.abs(dx) > Math.abs(dy) * 1.4) go(active + (dx < 0 ? 1 : -1), true);
  };

  const current = slides[active];

  return <section ref={sectionRef} id="services" aria-labelledby="services-title" className={`${styles.section} ${className}`} data-playing={playing} style={{ '--slide-ms': `${SLIDE_MS}ms` } as CSSProperties}>
    {/* The single clock. Visual progress bars mirror it with the same duration and play state.
        Reduced motion collapses CSS durations globally, so that mode uses one timeout instead. */}
    {!reduced && <span key={cycle} className={styles.clock} aria-hidden="true" onAnimationEnd={() => go(activeRef.current + 1, false)} />}
    <GradientWave className={styles.wave} colors={waveColors} isPlaying={!presenting} noiseSpeed={.000008} noiseFrequency={[.00015, .0006]} deform={{ incline: .12, noiseAmp: 180, noiseFlow: 3 }} />
    <div className={styles.inner}>
      <div className={styles.copy}>
        <p className={styles.eyebrow}>{t('Presença digital')}</p>
        <h2 data-heading-static data-scroll-fill-heading id="services-title" className={styles.title}><ScrollFillText lines={[t('Sites, cardápios e páginas para o seu negócio.')]} /></h2>
        <p className={styles.lead}>{t('Páginas com a identidade do seu negócio, pensadas primeiro para o celular e organizadas para levar o visitante ao próximo passo.')}</p>
        <p className={styles.seo}>{t('Estrutura preparada para SEO e GEO, para ser encontrada no Google e nas buscas com IA, sem promessa de posição.')}</p>

        <div className={styles.picker} role="group" aria-label={t('Escolha um exemplo')}>
          {slides.map((slide, index) => <button key={slide.id} type="button" className={styles.pick} aria-pressed={active === index} aria-controls="services-carousel" onClick={() => go(index, true)} data-active={active === index}>
            <span className={styles.pickIndex} aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
            <span className={styles.pickBody}>
              <span className={styles.pickKind}>{t(slide.kind)}</span>
              <span className={styles.pickDetail} aria-hidden={active !== index}><span>{t(slide.description)}</span></span>
            </span>
            <span className={styles.pickProgress} aria-hidden="true">{active === index && <span key={cycle} className={styles.pickBar} />}</span>
          </button>)}
        </div>

        <div className={styles.actions}>
          <Button size="xl" render={<a href={commercialHref(t('Olá! Quero conversar sobre um site, cardápio ou página para o meu negócio.'))} target="_blank" rel="noopener noreferrer" />} data-cta-section="services" data-cta-solution="site">{t('Conversar sobre minha página')}<ArrowUpRight aria-hidden="true" /></Button>
        </div>
      </div>

      <div id="services-carousel" className={styles.stage} role="region" aria-roledescription={t('carrossel')} aria-label={t('Exemplos de sites, cardápios e páginas')} tabIndex={0} onKeyDown={onKeyDown}
        onPointerEnter={event => { if (event.pointerType === 'mouse') setHolding(true); }} onPointerLeave={() => setHolding(false)}
        onFocus={event => { if (event.currentTarget.matches(':focus-visible') || event.currentTarget.querySelector(':focus-visible')) setHolding(true); }}
        onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setHolding(false); }}>
        <div className={styles.device}>
          <div className={styles.display} onPointerDown={onPointerDown} onPointerUp={onPointerUp} onPointerCancel={() => { swipe.current = null; }}>
            {slides.map((slide, index) => {
              const Screen = screens[slide.id];
              const state = index === active ? 'active' : index === previous ? 'previous' : 'idle';
              return <div key={slide.id} className={styles.slide} data-state={state} role="group" aria-roledescription={t('slide')} aria-label={`${index + 1} ${t('de')} ${slides.length}: ${t(slide.kind)}`} aria-hidden={index !== active} inert={index !== active}>
                {visited.has(index) ? <Screen /> : null}
              </div>;
            })}
          </div>
          {slides.map((slide, index) => visited.has(index) ? <div key={slide.id} className={styles.floats} data-state={index === active ? 'active' : 'idle'} aria-hidden="true"><Floats id={slide.id} /></div> : null)}
        </div>

        <div className={styles.caption} aria-live={manual || paused ? 'polite' : 'off'} aria-atomic="true">
          <span className={styles.captionMeta}>{String(active + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')} · {t(current.kind)} · {t('Demonstração ilustrativa')}</span>
          <strong>{t(current.title)}</strong>
          <span className={styles.captionText}>{t(current.description)}</span>
          <span className={styles.tags}>{current.tags.map(tag => <span key={tag}>{t(tag)}</span>)}</span>
        </div>

        <div className={styles.controls}>
          <button type="button" className={styles.control} onClick={() => go(active - 1, true)} aria-label={t('Exemplo anterior')}><ArrowLeft aria-hidden="true" /></button>
          <span className={styles.dots} aria-hidden="true">{slides.map((slide, index) => <span key={slide.id} data-active={index === active}>{index === active && <span key={cycle} />}</span>)}</span>
          <button type="button" className={styles.control} onClick={() => go(active + 1, true)} aria-label={t('Próximo exemplo')}><ArrowRight aria-hidden="true" /></button>
          <button type="button" className={`${styles.control} ${styles.toggle}`} onClick={() => setUserPaused(!paused)} aria-pressed={paused} aria-label={paused ? t('Reproduzir apresentação') : t('Pausar apresentação')}>{paused ? <Play aria-hidden="true" /> : <Pause aria-hidden="true" />}</button>
        </div>
      </div>
    </div>
    <p className={styles.note}>{t('Exemplos ilustrativos. Páginas e funcionalidades são definidas no escopo de cada projeto.')}</p>
    {selectedUse ? <p className="sr-only">{t('Solução selecionada')}: {t(selectedUse)}</p> : null}
  </section>;
}
