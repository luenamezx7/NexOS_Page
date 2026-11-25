'use client';

import { useRef, useState } from 'react';
import { ArrowRight, Eye, EyeOff } from 'lucide-react';
import { PasswordStrengthMeter } from './PasswordStrengthMeter';
import { evaluatePassword } from '@/lib/auth/password-strength';
import { authClient, authErrorMessage } from '@/lib/auth/client';
import { type AuthPhase } from './AuthTransition';
import { CustomerAuthPanel } from './CustomerAuthPanel';
import { Button } from '../ui/cnippet-button';
import { Input } from '../ui/input';
import { Field, FieldGroup, FieldLabel } from '../ui/field';
import { Alert, AlertDescription } from '../ui/alert';
import styles from './LoginForm.module.css';

export function ResetPasswordForm({ token }: { token: string }) {
  const busyRef = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [phase, setPhase] = useState<AuthPhase>('idle');

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
    setBusy(true); setPhase('loading');
    let confirmed = false;
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
      confirmed = true;
      setPhase('success');
    } catch (err) {
      setError(authErrorMessage(err, 'Conexão indisponível. Tente novamente.'));
    } finally {
      if (!confirmed) { busyRef.current = false; setBusy(false); setPhase('error'); }
    }
  }

  return <CustomerAuthPanel title="Defina nova senha" titleId="reset-title" description="Escolha uma senha forte. O link de recuperação confirma que é você." phase={phase} onConfirmed={() => window.location.replace('/portal/acesso')}>
    <form onSubmit={event => { event.preventDefault(); void handleSubmit(new FormData(event.currentTarget)); }}>
      <FieldGroup className={styles.formGroup}>
        <Field>
          <div className={styles.fieldLabelRow}><FieldLabel htmlFor="reset-password">Nova senha</FieldLabel></div>
          <div className={styles.resetPasswordControl}>
            <Input id="reset-password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" required minLength={12} maxLength={256} value={password} onChange={event => setPassword(event.target.value)} aria-describedby="reset-password-help reset-password-strength" className="field-input" readOnly={busy} />
            <button type="button" disabled={busy} onClick={() => setShowPassword(value => !value)} aria-controls="reset-password" aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'} aria-pressed={showPassword} className={styles.resetPasswordToggle}>{showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}</button>
          </div>
          <p id="reset-password-help" className={styles.mfaDescription}>Mínimo de 12 caracteres, com maiúscula, minúscula, número e símbolo.</p>
          <PasswordStrengthMeter password={password} id="reset-password-strength" />
        </Field>
        <Field>
          <div className={styles.fieldLabelRow}><FieldLabel htmlFor="reset-confirm">Confirmar nova senha</FieldLabel></div>
          <Input id="reset-confirm" name="confirmPassword" type="password" autoComplete="new-password" required minLength={12} maxLength={256} readOnly={busy} className="field-input" />
        </Field>
        <Button type="submit" disabled={busy} loading={false} className={styles.primarySubmit}>Salvar nova senha<ArrowRight size={18} aria-hidden="true" /></Button>
      </FieldGroup>
    </form>
    {error && <Alert variant="destructive" className={styles.resetFeedback} aria-live="assertive"><AlertDescription>{error}</AlertDescription></Alert>}
  </CustomerAuthPanel>;
}
