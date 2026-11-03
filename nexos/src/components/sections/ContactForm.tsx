'use client';

import { useState, type FormEvent } from 'react';
import { Turnstile } from '../Turnstile';
import { useTurnstileConfig } from '@/lib/use-turnstile-config';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import styles from './Refactor.module.css';

export function ContactForm() {
  const security = useTurnstileConfig();
  const [token, setToken] = useState('');
  const [captchaKey, setCaptchaKey] = useState(0);
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [error, setError] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (security.loading || security.error || (security.required && !token)) {
      setError(security.error || 'Conclua a verificação de segurança.');
      return;
    }
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const fields = new FormData(form);
    setStatus('sending'); setError('');
    try {
      const response = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
        name: fields.get('name'), email: fields.get('email'), company: fields.get('company'),
        service: String(fields.get('segment') || ''), message: String(fields.get('need') || ''), turnstileToken: token || null,
      }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Não foi possível enviar. Tente novamente.');
      setStatus('sent'); form.reset();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível enviar. Tente novamente.');
      setStatus('idle'); setToken(''); setCaptchaKey(value => value + 1);
    }
  }

  return <section id="contact" className={styles.section} aria-labelledby="contact-title">
    <div className={`${styles.inner} ${styles.contactLayout}`}>
      <div><p className={styles.kicker}>Contato</p><h2 id="contact-title">Vamos conversar sobre o seu negócio?</h2><p className={styles.explainer}>Conte o que precisa. Nossa equipe recebe sua mensagem e responde pelo e-mail informado.</p></div>
      {status === 'sent' ? <div role="status" className={styles.success}><h3>Mensagem enviada.</h3><p>Obrigado pelo contato. Retornaremos pelo e-mail informado.</p><button type="button" onClick={() => setStatus('idle')}>Enviar outra mensagem</button></div> :
        <form onSubmit={submit} className={styles.form} aria-busy={status === 'sending'}>
          <label>Nome <Input name="name" autoComplete="name" minLength={2} maxLength={100} required /></label>
          <label>E-mail <Input name="email" type="email" autoComplete="email" maxLength={200} required /></label>
          <label>Empresa <Input name="company" autoComplete="organization" maxLength={100} /></label>
          <label>Segmento <Input name="segment" maxLength={100} placeholder="Ex.: alimentação, varejo" /></label>
          <label className={styles.full}>O que você precisa? <Textarea name="need" minLength={5} maxLength={5000} required rows={4} /></label>
          <div className={styles.full}><Turnstile key={captchaKey} onVerify={setToken} onExpire={() => setToken('')} onError={() => setToken('')} /></div>
          {error && <p role="alert" className={styles.error}>{error}</p>}
          <button type="submit" className={styles.submit} disabled={status === 'sending' || security.loading || !!security.error || (security.required && !token)}>{status === 'sending' ? 'Enviando…' : 'Agendar conversa'}</button>
        </form>}
    </div>
  </section>;
}
