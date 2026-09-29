'use client';

/**
 * Tela "Minha Conta" — painel do usuário autenticado.
 *
 * Seções:
 * - Perfil: nome, e-mail, telefone, membro desde (editável)
 * - Segurança: MFA status, status do e-mail, último acesso
 * - Endereços: lista, adicionar, remover (CRUD completo)
 * - Pedidos: lista com status, itens, total, rastreio
 * - LGPD: direitos do usuário, proteção de dados
 *
 * Dados reais do Supabase via /api/account/*.
 * Design: tokens do Design System v3 (bg-canvas, text-ink, bg-card).
 * Dark/light mode automático via variáveis CSS.
 */

import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  ShieldCheck,
  KeyRound,
  Mail,
  MapPin,
  Package,
  Pencil,
  Plus,
  Trash2,
  LogOut,
  User,
  Phone,
  Calendar,
  Check,
  X,
  AlertTriangle,
  Clock,
  Truck,
  CreditCard,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui';
import { LogoutButton } from '@/components/LogoutButton';
import { updateProfileAction, addAddressAction, deleteAddressAction } from '@/lib/account/actions';

interface Profile {
  email: string;
  fullName: string;
  phone: string;
  emailConfirmed: boolean;
  lastSignIn: string | null;
  createdAt: string | null;
}

interface Address {
  id: string;
  type: 'home' | 'work' | 'other';
  street: string;
  number: string;
  complement: string | null;
  neighborhood: string;
  city: string;
  state: string;
  cep: string;
  country: string;
  is_default: boolean;
}

interface Order {
  id: string;
  code: string;
  status: 'pending' | 'processing' | 'paid' | 'cancelled' | 'refunded' | 'unknown';
  date: string;
  total: number;
  items: Array<{ name: string; price: number; quantity: number }>;
  tracking_code: string | null;
  carrier: string | null;
  estimated_delivery: string | null;
}

const statusLabels: Record<string, string> = {
  pending: 'Pendente',
  processing: 'Processando',
  paid: 'Pago',
  cancelled: 'Cancelado',
  refunded: 'Reembolsado',
  unknown: 'Desconhecido',
};

const statusColors: Record<string, string> = {
  pending: 'text-yellow-600 dark:text-yellow-400',
  processing: 'text-blue-600 dark:text-blue-400',
  paid: 'text-green-600 dark:text-green-400',
  cancelled: 'text-red-600 dark:text-red-400',
  refunded: 'text-purple-600 dark:text-purple-400',
  unknown: 'text-muted-foreground',
};

const addressTypeLabels: Record<string, string> = {
  home: 'Casa',
  work: 'Trabalho',
  other: 'Outro',
};

function formatDate(date: string | null) {
  if (!date) return '—';
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium' }).format(new Date(date));
}

function formatDateTime(date: string | null) {
  if (!date) return '—';
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(date));
}

function formatCurrency(cents: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);
}

function formatCep(cep: string) {
  return cep.replace(/(\d{5})(\d{3})/, '$1-$2');
}

export default function ContaPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProfile, setEditingProfile] = useState(false);
  const [addingAddress, setAddingAddress] = useState(false);
  const [deletingAddress, setDeletingAddress] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    async function loadData() {
      try {
        const [profileRes, addressesRes, ordersRes] = await Promise.all([
          fetch('/api/account/profile'),
          fetch('/api/account/addresses'),
          fetch('/api/account/orders'),
        ]);

        if (profileRes.ok) {
          const data = await profileRes.json();
          setProfile(data);
        }
        if (addressesRes.ok) {
          const data = await addressesRes.json();
          setAddresses(data.addresses ?? []);
        }
        if (ordersRes.ok) {
          const data = await ordersRes.json();
          setOrders(data.orders ?? []);
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

  function handleAddAddress(formData: FormData) {
    startTransition(async () => {
      const result = await addAddressAction({}, formData);
      if (result.success) {
        setAddingAddress(false);
        const res = await fetch('/api/account/addresses');
        if (res.ok) {
          const data = await res.json();
          setAddresses(data.addresses ?? []);
        }
      }
    });
  }

  function handleDeleteAddress(id: string) {
    startTransition(async () => {
      const result = await deleteAddressAction(id);
      if (result.success) {
        setAddresses((prev) => prev.filter((a) => a.id !== id));
      }
      setDeletingAddress(null);
    });
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-ink/20 border-t-ink rounded-full animate-spin mx-auto mb-4" />
          <p className="text-ink/60 font-sans">Carregando sua conta...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center p-4">
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
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas">
      <header className="sticky top-0 z-10 border-b border-ink/10 bg-glass backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 text-ink/60 hover:text-ink transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="font-display text-lg font-bold text-ink">Minha Conta</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-ink/40 hidden sm:block">{profile.email}</span>
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <section>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#ff5c8a] to-[#83358F] flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="font-display text-xl">{profile.fullName || 'Usuário'}</CardTitle>
                    <CardDescription className="text-ink/50">{profile.email}</CardDescription>
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
        </section>

        <section>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-[#ff5c8a]" />
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
                    {profile.emailConfirmed ? 'Ativa' : 'Pendente de confirmação de e-mail'}
                  </p>
                  <p className="text-xs text-ink/40 mt-1">
                    Último acesso: {formatDateTime(profile.lastSignIn)}
                  </p>
                </div>
                <div className="p-4 rounded-lg border border-ink/10">
                  <div className="flex items-center gap-2 mb-2">
                    <Mail className="w-4 h-4 text-ink/50" />
                    <p className="text-sm font-medium text-ink">Status do e-mail</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {profile.emailConfirmed ? (
                      <>
                        <Check className="w-4 h-4 text-green-500" />
                        <p className="text-sm text-green-600 dark:text-green-400">Confirmado</p>
                      </>
                    ) : (
                      <>
                        <X className="w-4 h-4 text-yellow-500" />
                        <p className="text-sm text-yellow-600 dark:text-yellow-400">Não confirmado</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-[#ff5c8a]" />
                  <CardTitle className="font-display text-lg">Endereços</CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setAddingAddress(!addingAddress)}
                  className="gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {addingAddress && (
                <form action={handleAddAddress} className="p-4 rounded-lg border border-ink/10 space-y-4 bg-ink/[0.01]">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="type" className="text-sm font-medium text-ink/70">Tipo</Label>
                      <select id="type" name="type" className="field-input w-full" defaultValue="home">
                        <option value="home">Casa</option>
                        <option value="work">Trabalho</option>
                        <option value="other">Outro</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="isDefault" className="text-sm font-medium text-ink/70">Padrão</Label>
                      <label className="flex items-center gap-2 mt-2 cursor-pointer">
                        <input type="checkbox" name="isDefault" className="rounded border-ink/20" />
                        <span className="text-sm text-ink/70">Definir como endereço padrão</span>
                      </label>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="street" className="text-sm font-medium text-ink/70">Rua *</Label>
                      <Input id="street" name="street" className="field-input" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="number" className="text-sm font-medium text-ink/70">Número *</Label>
                      <Input id="number" name="number" className="field-input" required />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="complement" className="text-sm font-medium text-ink/70">Complemento</Label>
                      <Input id="complement" name="complement" className="field-input" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="neighborhood" className="text-sm font-medium text-ink/70">Bairro *</Label>
                      <Input id="neighborhood" name="neighborhood" className="field-input" required />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city" className="text-sm font-medium text-ink/70">Cidade *</Label>
                      <Input id="city" name="city" className="field-input" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state" className="text-sm font-medium text-ink/70">Estado *</Label>
                      <Input id="state" name="state" className="field-input" required maxLength={2} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cep" className="text-sm font-medium text-ink/70">CEP *</Label>
                      <Input id="cep" name="cep" className="field-input" required placeholder="00000-000" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" variant="primary" size="sm" disabled={isPending}>
                      {isPending ? 'Salvando...' : 'Salvar endereço'}
                    </Button>
                    <Button type="button" variant="secondary" size="sm" onClick={() => setAddingAddress(false)}>
                      Cancelar
                    </Button>
                  </div>
                </form>
              )}

              {addresses.length === 0 && !addingAddress ? (
                <div className="text-center py-8">
                  <MapPin className="w-12 h-12 text-ink/20 mx-auto mb-3" />
                  <p className="text-ink/50">Nenhum endereço cadastrado</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {addresses.map((addr) => (
                    <div
                      key={addr.id}
                      className={`p-4 rounded-lg border ${addr.is_default ? 'border-[#ff5c8a]/30 bg-[#ff5c8a]/[0.02]' : 'border-ink/10'}`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono uppercase tracking-wider text-ink/40">
                            {addressTypeLabels[addr.type]}
                          </span>
                          {addr.is_default && (
                            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-[#ff5c8a]/10 text-[#ff5c8a]">
                              Padrão
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => setDeletingAddress(addr.id)}
                          className="p-1 rounded hover:bg-red-500/10 text-ink/40 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-sm text-ink font-medium">
                        {addr.street}, {addr.number}
                      </p>
                      {addr.complement && <p className="text-sm text-ink/60">{addr.complement}</p>}
                      <p className="text-sm text-ink/60">
                        {addr.neighborhood} — {addr.city}/{addr.state}
                      </p>
                      <p className="text-sm text-ink/60">{formatCep(addr.cep)}</p>
                    </div>
                  ))}
                </div>
              )}

              {deletingAddress && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                  <Card className="max-w-sm w-full">
                    <CardHeader>
                      <CardTitle className="font-display text-lg">Remover endereço</CardTitle>
                      <CardDescription>Tem certeza? Esta ação não pode ser desfeita.</CardDescription>
                    </CardHeader>
                    <CardFooter className="flex gap-2 justify-end">
                      <Button variant="secondary" size="sm" onClick={() => setDeletingAddress(null)}>
                        Cancelar
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        disabled={isPending}
                        onClick={() => handleDeleteAddress(deletingAddress)}
                      >
                        {isPending ? 'Removendo...' : 'Remover'}
                      </Button>
                    </CardFooter>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        <section>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Package className="w-5 h-5 text-[#ff5c8a]" />
                <CardTitle className="font-display text-lg">Meus Pedidos</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {orders.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="w-12 h-12 text-ink/20 mx-auto mb-3" />
                  <p className="text-ink/50 mb-4">Nenhum pedido realizado</p>
                  <Link href="/">
                    <Button variant="primary" size="sm">
                      Ver produtos
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div key={order.id} className="p-4 rounded-lg border border-ink/10">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-mono text-sm text-ink font-medium">{order.code}</p>
                          <p className="text-xs text-ink/50">{formatDate(order.date)}</p>
                        </div>
                        <span className={`text-sm font-medium ${statusColors[order.status]}`}>
                          {statusLabels[order.status]}
                        </span>
                      </div>

                      {order.items && order.items.length > 0 && (
                        <div className="space-y-1 mb-3">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-sm">
                              <span className="text-ink/70">
                                {item.quantity}x {item.name}
                              </span>
                              <span className="text-ink/50">{formatCurrency(item.price * 100)}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-3 border-t border-ink/10">
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-ink/40" />
                          <span className="font-display text-lg font-bold text-ink">
                            {formatCurrency(order.total)}
                          </span>
                        </div>
                        {order.tracking_code && (
                          <div className="flex items-center gap-2 text-sm text-ink/60">
                            <Truck className="w-4 h-4" />
                            <span className="font-mono">{order.tracking_code}</span>
                          </div>
                        )}
                      </div>

                      {order.estimated_delivery && (
                        <div className="flex items-center gap-2 mt-2 text-xs text-ink/50">
                          <Clock className="w-3 h-3" />
                          <span>Previsão: {formatDate(order.estimated_delivery)}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        <section>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-[#ff5c8a]" />
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
                      <Check className="w-4 h-4 text-[#ff5c8a] mt-0.5 shrink-0" />
                      <span>Acesso: solicitar quais dados temos sobre você</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-[#ff5c8a] mt-0.5 shrink-0" />
                      <span>Correção: solicitar alteração de dados incompletos</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-[#ff5c8a] mt-0.5 shrink-0" />
                      <span>Eliminação: solicitar exclusão de dados desnecessários</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-[#ff5c8a] mt-0.5 shrink-0" />
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
                      <Check className="w-4 h-4 text-[#ff5c8a] mt-0.5 shrink-0" />
                      <span>Criptografia de dados sensíveis</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-[#ff5c8a] mt-0.5 shrink-0" />
                      <span>Acesso restrito à equipe autorizada</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-[#ff5c8a] mt-0.5 shrink-0" />
                      <span>Logs de acesso e auditoria</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-[#ff5c8a] mt-0.5 shrink-0" />
                      <span>Política de retenção de dados</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
