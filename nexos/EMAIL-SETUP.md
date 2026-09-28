# Configuração Completa de Emails — NexOS

## Visão Geral

Este projeto usa **duas camadas de email**:

| Camada | Provedor | Uso |
|--------|----------|-----|
| **Auth (Supabase)** | Resend via SMTP | Magic link, reset senha, confirmação email, OTP |
| **App (Custom)** | Resend SDK | Boas-vindas, notificações, emails transacionais customizados |

---

## 1. Configuração no Resend (Obrigatório)

### 1.1 Verificar Domínio
1. Acesse [resend.com/domains](https://resend.com/domains)
2. Clique em **Add Domain**
3. Digite `nexoslab.online` (ou seu domínio)
4. Configure os registros DNS no seu provedor:
   - **SPF** (TXT): `v=spf1 include:_spf.resend.com ~all`
   - **DKIM** (CNAME): Copie os valores do Resend
   - **DMARC** (TXT): `v=DMARC1; p=none; rua=mailto:dmarc@nexoslab.online`
5. Aguarde verificação (pode levar até 48h)

### 1.2 Criar API Key
1. Acesse [resend.com/api-keys](https://resend.com/api-keys)
2. Clique em **Create API Key**
3. Nome: `NexOS Production`
4. Permissão: **Sending access**
5. Copie a key (começa com `re_`)

---

## 2. Variáveis de Ambiente

### Vercel (Produção/Preview/Development)
Já configuradas via API:
- `RESEND_API_KEY` = `re_************` (encrypted)
- `RESEND_FROM_EMAIL` = `NexOS <noreply@nexoslab.online>` (plain)

### Local (.env.local)
```env
RESEND_API_KEY=re_************
RESEND_FROM_EMAIL=NexOS <noreply@nexoslab.online>
NEXT_PUBLIC_SITE_URL=https://nexoslab.online
SITE_URL=https://nexoslab.online
```

---

## 3. Configurar SMTP no Supabase Auth (CRÍTICO)

> **Sem isso, os emails de auth (magic link, reset senha) NÃO funcionam**

### No Supabase Dashboard:
1. Acesse seu projeto → **Authentication** → **Settings**
2. Role até **SMTP Settings**
3. Ative **Custom SMTP**
4. Preencha:

| Campo | Valor |
|-------|-------|
| **Host** | `smtp.resend.com` |
| **Port** | `587` |
| **Security** | `STARTTLS` (TLS) |
| **Username** | `resend` |
| **Password** | `re_************` (sua API key do Resend) |
| **Sender email** | `noreply@nexoslab.online` |
| **Sender name** | `NexOS` |

5. Clique em **Save**
6. Teste com **Send test email**

### Templates do Supabase (Opcional)
Em **Authentication** → **Email Templates**, personalize:
- **Confirm signup** → Use template customizado
- **Reset password** → Use template customizado
- **Magic link** → Use template customizado
- **Invite user** → Use template customizado

---

## 4. Como Usar nos Código

### Server Actions (Recomendado)

```typescript
// src/lib/emails/actions.ts
import { 
  sendWelcomeEmail,
  sendMagicLinkEmail,
  sendResetPasswordEmail,
  sendVerifyEmail,
  sendNotificationEmail 
} from '@/lib/emails/actions';

// Boas-vindas após cadastro confirmado
await sendWelcomeEmail('usuario@email.com', 'João', 'user');

// Magic link customizado (se não usar Supabase Auth padrão)
await sendMagicLinkEmail(
  'usuario@email.com', 
  'João', 
  'https://nexoslab.online/auth/callback?token=...',
  15
);

// Reset senha customizado
await sendResetPasswordEmail(
  'usuario@email.com',
  'João',
  'https://nexoslab.online/portal/redefinir?token=...',
  30
);

// Notificação genérica
await sendNotificationEmail(
  'usuario@email.com',
  'João',
  'Novo recurso disponível!',
  'Acabamos de lançar o novo dashboard...',
  'https://nexoslab.online/dashboard',
  'Ver Novidades'
);
```

### API Routes

```typescript
// src/app/api/emails/send/route.ts
import { sendWelcomeEmail } from '@/lib/emails/actions';

export async function POST(req: Request) {
  const { email, name } = await req.json();
  const result = await sendWelcomeEmail(email, name);
  return Response.json(result);
}
```

---

## 5. Templates Disponíveis

| Template | Arquivo | Uso |
|----------|---------|-----|
| `WelcomeEmail` | `src/emails/welcome.tsx` | Pós-cadastro |
| `MagicLinkEmail` | `src/emails/magic-link.tsx` | Login sem senha / OTP |
| `ResetPasswordEmail` | `src/emails/reset-password.tsx` | Recuperação de senha |
| `VerifyEmail` | `src/emails/verify-email.tsx` | Confirmação de email |
| `NotificationEmail` | `src/emails/notification.tsx` | Notificações gerais |

### Personalizar Templates
Edite os arquivos em `src/emails/` — usam **React Email** com componentes `@react-email/components`.

Exemplo de cores da marca:
```tsx
// Gradiente principal
background: 'linear-gradient(135deg, #00d4aa 0%, #0066ff 100%)'

// Botão warning (reset senha)
background: 'linear-gradient(135deg, #ff6b4a 0%, #ff3366 100%)'
```

---

## 6. Testes

### Testar Local
```bash
# Terminal 1: Next.js dev
npm run dev

# Terminal 2: Testar email via script
node -e "
const { resend } = require('./src/lib/emails/resend');
const { WelcomeEmail } = require('./src/emails/welcome');

resend.emails.send({
  from: 'NexOS <noreply@nexoslab.online>',
  to: ['seu@email.com'],
  subject: 'Teste NexOS',
  react: WelcomeEmail({ name: 'Teste', dashboardUrl: 'https://nexoslab.online/conta' })
}).then(console.log).catch(console.error);
"
```

### Emails de Teste Resend
Use estes endereços para testar sem afetar reputação:
- `delivered@resend.dev` → Entregue
- `bounced@resend.dev` → Bounce
- `complained@resend.dev` → Spam complaint
- `suppressed@resend.dev` → Suprimido

---

## 7. Troubleshooting

| Problema | Solução |
|----------|---------|
| Email não chega | Verifique spam, confirme domínio no Resend, teste com `delivered@resend.dev` |
| "Origem inválida" no auth | Confira `SITE_URL` e `NEXT_PUBLIC_SITE_URL` no Vercel |
| Magic link expira rápido | Ajuste `expiresInMinutes` no template |
| Domínio não verifica | Aguarde propagação DNS (até 48h), confira registros no Resend |
| Rate limit (429) | Padrão: 10 req/s. Peça aumento no suporte Resend |

---

## 8. Checklist de Produção

- [ ] Domínio verificado no Resend (`nexoslab.online`)
- [ ] `RESEND_API_KEY` no Vercel (encrypted)
- [ ] `RESEND_FROM_EMAIL` no Vercel (plain)
- [ ] SMTP configurado no Supabase Auth
- [ ] Templates de email do Supabase personalizados (opcional)
- [ ] Teste de magic link funcionando
- [ ] Teste de reset senha funcionando
- [ ] Teste de email de boas-vindas funcionando
- [ ] DNS: SPF, DKIM, DMARC configurados
- [ ] Monitoramento: Logs do Resend + Vercel

---

## 9. Próximos Passos Sugeridos

1. **Webhooks Resend**: Configure em `resend.com/webhooks` para track delivery/bounce/complaint
2. **Suppression List**: Monitore `resend.com/suppressions` para emails bloqueados
3. **Analytics**: Use `tags` nos emails para categorizar no dashboard Resend
4. **Idempotency**: Adicione `idempotencyKey` em emails críticos (ex: `welcome-user/{userId}`)