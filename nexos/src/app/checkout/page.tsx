import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { commercialHref, plateCommercialHref } from '@/lib/commercial';
import { BULK_MAX_QTY } from '@/lib/bulk-pricing';

export const metadata: Metadata = { title: 'Contato comercial', robots: { index: false, follow: false } };

// Saved purchase links now lead straight to the commercial team.
export default async function CommercialRedirect({ searchParams }: { searchParams: Promise<{ product?: string; quantity?: string }> }) {
  const params = await searchParams;
  const value = Number(params.quantity ?? 1);
  const quantity = Number.isInteger(value) ? Math.min(BULK_MAX_QTY, Math.max(1, value)) : 1;
  redirect(params.product === 'placa' ? plateCommercialHref(quantity) : commercialHref());
}
