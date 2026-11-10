'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { Turnstile } from '../Turnstile';
import { useTurnstileConfig } from '@/lib/use-turnstile-config';
import { Input } from '../ui/input';
import { LEAD_QUESTIONS } from '@/lib/lead-quiz';
import { QUIZ_SOLUTIONS, recommendQuizSolution } from '@/lib/quiz-recommendation';
import styles from './Refactor.module.css';
import { useLocale } from '@/lib/locale';

export function ContactForm() {
  const { t } = useLocale();
  const security = useTurnstileConfig();
  const [token, setToken] = useState('');
  const [captchaKey, setCaptchaKey] = useState(0);
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [error, setError] = useState('');
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [contactOpen, setContactOpen] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => { if (step > 0 || contactOpen) headingRef.current?.focus(); }, [step, contactOpen]);

  const complete = step === LEAD_QUESTIONS.length;
  const recommendation = complete ? QUIZ_SOLUTIONS[recommendQuizSolution(answers)] : null;
  const question = !complete ? LEAD_QUESTIONS[step] : null;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!event.currentTarget.reportValidity()) return;
    if (security.loading || security.error || (security.required && !token)) {
      setError(security.error || t('Conclua a verificação de segurança.'));
      return;
    }
    const fields = new FormData(event.currentTarget);
    setStatus('sending'); setError('');
    try {
      const response = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
        name: String(fields.get('name')).trim(), email: String(fields.get('email')).trim(), phone: String(fields.get('phone')).trim(),
        answers: LEAD_QUESTIONS.map((item, index) => ({ id: item.id, choice: answers[index] })), turnstileToken: token || null,
      }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || t('Não foi possível enviar. Tente novamente.'));
      setStatus('sent');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t('Não foi possível enviar. Tente novamente.'));
      setStatus('idle'); setToken(''); setCaptchaKey(value => value + 1);
    }
  }

  function restart() { setStep(0); setAnswers([]); setContactOpen(false); setStatus('idle'); setError(''); setToken(''); }

  return <section id="contact" className={`${styles.section} ${styles.quizSection}`} aria-labelledby="contact-title" tabIndex={-1}>
    <div className={`${styles.inner} ${styles.quizInner}`}>
      <div className={styles.quizIntro}>
        <p className={styles.kicker}>{t('Quiz ezway')}</p>
        <h2 id="contact-title">{t('Vamos entender o que seu negócio precisa?')}</h2>
        <p className={styles.explainer}>{t('Responda a oito perguntas e veja uma sugestão inicial. Você decide depois se quer conversar com a equipe.')}</p>
      </div>
      {status === 'sent' ? <div role="status" className={styles.success}><h3>{t('Respostas enviadas.')}</h3><p>{t('Obrigado! Nossa equipe entrará em contato pelos dados informados.')}</p><button type="button" onClick={restart}>{t('Responder novamente')}</button></div> :
        !complete ? <div className={`${styles.form} ${styles.quizCard}`}>
          <div className={`${styles.full} ${styles.quizProgress}`} role="progressbar" aria-label={t('Progresso do quiz')} aria-valuemin={0} aria-valuemax={LEAD_QUESTIONS.length} aria-valuenow={step}>
            <span style={{ transform: `scaleX(${step / LEAD_QUESTIONS.length})` }} />
          </div>
          <p className={`${styles.full} ${styles.quizStepLabel}`}>{t('Pergunta')} {step + 1} / {LEAD_QUESTIONS.length}</p>
          <h3 ref={headingRef} tabIndex={-1} className={styles.full}>{t(question!.title)}</h3>
          <div role="group" aria-label={t(question!.title)} className={`${styles.full} ${styles.quizOptions}`}>
            {question!.options.map((option, index) => <button key={option} type="button" aria-pressed={answers[step] === index} onClick={() => {
              setAnswers(current => { const next = [...current]; next[step] = index; return next; });
              setStep(step + 1);
            }}>{t(option)}</button>)}
          </div>
          <div className={`${styles.full} ${styles.quizActions}`}>
            <button type="button" className={styles.back} disabled={step === 0} onClick={() => { setError(''); setStep(value => value - 1); }}>{t('Voltar')}</button>
          </div>
        </div> : <div className={`${styles.form} ${styles.quizCard}`}>
          <div className={`${styles.full} ${styles.quizProgress}`} role="progressbar" aria-label={t('Progresso do quiz')} aria-valuemin={0} aria-valuemax={LEAD_QUESTIONS.length} aria-valuenow={LEAD_QUESTIONS.length}>
            <span style={{ transform: 'scaleX(1)' }} />
          </div>
          <p className={`${styles.full} ${styles.stepCount}`}>{t('Sua sugestão inicial')}</p>
          <h3 ref={headingRef} tabIndex={-1} className={styles.full}>{t(recommendation!.title)}</h3>
          <p className={styles.full}>{t(recommendation!.reason)}</p>
          {recommendation!.developing && <p className={`${styles.full} ${styles.privacyNote}`}>{t('Em desenvolvimento. Ainda não disponível para contratação.')}</p>}
          <p className={`${styles.full} ${styles.privacyNote}`}>{t('Esta é uma orientação inicial baseada nas suas respostas, não uma proposta definitiva.')}</p>
          {!contactOpen ? <div className={`${styles.full} ${styles.quizActions}`}>
            <button type="button" className={styles.back} onClick={() => setStep(LEAD_QUESTIONS.length - 1)}>{t('Rever respostas')}</button>
            <button type="button" className={styles.submit} onClick={() => setContactOpen(true)}>{t('Conversar com a equipe')}</button>
          </div> : <form className={`${styles.full} ${styles.contactFields}`} onSubmit={submit} aria-busy={status === 'sending'}>
            <p>{t('Se quiser conversar sobre esta sugestão, informe seus dados para enviarmos suas respostas à equipe.')}</p>
            <label>{t('Nome')} <Input name="name" autoComplete="name" minLength={2} maxLength={100} required /></label>
            <label>{t('E-mail')} <Input name="email" type="email" autoComplete="email" maxLength={200} required /></label>
            <label>{t('Telefone')} <Input name="phone" type="tel" autoComplete="tel" inputMode="tel" minLength={10} maxLength={25} pattern="[+0-9 ()\\.\\-]{10,25}" required /></label>
            <p className={styles.privacyNote}>{t('Seus dados e respostas só serão enviados à nossa equipe ao clicar em Enviar respostas.')} <Link href="/privacidade">{t('Política de Privacidade')}</Link></p>
            <Turnstile key={captchaKey} onVerify={setToken} onExpire={() => setToken('')} onError={() => setToken('')} />
            {error && <p role="alert" className={styles.error}>{error}</p>}
            <button type="submit" className={styles.submit} disabled={status === 'sending' || security.loading || !!security.error || (security.required && !token)}>{t(status === 'sending' ? 'Enviando…' : 'Enviar respostas')}</button>
          </form>}
        </div>}
    </div>
  </section>;
}
