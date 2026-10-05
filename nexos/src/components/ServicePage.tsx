import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, ArrowUpRight, Check, Plus } from 'lucide-react';
import { config } from '@/config';
import { checkoutHref } from '@/lib/checkout';
import { siteUrl } from '@/lib/seo';
import { servicePages, type ServicePageContent } from '@/lib/service-pages';
import { JsonLd } from './JsonLd';
import { ThemeToggle } from './ThemeToggle';
import { Footer } from './Footer';

export function ServicePage({ service }: { service: ServicePageContent }) {
  const product = config.services.find(item => item.id === service.productId)!;
  const isPlate = service.productId === 'placa';
  const price = product.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const contact = `https://wa.me/${config.whatsapp.number}?text=${encodeURIComponent(`Olá! Quero conversar sobre ${service.label.toLowerCase()} para meu negócio.`)}`;
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'NexOS', item: siteUrl() },
          { '@type': 'ListItem', position: 2, name: service.label, item: siteUrl(service.path) },
        ],
      },
      isPlate ? {
        '@type': 'Product',
        '@id': siteUrl(`${service.path}#product`),
        name: product.title,
        description: service.description,
        image: [siteUrl('/placas/codex-1.png')],
        brand: { '@type': 'Brand', name: config.brand.name },
        offers: {
          '@type': 'Offer',
          url: siteUrl(checkoutHref(product.id)),
          price: product.price,
          priceCurrency: 'BRL',
          seller: { '@id': siteUrl('/#organization') },
        },
      } : {
        '@type': 'Service',
        '@id': siteUrl(`${service.path}#service`),
        name: service.label,
        serviceType: service.label,
        description: service.description,
        url: siteUrl(service.path),
        provider: { '@id': siteUrl('/#organization') },
      },
    ],
  };

  return (
    <div className="service-page text-ink">
      <JsonLd data={structuredData} />
      <a href="#main-content" className="skip-link">Pular para o conteúdo</a>
      <header className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-5 md:px-8">
        <Link href="/" aria-label="NexOS, página inicial"><Image src="/nexos-branca-transparente.svg" width={112} height={28} alt="NexOS" className="logo-invert" /></Link>
        <div className="flex items-center gap-4"><Link href="/#services" className="text-sm hover:underline">Ver soluções</Link><ThemeToggle /></div>
      </header>
      <main id="main-content" tabIndex={-1} className="mx-auto max-w-6xl px-5 md:px-8">
        <nav aria-label="Caminho da página" className="mt-6 text-sm text-ink/70">
          <ol className="flex flex-wrap items-center gap-3"><li><Link href="/" className="inline-flex items-center gap-2 hover:underline"><ArrowLeft size={14} aria-hidden="true" /> Início</Link></li><li aria-hidden="true">/</li><li aria-current="page">{service.label}</li></ol>
        </nav>
        <section className={`grid items-center gap-10 pb-14 pt-10 md:pb-20 md:pt-14 ${isPlate ? 'md:grid-cols-2' : ''}`} aria-labelledby="service-heading">
          <div className="max-w-3xl">
            <h1 id="service-heading" className="text-balance text-4xl font-semibold leading-[1.1] tracking-tight md:text-6xl">{service.headline}</h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink/80">{service.intro}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href={contact} className="btn-primary-nex inline-flex items-center gap-2 whitespace-nowrap">Conversar sobre {isPlate ? 'a placa' : 'o projeto'} <ArrowUpRight size={16} aria-hidden="true" /></a>
              <a href="#como-funciona" className="btn-secondary-nex whitespace-nowrap">Como funciona</a>
            </div>
          </div>
          {isPlate && <figure><Image src="/placas/codex-1.png" width={960} height={960} alt="Placa Inteligente NexOS de acrílico com NFC e QR Code, segurada em mãos" priority sizes="(max-width: 767px) 100vw, 50vw" className="aspect-square w-full rounded-2xl object-cover" /><figcaption className="mt-3 text-sm text-ink/70">NFC e QR Code na mesma placa.</figcaption></figure>}
        </section>
        <section className="border-y border-ink/15 py-10 md:py-14" aria-labelledby="overview-heading">
          <h2 id="overview-heading" className="text-3xl font-semibold tracking-tight">{service.overviewTitle}</h2>
          <p className="mt-5 max-w-3xl leading-relaxed text-ink/80">{service.overview}</p>
          <div className="mt-10 grid gap-8 md:grid-cols-3">{service.applications.map(application => <article key={application.title}><h3 className="text-lg font-semibold">{application.title}</h3><p className="mt-3 leading-relaxed text-ink/80">{application.body}</p></article>)}</div>
        </section>
        <section id="como-funciona" className="scroll-mt-8 py-14 md:py-20" aria-labelledby="process-heading">
          <h2 id="process-heading" className="text-3xl font-semibold tracking-tight">Como funciona</h2>
          <ol className="mt-8 grid gap-8 md:grid-cols-3">{service.steps.map((step, index) => <li key={step.title}><span className="font-mono text-sm text-ink/70">0{index + 1}</span><h3 className="mt-3 text-xl font-semibold">{step.title}</h3><p className="mt-3 leading-relaxed text-ink/80">{step.body}</p></li>)}</ol>
        </section>
        <section className="grid gap-10 rounded-2xl border border-ink/15 bg-ink/[0.03] p-6 md:grid-cols-2 md:p-10" aria-labelledby="preparation-heading">
          <div><h2 id="preparation-heading" className="text-2xl font-semibold">O que preparar</h2><ul className="mt-6 flex flex-col gap-4">{service.preparation.map(item => <li key={item} className="flex items-start gap-3 text-ink/80"><Check size={18} className="mt-1 shrink-0" aria-hidden="true" /><span>{item}</span></li>)}</ul></div>
          <div>
            <h2 className="text-2xl font-semibold">{isPlate ? 'Preço da placa' : 'Plano Desenvolvimento NexOS'}</h2>
            <p className="mt-5 text-4xl font-semibold tracking-tight">{price}<span className="ml-2 text-base font-normal text-ink/80">{isPlate ? 'por unidade' : 'por mês'}</span></p>
            <p className="mt-4 leading-relaxed text-ink/80">{isPlate ? 'Valor de uma unidade. Quantidade, descontos disponíveis e frete são apresentados antes do pagamento. A criação de site ou cardápio é contratada separadamente.' : 'O escopo, o prazo, as integrações e os custos de domínio e hospedagem são alinhados antes da contratação. Converse com a NexOS para confirmar se o plano atende ao seu projeto.'}</p>
            <Link href={isPlate ? '/#showcase' : checkoutHref(product.id)} prefetch={false} className="mt-6 inline-flex min-h-11 items-center gap-2 font-medium hover:underline">{isPlate ? 'Escolher quantidade' : 'Ver plano no checkout'} <ArrowUpRight size={16} aria-hidden="true" /></Link>
          </div>
        </section>
        <section className="py-14 md:py-20" aria-labelledby="questions-heading">
          <h2 id="questions-heading" className="text-3xl font-semibold tracking-tight">Dúvidas sobre {service.label.toLowerCase()}</h2>
          <div className="mt-8 divide-y divide-ink/15">{service.questions.map(item => <details key={item.question} className="group py-5"><summary className="flex cursor-pointer items-center justify-between gap-5 text-lg font-medium"><span>{item.question}</span><Plus size={18} className="shrink-0 transition-transform group-open:rotate-45" aria-hidden="true" /></summary><p className="mt-4 max-w-3xl leading-relaxed text-ink/80">{item.answer}</p></details>)}</div>
        </section>
        <nav aria-label="Outras soluções NexOS" className="border-t border-ink/15 py-10"><h2 className="text-xl font-semibold">Outras soluções para seu negócio</h2><ul className="mt-5 flex flex-wrap gap-x-8 gap-y-4">{Object.values(servicePages).filter(item => item.path !== service.path).map(item => <li key={item.path}><Link href={item.path} className="inline-flex min-h-11 items-center gap-2 hover:underline">{item.label}<ArrowUpRight size={14} aria-hidden="true" /></Link></li>)}</ul></nav>
      </main>
      <Footer />
    </div>
  );
}
