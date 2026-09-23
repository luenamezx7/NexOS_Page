'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from 'lucide-react';
import { Turnstile } from '@/components/Turnstile';
import { PasswordStrengthMeter } from '@/components/auth/PasswordStrengthMeter';
import { evaluatePassword } from '@/lib/auth/password-strength';
import { sanitizeCallbackPath } from '@/lib/auth/callback';

type AuthResult = { ok?: boolean; error?: string; message?: string; factorId?: string; enrollmentRequired?: boolean; qr?: string; secret?: string };

type Mode = 'login' | 'signup' | 'resend' | 'otp' | 'otp-verify';
type Step = 'login' | 'factor' | 'enroll' | 'verify';

interface LoginFormProps {
  initialMfa: boolean;
  audience?: 'admin' | 'user';
  confirmationError?: boolean;
  callbackUrl?: string | null;
}

export function LoginForm({ initialMfa, audience = 'admin', confirmationError = false, callbackUrl = null }: LoginFormProps) {
  const userFlow = audience === 'user';
  const router = useRouter();
  const busyRef = useRef(false);
  const safeCallback = sanitizeCallbackPath(callbackUrl);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(confirmationError ? 'Link inválido ou expirado. Entre com sua senha se o e-mail já foi confirmado, ou solicite outro link.' : '');
  const [message, setMessage] = useState('');
  const [mode, setMode] = useState<Mode>('login');
  const [formKey, setFormKey] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [otpEmail, setOtpEmail] = useState('');
  const [captcha, setCaptcha] = useState('');
  const [captchaKey, setCaptchaKey] = useState(0);
  const [step, setStep] = useState<Step>(initialMfa ? 'factor' : 'login');
  const [factor, setFactor] = useState<AuthResult>({});

  const destination = () => safeCallback ?? (userFlow ? '/conta' : '/dashboard');
  const captchaEnforced = !!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  async function submit(action: string, body: object = {}) {
    if (busyRef.current) return;
    busyRef.current = true; setBusy(true); setError(''); setMessage('');
    try {
      const response = await fetch(`/api/auth/${userFlow ? 'user-' : ''}${action}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(20000) });
      const result: AuthResult = await response.json();
      if (!response.ok) throw new Error(result.error ?? 'Não foi possível entrar.');
      if (action === 'logout') { setStep('login'); setFactor({}); router.refresh(); return; }
      if (result.message) {
        setMessage(result.message);
        setPassword('');
        setFormKey(v => v + 1);
        if (action === 'otp') { setOtpEmail(String((body as { email?: string }).email ?? '')); setMode('otp-verify'); }
        else setMode('login');
        return;
      }
      if (result.ok) { setFactor({}); router.replace(destination()); router.refresh(); return; }
      setFactor(result);
      setStep(result.enrollmentRequired ? 'enroll' : 'verify');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Conexão indisponível. Tente novamente.');
    } finally {
      if (['login', 'signup', 'resend', 'otp'].includes(action)) { setCaptcha(''); setCaptchaKey(v => v + 1); }
      busyRef.current = false; setBusy(false);
    }
  }

  function goMode(next: Mode) {
    setMode(next); setError(''); setMessage(''); setPassword(''); setFormKey(v => v + 1);
  }

  function handlePasswordSubmit(form: FormData) {
    const email = String(form.get('email') ?? '');
    const pass = String(form.get('password') ?? '');
    if (mode === 'signup') {
      if (pass !== String(form.get('confirmPassword') ?? '')) { setError('As senhas precisam ser iguais.'); return; }
      if (!evaluatePassword(pass).acceptable) {
        setError('A senha precisa de: 12+ caracteres, maiúscula, minúscula, número e símbolo.');
        return;
      }
    }
    void submit(mode, { email, ...(mode !== 'resend' ? { password: pass } : {}), captcha });
  }

  // ── Layout distinto por audiência ──
  const adminShell = !userFlow;

  return (
    <main className={`min-h-[100dvh] px-6 py-8 sm:px-10 ${adminShell ? 'bg-canvas text-ink' : 'bg-canvas text-ink'}`}>
      <header className="mx-auto flex max-w-6xl items-center justify-between border-b border-ink/15 pb-6">
        <Link href="/" className="font-display text-2xl font-black tracking-tighter">NexOS<span className="text-[#cf315e]">.</span></Link>
        <Link href="/" className="flex items-center gap-2 text-sm hover:underline"><ArrowLeft size={16} /> Voltar ao site</Link>
      </header>

      <div className="mx-auto grid max-w-6xl gap-12 py-12 md:min-h-[75dvh] md:grid-cols-2 md:items-center md:gap-20">
        {/* Painel lateral */}
        <section className={adminShell ? 'rounded-2xl border border-ink/10 bg-[#0e1116] p-8 text-white/90 md:p-10' : ''}>
          {adminShell ? (
            <>
              <p className="font-mono text-xs uppercase tracking-[.22em] text-white/45">NexOS Ops • Controlled Access</p>
              <h1 className="mt-4 font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl">Ambiente administrativo restrito.</h1>
              <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/60">Sessão monitorada, exigência de autenticação em duas etapas e allowlist de operadores. Acesso negado a contas não autorizadas.</p>
              <ul className="mt-8 space-y-2 border-t border-white/10 pt-6 font-mono text-[11px] uppercase tracking-[.14em] text-white/40">
                <li>• MFA obrigatório (TOTP)</li>
                <li>• Allowlist por UUID</li>
                <li>• Rate limit + CSRF + CSP</li>
              </ul>
            </>
          ) : (
            <>
              <ShieldCheck size={32} strokeWidth={1.5} className="mb-6 text-[#cf315e]" aria-hidden="true" />
              <p className="mb-4 font-mono text-xs uppercase tracking-[.18em]">Área do cliente</p>
              <h1 className="max-w-md font-display text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl">Seu acesso. Sua segurança.</h1>
              <p className="mt-6 max-w-sm text-base leading-relaxed text-ink/75">Acesse sua conta NexOS com e-mail verificado e uma segunda camada de proteção.</p>
              <p className="mt-10 border-t border-ink/15 pt-5 text-sm text-ink/75">Na primeira entrada, escaneie o QR Code com Google Authenticator, Authy ou Microsoft Authenticator. Nas próximas, basta digitar o código de 6 dígitos.</p>
            </>
          )}
        </section>

        {/* Formulário */}
        <section className="w-full max-w-md md:justify-self-end" aria-labelledby="login-title">
          <div className="mb-8 flex items-center gap-3">
            {adminShell ? <LockKeyhole size={20} aria-hidden="true" /> : <LockKeyhole size={20} aria-hidden="true" />}
            <h2 id="login-title" className="text-xl font-semibold">
              {step !== 'login' ? 'Verificação em duas etapas' : mode === 'signup' ? 'Criar sua conta' : mode === 'resend' ? 'Confirmar seu e-mail' : mode === 'otp' ? 'Código por e-mail' : mode === 'otp-verify' ? 'Digite o código recebido' : adminShell ? 'Entrada do operador' : 'Entrar na sua conta'}
            </h2>
          </div>

          {step === 'login' && (mode === 'login' || mode === 'signup' || mode === 'resend') ? (
            <form key={`${mode}-${formKey}`} className="flex flex-col gap-5" onSubmit={e => { e.preventDefault(); handlePasswordSubmit(new FormData(e.currentTarget)); }}>
              <div className="space-y-2"><label htmlFor="login-email" className="block text-sm font-medium">E-mail</label><input id="login-email" name="email" type="email" autoComplete="username" required maxLength={254} className="field-input w-full" disabled={busy} /></div>
              {mode !== 'resend' && (
                <div className="flex flex-col gap-2">
                  <label htmlFor="login-password" className="block text-sm font-medium">Senha</label>
                  <div className="relative">
                    <input
                      id="login-password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                      required
                      minLength={mode === 'signup' ? 12 : 1}
                      maxLength={256}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      aria-describedby={mode === 'signup' ? 'password-help password-strength' : undefined}
                      className="field-input w-full !pr-14"
                      disabled={busy}
                    />
                    <button type="button" onClick={() => setShowPassword(v => !v)} aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'} aria-pressed={showPassword} className="absolute inset-y-0 right-0 px-4 focus-visible:outline-2">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                  </div>
                  {mode === 'signup' && (
                    <>
                      <p id="password-help" className="text-sm text-ink/75">Mínimo de 12 caracteres, com maiúscula, minúscula, número e símbolo.</p>
                      <PasswordStrengthMeter password={password} id="password-strength" />
                    </>
                  )}
                </div>
              )}
              {mode === 'signup' && <div className="flex flex-col gap-2"><label htmlFor="confirm-password" className="text-sm font-medium">Confirmar senha</label><input id="confirm-password" name="confirmPassword" type="password" autoComplete="new-password" minLength={12} maxLength={256} required disabled={busy} className="field-input w-full" /></div>}
              <Turnstile key={captchaKey} onVerify={setCaptcha} onExpire={() => setCaptcha('')} onError={() => { setCaptcha(''); setError('Verificação indisponível. Recarregue a página.'); }} />
              <button disabled={busy || (captchaEnforced && !captcha)} className="btn-primary-nex w-full justify-center disabled:opacity-60">
                {busy ? 'Verificando…' : mode === 'signup' ? 'Criar conta' : mode === 'resend' ? 'Reenviar confirmação' : 'Entrar'}
                <ArrowRight size={16} />
              </button>
              {userFlow && (
                <div className="flex flex-wrap gap-4 text-sm">
                  <button type="button" disabled={busy} className="underline underline-offset-4" onClick={() => goMode(mode === 'login' ? 'signup' : 'login')}>{mode === 'login' ? 'Criar uma conta' : 'Já tenho conta'}</button>
                  {mode !== 'resend' && <button type="button" disabled={busy} className="underline underline-offset-4" onClick={() => goMode('resend')}>Reenviar e-mail de confirmação</button>}
                  {mode === 'login' && <button type="button" disabled={busy} className="underline underline-offset-4" onClick={() => goMode('otp')}>Entrar com código por e-mail</button>}
                </div>
              )}
            </form>
          ) : step === 'login' && mode === 'otp' ? (
            <form key={`otp-${formKey}`} className="flex flex-col gap-5" onSubmit={e => { e.preventDefault(); const form = new FormData(e.currentTarget); void submit('otp', { email: form.get('email'), captcha }); }}>
              <p className="text-sm leading-relaxed text-ink/75">Enviaremos um código de 6 dígitos para o seu e-mail. Válido por alguns minutos.</p>
              <div className="space-y-2"><label htmlFor="otp-email" className="block text-sm font-medium">E-mail</label><input id="otp-email" name="email" type="email" autoComplete="username" required maxLength={254} className="field-input w-full" disabled={busy} /></div>
              <Turnstile key={captchaKey} onVerify={setCaptcha} onExpire={() => setCaptcha('')} onError={() => { setCaptcha(''); setError('Verificação indisponível. Recarregue a página.'); }} />
              <button disabled={busy || (captchaEnforced && !captcha)} className="btn-primary-nex w-full justify-center disabled:opacity-60">{busy ? 'Enviando…' : 'Enviar código por e-mail'}<Mail size={16} /></button>
              <button type="button" disabled={busy} className="self-start text-sm underline underline-offset-4" onClick={() => goMode('login')}>Voltar à senha</button>
            </form>
          ) : step === 'login' && mode === 'otp-verify' ? (
            <form key={`otp-verify-${formKey}`} className="flex flex-col gap-5" onSubmit={e => { e.preventDefault(); const form = new FormData(e.currentTarget); void submit('otp-verify', { email: otpEmail, token: form.get('token') }); }}>
              <p className="text-sm leading-relaxed text-ink/75">Digite o código enviado para <span className="font-medium text-ink">{otpEmail}</span>.</p>
              <div className="space-y-2">
                <label htmlFor="otp-token" className="block text-sm font-medium">Código de 6 dígitos</label>
                <input key={formKey} id="otp-token" name="token" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" minLength={6} maxLength={6} required className="field-input w-full font-mono tracking-[.4em]" disabled={busy} autoFocus />
              </div>
              <button disabled={busy} className="btn-primary-nex w-full justify-center disabled:opacity-60">{busy ? 'Verificando…' : 'Verificar código'}</button>
              <div className="flex flex-wrap gap-4 text-sm">
                <button type="button" disabled={busy} className="underline underline-offset-4" onClick={() => { void submit('otp', { email: otpEmail, captcha }); }}>Reenviar código</button>
                <button type="button" disabled={busy} className="underline underline-offset-4" onClick={() => goMode('login')}>Usar senha</button>
              </div>
            </form>
          ) : step === 'verify' ? (
            <form className="space-y-5" onSubmit={e => { e.preventDefault(); const form = new FormData(e.currentTarget); void submit('verify', { factorId: factor.factorId, code: form.get('code') }); }}>
              {factor.qr && (
                <div className="space-y-3">
                  <p className="text-sm leading-relaxed">Escaneie o QR Code usando um aplicativo autenticador como <strong>Google Authenticator</strong>, <strong>Authy</strong> ou <strong>Microsoft Authenticator</strong>. Depois, confirme o código gerado.</p>
                  <Image src={factor.qr} alt="QR code para configurar o autenticador" width={200} height={200} unoptimized className="rounded-xl bg-white p-3" />
                  <details className="text-sm"><summary className="cursor-pointer">Configurar manualmente</summary><code className="mt-2 block break-all select-all">{factor.secret}</code></details>
                </div>
              )}
              <div className="space-y-2"><label htmlFor="login-code" className="block text-sm font-medium">Código do autenticador</label><input key={step} id="login-code" name="code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" minLength={6} maxLength={6} required className="field-input w-full font-mono tracking-[.4em]" disabled={busy} autoFocus /><p className="text-sm text-ink/75">Informe os seis dígitos exibidos no aplicativo.</p></div>
              <button disabled={busy} className="btn-primary-nex w-full justify-center disabled:opacity-60">{busy ? 'Confirmando…' : 'Confirmar acesso'}</button>
            </form>
          ) : (
            <div className="space-y-5">
              <p className="text-sm leading-relaxed">
                {step === 'enroll'
                  ? 'Proteja sua conta: escaneie o QR Code com Google Authenticator, Authy ou Microsoft Authenticator e confirme o código gerado.'
                  : 'Continue para confirmar seu segundo fator de autenticação.'}
              </p>
              <button disabled={busy} onClick={() => void submit(step === 'enroll' ? 'enroll' : 'factor')} className="btn-primary-nex w-full justify-center disabled:opacity-60">{busy ? 'Preparando…' : step === 'enroll' ? 'Configurar autenticador' : 'Continuar'}</button>
            </div>
          )}

          {error && <p className="mt-5 rounded-lg border border-ink/20 p-3 text-sm" role="alert">{error}</p>}
          {message && <p className="mt-5 text-sm leading-relaxed" role="status">{message}</p>}
          {step !== 'login' && <button disabled={busy} onClick={() => void submit('logout')} className="mt-5 text-sm underline underline-offset-4">Sair e usar outra conta</button>}
          <p className="mt-8 text-sm leading-relaxed text-ink/75">{adminShell ? 'Acesso reservado à equipe NexOS. Tentativas são registradas.' : 'Problemas de acesso? Solicite ajuda ao responsável pela sua conta.'}</p>
        </section>
      </div>
    </main>
  );
}
