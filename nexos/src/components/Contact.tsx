'use client';

import { useState, type FormEvent, type ChangeEvent } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'motion/react';
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Send,
  ShieldCheck,
} from 'lucide-react';
import { config } from '@/config';
import { Turnstile } from './Turnstile';
import { useTurnstileConfig } from '@/lib/use-turnstile-config';
import styles from './BottomFunnel.module.css';

interface FormData {
  name: string;
  email: string;
  company: string;
  service: string;
  message: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  message?: string;
}

interface ContactMethod {
  id: string;
  label: string;
  value: string;
  href: string;
  external: boolean;
  icon: React.ReactNode;
}

const FLUID_EASE = [0.16, 1, 0.3, 1] as const;

const EMPTY_FORM: FormData = { name: '', email: '', company: '', service: '', message: '' };

interface ContactProps {
  className?: string;
}

export function Contact({ className = '' }: ContactProps) {
  const reduce = useReducedMotion() ?? false;
  const [formData, setFormData] = useState<FormData>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const { required: hasTurnstile } = useTurnstileConfig();
  const [captchaKey, setCaptchaKey] = useState(0);

  const whatsappUrl: string = `https://wa.me/${config.whatsapp.number}?text=${encodeURIComponent(config.whatsapp.message)}`;

  const validate = (data: FormData): FormErrors => {
    const newErrors: FormErrors = {};
    if (!data.name.trim()) newErrors.name = 'Nome é obrigatório';
    if (!data.email.trim()) newErrors.email = 'E-mail é obrigatório';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) newErrors.email = 'E-mail inválido';
    if (!data.message.trim()) newErrors.message = 'Mensagem é obrigatória';
    return newErrors;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (submitting) return;
    const newErrors = validate(formData);
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (hasTurnstile && !turnstileToken) {
      setSubmitError('Conclua a verificação de segurança antes de enviar.');
      return;
    }
    setSubmitting(true);
    setErrors({});
    setSubmitError(null);

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, ...(turnstileToken ? { turnstileToken } : {}) }),
        signal: AbortSignal.timeout(25000),
      });

      const body: { error?: string; details?: unknown; hint?: string } = await res.json().catch(() => ({}));

      if (!res.ok) {
        const details = typeof body.details === 'string' ? body.details : body.details ? JSON.stringify(body.details) : '';
        const hint = body.hint ? ` ${body.hint}` : '';
        throw new Error(`${body.error ?? 'Erro ao enviar. Tente novamente.'}${details ? ` — ${details.slice(0, 400)}` : ''}${hint}`);
      }

      setSubmitted(true);
      setFormData(EMPTY_FORM);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao enviar. Tente novamente.';
      setSubmitError(msg);
    } finally {
      setTurnstileToken(null);
      setCaptchaKey(v => v + 1);
      setSubmitting(false);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>): void => {
    const { name, value } = e.target;
    setFormData((prev: FormData) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors((prev: FormErrors) => ({ ...prev, [name]: undefined }));
    }
  };

  const methods: ContactMethod[] = [
    {
      id: 'whatsapp',
      label: 'WhatsApp',
      value: 'Resposta em minutos',
      href: whatsappUrl,
      external: true,
      icon: <MessageSquare size={20} strokeWidth={1.75} aria-hidden="true" />,
    },
    {
      id: 'email',
      label: 'E-mail',
      value: 'Resposta em até 24h',
      href: 'mailto:nexosperformance@gmail.com',
      external: false,
      icon: <Mail size={20} strokeWidth={1.75} aria-hidden="true" />,
    },
    {
      id: 'phone',
      label: 'Telefone',
      value: 'Toque para ligar',
      href: 'tel:+5564993289250',
      external: false,
      icon: <Phone size={20} strokeWidth={1.75} aria-hidden="true" />,
    },
  ];

  const reveal = reduce
    ? { initial: { opacity: 0 }, whileInView: { opacity: 1 } }
    : { initial: { opacity: 0, y: 24 }, whileInView: { opacity: 1, y: 0 } };

  if (submitted) {
    return (
      <section id="contact" aria-labelledby="contact-title" className={`${styles.section} ${className}`}>
        <div className={styles.container}>
          <motion.div
            initial={reveal.initial}
            whileInView={reveal.whileInView}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.55, ease: FLUID_EASE }}
            className={styles.successPanel}
          >
            <span className={styles.successIcon} aria-hidden="true">
              <Check size={24} strokeWidth={2.25} />
            </span>
            <h2 id="contact-title">Mensagem enviada</h2>
            <p>Obrigado pelo contato. Vamos analisar seu projeto e retornamos em até 24h.</p>
            <div className={styles.successActions}>
              <button type="button" className="btn-secondary-nex" onClick={() => setSubmitted(false)}>
                Enviar outra mensagem
              </button>
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="btn-primary-nex">
                <MessageSquare size={16} strokeWidth={2} aria-hidden="true" />
                Falar no WhatsApp
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    );
  }

  return (
    <section id="contact" aria-labelledby="contact-title" className={`${styles.section} ${className}`}>
      <div className={styles.container}>
        <div className={styles.sectionNav} aria-label="Navegação de contato">
          <span className={styles.currentSection}><MessageSquare size={16} aria-hidden="true" /> Contato</span>
          <a href="#faq">Ver dúvidas frequentes <ArrowUpRight size={16} aria-hidden="true" /></a>
        </div>

        <motion.header
          initial={reveal.initial}
          whileInView={reveal.whileInView}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.55, ease: FLUID_EASE }}
          className={styles.header}
        >
          <p className={styles.kicker}>Próximo passo</p>
          <h2 id="contact-title" className={styles.heading}>
            Vamos conversar?<br /><span className={styles.accent}>Sem enrolação.</span>
          </h2>
          <p className={styles.lead}>
            Preencha o formulário ou chame no WhatsApp. Respondemos rápido — de verdade.
          </p>
        </motion.header>

        <div className={styles.contactGrid}>
          <motion.form
            initial={reveal.initial}
            whileInView={reveal.whileInView}
            viewport={{ once: true, amount: 0.12 }}
            transition={{ duration: 0.55, ease: FLUID_EASE }}
            className={styles.panel}
            onSubmit={handleSubmit}
            noValidate
            aria-label="Formulário de contato"
          >
            <div className={styles.formGrid}>
              <div className={styles.field}>
                <label htmlFor="contact-name">Nome completo *</label>
                <input
                  type="text"
                  id="contact-name"
                  name="name"
                  className="field-input"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Seu nome"
                  required
                  autoComplete="name"
                  aria-invalid={errors.name ? 'true' : 'false'}
                  aria-describedby={errors.name ? 'contact-name-error' : undefined}
                />
                {errors.name && <p id="contact-name-error" className={styles.error} role="alert">{errors.name}</p>}
              </div>
              <div className={styles.field}>
                <label htmlFor="contact-email">E-mail corporativo *</label>
                <input
                  type="email"
                  id="contact-email"
                  name="email"
                  className="field-input"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="seu@email.com"
                  required
                  autoComplete="email"
                  aria-invalid={errors.email ? 'true' : 'false'}
                  aria-describedby={errors.email ? 'contact-email-error' : undefined}
                />
                {errors.email && <p id="contact-email-error" className={styles.error} role="alert">{errors.email}</p>}
              </div>
              <div className={styles.field}>
                <label htmlFor="contact-company">Empresa</label>
                <input
                  type="text"
                  id="contact-company"
                  name="company"
                  className="field-input"
                  value={formData.company}
                  onChange={handleChange}
                  placeholder="Nome da empresa (opcional)"
                  autoComplete="organization"
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="contact-service">Serviço de interesse</label>
                <select
                  id="contact-service"
                  name="service"
                  className="field-input"
                  value={formData.service}
                  onChange={handleChange}
                >
                  <option value="">Selecione...</option>
                  {config.services.map((s) => (
                    <option key={s.id} value={s.id}>{s.title}</option>
                  ))}
                </select>
              </div>
              <div className={`${styles.field} ${styles.full}`}>
                <label htmlFor="contact-message">Mensagem *</label>
                <textarea
                  id="contact-message"
                  name="message"
                  className="field-input"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Conte sobre seu projeto, desafios, prazo e orçamento..."
                  rows={5}
                  required
                  aria-invalid={errors.message ? 'true' : 'false'}
                  aria-describedby={errors.message ? 'contact-message-error' : undefined}
                />
                {errors.message && <p id="contact-message-error" className={styles.error} role="alert">{errors.message}</p>}
              </div>
            </div>

            {hasTurnstile && (
              <div style={{ marginTop: 20 }}>
                <Turnstile key={captchaKey} onVerify={setTurnstileToken} onExpire={() => setTurnstileToken(null)} onError={() => { setTurnstileToken(null); setSubmitError('Verificação indisponível. Atualize a página e tente novamente.'); }} />
              </div>
            )}

            <div className={styles.submitRow}>
              <motion.button
                type="submit"
                disabled={submitting || (hasTurnstile && !turnstileToken)}
                aria-busy={submitting}
                whileTap={reduce ? undefined : { scale: 0.98 }}
                transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
                className={`${styles.submit} btn-primary-nex`}
              >
                <span>{submitting ? 'Enviando...' : 'Enviar projeto'}</span>
                <Send size={16} strokeWidth={2} aria-hidden="true" />
              </motion.button>
            </div>

            {submitError && <p className={styles.error} style={{ marginTop: 12 }} role="alert">{submitError}</p>}

            <p className={styles.legalNote}>
              Seus dados são usados apenas para responder seu contato.{' '}
              <Link href="/privacidade">Política de Privacidade</Link>
              {' · '}
              <Link href="/termos">Termos de Uso</Link>
            </p>
          </motion.form>

          <motion.aside
            initial={reveal.initial}
            whileInView={reveal.whileInView}
            viewport={{ once: true, amount: 0.12 }}
            transition={{ duration: 0.55, delay: 0.08, ease: FLUID_EASE }}
            aria-label="Informações de contato"
          >
            <div className={styles.panel}>
              <h3 className={styles.methodsTitle}>Outras formas de falar com a gente</h3>
              <div className={styles.methods}>
                {methods.map((method: ContactMethod) => (
                  <a
                    key={method.id}
                    href={method.href}
                    target={method.external ? '_blank' : undefined}
                    rel={method.external ? 'noopener noreferrer' : undefined}
                    className={styles.method}
                  >
                    <span className={styles.methodIcon} aria-hidden="true">{method.icon}</span>
                    <span className={styles.methodText}>
                      <span className={styles.methodLabel}>{method.label}</span>
                      <span className={styles.methodValue}>{method.value}</span>
                    </span>
                    <ArrowRight size={16} strokeWidth={2} className={styles.methodArrow} aria-hidden="true" />
                  </a>
                ))}
              </div>

              <div className={styles.trust} aria-label="Sinais de confiança">
                <span><ShieldCheck size={14} aria-hidden="true" /> Checkout Asaas</span>
                <span><Check size={14} aria-hidden="true" /> Resposta em 24h</span>
                <span><Check size={14} aria-hidden="true" /> Sem spam</span>
              </div>
            </div>

            <div className={styles.location}>
              <span className={styles.locationIcon} aria-hidden="true">
                <MapPin size={20} strokeWidth={1.75} />
              </span>
              <span>
                <span className={styles.locationMeta}>Onde estamos</span>
                <address className={styles.locationValue}>Atendemos remoto global</address>
              </span>
            </div>
          </motion.aside>
        </div>
      </div>
    </section>
  );
}
