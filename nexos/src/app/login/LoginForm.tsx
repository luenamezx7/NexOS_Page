'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Eye, EyeOff, LockKeyhole, ShieldCheck } from 'lucide-react';
import { Turnstile } from '@/components/Turnstile';

type AuthResult = { ok?: boolean; error?: string; message?: string; factorId?: string; enrollmentRequired?: boolean; qr?: string; secret?: string };

export function LoginForm({ initialMfa, audience = 'admin', confirmationError = false }: { initialMfa: boolean; audience?: 'admin' | 'user'; confirmationError?: boolean }) {
  const userFlow = audience === 'user';
  const router = useRouter();
  const busyRef = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(confirmationError ? 'Link inválido ou expirado. Entre com sua senha se o e-mail já foi confirmado, ou solicite outro link.' : '');
  const [message, setMessage] = useState('');
  const [mode, setMode] = useState<'login' | 'signup' | 'resend'>('login');
  const [formKey, setFormKey] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [captcha, setCaptcha] = useState('');
  const [captchaKey, setCaptchaKey] = useState(0);
  const [step, setStep] = useState<'login' | 'factor' | 'enroll' | 'verify'>(initialMfa ? 'factor' : 'login');
  const [factor, setFactor] = useState<AuthResult>({});

  async function submit(action: string, body: object = {}) {
    if (busyRef.current) return;
    busyRef.current = true; setBusy(true); setError(''); setMessage('');
    try {
      const response = await fetch(`/api/auth/${userFlow ? 'user-' : ''}${action}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(20000) });
      const result: AuthResult = await response.json();
      if (!response.ok) throw new Error(result.error ?? 'Não foi possível entrar.');
      if (action === 'logout') { setStep('login'); setFactor({}); router.refresh(); return; }
      if (result.message) { setMessage(result.message); setMode('login'); setFormKey(v => v + 1); return; }
      if (result.ok) { setFactor({}); router.replace(userFlow ? '/conta' : '/dashboard'); router.refresh(); return; }
      setFactor(result);
      setStep(result.enrollmentRequired ? 'enroll' : 'verify');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Conexão indisponível. Tente novamente.');
    } finally {
      if (['login', 'signup', 'resend'].includes(action)) { setCaptcha(''); setCaptchaKey(v => v + 1); }
      busyRef.current = false; setBusy(false);
    }
  }

  return (
    <main className="min-h-[100dvh] bg-canvas px-6 py-8 text-ink sm:px-10">
      <header className="mx-auto flex max-w-6xl items-center justify-between border-b border-ink/15 pb-6">
        <Link href="/" className="font-display text-2xl font-black tracking-tighter">NexOS<span className="text-[#cf315e]">.</span></Link>
        <Link href="/" className="flex items-center gap-2 text-sm hover:underline"><ArrowLeft size={16} /> Voltar ao site</Link>
      </header>
      <div className="mx-auto grid max-w-6xl gap-12 py-12 md:min-h-[75dvh] md:grid-cols-2 md:items-center md:gap-20">
        <section>
          <ShieldCheck size={32} strokeWidth={1.5} className="mb-6 text-[#cf315e]" aria-hidden="true" />
          <p className="mb-4 font-mono text-xs uppercase tracking-[.18em]">{userFlow ? 'Área do cliente' : 'Área administrativa'}</p>
          <h1 className="max-w-md font-display text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl">{userFlow ? 'Seu acesso. Sua segurança.' : 'Seu espaço de operação.'}</h1>
          <p className="mt-6 max-w-sm text-base leading-relaxed text-ink/75">{userFlow ? 'Acesse sua conta NexOS com e-mail verificado e uma segunda camada de proteção.' : 'Entre com sua conta autorizada e confirme sua identidade pelo aplicativo autenticador.'}</p>
          <p className="mt-10 border-t border-ink/15 pt-5 text-sm text-ink/75">{userFlow ? 'Na primeira entrada, conecte seu aplicativo autenticador. Nas próximas, basta confirmar o código.' : 'Acesso reservado à equipe NexOS.'}</p>
        </section>
        <section className="w-full max-w-md md:justify-self-end" aria-labelledby="login-title">
          <div className="mb-8 flex items-center gap-3"><LockKeyhole size={20} aria-hidden="true" /><h2 id="login-title" className="text-xl font-semibold">{step !== 'login' ? 'Verificação em duas etapas' : mode === 'signup' ? 'Criar sua conta' : mode === 'resend' ? 'Confirmar seu e-mail' : 'Entrar na sua conta'}</h2></div>
          {step === 'login' ? (
            <form key={`${mode}-${formKey}`} className="flex flex-col gap-5" onSubmit={e => { e.preventDefault(); const form = new FormData(e.currentTarget); if (mode === 'signup' && form.get('password') !== form.get('confirmPassword')) { setError('As senhas precisam ser iguais.'); return; } void submit(mode, { email: form.get('email'), ...(mode !== 'resend' ? { password: form.get('password') } : {}), captcha }); }}>
              <div className="space-y-2"><label htmlFor="login-email" className="block text-sm font-medium">E-mail</label><input id="login-email" name="email" type="email" autoComplete="username" required maxLength={254} className="field-input w-full" disabled={busy} /></div>
              {mode !== 'resend' && <div className="flex flex-col gap-2"><label htmlFor="login-password" className="block text-sm font-medium">Senha</label><div className="relative"><input id="login-password" name="password" type={showPassword ? 'text' : 'password'} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} required minLength={mode === 'signup' ? 12 : 1} maxLength={256} aria-describedby={mode === 'signup' ? 'password-help' : undefined} className="field-input w-full !pr-14" disabled={busy} /><button type="button" onClick={() => setShowPassword(v => !v)} aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'} aria-pressed={showPassword} className="absolute inset-y-0 right-0 px-4 focus-visible:outline-2">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div>{mode === 'signup' && <p id="password-help" className="text-sm text-ink/75">Use pelo menos 12 caracteres. Prefira uma frase-senha exclusiva.</p>}</div>}
              {mode === 'signup' && <div className="flex flex-col gap-2"><label htmlFor="confirm-password" className="text-sm font-medium">Confirmar senha</label><input id="confirm-password" name="confirmPassword" type="password" autoComplete="new-password" minLength={12} maxLength={256} required disabled={busy} className="field-input w-full" /></div>}
              <Turnstile key={captchaKey} onVerify={setCaptcha} onExpire={() => setCaptcha('')} onError={() => { setCaptcha(''); setError('Verificação indisponível. Recarregue a página.'); }} />
              <button disabled={busy || (!!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && !captcha)} className="btn-primary-nex w-full justify-center disabled:opacity-60">{busy ? 'Verificando…' : mode === 'signup' ? 'Criar conta' : mode === 'resend' ? 'Reenviar confirmação' : 'Entrar'}<ArrowRight size={16} /></button>
              {userFlow && <div className="flex flex-wrap gap-4 text-sm"><button type="button" disabled={busy} className="underline underline-offset-4" onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); setMessage(''); }}>{mode === 'login' ? 'Criar uma conta' : 'Já tenho conta'}</button>{mode !== 'resend' && <button type="button" disabled={busy} className="underline underline-offset-4" onClick={() => { setMode('resend'); setError(''); setMessage(''); }}>Reenviar e-mail de confirmação</button>}</div>}
            </form>
          ) : step === 'verify' ? (
            <form className="space-y-5" onSubmit={e => { e.preventDefault(); const form = new FormData(e.currentTarget); void submit('verify', { factorId: factor.factorId, code: form.get('code') }); }}>
              {factor.qr && <div className="space-y-3"><p className="text-sm leading-relaxed">Escaneie o QR code no seu aplicativo autenticador. Depois, confirme o código gerado.</p><Image src={factor.qr} alt="QR code para configurar o autenticador" width={200} height={200} unoptimized className="rounded-xl bg-white p-3" /><details className="text-sm"><summary className="cursor-pointer">Configurar manualmente</summary><code className="mt-2 block break-all select-all">{factor.secret}</code></details></div>}
              <div className="space-y-2"><label htmlFor="login-code" className="block text-sm font-medium">Código do autenticador</label><input key={step} id="login-code" name="code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" minLength={6} maxLength={6} required className="field-input w-full font-mono tracking-[.4em]" disabled={busy} autoFocus /><p className="text-sm text-ink/75">Informe os seis dígitos exibidos no aplicativo.</p></div>
              <button disabled={busy} className="btn-primary-nex w-full justify-center disabled:opacity-60">{busy ? 'Confirmando…' : 'Confirmar acesso'}</button>
            </form>
          ) : <div className="space-y-5"><p className="text-sm leading-relaxed">{step === 'enroll' ? 'Proteja sua conta com um aplicativo como 1Password, Google Authenticator ou Microsoft Authenticator.' : 'Continue para confirmar seu segundo fator de autenticação.'}</p><button disabled={busy} onClick={() => void submit(step === 'enroll' ? 'enroll' : 'factor')} className="btn-primary-nex w-full justify-center disabled:opacity-60">{busy ? 'Preparando…' : step === 'enroll' ? 'Configurar autenticador' : 'Continuar'}</button></div>}
          {error && <p className="mt-5 rounded-lg border border-ink/20 p-3 text-sm" role="alert">{error}</p>}
          {message && <p className="mt-5 text-sm leading-relaxed" role="status">{message}</p>}
          {step !== 'login' && <button disabled={busy} onClick={() => void submit('logout')} className="mt-5 text-sm underline underline-offset-4">Sair e usar outra conta</button>}
          <p className="mt-8 text-sm leading-relaxed text-ink/75">Problemas de acesso? Solicite ajuda ao responsável pela sua conta.</p>
        </section>
      </div>
    </main>
  );
}
