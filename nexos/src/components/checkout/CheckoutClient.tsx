'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, ArrowUpRight, Check, ChevronDown, Code2, Copy, CreditCard, Loader2, LockKeyhole, Minus, Plus, QrCode, Receipt, RefreshCw, ShieldCheck } from 'lucide-react';
import type { Service } from '@/types';
import { config } from '@/config';
import { BULK_MAX_QTY, bulkTag, bulkUnitPrice } from '@/lib/bulk-pricing';
import { checkoutFieldErrors, checkoutHref, checkoutLoginHref, formatCpfCnpj, money, paymentSuccessHref, type BillingType } from '@/lib/checkout';
import { useTurnstileConfig } from '@/lib/use-turnstile-config';
import { AuthHeader } from '../auth/AuthFrame';
import { useTheme } from '../ThemeProvider';
import { Turnstile } from '../Turnstile';
import { MetallicButton, MetallicSurface } from '../ui/metallic-button';
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '../ui/field';
import { Alert, AlertDescription } from '../ui/alert';
import { useCheckoutPayment } from './useCheckoutPayment';
import styles from './Checkout.module.css';

type SessionState = 'loading' | 'ready' | 'anonymous' | 'error';
type Gateway = { ok: boolean; methods: { PIX: boolean; BOLETO: boolean; CREDIT_CARD: boolean } };
type Installment = { installment: number; value: number; total: number };
const METHODS = [{ id: 'CREDIT_CARD' as const, label: 'Cartão', icon: CreditCard }, { id: 'BOLETO' as const, label: 'Boleto', icon: Receipt }, { id: 'PIX' as const, label: 'Pix', icon: QrCode }];

export function CheckoutClient({ product, initialQuantity }: { product: Service; initialQuantity: number }) {
  const router = useRouter();
  const { theme } = useTheme();
  const [quantity, setQuantity] = useState(initialQuantity);
  const [session, setSession] = useState<SessionState>('loading');
  const [sessionAttempt, setSessionAttempt] = useState(0);
  const [sessionEmail, setSessionEmail] = useState('');
  const [name, setName] = useState(''), [email, setEmail] = useState(''), [cpfCnpj, setCpfCnpj] = useState('');
  const [errors, setErrors] = useState({ name: '', email: '', cpfCnpj: '' });
  const [step, setStep] = useState<'details' | 'payment'>('details');
  const [summaryExpanded, setSummaryExpanded] = useState(false);
  const [gateway, setGateway] = useState<Gateway | null>(null);
  const [gatewayError, setGatewayError] = useState('');
  const [gatewayAttempt, setGatewayAttempt] = useState(0);
  const [billingType, setBillingType] = useState<BillingType>('CREDIT_CARD');
  const [installments, setInstallments] = useState(1);
  const [options, setOptions] = useState<Installment[]>([]);
  const [optionsError, setOptionsError] = useState('');
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [captchaKey, setCaptchaKey] = useState(0);
  const [copied, setCopied] = useState(false);
  const captcha = useTurnstileConfig();
  const heading = useRef<HTMLHeadingElement>(null);
  const onConfirmed = useCallback((reference: string) => router.replace(paymentSuccessHref(reference)), [router]);
  const checkout = useCheckoutPayment({ productId: product.id, quantity, enabled: session === 'ready', onConfirmed });
  const physical = product.id === 'placa';
  const unit = bulkUnitPrice(product.price, quantity, product.id);
  const total = checkout.payment ? checkout.payment.amount / 100 : unit * quantity;
  const locked = step === 'payment' || ['creating', 'pending', 'uncertain', 'restore-error', 'login-required', 'closed'].includes(checkout.state) || (session === 'ready' && checkout.state === 'restoring');
  const optionsLoading = billingType === 'CREDIT_CARD' && options.length === 0 && !optionsError;
  const actualStep = !['idle', 'restoring'].includes(checkout.state) ? 'payment' : step;
  const loginHref = checkoutLoginHref(product.id, quantity);

  useEffect(() => {
    const controller = new AbortController();
    void fetch('/api/auth/session', { cache: 'no-store', signal: AbortSignal.any([controller.signal, AbortSignal.timeout(12000)]) }).then(async response => {
      if (controller.signal.aborted) return;
      if (response.status === 401 || response.status === 403) { setSession('anonymous'); return; }
      const data = await response.json();
      if (controller.signal.aborted) return;
      if (!response.ok || data.ok !== true || typeof data.email !== 'string') throw new Error('Session unavailable');
      setSessionEmail(data.email); setEmail(current => current || data.email); setSession('ready');
      // Optional account prefill; no payer information is written to browser storage.
      void fetch('/api/account/profile', { cache: 'no-store', signal: controller.signal }).then(async profile => {
        if (!profile.ok) return;
        const data = await profile.json();
        if (!controller.signal.aborted && typeof data.fullName === 'string') setName(current => current || data.fullName);
      }).catch(() => {});
    }).catch(() => { if (!controller.signal.aborted) setSession('error'); });
    return () => controller.abort();
  }, [sessionAttempt]);

  useEffect(() => {
    const controller = new AbortController();
    void fetch('/api/checkout', { cache: 'no-store', signal: controller.signal }).then(async response => {
      const data = await response.json();
      if (!response.ok || typeof data.ok !== 'boolean' || typeof data.methods?.CREDIT_CARD !== 'boolean' || typeof data.methods?.BOLETO !== 'boolean' || typeof data.methods?.PIX !== 'boolean') throw new Error('Unavailable');
      if (!controller.signal.aborted) setGateway({ ok: data.ok, methods: data.methods });
    }).catch(() => { if (!controller.signal.aborted) setGatewayError('Não foi possível carregar os pagamentos. Tente consultar novamente.'); });
    return () => controller.abort();
  }, [gatewayAttempt]);

  useEffect(() => {
    if (session !== 'ready' || actualStep !== 'payment' || checkout.state !== 'idle' || billingType !== 'CREDIT_CARD') return;
    const controller = new AbortController();
    void fetch(`/api/checkout/installments?${new URLSearchParams({ productId: product.id, quantity: String(quantity) })}`, { signal: AbortSignal.any([controller.signal, AbortSignal.timeout(10000)]), cache: 'no-store' }).then(async response => {
      const data = await response.json();
      if (!response.ok || !Array.isArray(data.installments) || !data.installments.length) throw new Error('Unavailable');
      if (!controller.signal.aborted) setOptions(data.installments);
    }).catch(() => { if (!controller.signal.aborted) setOptionsError('Não foi possível consultar as parcelas. Volte à revisão e tente novamente.'); });
    return () => controller.abort();
  }, [session, actualStep, checkout.state, billingType, product.id, quantity]);

  function updateQuantity(next: number) {
    if (locked) return;
    const value = Math.max(1, Math.min(BULK_MAX_QTY, next));
    setQuantity(value);
    window.history.replaceState(null, '', checkoutHref(product.id, value));
  }
  function review(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const invalid = checkoutFieldErrors(name, email, cpfCnpj); setErrors(invalid);
    const first = invalid.name ? 'checkout-name' : invalid.email ? 'checkout-email' : invalid.cpfCnpj ? 'checkout-cpf' : null;
    if (first) { document.getElementById(first)?.focus(); return; }
    setOptions([]); setOptionsError(''); setInstallments(1); setStep('payment'); requestAnimationFrame(() => heading.current?.focus());
  }
  async function createPayment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!gateway?.ok || captcha.loading || captcha.error || (captcha.required && (!captcha.configured || !turnstileToken))) return;
    await checkout.generate({ name: name.trim(), email: email.trim(), cpfCnpj: cpfCnpj.trim() }, billingType, billingType === 'CREDIT_CARD' ? installments : 1, turnstileToken);
    setTurnstileToken(null); setCaptchaKey(key => key + 1);
  }
  async function copyBoleto() {
    if (!checkout.payment?.identificationField) return;
    try { await navigator.clipboard.writeText(checkout.payment.identificationField); setCopied(true); }
    catch { setCopied(false); }
  }
  const canPay = checkout.state === 'idle' && gateway?.ok === true && billingType !== 'UNDEFINED' && gateway.methods[billingType] && !captcha.loading && !captcha.error && (!captcha.required || (captcha.configured && !!turnstileToken)) && (billingType !== 'CREDIT_CARD' || (!optionsLoading && !optionsError && options.length > 0));

  let content;
  if (session === 'loading' || (session === 'ready' && checkout.state === 'restoring')) {
    content = <div className={styles.authState} role="status"><Loader2 size={24} aria-hidden="true" /><h2>Preparando seu pedido.</h2><p>Estamos conferindo seu acesso e as cobranças já iniciadas.</p></div>;
  } else if (session === 'anonymous' || checkout.state === 'login-required') {
    content = <div className={styles.authState}><LockKeyhole size={28} aria-hidden="true" /><h2>Seu pedido, na sua conta.</h2><p>{checkout.error || 'Entre ou crie sua conta para finalizar e acompanhar esta compra. O produto e a quantidade serão preservados.'}</p><Link href={loginHref} className={`${styles.authLink} btn-primary-nex`}><MetallicSurface /><span className="metallic-content inline-flex items-center gap-2">Entrar ou criar conta <ArrowRight size={16} aria-hidden="true" /></span></Link></div>;
  } else if (session === 'error') {
    content = <div className={styles.authState}><h2>Não conseguimos verificar seu acesso.</h2><p>Seu pedido continua aqui. Tente consultar a sessão novamente.</p><MetallicButton onClick={() => { setSession('loading'); setSessionAttempt(value => value + 1); }}>Tentar novamente</MetallicButton></div>;
  } else if (['uncertain', 'restore-error', 'closed'].includes(checkout.state)) {
    content = <div className={styles.authState}><Receipt size={28} aria-hidden="true" /><h2>{checkout.state === 'closed' ? 'Pedido em revisão.' : 'Vamos conferir sua cobrança.'}</h2><Alert><AlertDescription>{checkout.error}</AlertDescription></Alert>{checkout.state !== 'closed' && <MetallicButton onClick={() => void checkout.recover()}><RefreshCw size={16} aria-hidden="true" /> Consultar pedido</MetallicButton>}{checkout.orderReference && checkout.state !== 'closed' && <button type="button" className="btn-secondary-nex" disabled={checkout.checking} onClick={() => void checkout.checkNow()}>Verificar pagamento</button>}<Link href="/conta" className="btn-secondary-nex">Ver meus pedidos <ArrowUpRight size={16} aria-hidden="true" /></Link><a href={`https://wa.me/${config.whatsapp.number}`} target="_blank" rel="noopener noreferrer" className={styles.back}>Falar com a NexOS <ArrowUpRight size={14} aria-hidden="true" /></a></div>;
  } else if (checkout.payment && checkout.state === 'pending') {
    const payment = checkout.payment;
    content = <div className={styles.pending}>
      <div className={styles.statusTitle}><span className={styles.statusIcon}><Receipt size={22} aria-hidden="true" /></span><div><h2>Cobrança pronta.</h2><p>{payment.billingType === 'BOLETO' ? 'Boleto' : payment.billingType === 'PIX' ? 'Pix' : 'Cartão'} · {money(payment.amount / 100)}{payment.installments > 1 ? ` · ${payment.installments} parcelas` : ''}</p></div></div>
      <p className={styles.panelLead}>A cobrança foi criada. O pedido será confirmado depois que o pagamento for verificado no servidor.</p>
      {checkout.error && <Alert><AlertDescription>{checkout.error}</AlertDescription></Alert>}
      {payment.billingType === 'BOLETO' && payment.identificationField && <div className={styles.boleto}><code aria-label="Linha digitável do boleto">{payment.identificationField}</code><button type="button" className={styles.copy} onClick={() => void copyBoleto()} aria-label={copied ? 'Linha digitável copiada' : 'Copiar linha digitável'}>{copied ? <Check size={16} /> : <Copy size={16} />}</button></div>}
      <div className={styles.statusActions}>
        <a href={payment.billingType === 'BOLETO' ? payment.bankSlipUrl ?? payment.paymentUrl : payment.paymentUrl} target="_blank" rel="noopener noreferrer" className="btn-primary-nex"><MetallicSurface /><span className="metallic-content inline-flex items-center gap-2">{payment.billingType === 'BOLETO' ? 'Abrir boleto' : 'Continuar no Asaas'} <ArrowUpRight size={16} aria-hidden="true" /></span></a>
        <button type="button" disabled={checkout.checking} className="btn-secondary-nex" onClick={() => void checkout.checkNow()}>{checkout.checking ? <Loader2 size={16} aria-hidden="true" /> : <RefreshCw size={16} aria-hidden="true" />}{checkout.checking ? 'Verificando…' : 'Já paguei, verificar'}</button>
      </div>
      <p className={styles.help} role="status">{checkout.pollExpired ? 'A verificação automática foi pausada. Você pode consultar novamente pelo botão acima.' : 'Aguardando confirmação. Esta página acompanha o pagamento automaticamente.'}</p>
      <p className={styles.reference}>Pedido: {payment.externalReference}</p>
      <p className={styles.help}>O pagamento abre em outra aba. Esta página continua acompanhando o pedido; dados de cartão são preenchidos diretamente no Asaas.</p>
      <Link href="/conta" className={styles.back}>Acompanhar na minha conta <ArrowUpRight size={14} aria-hidden="true" /></Link>
    </div>;
  } else if (actualStep === 'details') {
    content = <><h2 id="checkout-step-title">Quem está comprando?</h2><p className={styles.panelLead}>Confira seus dados para a cobrança e o recibo. A compra ficará vinculada a {sessionEmail}.</p><form onSubmit={review} className={styles.form} noValidate>
      <FieldGroup>
        <Field data-invalid={!!errors.name}><FieldLabel htmlFor="checkout-name">Nome completo</FieldLabel><input id="checkout-name" name="name" autoComplete="name" required maxLength={120} value={name} onChange={event => { setName(event.target.value); setErrors(current => ({ ...current, name: '' })); }} className="field-input" aria-invalid={!!errors.name} aria-describedby={errors.name ? 'checkout-name-error' : undefined} />{errors.name && <FieldError id="checkout-name-error">{errors.name}</FieldError>}</Field>
        <Field data-invalid={!!errors.email}><FieldLabel htmlFor="checkout-email">E-mail para o recibo</FieldLabel><input id="checkout-email" name="email" type="email" autoComplete="email" required maxLength={160} value={email} onChange={event => { setEmail(event.target.value); setErrors(current => ({ ...current, email: '' })); }} className="field-input" aria-invalid={!!errors.email} aria-describedby={errors.email ? 'checkout-email-error' : undefined} />{errors.email && <FieldError id="checkout-email-error">{errors.email}</FieldError>}</Field>
        <Field data-invalid={!!errors.cpfCnpj}><FieldLabel htmlFor="checkout-cpf">CPF ou CNPJ</FieldLabel><input id="checkout-cpf" name="cpfCnpj" inputMode="numeric" autoComplete="off" required maxLength={18} value={cpfCnpj} onChange={event => { setCpfCnpj(formatCpfCnpj(event.target.value)); setErrors(current => ({ ...current, cpfCnpj: '' })); }} className="field-input" aria-invalid={!!errors.cpfCnpj} aria-describedby={`checkout-document-help${errors.cpfCnpj ? ' checkout-cpf-error' : ''}`} /><FieldDescription id="checkout-document-help">Usado pelo Asaas para identificar a cobrança.</FieldDescription>{errors.cpfCnpj && <FieldError id="checkout-cpf-error">{errors.cpfCnpj}</FieldError>}</Field>
      </FieldGroup>
      <div className={styles.privacy}><ShieldCheck size={16} aria-hidden="true" /><p>Usamos estes dados para emitir a cobrança e acompanhar seu pedido. O pagamento é processado pelo Asaas. <Link href="/privacidade">Saiba como tratamos seus dados.</Link></p></div>
      <MetallicButton type="submit" className={styles.action}>Revisar e continuar <ArrowRight size={16} aria-hidden="true" /></MetallicButton>
    </form></>;
  } else {
    content = <>
      <div className={styles.receipt}><div><strong>{name}</strong><p>{email}</p><p>CPF/CNPJ: •••••••••{cpfCnpj.replace(/\D/g, '').slice(-2)}</p></div><button type="button" disabled={checkout.state === 'creating'} onClick={() => { setStep('details'); document.getElementById('checkout-page-title')?.focus(); }}>Editar dados</button></div>
      <h2 ref={heading} tabIndex={-1} id="checkout-step-title">Como você quer pagar?</h2><p className={styles.panelLead}>Confira o total no resumo. A cobrança só será criada ao continuar abaixo.</p>
      {checkout.error && <Alert variant="destructive" className="mb-5"><AlertDescription>{checkout.error}</AlertDescription></Alert>}
      {gatewayError && <Alert><AlertDescription>{gatewayError}<button type="button" className={styles.back} onClick={() => { setGateway(null); setGatewayError(''); setGatewayAttempt(value => value + 1); }}>Consultar pagamentos</button></AlertDescription></Alert>}
      {gateway && !gateway.ok && <Alert><AlertDescription>O pagamento está indisponível no momento. Fale com a NexOS ou tente novamente mais tarde.</AlertDescription></Alert>}
      <form onSubmit={createPayment}>
        <fieldset disabled={checkout.state === 'creating'}><legend className="sr-only">Método de pagamento</legend><div className={styles.methods}>{METHODS.map(({ id, label, icon: Icon }) => {
          const unavailable = !gateway?.methods[id];
          return <label key={id} className={styles.method} data-selected={billingType === id} data-disabled={unavailable}><input type="radio" name="billingType" value={id} checked={billingType === id} disabled={unavailable} onChange={() => { setBillingType(id); setInstallments(1); setOptions([]); setOptionsError(''); }} /><Icon size={20} aria-hidden="true" /><span>{label}</span>{unavailable && <small>Indisponível</small>}</label>;
        })}</div></fieldset>
        {billingType === 'CREDIT_CARD' && <div className={styles.installments}><label htmlFor="checkout-installments">Parcelas</label><select id="checkout-installments" className="field-input" disabled={checkout.state === 'creating' || optionsLoading || !!optionsError} value={installments} onChange={event => setInstallments(Number(event.target.value))}>{options.length ? options.map(option => <option key={option.installment} value={option.installment}>{option.installment}x de {money(option.value)} · total {money(option.total)}</option>) : <option value={1}>{optionsLoading ? 'Consultando parcelas…' : 'Pagamento à vista'}</option>}</select>{optionsError && <p className={styles.fieldError} role="alert">{optionsError}</p>}</div>}
        <p className={styles.providerNote}><LockKeyhole size={16} aria-hidden="true" />{billingType === 'BOLETO' ? 'Você receberá a linha digitável e o boleto para pagar no seu banco.' : 'O pagamento será concluído no ambiente do Asaas. A NexOS não recebe os dados do seu cartão.'}</p>
        {captcha.required && !captcha.error && <div className={styles.captcha}><Turnstile key={captchaKey} theme={theme} size="compact" onVerify={setTurnstileToken} onExpire={() => setTurnstileToken(null)} onError={() => setTurnstileToken(null)} /></div>}
        {captcha.error && <p className={styles.fieldError} role="alert">{captcha.error}</p>}
        <MetallicButton type="submit" className={styles.action} disabled={!canPay} aria-busy={checkout.state === 'creating'}>{checkout.state === 'creating' ? <><Loader2 size={16} aria-hidden="true" /> Preparando cobrança…</> : <>{billingType === 'BOLETO' ? 'Gerar boleto' : 'Continuar com pagamento'} <ArrowRight size={16} aria-hidden="true" /></>}</MetallicButton>
      </form>
    </>;
  }

  return <main className={styles.page}><AuthHeader /><div className={styles.container}>
    <header className={styles.intro}><Link href={physical ? '/#showcase' : '/#services'} className={styles.back}><ArrowLeft size={14} aria-hidden="true" /> Voltar ao produto</Link><h1 id="checkout-page-title" tabIndex={-1} className={`${styles.heading} brand-heading`}>Finalize seu pedido.</h1><p className={styles.lead}>Revise os dados e escolha como pagar.</p></header>
    {product.id === 'teste' && <Alert className="mb-6"><AlertDescription>Este produto valida a integração de pagamentos. Se você concluir a compra, o valor da cobrança é {money(product.price * quantity)}.</AlertDescription></Alert>}
    <div className={styles.layout}>
      <div className={styles.main}><ol className={styles.steps} aria-label="Etapas do checkout"><li aria-current={actualStep === 'details' ? 'step' : undefined}><span className={styles.stepNumber}>{actualStep === 'payment' ? <Check size={13} aria-hidden="true" /> : '01'}</span> Seus dados</li><li className={styles.stepLine} aria-hidden="true" /><li aria-current={actualStep === 'payment' ? 'step' : undefined}><span className={styles.stepNumber}>02</span> Pagamento</li></ol><section className={styles.panel} aria-label="Finalizar pedido">{content}</section></div>
      <aside className={styles.summary} aria-label="Resumo do pedido" data-expanded={summaryExpanded}><div className={styles.summaryHeader}><div className={styles.productImage}>{physical ? <Image src="/placas/codex-1.png" alt="Placa Inteligente NexOS" fill sizes="64px" /> : <span className={styles.productIcon}><Code2 size={24} aria-hidden="true" /></span>}</div><div className={styles.productTitle}><p>{physical ? 'Produto físico' : 'Serviço digital'}</p><h2>{product.id === 'teste' ? 'Teste de checkout' : product.title}</h2></div></div>
        <button type="button" className={styles.summaryToggle} aria-expanded={summaryExpanded} aria-controls="checkout-summary-details" onClick={() => setSummaryExpanded(value => !value)}>{summaryExpanded ? 'Ocultar detalhes do pedido' : 'Ver detalhes do pedido'} <ChevronDown size={16} aria-hidden="true" /></button>
        <div id="checkout-summary-details" className={styles.summaryBody} data-expanded={summaryExpanded}>
          <div className={styles.quantity}><span>Quantidade</span><div className={styles.quantityControls} role="group" aria-label="Quantidade do pedido"><button type="button" disabled={locked || quantity <= 1} onClick={() => updateQuantity(quantity - 1)} aria-label="Diminuir quantidade do pedido"><Minus size={14} aria-hidden="true" /></button><output aria-label="Quantidade do pedido selecionada">{quantity}</output><button type="button" disabled={locked || quantity >= BULK_MAX_QTY} onClick={() => updateQuantity(quantity + 1)} aria-label="Aumentar quantidade do pedido"><Plus size={14} aria-hidden="true" /></button></div></div>
          <ul className={styles.features}>{product.features.slice(0, 3).map(feature => <li key={feature}><Check size={14} aria-hidden="true" />{feature}</li>)}</ul>
          <div className={styles.priceRow}><span>Por unidade</span><strong>{money(unit)}</strong></div>{bulkTag(quantity, product.id) && <p className={styles.discount}>{bulkTag(quantity, product.id)} aplicado ao pedido.</p>}
        </div>
        <div className={styles.total}><span>Total do pedido</span><strong data-testid="checkout-total" aria-live="polite">{money(total)}</strong></div>
        <p className={styles.summaryNote}>{checkout.payment ? 'Valor confirmado pelo servidor na criação da cobrança.' : 'O valor será validado pelo servidor antes de criar a cobrança.'}</p>
        {physical && <p className={styles.summaryNote}>Personalização e entrega são alinhadas com a equipe NexOS.</p>}
        {product.id === 'dev' && <p className={styles.summaryNote}>Esta etapa gera a cobrança atual. Escopo e continuidade do serviço são alinhados com a equipe.</p>}
      </aside>
    </div>
    <nav className={styles.legal} aria-label="Condições da compra"><Link href="/termos">Termos de uso</Link><Link href="/privacidade">Privacidade</Link><Link href="/reembolso">Reembolso</Link><Link href="/conta">Minha conta</Link></nav>
  </div></main>;
}
