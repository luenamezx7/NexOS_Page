'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { ThemeToggle } from '@/components/ThemeToggle';
import styles from './LoginForm.module.css';
import { Turnstile } from '@/components/Turnstile';
import { PasswordStrengthMeter } from '@/components/auth/PasswordStrengthMeter';
import { evaluatePassword } from '@/lib/auth/password-strength';
import { sanitizeCallbackPath } from '@/lib/auth/callback';
import { useTurnstileConfig } from '@/lib/use-turnstile-config';

type AuthResult = { ok?: boolean; error?: string; message?: string; factorId?: string; enrollmentRequired?: boolean; qr?: string; secret?: string; url?: string };

type Mode = 'login' | 'signup' | 'resend' | 'otp' | 'otp-verify' | 'forgot';
type Step = 'login' | 'factor' | 'enroll' | 'verify';
type SocialProvider = 'google' | 'github';

interface LoginFormProps {
  initialMfa: boolean;
  audience?: 'admin' | 'user';
  confirmationError?: boolean;
  callbackUrl?: string | null;
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M12.24 10.285V14.4h6.806c-.275 1.765-2.056 5.174-6.806 5.174-4.095 0-7.439-3.389-7.439-7.574s3.344-7.574 7.439-7.574c2.33 0 3.891.989 4.785 1.849l3.254-3.138C18.189 1.186 15.479 0 12.24 0c-6.635 0-12 5.365-12 12s5.365 12 12 12c6.926 0 11.52-4.869 11.52-11.726 0-.788-.085-1.39-.189-1.989H12.24z" />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}

export function LoginForm({ initialMfa, audience = 'admin', confirmationError = false, callbackUrl = null }: LoginFormProps) {
  const userFlow = audience === 'user';
  const reduce = useReducedMotion();
  const busyRef = useRef(false);
  const safeCallback = sanitizeCallbackPath(callbackUrl);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(confirmationError ? 'Não foi possível concluir o acesso. O link pode ter expirado ou a autorização foi cancelada. Tente novamente com Google, GitHub ou seu e-mail neste navegador.' : '');
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
  const { required: captchaEnforced, loading: captchaLoading } = useTurnstileConfig();

  async function submit(action: string, body: object = {}) {
    if (busyRef.current) return;
    busyRef.current = true; setBusy(true); setError(''); setMessage('');
    let navigating = false;
    try {
      const response = await fetch(`/api/auth/${userFlow ? 'user-' : ''}${action}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...body, callbackUrl: safeCallback ?? undefined }), signal: AbortSignal.timeout(20000) });
      const result: AuthResult = await response.json();
      if (!response.ok) throw new Error(result.error ?? 'Não foi possível entrar.');
      if (action === 'logout') { setStep('login'); setFactor({}); navigating = true; window.location.replace(userFlow ? '/portal/acesso' : '/admin-dashboard-su/secure-entry'); return; }
      if (result.message) {
        setMessage(result.message);
        setPassword('');
        setFormKey(v => v + 1);
        if (action === 'otp') { setOtpEmail(String((body as { email?: string }).email ?? '')); setMode('otp-verify'); }
        else if (action !== 'forgot') setMode('login');
        return;
      }
      if (result.ok) {
        setFactor({});
        navigating = true;
        // A new document prevents prefetched anonymous RSC data surviving login.
        window.location.replace(destination());
        return;
      }
      setFactor(result);
      setStep(result.enrollmentRequired ? 'enroll' : 'verify');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Conexão indisponível. Tente novamente.');
    } finally {
      if (!navigating && ['login', 'signup', 'resend', 'otp', 'forgot'].includes(action)) { setCaptcha(''); setCaptchaKey(v => v + 1); }
      busyRef.current = false; setBusy(false);
    }
  }

  function goMode(next: Mode) {
    setCaptcha(''); setCaptchaKey(v => v + 1);
    setMode(next); setError(''); setMessage(''); setPassword(''); setFormKey(v => v + 1);
  }

  async function oauth(provider: SocialProvider) {
    if (busyRef.current) return;
    busyRef.current = true; setBusy(true); setError(''); setMessage('');
    try {
      const response = await fetch(`/api/auth/${userFlow ? 'user-' : ''}oauth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, callbackUrl: safeCallback ?? undefined }),
        signal: AbortSignal.timeout(20000),
      });
      const result: AuthResult = await response.json();
      if (!response.ok || !result.url) throw new Error(result.error ?? 'Não foi possível continuar com o acesso social.');
      // Navegação total para o provider (Google/GitHub) — não usar router do Next.
      window.location.assign(result.url);
      return;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Conexão indisponível. Tente novamente.');
      busyRef.current = false; setBusy(false);
    }
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
    if (mode === 'forgot') {
      void submit('forgot', { email, captcha });
      return;
    }
    void submit(mode, { email, ...(mode !== 'resend' ? { password: pass } : {}), captcha });
  }

  // ── Layout distinto por audiência ──
  const adminShell = !userFlow;

  return (
    <main className={userFlow ? styles.customer : 'min-h-[100dvh] bg-canvas px-6 py-8 text-ink sm:px-10'}>
      <header className={userFlow ? styles.header : 'mx-auto flex max-w-6xl items-center justify-between border-b border-ink/15 pb-6'}>
        <Link href="/" className="flex items-center gap-2.5" aria-label="NexOS — página inicial">
          <Image
            src="/nexos-branca-transparente.svg"
            alt="NexOS"
            width={110}
            height={26}
            priority
            className="logo-invert h-6 w-auto"
          />
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/" className="flex min-h-[44px] items-center gap-2 text-sm hover:underline"><ArrowLeft size={16} aria-hidden="true" /> Voltar ao site</Link>
          <ThemeToggle />
        </div>
      </header>

      <div className={userFlow ? styles.content : 'mx-auto grid max-w-6xl gap-12 py-12 md:min-h-[75dvh] md:grid-cols-2 md:items-center md:gap-20'}>
        {/* Painel lateral */}
        {adminShell && <section className="rounded-2xl border border-ink/10 bg-[#0e1116] p-8 text-white/90 md:p-10">
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
        </section>}

        {/* Formulário */}
        <motion.section initial={reduce ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className={userFlow ? styles.panel : 'w-full max-w-md md:justify-self-end'} aria-labelledby="login-title">
          {userFlow && <p className={styles.overline}>Sua conta NexOS</p>}
          <div className={userFlow ? styles.title : 'mb-8 flex items-center gap-3'}>
            {adminShell && <LockKeyhole size={20} aria-hidden="true" />}
            <h2 id="login-title" className="text-xl font-semibold">
              {step !== 'login' ? 'Verificação em duas etapas' : mode === 'signup' ? 'Criar sua conta' : mode === 'resend' ? 'Confirmar seu e-mail' : mode === 'otp' ? 'Código por e-mail' : mode === 'otp-verify' ? 'Digite o código recebido' : mode === 'forgot' ? 'Recuperar senha' : adminShell ? 'Entrada do operador' : 'Entrar na sua conta'}
            </h2>
          </div>
          {userFlow && <p className={styles.description}>{step !== 'login' ? 'Mais uma confirmação para proteger sua conta.' : mode === 'signup' ? 'Crie seu acesso para escolher e contratar suas soluções.' : mode === 'forgot' ? 'Informe o e-mail da conta. Enviaremos um link para criar uma nova senha.' : 'Entre para continuar de onde parou.'}</p>}

          {step === 'login' && (mode === 'login' || mode === 'signup' || mode === 'resend' || mode === 'forgot') ? (
            <>
              {(mode === 'login' || mode === 'signup') && (
                <div className="mb-6 flex flex-col gap-3">
                  <div className={`grid grid-cols-2 gap-3 ${userFlow ? styles.social : ''}`}>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void oauth('google')}
                      className="flex items-center justify-center gap-2 rounded-xl border border-ink/15 bg-ink/[0.03] px-4 py-2.5 text-sm font-medium transition hover:bg-ink/[0.07] focus-visible:outline-2 disabled:opacity-60"
                    >
                      <GoogleIcon /> Google
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void oauth('github')}
                      className="flex items-center justify-center gap-2 rounded-xl border border-ink/15 bg-ink/[0.03] px-4 py-2.5 text-sm font-medium transition hover:bg-ink/[0.07] focus-visible:outline-2 disabled:opacity-60"
                    >
                      <GitHubIcon /> GitHub
                    </button>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-ink/50" aria-hidden="true">
                    <span className="h-px flex-1 bg-ink/15" />
                    ou entre com e-mail
                    <span className="h-px flex-1 bg-ink/15" />
                  </div>
                  <p className={`text-center text-xs leading-relaxed text-ink/70 ${styles.legalNote}`}>
                    Consulte nossos{' '}
                    <Link href="/termos" className="underline underline-offset-2 transition-colors hover:text-ink/80">Termos de Uso</Link>
                    {' '}e{' '}
                    <Link href="/privacidade" className="underline underline-offset-2 transition-colors hover:text-ink/80">Política de Privacidade</Link>.
                  </p>
                </div>
              )}
            <form key={`${mode}-${formKey}`} className="flex flex-col gap-5" onSubmit={e => { e.preventDefault(); handlePasswordSubmit(new FormData(e.currentTarget)); }}>
              <div className="space-y-2"><label htmlFor="login-email" className="block text-sm font-medium">E-mail</label><input id="login-email" name="email" type="email" autoComplete="username" required maxLength={254} className="field-input w-full" disabled={busy || captchaLoading} /></div>
              {mode !== 'resend' && mode !== 'forgot' && (
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
                      disabled={busy || captchaLoading}
                    />
                    <button type="button" onClick={() => setShowPassword(v => !v)} aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'} aria-pressed={showPassword} className="absolute inset-y-0 right-0 px-4 focus-visible:outline-2">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                  </div>
                  {mode === 'signup' && (
                    <>
                      <p id="password-help" className="text-sm text-ink/75">Mínimo de 12 caracteres, com maiúscula, minúscula, número e símbolo.</p>
                      <PasswordStrengthMeter password={password} id="password-strength" />
                    </>
                  )}
                  {mode === 'login' && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => goMode('forgot')}
                      className="self-start text-sm underline underline-offset-4"
                    >
                      Esqueceu a senha?
                    </button>
                  )}
                </div>
              )}
              {mode === 'signup' && <div className="flex flex-col gap-2"><label htmlFor="confirm-password" className="text-sm font-medium">Confirmar senha</label><input id="confirm-password" name="confirmPassword" type="password" autoComplete="new-password" minLength={12} maxLength={256} required disabled={busy} className="field-input w-full" /></div>}
              <Turnstile key={captchaKey} onVerify={setCaptcha} onExpire={() => setCaptcha('')} onError={() => { setCaptcha(''); setError('Verificação indisponível. Recarregue a página.'); }} />
              <button type="submit" disabled={busy || (captchaEnforced && !captcha)} className="btn-primary-nex w-full justify-center disabled:opacity-60">
                {busy ? (mode === 'forgot' ? 'Enviando…' : 'Verificando…') : mode === 'signup' ? 'Criar conta' : mode === 'resend' ? 'Reenviar confirmação' : mode === 'forgot' ? 'Enviar link de redefinição' : 'Entrar'}
                <ArrowRight size={16} />
              </button>
              {userFlow && (
                <div className="flex flex-wrap gap-4 text-sm">
                  <button type="button" disabled={busy} className="underline underline-offset-4" onClick={() => goMode(mode === 'login' || mode === 'forgot' ? 'signup' : 'login')}>{mode === 'login' || mode === 'forgot' ? 'Criar uma conta' : 'Já tenho conta'}</button>
                  {mode !== 'resend' && mode !== 'forgot' && <button type="button" disabled={busy} className="underline underline-offset-4" onClick={() => goMode('resend')}>Reenviar e-mail de confirmação</button>}
                  {mode === 'login' && <button type="button" disabled={busy} className="underline underline-offset-4" onClick={() => goMode('otp')}>Entrar com código por e-mail</button>}
                  {mode === 'forgot' && <button type="button" disabled={busy} className="underline underline-offset-4" onClick={() => goMode('login')}>Voltar ao login</button>}
                </div>
              )}
              {!userFlow && mode === 'forgot' && (
                <button type="button" disabled={busy} className="self-start text-sm underline underline-offset-4" onClick={() => goMode('login')}>
                  Voltar ao login
                </button>
              )}
            </form>
            </>
          ) : step === 'login' && mode === 'otp' ? (
            <form key={`otp-${formKey}`} className="flex flex-col gap-5" onSubmit={e => { e.preventDefault(); const form = new FormData(e.currentTarget); void submit('otp', { email: form.get('email'), captcha }); }}>
              <p className="text-sm leading-relaxed text-ink/75">Enviaremos um código de 6 dígitos para o seu e-mail. Válido por alguns minutos.</p>
              <div className="space-y-2"><label htmlFor="otp-email" className="block text-sm font-medium">E-mail</label><input id="otp-email" name="email" type="email" autoComplete="username" required maxLength={254} className="field-input w-full" disabled={busy} /></div>
              <Turnstile key={captchaKey} onVerify={setCaptcha} onExpire={() => setCaptcha('')} onError={() => { setCaptcha(''); setError('Verificação indisponível. Recarregue a página.'); }} />
              <button type="submit" disabled={busy || (captchaEnforced && !captcha)} className="btn-primary-nex w-full justify-center disabled:opacity-60">{busy ? 'Enviando…' : 'Enviar código por e-mail'}<Mail size={16} /></button>
              <button type="button" disabled={busy} className="self-start text-sm underline underline-offset-4" onClick={() => goMode('login')}>Voltar à senha</button>
            </form>
          ) : step === 'login' && mode === 'otp-verify' ? (
            <form key={`otp-verify-${formKey}`} className="flex flex-col gap-5" onSubmit={e => { e.preventDefault(); const form = new FormData(e.currentTarget); void submit('otp-verify', { email: otpEmail, token: form.get('token') }); }}>
              <p className="text-sm leading-relaxed text-ink/75">Digite o código enviado para <span className="font-medium text-ink">{otpEmail}</span>.</p>
              <div className="space-y-2">
                <label htmlFor="otp-token" className="block text-sm font-medium">Código de 6 dígitos</label>
                <input key={formKey} id="otp-token" name="token" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" minLength={6} maxLength={6} required className="field-input w-full font-mono tracking-[.4em]" disabled={busy} autoFocus />
              </div>
              <button type="submit" disabled={busy} className="btn-primary-nex w-full justify-center disabled:opacity-60">{busy ? 'Verificando…' : 'Verificar código'}</button>
              <Turnstile key={captchaKey} onVerify={setCaptcha} onExpire={() => setCaptcha('')} onError={() => { setCaptcha(''); setError('Verificação indisponível. Atualize a página.'); }} />
              <div className="flex flex-wrap gap-4 text-sm">
                <button type="button" disabled={busy || (captchaEnforced && !captcha)} className="underline underline-offset-4" onClick={() => { void submit('otp', { email: otpEmail, captcha }); }}>Reenviar código</button>
                <button type="button" disabled={busy} className="underline underline-offset-4" onClick={() => goMode('login')}>Usar senha</button>
              </div>
            </form>
          ) : step === 'verify' ? (
            <form className="space-y-5" onSubmit={e => { e.preventDefault(); const form = new FormData(e.currentTarget); void submit('verify', { factorId: factor.factorId, code: form.get('code') }); }}>
              {factor.qr && (
                <div className="space-y-3">
                  <p className="text-sm leading-relaxed">Escaneie o QR Code usando um aplicativo autenticador como <strong>Google Authenticator</strong>, <strong>Authy</strong> ou <strong>Microsoft Authenticator</strong>. Depois, confirme o código gerado.</p>
                  <Image src={factor.qr.trimEnd()} alt="QR code para configurar o autenticador" width={200} height={200} unoptimized className="rounded-xl bg-white p-3" />
                  <details className="text-sm"><summary className="cursor-pointer">Configurar manualmente</summary><code className="mt-2 block break-all select-all">{factor.secret}</code></details>
                </div>
              )}
              <div className="space-y-2"><label htmlFor="login-code" className="block text-sm font-medium">Código do autenticador</label><input key={step} id="login-code" name="code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" minLength={6} maxLength={6} required className="field-input w-full font-mono tracking-[.4em]" disabled={busy} autoFocus /><p className="text-sm text-ink/75">Informe os seis dígitos exibidos no aplicativo.</p></div>
              <button type="submit" disabled={busy} className="btn-primary-nex w-full justify-center disabled:opacity-60">{busy ? 'Confirmando…' : 'Confirmar acesso'}</button>
            </form>
          ) : (
            <div className="space-y-5">
              <p className="text-sm leading-relaxed">
                {step === 'enroll'
                  ? 'Proteja sua conta: escaneie o QR Code com Google Authenticator, Authy ou Microsoft Authenticator e confirme o código gerado.'
                  : 'Continue para confirmar seu segundo fator de autenticação.'}
              </p>
              <button type="button" disabled={busy} onClick={() => void submit(step === 'enroll' ? 'enroll' : 'factor')} className="btn-primary-nex w-full justify-center disabled:opacity-60">{busy ? 'Preparando…' : step === 'enroll' ? 'Configurar autenticador' : 'Continuar'}</button>
            </div>
          )}

          {error && <p className="mt-5 rounded-lg border border-ink/20 p-3 text-sm" role="alert">{error}</p>}
          {message && <p className="mt-5 text-sm leading-relaxed" role="status">{message}</p>}
          {step !== 'login' && <button type="button" disabled={busy} onClick={() => void submit('logout')} className="mt-5 text-sm underline underline-offset-4">Sair e usar outra conta</button>}
          <p className="mt-8 text-sm leading-relaxed text-ink/75">{adminShell ? 'Acesso reservado à equipe NexOS. Tentativas são registradas.' : <>Precisa de ajuda? <a href="mailto:nexosperformance@gmail.com" className="underline underline-offset-4">Fale com a NexOS</a>.</>}</p>
          <nav aria-label="Links legais" className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink/50">
            <Link href="/privacidade" className="underline underline-offset-2 transition-colors hover:text-ink/80">Privacidade</Link>
            <Link href="/termos" className="underline underline-offset-2 transition-colors hover:text-ink/80">Termos</Link>
            <Link href="/lgpd" className="underline underline-offset-2 transition-colors hover:text-ink/80">LGPD</Link>
            <Link href="/cookies" className="underline underline-offset-2 transition-colors hover:text-ink/80">Cookies</Link>
          </nav>
        </motion.section>
      </div>
    </main>
  );
}
