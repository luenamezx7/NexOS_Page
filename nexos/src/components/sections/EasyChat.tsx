'use client';

import { easychat } from '@/config/easychat';
import { ScrollReveal } from '../ScrollReveal';
import { Iphone } from '../ui/iphone';
import { PhoneScrollHero } from '../ui/phone-scroll-hero';
import { GlowingBadge } from '../unlumen-ui/primitives/glowing-badge';
import { HighlightedText } from '../highlighted-text';
import { ArrowLeft, Bell, CheckCheck, FileText, Files, Mic, MoreVertical, Paperclip, PenLine, Phone, ReceiptText, Smile } from 'lucide-react';
import styles from './EasyChat.module.css';
import { useLocale } from '@/lib/locale';

export function EasyChat() {
  const { t } = useLocale();
  const capabilities = [
    { icon: FileText, label: 'Criar propostas e contratos para revisão antes de compartilhar' },
    { icon: ReceiptText, label: 'Ler e organizar notas fiscais e documentos enviados' },
    { icon: Files, label: 'Organizar arquivos PDF, Word e OFX' },
    { icon: PenLine, label: 'Revisar documentos antes de compartilhar para assinatura' },
    { icon: Bell, label: 'Lembrar prazos e próximos passos' },
  ];
  return <section id="easychat" aria-labelledby="easychat-title" className={styles.section}>
    <div className={styles.container}>
      <div className={styles.top}><span>{t('Assistente administrativo com IA')}</span><GlowingBadge variant="neutral">{t('Prévia conceitual · em desenvolvimento')}</GlowingBadge></div>
      <PhoneScrollHero titleComponent={<div className={styles.intro}><p className={styles.name}>{easychat.name}</p><h2 id="easychat-title" className={styles.heading}>{t('Menos tarefas.')} <HighlightedText inView from="bottom">{t('Mais tempo para o negócio.')}</HighlightedText></h2></div>}>
        <figure className={styles.mockup} data-journey-visual>
          <div className={styles.phonePreview} role="img" aria-label={t('Prévia ilustrativa de conversa do EasyChat com documento para revisão')}>
            <Iphone className={styles.device} aria-hidden="true">
              <div className={styles.phoneScreen}>
                <div className={styles.chatHeader}><ArrowLeft size={15} aria-hidden="true" /><span className={styles.avatar} aria-hidden="true">E</span><span className={styles.contact}><strong>EasyChat</strong><small>{t('prévia')}</small></span><Phone size={15} aria-hidden="true" /><MoreVertical size={16} aria-hidden="true" /></div>
                <div className={styles.chatMessages}>
                  <span className={styles.dateLabel}>{t('Hoje')}</span>
                  <div className={`${styles.message} ${styles.outgoing}`}>{t('Preciso de um contrato para o meu cliente.')}<span className={styles.messageMeta}>10:24 <CheckCheck size={12} aria-hidden="true" /></span></div>
                  <div className={`${styles.message} ${styles.incoming}`}>{t('Preparei um rascunho para você revisar.')}<span className={styles.messageMeta}>10:24</span></div>
                  <div className={`${styles.message} ${styles.incoming}`}><span className={styles.attachment}><span className={styles.documentIcon}><FileText size={16} aria-hidden="true" /></span><span><strong>{t('Contrato para revisão.pdf')}</strong><small>{t('PDF · 2 páginas')}</small></span></span><span className={styles.attachmentCaption}>{t('Revise antes de compartilhar.')}</span><span className={styles.messageMeta}>10:25</span></div>
                  <div className={`${styles.message} ${styles.outgoing}`}>{t('Vou revisar e te aviso.')}<span className={styles.messageMeta}>10:26 <CheckCheck size={12} aria-hidden="true" /></span></div>
                </div>
                <div className={styles.chatCompose}><span className={styles.composeField}><Smile size={16} aria-hidden="true" /><span>{t('Mensagem')}</span><Paperclip size={16} aria-hidden="true" /></span><span className={styles.composeMic}><Mic size={16} aria-hidden="true" /></span></div>
              </div>
            </Iphone>
          </div>
          <figcaption>{t('Exemplo ilustrativo · funcionalidades previstas')}</figcaption>
        </figure>
      </PhoneScrollHero>
      <div className={styles.details}><ScrollReveal as="p" className={styles.description}>{t('Uma ideia para organizar tarefas pelo WhatsApp com apoio de IA. Você revisa cada documento antes de compartilhar.')}</ScrollReveal><div><p className={styles.capabilityTitle}>{t('Funcionalidades previstas')}</p><ul className={styles.capabilities}>{capabilities.map(({ icon: Icon, label }) => <li key={label}><Icon size={18} aria-hidden="true" />{t(label)}</li>)}</ul></div></div>
    </div>
  </section>;
}
