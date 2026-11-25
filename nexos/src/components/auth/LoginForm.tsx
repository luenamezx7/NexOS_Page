'use client';

import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react';
import Link from 'next/link';
import { ArrowRight, ArrowUpFromLine, Check, Eye, EyeOff, Fingerprint, LockKeyhole } from 'lucide-react';
import { ScrollReveal } from '../ScrollReveal';
import { Turnstile } from '@/components/Turnstile';
import { sanitizeCallbackPath } from '@/lib/auth/callback';
import { useTurnstileConfig } from '@/lib/use-turnstile-config';
import { authClient, authErrorMessage, signOutAccount } from '@/lib/auth/client';
import { Field, FieldGroup, FieldLabel, FieldSeparator } from '@/components/ui/field';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/cnippet-button';
import { ResizeTransition } from '@/components/ui/resize-transition';
import { cn } from '@/lib/utils';
import styles from './LoginForm.module.css';
import { MetallicButton } from '@/components/ui/metallic-button';
import { AuthIdentity } from './AuthFrame';
import { PageFooter } from '../PageChrome';
import { ClientPortalSurface } from './ClientPortalSurface';
import { BrandMark } from '../BrandMark';
import { AuthTransition, type AuthPhase } from './AuthTransition';
import { EmailCodeChallenge } from './EmailCodeChallenge';

type Mode = 'login' | 'forgot' | 'email-code';
const MODE_DESCRIPTION: Record<Mode, string> = {
  login: 'Entre com seu e-mail e senha ou escolha outra forma de acesso.',
  forgot: 'Receba um link para definir uma nova senha.',
  'email-code': 'Receba um código de verificação no seu e-mail para confirmar o acesso.',
};
interface LoginFormProps {
  audience?: 'admin' | 'user';
  confirmationError?: boolean;
  callbackUrl?: string | null;
  initialStep?: 'credentials' | 'totp';
  verified?: boolean;
}
function needsTwoFactor(data: unknown): boolean {
  return !!data && typeof data === 'object' && (data as { twoFactorRedirect?: unknown }).twoFactorRedirect === true;
}

export function LoginForm({ audience = 'admin', confirmationError, callbackUrl, initialStep = 'credentials', verified }: LoginFormProps) {
  const userFlow = audience === 'user';
  const busyRef = useRef(false);
  const phaseRef = useRef<AuthPhase>('idle');
  const [authPhase, setAuthPhase] = useState<AuthPhase>('idle');
  const animationActive = userFlow && (authPhase === 'loading' || authPhase === 'success');
  function phase(next: AuthPhase) { phaseRef.current = next; setAuthPhase(next); }
  function beginConfirmation() { if (userFlow) phase('loading'); }
  const navigating = useRef(false);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const codeRef = useRef<HTMLInputElement>(null);
  const selection = useRef<{ start: number | null; end: number | null; direction: 'forward' | 'backward' | 'none' | null } | null>(null);
  const previousInteraction = useRef({ mode: 'login' as Mode, step: initialStep, backup: false });
  const destination = sanitizeCallbackPath(callbackUrl) ?? (userFlow ? '/conta' : '/dashboard');
  const loginPath = userFlow ? '/portal/acesso' : '/admin-dashboard-su/secure-entry';
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(confirmationError ? 'Não foi possível concluir o acesso. O link expirou, já foi usado ou a autorização foi cancelada. Tente novamente.' : '');
  const [message, setMessage] = useState(verified ? 'E-mail confirmado. Entre para continuar.' : '');
  const [codeEmail, setCodeEmail] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>('login');
  const [step, setStep] = useState(initialStep);
  const [backup, setBackup] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [passwordRejected, setPasswordRejected] = useState(false);
  const [captcha, setCaptcha] = useState('');
  const [captchaKey, setCaptchaKey] = useState(0);
  const security = useTurnstileConfig();
  const captchaBlocked = security.loading || !!security.error || (security.required && !captcha);
  const fetchOptions = { headers: captcha ? { 'x-captcha-response': captcha } : {} };
  const feedbackError = error || (step === 'credentials' ? security.error : '');

  useLayoutEffect(() => {
    const previous = selection.current;
    const input = passwordRef.current;
    selection.current = null;
    if (!previous || !input) return;
    input.focus({ preventScroll: true });
    if (previous.start !== null && previous.end !== null) input.setSelectionRange(previous.start, previous.end, previous.direction ?? 'none');
  }, [showPassword]);

  useEffect(() => {
    // Initial visits keep the mobile keyboard closed. Only explicit mode changes move focus.
    const previous = previousInteraction.current;
    if (previous.mode === mode && previous.step === step && previous.backup === backup) return;
    previousInteraction.current = { mode, step, backup };
    (step === 'totp' ? codeRef.current : emailRef.current)?.focus({ preventScroll: true });
  }, [mode, step, backup]);

  function togglePassword() {
    const input = passwordRef.current;
    if (input && document.activeElement === input) selection.current = { start: input.selectionStart, end: input.selectionEnd, direction: input.selectionDirection };
    setShowPassword(value => !value);
  }
  function clearCredentialError() {
    if (!passwordRejected) return;
    setPasswordRejected(false);
    setError('');
  }
  function detectCapsLock(event: KeyboardEvent<HTMLInputElement>) {
    setCapsLock(event.getModifierState('CapsLock'));
  }
  function finishLogin() {
    navigating.current = true;
    setSuccess(true);
    if (userFlow && phaseRef.current === 'loading') { phase('success'); return; }
    window.location.replace(destination);
  }
  async function guard(fn: () => Promise<void>) {
    if (busyRef.current) return;
    busyRef.current = true; setBusy(true); setError(''); setMessage(''); setPasswordRejected(false);
    try { await fn(); }
    catch (err) {
      navigating.current = false; setSuccess(false);
      if (phaseRef.current === 'loading') phase('error');
      setError(err instanceof TypeError ? 'Conexão indisponível. Verifique sua conexão e tente novamente.' : authErrorMessage(err, 'Conexão indisponível. Tente novamente.'));
    }
    finally {
      if (!navigating.current) { setCaptcha(''); setCaptchaKey(value => value + 1); }
      // Keep duplicate submissions blocked while the authenticated destination loads.
      if (!navigating.current) {
        if (phaseRef.current === 'loading') phase('error');
        busyRef.current = false; setBusy(false);
      }
    }
  }
  function goMode(next: Mode) {
    phase('idle');
    setMode(next); setCodeEmail(null); setStep('credentials'); setError(''); setMessage(''); setPasswordRejected(false); setCapsLock(false); setShowPassword(false); setCaptcha(''); setCaptchaKey(value => value + 1);
    if (passwordRef.current) passwordRef.current.value = '';
  }
  async function submit(form: FormData) {
    const email = String(form.get('email') ?? '').trim();
    const pass = String(form.get('password') ?? '');
    await guard(async () => {
      if (captchaBlocked) throw new Error('Complete a verificação de segurança antes de continuar.');
      if (mode === 'forgot') {
        const result = await authClient.requestPasswordReset({ email, redirectTo: `${window.location.origin}/portal/redefinir`, fetchOptions });
        if (result.error) { setError(authErrorMessage(result.error, 'Não foi possível enviar o link.')); return; }
        setMessage('Se houver uma conta ativa para este e-mail, você receberá um link para redefinir a senha. Confira também o spam.');
        return;
      }
      if (mode === 'email-code') {
        const result = await authClient.emailOtp.sendVerificationOtp({ email, type: 'sign-in', fetchOptions });
        if (result.error) { setError(authErrorMessage(result.error, 'Não foi possível enviar o código. Tente novamente.')); return; }
        setCodeEmail(email);
        return;
      }
      beginConfirmation();
      const result = await authClient.signIn.email({ email, password: pass, fetchOptions });
      if (result.error) {
        const credentialsRejected = ['INVALID_EMAIL_OR_PASSWORD', 'INVALID_PASSWORD'].includes((result.error.code ?? '').toUpperCase()) && (!result.error.status || result.error.status === 401);
        setPasswordRejected(credentialsRejected);
        setError(credentialsRejected ? 'E-mail ou senha incorretos. Confira os dados e tente novamente.'
          : result.error.status === 0 || /fetch|network/i.test(result.error.code ?? '') ? 'Conexão indisponível. Verifique sua conexão e tente novamente.'
          : result.error.status >= 500 ? 'Serviço temporariamente indisponível. Tente novamente em alguns instantes.'
            : authErrorMessage(result.error, 'Não foi possível entrar. Tente novamente em alguns instantes.'));
        return;
      }
      if (passwordRef.current) passwordRef.current.value = '';
      if (needsTwoFactor(result.data)) { phase('idle'); setStep('totp'); return; }
      finishLogin();
    });
  }
  async function passkeyLogin() {
    await guard(async () => {
      if (!window.isSecureContext || !window.PublicKeyCredential) { setError('Chaves de acesso exigem um navegador compatível e HTTPS.'); return; }
      const result = await authClient.signIn.passkey();
      if (result.error) { setError(authErrorMessage(result.error, 'O acesso foi cancelado ou a chave não está disponível.')); return; }
      if (needsTwoFactor(result.data)) { phase('idle'); setStep('totp'); return; }
      finishLogin();
    });
  }
  async function verify(code: string) {
    await guard(async () => {
      beginConfirmation();
      const result = backup ? await authClient.twoFactor.verifyBackupCode({ code, trustDevice: false })
        : await authClient.twoFactor.verifyTotp({ code, trustDevice: false });
      if (result.error) { setError(authErrorMessage(result.error, 'Código inválido, expirado ou já usado.')); return; }
      finishLogin();
    });
  }

  const passwordToggle = <button type="button" onPointerDown={event => { if (document.activeElement === passwordRef.current) event.preventDefault(); }} onClick={togglePassword} aria-controls="login-password" aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'} aria-pressed={showPassword} className={styles.passwordToggle} disabled={busy}>
    <span className={styles.visibilityIcon} data-visible={showPassword} aria-hidden="true"><Eye size={18} /><EyeOff size={18} /></span>
  </button>;
  const submitLabel = success && !userFlow ? 'Acesso confirmado' : mode === 'forgot' ? 'Enviar link de redefinição' : mode === 'email-code' ? 'Enviar código de verificação' : 'Entrar';
  const submitControl = userFlow
    ? <Button type="submit" disabled={busy || captchaBlocked} loading={busy && !success && !animationActive} className={styles.primarySubmit} aria-label={submitLabel} aria-busy={busy} data-success={success}>{submitLabel}{success && !animationActive ? <Check size={18} aria-hidden="true" /> : <ArrowRight size={18} aria-hidden="true" />}</Button>
    : <MetallicButton type="submit" disabled={busy || captchaBlocked} className="w-full" aria-busy={busy}>{busy ? 'Aguarde…' : submitLabel}<ArrowRight size={16} aria-hidden="true" /></MetallicButton>;
  const feedback = <div className={cn(userFlow && styles.feedback)} data-login-feedback>
    {feedbackError && <Alert id="login-feedback" variant="destructive" className={cn(userFlow && styles.feedbackAlert)} aria-atomic="true"><AlertDescription>{feedbackError}</AlertDescription></Alert>}
    {!feedbackError && message && <p id="login-feedback" role="status" aria-live="polite" className={styles.feedbackMessage}>{message}</p>}
    {userFlow && !feedbackError && !message && step === 'credentials' && mode === 'login' && <FieldSeparator className={styles.alternateDivider} aria-hidden="true">ou</FieldSeparator>}
  </div>;
  const alternateAccess = step === 'credentials' && mode === 'login' && <div className={cn(userFlow && styles.alternateAccess)}>
    <button type="button" disabled={busy} onClick={() => void passkeyLogin()} className={styles.passkeyButton}><Fingerprint size={18} aria-hidden="true" /> Entrar com chave de acesso</button>
    <button type="button" disabled={busy} onClick={() => goMode('email-code')} className={styles.magicLink}>Entrar com código por e-mail</button>
  </div>;
  const panel = <Card className={styles.panel} data-auth-card tabIndex={-1}>
    <AuthTransition phase={userFlow ? authPhase : 'idle'} onComplete={() => window.location.replace(destination)}>
    <CardHeader className={styles.panelHeader}>
      {userFlow && <Link href="/" aria-label="ezway — página inicial" className={styles.loginBrand}><BrandMark registered /></Link>}
      {!userFlow && <p className={styles.overline}>Acesso administrativo</p>}
      <div className={styles.title}>{!userFlow && <LockKeyhole size={20} />}<h1 id="login-title" className={styles.heading}>{step === 'totp' ? 'Verificação em duas etapas' : mode === 'forgot' ? 'Recuperar senha' : mode === 'email-code' ? codeEmail ? 'Confirme seu acesso' : 'Entrar com código por e-mail' : userFlow ? 'Entrar na sua conta' : 'Entrada do operador'}</h1></div>
      <p className={styles.description}>{step === 'totp' ? 'Confirme sua identidade para concluir o acesso.' : !userFlow && mode === 'login' ? 'Área restrita a operadores autorizados.' : MODE_DESCRIPTION[mode]}</p>
    </CardHeader>
    <CardContent className={styles.panelContent}>
      <div className={styles.formStack}>
        {!userFlow && feedback}
        {!userFlow && alternateAccess}
        {step === 'credentials' && !codeEmail && <form className={cn(userFlow && styles.credentialForm, userFlow && passwordRejected && styles.credentialsRejected)} data-credential-rejected={passwordRejected} onSubmit={event => { event.preventDefault(); void submit(new FormData(event.currentTarget)); }}>
          <FieldGroup className={styles.formGroup}>
            <Field data-invalid={passwordRejected || undefined}>
              <div className={cn(userFlow && styles.fieldLabelRow)}><FieldLabel htmlFor="login-email">E-mail</FieldLabel></div>
              <Input ref={emailRef} id="login-email" name="email" type="email" inputMode="email" autoComplete="username webauthn" autoCapitalize="none" autoCorrect="off" spellCheck={false} required maxLength={254} className="field-input" readOnly={busy} placeholder={userFlow ? 'voce@empresa.com' : undefined} aria-invalid={passwordRejected || undefined} aria-describedby={passwordRejected ? 'login-feedback' : undefined} onChange={clearCredentialError} />
            </Field>
            {mode === 'login' && <Field className={cn(userFlow && styles.passwordField)} data-invalid={passwordRejected || undefined}>
              <div className={cn(userFlow && styles.fieldLabelRow)}><FieldLabel htmlFor="login-password">Senha</FieldLabel></div>
              <div className={cn('t-input-wrap', styles.passwordControl, passwordRejected && 'is-error')}>
                <Input ref={passwordRef} id="login-password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" required minLength={1} maxLength={256} onChange={clearCredentialError} onKeyDown={detectCapsLock} onKeyUp={detectCapsLock} onBlur={() => setCapsLock(false)} aria-invalid={passwordRejected || undefined} aria-describedby={[passwordRejected ? 'login-feedback' : '', capsLock ? 'login-caps-lock' : ''].filter(Boolean).join(' ') || undefined} className={cn('field-input t-input', passwordRejected && 'is-error is-shaking')} readOnly={busy} />
                {passwordToggle}
              </div>
              <div className={cn(userFlow && styles.passwordMeta)}><span id="login-caps-lock" className={styles.capsLockHint} role="status" aria-live="polite">{capsLock && <><ArrowUpFromLine size={13} aria-hidden="true" />Caps Lock ativado</>}</span><button type="button" onClick={() => goMode('forgot')} className={styles.forgotLink} disabled={busy}>Esqueceu a senha?</button></div>
            </Field>}
            <Turnstile key={captchaKey} onVerify={setCaptcha} onExpire={() => setCaptcha('')} onError={() => setCaptcha('')} />
            {submitControl}
            {mode !== 'login' && <button type="button" disabled={busy} onClick={() => goMode('login')} className={cn('self-start text-sm underline underline-offset-4', userFlow && styles.returnLogin)}>Voltar ao login</button>}
          </FieldGroup>
        </form>}
        {step === 'credentials' && mode === 'email-code' && codeEmail && <EmailCodeChallenge
          email={codeEmail}
          onSuccess={finishLogin}
          onAuthenticating={beginConfirmation}
          onError={() => phase('error')}
          onTwoFactor={() => { phase('idle'); setCodeEmail(null); setStep('totp'); }}
          onChangeEmail={() => goMode('email-code')}
          resendBlocked={busy || captchaBlocked}
          captcha={<Turnstile key={captchaKey} onVerify={setCaptcha} onExpire={() => setCaptcha('')} onError={() => setCaptcha('')} />}
          onResend={async () => {
            let sent = false;
            await guard(async () => {
              if (captchaBlocked) return;
              const result = await authClient.emailOtp.sendVerificationOtp({ email: codeEmail, type: 'sign-in', fetchOptions });
              if (result.error) { setError(authErrorMessage(result.error, 'Não foi possível reenviar o código.')); return; }
              sent = true;
            });
            return sent;
          }}
        />}
        {step === 'totp' && <form onSubmit={event => { event.preventDefault(); void verify(String(new FormData(event.currentTarget).get('code') ?? '').trim()); }}>
          <FieldGroup className={cn(userFlow && styles.formGroup)}>
            <p className={styles.mfaDescription}>Confirme o segundo fator para concluir o acesso. O desafio expira em 10 minutos.</p>
            <Field><FieldLabel htmlFor="login-code">{backup ? 'Código de recuperação' : 'Código do autenticador'}</FieldLabel><Input ref={codeRef} key={String(backup)} id="login-code" name="code" inputMode={backup ? 'text' : 'numeric'} autoComplete="one-time-code" pattern={backup ? undefined : '[0-9]{6}'} minLength={backup ? 1 : 6} maxLength={backup ? 64 : 6} required className="field-input font-mono" readOnly={busy} /></Field>
            {userFlow ? <Button type="submit" disabled={busy} loading={busy && !success && !animationActive} className={styles.primarySubmit}>{success && !animationActive ? 'Acesso confirmado' : 'Confirmar acesso'}<ArrowRight size={18} aria-hidden="true" /></Button> : <MetallicButton type="submit" disabled={busy} className="w-full">{busy ? 'Confirmando…' : 'Confirmar acesso'}</MetallicButton>}
            <button type="button" disabled={busy} onClick={() => { setBackup(value => !value); setError(''); }} className={cn('self-start text-sm underline underline-offset-4', userFlow && styles.returnLogin)}>{backup ? 'Usar aplicativo autenticador' : 'Usar código de recuperação'}</button>
            <button type="button" disabled={busy} onClick={() => void guard(async () => { await signOutAccount(); window.location.replace(loginPath); })} className={cn('self-start text-sm underline underline-offset-4', userFlow && styles.returnLogin)}>Sair e usar outra conta</button>
          </FieldGroup>
        </form>}
        {userFlow && feedback}
        {userFlow && alternateAccess}
      </div>
    </CardContent>
    <CardFooter className={styles.panelFooter}><FieldSeparator /><nav aria-label="Links legais" className="flex flex-wrap gap-4 text-xs text-muted-foreground">{[['/privacidade', 'Privacidade'], ['/termos', 'Termos'], ['/lgpd', 'LGPD'], ['/cookies', 'Cookies']].map(([url, label]) => <Link key={url} href={url} className="underline underline-offset-2">{label}</Link>)}</nav>{userFlow && <Link href="/" className={styles.loginBack}>Voltar ao site</Link>}</CardFooter>
    </AuthTransition>
  </Card>;

  const screen = <main className={cn(styles.customer, userFlow && styles.premiumRoot)} data-login-audience={audience}>
    {!userFlow && <AuthIdentity />}
    <div className={styles.content} id="main-content">
      {!userFlow && <aside className={styles.story}><p className={styles.storyLabel}>ezway Ops / Controlled Access</p><h2 className={`${styles.adminHeading} mt-4`}>Ambiente administrativo restrito.</h2><p className={styles.storyDescription}>Acesso por papel, sessão revogável e autenticação em duas etapas obrigatória para operadores.</p></aside>}
      {userFlow ? <section className={styles.panelWrap} aria-labelledby="login-title" data-reveal-state="visible"><ResizeTransition overflow="visible">{panel}</ResizeTransition></section> : <ScrollReveal as="section" preset="card" className={styles.panelWrap} aria-labelledby="login-title">{panel}</ScrollReveal>}
    </div>
    {!userFlow && <PageFooter />}
  </main>;
  return userFlow ? <ClientPortalSurface theme="dark">{screen}</ClientPortalSurface> : screen;
}
