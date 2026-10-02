'use client';

import { MetallicButton } from '@/components/ui/metallic-button';

/**
 * Definição da nova senha a partir do link de recuperação.
 *
 * O token viaja na query e comprova posse do e-mail — é a autenticação deste
 * fluxo. Nenhuma sessão e nenhum segundo fator são exigidos, então uma conta
 * com MFA consegue recuperar o acesso.
 *
 * Design preservado do formulário anterior: mesmos contêineres e classes do
 * módulo `LoginForm.module.css`.
 */
import { useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { PasswordStrengthMeter } from '@/components/auth/PasswordStrengthMeter';
import { evaluatePassword } from '@/lib/auth/password-strength';
import { authClient, authErrorMessage } from '@/lib/auth/client';
import styles from '@/components/auth/LoginForm.module.css';

export function ResetPasswordForm({ token }: { token: string }) {
  const reduce = useReducedMotion();
  const busyRef = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(form: FormData) {
    if (busyRef.current) return;
    const pass = String(form.get('password') ?? '');
    const confirm = String(form.get('confirmPassword') ?? '');
    setError('');
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
      const { error: err } = await authClient.resetPassword({ newPassword: pass, token });
      if (err) {
        const detail = String((err as { message?: unknown }).message ?? '');
        setError(
          /expired|invalid|token/i.test(detail)
            ? 'Este link expirou ou já foi usado. Solicite um novo em “Esqueceu a senha”.'
            : authErrorMessage(err, 'Não foi possível salvar a nova senha. Tente novamente.'),
        );
        return;
      }
      // Remove o token da barra de endereço: voltar não deve reenviar o formulário.
      window.history.replaceState(null, '', '/portal/redefinir');
      setPassword('');
      setDone(true);
    } catch (err) {
      setError(authErrorMessage(err, 'Conexão indisponível. Tente novamente.'));
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }

  return (
    <main className={styles.customer}>
      <header className={styles.header}>
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

      <div className={styles.content}>
        <motion.section
          initial={reduce ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className={styles.panel}
          aria-labelledby="reset-title"
        >
          <p className={styles.overline}>Recuperar acesso</p>
          <div className={styles.title}>
            <h1 id="reset-title" className={styles.heading}>
              {done ? 'Senha atualizada' : 'Defina nova senha'}
            </h1>
          </div>
          <p className={styles.description}>
            {done
              ? 'Sua senha foi alterada. Entre com a nova senha para continuar.'
              : 'Escolha uma senha forte. O link de recuperação confirma que é você.'}
          </p>

          {done ? (
            <div className="flex flex-col gap-4">
              <MetallicButton type="button" onClick={() => window.location.replace('/portal/acesso')} className="w-full">
                Ir para o login
                <ArrowRight size={16} />
              </MetallicButton>
            </div>
          ) : (
            <form className="flex flex-col gap-5" onSubmit={(e) => { e.preventDefault(); void handleSubmit(new FormData(e.currentTarget)); }}>
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
              <MetallicButton type="submit" disabled={busy} className="w-full">
                {busy ? 'Salvando…' : 'Salvar nova senha'}
                <ArrowRight size={16} />
              </MetallicButton>
              <Link href="/portal/acesso" className="self-start text-sm underline underline-offset-4">
                Voltar ao login
              </Link>
            </form>
          )}

          {error && (
            <p className="mt-5 rounded-lg border border-ink/20 p-3 text-sm" role="alert" aria-live="assertive">
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
