'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { attemptStorageKey, createCheckoutAttempt, parseCheckoutPayment, parsePaymentCredentials, rememberPayment, type BillingType, type CheckoutOrderSnapshot, type CheckoutPayment, type PaymentCredentials } from '@/lib/checkout';

export type PaymentState = 'restoring' | 'idle' | 'creating' | 'pending' | 'uncertain' | 'restore-error' | 'login-required' | 'closed';

export function useCheckoutPayment({ productId, quantity, enabled, onConfirmed }: { productId: string; quantity: number; enabled: boolean; onConfirmed: (reference: string) => void }) {
  const [state, setState] = useState<PaymentState>('restoring');
  const [payment, setPayment] = useState<CheckoutPayment | null>(null);
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);
  const [pollExpired, setPollExpired] = useState(false);
  const [orderReference, setOrderReference] = useState<string | null>(null);
  const attempt = useRef<string | null>(null);
  const credentials = useRef<PaymentCredentials | null>(null);
  const busy = useRef(false), alive = useRef(true), inFlight = useRef(false), confirmed = useRef(false);
  const success = useRef(onConfirmed);
  const storageKey = attemptStorageKey(productId, quantity);
  useEffect(() => { success.current = onConfirmed; }, [onConfirmed]);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);

  const forgetAttempt = useCallback(() => {
    attempt.current = null;
    try { sessionStorage.removeItem(storageKey); } catch {}
  }, [storageKey]);

  const recover = useCallback(async (signal?: AbortSignal) => {
    if (!attempt.current) { setState('idle'); return; }
    setState('restoring'); setError('');
    try {
      const response = await fetch('/api/checkout/order', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: attempt.current }), signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(12000)]) : AbortSignal.timeout(12000), cache: 'no-store' });
      if (!alive.current || signal?.aborted) return;
      if (response.status === 404) { forgetAttempt(); setState('idle'); return; }
      if (response.status === 401 || response.status === 403) { setState('login-required'); setError('Entre novamente para retomar este pedido.'); return; }
      if (!response.ok) throw new Error('Não foi possível retomar a cobrança. Consulte novamente antes de continuar.');
      const data: CheckoutOrderSnapshot = await response.json();
      if (data.order && (data.order.productId !== productId || data.order.quantity !== quantity)) throw new Error('Esta tentativa pertence a outro pedido. Confira seus pedidos na sua conta.');
      credentials.current = parsePaymentCredentials(data.credentials);
      setOrderReference(credentials.current?.externalReference ?? null);
      const resumed = parseCheckoutPayment(data.payment);
      if (resumed) { credentials.current = resumed; setPayment(resumed); rememberPayment(resumed); setPollExpired(false); setState('pending'); }
      else { setState('uncertain'); setError('A cobrança está em processamento ou conciliação. Consulte o pedido antes de criar outro pagamento.'); }
    } catch (failure) {
      if (alive.current && !signal?.aborted) { setState('restore-error'); setError(failure instanceof Error ? failure.message : 'Não foi possível retomar o pedido.'); }
    }
  }, [forgetAttempt, productId, quantity]);

  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    const frame = requestAnimationFrame(() => {
      setPayment(null); setOrderReference(null); credentials.current = null; confirmed.current = false;
      try { const stored = sessionStorage.getItem(storageKey); attempt.current = stored && /^[\da-f-]{36}$/i.test(stored) ? stored : null; } catch { attempt.current = null; }
      void recover(controller.signal);
    });
    return () => { controller.abort(); cancelAnimationFrame(frame); };
  }, [enabled, storageKey, recover]);

  const confirm = useCallback((reference: string) => {
    if (confirmed.current || !alive.current) return;
    confirmed.current = true; forgetAttempt(); success.current(reference);
  }, [forgetAttempt]);

  const verify = useCallback(async (signal?: AbortSignal) => {
    if (!credentials.current || inFlight.current) return;
    inFlight.current = true;
    try {
      const current = credentials.current;
      const response = await fetch('/api/checkout/status', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(current), cache: 'no-store', signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(12000)]) : AbortSignal.timeout(12000) });
      if (!alive.current || signal?.aborted) return;
      const data: { paid?: boolean; status?: string } = await response.json().catch(() => ({}));
      if (response.ok && data.paid === true) { confirm(current.externalReference); return; }
      if (response.ok && /REFUND|CHARGEBACK|CANCEL|DELETED/.test(data.status ?? '')) { setState('closed'); setError('Este pagamento foi encerrado ou está em revisão. Confira seu pedido na sua conta.'); return; }
      if (!response.ok) setError('Não foi possível consultar o pagamento agora. A cobrança continua disponível; tente verificar novamente.');
      else setError('');
    } catch { if (alive.current && !signal?.aborted) setError('A consulta demorou mais que o esperado. Verifique novamente em instantes.'); }
    finally { inFlight.current = false; }
  }, [confirm]);

  useEffect(() => {
    if (state !== 'pending') return;
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>, tries = 0;
    async function tick() {
      if (controller.signal.aborted) return;
      if (!document.hidden) { tries++; await verify(controller.signal); }
      if (controller.signal.aborted || confirmed.current) return;
      if (tries >= 60) { setPollExpired(true); return; }
      timer = setTimeout(tick, 5000);
    }
    timer = setTimeout(tick, 1500);
    return () => { controller.abort(); clearTimeout(timer); };
  }, [state, verify]);

  const generate = useCallback(async (payer: { name: string; email: string; cpfCnpj: string }, billingType: BillingType, installments: number, turnstileToken: string | null) => {
    if (busy.current || state !== 'idle') return;
    busy.current = true; setState('creating'); setError('');
    try {
      attempt.current ??= createCheckoutAttempt();
      try { sessionStorage.setItem(storageKey, attempt.current); } catch {}
      const response = await fetch('/api/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': attempt.current }, body: JSON.stringify({ productId, quantity, ...payer, billingType, installments, ...(turnstileToken ? { turnstileToken } : {}) }), signal: AbortSignal.timeout(25000) });
      const body = await response.json().catch(() => ({}));
      if (!alive.current) return;
      if (response.status === 401) { setState('login-required'); setError('Sua sessão expirou. Entre novamente para continuar.'); return; }
      if ([400, 403, 429].includes(response.status)) { forgetAttempt(); setState('idle'); setError(typeof body.error === 'string' ? body.error : 'Confira os dados e tente novamente.'); return; }
      const created = response.ok ? parseCheckoutPayment(body) : null;
      if (!created) { setState('uncertain'); setError(typeof body.error === 'string' ? body.error : 'Não foi possível confirmar a criação da cobrança. Consulte o pedido antes de tentar pagar novamente.'); return; }
      setPayment(created); setOrderReference(created.externalReference); credentials.current = created; rememberPayment(created); setPollExpired(false); setState('pending');
    } catch { if (alive.current) { setState('uncertain'); setError('A conexão foi interrompida. A cobrança pode ter sido criada; consulte o pedido antes de tentar novamente.'); } }
    finally { busy.current = false; }
  }, [forgetAttempt, productId, quantity, state, storageKey]);

  const checkNow = useCallback(async () => {
    if (inFlight.current || checking) return;
    setChecking(true); await verify(); if (alive.current) setChecking(false);
  }, [checking, verify]);
  return { state, payment, error, checking, pollExpired, orderReference, generate, recover, checkNow };
}
