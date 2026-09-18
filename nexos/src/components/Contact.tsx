'use client';

import { useState, type FormEvent, type ChangeEvent } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Mail, Phone, MessageSquare, MapPin, ArrowRight, Send } from 'lucide-react';
import { config } from '@/config';
import { Button } from './ui/Button';

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

const FLUID_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

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
    const newErrors: FormErrors = validate(formData);
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSubmitting(true);
    setErrors({});
    setSubmitError(null);

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
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
    : { initial: { opacity: 0, y: 40, scale: 0.98 }, whileInView: { opacity: 1, y: 0, scale: 1 } };

  if (submitted) {
    return (
      <section
        id="contact"
        aria-labelledby="contact-title"
        className={`relative border-t border-ink/10 bg-canvas ${className}`}
      >
        <div className="mx-auto w-full max-w-3xl px-4 py-16 text-center sm:px-6 sm:py-24 md:px-8 md:py-32">
          <motion.div
            initial={reveal.initial}
            whileInView={reveal.whileInView}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.8, ease: FLUID_EASE }}
            className="bento-card will-change-transform min-w-0 p-5 sm:p-10 md:p-14"
          >
            <div className="mx-auto mb-6 grid h-14 w-14 place-items-center rounded-full border border-[#ff2e6a]/40 bg-[#ff2e6a]/10" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-7 w-7 text-[#ff2e6a]">
                <path d="M8 12l2.5 2.5L16 9" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h2 id="contact-title" className="mb-3 text-ink">
              Mensagem enviada
            </h2>
            <p className="mx-auto mb-8 max-w-md text-sm leading-relaxed text-ink/70">
              Obrigado pelo contato. Vamos analisar seu projeto e retornamos em até 24h.
            </p>
            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button variant="secondary" size="md" onClick={() => setSubmitted(false)}>
                Enviar outra mensagem
              </Button>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary-nex"
              >
                <MessageSquare size={16} strokeWidth={2} aria-hidden="true" />
                <span className="relative z-10">Falar no WhatsApp</span>
                <span className="shimmer-sweep" aria-hidden="true" />
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    );
  }

  return (
    <section
      id="contact"
      aria-labelledby="contact-title"
      className={`relative w-full max-w-full overflow-x-clip border-t border-ink/10 bg-canvas ${className}`}
    >
      <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-24 md:px-8 md:py-32">
        <motion.header
          initial={reveal.initial}
          whileInView={reveal.whileInView}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.8, ease: FLUID_EASE }}
          className="mb-12 max-w-2xl will-change-transform md:mb-16"
        >
          <h2 id="contact-title" className="flex flex-row items-start gap-3 text-ink">
            <span className="pink-marker mt-[0.28em]" aria-hidden="true" />
            Vamos conversar?
          </h2>
          <p className="mt-4 text-base leading-relaxed text-ink/70 md:text-lg">
            Tem um projeto em mente? Preencha o formulário ou chame direto no WhatsApp. Respondemos rápido.
          </p>
        </motion.header>

        <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-5 lg:gap-8">
          <motion.form
            initial={reveal.initial}
            whileInView={reveal.whileInView}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.8, ease: FLUID_EASE }}
            className="bento-card will-change-transform min-w-0 p-5 sm:p-8 lg:col-span-3"
            onSubmit={handleSubmit}
            noValidate
            aria-label="Formulário de contato"
          >
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label htmlFor="contact-name" className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink/55">
                  Nome completo *
                </label>
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
                {errors.name && <p id="contact-name-error" className="text-xs text-[#ff2e6a]" role="alert">{errors.name}</p>}
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="contact-email" className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink/55">
                  E-mail corporativo *
                </label>
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
                {errors.email && <p id="contact-email-error" className="text-xs text-[#ff2e6a]" role="alert">{errors.email}</p>}
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="contact-company" className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink/55">
                  Empresa
                </label>
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
              <div className="flex flex-col gap-2">
                <label htmlFor="contact-service" className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink/55">
                  Serviço de interesse
                </label>
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
            </div>

            <div className="mt-5 flex flex-col gap-2">
              <label htmlFor="contact-message" className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink/55">
                Mensagem *
              </label>
              <textarea
                id="contact-message"
                name="message"
                className="field-input min-h-[128px] resize-y"
                value={formData.message}
                onChange={handleChange}
                placeholder="Conte sobre seu projeto, desafios, prazo e orçamento..."
                rows={5}
                required
                aria-invalid={errors.message ? 'true' : 'false'}
                aria-describedby={errors.message ? 'contact-message-error' : undefined}
              />
              {errors.message && <p id="contact-message-error" className="text-xs text-[#ff2e6a]" role="alert">{errors.message}</p>}
            </div>

            <div className="mt-6 border-t border-ink/10 pt-5">
              <Button type="submit" variant="primary" size="lg" fullWidth loading={submitting}>
                {submitting ? 'Enviando...' : 'Enviar projeto'}
                <Send size={18} strokeWidth={2.5} aria-hidden="true" />
              </Button>
            </div>

            {submitError && <p className="mt-3 text-xs text-[#ff2e6a]" role="alert">{submitError}</p>}

            <p className="mt-4 text-center text-xs leading-relaxed text-ink/40">
              Seus dados são usados apenas para responder seu contato.{' '}
              <a href="/privacidade" className="underline underline-offset-2 transition-colors hover:text-ink/70">Política de Privacidade</a>
              {' '}·{' '}
              <a href="/termos" className="underline underline-offset-2 transition-colors hover:text-ink/70">Termos de Uso</a>
            </p>
          </motion.form>

          <motion.aside
            initial={reveal.initial}
            whileInView={reveal.whileInView}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.8, delay: 0.1, ease: FLUID_EASE }}
            className="flex min-w-0 flex-col gap-4 will-change-transform sm:gap-6 lg:col-span-2"
            aria-label="Informações de contato"
          >
            <div className="bento-card flex min-w-0 flex-col p-5 sm:p-8">
              <h3 className="mb-5 text-lg font-bold tracking-tight text-ink">
                Outras formas de falar com a gente
              </h3>
              <div className="flex flex-col gap-2.5">
                {methods.map((method: ContactMethod) => (
                  <motion.a
                    key={method.id}
                    href={method.href}
                    target={method.external ? '_blank' : undefined}
                    rel={method.external ? 'noopener noreferrer' : undefined}
                    whileHover={reduce ? undefined : { y: -3 }}
                    transition={{ duration: 0.3, ease: FLUID_EASE }}
                    className="group flex flex-row items-center gap-3.5 rounded-lg border border-ink/10 bg-ink/[0.02] p-4 transition-colors duration-300 hover:border-ink/25 will-change-transform"
                  >
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-ink/10 bg-ink/[0.04] text-ink/70 transition-colors duration-300 group-hover:border-pink-500/40 group-hover:text-ink" aria-hidden="true">
                      {method.icon}
                    </span>
                    <span className="flex min-w-0 flex-col">
                      <span className="text-sm font-semibold text-ink">{method.label}</span>
                      <span className="truncate text-xs text-ink/50">{method.value}</span>
                    </span>
                    <ArrowRight size={16} strokeWidth={2} className="ml-auto shrink-0 text-ink/35 transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-[#ff2e6a]" aria-hidden="true" />
                  </motion.a>
                ))}
              </div>
            </div>

            <div className="bento-card flex min-w-0 flex-row items-center gap-3.5 p-5 sm:p-8">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-ink/10 bg-ink/[0.04] text-ink/70" aria-hidden="true">
                <MapPin size={20} strokeWidth={1.75} />
              </span>
              <span className="flex flex-col">
                <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink/55">Onde estamos</span>
                <address className="text-sm not-italic text-ink/80">Atendemos remoto global</address>
              </span>
            </div>
          </motion.aside>
        </div>
      </div>
    </section>
  );
}
