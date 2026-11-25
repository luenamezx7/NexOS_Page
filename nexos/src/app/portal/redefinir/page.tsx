import type { Metadata } from 'next';
import Link from 'next/link';
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';
import { CustomerAuthPanel } from '@/components/auth/CustomerAuthPanel';
import { Button } from '@/components/ui/cnippet-button';
import styles from '@/components/auth/LoginForm.module.css';

/** The recovery token proves mailbox ownership; this flow requires no session or MFA. */
export const metadata: Metadata = { title: 'Redefinir senha | ezway', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string | string[] }> }) {
  const params = await searchParams;
  const raw = params.token;
  const token = (Array.isArray(raw) ? raw[0] : raw)?.trim() ?? '';
  if (token) return <ResetPasswordForm token={token} />;
  return <CustomerAuthPanel title="Link necessário" titleId="reset-link-title" description="Para redefinir a senha, use o link enviado por e-mail. Ele é de uso único e expira em 1 hora. Peça um novo em “Esqueceu a senha”.">
    <Button render={<Link href="/portal/acesso" />} className={styles.primarySubmit}>Pedir um novo link</Button>
  </CustomerAuthPanel>;
}
