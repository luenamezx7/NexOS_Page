'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Eye, EyeOff, Fingerprint, LockKeyhole } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { Turnstile } from '@/components/Turnstile';
import { PasswordStrengthMeter } from './PasswordStrengthMeter';
import { evaluatePassword } from '@/lib/auth/password-strength';
import { sanitizeCallbackPath } from '@/lib/auth/callback';
import { useTurnstileConfig } from '@/lib/use-turnstile-config';
import { authClient, authErrorMessage, signOutAccount } from '@/lib/auth/client';
import { Button } from '@/components/ui/Button';
import { SocialProviderIcon } from './SocialProviderIcon';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Alert, AlertDescription } from '@/components/ui/alert';
import styles from './LoginForm.module.css';
import { MetallicButton } from '@/components/ui/metallic-button';
import { AuthHeader, AuthStory } from './AuthFrame';

type Mode = 'login' | 'signup' | 'forgot' | 'magic' | 'verify-email';
const MODE_DESCRIPTION: Record<Mode, string> = {
  login: 'Acesse seus pedidos, dados e configurações.',
  signup: 'Crie seu acesso para comprar e acompanhar seus pedidos.',
  forgot: 'Receba um link para definir uma nova senha.',
  magic: 'Enviaremos um link de acesso ao seu e-mail.',
  'verify-email': 'Confirme seu cadastro para continuar.',
};
interface LoginFormProps {
  audience?: 'admin' | 'user';
  confirmationError?: boolean;
  callbackUrl?: string | null;
  socialProviders?: ('google' | 'github')[];
  socialAuthMode?: 'direct' | 'supabase';
  initialStep?: 'credentials' | 'totp';
  verified?: boolean;
}
function needsTwoFactor(data: unknown): boolean {
  return !!data && typeof data === 'object' && (data as { twoFactorRedirect?: unknown }).twoFactorRedirect === true;
}

export function LoginForm({ audience = 'admin', confirmationError, callbackUrl, socialProviders = [], socialAuthMode = 'direct', initialStep = 'credentials', verified }: LoginFormProps) {
  const userFlow = audience === 'user';
  const reduce = useReducedMotion();
  const busyRef = useRef(false);
  const destination = sanitizeCallbackPath(callbackUrl) ?? (userFlow ? '/conta' : '/dashboard');
  const loginPath = userFlow ? '/portal/acesso' : '/admin-dashboard-su/secure-entry';
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(confirmationError ? 'Não foi possível concluir o acesso. O link expirou, já foi usado ou a autorização foi cancelada. Tente novamente.' : '');
  const [message, setMessage] = useState(verified ? 'E-mail confirmado. Entre para continuar.' : '');
  const [mode, setMode] = useState<Mode>('login');
  const [step, setStep] = useState(initialStep);
  const [backup, setBackup] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [pendingEmail, setPendingEmail] = useState('');
  const [captcha, setCaptcha] = useState('');
  const [captchaKey, setCaptchaKey] = useState(0);
  const security = useTurnstileConfig();
  const captchaBlocked = security.loading || !!security.error || (security.required && !captcha);
  const fetchOptions = { headers: captcha ? { 'x-captcha-response': captcha } : {} };
  const errorCallbackURL = `${loginPath}?confirmation=error&callbackUrl=${encodeURIComponent(destination)}`;

  function finishLogin() { window.location.replace(destination); }
  async function guard(fn: () => Promise<void>) {
    if (busyRef.current) return;
    busyRef.current = true; setBusy(true); setError(''); setMessage('');
    try { await fn(); }
    catch (err) { setError(authErrorMessage(err, 'Conexão indisponível. Tente novamente.')); }
    finally { setCaptcha(''); setCaptchaKey(v => v + 1); busyRef.current = false; setBusy(false); }
  }
  function goMode(next: Mode) {
    setMode(next); setStep('credentials'); setError(''); setMessage(''); setPassword(''); setCaptcha(''); setCaptchaKey(v => v + 1);
  }
  async function submit(form: FormData) {
    const email = String(form.get('email') ?? '').trim();
    const pass = String(form.get('password') ?? '');
    if (mode === 'signup') {
      if (pass !== String(form.get('confirmPassword') ?? '')) { setError('As senhas precisam ser iguais.'); return; }
      if (!evaluatePassword(pass).acceptable) { setError('A senha precisa de: 12+ caracteres, maiúscula, minúscula, número e símbolo.'); return; }
    }
    await guard(async () => {
      if (captchaBlocked) throw new Error('Complete a verificação de segurança antes de continuar.');
      if (mode === 'forgot') {
        const result = await authClient.requestPasswordReset({ email, redirectTo: `${window.location.origin}/portal/redefinir`, fetchOptions });
        if (result.error) { setError(authErrorMessage(result.error, 'Não foi possível enviar o link.')); return; }
        setMessage('Se houver uma conta ativa para este e-mail, você receberá um link para redefinir a senha. Confira também o spam.');
        return;
      }
      if (mode === 'magic') {
        const result = await authClient.signIn.magicLink({ email, callbackURL: destination, errorCallbackURL, fetchOptions });
        if (result.error) { setError(authErrorMessage(result.error, 'Não foi possível enviar o link.')); return; }
        setMessage('Se o endereço estiver apto para entrar, você receberá um link de acesso de uso único. Ele expira em 10 minutos.');
        return;
      }
      if (mode === 'signup') {
        const result = await authClient.signUp.email({ email, password: pass, name: String(form.get('name') ?? '').trim(),
          callbackURL: `${loginPath}?verified=1&callbackUrl=${encodeURIComponent(destination)}`, fetchOptions });
        if (result.error) { setError(authErrorMessage(result.error, 'Não foi possível criar a conta. Se já tiver cadastro, tente entrar ou recuperar a senha.')); return; }
        setPendingEmail(email); setPassword(''); setMode('verify-email'); return;
      }
      const result = await authClient.signIn.email({ email, password: pass, fetchOptions });
      if (result.error) { setError(authErrorMessage(result.error, 'Não foi possível entrar. Confira o e-mail, a senha e a confirmação do cadastro.')); return; }
      setPassword('');
      if (needsTwoFactor(result.data)) { setStep('totp'); return; }
      finishLogin();
    });
  }
  async function social(provider: 'google' | 'github') {
    await guard(async () => {
      if (socialAuthMode === 'supabase') {
        const result = await authClient.signIn.supabase({ provider, callbackURL: destination, errorCallbackURL });
        if (result.error) { setError(authErrorMessage(result.error, 'Não foi possível iniciar o acesso social.')); return; }
        if (!result.data?.url) throw new Error('Não foi possível iniciar o acesso social.');
        window.location.assign(result.data.url);
        return;
      }
      const { error: err } = await authClient.signIn.social({ provider, callbackURL: destination, errorCallbackURL });
      if (err) setError(authErrorMessage(err, 'Não foi possível iniciar o acesso social.'));
    });
  }
  async function passkeyLogin() {
    await guard(async () => {
      if (!window.isSecureContext || !window.PublicKeyCredential) { setError('Chaves de acesso exigem um navegador compatível e HTTPS.'); return; }
      const result = await authClient.signIn.passkey();
      if (result.error) { setError(authErrorMessage(result.error, 'O acesso foi cancelado ou a chave não está disponível.')); return; }
      if (needsTwoFactor(result.data)) { setStep('totp'); return; }
      finishLogin();
    });
  }
  async function verify(code: string) {
    await guard(async () => {
      const result = backup ? await authClient.twoFactor.verifyBackupCode({ code, trustDevice: false })
        : await authClient.twoFactor.verifyTotp({ code, trustDevice: false });
      if (result.error) { setError(authErrorMessage(result.error, 'Código inválido, expirado ou já usado.')); return; }
      finishLogin();
    });
  }

  return (
    <main className={styles.customer}>
      <AuthHeader />
      <div className={styles.content}>
        {userFlow && <AuthStory recovery={mode === 'forgot'} />}
        {!userFlow && <aside className={styles.story}>
          <p className={styles.storyLabel}>NexOS Ops / Controlled Access</p>
          <h1 className={`${styles.adminHeading} brand-heading mt-4`}>Ambiente administrativo restrito.</h1>
          <p className={styles.storyDescription}>Acesso por papel, sessão revogável e autenticação em duas etapas obrigatória para operadores.</p>
        </aside>}
        <motion.section initial={reduce ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className={styles.panel} aria-labelledby="login-title">
          <p className={styles.overline}>{userFlow ? 'Sua conta NexOS' : 'Acesso administrativo'}</p>
          <div className={styles.title}>
            {!userFlow && <LockKeyhole size={20} />}
            <h2 id="login-title" className={`${styles.heading} brand-heading`}>{step === 'totp' ? 'Verificação em duas etapas' : mode === 'signup' ? 'Criar sua conta' : mode === 'forgot' ? 'Recuperar senha' : mode === 'magic' ? 'Entrar por link de e-mail' : mode === 'verify-email' ? 'Confirme seu e-mail' : userFlow ? 'Entrar na sua conta' : 'Entrada do operador'}</h2>
          </div>
          <p className={styles.description}>{step === 'totp' ? 'Confirme sua identidade para concluir o acesso.' : !userFlow && mode === 'login' ? 'Área restrita a operadores autorizados.' : MODE_DESCRIPTION[mode]}</p>
          <div className={styles.formStack}>
            {(error || (step === 'credentials' && security.error)) && <Alert variant="destructive"><AlertDescription>{error || security.error}</AlertDescription></Alert>}
            {step === 'credentials' && (mode === 'login' || mode === 'signup') && socialProviders.length > 0 &&
              <div className={styles.social} role="group" data-social-auth-mode={socialAuthMode} aria-label={mode === 'signup' ? 'Criar conta com provedor' : 'Entrar com provedor'}>
                {socialProviders.map(provider => <Button key={provider} type="button" variant="secondary" disabled={busy} onClick={() => void social(provider)} className="flex-1">
                  <SocialProviderIcon provider={provider} />{provider === 'google' ? 'Google' : 'GitHub'}
                </Button>)}
              </div>}
            {step === 'credentials' && mode === 'login' && <>
              <button type="button" disabled={busy} onClick={() => void passkeyLogin()} className={styles.passkeyButton}><Fingerprint size={18} aria-hidden="true" /> Entrar com chave de acesso</button>
              <button type="button" disabled={busy} onClick={() => goMode('magic')} className={styles.magicLink}>Entrar por link de e-mail</button>
            </>}
            {step === 'credentials' && mode !== 'verify-email' && <form onSubmit={e => { e.preventDefault(); void submit(new FormData(e.currentTarget)); }}>
              <FieldGroup className={styles.formGroup}>
                {mode === 'signup' && <Field><FieldLabel htmlFor="login-name">Nome</FieldLabel><input id="login-name" name="name" autoComplete="name" required maxLength={120} className="field-input" disabled={busy} /></Field>}
                <Field><FieldLabel htmlFor="login-email">E-mail</FieldLabel><input id="login-email" name="email" type="email" autoComplete="username webauthn" required maxLength={254} className="field-input" disabled={busy} /></Field>
                {(mode === 'login' || mode === 'signup') && <Field>
                  <FieldLabel htmlFor="login-password">Senha</FieldLabel>
                  <div className={styles.passwordControl}>
                    <input id="login-password" name="password" type={showPassword ? 'text' : 'password'} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} required minLength={mode === 'signup' ? 12 : 1} maxLength={256} value={password} onChange={e => setPassword(e.target.value)} className="field-input" disabled={busy} />
                    <button type="button" onClick={() => setShowPassword(v => !v)} aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'} aria-pressed={showPassword} className={styles.passwordToggle}>{showPassword ? <EyeOff size={17} aria-hidden="true" /> : <Eye size={17} aria-hidden="true" />}</button>
                  </div>
                  {mode === 'signup' && <><p className="text-sm text-muted-foreground">12+ caracteres, maiúscula, minúscula, número e símbolo.</p><PasswordStrengthMeter password={password} /></>}
                  {mode === 'login' && <button type="button" onClick={() => goMode('forgot')} className={styles.forgotLink}>Esqueceu a senha?</button>}
                </Field>}
                {mode === 'signup' && <Field><FieldLabel htmlFor="confirm-password">Confirmar senha</FieldLabel><input id="confirm-password" name="confirmPassword" type="password" autoComplete="new-password" required minLength={12} maxLength={256} className="field-input" disabled={busy} /></Field>}
                <Turnstile key={captchaKey} onVerify={setCaptcha} onExpire={() => setCaptcha('')} onError={() => setCaptcha('')} />
                <MetallicButton type="submit" disabled={busy || captchaBlocked} className="w-full" aria-busy={busy}>{busy ? 'Aguarde…' : mode === 'signup' ? 'Criar conta' : mode === 'forgot' ? 'Enviar link de redefinição' : mode === 'magic' ? 'Enviar link de acesso' : 'Entrar'}<ArrowRight size={16} aria-hidden="true" /></MetallicButton>
                {userFlow && <button type="button" disabled={busy} className="self-start text-sm underline underline-offset-4" onClick={() => goMode(mode === 'signup' ? 'login' : 'signup')}>{mode === 'signup' ? 'Já tenho conta' : 'Criar uma conta'}</button>}
                {mode !== 'login' && <button type="button" disabled={busy} onClick={() => goMode('login')} className="self-start text-sm underline underline-offset-4">Voltar ao login</button>}
              </FieldGroup>
            </form>}
            {step === 'credentials' && mode === 'verify-email' && <>
              <p>Enviamos um link de confirmação para {pendingEmail}. Confirme o cadastro e depois entre.</p>
              <Turnstile key={captchaKey} onVerify={setCaptcha} onExpire={() => setCaptcha('')} onError={() => setCaptcha('')} />
              <MetallicButton type="button" disabled={busy || captchaBlocked} className="w-full" onClick={() => void guard(async () => {
                const result = await authClient.sendVerificationEmail({ email: pendingEmail, callbackURL: `${loginPath}?verified=1&callbackUrl=${encodeURIComponent(destination)}`, fetchOptions });
                if (result.error) { setError(authErrorMessage(result.error, 'Não foi possível reenviar o e-mail.')); return; }
                setMessage('Se o endereço estiver apto, você receberá um novo e-mail de confirmação.');
              })}>Reenviar e-mail de confirmação</MetallicButton>
              <button type="button" onClick={() => goMode('login')} className="self-start text-sm underline underline-offset-4">Voltar ao login</button>
            </>}
            {step === 'totp' && <form onSubmit={e => { e.preventDefault(); void verify(String(new FormData(e.currentTarget).get('code') ?? '').trim()); }}>
              <FieldGroup>
                <p>Confirme o segundo fator para concluir o acesso. O desafio expira em 10 minutos.</p>
                <Field><FieldLabel htmlFor="login-code">{backup ? 'Código de recuperação' : 'Código do autenticador'}</FieldLabel><input key={String(backup)} id="login-code" name="code" inputMode={backup ? 'text' : 'numeric'} autoComplete="one-time-code" pattern={backup ? undefined : '[0-9]{6}'} minLength={backup ? 1 : 6} maxLength={backup ? 64 : 6} required className="field-input font-mono" disabled={busy} /></Field>
                <MetallicButton type="submit" disabled={busy} className="w-full">{busy ? 'Confirmando…' : 'Confirmar acesso'}</MetallicButton>
                <button type="button" disabled={busy} onClick={() => { setBackup(v => !v); setError(''); }} className="self-start text-sm underline underline-offset-4">{backup ? 'Usar aplicativo autenticador' : 'Usar código de recuperação'}</button>
                <button type="button" disabled={busy} onClick={() => void guard(async () => { await signOutAccount(); window.location.replace(loginPath); })} className="self-start text-sm underline underline-offset-4">Sair e usar outra conta</button>
              </FieldGroup>
            </form>}
            {message && <p role="status" aria-live="polite" className="text-sm leading-relaxed">{message}</p>}
          </div>
          <nav aria-label="Links legais" className="mt-8 flex flex-wrap gap-4 text-xs text-muted-foreground">{[['/privacidade', 'Privacidade'], ['/termos', 'Termos'], ['/lgpd', 'LGPD'], ['/cookies', 'Cookies']].map(([url, label]) => <Link key={url} href={url} className="underline underline-offset-2">{label}</Link>)}</nav>
        </motion.section>
      </div>
    </main>
  );
}
