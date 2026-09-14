'use client';

import { useState, FormEvent } from 'react';
import styles from './Contact.module.css';
import { config } from '@/config';
import { Button } from './ui/Button';
import { Mail, Phone, MessageSquare, MapPin, ArrowRight, Send } from 'lucide-react';
import { SlideUpText } from './SlideUpText';

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

export function Contact() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    company: '',
    service: '',
    message: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const validate = (data: FormData): FormErrors => {
    const newErrors: FormErrors = {};
    if (!data.name.trim()) newErrors.name = 'Nome é obrigatório';
    if (!data.email.trim()) newErrors.email = 'E-mail é obrigatório';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) newErrors.email = 'E-mail inválido';
    if (!data.message.trim()) newErrors.message = 'Mensagem é obrigatória';
    return newErrors;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const newErrors = validate(formData);
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSubmitting(true);
    setErrors({});
    setSubmitError(null);

    await new Promise((resolve) => setTimeout(resolve, 1000));

    setSubmitted(true);
    setFormData({ name: '', email: '', company: '', service: '', message: '' });
    setSubmitting(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  if (submitted) {
    return (
      <section id="contact" className={styles.section} aria-labelledby="contact-title">
        <div className={styles.container}>
          <div className={styles.success}>
            <div className={styles.successIcon} aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" />
                <path d="M8 12l2 2 4-4" />
              </svg>
            </div>
            <h2 className={styles.successTitle}>Mensagem enviada!</h2>
            <p className={styles.successText}>
              Obrigado, {formData.name}. Vamos analisar seu projeto e retornamos em até 24h.
            </p>
            <Button variant="primary" onClick={() => setSubmitted(false)} size="lg">
              Enviar outra mensagem
            </Button>
            <div className={styles.whatsappFallback}>
              <a
                href={`https://wa.me/64993289250${config.whatsapp.number}?text=${encodeURIComponent(config.whatsapp.message)}`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.whatsappLink}
              >
                <MessageSquare size={20} strokeWidth={2} aria-hidden="true" />
                <span>Ou fale direto no WhatsApp</span>
                <ArrowRight size={18} strokeWidth={2.5} aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="contact" className={styles.section} aria-labelledby="contact-title">
      <div className={styles.container}>
        <header className={styles.sectionHeader}>
          <h2 id="contact-title" className={styles.sectionTitle}>
            <SlideUpText
              split="words"
              stagger={0.08}
              delay={0.1}
              inView={true}
              transition={{ type: 'tween', ease: [0.625, 0.05, 0, 1], duration: 0.6 }}
            >
              Vamos conversar?
            </SlideUpText>
          </h2>
          <p className={styles.sectionSubtitle}>
            Tem um projeto em mente? Preencha o formulário ou chame direto no WhatsApp. Respondemos rápido.
          </p>
        </header>

        <div className={styles.grid}>
          <form className={styles.form} onSubmit={handleSubmit} noValidate>
            <div className={styles.formRow}>
              <div className={styles.field}>
                <label htmlFor="name" className={styles.label}>Nome completo *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Seu nome"
                  required
                  autoComplete="name"
                  aria-invalid={errors.name ? 'true' : 'false'}
                  aria-describedby={errors.name ? 'name-error' : undefined}
                />
                {errors.name && <p id="name-error" className={styles.error} role="alert">{errors.name}</p>}
              </div>
              <div className={styles.field}>
                <label htmlFor="email" className={styles.label}>E-mail corporativo *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="seu@email.com"
                  required
                  autoComplete="email"
                  aria-invalid={errors.email ? 'true' : 'false'}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                />
                {errors.email && <p id="email-error" className={styles.error} role="alert">{errors.email}</p>}
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={styles.field}>
                <label htmlFor="company" className={styles.label}>Empresa</label>
                <input
                  type="text"
                  id="company"
                  name="company"
                  className={styles.input}
                  value={formData.company}
                  onChange={handleChange}
                  placeholder="Nome da empresa (opcional)"
                  autoComplete="organization"
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="service" className={styles.label}>Serviço de interesse</label>
                <select
                  id="service"
                  name="service"
                  className={styles.select}
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

            <div className={styles.field}>
              <label htmlFor="message" className={styles.label}>Mensagem *</label>
              <textarea
                id="message"
                name="message"
                className={`${styles.textarea} ${errors.message ? styles.textareaError : ''}`}
                value={formData.message}
                onChange={handleChange}
                placeholder="Conte sobre seu projeto, desafios, prazo e orçamento..."
                rows={5}
                required
                aria-invalid={errors.message ? 'true' : 'false'}
                aria-describedby={errors.message ? 'message-error' : undefined}
              />
              {errors.message && <p id="message-error" className={styles.error} role="alert">{errors.message}</p>}
            </div>

            <Button type="submit" variant="primary" size="lg" fullWidth loading={submitting}>
              {submitting ? 'Enviando...' : 'Enviar projeto'}
              <Send size={20} strokeWidth={2.5} aria-hidden="true" />
            </Button>

            {submitError && <p className={styles.error} role="alert">{submitError}</p>}

            <p className={styles.formNote}>
              Seus dados são usados apenas para responder seu contato. <a href="/privacidade" className={styles.link}>Política de Privacidade</a> · <a href="/termos" className={styles.link}>Termos de Uso</a>
            </p>
          </form>

          <aside className={styles.sidebar} aria-label="Informações de contato">
            <div className={styles.contactCard}>
              <div className={styles.contactCardGlow} aria-hidden="true" />
              <h3 className={styles.sidebarTitle}>Outras formas de falar com a gente</h3>
              <div className={styles.contactMethods}>
                <a href={`https://wa.me/${config.whatsapp.number}?text=${encodeURIComponent(config.whatsapp.message)}`} target="_blank" rel="noopener noreferrer" className={styles.contactMethod}>
                  <div className={styles.methodIcon}><MessageSquare size={22} strokeWidth={2} aria-hidden="true" /></div>
                  <div>
                    <span className={styles.methodLabel}>WhatsApp</span>
                    <span className={styles.methodValue}>Resposta em minutos</span>
                  </div>
                  <ArrowRight size={18} strokeWidth={2.5} aria-hidden="true" />
                </a>
                <a href={`mailto:contato@nexos.digital`} className={styles.contactMethod}>
                  <div className={styles.methodIcon}><Mail size={22} strokeWidth={2} aria-hidden="true" /></div>
                  <div>
                    <span className={styles.methodLabel}>E-mail</span>
                    <span className={styles.methodValue}>contato@nexos.digital</span>
                  </div>
                  <ArrowRight size={18} strokeWidth={2.5} aria-hidden="true" />
                </a>
                <a href={`tel:+5511999999999`} className={styles.contactMethod}>
                  <div className={styles.methodIcon}><Phone size={22} strokeWidth={2} aria-hidden="true" /></div>
                  <div>
                    <span className={styles.methodLabel}>Telefone</span>
                    <span className={styles.methodValue}>+55 11 9999-9999</span>
                  </div>
                  <ArrowRight size={18} strokeWidth={2.5} aria-hidden="true" />
                </a>
              </div>
            </div>

            <div className={styles.locationCard}>
              <div className={styles.locationCardGlow} aria-hidden="true" />
              <MapPin size={22} strokeWidth={2} aria-hidden="true" />
              <div>
                <span className={styles.locationLabel}>Onde estamos</span>
                <address className={styles.locationValue}>Atendemos remoto global</address>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}