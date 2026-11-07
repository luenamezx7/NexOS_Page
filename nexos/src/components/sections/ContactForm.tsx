'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { Turnstile } from '../Turnstile';
import { useTurnstileConfig } from '@/lib/use-turnstile-config';
import { Input } from '../ui/input';
import { LEAD_QUESTIONS } from '@/lib/lead-quiz';
import styles from './Refactor.module.css';
import { useLocale } from '@/lib/locale';

export function ContactForm() {
  const { t } = useLocale();
  const security = useTurnstileConfig();
  const [token, setToken] = useState('');
  const [captchaKey, setCaptchaKey] = useState(0);
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [error, setError] = useState('');
  const [step, setStep] = useState(-1);
  const [lead, setLead] = useState({ name: '', email: '', phone: '' });
  const [answers, setAnswers] = useState<number[]>([]);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => { if (step >= 0) headingRef.current?.focus(); }, [step]);

  function start(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const fields = new FormData(form);
    setLead({ name: String(fields.get('name')).trim(), email: String(fields.get('email')).trim(), phone: String(fields.get('phone')).trim() });
    setStep(0);
    setError('');
  }

  async function submit() {
    if (security.loading || security.error || (security.required && !token)) {
      setError(security.error || t('Conclua a verificação de segurança.'));
      return;
    }
    setStatus('sending'); setError('');
    try {
      const response = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
        ...lead, answers: LEAD_QUESTIONS.map((question, index) => ({ id: question.id, choice: answers[index] })), turnstileToken: token || null,
      }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || t('Não foi possível enviar. Tente novamente.'));
      setStatus('sent');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t('Não foi possível enviar. Tente novamente.'));
      setStatus('idle'); setToken(''); setCaptchaKey(value => value + 1);
    }
  }

  const question = step >= 0 ? LEAD_QUESTIONS[step] : null;
  return <section id="contact" className={styles.section} aria-labelledby="contact-title">
    <div className={`${styles.inner} ${styles.contactLayout}`}>
      <div><p className={styles.kicker}>{t('Contato')}</p><h2 id="contact-title">{t('Vamos entender o que seu negócio precisa?')}</h2><p className={styles.explainer}>{t('Responda a oito perguntas rápidas. Nossa equipe recebe suas respostas e entra em contato pelos dados informados.')}</p></div>
      {status === 'sent' ? <div role="status" className={styles.success}><h3>{t('Respostas enviadas.')}</h3><p>{t('Obrigado! Nossa equipe entrará em contato pelos dados informados.')}</p><button type="button" onClick={() => { setStep(-1); setAnswers([]); setStatus('idle'); }}>{t('Responder novamente')}</button></div> :
        step === -1 ? <form onSubmit={start} className={styles.form}>
          <p className={styles.full}>{t('Para começar, informe seus dados de contato.')}</p>
          <label>{t('Nome')} <Input name="name" autoComplete="name" minLength={2} maxLength={100} required /></label>
          <label>{t('E-mail')} <Input name="email" type="email" autoComplete="email" maxLength={200} required /></label>
          <label className={styles.full}>{t('Telefone')} <Input name="phone" type="tel" autoComplete="tel" inputMode="tel" minLength={10} maxLength={25} pattern="[+0-9 ()\\.\\-]{10,25}" required /></label>
          <p className={`${styles.full} ${styles.privacyNote}`}>{t('Seus dados e respostas serão enviados à nossa equipe ao concluir o quiz para que possamos entrar em contato.')} <Link href="/privacidade">{t('Política de Privacidade')}</Link></p>
          <button type="submit" className={`${styles.submit} ${styles.full}`}>{t('Começar quiz')}</button>
        </form> : <div className={styles.form} aria-busy={status === 'sending'}>
          <p className={`${styles.full} ${styles.stepCount}`}>{t('Pergunta')} {step + 1} {t('de')} {LEAD_QUESTIONS.length}</p>
          <h3 ref={headingRef} tabIndex={-1} className={styles.full}>{t(question!.title)}</h3>
          <div role="group" aria-label={t(question!.title)} className={`${styles.full} ${styles.quizOptions}`}>
            {question!.options.map((option, index) => <button key={option} type="button" aria-pressed={answers[step] === index} onClick={() => setAnswers(current => { const next = [...current]; next[step] = index; return next; })}>{t(option)}</button>)}
          </div>
          {step === LEAD_QUESTIONS.length - 1 && <div className={styles.full}><Turnstile key={captchaKey} onVerify={setToken} onExpire={() => setToken('')} onError={() => setToken('')} /></div>}
          {error && <p role="alert" className={styles.error}>{error}</p>}
          <div className={`${styles.full} ${styles.quizActions}`}>
            <button type="button" className={styles.back} disabled={status === 'sending'} onClick={() => { setError(''); setStep(value => value - 1); }}>{t('Voltar')}</button>
            {step < LEAD_QUESTIONS.length - 1 ? <button type="button" className={styles.submit} disabled={answers[step] === undefined} onClick={() => setStep(value => value + 1)}>{t('Próxima pergunta')}</button> : <button type="button" className={styles.submit} disabled={answers[step] === undefined || status === 'sending' || security.loading || !!security.error || (security.required && !token)} onClick={() => void submit()}>{t(status === 'sending' ? 'Enviando…' : 'Enviar respostas')}</button>}
          </div>
        </div>}
    </div>
  </section>;
}
