'use client';

/**
 * Fallback de /portal/redefinir quando não há token de recuperação.
 *
 * Trocar a senha exige a posse do e-mail (o link de uso único) ou um segundo
 * fator confirmado. Pedir a senha atual não serve: quem esqueceu a senha não a
 * tem. Então, sem token, oferecemos o envio do link em vez de um formulário que
 * só falharia.
 */
import { useRef, useState } from 'react';
import { ArrowRight, Mail } from 'lucide-react';
import { Turnstile } from '@/components/Turnstile';
import { useTurnstileConfig } from '@/lib/use-turnstile-config';

interface RequestResetLinkProps {
  email: string;
  endpoint: string;
}

export function RequestResetLink({ email, endpoint }: RequestResetLinkProps) {
  const busyRef = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [captcha, setCaptcha] = useState('');
  const [captchaKey, setCaptchaKey] = useState(0);
  const { required: captchaEnforced, loading: captchaLoading } = useTurnstileConfig();

  async function handleSubmit(form: FormData) {
    if (busyRef.current) return;
    setError('');
    busyRef.current = true;
    setBusy(true);
    try {
      const target = String(form.get('email') ?? email);
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: target, captcha }),
        signal: AbortSignal.timeout(20000),
      });
      const result: { message?: string; error?: string } = await response.json();
      if (!response.ok) throw new Error(result.error ?? 'Não foi possível enviar o link. Tente novamente.');
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Conexão indisponível. Tente novamente.');
    } finally {
      setCaptcha('');
      setCaptchaKey((v) => v + 1);
      busyRef.current = false;
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <p role="status" className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm">
        Se houver uma conta ativa para este e-mail, você receberá um link para definir a nova senha.
        O link é de uso único — confira também o spam.
      </p>
    );
  }

  return (
    <form className="flex flex-col gap-5" onSubmit={(e) => { e.preventDefault(); void handleSubmit(new FormData(e.currentTarget)); }}>
      <div className="flex flex-col gap-2">
        <label htmlFor="reset-link-email" className="text-sm font-medium">
          E-mail da conta
        </label>
        <input
          id="reset-link-email"
          name="email"
          type="email"
          defaultValue={email}
          required
          autoComplete="username"
          className="field-input w-full"
          disabled={busy}
        />
      </div>
      <Turnstile key={captchaKey} onVerify={setCaptcha} onExpire={() => setCaptcha('')} onError={() => setCaptcha('')} />
      <button type="submit" disabled={busy || captchaLoading || (captchaEnforced && !captcha)} className="btn-primary-nex w-full justify-center disabled:opacity-60">
        {busy ? 'Enviando…' : 'Enviar link de redefinição'}
        <ArrowRight size={16} />
      </button>
      {error && (
        <p className="rounded-lg border border-ink/20 p-3 text-sm" role="alert">
          {error}
        </p>
      )}
      <p className="flex items-start gap-2 text-sm leading-relaxed text-ink/70">
        <Mail size={16} aria-hidden="true" className="mt-0.5 shrink-0" />
        Por segurança, a senha só muda depois de confirmar o link enviado para o seu e-mail.
      </p>
    </form>
  );
}