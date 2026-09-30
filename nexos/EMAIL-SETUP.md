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
   - **SPF / MX**: copie exatamente o nome, tipo, prioridade e valor mostrados no Resend
   - **DKIM**: copie exatamente o tipo e o valor mostrados no Resend
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
Confira no projeto e no ambiente correto; a presença neste documento não comprova a configuração:
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

### Camada de autenticação (Supabase Auth)

Magic link, OTP, confirmação e recuperação **não** são enviados pela aplicação.
São gerados pelo Supabase Auth e entregues pelo SMTP: chame `resetPasswordForEmail`
ou `signInWithOtp` e personalize o texto em **Authentication → Email Templates**.

O template de recuperação precisa entregar o token na **query**. Com
`{{ .ConfirmationURL }}` o GoTrue sobrescreve a query e devolve a sessão no fragmento
— que o servidor não lê — e o link abre "inválido ou expirado". Use a receita:

    {{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=recovery&next=/portal/redefinir

Veja `AUTH-DEPLOY.md` e `supabase/templates/recovery.html`.

### Camada da aplicação (Resend)

`src/lib/emails/actions.ts` usa `server-only`: não exponha destinatários arbitrários
por Server Actions ou rotas públicas.

```typescript
import { sendWelcomeEmail } from '@/lib/emails/actions';

// Único e-mail da aplicação: boas-vindas após a confirmação.
// O disparo fica em src/lib/emails/welcome.ts (sendWelcomeIfNeeded).
await sendWelcomeEmail('usuario@email.com', 'João', 'user');
```

### Boas-vindas automáticas

O callback de autenticação e o acesso autenticado chamam `sendWelcomeIfNeeded`.
O destinatário vem da conta confirmada no Supabase. O envio usa uma chave de
idempotência por usuário e registra sucesso em `app_metadata.welcome_email_sent_at`.
Uma falha não impede o login; o próximo acesso tenta novamente. Não há fila de
retentativas em segundo plano. A idempotência do Resend dura 24 horas; se o envio
for aceito mas o registro falhar, uma tentativa após essa janela pode duplicá-lo.

---

## 5. Templates Disponíveis

| Template | Arquivo | Uso |
|----------|---------|-----|
| `WelcomeEmail` | `src/emails/welcome.tsx` | Pós-cadastro |

Os e-mails de autenticação não têm template na aplicação: são gerados pelo Supabase
Auth e personalizados no painel (ver seção 4).

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
# Carrega .env.local automaticamente; destino padrão é delivered@resend.dev.
npm run test:email

# Inspeciona SMTP/CAPTCHA e os templates (requer SUPABASE_ACCESS_TOKEN local).
node --use-system-ca scripts/configure-auth-email.mjs

# Adiciona {{ .Token }} a confirmação/login preservando o HTML existente.
node --use-system-ca scripts/configure-auth-email.mjs --apply
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
| Magic link expira rápido | Ajuste a expiração do OTP no Supabase Auth; o texto do template não altera a validade |
| Domínio não verifica | Aguarde propagação DNS (até 48h), confira registros no Resend |
| Rate limit (429) | Confira limites da aplicação, do Supabase Auth e da conta Resend |
| `no captcha_token found` | Passe `options.captchaToken` ao Supabase em login, signup, resend, OTP e recuperação |
| CAPTCHA inválido após validação local | Token é de uso único: nesses fluxos, só o Supabase chama Siteverify |
| E-mail só contém link | Inclua `{{ .Token }}` nos templates de confirmação e magic link para permitir código |
| Código de 8 dígitos rejeitado | A tela e a API aceitam OTP de e-mail de 6 a 8 dígitos; TOTP continua com 6 |

### CAPTCHA e notificações de segurança

Em Supabase Auth > Bot and Abuse Protection, habilite Turnstile com o secret do
mesmo widget usado pelo site. Configure `NEXT_PUBLIC_TURNSTILE_SITE_KEY`,
`TURNSTILE_SECRET_KEY` e `TURNSTILE_ENFORCED=true` no servidor. A validação de
login/cadastro/reenvio/OTP/recuperação pertence ao Supabase; contato, checkout e
troca de senha autenticada continuam validando no servidor da aplicação.

Em Auth > Email Templates, habilite as notificações de senha/e-mail/telefone
alterados, identidade vinculada/removida e fator MFA adicionado/removido. Elas
usam o mesmo SMTP. O segundo fator implementado é TOTP de aplicativo autenticador,
não um código enviado por e-mail. O OTP por e-mail é uma forma de login.

**Verificação em 28/09/2026:** SMTP `smtp.resend.com:587`, remetente
`noreply@nexoslab.online`, CAPTCHA Turnstile ativo, OTP com 8 dígitos e todas as
sete notificações de segurança habilitadas. Os templates de confirmação e login
foram atualizados via Management API para incluir `{{ .Token }}` e relidos para
confirmar a alteração. Isso verifica configuração, não entrega na caixa de entrada.

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
4. **Retentativas duráveis**: Para garantias além da próxima autenticação, adicione uma fila transacional e monitore falhas de boas-vindas.
