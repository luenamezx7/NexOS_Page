'use client';

import { useState, type ReactNode } from 'react';
import Image from 'next/image';
import { ArrowDown, ArrowUpRight, Check, CheckCheck, Coffee, Cookie, FileText, Globe2, LayoutTemplate, MessageCircle, MousePointer2, Paperclip, Plus, Send, ShieldCheck, Sparkles, Wifi } from 'lucide-react';
import { useLocale } from '@/lib/locale';
import type { Solution } from '@/config/solutions';
import styles from './EcosystemPreviews.module.css';

function BrowserBar({ address }: { address: string }) {
  return <div className={styles.browserBar}><span className={styles.browserDots} aria-hidden="true"><i /><i /><i /></span><span>{address}</span><Globe2 size={11} aria-hidden="true" /></div>;
}

function WebsitePreview() {
  const { t } = useLocale();
  return <div className={`${styles.scene} ${styles.siteScene}`} data-preview="site" data-scene-shell>
    <div className={styles.website}>
      <BrowserBar address="studio.example" />
      <div className={styles.webNav} data-web-nav><strong>studio<span>®</span></strong><span>{t('Sobre')}<span>{t('Projetos')}</span><ArrowUpRight size={14} /></span></div>
      <div className={styles.webCover} data-web-image>
        <Image src="/ezway-demo-studio.jpg" alt={t('Site com apresentação de arquitetura e interiores')} fill sizes="(max-width: 767px) 300px, 480px" />
        <div className={styles.webCoverCopy}><strong>{t('Espaços com propósito.')}</strong><span>{t('Arquitetura e interiores')} <ArrowUpRight size={12} /></span></div>
      </div>
      <div className={styles.webServices} data-web-services>{['Apresentação', 'Serviços', 'Contato'].map(label => <span key={label}>{t(label)}<ArrowUpRight size={12} /></span>)}</div>
    </div>
    <div className={styles.mobileWebsite} data-web-mobile aria-hidden="true"><div className={styles.mobileNotch} /><span>studio®</span><div className={styles.mobilePhoto}><Image src="/ezway-demo-studio.jpg" alt="" fill sizes="120px" /></div><strong>{t('Seu espaço. Sua história.')}</strong><span className={styles.mobileLink}>{t('Projetos')}<ArrowUpRight size={10} /></span></div>
  </div>;
}

type MenuCategory = 'cafes' | 'doces';
function MenuProducts({ category, animated = false }: { category: MenuCategory; animated?: boolean }) {
  const { t } = useLocale();
  const products = category === 'cafes'
    ? [{ name: 'Café coado', detail: 'Feito na hora', icon: Coffee }, { name: 'Cappuccino', detail: 'Café, leite e cremosidade', icon: Coffee }]
    : [{ name: 'Brownie da casa', detail: 'Chocolate em cada pedaço', icon: Cookie }, { name: 'Bolo do dia', detail: 'Uma pausa com sabor', icon: Cookie }];
  return <div className={styles.menuProducts}>{products.map(({ name, detail, icon: Icon }) => <div key={name} className={styles.menuProduct} data-menu-product={animated || undefined}><span className={styles.productIcon}><Icon size={24} strokeWidth={1.4} aria-hidden="true" /></span><span><strong>{t(name)}</strong><small>{t(detail)}</small></span><Plus size={14} aria-hidden="true" /></div>)}</div>;
}

function MenuPreview() {
  const { t } = useLocale();
  const [selected, setSelected] = useState<MenuCategory | null>(null);
  return <div className={`${styles.scene} ${styles.menuScene}`} data-preview="menu" data-scene-shell>
    <div className={styles.menuApp}>
      <div className={styles.menuCover} data-menu-photo><Image src="/ezway-demo-cafe.jpg" alt="" fill sizes="(max-width: 767px) 280px, 360px" /><span>{t('Uma pausa. Um bom café.')}</span></div>
      <div className={styles.menuBody}><div className={styles.menuBrand}><strong>{t('Café da casa')}</strong><span>{t('Cardápio digital')}</span></div>
        <div className={styles.menuTabs} data-manual-category={selected ?? undefined}>
          <span className={styles.menuCaret} data-menu-caret aria-hidden="true" />
          <button type="button" aria-pressed={selected === 'cafes'} onClick={() => setSelected('cafes')}>{t('Cafés')}</button>
          <button type="button" aria-pressed={selected === 'doces'} onClick={() => setSelected('doces')}>{t('Doces')}</button>
        </div>
        <div className={styles.menuPanels} aria-live="polite">
          {selected ? <MenuProducts category={selected} /> : <div data-menu-auto><div data-menu-panel="cafes"><MenuProducts category="cafes" animated /></div><div data-menu-panel="doces"><MenuProducts category="doces" /></div></div>}
        </div>
      </div>
    </div>
    <span className={styles.menuHint}><MousePointer2 size={13} aria-hidden="true" />{t('Explore as categorias')}</span>
  </div>;
}

function NfcPreview() {
  const { t } = useLocale();
  return <div className={`${styles.scene} ${styles.nfcScene}`} data-preview="nfc" data-scene-shell>
    <div className={styles.nfcPlate}><Image src="/nfcs/nfccardapio.svg" alt={t('Placa de cardápio com NFC e QR Code')} fill sizes="(max-width: 767px) 180px, 280px" /></div>
    <span className={styles.signal} data-nfc-signal aria-hidden="true" /><span className={`${styles.signal} ${styles.signalOuter}`} data-nfc-signal aria-hidden="true" />
    <div className={styles.nfcPhone} data-nfc-phone><div className={styles.phoneIsland} /><div className={styles.nfcScreen}>
      <span className={styles.phoneAddress}><Globe2 size={10} />{t('Cardápio digital')}</span>
      <div className={styles.nfcPage} data-nfc-page><div className={styles.nfcPagePhoto}><Image src="/ezway-demo-cafe.jpg" alt="" fill sizes="160px" /></div><strong>{t('Café da casa')}</strong><span>{t('Veja o cardápio')}</span><div><Coffee size={15} /><span>{t('Cafés')}</span><ArrowUpRight size={12} /></div><div><Cookie size={15} /><span>{t('Doces')}</span><ArrowUpRight size={12} /></div></div>
    </div></div>
    <span className={styles.nfcNotice} data-nfc-notice><Wifi size={15} aria-hidden="true" /><span>{t('Destino reconhecido')}<small>{t('Abra no seu celular')}</small></span><ArrowUpRight size={15} /></span>
  </div>;
}

function PortfolioPreview() {
  const { t } = useLocale();
  return <div className={`${styles.scene} ${styles.portfolioScene}`} data-preview="portfolio" data-scene-shell>
    <span className={styles.editorialMark}>{t('Seleção de projetos')}<ArrowDown size={16} aria-hidden="true" /></span>
    <div className={`${styles.project} ${styles.projectMain}`} data-project><div className={styles.projectPhoto}><Image src="/ezway-demo-studio.jpg" alt={t('Projeto ilustrativo de arquitetura')} fill sizes="(max-width: 767px) 250px, 400px" /></div><span data-project-label><strong>{t('Espaços para viver')}</strong><ArrowUpRight size={16} /></span></div>
    <div className={`${styles.project} ${styles.projectSecondary}`} data-project><div className={styles.projectPhoto}><Image src="/ezway-demo-cafe.jpg" alt={t('Projeto ilustrativo de fotografia')} fill sizes="(max-width: 767px) 360px, 640px" /></div><span data-project-label><strong>{t('Novas perspectivas')}</strong><ArrowUpRight size={14} /></span></div>
    <span className={styles.portfolioSignature} data-project-label>{t('Trabalho que fala por você.')}<span>{t('Imagem, contexto e contato.')}</span></span>
  </div>;
}

function LandingPreview() {
  const { t } = useLocale();
  return <div className={`${styles.scene} ${styles.landingScene}`} data-preview="landing" data-scene-shell>
    <div className={styles.journeyRail} aria-hidden="true"><span><MessageCircle size={17} /></span><i /><span><LayoutTemplate size={17} /></span><i /><span><ArrowUpRight size={17} /></span></div>
    <div className={styles.landingPage}><BrowserBar address="cafe.example" /><div className={styles.landingHero} data-landing-module><Image src="/ezway-demo-cafe.jpg" alt="" fill sizes="(max-width: 767px) 260px, 420px" /><div><span>{t('Café da casa')}</span><strong>{t('Seu próximo café começa aqui.')}</strong><span className={styles.landingCta}>{t('Conhecer')}<ArrowUpRight size={12} /><i data-landing-focus /></span></div></div>
      <div className={styles.landingDetails} data-landing-module><span>{t('Uma boa pausa, do seu jeito.')}</span><div><Coffee size={20} /><p>{t('Conheça a proposta. Escolha seu próximo passo.')}</p></div></div>
      <div className={styles.landingContact} data-landing-module><span>{t('Vamos conversar?')}</span><ArrowUpRight size={17} /></div>
      <MousePointer2 className={styles.landingCursor} data-landing-cursor size={27} fill="currentColor" aria-hidden="true" />
    </div>
  </div>;
}

function ChatPreview() {
  const { t } = useLocale();
  return <div className={`${styles.scene} ${styles.chatScene}`} data-preview="easychat" data-scene-shell>
    <div className={styles.chatWindow}><div className={styles.chatHeader}><span className={styles.chatAvatar}><Sparkles size={19} aria-hidden="true" /></span><span><strong>EasyChat</strong><small>{t('Prévia conceitual')}</small></span><span className={styles.chatContext}>{t('Para revisar')}</span></div>
      <div className={styles.chatThread}><p className={styles.chatUser} data-chat-user>{t('Preciso de um contrato para o meu cliente.')}<CheckCheck size={13} aria-hidden="true" /></p>
        <div className={styles.chatReplySlot}><span className={styles.typing} data-chat-typing aria-hidden="true"><i /><i /><i /></span><p className={styles.chatReply} data-chat-reply>{t('Preparei um rascunho para você revisar.')}</p></div>
        <div className={styles.chatFile} data-chat-file><span><FileText size={23} strokeWidth={1.4} /></span><div><strong>{t('Contrato para revisão.pdf')}</strong><small>{t('Documento para revisão')}</small></div><ArrowDown size={16} aria-hidden="true" /></div>
        <span className={styles.reviewNote} data-chat-review><ShieldCheck size={14} aria-hidden="true" />{t('Você revisa antes de compartilhar.')}</span>
      </div><div className={styles.chatCompose} aria-hidden="true"><Paperclip size={15} /><span>{t('Mensagem')}</span><Send size={15} /></div>
    </div>
  </div>;
}

function SupportPreview() {
  const { t } = useLocale();
  return <div className={`${styles.scene} ${styles.supportScene}`} data-preview="suporte" data-scene-shell>
    <div className={styles.supportConversation}><span className={styles.supportBrand}>ez<span>way</span><span className={styles.supportOnline}>{t('Acompanhamento')}</span></span><p data-support-question>{t('Podemos revisar os detalhes do meu projeto?')}</p><div className={styles.supportAnswer} data-support-answer><span className={styles.supportAvatar}>ez</span><p>{t('Vamos alinhar os ajustes e o próximo passo.')}<CheckCheck size={13} aria-hidden="true" /></p></div></div>
    <div className={styles.supportChecklist}><span className={styles.supportChecklistTitle}>{t('Próximos passos')}<ArrowUpRight size={16} /></span><ol>{['Solicitação recebida', 'Ajustes alinhados', 'Revisão compartilhada'].map(label => <li key={label}><span className={styles.checkCircle} data-support-check><Check size={13} strokeWidth={2.5} aria-hidden="true" /></span>{t(label)}</li>)}</ol><span className={styles.supportDone} data-support-done><ShieldCheck size={15} aria-hidden="true" />{t('Seguimos com você.')}</span></div>
  </div>;
}

const previews: Record<string, () => ReactNode> = {
  site: WebsitePreview, menu: MenuPreview, nfc: NfcPreview, portfolio: PortfolioPreview,
  landing: LandingPreview, easychat: ChatPreview, suporte: SupportPreview,
};

export function ChapterPreview({ solution }: { solution: Solution }) {
  const Preview = previews[solution.id];
  return Preview ? <Preview /> : null;
}
