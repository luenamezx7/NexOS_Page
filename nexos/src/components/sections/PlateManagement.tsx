import { ArrowUpRight, CheckCheck, Mic, MoreVertical, Paperclip, Phone, ShieldCheck, Smile } from 'lucide-react';
import { commercialHref } from '@/lib/commercial';
import { useLocale } from '@/lib/locale';
import styles from './PlateManagement.module.css';

/** The commercial team can discuss available destination changes over WhatsApp. */
export function PlateManagement() {
  const { t } = useLocale();
  return <section id="plate-management" aria-labelledby="plate-management-title" className={styles.section}>
    <div className={styles.container}>
      <div className={styles.copy}>
          <span className={styles.eyebrow}>{t('ATENDIMENTO · WHATSAPP')}</span>
          <h2 id="plate-management-title">{t('Mudou de cardápio? Sua placa acompanha.')}</h2>
            <p>{t('Precisa de outro destino para sua placa? Fale com a ezway no WhatsApp para conferir as opções disponíveis.')}</p>
          <a href={commercialHref(t('Olá! Quero trocar o link da minha placa.'))} target="_blank" rel="noopener noreferrer" className="btn-primary-nex">{t('Trocar o link da minha placa')} <ArrowUpRight size={17} aria-hidden="true" /></a>
      </div>
        <div className={styles.preview} data-journey-visual role="img" aria-label={t('Conversa sobre a troca do destino da placa pelo WhatsApp comercial')}>
          <div className={styles.previewHead}>
            <span className={styles.avatar} aria-hidden="true">e</span>
            <span className={styles.contact}><strong>{t('ezway · comercial')}</strong><small>{t('online')}</small></span>
            <Phone size={18} aria-hidden="true" /><MoreVertical size={19} aria-hidden="true" />
          </div>
          <div className={styles.chat}>
            <span className={styles.dateLabel}>{t('Hoje')}</span>
            <p className={`${styles.message} ${styles.outgoing}`}>{t('Oi! Troquei meu cardápio. Dá para atualizar o link da placa?')}<span className={styles.messageMeta}>10:24 <CheckCheck size={14} aria-hidden="true" /></span></p>
             <p className={`${styles.message} ${styles.incoming}`}>{t('Pode mandar o novo link? Vou conferir as opções disponíveis para a sua placa.')}<span className={styles.messageMeta}>10:24</span></p>
            <p className={`${styles.message} ${styles.outgoing}`}>{t('Aqui está o link novo.')}<span className={styles.messageMeta}>10:25 <CheckCheck size={14} aria-hidden="true" /></span></p>
             <p className={`${styles.message} ${styles.incoming}`}>{t('Recebi! Nossa equipe vai verificar e te orientar sobre os próximos passos.')}<span className={styles.messageMeta}>10:25</span></p>
          </div>
          <div className={styles.chatCompose}><span className={styles.composeField}><Smile size={18} aria-hidden="true" /><span>{t('Mensagem')}</span><Paperclip size={18} aria-hidden="true" /></span><span className={styles.composeMic}><Mic size={18} aria-hidden="true" /></span></div>
           <div className={styles.previewFoot}><ShieldCheck size={16} aria-hidden="true" /> {t('Precisa de outro link? Fale com a nossa equipe.')}</div>
      </div>
    </div>
  </section>;
}
