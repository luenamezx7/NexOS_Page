import type { Metadata } from 'next';
import Link from 'next/link';
import { config } from '@/config';
import { checkoutHref, checkoutQuantity, money } from '@/lib/checkout';
import { CheckoutClient } from '@/components/checkout/CheckoutClient';
import { AuthHeader } from '@/components/auth/AuthFrame';
import { ArrowUpRight } from 'lucide-react';
import styles from '@/components/checkout/Checkout.module.css';

export const metadata: Metadata = { title: 'Checkout', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function CheckoutPage({ searchParams }: { searchParams: Promise<{ product?: string | string[]; quantity?: string | string[] }> }) {
  const params = await searchParams;
  const productId = Array.isArray(params.product) ? params.product[0] : params.product;
  const product = config.services.find(service => service.id === productId);
  const quantity = checkoutQuantity(Array.isArray(params.quantity) ? params.quantity[0] : params.quantity);
  if (!product) return <main className={styles.page}><AuthHeader /><section className={styles.choose}>
    <h1 className="page-title brand-heading">Seu próximo pedido.</h1>
    <p>{productId ? 'Essa solução não está disponível. Escolha uma opção do catálogo.' : 'Escolha a solução que você quer levar para o seu negócio.'}</p>
    <ul>{config.services.map(service => <li key={service.id}><Link href={checkoutHref(service.id)}><span>{service.id === 'teste' ? 'Teste de checkout' : service.title}<small>{money(service.price)}</small></span><ArrowUpRight size={20} aria-hidden="true" /></Link></li>)}</ul>
  </section></main>;
  return <CheckoutClient key={`${product.id}:${quantity}`} product={product} initialQuantity={quantity} />;
}
