# Autenticação em produção

## Domínio e sessão

- Vercel: `nexoslab.online` serve Production; não configure redirecionamento do apex para `www`. O app já redireciona `www` para o apex preservando caminho e query.
- `SITE_URL` e `NEXT_PUBLIC_SITE_URL`: `https://nexoslab.online`.
- `SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_URL`: mesmo projeto; as chaves publishable e secret devem pertencer a ele.
- Identidade e sessão: Better Auth 1.7.7 + Postgres/Kysely; Next.js 16.3.5.
- `BETTER_AUTH_SECRET`: segredo estável de pelo menos 32 caracteres; `DATABASE_URL`: conexão Postgres do mesmo projeto.
- Administradores usam `role = 'admin'` em `public."user"` e precisam ativar TOTP. A allowlist `DASHBOARD_ADMIN_USER_IDS` é legada.
- A migração `supabase/migrations/20261001152936_auth_methods_and_email_outbox.sql` cria Passkeys e outbox e revoga sessões anteriores de contas com MFA. `npm run migrate:auth` verifica a presença das tabelas; `npm run migrate:auth -- --apply` aplica o SQL quando pendente.

## Exclusão de contas

A aplicação lê os usuários Better Auth em `public."user"`, com sessões em
`public.session`. Excluir em Supabase → Authentication remove `auth.users`, mas
não remove automaticamente os usuários Better Auth. Um redeploy não apaga os
registros do banco.

`node --use-system-ca scripts/reset-auth-users.mjs` mostra somente contagens.
Uma limpeza completa explicitamente solicitada exige `--apply --expected-users=N`:
o script confere a quantidade, preserva pedidos removendo o vínculo de dono,
remove usuários/sessões e invalida verificações pendentes em uma transação.
Ele não deve ser executado automaticamente em migrations ou no deploy.

## GitHub e Google

### Produção: OAuth intermediado pelo Supabase

Com `SOCIAL_AUTH_USE_SUPABASE=true`, os botões Google/GitHub do login e do
cadastro usam os providers já configurados no Supabase. O callback externo
cadastrado em Google/GitHub é:

```text
https://lgfttyeezviecfqbbmqk.supabase.co/auth/v1/callback
```

Em Supabase → Authentication → URL Configuration, autorize também o retorno
para a aplicação:

```text
https://nexoslab.online/api/auth/supabase/callback
```

O plugin `src/lib/auth/supabase-oauth.ts` mantém o verificador PKCE criptografado
no banco e vinculado a um cookie HttpOnly. No retorno, consome o estado uma vez,
troca o código e valida a identidade por `/auth/v1/user` no servidor. Cria/vincula
a conta usando as regras nativas do Better Auth; metadata do Supabase não concede
permissões. O token do intermediário é descartado e sua sessão é revogada.
As sessões da aplicação e o desafio TOTP continuam sendo do Better Auth.

`node --use-system-ca scripts/configure-social-oauth.mjs` verifica providers e
callback. Com `--apply`, acrescenta o callback à allowlist e ativa o modo no
projeto Vercel. Um novo deploy aplica a variável. Para localhost, autorize o mesmo
path na porta usada e configure a variável localmente.

### Modo direto (opcional, `SOCIAL_AUTH_USE_SUPABASE=false`)

Neste modo os callbacks são atendidos diretamente pelo Better Auth:

| Provedor | Produção | Desenvolvimento |
|---|---|---|
| Google | `https://nexoslab.online/api/auth/callback/google` | `http://localhost:3000/api/auth/callback/google` |
| GitHub | `https://nexoslab.online/api/auth/callback/github` | `http://localhost:3000/api/auth/callback/github` |

- Google Cloud → cliente OAuth Web: cadastre os redirect URIs acima e a origem do site. Confira a tela de consentimento e os usuários de teste quando estiver em Testing.
- GitHub Settings → Developer settings → OAuth Apps: configure o callback de produção; use um app separado para localhost quando necessário.
- Configure `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GITHUB_CLIENT_ID` e `GITHUB_CLIENT_SECRET` no servidor.
- Credenciais do antigo provider Supabase podem ser reutilizadas, mas seus callbacks precisam ser atualizados nos painéis dos provedores. O script `scripts/configure-production-auth.mjs` recupera Google via Management API quando autorizado e configura variáveis via Vercel CLI com `--apply`, sem imprimir segredos.
- Os botões sociais aparecem apenas quando o par de credenciais está presente. Cancelamento retorna à tela de acesso com mensagem de erro e destino preservado.

OAuth, Magic Link e Passkeys exigem TOTP quando a conta tem 2FA ativo. O plugin
de segurança apaga a sessão inicial e só libera uma nova após verificar o fator.
Testes com provedores simulados não comprovam consentimento real nos provedores.

## Passkeys, senhas e proteção de rotas

- RP ID e origem WebAuthn vêm de `SITE_URL`; produção exige HTTPS e domínio canônico.
- `/portal/seguranca`: troca/definição de senha, cadastro/remoção de Passkeys, QR Code TOTP e códigos de recuperação.
- `/portal/redefinir?token=...`: redefinição sem sessão; senha forte validada também no servidor e revogação de sessões anteriores.
- Next.js 16 usa **`src/proxy.ts`**, substituindo a convenção `middleware.ts`. O filtro inicial verifica presença do cookie; RSC e APIs validam a sessão persistida antes de entregar dados.
- Cookies de sessão: HttpOnly, SameSite=Lax e Secure em HTTPS. Mutação de APIs exige mesma origem; Better Auth mantém as proteções nativas de CSRF.
- As páginas de acesso redirecionam sessões válidas no servidor. Um cookie forjado não autoriza acesso.
- Resend e cron: ver `EMAIL-SETUP.md`.

## Turnstile e contato

- `NEXT_PUBLIC_TURNSTILE_SITE_KEY` e `TURNSTILE_SECRET_KEY`: mesmo widget Cloudflare, hostname permitido `nexoslab.online`.
- O frontend consulta a chave pública e a exigência no runtime em `/api/security/config`; o segredo nunca é retornado. Configuração ausente falha fechada com mensagem de indisponibilidade.
- A sessão e o anti-bot são controles distintos: contato e geração de cobrança ainda exigem captcha quando habilitado. Tokens são descartados após cada tentativa e renovados antes de reenviar.
- `NOTION_TOKEN` e `NOTION_DATABASE_ID`: integração com acesso ao database do contato.
- Asaas exige suas credenciais e `CHECKOUT_STATUS_SECRET`; preços e autorização continuam validados no servidor. Pix permanece indisponível enquanto a integração não for liberada.

## Verificação

`npm run typecheck`, `npm run lint`, `npm run test:security`, `npm run test:auth:password`, `npm run test:auth:integration`, `npm run test:email`, `npm run build`, `npm run test:browser`.

Após publicar: `npm run test:auth:production`. Para o fluxo autenticado no deploy,
`npm run test:auth:production:authenticated` provisiona uma conta descartável via
SDK local, testa as operações remotas e remove a conta ao final. Leia as limitações
e os resultados em `AUTH-VALIDATION.md`.

Os testes de integração Better Auth criam/removem um schema temporário e usam
Chromium com autenticador WebAuthn virtual para verificar a cerimônia completa.
O script legado `tests/live-auth.mjs` testa Supabase Auth e não homologa a arquitetura atual.

Após publicar: verificar o retorno de Google e GitHub no navegador, incluindo recusa de consentimento; abrir uma compra deslogado e confirmar que produto/quantidade retornam depois do login/MFA; testar captcha expirado e reenvio do contato. Testes automatizados com provedores simulados não substituem o consentimento real nos dois provedores.
