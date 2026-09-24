'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Eye, EyeOff, LockKeyhole } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Turnstile } from '@/components/Turnstile';
import { PasswordStrengthMeter } from '@/components/auth/PasswordStrengthMeter';
import { evaluatePassword } from '@/lib/auth/password-strength';
import styles from '@/components/auth/LoginForm.module.css';

interface ResetPasswordFormProps {
  audience: 'admin' | 'user';
  email: string;
}

export function ResetPasswordForm({ audience, email }: ResetPasswordFormProps) {
  const userFlow = audience === 'user';
  const reduce = useReducedMotion();
  const router = useRouter();
  const busyRef = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [captcha, setCaptcha] = useState('');
  const [captchaKey, setCaptchaKey] = useState(0);
  const [done, setDone] = useState(false);
  const captchaEnforced = !!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  async function handleSubmit(form: FormData) {
    if (busyRef.current) return;
    const pass = String(form.get('password') ?? '');
    const confirm = String(form.get('confirmPassword') ?? '');
    setError('');
    setMessage('');
    if (pass !== confirm) {
      setError('As senhas precisam ser iguais.');
      return;
    }
    if (!evaluatePassword(pass).acceptable) {
      setError('A senha precisa de: 12+ caracteres, maiúscula, minúscula, número e símbolo.');
      return;
    }
    busyRef.current = true;
    setBusy(true);
    try {
      const response = await fetch(`/api/auth/${userFlow ? 'user-' : ''}reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pass, captcha }),
        signal: AbortSignal.timeout(20000),
      });
      const result: { ok?: boolean; error?: string; message?: string } = await response.json();
      if (!response.ok) throw new Error(result.error ?? 'Não foi possível redefinir a senha.');
      setPassword('');
      setDone(true);
      setMessage(result.message ?? 'Senha redefinida com sucesso. Entre com a nova senha.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Conexão indisponível. Tente novamente.');
    } finally {
      setCaptcha('');
      setCaptchaKey((v) => v + 1);
      busyRef.current = false;
      setBusy(false);
    }
  }

  const loginHref = userFlow ? '/portal/acesso' : '/admin-dashboard-su/secure-entry';

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

      <div className={userFlow ? styles.content : 'mx-auto max-w-md py-12'}>
        <motion.section
          initial={reduce ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className={userFlow ? styles.panel : 'w-full'}
          aria-labelledby="reset-title"
        >
          {userFlow && <p className={styles.overline}>Recuperar acesso</p>}
          <div className={userFlow ? styles.title : 'mb-8 flex items-center gap-3'}>
            {!userFlow && <LockKeyhole size={20} aria-hidden="true" />}
            <h1 id="reset-title" className={userFlow ? styles.heading : 'text-xl font-semibold'}>
              {done ? 'Senha atualizada' : 'Defina nova senha'}
            </h1>
          </div>
          {userFlow && (
            <p className={styles.description}>
              {done
                ? 'Sua senha foi alterada. Entre com a nova senha para continuar.'
                : 'Escolha uma senha forte. Depois, use o novo acesso no login.'}
            </p>
          )}
          {!userFlow && (
            <p className="mb-6 text-sm leading-relaxed text-ink/70">
              {done
                ? 'Sua senha foi alterada. Entre com a nova senha para continuar.'
                : `Sessão de recuperação para ${email}. Defina uma senha com 12+ caracteres, maiúscula, minúscula, número e símbolo.`}
            </p>
          )}

          {done ? (
            <div className="flex flex-col gap-4">
              {message && (
                <p role="status" className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm">
                  {message}
                </p>
              )}
              <button type="button" onClick={() => router.replace(loginHref)} className="btn-primary-nex justify-center">
                Ir para o login
                <ArrowRight size={16} />
              </button>
            </div>
          ) : (
            <form key={`reset-${captchaKey}`} className="flex flex-col gap-5" onSubmit={(e) => { e.preventDefault(); void handleSubmit(new FormData(e.currentTarget)); }}>
              <div className="flex flex-col gap-2">
                <label htmlFor="reset-email-read" className="text-sm font-medium">
                  E-mail
                </label>
                <input id="reset-email-read" value={email} readOnly disabled className="field-input w-full opacity-70" autoComplete="username" />
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="reset-password" className="text-sm font-medium">
                  Nova senha
                </label>
                <div className="relative">
                  <input
                    id="reset-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    minLength={12}
                    maxLength={256}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    aria-describedby="reset-password-help reset-password-strength"
                    className="field-input w-full !pr-14"
                    disabled={busy}
                    autoFocus
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
                <p id="reset-password-help" className="text-sm text-ink/75">
                  Mínimo de 12 caracteres, com maiúscula, minúscula, número e símbolo.
                </p>
                <PasswordStrengthMeter password={password} id="reset-password-strength" />
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="reset-confirm" className="text-sm font-medium">
                  Confirmar nova senha
                </label>
                <input
                  id="reset-confirm"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  minLength={12}
                  maxLength={256}
                  required
                  disabled={busy}
                  className="field-input w-full"
                />
              </div>
              <Turnstile
                key={captchaKey}
                onVerify={setCaptcha}
                onExpire={() => setCaptcha('')}
                onError={() => {
                  setCaptcha('');
                  setError('Verificação indisponível. Recarregue a página.');
                }}
              />
              <button
                type="submit"
                disabled={busy || (captchaEnforced && !captcha)}
                className="btn-primary-nex w-full justify-center disabled:opacity-60"
              >
                {busy ? 'Salvando…' : 'Salvar nova senha'}
                <ArrowRight size={16} />
              </button>
              <Link href={loginHref} className="self-start text-sm underline underline-offset-4">
                Voltar ao login
              </Link>
            </form>
          )}

          {error && (
            <p className="mt-5 rounded-lg border border-ink/20 p-3 text-sm" role="alert">
              {error}
            </p>
          )}
          <p className="mt-8 text-sm leading-relaxed text-ink/75">
            Precisa de ajuda?{' '}
            <a href="mailto:nexosperformance@gmail.com" className="underline underline-offset-4">
              Fale com a NexOS
            </a>
          </p>
        </motion.section>
      </div>
    </main>
  );
}
