'use server';

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft, ShieldCheck, KeyRound, Mail, MapPin, Package } from 'lucide-react';
import { getUserAccess } from '@/lib/auth/user';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { LogoutButton } from '@/components/LogoutButton';
import { toast } from '@/components/ui/use-toast';

export const metadata = { title: 'Minha conta | NexOS', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

interface Address {
  id: string;
  type: 'home' | 'work' | 'other';
  label: string;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  cep: string;
  isDefault: boolean;
}

interface OrderItem {
  id: string;
  name: string;
  type: 'physical' | 'digital' | 'service';
  price: number;
  quantity: number;
}

interface Order {
  id: string;
  number: string;
  date: string;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  total: number;
  items: OrderItem[];
  shippingAddress?: Address;
  trackingNumber?: string;
  carrier?: string;
  estimatedDelivery?: string;
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  mfaEnabled: boolean;
  createdAt: string;
}

const MOCK_ORDERS: Order[] = [
  {
    id: '1',
    number: '#1010',
    date: '15/03/2024',
    status: 'delivered',
    total: 299.9,
    items: [
      { id: '1', name: 'Produto A (Físico)', type: 'physical', price: 99.9, quantity: 2 },
      { id: '2', name: 'Serviço B (Digital)', type: 'digital', price: 49.9, quantity: 1 },
      { id: '3', name: 'Assinatura C (Mensal)', type: 'service', price: 50, quantity: 1 },
    ],
    trackingNumber: 'LT039876543BR',
    carrier: 'Correios',
    estimatedDelivery: '16/03/2024 18:00',
  },
  {
    id: '2',
    number: '#1009',
    date: '10/03/2024',
    status: 'delivered',
    total: 150,
    items: [
      { id: '4', name: 'Produto físico', type: 'physical', price: 150, quantity: 1 },
    ],
    trackingNumber: 'LT039876542BR',
    carrier: 'Correios',
    estimatedDelivery: '11/03/2024 12:00',
  },
  {
    id: '3',
    number: '#1008',
    date: '05/03/2024',
    status: 'shipped',
    total: 349.9,
    items: [
      { id: '5', name: 'Kit Desenvolvedor', type: 'physical', price: 299.9, quantity: 1 },
      { id: '6', name: 'Acesso Premium', type: 'digital', price: 50, quantity: 1 },
    ],
    trackingNumber: 'LT039876541BR',
    carrier: 'Correios',
    estimatedDelivery: '12/03/2024 18:00',
  },
];

const MOCK_ADDRESSES: Address[] = [
  {
    id: '1',
    type: 'home',
    label: 'Casa',
    street: 'Rua das Flores',
    number: '123',
    neighborhood: 'Jardim',
    city: 'São Paulo',
    state: 'SP',
    cep: '01001-000',
    isDefault: true,
  },
  {
    id: '2',
    type: 'work',
    label: 'Trabalho',
    street: 'Av. Paulista',
    number: '1000',
    neighborhood: 'Bela Vista',
    city: 'São Paulo',
    state: 'SP',
    cep: '01310-100',
    isDefault: false,
  },
];

export default async function AccountPage() {
  const access = await getUserAccess();
  if (!access.ok) redirect('/portal/acesso');

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [addresses, setAddresses] = useState<Address[]>(MOCK_ADDRESSES);
  const [orders, setOrders] = useState<Order[]>(MOCK_ORDERS);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);

  useEffect(() => {
    // In a real app, fetch profile from Supabase
    // const supa = createClient();
    // const { data } = await supa.from('profiles').select('*').single();
    // setProfile(data as UserProfile);
    setProfile({
      id: 'user-123',
      name: 'João Silva',
      email: access.email,
      phone: '(11) 98765-4321',
      mfaEnabled: true,
      createdAt: '01/01/2024',
    });
  }, [access.email]);

  const handleLogout = async () => {
    try {
      const supa = await import('@/lib/supabase/server').then(mod => mod.createClient());
      await supa.auth.signOut();
      redirect('/portal/acesso');
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível sair da conta. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteAddress = async (id: string) => {
    setAddresses(addresses.filter(a => a.id !== id));
    toast({
      title: 'Endereço removido',
      description: 'O endereço foi removido com sucesso.',
    });
  };

  const handleSaveAddress = async (address: Address) => {
    if (editingAddress) {
      setAddresses(addresses.map(a => a.id === editingAddress.id ? address : a));
      setEditingAddress(null);
    } else {
      const newAddress = { ...address, id: Date.now().toString() };
      setAddresses([...addresses, newAddress]);
    }
    toast({
      title: 'Endereço salvo',
      description: 'O endereço foi salvo com sucesso.',
    });
    setShowAddAddress(false);
  };

  const handleDeleteOrderFromUI = (orderId: string) => {
    // Note: This only removes from UI; real deletion would need API
    setOrders(orders.filter(o => o.id !== orderId));
    toast({
      title: 'Pedido removido',
      description: 'O pedido foi removido da visualização.',
    });
  };

  if (!profile) {
    return (
      <main className="min-h-[100dvh] bg-canvas px-5 py-14 text-ink sm:px-8">
        <div className="mx-auto flex max-w-3xl flex-col gap-8">
          <Link
            href="/"
            className="inline-flex w-fit items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-ink/55 transition-colors hover:text-ink"
          >
            <ArrowLeft size={14} strokeWidth={2} aria-hidden="true" />
            Voltar ao site
          </Link>

          <header className="flex flex-col gap-3 border-b border-ink/12 pb-8">
            <p className="font-mono text-xs uppercase tracking-widest text-[#be185d]">Área do cliente</p>
            <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Sua conta, protegida.
            </h1>
            <p className="break-all font-mono text-sm text-ink/70">Carregando perfil...</p>
          </header>

          <div className="animate-pulse w-12 h-12 rounded-full bg-gray-800 mx-auto mt-8" />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[100dvh] bg-canvas px-5 py-14 text-ink sm:px-8">
      <div className="mx-auto flex max-w-3xl flex-col gap-8">
        <Link
          href="/"
          className="inline-flex w-fit items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-ink/55 transition-colors hover:text-ink"
        >
          <ArrowLeft size={14} strokeWidth={2} aria-hidden="true" />
          Voltar ao site
        </Link>

        <header className="flex flex-col gap-3 border-b border-ink/12 pb-8">
          <p className="font-mono text-xs uppercase tracking-widest text-[#be185d]">Área do cliente</p>
          <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Sua conta, protegida.
          </h1>
          <p className="font-mono text-sm text-ink/60">{profile.email}</p>
        </header>

        {/* Perfil do Usuário */}
        <section className="bento-card p-5 sm:col-span-full">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <h2 className="inline-flex items-center gap-2 text-sm font-semibold text-ink/80">
                <Mail size={15} strokeWidth={1.75} aria-hidden="true" /> Dados da conta
              </h2>
              <Card>
                <CardHeader>
                  <CardTitle>Informações pessoais</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm text-ink/60 mb-1">Nome completo</label>
                      <p className="font-medium text-ink">{profile.name}</p>
                    </div>
                    <div>
                      <label className="block text-sm text-ink/60 mb-1">E-mail</label>
                      <p className="font-medium text-ink">{profile.email}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-ink/60 mb-1">Telefone</label>
                      <p className="font-medium text-ink">{profile.phone}</p>
                    </div>
                    <div>
                      <label className="block text-sm text-ink/60 mb-1">Conta criada</label>
                      <p className="font-medium text-ink">{profile.createdAt}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowEditProfile(true)}
                    className="w-full mt-4"
                  >
                    ✎ Editar perfil
                  </Button>
                </CardContent>
              </Card>
            </div>

            <div>
              <h2 className="inline-flex items-center gap-2 text-sm font-semibold text-ink/80">
                <KeyRound size={15} strokeWidth={1.75} aria-hidden="true" /> Segurança
              </h2>
              <Card>
                <CardHeader>
                  <CardTitle>Autenticação de dois fatores</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm text-ink/60 mb-1">Status MFA</label>
                      <span className="px-2 py-1 rounded-full bg-emerald-600/30 text-emerald-400 text-xs font-medium">
                        {'MFA Ativo'}
                      </span>
                    </div>
                    <div>
                      <label className="block text-sm text-ink/60 mb-1">Último login</label>
                      <span className="px-2 py-1 rounded-full bg-ink/30 text-ink/40 text-xs font-medium">Hoje às 14:30</span>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-ink/10">
                    <p className="text-sm text-ink/60 mb-2">Gerenciar métodos de verificação:</p>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          // Abrir modal/para gerenciar MFA
                          toast({
                            title: 'Funcionalidade em breve',
                            description: 'Gerenciamento de MFA será disponibilizado em breve.',
                          });
                        }}
                      >
                        Gerenciar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Endereços de Entrega */}
        <section className="bento-card p-5 sm:col-span-full">
          <div>
            <h2 className="inline-flex items-center gap-2 text-sm font-semibold text-ink/80">
              <MapPin size={15} strokeWidth={1.75} aria-hidden="true" /> Endereços de entrega
            </h2>
            <Card>
              <CardHeader>
                <CardTitle>Seus endereços cadastrados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowAddAddress(true)}
                    className="w-full justify-start"
                  >
                    ➕ Adicionar novo endereço
                  </Button>
                </div>

                {addresses.map((addr) => (
                  <div key={addr.id} className="flex items-start gap-4 py-4 border-b border-ink/10 last:border-0">
                    <div className="w-8 h-8 rounded-md bg-emerald-600/20 flex items-center justify-center flex-shrink-0">
                      <MapPin size={14} strokeWidth={1.5} className="text-emerald-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-ink truncate">{addr.label}</h3>
                      <p className="text-xs text-ink/60">{addr.street}, {addr.number} - {addr.neighborhood}</p>
                      <p className="text-xs text-ink/60">{addr.city} - {addr.state}, {addr.cep}</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-1"
                        onClick={() => setEditingAddress(addr)}
                      >
                        ✎
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-1 text-destructive"
                        onClick={() => handleDeleteAddress(addr.id)}
                      >
                        🗑️
                      </Button>
                    </div>
                  </div>
                ))}

                {editingAddress && (
                  <div className="py-4 pt-8 border-t border-ink/10">
                    <h3 className="text-sm font-medium text-ink/80 mb-4">Editar endereço</h3>
                    <form
                      className="grid grid-cols-2 gap-4"
                      onSubmit={e => {
                        e.preventDefault();
                        const updated = {
                          ...editingAddress,
                          street: (e.target as any).street.value,
                          number: (e.target as any).number.value,
                          neighborhood: (e.target as any).neighborhood.value,
                          city: (e.target as any).city.value,
                          state: (e.target as any).state.value,
                          cep: (e.target as any).cep.value,
                        };
                        handleSaveAddress(updated);
                      }}
                    >
                      <Input
                        type="text"
                        placeholder="Rua/Av."
                        defaultValue={editingAddress.street}
                        name="street"
                        required
                      />
                      <Input
                        type="number"
                        placeholder="Número"
                        defaultValue={editingAddress.number}
                        name="number"
                        required
                      />
                      <Input
                        type="text"
                        placeholder="Bairro"
                        defaultValue={editingAddress.neighborhood}
                        name="neighborhood"
                        required
                      />
                      <Input
                        type="text"
                        placeholder="Cidade"
                        defaultValue={editingAddress.city}
                        name="city"
                        required
                      />
                      <Select defaultValue={editingAddress.state}>
                        <SelectTrigger>
                          <SelectValue placeholder="Estado" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="SP">São Paulo</SelectItem>
                          <SelectItem value="RJ">Rio de Janeiro</SelectItem>
                          <SelectItem value="MG">Minas Gerais</SelectItem>
                          <SelectItem value="RS">Rio Grande do Sul</SelectItem>
                          <SelectItem value="PR">Paraná</SelectItem>
                        </SelectContent>
                      </Select>

                      <Input
                        type="text"
                        placeholder="CEP"
                        defaultValue={editingAddress.cep}
                        name="cep"
                        required
                      />

                      <div className="col-span-full mt-4 flex justify-end">
                        <Button type="submit" className="w-full">
                          Salvar alterações
                        </Button>
                        <Button
                          variant="ghost"
                          type="button"
                          size="sm"
                          onClick={() => setEditingAddress(null)}
                          className="w-full mt-2"
                        >
                          Cancelar
                        </Button>
                      </div>
                    </form>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Meus Pedidos */}
        <section className="bento-card p-5 sm:col-span-full">
          <div>
            <h2 className="inline-flex items-center gap-2 text-sm font-semibold text-ink/80">
              <Package size={15} strokeWidth={1.75} aria-hidden="true" /> Meus pedidos
            </h2>
            <Card>
              <CardHeader>
                <CardTitle>Histórico de compras</CardTitle>
              </CardHeader>
              <CardContent>
                {orders.length === 0 ? (
                  <p className="text-ink/60 text-sm py-8 text-center">
                    Nenhum pedido encontrado. Comece a fazer suas compras.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div key={order.id} className="border-b border-ink/10 pb-6 last:border-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="font-medium text-ink">{order.number}</span>
                            <span className="text-xs text-ink/50">{order.date}</span>
                          </div>
                          <span className="text-xs font-medium text-ink/60 capitalize">
                            {order.status}
                          </span>
                        </div>

                        <div className="mt-3">
                          <h3 className="text-sm font-medium text-ink mb-2">Itens ({order.items.length})</h3>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            {order.items.map((item) => (
                              <div key={item.id} className="flex items-center gap-2 p-2 rounded bg-ink/30">
                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.type === 'physical' ? 'emerald-400' : item.type === 'digital' ? 'sky-400' : 'amber-500' }} />
                                <span className="text-ink/60">{item.name}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="mt-3 pt-3 border-t border-ink/10">
                          <div className="flex justify-between text-sm text-ink/60">
                            <span>Subtotal</span>
                            <span>R$ {order.total.toFixed(2)}</span>
                          </div>
                          {order.shippingAddress && (
                            <div className="flex justify-between text-xs text-ink/50">
                              <span>Frete</span>
                              <span>R$ {Math.random() * 50 + 10}.00</span>
                            </div>
                          )}
                          <div className="mt-2 flex justify-between font-medium text-ink">
                            <span>Total</span>
                            <span>R$ {order.total.toFixed(2)}</span>
                          </div>
                        </div>

                        <details className="mt-4">
                          <summary className="cursor-pointer text-sm text-ink/60 hover:text-ink">
                            Ver detalhes e rastreamento
                          </summary>
                          <div className="mt-3 pt-3 border-t border-ink/10">
                            <p className="text-xs text-ink/50">Status atual: {order.status}</p>
                            {order.trackingNumber && (
                              <div className="mt-2">
                                <strong>Rastreio:</strong> {order.trackingNumber}
                                {order.carrier && <span className="ml-2">({order.carrier})</span>}
                              </div>
                            )}
                            {order.estimatedDelivery && (
                              <p className="mt-1 text-xs text-ink/50">
                                Entrega estimada: {order.estimatedDelivery}
                              </p>
                            )}
                          </div>
                        </details>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </section>

        {/* LGPD e Segurança */}
        <section className="bento-card p-5 sm:col-span-full border-t border-ink/10 pt-8">
          <h2 className="inline-flex items-center gap-2 text-sm font-semibold text-ink/80">
            <ShieldCheck size={15} strokeWidth={1.75} aria-hidden="true" /> LGPD e Segurança
          </h2>
          <Card>
            <CardHeader>
              <CardTitle>Suas informações e direitos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-ink/80 mb-3">Privacidade de dados (LGPD)</h3>
                  <ul className="space-y-2 text-sm text-ink/60">
                    <li>
                      ✅ Seus dados pessoais são criptografados e armazenados com segurança
                    </li>
                    <li>
                      ✅ Você tem direito de acessar, corrigir e excluir seus dados a qualquer momento
                    </li>
                    <li>
                      ✅ Dados serão retidos pelo período máximo de 2 anos conforme política
                    </li>
                    <li>
                      ✅ Não compartilhamos seus dados com terceiros sem seu consentimento
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-ink/80 mb-3">Segurança da conta</h3>
                  <ul className="space-y-2 text-sm text-ink/60">
                    <li>
                      ✅ Autenticação em dois fatores (MFA) ativada nesta sessão
                    </li>
                    <li>
                      ✅ Histórico de logins com localização e dispositivo disponível
                    </li>
                    <li>
                      ✅ Alertas de atividade suspeita enviados por e-mail
                    </li>
                    <li>
                      ✅ Sessões ativas podem ser encerradas a qualquer momento
                    </li>
                  </ul>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-ink/10">
                <h4 className="text-sm font-medium text-ink/80 mb-3">Recomendações de segurança</h4>
                <ul className="space-y-2 text-sm text-ink/60">
                  <li>
                    ⚠️ Nunca compartilhe códigos de verificação com ninguém
                  </li>
                  <li>
                    ⚠️ Use autenticadores (Google Authenticator, Authy) em vez de SMS quando possível
                  </li>
                  <li>
                    ⚠️ Atualize seu e-mail e telefone de contato regularmente
                  </li>
                  <li>
                    ⚠️ Verifique o histórico de logins periodicamente
                  </li>
                  <li>
                    ⚠️ Utilize senhas únicas para cada serviço importante
                  </li>
                </ul>
                <p className="mt-3 text-xs text-ink/50">
                  Em caso de perda de dispositivo, entre em contato imediatamente através do e-mail
                  <a href="mailto:suportonexos@email.com" className="underline text-ink/60 hover:text-ink">
                    suportonexos@email.com
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Footer da conta */}
        <div className="flex flex-wrap items-center gap-4 border-t border-ink/12 pt-6">
          <LogoutButton />
          <Link href="/" className="text-sm underline underline-offset-4">
            Voltar ao site
          </Link>
        </div>
      </div>
    </main>
  );
}