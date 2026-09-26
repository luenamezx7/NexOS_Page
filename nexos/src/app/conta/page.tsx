"use client";

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft, ShieldCheck, KeyRound, Mail, MapPin, Package } from 'lucide-react';
import { getUserAccess, type UserAccess } from '@/lib/auth/user';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent, Label } from '@/components/ui';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { LogoutButton } from '@/components/LogoutButton';
import { toast } from '@/components/ui/use-toast';

interface Address {
  id: string;
  type: 'home' | 'work' | 'other';
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  cep: string;
  country: string;
}

interface Order {
  id: string;
  code: string;
  status: 'delivered' | 'shipped' | 'processing' | 'cancelled';
  date: string;
  total: number;
  items: OrderItem[];
  tracking?: TrackingInfo;
}

interface OrderItem {
  id: string;
  name: string;
  type: 'physical' | 'digital' | 'service';
  price: number;
  quantity: number;
}

interface TrackingInfo {
  code: string;
  carrier: 'correios' | 'ups' | 'fd';
  status: string;
  estimatedDelivery: string;
}

const MOCK_ORDERS: Order[] = [
  {
    id: '#1010',
    code: 'NEOS-2024-1010',
    status: 'delivered',
    date: '22/11/2024',
    total: 299.90,
    items: [
      { id: '1', name: 'Fone de Ouvido Wireless', type: 'physical', price: 199.90, quantity: 1 },
      { id: '2', name: 'Assinatura Premium 1 mês', type: 'digital', price: 50.00, quantity: 1 },
      { id: '3', name: 'Consultoria 1h', type: 'service', price: 50.00, quantity: 1 },
    ],
    tracking: {
      code: 'EA123456789BR',
      carrier: 'correios',
      status: 'Entregue',
      estimatedDelivery: '22/11/2024',
    },
  },
  {
    id: '#1009',
    code: 'NEOS-2024-1009',
    status: 'shipped',
    date: '15/11/2024',
    total: 45.50,
    items: [
      { id: '1', name: 'Camiseta NexOS Limitada', type: 'physical', price: 39.90, quantity: 1 },
      { id: '2', name: 'E-book React Moderno', type: 'digital', price: 5.60, quantity: 1 },
    ],
    tracking: {
      code: 'EA987654321BR',
      carrier: 'correios',
      status: 'Em trânsito',
      estimatedDelivery: '29/11/2024',
    },
  },
  {
    id: '#1008',
    code: 'NEOS-2024-1008',
    status: 'processing',
    date: '05/11/2024',
    total: 120.00,
    items: [
      { id: '1', name: 'Curso NextJS Pro', type: 'service', price: 120.00, quantity: 1 },
    ],
  },
];

const MOCK_ADDRESSES: Address[] = [
  {
    id: 'addr-1',
    type: 'home',
    street: 'Rua das Flores',
    number: '123',
    complement: 'Apt 45',
    neighborhood: 'Centro',
    city: 'São Paulo',
    state: 'SP',
    cep: '01001-000',
    country: 'Brasil',
  },
  {
    id: 'addr-2',
    type: 'work',
    street: 'Av. Paulista',
    number: '1000',
    complement: ' salas 1001',
    neighborhood: 'Bela Vista',
    city: 'São Paulo',
    state: 'SP',
    cep: '01310-100',
    country: 'Brasil',
  },
];

export default function ContaPage() {
  const [userAccess, setUserAccess] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [addresses, setAddresses] = useState<Address[]>(MOCK_ADDRESSES);
  const [orders, setOrders] = useState<Order[]>(MOCK_ORDERS);
  const [mfaEnabled, setMfaEnabled] = useState(false);

  const [formData, setFormDataState] = useState({
    name: '',
    email: '',
    phone: '',
  });

  useEffect(() => {
    const loadUser = async () => {
      try {
        const access: UserAccess = await getUserAccess();
        setUserAccess(access);
        setProfile({
          name: 'João Silva',
          email: access.ok ? access.email || 'joao@exemplo.com' : '',
          phone: '(11) 98765-4321',
          mfaEnabled: false,
          createdAt: '01/01/2024',
        });
        setMfaEnabled(access.ok ? false : true);
      } catch (error) {
        console.error('Erro ao carregar acesso:', error);
      }
    };
    loadUser();
  }, []);

  const handleLogout = async () => {
    try {
      setProfile(null);
      setUserAccess(null);
      setMfaEnabled(false);
      setShowEditProfile(false);
      setShowAddAddress(false);
      redirect('/portal/acesso');
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível fazer logout. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  if (!userAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <ArrowLeft className="w-6 h-6 mx-auto mb-4 text-muted-foreground" />
          <p className="text-lg">Carregando dados da conta...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border/50 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
            <span className="font-medium">Minha Conta</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="flex items-center gap-2"
          >
            Sair
            <LogoutButton w-3 h-3 />
          </Button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-4">
        {/* Perfil Section */}
        <section className="mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Dados da Conta</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="block text-sm font-medium mb-1">Nome</Label>
                  <Input
                    value={profile?.name || ''}
                    disabled
                    placeholder="Seu nome"
                  />
                </div>
                <div>
                  <Label className="block text-sm font-medium mb-1">E-mail</Label>
                  <Input
                    value={profile?.email || ''}
                    disabled
                    placeholder="seu@email.com"
                  />
                </div>
                <div>
                  <Label className="block text-sm font-medium mb-1">Telefone</Label>
                  <Input
                    value={profile?.phone || ''}
                    disabled
                    placeholder="(11) 98765-4321"
                  />
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowEditProfile(true)}
                >
                  Editar Perfil
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowAddAddress(true)}
                >
                  Novo Endereço
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Security Section */}
        <section className="mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Segurança</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">MFA (Autenticação de Dois Fatores)</p>
                  <p className="text-sm text-muted-foreground">
                    {'{' + (mfaEnabled ? 'Ativo' : 'Inativo') + '}'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Último login: 25/11/2024 às 14:30
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Status da Conta</p>
                  <p className="text-sm text-muted-foreground">
                    Convidados ativos: 0
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-border/50">
                <h3 className="text-sm font-medium text-muted-foreground mb-3">
                  Recomendações de Segurança
                </h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>
                    Nunca compartilhe códigos de verificação com terceiros
                  </li>
                  <li>
                    Use um autenticador (Google Authenticator, Authy) em vez de SMS
                  </li>
                  <li>
                    Atualize seus contatos sempre que mudar de número ou e-mail
                  </li>
                  <li>
                    Use senhas únicas para cada serviço importante
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Addresses Section */}
        <section>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Endereços de Entrega</CardTitle>
            </CardHeader>
            <CardContent>
              {addresses.map((addr) => (
                <div key={addr.id} className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm font-medium">
                      {addr.type === 'home' ? 'Casa' : 'Trabalho'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {addr.street}, {addr.number} {addr.complement || ''}
                      {addr.neighborhood}, {addr.city} - {addr.state}
                      {addr.cep}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1"
                    >
                      Editar
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="flex-1"
                    >
                      Remover
                    </Button>
                  </div>
                </div>
              ))}

              <div className="mt-4 flex gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setShowAddAddress(true)}
                >
                  Adicionar Novo Endereço
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Orders Section */}
        <section>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Meus Pedidos</CardTitle>
            </CardHeader>
            <CardContent>
              {orders.map((order) => (
                <div key={order.id} className="border-b border-border/50 pb-4 mb-4 last:mb-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">
                        Pedido {order.code}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {order.date}
                      </p>
                    </div>
                    <span className="text-sm font-medium">
                      {order.status}
                      {order.status === 'delivered' && (
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                          <polyline points="22 4 12 14.01 9 11.01" />
                        </svg>
                      )}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm mt-2">
                    {order.items.map((item) => (
                      <div key={item.id}>
                        <span className="font-medium">{item.name}</span>
                        <span className="text-muted-foreground">
                          R$ {item.price.toFixed(2)} {item.quantity}x
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <div className="text-right">
                      <p className="font-medium">Total</p>
                      <p className="text-lg font-bold">R$ {order.total.toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {order.tracking && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-sm"
                        >
                          Rastrear
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-sm"
                      >
                        Ver Detalhes
                      </Button>
                    </div>
                  </div>
                </div>
              ))}

              {orders.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  Ainda não tem pedidos
                </p>
              )}
            </CardContent>
          </Card>
        </section>

        {/* LGPD Section */}
        <section className="mt-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>LGPD & Privacidade</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">
                    Seus Direitos
                  </h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>
                      Acesso: solicitar quais dados temos sobre você
                    </li>
                    <li>
                      Correção: solicitar alteração de dados incompletos ou inexatos
                    </li>
                    <li>
                      Anonimização: solicitar a anonimização de seus dados
                    </li>
                    <li>
                      Eliminação: solicitar a exclusão de dados desnecessários
                    </li>
                    <li>
                      Portabilidade: seus dados em formato legível para outro serviço
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">
                    Como Protegemos Seus Dados
                  </h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>
                      Criptografia: todos os dados sensíveis são criptografados
                    </li>
                    <li>
                      Acesso Restrito: apenas pessoal autorizado tem acesso
                    </li>
                    <li>
                      Logs de Acesso: histórico completo de quem acessou seus dados
                    </li>
                    <li>
                      Política de Retenção: dados são mantidos pelo tempo necessário
                    </li>
                  </ul>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-border/50">
                <h3 className="text-sm font-medium text-muted-foreground mb-3">
                  Alertas de Atividade Suspeita
                </h3>
                <p className="text-sm text-muted-foreground">
                  Detectamos atividade incomum na sua conta. Recomendamos:
                </p>
                <ul className="mt-2 text-sm text-muted-foreground space-y-1">
                  <li>Verificar dispositivos conectados</li>
                  <li>Alterar senha imediatamente</li>
                  <li>Verificar atividade de login recente</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}