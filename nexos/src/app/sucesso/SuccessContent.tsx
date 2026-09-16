'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import styles from './Success.module.css';
import { config } from '@/config';
import { Button } from '@/components/ui/Button';
import { CheckCircle, MessageSquare, ArrowRight } from 'lucide-react';

export default function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const isSuccess = Boolean(sessionId);

  const whatsappUrl = `https://wa.me/${config.whatsapp.number}?text=${encodeURIComponent(
    `Olá! Acabei de finalizar o pagamento (session: ${sessionId || 'não informado'}). Gostaria de agendar o início do meu projeto.`
  )}`;

  if (!isSuccess) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <h1 className={styles.errorTitle}>Não foi possível verificar</h1>
          <p className={styles.errorText}>
            Seu pagamento pode ter sido processado, mas não conseguimos confirmar automaticamente.
          </p>
          <div className={styles.errorActions}>
            <Button variant="primary" size="lg" onClick={() => window.location.href = '/#contact'}>
              Falar com suporte
            </Button>
            <Button variant="secondary" size="lg" onClick={() => window.open(whatsappUrl, '_blank')}>
              <MessageSquare size={20} strokeWidth={2.5} aria-hidden="true" />
              WhatsApp
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.success}>
        <div className={styles.iconWrapper}>
          <CheckCircle size={64} strokeWidth={3} className={styles.icon} aria-hidden="true" />
        </div>
        <h1 className={styles.title}>Pagamento confirmado!</h1>
        <p className={styles.subtitle}>
          Obrigado por confiar na NexOS. Seu projeto já está na nossa fila de execução.
        </p>
        <div className={styles.details}>
          {sessionId && (
            <p className={styles.sessionId}>
              ID da transação: <code>{sessionId}</code>
            </p>
          )}
        </div>
        <div className={styles.actions}>
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className={styles.whatsappButton}>
            <MessageSquare size={22} strokeWidth={2.5} aria-hidden="true" />
            <span>Continuar no WhatsApp</span>
            <ArrowRight size={20} strokeWidth={2.5} aria-hidden="true" />
          </a>
          <Button variant="secondary" size="lg" onClick={() => window.location.href = '/'}>
            Voltar ao início
          </Button>
        </div>
        <p className={styles.nextSteps}>
          <strong>Próximos passos:</strong> Nossa equipe entrará em contato em até 2h úteis para alinhar o kickoff e cronograma.
        </p>
      </div>
    </div>
  );
}