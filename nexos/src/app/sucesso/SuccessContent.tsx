'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import styles from './Success.module.css';
import { config } from '@/config';
import { Button } from '@/components/ui/Button';
import { CheckCircle, MessageSquare, ArrowRight } from 'lucide-react';

type PixVerifyState = 'verifying' | 'confirmed' | 'failed';

// ============================================================
// /sucesso — dois fluxos:
// - Stripe: ?session_id=... → confirmado direto (webhook/redirect).
// - InfinitePay Pix: ?provider=infinitepay&order_nsu=... → verifica
//   no servidor (payment_check) com polling curto. Antes caía no
//   "Não foi possível verificar" (parecia erro/travamento).
// ============================================================

function usePixVerification(orderNsu: string | null, enabled: boolean): PixVerifyState {
  // Estado inicial decidido no lazy init (sem setState dentro de effect).
  const [state, setState] = useState<PixVerifyState>(() => (enabled && orderNsu ? 'verifying' : 'failed'));

  useEffect(() => {
    if (!enabled || !orderNsu) return;
    let cancelled = false;
    let tries = 0;

    const check = async (): Promise<boolean> => {
      try {
        const res = await fetch('/api/checkout/infinitepay/status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderNsu }),
          signal: AbortSignal.timeout(20000),
        });
        const body: { paid?: boolean } = await res.json().catch(() => ({}));
        return res.ok && body.paid === true;
      } catch {
        return false;
      }
    };

    const tick = async () => {
      tries += 1;
      const paid = await check();
      if (cancelled) return;
      if (paid) {
        setState('confirmed');
        return;
      }
      // ~1 min de polling (12 × 5s); depois, orienta a falar no suporte
      if (tries >= 12) {
        setState('failed');
        return;
      }
      timer = window.setTimeout(tick, 5000);
    };

    let timer = window.setTimeout(tick, 1500);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [enabled, orderNsu]);

  return state;
}

export default function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const provider = searchParams.get('provider');
  const orderNsu = searchParams.get('order_nsu');

  const isStripe = Boolean(sessionId);
  const isPix = provider === 'infinitepay' && Boolean(orderNsu);
  const pixState = usePixVerification(orderNsu, isPix);

  const txLabel = sessionId ?? orderNsu ?? 'não informado';
  const whatsappUrl = `https://wa.me/${config.whatsapp.number}?text=${encodeURIComponent(
    `Olá! Acabei de finalizar o pagamento (${isPix ? 'Pix' : 'session'}: ${txLabel}). Gostaria de agendar o início do meu projeto.`,
  )}`;

  // Pix ainda confirmando no servidor
  if (isPix && pixState === 'verifying') {
    return (
      <div className={styles.container}>
        <div className={styles.success}>
          <div className={styles.iconWrapper} aria-hidden="true">
            <div className={styles.spinner} role="status" aria-label="Confirmando pagamento Pix" />
          </div>
          <h1 className={styles.title}>Confirmando seu Pix…</h1>
          <p className={styles.subtitle}>
            Voltamos do checkout da InfinitePay e estamos conferindo a confirmação. Aguarde alguns segundos — esta página atualiza sozinha.
          </p>
          {orderNsu && (
            <div className={styles.details}>
              <p className={styles.sessionId}>
                Pedido: <code>{orderNsu}</code>
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  const isSuccess = isStripe || (isPix && pixState === 'confirmed');

  if (!isSuccess) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <h1 className={styles.errorTitle}>Não foi possível verificar</h1>
          <p className={styles.errorText}>
            {isPix
              ? 'Ainda não consta a confirmação desse Pix. Se você já pagou, aguarde 1 minuto e recarregue — ou fale com a gente que conferimos na hora.'
              : 'Seu pagamento pode ter sido processado, mas não conseguimos confirmar automaticamente.'}
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
          <p className={styles.sessionId}>
            ID da transação: <code>{txLabel}</code>
          </p>
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
