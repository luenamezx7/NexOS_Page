'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ArrowRight, ArrowUpRight, Check, Clock, MapPin, MousePointer2, Search, ShoppingBag, Star, Wifi } from 'lucide-react';
import { useLocale } from '@/lib/locale';
import styles from './EcosystemScenes.module.css';

/* Illustrative brands. Every name below is fictitious; photos are Unsplash (see public/examples/SOURCES.md). */

function Stars({ value = 5, size = 11 }: { value?: number; size?: number }) {
  return <span className={styles.stars} aria-hidden="true">{Array.from({ length: 5 }, (_, i) => <Star key={i} size={size} fill={i < value ? 'currentColor' : 'none'} />)}</span>;
}

export function SiteScene() {
  const { t } = useLocale();
  return <div className={`${styles.scene} ${styles.site}`} data-preview="site" data-scene-shell>
    <div className={styles.browser}>
      <div className={styles.chrome} aria-hidden="true"><span><i /><i /><i /></span><b>casaipe.arq.br</b><span /></div>
      <nav className={styles.siteNav} data-web-nav>
        <strong>casa<em>ipê</em></strong>
        <span>{t('Projetos')}</span><span>{t('Estúdio')}</span><span>{t('Contato')}</span>
        <b>{t('Agendar visita')}</b>
      </nav>
      <div className={styles.siteHero}>
        <div className={styles.siteCopy} data-web-services>
          <span className={styles.kicker}>{t('Arquitetura residencial · SP')}</span>
          <strong>{t('Casas que abraçam quem mora.')}</strong>
          <span className={styles.siteLead}>{t('Projetos autorais, do primeiro traço à última luminária.')}</span>
          <span className={styles.siteActions}><b>{t('Ver projetos')}<ArrowRight size={10} /></b><i>{t('Falar com a arquiteta')}</i></span>
        </div>
        <div className={styles.sitePhoto} data-web-image>
          <Image src="/examples/interior.jpg" alt={t('Site de um escritório de arquitetura')} fill sizes="(max-width: 767px) 160px, 260px" />
          <span className={styles.siteBadge}><b>+120</b>{t('projetos entregues')}</span>
        </div>
      </div>
      <div className={styles.siteStrip} data-web-services>
        {[['living', 'Residência Lapa'], ['cafe-interior', 'Café Vila Nova'], ['florist', 'Ateliê Flora']].map(([img, label]) => <span key={img}>
          <span className={styles.stripPhoto}><Image src={`/examples/${img}.jpg`} alt="" fill sizes="120px" /></span>
          <small>{t(label)}<ArrowUpRight size={9} /></small>
        </span>)}
      </div>
    </div>
    <div className={styles.sitePhone} data-web-mobile aria-hidden="true">
      <span className={styles.island} />
      <span className={styles.sitePhoneNav}>casa<em>ipê</em><i /></span>
      <span className={styles.sitePhonePhoto}><Image src="/examples/living.jpg" alt="" fill sizes="110px" /></span>
      <strong>{t('Casas que abraçam quem mora.')}</strong>
      <b>{t('Agendar visita')}</b>
    </div>
  </div>;
}

const menuItems = {
  pizzas: [
    { name: 'Margherita da Nonna', desc: 'Tomate San Marzano, fior di latte e manjericão', price: 'R$ 58', img: 'pizza', tag: 'Mais pedida' },
    { name: 'Bowl mediterrâneo', desc: 'Salmão, grãos, legumes assados', price: 'R$ 42', img: 'bowl' },
    { name: 'Filé com chimichurri', desc: 'Corte grelhado e salada da casa', price: 'R$ 69', img: 'dish' },
  ],
  doces: [
    { name: 'Torta de chocolate', desc: 'Ganache 70% e calda quente', price: 'R$ 24', img: 'cake', tag: 'Novo' },
    { name: 'Gelato de morango', desc: 'Casquinha crocante', price: 'R$ 16', img: 'icecream' },
    { name: 'Croissant amanteigado', desc: 'Massa folhada artesanal', price: 'R$ 14', img: 'croissant' },
  ],
} as const;

export function MenuScene() {
  const { t } = useLocale();
  const [cat, setCat] = useState<'pizzas' | 'doces'>('pizzas');
  return <div className={`${styles.scene} ${styles.menu}`} data-preview="menu" data-scene-shell>
    <div className={styles.menuPhone}>
      <div className={styles.menuCover} data-menu-photo>
        <Image src="/examples/pizza.jpg" alt={t('Cardápio digital de uma pizzaria')} fill sizes="(max-width: 767px) 220px, 300px" />
        <span className={styles.menuLogo}>N</span>
      </div>
      <div className={styles.menuBody}>
        <div className={styles.menuHead}>
          <strong>Forno Nonna</strong>
          <span><Star size={10} fill="currentColor" aria-hidden="true" /> 4,9 · {t('Aberto até 23h')} · <Clock size={9} aria-hidden="true" /> 35 min</span>
        </div>
        <div className={styles.menuChips} role="group" aria-label={t('Categorias do cardápio')}>
          <button type="button" aria-pressed={cat === 'pizzas'} onClick={() => setCat('pizzas')}>{t('Pratos')}</button>
          <button type="button" aria-pressed={cat === 'doces'} onClick={() => setCat('doces')}>{t('Doces')}</button>
          <span aria-hidden="true">{t('Bebidas')}</span>
        </div>
        <ul className={styles.menuList} key={cat} aria-live="polite">
          {menuItems[cat].map(item => <li key={item.name} data-menu-product>
            <span className={styles.menuThumb}><Image src={`/examples/${item.img}.jpg`} alt="" fill sizes="56px" /></span>
            <span className={styles.menuText}>
              <strong>{t(item.name)}{'tag' in item && item.tag ? <em>{t(item.tag)}</em> : null}</strong>
              <small>{t(item.desc)}</small>
              <b>{item.price}</b>
            </span>
            <span className={styles.menuAdd} aria-hidden="true">+</span>
          </li>)}
        </ul>
      </div>
      <div className={styles.menuCart} data-menu-cart aria-hidden="true"><ShoppingBag size={12} /><span>{t('Ver sacola')} · 2 {t('itens')}</span><b>R$ 100</b></div>
    </div>
    <div className={styles.menuToast} data-menu-toast aria-hidden="true"><span><Check size={11} /></span><span><b>{t('Pedido recebido')}</b><small>{t('Mesa 7 · agora')}</small></span></div>
  </div>;
}

export function NfcScene() {
  const { t } = useLocale();
  return <div className={`${styles.scene} ${styles.nfc}`} data-preview="nfc" data-scene-shell>
    <div className={styles.nfcPlate}><Image src="/placas/nfc-google.svg" alt={t('Placa NFC de avaliação no Google')} fill sizes="(max-width: 767px) 150px, 230px" /></div>
    <span className={styles.ring} data-nfc-signal aria-hidden="true" /><span className={`${styles.ring} ${styles.ringOuter}`} data-nfc-signal aria-hidden="true" />
    <div className={styles.nfcPhone} data-nfc-phone>
      <span className={styles.island} />
      <div className={styles.review} data-nfc-page>
        <span className={styles.reviewSearch}><Search size={9} aria-hidden="true" />Padaria Horizonte</span>
        <span className={styles.reviewPhoto}><Image src="/examples/bread.jpg" alt="" fill sizes="150px" /></span>
        <strong>Padaria Horizonte</strong>
        <span className={styles.reviewScore}>4,8 <Stars size={9} /> <small>(326)</small></span>
        <span className={styles.reviewMeta}><MapPin size={9} aria-hidden="true" />{t('Padaria · Aberto agora')}</span>
        <span className={styles.reviewAsk}>{t('Avalie sua experiência')}</span>
        <span className={styles.reviewBig}><Stars size={15} /></span>
        <span className={styles.reviewItem}>
          <span className={styles.reviewAvatar}><Image src="/examples/woman.jpg" alt="" fill sizes="20px" /></span>
          <span><b>Marina S.</b><small>{t('“Pão quentinho e atendimento ótimo!”')}</small></span>
        </span>
      </div>
    </div>
    <span className={styles.nfcNotice} data-nfc-notice><Wifi size={13} aria-hidden="true" /><span>{t('Toque reconhecido')}<small>{t('Abrindo avaliações no Google')}</small></span></span>
  </div>;
}

export function PortfolioScene() {
  const { t } = useLocale();
  const shots = [['woman', 'Retratos'], ['yoga', 'Bem-estar'], ['dish', 'Gastronomia'], ['florist', 'Marcas'], ['tattoo', 'Editorial'], ['woman2', 'Ensaios']];
  return <div className={`${styles.scene} ${styles.portfolio}`} data-preview="portfolio" data-scene-shell>
    <div className={styles.folio}>
      <header className={styles.folioHead} data-project-label>
        <strong>Lia Moraes<sup>©</sup></strong>
        <span>{t('Fotografia de retratos, marcas e gastronomia')}</span>
        <b>{t('Orçamento')}<ArrowUpRight size={10} /></b>
      </header>
      <div className={styles.folioGrid}>
        {shots.map(([img, label], i) => <figure key={img} data-project className={styles[`shot${i}`]}>
          <Image src={`/examples/${img}.jpg`} alt={i === 0 ? t('Portfólio de uma fotógrafa') : ''} fill sizes="(max-width: 767px) 120px, 180px" />
          <figcaption>{t(label)}</figcaption>
        </figure>)}
      </div>
    </div>
    <span className={styles.folioPill} data-project-label><i />{t('Agenda aberta para dezembro')}</span>
  </div>;
}

export function LandingScene() {
  const { t } = useLocale();
  return <div className={`${styles.scene} ${styles.landing}`} data-preview="landing" data-scene-shell>
    <div className={styles.browser}>
      <div className={styles.chrome} aria-hidden="true"><span><i /><i /><i /></span><b>pulsestudio.com.br/aula</b><span /></div>
      <div className={styles.lpHero}>
        <Image src="/examples/gym.jpg" alt={t('Landing page de um estúdio de treino')} fill sizes="(max-width: 767px) 300px, 480px" />
        <div className={styles.lpCopy} data-landing-module>
          <span className={styles.lpLogo}>PULSE<i>●</i>STUDIO</span>
          <span className={styles.lpTag}>{t('Só esta semana · 12 vagas')}</span>
          <strong>{t('Sua primeira aula é por nossa conta.')}</strong>
          <span className={styles.lpProof}>
            <span className={styles.lpAvatars}>{['man', 'woman', 'woman2'].map(a => <span key={a}><Image src={`/examples/${a}.jpg`} alt="" fill sizes="22px" /></span>)}</span>
            <span><Stars size={8} /><small>+2.300 {t('alunos')}</small></span>
          </span>
        </div>
        <div className={styles.lpForm} data-landing-module>
          <b>{t('Garanta sua vaga')}</b>
          <span className={styles.lpField}>{t('Seu nome')}</span>
          <span className={styles.lpField}>(11) 9 ••••-••••</span>
          <span className={styles.lpButton}>{t('Quero minha aula grátis')}<i data-landing-focus /></span>
          <small>{t('Resposta em minutos pelo WhatsApp')}</small>
          <MousePointer2 className={styles.lpCursor} data-landing-cursor size={20} fill="currentColor" aria-hidden="true" />
        </div>
      </div>
    </div>
  </div>;
}
