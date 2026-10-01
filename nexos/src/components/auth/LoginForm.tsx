'use client';

/**
 * Formulário de autenticação — login, cadastro, recuperação e segundo fator.
 *
 * Mecanismo: Better Auth (`authClient`). Toda decisão de sessão, rate limit,
 * CAPTCHA e 2FA acontece no servidor; aqui só há apresentação de estados.
 *
 * Invariante de segurança: enquanto o segundo fator está pendente não existe
 * sessão no servidor, então a interface nunca pode tratar a etapa de 2FA como
 * "autenticado" — apenas como "faltando o segundo passo".
 *
 * Estados preservados do design: mesmos contêineres, mesmas classes de módulo e
 * mesma divisão admin/cliente.
 */
import { useEffect, useRef, useState } from 'react';
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
import { authClient, authErrorMessage } from '@/lib/auth/client';

type Mode = 'login' | 'signup' | 'forgot' | 'verify-email';
type Step = 'credentials' | 'totp' | 'enroll' | 'verify-enroll';

interface LoginFormProps {
  audience?: 'admin' | 'user';
  confirmationError?: boolean;
  callbackUrl?: string | null;
  /** Providers com credenciais configuradas no servidor. */
  socialProviders?: ('google' | 'github')[];
  /**
   * Tela inicial. Permite abrir direto na configuração do autenticador a partir
   * da página de segurança da conta, sem duplicar a UI de enrollment.
   */
  initialStep?: 'credentials' | 'enroll';
}

/**
 * O plugin twoFactor acrescenta `twoFactorRedirect` na resposta, mas a
 * inferência de tipos do cliente não o inclui no union. Lemos com um type guard
 * explícito em vez de espalhar `any` pelo componente.
 */
function needsTwoFactor(data: unknown): boolean {
  return typeof data === 'object' && data !== null && (data as { twoFactorRedirect?: unknown }).twoFactorRedirect === true;
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

export function LoginForm({
  audience = 'admin',
  confirmationError = false,
  callbackUrl = null,
  socialProviders = [],
  initialStep = 'credentials',
}: LoginFormProps) {
  const userFlow = audience === 'user';
  const reduce = useReducedMotion();
  const busyRef = useRef(false);
  const safeCallback = sanitizeCallbackPath(callbackUrl);
  const destination = safeCallback ?? (userFlow ? '/conta' : '/dashboard');

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(
    confirmationError ? 'Não foi possível concluir o acesso. O link pode ter expirado ou a autorização foi cancelada. Tente novamente.' : '',
  );
  const [message, setMessage] = useState('');
  const [mode, setMode] = useState<Mode>('login');
  const [step, setStep] = useState<Step>(initialStep);
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [captcha, setCaptcha] = useState('');
  const [captchaKey, setCaptchaKey] = useState(0);
  const [totpUri, setTotpUri] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [pendingEmail, setPendingEmail] = useState('');
  const { required: captchaEnforced, loading: captchaLoading } = useTurnstileConfig();

  /** Um documento novo impede que RSC pré-carregado como anônimo sobreviva ao login. */
  function finishLogin() {
    window.location.replace(destination);
  }

  async function guard(fn: () => Promise<void>) {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await fn();
    } finally {
      setCaptcha('');
      setCaptchaKey((v) => v + 1);
      busyRef.current = false;
      setBusy(false);
    }
  }

  function goMode(next: Mode) {
    setCaptcha('');
    setCaptchaKey((v) => v + 1);
    setMode(next);
    setError('');
    setMessage('');
    setPassword('');
    setStep('credentials');
  }

  async function onSubmit(form: FormData) {
    const email = String(form.get('email') ?? '').trim();
    const pass = String(form.get('password') ?? '');
    const displayName = String(form.get('name') ?? '').trim();

    if (mode === 'signup' && pass !== String(form.get('confirmPassword') ?? '')) {
      setError('As senhas precisam ser iguais.');
      return;
    }
    if (mode === 'signup' && !evaluatePassword(pass).acceptable) {
      setError('A senha precisa de: 12+ caracteres, maiúscula, minúscula, número e símbolo.');
      return;
    }

    await guard(async () => {
      if (mode === 'forgot') {
        const { error: err } = await authClient.requestPasswordReset({
          email,
          redirectTo: `${window.location.origin}/portal/redefinir`,
        });
        if (err) throw new Error(authErrorMessage(err, 'Não foi possível enviar o link. Tente novamente.'));
        // Resposta genérica de propósito: não revela se o e-mail existe.
        setMessage('Se houver uma conta ativa para este e-mail, você receberá um link para redefinir a senha. O link expira em pouco tempo — confira também o spam.');
        setMode('login');
        return;
      }

      if (mode === 'signup') {
        const { data, error: err } = await authClient.signUp.email({
          email,
          password: pass,
          name: displayName || email.split('@')[0],
          callbackURL: destination,
        });
        if (err) throw new Error(authErrorMessage(err, 'Não foi possível criar a conta.'));
        setPendingEmail(email);
        if (needsTwoFactor(data)) {
          setStep('totp');
          return;
        }
        setMode('verify-email');
        return;
      }

      const { data, error: err } = await authClient.signIn.email({
        email,
        password: pass,
        // O CAPTCHA é aplicado pelo plugin do servidor nos endpoints protegidos.
        ...(captcha ? { captchaToken: captcha } : {}),
      });
      if (err) throw new Error(authErrorMessage(err, 'Não foi possível entrar. Confira o e-mail e a senha.'));
      // O plugin twoFactor sinaliza o desafio aqui; a sessão ainda NÃO existe.
      if (needsTwoFactor(data)) {
        setStep('totp');
        return;
      }
      finishLogin();
    });
  }

  async function onSocial(provider: 'google' | 'github') {
    await guard(async () => {
      const { error: err } = await authClient.signIn.social({
        provider,
        callbackURL: destination,
        errorCallbackURL: '/portal/acesso?confirmation=error',
      });
      if (err) throw new Error(authErrorMessage(err, 'Não foi possível continuar com o acesso social.'));
    });
  }

  async function onTotp(code: string) {
    await guard(async () => {
      const { error: err } = await authClient.twoFactor.verifyTotp({ code, trustDevice: false });
      if (err) throw new Error(authErrorMessage(err, 'Código inválido ou expirado. Tente novamente.'));
      finishLogin();
    });
  }

  async function onEnableTotp() {
    await guard(async () => {
      const { data, error: err } = await authClient.twoFactor.enable({ method: 'totp', issuer: 'NexOS' });
      if (err) throw new Error(authErrorMessage(err, 'Não foi possível iniciar a configuração do autenticador.'));
      setTotpUri(String((data as { totpURI?: string } | null)?.totpURI ?? ''));
      const codes = (data as { backupCodes?: unknown } | null)?.backupCodes;
      setBackupCodes(Array.isArray(codes) ? codes.map(String) : []);
      setStep('enroll');
    });
  }

  // Abrir a pagina em `enroll` precisa iniciar o enrollment: sem isto a tela
  // apareceria sem QR Code, porque o segredo TOTP so e criado por esta chamada.
  useEffect(() => {
    if (initialStep !== 'enroll' || totpUri) return;
    void onEnableTotp();
    // Roda uma vez na montagem: repetir geraria um segredo novo a cada Strict Mode.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onConfirmEnroll(code: string) {
    await guard(async () => {
      const { error: err } = await authClient.twoFactor.verifyTotp({ code, trustDevice: false });
      if (err) throw new Error(authErrorMessage(err, 'Código inválido. Confira o aplicativo autenticador.'));
      setStep('verify-enroll');
      setMessage('Autenticador configurado. Confirme o código para concluir.');
    });
  }

  async function onLogout() {
    await guard(async () => {
      await authClient.signOut();
      window.location.replace(userFlow ? '/portal/acesso' : '/admin-dashboard-su/secure-entry');
    });
  }

  const adminShell = !userFlow;
  const social = socialProviders.filter((p) => (p === 'google' ? 'google' : 'github'));

  return (
    <main className={userFlow ? styles.customer : 'min-h-[100dvh] bg-canvas px-6 py-8 text-ink sm:px-10'}>
      <header className={userFlow ? styles.header : 'mx-auto flex max-w-6xl items-center justify-between border-b border-ink/15 pb-6'}>
        <Link href="/" className="flex items-center gap-2.5" aria-label="NexOS — página inicial">
          <Image src="/nexos-branca-transparente.svg" alt="NexOS" width={110} height={26} priority className="logo-invert h-6 w-auto" />
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/" className="flex min-h-[44px] items-center gap-2 text-sm hover:underline">
            <ArrowLeft size={16} aria-hidden="true" /> Voltar ao site
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <div className={userFlow ? styles.content : 'mx-auto grid max-w-6xl gap-12 py-12 md:min-h-[75dvh] md:grid-cols-2 md:items-center md:gap-20'}>
        {adminShell && (
          <section className="rounded-2xl border border-ink/10 bg-[#0e1116] p-8 text-white/90 md:p-10">
            <p className="font-mono text-xs uppercase tracking-[.22em] text-white/45">NexOS Ops • Controlled Access</p>
            <h1 className="mt-4 font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl">Ambiente administrativo restrito.</h1>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/60">
              Sessão monitorada, exigência de autenticação em duas etapas e acesso por papel. Operadores fora do papel vêem negação imediata.
            </p>
            <ul className="mt-8 space-y-2 border-t border-white/10 pt-6 font-mono text-[11px] uppercase tracking-[.14em] text-white/40">
              <li>• Segundo fator (TOTP)</li>
              <li>• Papel persistido no banco</li>
              <li>• Rate limit + CSRF + CSP</li>
            </ul>
          </section>
        )}

        <motion.section
          initial={reduce ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className={userFlow ? styles.panel : 'w-full max-w-md md:justify-self-end'}
          aria-labelledby="login-title"
        >
          {userFlow && <p className={styles.overline}>Sua conta NexOS</p>}
          <div className={userFlow ? styles.title : 'mb-8 flex items-center gap-3'}>
            {!userFlow && <LockKeyhole size={20} aria-hidden="true" />}
            <h2 id="login-title" className="text-xl font-semibold">
              {step === 'totp'
                ? 'Verificação em duas etapas'
                : step === 'enroll' || step === 'verify-enroll'
                  ? 'Configurar autenticador'
                  : mode === 'signup'
                    ? 'Criar sua conta'
                    : mode === 'forgot'
                      ? 'Recuperar senha'
                      : mode === 'verify-email'
                        ? 'Confirme seu e-mail'
                        : adminShell
                          ? 'Entrada do operador'
                          : 'Entrar na sua conta'}
            </h2>
          </div>
          {userFlow && (
            <p className={styles.description}>
              {step !== 'credentials' ? 'Mais uma confirmação para proteger sua conta.' : mode === 'signup' ? 'Crie seu acesso para escolher e contratar suas soluções.' : mode === 'forgot' ? 'Informe o e-mail da conta. Enviaremos um link para criar uma nova senha.' : 'Entre para continuar de onde parou.'}
            </p>
          )}

          {error && (
            <p id="auth-error" className="mb-5 rounded-lg border border-ink/20 p-3 text-sm" role="alert" aria-live="assertive">
              {error}
            </p>
          )}

          {step === 'credentials' && (mode === 'login' || mode === 'signup' || mode === 'forgot') && (
            <>
              {mode !== 'forgot' && social.length > 0 && (
                <div className="mb-6 flex flex-col gap-3">
                  <div className={`grid gap-3 ${social.length > 1 ? 'grid-cols-2' : 'grid-cols-1'} ${userFlow ? styles.social : ''}`}>
                    {social.includes('google') && (
                      <button type="button" disabled={busy} onClick={() => void onSocial('google')} className="flex items-center justify-center gap-2 rounded-xl border border-ink/15 bg-ink/[0.03] px-4 py-2.5 text-sm font-medium transition hover:bg-ink/[0.07] focus-visible:outline-2 disabled:opacity-60">
                        <GoogleIcon /> Google
                      </button>
                    )}
                    {social.includes('github') && (
                      <button type="button" disabled={busy} onClick={() => void onSocial('github')} className="flex items-center justify-center gap-2 rounded-xl border border-ink/15 bg-ink/[0.03] px-4 py-2.5 text-sm font-medium transition hover:bg-ink/[0.07] focus-visible:outline-2 disabled:opacity-60">
                        <GitHubIcon /> GitHub
                      </button>
                    )}
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

              <form className="flex flex-col gap-5" onSubmit={(e) => { e.preventDefault(); void onSubmit(new FormData(e.currentTarget)); }}>
                {mode === 'signup' && (
                  <div className="space-y-2">
                    <label htmlFor="login-name" className="block text-sm font-medium">Nome</label>
                    <input id="login-name" name="name" type="text" autoComplete="name" required maxLength={120} className="field-input w-full" disabled={busy} />
                  </div>
                )}
                <div className="space-y-2">
                  <label htmlFor="login-email" className="block text-sm font-medium">E-mail</label>
                  <input id="login-email" name="email" type="email" autoComplete="username" required maxLength={254} className="field-input w-full" disabled={busy || captchaLoading} />
                </div>

                {mode !== 'forgot' && (
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
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                        aria-pressed={showPassword}
                        className="absolute inset-y-0 right-0 px-4 focus-visible:outline-2"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {mode === 'signup' && (
                      <>
                        <p id="password-help" className="text-sm text-ink/75">Mínimo de 12 caracteres, com maiúscula, minúscula, número e símbolo.</p>
                        <PasswordStrengthMeter password={password} id="password-strength" />
                      </>
                    )}
                    {mode === 'login' && (
                      <button type="button" disabled={busy} onClick={() => goMode('forgot')} className="self-start text-sm underline underline-offset-4">
                        Esqueceu a senha?
                      </button>
                    )}
                  </div>
                )}

                {mode === 'signup' && (
                  <div className="flex flex-col gap-2">
                    <label htmlFor="confirm-password" className="text-sm font-medium">Confirmar senha</label>
                    <input id="confirm-password" name="confirmPassword" type="password" autoComplete="new-password" minLength={12} maxLength={256} required disabled={busy} className="field-input w-full" />
                  </div>
                )}

                <Turnstile key={captchaKey} onVerify={setCaptcha} onExpire={() => setCaptcha('')} onError={() => setCaptcha('')} />

                <button type="submit" disabled={busy || captchaLoading || (captchaEnforced && !captcha)} className="btn-primary-nex w-full justify-center disabled:opacity-60">
                  {busy ? 'Verificando…' : mode === 'signup' ? 'Criar conta' : mode === 'forgot' ? 'Enviar link de redefinição' : 'Entrar'}
                  <ArrowRight size={16} />
                </button>

                {userFlow && (
                  <div className="flex flex-wrap gap-4 text-sm">
                    <button type="button" disabled={busy} className="underline underline-offset-4" onClick={() => goMode(mode === 'signup' ? 'login' : 'signup')}>
                      {mode === 'signup' ? 'Já tenho conta' : 'Criar uma conta'}
                    </button>
                  </div>
                )}
                {mode === 'forgot' && (
                  <button type="button" disabled={busy} className="self-start text-sm underline underline-offset-4" onClick={() => goMode('login')}>
                    Voltar ao login
                  </button>
                )}
              </form>
            </>
          )}

          {step === 'totp' && (
            <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); void onTotp(String(new FormData(e.currentTarget).get('code') ?? '')); }}>
              <p className="text-sm leading-relaxed text-ink/75">
                Digite o código de seis dígitos do seu aplicativo autenticador para concluir o acesso.
              </p>
              <div className="space-y-2">
                <label htmlFor="login-code" className="block text-sm font-medium">Código do autenticador</label>
                <input id="login-code" name="code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" minLength={6} maxLength={6} required autoFocus className="field-input w-full font-mono tracking-[.4em]" disabled={busy} />
              </div>
              <button type="submit" disabled={busy} className="btn-primary-nex w-full justify-center disabled:opacity-60">
                {busy ? 'Confirmando…' : 'Confirmar acesso'}
              </button>
            </form>
          )}

          {step === 'credentials' && mode === 'verify-email' && (
            <div className="space-y-5">
              <p className="text-sm leading-relaxed text-ink/75">
                Enviamos um link de confirmação para <span className="font-medium text-ink">{pendingEmail}</span>. Abra o link para ativar a conta e depois entre.
              </p>
              <Turnstile key={captchaKey} onVerify={setCaptcha} onExpire={() => setCaptcha('')} onError={() => setCaptcha('')} />
              <button
                type="button"
                disabled={busy || captchaLoading}
                onClick={() => void guard(async () => {
                  const { error: err } = await authClient.sendVerificationEmail({ email: pendingEmail, callbackURL: destination });
                  if (err) throw new Error(authErrorMessage(err, 'Não foi possível reenviar. Tente novamente.'));
                  setMessage('Se o endereço estiver apto, você receberá um novo e-mail de confirmação.');
                })}
                className="btn-primary-nex w-full justify-center disabled:opacity-60"
              >
                {busy ? 'Reenviando…' : 'Reenviar e-mail de confirmação'}
              </button>
              <button type="button" disabled={busy} className="self-start text-sm underline underline-offset-4" onClick={() => goMode('login')}>
                Voltar ao login
              </button>
            </div>
          )}

          {(step === 'enroll' || step === 'verify-enroll') && (
            <div className="space-y-5">
              {step === 'enroll' ? (
                <>
                  <p className="text-sm leading-relaxed">
                    Proteja sua conta: escaneie o QR Code com Google Authenticator, Authy ou Microsoft Authenticator e confirme o código gerado.
                  </p>
                  {totpUri && (
                    <Image src={totpUri.trimEnd()} alt="QR code para configurar o autenticador" width={200} height={200} unoptimized className="rounded-xl bg-white p-3" />
                  )}
                </>
              ) : (
                <p className="text-sm leading-relaxed">
                  Guarde os códigos de recuperação em local seguro. Cada um permite entrar uma vez se você perder o aplicativo.
                </p>
              )}

              {step === 'enroll' && (
                <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); void onConfirmEnroll(String(new FormData(e.currentTarget).get('code') ?? '')); }}>
                  <div className="space-y-2">
                    <label htmlFor="enroll-code" className="block text-sm font-medium">Código do aplicativo</label>
                    <input id="enroll-code" name="code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" minLength={6} maxLength={6} required autoFocus className="field-input w-full font-mono tracking-[.4em]" disabled={busy} />
                  </div>
                  <button type="submit" disabled={busy} className="btn-primary-nex w-full justify-center disabled:opacity-60">
                    {busy ? 'Confirmando…' : 'Confirmar autenticador'}
                  </button>
                </form>
              )}

              {step === 'verify-enroll' && backupCodes.length > 0 && (
                <ul className="grid grid-cols-2 gap-2 rounded-lg border border-ink/15 p-4 font-mono text-xs">
                  {backupCodes.map((c) => <li key={c}>{c}</li>)}
                </ul>
              )}

              {step === 'verify-enroll' && (
                <button type="button" onClick={finishLogin} className="btn-primary-nex w-full justify-center">
                  Concluir
                  <ArrowRight size={16} />
                </button>
              )}
            </div>
          )}

          {message && <p className="mt-5 text-sm leading-relaxed" role="status" aria-live="polite">{message}</p>}

          {step !== 'credentials' && (
            <button type="button" disabled={busy} onClick={() => void onLogout()} className="mt-5 text-sm underline underline-offset-4">
              Sair e usar outra conta
            </button>
          )}

          <p className="mt-8 text-sm leading-relaxed text-ink/75">
            {adminShell ? 'Acesso reservado à equipe NexOS. Tentativas são registradas.' : <>Precisa de ajuda? <a href="mailto:nexosperformance@gmail.com" className="underline underline-offset-4">Fale com a NexOS</a>.</>}
          </p>
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