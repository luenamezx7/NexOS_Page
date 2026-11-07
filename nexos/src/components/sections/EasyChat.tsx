'use client';

import { easychat } from '@/config/easychat';
import { ScrollReveal } from '../ScrollReveal';
import { Iphone } from '../ui/iphone';
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
       <div className={styles.top}><span>{t('Assistente administrativo com IA')}</span><GlowingBadge variant="neutral">{t(easychat.status)}</GlowingBadge></div>
      <div className={styles.layout}>
        <div className={styles.copy}>
          <p className={styles.name}>{easychat.name}</p>
           <ScrollReveal as="h2" preset="title" id="easychat-title" className={styles.heading}>{t('Seu administrativo')} <HighlightedText inView from="bottom" delay={.16}>{t('pelo WhatsApp')}</HighlightedText></ScrollReveal>
          <ScrollReveal as="p" className={styles.description}>{t(easychat.description)}</ScrollReveal>
          <p className={styles.capabilityTitle}>{t('Explore o fluxo')}</p>
          <ul className={styles.capabilities}>{capabilities.map(({ icon: Icon, label }) => <li key={label}><Icon size={18} aria-hidden="true" />{t(label)}</li>)}</ul>
           <p className={styles.disclaimer}>{t('Você revisa e aprova os documentos antes de compartilhar.')}</p>
        </div>
         <ScrollReveal as="figure" preset="image" className={styles.mockup} data-journey-visual>
            <div className={styles.phonePreview} role="img" aria-label={t('Conversa no WhatsApp com o EasyChat sobre a revisão de um contrato')}>
             <Iphone className={styles.device} aria-hidden="true">
               <div className={styles.phoneScreen}>
                 <div className={styles.chatHeader}>
                   <ArrowLeft size={15} aria-hidden="true" />
                   <span className={styles.avatar} aria-hidden="true">E</span>
                   <span className={styles.contact}><strong>EasyChat</strong><small>{t('online')}</small></span>
                   <Phone size={15} aria-hidden="true" /><MoreVertical size={16} aria-hidden="true" />
                 </div>
                 <div className={styles.chatMessages}>
                   <span className={styles.dateLabel}>{t('Hoje')}</span>
                   <div className={`${styles.message} ${styles.outgoing}`}>{t('Preciso de um contrato para o meu cliente.')}<span className={styles.messageMeta}>10:24 <CheckCheck size={12} aria-hidden="true" /></span></div>
                   <div className={`${styles.message} ${styles.incoming}`}>{t('Claro! Preparei o contrato para você revisar antes de compartilhar.')}<span className={styles.messageMeta}>10:24</span></div>
                   <div className={`${styles.message} ${styles.incoming}`}>
                     <span className={styles.attachment}><span className={styles.documentIcon}><FileText size={16} aria-hidden="true" /></span><span><strong>{t('Contrato para revisão.pdf')}</strong><small>{t('PDF · 2 páginas')}</small></span></span>
                     <span className={styles.attachmentCaption}>{t('Dê uma olhada e me diga se quer ajustar algo.')}</span>
                     <span className={styles.messageMeta}>10:25</span>
                   </div>
                   <div className={`${styles.message} ${styles.outgoing}`}>{t('Vou revisar e te aviso.')}<span className={styles.messageMeta}>10:26 <CheckCheck size={12} aria-hidden="true" /></span></div>
                 </div>
                 <div className={styles.chatCompose}><span className={styles.composeField}><Smile size={16} aria-hidden="true" /><span>{t('Mensagem')}</span><Paperclip size={16} aria-hidden="true" /></span><span className={styles.composeMic}><Mic size={16} aria-hidden="true" /></span></div>
               </div>
             </Iphone>
          </div>
            <figcaption>{t('Organização e revisão em uma conversa.')}</figcaption>
        </ScrollReveal>
      </div>
    </div>
  </section>;
}
