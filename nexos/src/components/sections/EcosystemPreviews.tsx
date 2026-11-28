'use client';

import type { ReactNode } from 'react';
import { ArrowDown, ArrowUpRight, Check, CheckCheck, FileText, Paperclip, Send, ShieldCheck, Sparkles } from 'lucide-react';
import { useLocale } from '@/lib/locale';
import type { Solution } from '@/config/solutions';
import styles from './EcosystemPreviews.module.css';
import { LandingScene, MenuScene, NfcScene, PortfolioScene, SiteScene } from './EcosystemScenes';








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
  site: SiteScene, menu: MenuScene, nfc: NfcScene, portfolio: PortfolioScene,
  landing: LandingScene, easychat: ChatPreview, suporte: SupportPreview,
};

export function ChapterPreview({ solution }: { solution: Solution }) {
  const Preview = previews[solution.id];
  return Preview ? <Preview /> : null;
}
