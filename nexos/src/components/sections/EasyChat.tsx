'use client';

import { useEffect, useRef, useState } from 'react';
import { useInView } from 'motion/react';
import { usePrefersReducedMotion as useReducedMotion } from '@/lib/use-prefers-reduced-motion';
import { easychat } from '@/config/easychat';
import { ScrollReveal } from '../ScrollReveal';
import { ScrollFillText } from '../ui/scroll-fill-headline';
import { Iphone15Pro } from '../ui/iphone-15-pro';
import { PhoneScrollHero } from '../ui/phone-scroll-hero';
import { GlowingBadge } from '../unlumen-ui/primitives/glowing-badge';
import { ArrowLeft, Bell, CheckCheck, FileText, Files, Mic, MoreVertical, Paperclip, PenLine, Phone, ReceiptText, Smile } from 'lucide-react';
import styles from './EasyChat.module.css';
import { useLocale } from '@/lib/locale';
import { useDocumentVisible } from '@/lib/use-document-visible';

export function EasyChat() {
  const { t } = useLocale();
  const conversationRef = useRef<HTMLDivElement>(null);
  const inView = useInView(conversationRef, { amount: .25 });
  const documentVisible = useDocumentVisible();
  const reducedMotion = useReducedMotion();
  const [shown, setShown] = useState(0);
  useEffect(() => {
    if (inView) return;
    const frame = requestAnimationFrame(() => setShown(0));
    return () => cancelAnimationFrame(frame);
  }, [inView]);
  useEffect(() => {
    if (!inView || !documentVisible || reducedMotion || shown >= 4) return;
    const timeout = window.setTimeout(() => setShown(value => value + 1), shown === 0 ? 250 : 950);
    return () => window.clearTimeout(timeout);
  }, [inView, documentVisible, reducedMotion, shown]);
  const capabilities = [
    { icon: FileText, label: 'Criar propostas e contratos para revisão antes de compartilhar' },
    { icon: ReceiptText, label: 'Ler e organizar notas fiscais e documentos enviados' },
    { icon: Files, label: 'Organizar arquivos PDF, Word e OFX' },
    { icon: PenLine, label: 'Revisar documentos antes de compartilhar para assinatura' },
    { icon: Bell, label: 'Lembrar prazos e próximos passos' },
  ];
  return <section id="easychat" aria-labelledby="easychat-title" className={styles.section}>
    <div className={styles.container}>
      <div className={styles.top}><span>{t('Assistente administrativo com IA')}</span><GlowingBadge variant="neutral" className={styles.statusBadge} dotColor="#ff3f9f" glowColor="rgb(255 63 159 / 28%)">{t('Em desenvolvimento')}</GlowingBadge></div>
      <PhoneScrollHero titleComponent={<div className={styles.intro}><p className={styles.name}><ScrollFillText lines={[easychat.name]} /></p><h2 data-heading-static data-scroll-fill-heading id="easychat-title" className={styles.heading}><ScrollFillText lines={[t('Menos tarefas.'), t('Mais tempo para o negócio.')]} /></h2><ScrollReveal as="p" className={styles.description}>{t('Uma ideia para organizar tarefas pelo WhatsApp com apoio de IA. Você revisa cada documento antes de compartilhar.')}</ScrollReveal></div>}>
        <figure className={styles.mockup} data-journey-visual>
          <ol className={styles.workflow} aria-label={t('Prévia do fluxo EasyChat')}>
            <li data-ready={reducedMotion || shown >= 1}><span>1</span><div><strong>{t('Você solicita')}</strong><small>{t('Uma tarefa pela conversa.')}</small></div></li>
            <li data-ready={reducedMotion || shown >= 3}><span>2</span><div><strong>{t('A IA prepara')}</strong><small>{t('Um rascunho organizado.')}</small></div></li>
            <li data-ready={reducedMotion || shown >= 4}><span>3</span><div><strong>{t('Você revisa')}</strong><small>{t('Antes de compartilhar.')}</small></div></li>
          </ol>
          <aside className={styles.documentPreview} data-ready={reducedMotion || shown >= 3} aria-hidden="true"><FileText size={26} /><strong>{t('Contrato para revisão')}</strong><span>{t('Rascunho ilustrativo')}</span><div><i /><i /><i /></div><p>{t('Você confere. Você decide quando compartilhar.')}</p></aside>
          <div ref={conversationRef} className={styles.phonePreview} role="img" aria-label={t('Conversa do EasyChat com documento para revisar')}>
            <Iphone15Pro className={styles.device}>
              <div className={styles.phoneScreen}>
                <div className={styles.chatHeader}><ArrowLeft size={15} aria-hidden="true" /><span className={styles.avatar} aria-hidden="true">E</span><span className={styles.contact}><strong>EasyChat</strong><small>{t('Em desenvolvimento')}</small></span><Phone size={15} aria-hidden="true" /><MoreVertical size={16} aria-hidden="true" /></div>
                <div className={styles.chatMessages}>
                  <span className={styles.dateLabel}>{t('Hoje')}</span>
                  <div className={`${styles.message} ${styles.outgoing}`} data-message-visible={Boolean(reducedMotion || shown >= 1)}>{t('Preciso de um contrato para o meu cliente.')}<span className={styles.messageMeta}>10:24 <CheckCheck size={12} aria-hidden="true" /></span></div>
                  <div className={`${styles.message} ${styles.incoming}`} data-message-visible={Boolean(reducedMotion || shown >= 2)}>{t('Preparei um rascunho para você revisar.')}<span className={styles.messageMeta}>10:24</span></div>
                  <div className={`${styles.message} ${styles.incoming}`} data-message-visible={Boolean(reducedMotion || shown >= 3)}><span className={styles.attachment}><span className={styles.documentIcon}><FileText size={16} aria-hidden="true" /></span><span><strong>{t('Contrato para revisão.pdf')}</strong><small>{t('PDF · 2 páginas')}</small></span></span><span className={styles.attachmentCaption}>{t('Revise antes de compartilhar.')}</span><span className={styles.messageMeta}>10:25</span></div>
                  <div className={`${styles.message} ${styles.outgoing}`} data-message-visible={Boolean(reducedMotion || shown >= 4)}>{t('Vou revisar e te aviso.')}<span className={styles.messageMeta}>10:26 <CheckCheck size={12} aria-hidden="true" /></span></div>
                  <span className={styles.typingIndicator} data-typing={Boolean(inView && documentVisible && !reducedMotion && (shown === 1 || shown === 2))} aria-hidden="true"><i /><i /><i /></span>
                </div>
                <div className={styles.chatCompose}><span className={styles.composeField}><Smile size={16} aria-hidden="true" /><span>{t('Mensagem')}</span><Paperclip size={16} aria-hidden="true" /></span><span className={styles.composeMic}><Mic size={16} aria-hidden="true" /></span></div>
              </div>
            </Iphone15Pro>
          </div>
          <figcaption>{t('Funcionalidades previstas · em desenvolvimento')}</figcaption>
        </figure>
      </PhoneScrollHero>
      <div className={styles.details}><div><p className={styles.capabilityTitle}>{t('Funcionalidades previstas')}</p><ul className={styles.capabilities}>{capabilities.map(({ icon: Icon, label }) => <li key={label}><Icon size={18} aria-hidden="true" />{t(label)}</li>)}</ul></div></div>
    </div>
  </section>;
}
