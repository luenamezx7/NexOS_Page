'use client';

/**
 * Tela "Minha Conta" — painel do usuário autenticado.
 *
 * Seções:
 * - Perfil: nome, e-mail, telefone, membro desde (editável)
 * - Segurança: MFA status, status do e-mail, último acesso
 * - LGPD: direitos do usuário, proteção de dados
 *
 * Dados reais do Supabase via /api/account/*.
 * Design: tokens do Design System v3 (bg-canvas, text-ink, bg-card).
 * Dark/light mode automático via variáveis CSS.
 */

import { useState, useEffect, useTransition, type ReactNode } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  KeyRound,
  Mail,
  Pencil,
  Phone,
  Calendar,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { LogoutButton } from '@/components/LogoutButton';
import { PageFooter, PageHeader } from '@/components/PageChrome';
import { updateProfileAction } from '@/lib/account/actions';
import styles from './AccountClient.module.css';

interface Profile {
  email: string;
  fullName: string;
  phone: string;
  emailConfirmed: boolean;
  twoFactorEnabled: boolean;
  lastSignIn: string | null;
  createdAt: string | null;
}

function formatDate(date: string | null) {
  if (!date) return '—';
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium' }).format(new Date(date));
}

function formatDateTime(date: string | null) {
  if (!date) return '—';
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(date));
}

function AccountShell({ children, email }: { children: ReactNode; email?: string }) {
  return <div className={`interior-page ${styles.shell}`}>
    <PageHeader accountOnly>{email && <><span className="page-session-email">{email}</span><LogoutButton /></>}</PageHeader>
    <main className={`page-container account-content ${styles.content}`} id="main-content">
      <div className={`page-intro ${styles.intro}`}><p className="page-kicker">ezway / Área do cliente</p><h1 className="page-title">Minha conta</h1><p>Seu espaço para cuidar dos seus dados e do acesso à ezway.</p></div>
      {children}
    </main>
    <PageFooter />
  </div>;
}

export default function ContaPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [requestKey, setRequestKey] = useState(0);
  const [editingProfile, setEditingProfile] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    async function loadData() {
      try {
        const profileRes = await fetch('/api/account/profile');

        if (!profileRes.ok) throw new Error('Não foi possível carregar o perfil.');
        setProfile(await profileRes.json());
        setLoadError(false);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        setLoadError(true);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [requestKey]);

  function handleProfileSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await updateProfileAction({}, formData);
      if (result.success) {
        setEditingProfile(false);
        setSaveError('');
        const res = await fetch('/api/account/profile');
        if (res.ok) setProfile(await res.json());
      } else {
        setSaveError('Não foi possível salvar as alterações. Confira os dados e tente novamente.');
      }
    });
  }

  if (loading) {
    return (
      <AccountShell><Card className={styles.card} role="status" aria-label="Carregando sua conta"><CardHeader><Skeleton className="h-6 w-40" /><Skeleton className="h-4 w-64 max-w-full" /></CardHeader><CardContent className="flex flex-col gap-4"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /><span className="sr-only">Carregando sua conta…</span></CardContent></Card></AccountShell>
    );
  }

  if (!profile) {
    return (
      <AccountShell>
        <Alert variant="destructive" className={styles.card}><AlertTriangle aria-hidden="true" /><AlertTitle>Erro ao carregar</AlertTitle><AlertDescription>{loadError ? 'Não foi possível carregar seus dados. Tente novamente.' : 'Seus dados não estão disponíveis no momento.'}</AlertDescription></Alert>
        <Button onClick={() => { setLoading(true); setRequestKey(key => key + 1); }} variant="secondary" size="sm">Tentar novamente</Button>
      </AccountShell>
    );
  }

  return (
    <AccountShell email={profile.email}>
      <div className={styles.grid}>
        <section aria-labelledby="profile-title" className={styles.profile}>
          <Card className={styles.card}>
            <CardHeader className={styles.cardHead}>
              <div><p className={styles.eyebrow}>01 / Pessoal</p><CardTitle id="profile-title">Seu perfil</CardTitle><CardDescription>Informações para identificar e contatar você.</CardDescription></div>
              <Button variant="secondary" size="sm" onClick={() => { setEditingProfile(!editingProfile); setSaveError(''); }}><Pencil data-icon="inline-start" aria-hidden="true" />{editingProfile ? 'Cancelar' : 'Editar'}</Button>
            </CardHeader>
            <CardContent>
              {editingProfile ? <form action={handleProfileSubmit}>
                <FieldGroup className={styles.formFields}>
                  <Field><FieldLabel htmlFor="fullName">Nome completo</FieldLabel><Input id="fullName" name="fullName" defaultValue={profile.fullName} className="field-input" required /></Field>
                  <Field><FieldLabel htmlFor="phone">Telefone</FieldLabel><Input id="phone" name="phone" defaultValue={profile.phone} placeholder="(11) 98765-4321" className="field-input" /></Field>
                </FieldGroup>
                {saveError && <Alert variant="destructive" className={styles.saveError}><AlertDescription>{saveError}</AlertDescription></Alert>}
                <div className={styles.formActions}><Button type="submit" variant="primary" size="sm" disabled={isPending}>{isPending ? 'Salvando…' : 'Salvar alterações'}</Button><Button type="button" variant="secondary" size="sm" onClick={() => setEditingProfile(false)}>Cancelar</Button></div>
              </form> : <dl className={styles.details}>
                <div><dt><Mail aria-hidden="true" /> E-mail</dt><dd>{profile.email}</dd></div>
                <div><dt><Phone aria-hidden="true" /> Telefone</dt><dd>{profile.phone || 'Não informado'}</dd></div>
                <div><dt><Calendar aria-hidden="true" /> Membro desde</dt><dd>{formatDate(profile.createdAt)}</dd></div>
              </dl>}
            </CardContent>
          </Card>
        </section>
        <section aria-labelledby="security-title" className={styles.security}>
          <Card className={styles.card}>
            <CardHeader><p className={styles.eyebrow}>02 / Proteção</p><CardTitle id="security-title">Segurança</CardTitle><CardDescription>O essencial sobre o acesso à sua conta.</CardDescription></CardHeader>
            <CardContent className={styles.securityContent}>
              <div className={styles.statusRow}><ShieldCheck aria-hidden="true" /><div><strong>E-mail {profile.emailConfirmed ? 'confirmado' : 'não confirmado'}</strong><p>{profile.emailConfirmed ? 'Seu endereço foi verificado.' : 'Confirme seu endereço para proteger sua conta.'}</p></div>{profile.emailConfirmed && <Check aria-hidden="true" />}</div>
              <div className={styles.statusRow}><KeyRound aria-hidden="true" /><div><strong>Verificação em duas etapas</strong><p>{profile.twoFactorEnabled ? 'Ativa' : 'Ainda não configurada'}</p></div></div>
              <p className={styles.lastAccess}>Último acesso: {formatDateTime(profile.lastSignIn)}</p>
              <Link href="/portal/seguranca" className={styles.securityLink}>Gerenciar senha, chaves de acesso e 2FA <span aria-hidden="true">↗</span></Link>
            </CardContent>
          </Card>
        </section>
        <section aria-labelledby="privacy-title" className={styles.privacy}>
          <Card className={styles.card}>
            <CardHeader><p className={styles.eyebrow}>03 / Transparência</p><CardTitle id="privacy-title">Privacidade e seus dados</CardTitle><CardDescription>Você mantém o controle das suas informações.</CardDescription></CardHeader>
            <CardContent className={styles.privacyContent}><p>Consulte seus dados, solicite uma correção, portabilidade ou exclusão conforme a LGPD. Suas informações são protegidas e acessíveis apenas à equipe autorizada.</p><Link href="/privacidade">Conhecer nossa política de privacidade <span aria-hidden="true">↗</span></Link></CardContent>
          </Card>
        </section>
      </div>
    </AccountShell>
  );
}
