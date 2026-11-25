'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { OtpInput, type OtpInputHandle } from '@/components/ui/otp-input';
import { Button } from '@/components/ui/cnippet-button';
import { Field, FieldGroup } from '@/components/ui/field';
import { authClient, authErrorMessage } from '@/lib/auth/client';
import styles from './LoginForm.module.css';

interface Props {
  email: string;
  onSuccess: () => void;
  onAuthenticating?: () => void;
  onError?: () => void;
  onTwoFactor: () => void;
  onChangeEmail: () => void;
  onResend: () => Promise<boolean>;
  resendBlocked: boolean;
  captcha: ReactNode;
}

export function EmailCodeChallenge({ email, onSuccess, onAuthenticating, onError, onTwoFactor, onChangeEmail, onResend, resendBlocked, captcha }: Props) {
  const input = useRef<OtpInputHandle>(null);
  const locked = useRef(false);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [resending, setResending] = useState(false);
  const [remaining, setRemaining] = useState(60);
  useEffect(() => {
    if (remaining === 0) return;
    const timer = setTimeout(() => setRemaining(value => Math.max(0, value - 1)), 1000);
    return () => clearTimeout(timer);
  }, [remaining]);
  async function verify(value: string) {
    if (locked.current || resending || !/^[0-9]{6}$/.test(value)) return;
    locked.current = true; setBusy(true); setError(''); onAuthenticating?.();
    let navigating = false;
    try {
      const result = await authClient.signIn.emailOtp({ email, otp: value });
      if (result.error) { onError?.(); setError(authErrorMessage(result.error, 'Código inválido, expirado ou já usado. Confira o código mais recente.')); return; }
      if (result.data && typeof result.data === 'object' && 'twoFactorRedirect' in result.data && result.data.twoFactorRedirect) { onTwoFactor(); return; }
      navigating = true; onSuccess();
    } catch { onError?.(); setError('Conexão indisponível. Verifique sua conexão e tente novamente.'); }
    finally { if (!navigating) { locked.current = false; setBusy(false); } }
  }
  async function resend() {
    if (locked.current || resending || remaining > 0 || resendBlocked) return;
    setResending(true); setError('');
    try { if (await onResend()) { input.current?.clear(); setRemaining(60); } }
    finally { setResending(false); }
  }
  return <form onSubmit={event => { event.preventDefault(); void verify(code); }} data-email-code-challenge>
    <FieldGroup className={styles.formGroup}>
      <p className={styles.codeRecipient}>Se este e-mail estiver apto para entrar, enviaremos um código para <strong>{email}</strong>. Ele expira em 10 minutos.</p>
      <Field data-invalid={!!error || undefined}>
        <OtpInput ref={input} length={6} label="Código de verificação" autoFocus disabled={busy || resending} status={error ? 'error' : 'idle'} errorMessage={error} hint="Digite os 6 dígitos recebidos por e-mail." onChange={value => { setCode(value); setError(''); }} onComplete={value => void verify(value)} />
      </Field>
      <Button type="submit" className={styles.primarySubmit} loading={busy} disabled={busy || resending || code.length !== 6}>Confirmar código</Button>
      {captcha}
      <div className={styles.codeActions}>
        <button type="button" disabled={busy || resending || remaining > 0 || resendBlocked} onClick={() => void resend()}>{resending ? 'Enviando…' : remaining > 0 ? `Reenviar em ${remaining}s` : 'Reenviar código'}</button>
        <button type="button" disabled={busy || resending} onClick={onChangeEmail}>Usar outro e-mail</button>
      </div>
    </FieldGroup>
  </form>;
}
