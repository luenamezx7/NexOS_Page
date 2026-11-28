'use client';

import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import Image from 'next/image';
import { ArrowUpRight, AtSign, Bath, BadgeCheck, Bike, CalendarCheck, CarFront, Clock, Flower2, Globe, MapPin, MessageCircle, Music2, Navigation, Phone, Rotate3d, Scissors, ShoppingBag, Sparkles, Star, UtensilsCrossed, type LucideIcon } from 'lucide-react';
import { Scribble } from '../ui/scribble';
import { ScrollCue } from '../ui/scroll-cue';
import { useLocale } from '@/lib/locale';
import { commercialHref } from '@/lib/commercial';
import { usePresentationGate } from '@/lib/use-presentation-active';
import { usePrefersReducedMotion } from '@/lib/use-prefers-reduced-motion';
import { motionError, recordMotion } from '@/lib/motion-diagnostics';
import { Button } from '../ui/cnippet-button';
import { Iphone15Pro } from '../ui/iphone-15-pro';
import { ScrollFillText } from '../ui/scroll-fill-headline';
import styles from './MiniSites.module.css';

/* Container units compose each preview at the shared frame's 393 × 852 screen
   ratio (screen height = 216.8cqi). Every phone shows the same Mini-Site model
   for a different fictitious business: links, catalogue, Google reviews and
   Google Maps. The page is taller than the screen and drifts slowly up and
   back down while the stage is on screen. Photos: public/examples (Unsplash). */

type Item = { name: string; detail?: string; price: string; img?: string; icon?: LucideIcon };
type Review = { name: string; img?: string; initial?: string; color?: string; when: string; text: string };
type Site = {
  theme: string;
  name: string;
  category: string;
  cover?: string;
  avatar?: string;
  rating: string;
  count: string;
  links: [LucideIcon, string][];
  catalogueTitle: string;
  layout: 'grid' | 'rows';
  items: Item[];
  bars: number[];
  reviews: Review[];
  address: string;
  hours: string;
  delay: string;
};

const sites = {
  restaurant: {
    theme: 'restaurant', name: 'Brasa Viva', category: 'Restaurante · Parrilla · Pinheiros', rating: '4,8', count: '1.326',
    links: [[CalendarCheck, 'Reservar mesa'], [UtensilsCrossed, 'Ver cardápio completo'], [Bike, 'Pedir delivery'], [MessageCircle, 'Falar no WhatsApp']],
    catalogueTitle: 'Mais pedidos', layout: 'rows',
    items: [
      { img: 'dish', name: 'Picanha na brasa', detail: 'Farofa, vinagrete e chimichurri', price: 'R$ 89' },
      { img: 'pizza', name: 'Pizza de fermentação', detail: 'Massa de 48 h, forno a lenha', price: 'R$ 64' },
      { img: 'burger', name: 'Burger da casa', detail: 'Blend 180 g e queijo da serra', price: 'R$ 42' },
      { img: 'bowl', name: 'Bowl verde', detail: 'Tofu grelhado e legumes', price: 'R$ 38' },
    ],
    bars: [86, 9, 3, 1, 1],
    reviews: [
      { img: 'woman', name: 'Camila R.', when: 'há 2 dias', text: 'Carne no ponto perfeito e atendimento atencioso. Reservei pelo site em um minuto.' },
      { img: 'man', name: 'Rafael M.', when: 'há 1 semana', text: 'A melhor parrilla do bairro. Vale cada centavo!' },
    ],
    address: 'Rua das Palmeiras, 410 · Pinheiros', hours: 'Aberto · fecha às 23h', delay: '0s',
  },
  pet: {
    theme: 'pet', name: 'Patas Clube', category: 'Banho e tosa · Vila Mariana', cover: 'dog', avatar: 'dog', rating: '4,9', count: '612',
    links: [[CalendarCheck, 'Agendar banho'], [MessageCircle, 'Falar no WhatsApp'], [CarFront, 'Táxi dog'], [MapPin, 'Como chegar']],
    catalogueTitle: 'Serviços e preços', layout: 'rows',
    items: [
      { icon: Bath, name: 'Banho', detail: 'Porte pequeno', price: 'R$ 60' },
      { icon: Scissors, name: 'Banho e tosa', detail: 'Tosa na tesoura ou máquina', price: 'R$ 95' },
      { icon: Sparkles, name: 'Hidratação', detail: 'Pelos macios por semanas', price: 'R$ 40' },
      { icon: CarFront, name: 'Táxi dog', detail: 'Busca e entrega no bairro', price: 'R$ 25' },
    ],
    bars: [91, 6, 2, 1, 0],
    reviews: [
      { img: 'woman2', name: 'Júlia P.', when: 'há 3 dias', text: 'O Thor voltou cheiroso e tranquilo. Equipe super carinhosa.' },
      { initial: 'M', color: '#7c3aed', name: 'Marcos T.', when: 'há 2 semanas', text: 'Agendei pelo link da bio e ainda usei o táxi dog. Prático demais.' },
    ],
    address: 'Rua Domingos de Morais, 1820 · Vila Mariana', hours: 'Aberto · fecha às 19h', delay: '-11s',
  },
  florist: {
    theme: 'florist', name: 'Ateliê Flora', category: 'Flores e plantas · Jardins', cover: 'florist', avatar: 'plants', rating: '5,0', count: '384',
    links: [[ShoppingBag, 'Ver catálogo'], [MessageCircle, 'Encomendar no WhatsApp'], [Flower2, 'Assinatura de flores'], [MapPin, 'Como chegar']],
    catalogueTitle: 'Catálogo', layout: 'grid',
    items: [
      { img: 'florist', name: 'Buquê da estação', price: 'R$ 120' },
      { img: 'plants', name: 'Kit suculentas', price: 'R$ 59' },
      { img: 'interior', name: 'Vaso + planta', price: 'R$ 149' },
      { img: 'living', name: 'Jardim interno', price: 'R$ 390' },
    ],
    bars: [96, 4, 0, 0, 0],
    reviews: [
      { initial: 'L', color: '#0f766e', name: 'Larissa C.', when: 'há 5 dias', text: 'Buquê lindo e entregue no horário certinho. Recomendo!' },
      { img: 'man', name: 'André S.', when: 'há 1 mês', text: 'Montaram um jardim no meu apartamento. Ficou incrível.' },
    ],
    address: 'Alameda Lorena, 905 · Jardins', hours: 'Aberto · fecha às 18h', delay: '-19s',
  },
} satisfies Record<string, Site>;

function GoogleG() {
  return <svg className={styles.googleG} viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#ea4335" d="M24 9.5c3.5 0 6.7 1.2 9.2 3.6l6.9-6.9C35.9 2.4 30.4 0 24 0 14.6 0 6.6 5.4 2.7 13.3l8 6.2C12.6 13.6 17.8 9.5 24 9.5Z" />
    <path fill="#4285f4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.2 5.3-4.6 6.9l7.5 5.8c4.4-4 6.8-10 6.8-17.2Z" />
    <path fill="#fbbc05" d="M10.7 28.5c-.5-1.4-.8-2.9-.8-4.5s.3-3.1.8-4.5l-8-6.2C1 16.6 0 20.2 0 24s1 7.4 2.7 10.7l8-6.2Z" />
    <path fill="#34a853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.8 2.3-8.4 2.3-6.2 0-11.4-4.1-13.3-9.7l-8 6.2C6.6 42.6 14.6 48 24 48Z" />
  </svg>;
}

const Stars = () => <span className={styles.stars}>{Array.from({ length: 5 }, (_, i) => <Star key={i} fill="currentColor" />)}</span>;

function RatingChip({ site }: { site: Site }) {
  const { t } = useLocale();
  return <span className={styles.ratingChip}><GoogleG /><b>{site.rating}</b><Star aria-hidden="true" fill="currentColor" /><small>{site.count} {t('avaliações')}</small></span>;
}

/** Plate on a turntable: a porcelain disc tilted in perspective, a few stacked
 *  layers for thickness and the dish photo raised in two tiers for volume. */
function Dish3D() {
  return <div className={styles.dishStage} aria-hidden="true">
    <span className={styles.dishGlow} />
    <span className={styles.dishShadow} />
    <div className={styles.plateFloat}>
      <div className={styles.plate}>
        <span className={styles.plateEdge} style={{ '--z': 3 } as CSSProperties} />
        <span className={styles.plateEdge} style={{ '--z': 2 } as CSSProperties} />
        <span className={styles.plateEdge} style={{ '--z': 1 } as CSSProperties} />
        <span className={styles.plateTop} />
        <span className={styles.plateFood} />
        <span className={styles.plateMound} />
      </div>
    </div>
    <span className={styles.steam}><i /><i /><i /></span>
  </div>;
}

function MapCard({ site }: { site: Site }) {
  const { t } = useLocale();
  return <div className={styles.mapCard}>
    <svg className={styles.map} viewBox="0 0 200 110" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect width="200" height="110" fill="#e8f0e6" />
      <path d="M0 80 Q60 70 110 86 T200 74" stroke="#bcd7f0" strokeWidth="12" fill="none" />
      <path d="M-5 28 L210 44 M40 -5 L58 125 M120 -5 L132 125 M-5 100 L210 94" stroke="#fff" strokeWidth="6" />
      <path d="M84 -5 L92 125 M-5 60 L210 58" stroke="#fde68a" strokeWidth="5" />
      <rect x="62" y="6" width="20" height="16" rx="2" fill="#d4e4cf" /><rect x="138" y="10" width="26" height="22" rx="2" fill="#d4e4cf" /><rect x="10" y="36" width="24" height="16" rx="2" fill="#d4e4cf" /><rect x="146" y="64" width="30" height="18" rx="2" fill="#d4e4cf" />
      <circle className={styles.mapPulse} cx="100" cy="46" r="14" fill="#ea4335" />
      <path d="M100 28c-6 0-10 4.4-10 10 0 7.6 10 17 10 17s10-9.4 10-17c0-5.6-4-10-10-10Z" fill="#ea4335" /><circle cx="100" cy="38" r="3.6" fill="#fff" />
    </svg>
    <div className={styles.place}>
      <b>{site.name}</b>
      <span className={styles.placeScore}>{site.rating} <Stars /> <small>({site.count})</small></span>
      <small className={styles.placeMeta}><Clock aria-hidden="true" />{t(site.hours)}</small>
      <small className={styles.placeAddress}><MapPin aria-hidden="true" />{site.address}</small>
      <span className={styles.placeActions}><b><Navigation aria-hidden="true" />{t('Rotas')}</b><i><Phone aria-hidden="true" />{t('Ligar')}</i><i><Globe aria-hidden="true" />{t('Site')}</i></span>
    </div>
  </div>;
}

function SiteScreen({ site, hero }: { site: Site; hero?: ReactNode }) {
  const { t } = useLocale();
  return <div className={`${styles.screenViewport} ${styles[site.theme]}`} style={{ '--ms-delay': site.delay } as CSSProperties}>
    <span className={styles.statusScrim} aria-hidden="true" />
    <div className={styles.scroller} data-mini-site-scroller>
      {hero ?? <div className={styles.profile}>
        {site.cover && <span className={styles.cover}><Image src={`/examples/${site.cover}.jpg`} alt="" fill sizes="260px" /></span>}
        {site.avatar && <span className={styles.avatar}><Image src={`/examples/${site.avatar}.jpg`} alt="" fill sizes="80px" /></span>}
        <p className={styles.name}>{site.name} <BadgeCheck aria-hidden="true" /></p>
        <p className={styles.category}>{t(site.category)}</p>
        <RatingChip site={site} />
      </div>}

      <ul className={styles.links}>{site.links.map(([Icon, label], index) => <li key={label} data-primary={index === 0 || undefined}><Icon /><span>{t(label)}</span><ArrowUpRight /></li>)}</ul>

      <div className={styles.block}>
        <p className={styles.blockTitle}>{t(site.catalogueTitle)}</p>
        {site.layout === 'grid'
          ? <ul className={styles.grid}>{site.items.map(item => <li key={item.name}>
            <span className={styles.gridPhoto}><Image src={`/examples/${item.img}.jpg`} alt="" fill sizes="100px" /></span>
            <span className={styles.itemName}>{t(item.name)}</span>
            <span className={styles.gridPrice}>{item.price}<i>+</i></span>
          </li>)}</ul>
          : <ul className={styles.rows}>{site.items.map(({ icon: Icon, ...item }) => <li key={item.name}>
            <span className={styles.rowThumb}>{item.img ? <Image src={`/examples/${item.img}.jpg`} alt="" fill sizes="60px" /> : Icon && <Icon aria-hidden="true" />}</span>
            <span className={styles.rowText}><b className={styles.itemName}>{t(item.name)}</b>{item.detail && <small>{t(item.detail)}</small>}</span>
            <span className={styles.rowPrice}>{item.price}</span>
          </li>)}</ul>}
      </div>

      <div className={`${styles.block} ${styles.googleCard}`}>
        <span className={styles.googleHead}><GoogleG /><b>{t('Avaliações no Google')}</b></span>
        <div className={styles.googleSummary}>
          <span className={styles.googleScore}><b>{site.rating}</b><Stars /><small>{site.count} {t('avaliações')}</small></span>
          <span className={styles.googleBars}>{site.bars.map((value, index) => <span key={index}><small>{5 - index}</small><i style={{ '--w': `${value}%` } as CSSProperties} /></span>)}</span>
        </div>
        <ul className={styles.reviews}>{site.reviews.map(review => <li key={review.name}>
          <span className={styles.reviewHead}>
            <span className={styles.reviewAvatar} style={{ background: review.color }}>{review.img ? <Image src={`/examples/${review.img}.jpg`} alt="" fill sizes="28px" /> : review.initial}</span>
            <span className={styles.reviewWho}><b>{review.name}</b><span><Stars /><small>{t(review.when)}</small></span></span>
          </span>
          <small className={styles.reviewText}>{t(review.text)}</small>
        </li>)}</ul>
        <span className={styles.googleCta}><Star aria-hidden="true" />{t('Avaliar no Google')}</span>
      </div>

      <div className={styles.block}>
        <p className={styles.blockTitle}>{t('Onde estamos')}</p>
        <MapCard site={site} />
      </div>

      <div className={styles.footer} aria-hidden="true"><span><AtSign /><Music2 /><Globe /></span><small>{site.name} · {t('feito com ezway')}</small></div>
    </div>
  </div>;
}

function RestaurantHero() {
  const { t } = useLocale();
  const site = sites.restaurant;
  return <div className={styles.restaurantHero}>
    <span className={styles.brandRow}>
      <span className={styles.brandMark}>BV</span>
      <span><b>{site.name}</b><small>{t(site.category)}</small></span>
    </span>
    <RatingChip site={site} />
    <Dish3D />
    <span className={styles.dishBadge}><Rotate3d aria-hidden="true" />{t('Prato em 3D')}</span>
    <p className={styles.dishKicker}>{t('Prato da casa')}</p>
    <p className={styles.dishName}>{t('Picanha na brasa')}</p>
    <p className={styles.dishMeta}>{t('Farofa, vinagrete e chimichurri')} · <b>R$ 89</b></p>
  </div>;
}

export function MiniSites() {
  const { t } = useLocale();
  const stageRef = useRef<HTMLDivElement>(null);
  const presenting = usePresentationGate();
  const reduced = usePrefersReducedMotion();

  /* The pages inside the phones only drift while the stage is on screen. */
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || reduced) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) stage.dataset.playing = 'true';
      else delete stage.dataset.playing;
    }, { rootMargin: '10% 0px' });
    observer.observe(stage);
    return () => { observer.disconnect(); delete stage.dataset.playing; };
  }, [reduced]);

  useEffect(() => {
    if (presenting || reduced) return;
    let disposed = false;
    let revert = () => {};
    void Promise.all([import('gsap'), import('gsap/ScrollTrigger')]).then(([{ gsap }, { ScrollTrigger }]) => {
      const stage = stageRef.current;
      if (disposed || !stage) return;
      gsap.registerPlugin(ScrollTrigger);
      const sides = stage.querySelectorAll('[data-mini-site-side]');
      const context = gsap.context(() => {
        gsap.fromTo(sides, { xPercent: 0, yPercent: 0, rotation: 0, scale: 1 }, {
          xPercent: index => (index === 0 ? -1 : 1) * (innerWidth < 768 ? 34 : 40),
          yPercent: 3, rotation: index => index === 0 ? -5 : 5, scale: .94,
          ease: 'power2.out',
          scrollTrigger: { id: 'mini-sites-phones', trigger: stage, start: 'clamp(top 85%)', end: 'clamp(top 38%)', scrub: .65, invalidateOnRefresh: true },
        });
      }, stage);
      stage.dataset.fanReady = 'true';
      revert = () => { context.revert(); delete stage.dataset.fanReady; };
    }).catch(error => recordMotion('miniSitesGsap', 'initialization-error', motionError(error)));
    return () => { disposed = true; revert(); };
  }, [presenting, reduced]);

  return <section id="mini-sites" className={styles.section} aria-labelledby="mini-sites-title">
    <div className={styles.inner}>
      <div className={styles.copy}>
        <h2 id="mini-sites-title" data-heading-static data-scroll-fill-heading className={styles.title}><Scribble><ScrollFillText lines={[t('Mini-Sites')]} /></Scribble></h2>
        <p className={styles.lead}>{t('Seu catálogo e seus links. No mesmo endereço.')}</p>
        <p className={styles.description}>{t('Sites simples, bonitos e objetivos para apresentar seus produtos e organizar seus links. Coloque na bio do Instagram e facilite o próximo passo de quem chega até você.')}</p>
        <ul className={styles.uses}>
          <li>{t('Links da bio: WhatsApp, agenda, redes e rotas')}</li>
          <li>{t('Catálogo de produtos ou serviços com preços')}</li>
          <li>{t('Avaliações do Google e mapa para chegar até você')}</li>
        </ul>
      </div>
      <div className={styles.example}>
        <div ref={stageRef} className={styles.mockups} data-mini-site-mockups>
          <div className={`${styles.phoneAnchor} ${styles.leftPhone}`} aria-hidden="true">
            <div className={styles.phoneMotion} data-mini-site-side="left"><Iphone15Pro><SiteScreen site={sites.pet} /></Iphone15Pro></div>
          </div>
          <div className={`${styles.phoneAnchor} ${styles.rightPhone}`} aria-hidden="true">
            <div className={styles.phoneMotion} data-mini-site-side="right"><Iphone15Pro><SiteScreen site={sites.florist} /></Iphone15Pro></div>
          </div>
          <div id="mini-site-preview" className={`${styles.phoneAnchor} ${styles.centerPhone}`} role="group" aria-label={t('Exemplo ilustrativo de Mini-Site')}>
            <Iphone15Pro><SiteScreen site={sites.restaurant} hero={<RestaurantHero />} /></Iphone15Pro>
          </div>
        </div>
      </div>
      <div className={styles.action}>
        <Button size="xl" render={<a href={commercialHref(t('Olá! Quero um Mini-Site para apresentar meu catálogo e organizar os links da bio do Instagram.'))} target="_blank" rel="noopener noreferrer" />} data-cta-section="mini-sites" data-cta-solution="biolink">{t('Quero meu Mini-Site')}</Button>
      </div>
    </div>
    <ScrollCue tone="dark" />
  </section>;
}
