'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import styles from './Success.module.css';
import { config } from '@/config';
import { Button } from '@/components/ui/Button';
import { CheckCircle, MessageSquare, ArrowRight } from 'lucide-react';
import { parsePaymentCredentials, rememberPayment, type PaymentCredentials } from '@/lib/checkout';

type PixVerifyState = 'verifying' | 'confirmed' | 'failed';

// ============================================================
// /sucesso — retorno do checkout Asaas
// (?paymentId=... ou ?externalReference=...)
// Verifica no servidor via /api/checkout/status com polling curto.
// Sem identificador, mostra erro orientado.
// ============================================================

function useAsaasVerification(
  paymentId: string | null,
  externalReference: string | null,
): PixVerifyState {
  const [state, setState] = useState<PixVerifyState>(() =>
    paymentId || externalReference ? 'verifying' : 'failed',
  );

  useEffect(() => {
    if (!paymentId && !externalReference) return;
    let cancelled = false;
    let tries = 0;
    let credentials: PaymentCredentials | null = null;

    async function recoverCredentials() {
      if (!externalReference && !paymentId) return null;
      const response = await fetch('/api/checkout/order', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(externalReference ? { externalReference } : { paymentId }), cache: 'no-store', signal: AbortSignal.timeout(12000) });
      if (!response.ok || cancelled) return null;
      const data = await response.json();
      const recovered = parsePaymentCredentials(data.credentials);
      if (recovered) rememberPayment({ ...recovered, ...(paymentId ? { paymentId } : {}) });
      return recovered;
    }

    const check = async (): Promise<boolean> => {
      try {
        if (!credentials) {
          try { credentials = parsePaymentCredentials(JSON.parse(sessionStorage.getItem(`nexos-payment:${paymentId ?? externalReference}`) ?? 'null')); } catch {}
          credentials ??= await recoverCredentials();
        }
        if (!credentials || cancelled) return false;
        const res = await fetch('/api/checkout/status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(credentials),
          cache: 'no-store',
          signal: AbortSignal.timeout(20000),
        });
        if (res.status === 403) { credentials = await recoverCredentials(); return false; }
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
  }, [paymentId, externalReference]);

  return state;
}

export default function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const paymentId = searchParams.get('paymentId') ?? searchParams.get('payment_id');
  const externalReference = searchParams.get('externalReference') ?? searchParams.get('external_reference') ?? searchParams.get('order_nsu');
  // Compat: antiga URL InfinitePay usava order_nsu — mantém leitura

  const pixState = useAsaasVerification(paymentId, externalReference);

  const txLabel = paymentId ?? externalReference ?? 'não informado';
  const whatsappUrl = `https://wa.me/${config.whatsapp.number}?text=${encodeURIComponent(
    `Olá! Concluí o pagamento do pedido ${txLabel}. Gostaria de confirmar os próximos passos com a NexOS.`,
  )}`;

  if (pixState === 'verifying') {
    return (
      <div className={styles.container}>
        <div className={styles.success}>
          <div className={styles.iconWrapper} aria-hidden="true">
            <div className={styles.spinner} role="status" aria-label="Confirmando pagamento" />
          </div>
          <h1 className={styles.title}>Confirmando seu pagamento…</h1>
          <p className={styles.subtitle}>
            Voltamos do checkout do Asaas e estamos conferindo a confirmação. Aguarde alguns segundos — esta página atualiza sozinha.
          </p>
          {(paymentId || externalReference) && (
            <div className={styles.details}>
              <p className={styles.sessionId}>
                Pedido: <code>{txLabel}</code>
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (pixState !== 'confirmed') {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <h1 className={styles.errorTitle}>Não foi possível verificar</h1>
          <p className={styles.errorText}>
            Ainda não consta a confirmação desse pagamento. Se você já pagou, aguarde 1 minuto e recarregue — ou fale com a gente que conferimos na hora.
          </p>
          <div className={styles.errorActions}>
            <Button variant="primary" size="lg" onClick={() => router.push('/#contact')}>
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
            Recebemos a confirmação do pagamento. Você pode acompanhar os detalhes do pedido na sua conta.
        </p>
        <div className={styles.details}>
          <p className={styles.sessionId}>
            ID da transação: <code>{txLabel}</code>
          </p>
        </div>
        <div className={styles.actions}>
          <Button variant="primary" size="lg" onClick={() => router.push('/conta')}>
            Ver meus pedidos
          </Button>
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className={styles.whatsappButton}>
            <MessageSquare size={22} strokeWidth={2.5} aria-hidden="true" />
            <span>Continuar no WhatsApp</span>
            <ArrowRight size={20} strokeWidth={2.5} aria-hidden="true" />
          </a>
          <Button variant="secondary" size="lg" onClick={() => router.push('/')}>
            Voltar ao início
          </Button>
        </div>
        <p className={styles.nextSteps}>
          <strong>Próximos passos:</strong> Acompanhe o pedido na sua conta. Fale com a equipe para alinhar a entrega, personalização ou execução do serviço.
        </p>
      </div>
    </div>
  );
}
