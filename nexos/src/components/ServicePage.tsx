'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, ArrowUpRight, Check, Plus } from 'lucide-react';
import { commercialHref, plateCommercialHref } from '@/lib/commercial';
import { servicePages, type ServicePageContent } from '@/lib/service-pages';
import { Footer } from './Footer';
import { PageHeader } from './PageChrome';
import styles from './ServicePage.module.css';
import { ScrollFloat, ScrollReveal } from './ScrollReveal';
import { useLocale } from '@/lib/locale';

export function ServicePage({ service }: { service: ServicePageContent }) {
  const { t } = useLocale();
  const display = {
    ...service,
    label: t(service.label), headline: t(service.headline), intro: t(service.intro),
    overviewTitle: t(service.overviewTitle), overview: t(service.overview),
    applications: service.applications.map(item => ({ title: t(item.title), body: t(item.body) })),
    steps: service.steps.map(item => ({ title: t(item.title), body: t(item.body) })),
    preparation: service.preparation.map(t),
    questions: service.questions.map(item => ({ question: t(item.question), answer: t(item.answer) })),
  };
  const isPlate = service.productId === 'placa';
  const contact = isPlate ? plateCommercialHref() : commercialHref(`Olá! Quero conversar com o comercial sobre ${service.label.toLowerCase()} para meu negócio.`);

  return (
    <div className={`service-page interior-page ${styles.page}`}>
      <a href="#main-content" className="skip-link">{t('Pular para o conteúdo')}</a>
      <PageHeader />
      <main id="main-content" tabIndex={-1} className={`page-container ${styles.content}`}>
        <nav aria-label={t("Caminho da página")} className="topography-glass topography-glass--compact mt-6 text-sm text-ink/70">
           <ol className="flex flex-wrap items-center gap-3"><li><Link href="/" className="inline-flex items-center gap-2 hover:underline"><ArrowLeft size={14} aria-hidden="true" /> {t('Início')}</Link></li><li aria-hidden="true">/</li><li aria-current="page">{display.label}</li></ol>
        </nav>
        <section className={`topography-glass topography-glass--copy grid items-center gap-10 pb-14 pt-10 md:pb-20 md:pt-14 ${styles.hero} ${isPlate ? 'md:grid-cols-2' : ''}`} aria-labelledby="service-heading">
          <div className="max-w-3xl">
            <ScrollReveal as="h1" preset="title" id="service-heading" className="page-title">{display.headline}</ScrollReveal>
            <ScrollReveal as="p" delay={.08} className="mt-6 max-w-xl text-lg leading-relaxed text-ink/80">{display.intro}</ScrollReveal>
            <ScrollReveal delay={.16} className="mt-8 flex flex-wrap gap-3">
              <a href={contact} target="_blank" rel="noopener noreferrer" className="btn-primary-nex inline-flex items-center gap-2 whitespace-nowrap">{t(isPlate ? 'Adquirir Placa' : 'Falar com o comercial')} <ArrowUpRight size={16} aria-hidden="true" /></a>
              <a href="#como-funciona" className="btn-secondary-nex whitespace-nowrap">{t('Como funciona')}</a>
            </ScrollReveal>
          </div>
          {isPlate && <ScrollReveal as="figure" preset="image"><ScrollFloat><Image src="/placas/codex-1.png" width={960} height={960} alt={t('Placa Inteligente ezway de acrílico com NFC e QR Code, segurada em mãos')} priority sizes="(max-width: 767px) 100vw, 50vw" className="aspect-square w-full rounded-2xl object-cover" /></ScrollFloat><figcaption className="mt-3 text-sm text-ink/70">{t('NFC e QR Code na mesma placa.')}</figcaption></ScrollReveal>}
        </section>
        <section className="topography-glass topography-glass--copy border-y border-ink/15 py-10 md:py-14" aria-labelledby="overview-heading">
          <ScrollReveal as="h2" preset="title" id="overview-heading" className="text-3xl font-semibold tracking-tight">{display.overviewTitle}</ScrollReveal>
          <ScrollReveal as="p" className="mt-5 max-w-3xl leading-relaxed text-ink/80">{display.overview}</ScrollReveal>
          <div className={`mt-10 grid gap-8 md:grid-cols-3 ${styles.applications}`}>{display.applications.map((application, index) => <ScrollReveal as="article" preset="card" delay={index * .08} key={application.title}><h3 className="text-lg font-semibold">{application.title}</h3><p className="mt-3 leading-relaxed text-ink/80">{application.body}</p></ScrollReveal>)}</div>
        </section>
        <section id="como-funciona" className="topography-glass topography-glass--copy scroll-mt-28 py-14 md:py-20" aria-labelledby="process-heading">
          <ScrollReveal as="h2" preset="title" id="process-heading" className="text-3xl font-semibold tracking-tight">{t('Como funciona')}</ScrollReveal>
          <ol className={`mt-8 grid gap-8 md:grid-cols-3 ${styles.steps}`}>{display.steps.map((step, index) => <ScrollReveal as="li" delay={index * .08} key={step.title}><span className="font-mono text-sm text-ink/70">0{index + 1}</span><h3 className="mt-3 text-xl font-semibold">{step.title}</h3><p className="mt-3 leading-relaxed text-ink/80">{step.body}</p></ScrollReveal>)}</ol>
        </section>
        <section className={`topography-glass grid gap-10 rounded-2xl border border-ink/15 bg-ink/[0.03] p-6 md:grid-cols-2 md:p-10 ${styles.proposal}`} aria-labelledby="preparation-heading">
          <ScrollReveal><h2 id="preparation-heading" className="text-2xl font-semibold">{t('O que preparar')}</h2><ul className="mt-6 flex flex-col gap-4">{display.preparation.map(item => <li key={item} className="flex items-start gap-3 text-ink/80"><Check size={18} className="mt-1 shrink-0" aria-hidden="true" /><span>{item}</span></li>)}</ul></ScrollReveal>
          <ScrollReveal delay={.08}>
            <h2 className="text-2xl font-semibold">{t('Uma proposta para o seu negócio')}</h2>
            <p className="mt-4 leading-relaxed text-ink/80">{t(isPlate ? 'Valores, quantidade, personalização e frete são alinhados diretamente com nosso comercial. Conte onde pretende usar as placas para prepararmos sua proposta. A criação de site ou cardápio é contratada separadamente.' : 'Valores, escopo, prazo, integrações e condições de contratação são alinhados diretamente com nosso comercial. Conte o que seu negócio precisa para prepararmos uma proposta adequada ao seu projeto.')}</p>
            <a href={contact} target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex min-h-11 items-center gap-2 font-medium hover:underline">{t(isPlate ? 'Adquirir Placa' : 'Conversar sobre o Desenvolvimento ezway')} <ArrowUpRight size={16} aria-hidden="true" /></a>
          </ScrollReveal>
        </section>
        <section className={`topography-glass topography-glass--copy py-14 md:py-20 ${styles.questions}`} aria-labelledby="questions-heading">
          <ScrollReveal as="h2" preset="title" id="questions-heading" className="text-3xl font-semibold tracking-tight">{t('Dúvidas sobre')} {display.label.toLowerCase()}</ScrollReveal>
          <div className="mt-8 divide-y divide-ink/15">{display.questions.map(item => <details key={item.question} className="group py-5"><summary className="flex cursor-pointer items-center justify-between gap-5 text-lg font-medium"><span>{item.question}</span><Plus size={18} className="shrink-0 transition-transform group-open:rotate-45" aria-hidden="true" /></summary><p className="mt-4 max-w-3xl leading-relaxed text-ink/80">{item.answer}</p></details>)}</div>
        </section>
        <nav aria-label={t("Outras soluções ezway")} className={`topography-glass topography-glass--copy border-t border-ink/15 py-10 ${styles.related}`}><h2 className="text-xl font-semibold">{t('Outras soluções para seu negócio')}</h2><ul className="mt-5 flex flex-wrap gap-x-8 gap-y-4">{Object.values(servicePages).filter(item => item.path !== display.path).map(item => <li key={item.path}><Link href={item.path} className="inline-flex min-h-11 items-center gap-2 hover:underline">{t(item.label)}<ArrowUpRight size={14} aria-hidden="true" /></Link></li>)}</ul></nav>
      </main>
      <Footer />
    </div>
  );
}
