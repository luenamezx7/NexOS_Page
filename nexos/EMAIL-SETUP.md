# E-mails transacionais — Better Auth + Resend

## Arquitetura atual

A autenticação usa **Better Auth 1.7.7**, com sessões no Postgres do Supabase.
Os e-mails são enviados diretamente pelo **Resend SDK**. A configuração SMTP e
os templates do antigo Supabase Auth não controlam esses fluxos.

| Fluxo | Implementação | Validade / entrega |
|---|---|---|
| Confirmação de cadastro | `src/lib/auth/mailer.ts` | Link de 1 hora |
| Redefinição de senha | `src/lib/auth/mailer.ts` | Link de 1 hora, uso único |
| Magic Link | `src/lib/auth/mailer.ts` | Link de 10 minutos, uso único |
| Boas-vindas | `src/lib/emails/welcome.ts` | Após confirmação, idempotente por usuário |
| Novo login | `src/lib/auth/security-plugin.ts` | Após autenticação completa, incluindo MFA |
| Senha, Passkeys e 2FA | `src/lib/auth/security-plugin.ts` | Alertas de segurança |
| Notificações gerais | `src/lib/emails/notifications.ts` | Tipo `notice`, chamado somente no servidor |

`src/emails/transactional.tsx` fornece o template React Email. Todos os envios
incluem texto simples. `@react-email/render` é dependência direta: o Resend faz
importação dinâmica desse pacote quando recebe a propriedade `react`.

## Configuração

Configure no servidor e no ambiente Production da Vercel:

```dotenv
RESEND_API_KEY=
RESEND_FROM_EMAIL=NexOS <noreply@nexoslab.online>
SITE_URL=https://nexoslab.online
NEXT_PUBLIC_SITE_URL=https://nexoslab.online
CRON_SECRET=
```

Use uma API key com permissão de envio e um domínio verificado em
https://resend.com/domains. Copie os registros DNS exibidos pelo Resend; eles
dependem do domínio. Nenhuma dessas chaves privadas deve usar `NEXT_PUBLIC_`.

## Falhas e retentativas

- Links de autenticação são enviados imediatamente. Uma falha de envio gera
  erro de indisponibilidade; o usuário pode solicitar um novo link.
- Notificações usam `public.auth_email_outbox`, protegida por RLS e sem acesso
  pelos papéis `anon` e `authenticated`.
- A chave de evento impede duplicação normal. O envio usa idempotência do Resend,
  lease de 2 minutos e retentativa após 5 minutos.
- O próximo login retenta eventos pendentes. O cron em `vercel.json` executa
  `/api/internal/email-outbox` diariamente às 08:00 UTC. A rota exige
  `Authorization: Bearer <CRON_SECRET>`.
- A idempotência do Resend tem janela de 24 horas. Uma falha de gravação após um
  envio aceito, seguida de retentativa fora dessa janela, pode duplicar o envio.

Para uma notificação geral, derive o usuário de uma sessão/autorização validada:

```ts
import { enqueueNotification } from '@/lib/emails/notifications';

await enqueueNotification(userId, `order/${orderId}/updated`, {
  kind: 'notice',
  detail: 'Seu pedido foi atualizado. Acesse sua conta para acompanhar.',
});
```

Não exponha uma rota pública que aceite destinatários ou conteúdo arbitrário.
Não inclua senhas, tokens ou segredos TOTP nos payloads persistidos.

## 2FA

O segundo fator usa códigos **TOTP gerados pelo aplicativo autenticador**, não
enviados por e-mail. Os e-mails informam alterações/verificações de segurança.
Os códigos de recuperação são exibidos ao usuário e armazenados criptografados;
cada um pode ser usado uma única vez.

## Testes

```bash
npm run test:email
npm run test:auth:integration
```

O primeiro envia sete mensagens sem tokens válidos para `delivered@resend.dev`.
Isso verifica renderização e aceitação pelo provedor. Não comprova entrega em
uma caixa de entrada real. O segundo usa um schema temporário e captura os
e-mails de autenticação para testar os tokens e os fluxos.

Para homologação completa, confira os eventos no painel do Resend e conclua
cadastro, Magic Link e redefinição com uma caixa de entrada controlada.
