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
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ShieldCheck,
  KeyRound,
  Mail,
  Pencil,
  User,
  Phone,
  Calendar,
  Check,
  X,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui';
import { LogoutButton } from '@/components/LogoutButton';
import { PageFooter, PageHeader } from '@/components/PageChrome';
import { ScrollReveal } from '@/components/ScrollReveal';
import { updateProfileAction } from '@/lib/account/actions';

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
  return <div className="interior-page">
    <PageHeader>{email && <><span className="page-session-email">{email}</span><LogoutButton /></>}</PageHeader>
    <main className="page-container account-content" id="main-content">
      <div className="page-intro"><p className="page-kicker">NexOS / Área do cliente</p><ScrollReveal as="h1" preset="title" className="page-title">Minha conta</ScrollReveal><ScrollReveal as="p">Seus dados e preferências de acesso em um só lugar.</ScrollReveal></div>
      {children}
    </main>
    <PageFooter />
  </div>;
}

export default function ContaPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingProfile, setEditingProfile] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    async function loadData() {
      try {
        const profileRes = await fetch('/api/account/profile');

        if (profileRes.ok) {
          const data = await profileRes.json();
          setProfile(data);
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  function handleProfileSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await updateProfileAction({}, formData);
      if (result.success) {
        setEditingProfile(false);
        const res = await fetch('/api/account/profile');
        if (res.ok) setProfile(await res.json());
      }
    });
  }

  if (loading) {
    return (
      <AccountShell><div className="page-panel flex flex-col gap-4 p-6" role="status" aria-label="Carregando sua conta"><div className="h-5 w-40 rounded bg-muted" /><div className="h-4 w-3/4 rounded bg-muted" /><div className="h-4 w-1/2 rounded bg-muted" /><p className="text-muted-foreground">Carregando sua conta…</p></div></AccountShell>
    );
  }

  if (!profile) {
    return (
      <AccountShell>
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h2 className="font-display text-xl font-bold text-ink mb-2">Erro ao carregar</h2>
            <p className="text-ink/60 mb-4">Não foi possível carregar seus dados. Tente novamente.</p>
            <Button onClick={() => router.refresh()} variant="secondary" size="sm">
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      </AccountShell>
    );
  }

  return (
    <AccountShell email={profile.email}>
        <ScrollReveal as="section" preset="card">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <div className="size-10 rounded-lg border border-border bg-accent flex items-center justify-center">
                     <User className="size-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="font-display text-xl text-ink">{profile.fullName || 'Usuário'}</CardTitle>
                    <CardDescription className="text-ink/60">{profile.email}</CardDescription>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingProfile(!editingProfile)}
                  className="gap-2"
                >
                  <Pencil className="w-4 h-4" />
                  {editingProfile ? 'Cancelar' : 'Editar'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {editingProfile ? (
                <form action={handleProfileSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName" className="text-sm font-medium text-ink/70">
                        Nome completo
                      </Label>
                      <Input
                        id="fullName"
                        name="fullName"
                        defaultValue={profile.fullName}
                        className="field-input"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-sm font-medium text-ink/70">
                        Telefone
                      </Label>
                      <Input
                        id="phone"
                        name="phone"
                        defaultValue={profile.phone}
                        placeholder="(11) 98765-4321"
                        className="field-input"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" variant="primary" size="sm" disabled={isPending}>
                      {isPending ? 'Salvando...' : 'Salvar alterações'}
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => setEditingProfile(false)}
                    >
                      Cancelar
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-ink/[0.02]">
                    <Mail className="w-4 h-4 text-ink/40" />
                    <div>
                      <p className="text-xs text-ink/50 font-mono uppercase tracking-wider">E-mail</p>
                      <p className="text-sm text-ink font-medium">{profile.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-ink/[0.02]">
                    <Phone className="w-4 h-4 text-ink/40" />
                    <div>
                      <p className="text-xs text-ink/50 font-mono uppercase tracking-wider">Telefone</p>
                      <p className="text-sm text-ink font-medium">{profile.phone || 'Não informado'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-ink/[0.02]">
                    <Calendar className="w-4 h-4 text-ink/40" />
                    <div>
                      <p className="text-xs text-ink/50 font-mono uppercase tracking-wider">Membro desde</p>
                      <p className="text-sm text-ink font-medium">{formatDate(profile.createdAt)}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </ScrollReveal>

        <ScrollReveal as="section" preset="card">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-[color:var(--brand-choice)]" />
                <CardTitle className="font-display text-lg">Segurança</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg border border-ink/10">
                  <div className="flex items-center gap-2 mb-2">
                    <KeyRound className="w-4 h-4 text-ink/50" />
                    <p className="text-sm font-medium text-ink">Autenticação em dois fatores</p>
                  </div>
                  <p className="text-sm text-ink/60">
                     {profile.twoFactorEnabled ? 'Ativa' : 'Não configurada'}
                  </p>
                   <p className="text-xs text-ink/40 mt-1">
                     Último acesso: {formatDateTime(profile.lastSignIn)}
                   </p>
                   <Link href="/portal/seguranca" className="mt-3 inline-block text-sm underline underline-offset-4">Gerenciar senha, chaves de acesso e 2FA</Link>
                </div>
                <div className="p-4 rounded-lg border border-ink/10">
                  <div className="flex items-center gap-2 mb-2">
                    <Mail className="w-4 h-4 text-ink/50" />
                    <p className="text-sm font-medium text-ink">Status do e-mail</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {profile.emailConfirmed ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-500" />
                        <p className="text-sm text-emerald-600 dark:text-emerald-400">Confirmado</p>
                      </>
                    ) : (
                      <>
                        <X className="w-4 h-4 text-amber-500" />
                        <p className="text-sm text-amber-600 dark:text-amber-400">Não confirmado</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </ScrollReveal>

        <ScrollReveal as="section" preset="card">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-[color:var(--brand-choice)]" />
                <CardTitle className="font-display text-lg">LGPD & Privacidade</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-mono uppercase tracking-wider text-ink/50 mb-3">
                    Seus direitos
                  </h3>
                  <ul className="space-y-2 text-sm text-ink/70">
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-[color:var(--brand-choice)] mt-0.5 shrink-0" />
                      <span>Acesso: solicitar quais dados temos sobre você</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-[color:var(--brand-choice)] mt-0.5 shrink-0" />
                      <span>Correção: solicitar alteração de dados incompletos</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-[color:var(--brand-choice)] mt-0.5 shrink-0" />
                      <span>Eliminação: solicitar exclusão de dados desnecessários</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-[color:var(--brand-choice)] mt-0.5 shrink-0" />
                      <span>Portabilidade: dados em formato legível</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-sm font-mono uppercase tracking-wider text-ink/50 mb-3">
                    Como protegemos
                  </h3>
                  <ul className="space-y-2 text-sm text-ink/70">
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-[color:var(--brand-choice)] mt-0.5 shrink-0" />
                      <span>Criptografia de dados sensíveis</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-[color:var(--brand-choice)] mt-0.5 shrink-0" />
                      <span>Acesso restrito à equipe autorizada</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-[color:var(--brand-choice)] mt-0.5 shrink-0" />
                      <span>Logs de acesso e auditoria</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-[color:var(--brand-choice)] mt-0.5 shrink-0" />
                      <span>Política de retenção de dados</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </ScrollReveal>
    </AccountShell>
  );
}
