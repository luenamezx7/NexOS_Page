# Integração Supabase e revisão de segurança — 23/09/2026

## Rotas

| Rota | Requisito |
| --- | --- |
| `/entrar` | Login/cadastro do cliente; confirmação de e-mail e configuração/desafio TOTP |
| `/conta` | Usuário não anônimo, e-mail confirmado e JWT verificado com `aal2` |
| `/login` | Login administrativo e MFA |
| `/dashboard` e APIs de diagnóstico | Requisitos de `/conta` + UUID em `DASHBOARD_ADMIN_USER_IDS` |
| `/auth/callback` | Troca do código PKCE; destino fixo `/entrar`, sem redirecionamento externo |

`@supabase/server@1.8.0` cria o cliente privilegiado do backend. `@supabase/ssr` mantém o ciclo de sessão/cookies do Next.js. Chaves secretas ficam em módulos `server-only`, nunca em `NEXT_PUBLIC_*`. A aplicação usa `getUser()` e `getClaims()` para autorização, sem confiar em `user_metadata` nem em cookies não verificados.

## Correções implementadas

- Exigência explícita de e-mail confirmado e MFA no servidor, tanto para clientes quanto administradores.
- Rate limiting persistente de autenticação por IP e por conta; verificação MFA também limitada pelo ID do usuário. Falhas no limitador negam a operação.
- Proteção de origem nas mutações de autenticação, contato e criação de cobrança; origem do backend pode ser configurada em runtime com `SITE_URL`.
- Leitura de JSON com limite durante o streaming, incluindo requisições sem `Content-Length`; respostas 400/413 sem detalhes internos.
- Limite de tamanho dos mapas locais de rate limiting para evitar crescimento ilimitado.
- Diagnósticos administrativos baseados nas consultas reais; uma chave Asaas presente não é apresentada como conectividade validada. Identidade e horário da consulta vindos do servidor.
- Mensagens Notion divididas em blocos de até 2.000 caracteres para respeitar o limite do provedor.
- Blur decorativo removido das telas de autenticação/conta/admin para não esconder mensagens de segurança.
- Configuração local Supabase com confirmação de e-mail, senha mínima de 12 caracteres e TOTP habilitados.
- Migração `supabase/migrations/20260923153317_require_order_mfa.sql`: policy restritiva exige `aal2` para leitura de pedidos, além da policy de propriedade existente.

## Estado verificado no projeto remoto

Projeto: `lgfttyeezviecfqbbmqk`.

- Auth respondeu HTTP 200; autenticação por e-mail e cadastro estão habilitados, confirmação de e-mail obrigatória (`mailer_autoconfirm=false`).
- Backend conseguiu consultar `orders`, `idempotency_keys` e `auth_rate_limits`; as mesmas consultas anônimas foram negadas.
- Teste integrado real confirmou rejeição de e-mail não confirmado, cadastro/desafio TOTP, bloqueio AAL1, liberação AAL2, allowlist administrativa, rejeição de `user_metadata.role=admin`, cookie forjado e logout. As duas contas temporárias foram removidas após revogar suas sessões.
- **Migração `20260923154533_require_order_mfa` aplicada via Management API**: policy restritiva exige `aal2` para leitura de pedidos via Data API direta.
- **Teste SQL `tests/database-security.sql` executado com sucesso**: RLS, grants, deduplicação, rollback, status monotônico e reembolsos — PASS.
- **Auth hardening aplicado via Management API**: confirmação de e-mail obrigatória, senha mínima 12 caracteres, rotação de refresh token, reautenticação para troca de senha, TOTP habilitado, usuários anônimos desabilitados, `uri_allow_list` inclui callback local.
- **Advisors atuais**: 4 INFO (RLS sem policy em tabelas de serviço — esperado, são `service_role` only) e 1 WARN (proteção de senha vazada requer plano Pro).

## Configuração necessária antes da publicação

1. **Copiar variáveis de `.env.example` para o ambiente de deploy** — `.env.local` já tem a chave secreta funcional, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` e `SUPABASE_JWKS_URL`. Segredos continuam ignorados pelo Git.
2. **Definir `DASHBOARD_ADMIN_USER_IDS`** — UUIDs de **Authentication > Users**. Não promover a primeira conta automaticamente nem usar metadados editáveis.
3. **Definir `SITE_URL` e `NEXT_PUBLIC_SITE_URL`** com a origem HTTPS real. Em **Authentication > URL Configuration**, permitir exatamente `https://SEU-DOMINIO/auth/callback` (e localhost apenas para dev). O fluxo usa `{{ .ConfirmationURL }}` PKCE; confirmar no mesmo navegador.
4. **Configurar SMTP de produção** — testar recebimento de confirmação. Sem SMTP, e-mails não saem. Para recuperação de acesso/perda de autenticador, o fluxo orienta contatar a equipe; não há recuperação automática.
5. **Configurar Turnstile** — duas chaves para o domínio. Produção falha fechada sem anti-bot. Testes desabilitam Turnstile apenas no processo isolado. Configurar rate limits também no Supabase Auth e no gateway (endpoint Auth público ignora limites do Next.js).
6. **Aplicar em produção o hardening já feito no remoto** (já aplicado via script): confirmação de e-mail, senha ≥12, rotação de refresh token, reautenticação para troca de senha, TOTP, anônimos desabilitados, `uri_allow_list` com callback.
7. **Garantir proxy de produção sobrescreva headers de IP** — rate limiting em memória é suplementar; usar WAF/rate limiting no gateway para endpoints públicos.
8. **Monitorar Advisors** — 4 INFO esperados (tabelas `service_role` sem policy) e 1 WARN (HIBP requer Pro). Aplicar HIBP quando plano permitir.

O painel de conta ainda não lista pedidos nem associa compras de convidados automaticamente. Autorização e recuperação de contas exigem validação de identidade pela equipe. Tokens de acesso já emitidos podem sobreviver à revogação até sua expiração; para operações futuras de alto risco, adotar verificação de sessão revogada e validade curta de JWT.

## Verificação

```sh
npm run typecheck
npm run lint
npm run test:security
npm run build
npx playwright install chromium
npm run test:browser
npm run test:auth:live
npm audit
```

Remoto (via `scripts/supabase-admin.mjs`):

```sh
# Histórico e migrações
SUPABASE_PROJECT_REF=lgfttyeezviecfqbbmqk node --use-system-ca scripts/supabase-admin.mjs history

# Testes de banco (usa rollback)
SUPABASE_PROJECT_REF=lgfttyeezviecfqbbmqk node --use-system-ca scripts/supabase-admin.mjs query tests/database-security.sql

# Hardening Auth
SUPABASE_PROJECT_REF=lgfttyeezviecfqbbmqk node --use-system-ca scripts/supabase-admin.mjs auth-harden
SUPABASE_PROJECT_REF=lgfttyeezviecfqbbmqk node --use-system-ca scripts/supabase-admin.mjs auth-hibp  # quando plano permitir

# Advisors
SUPABASE_PROJECT_REF=lgfttyeezviecfqbbmqk node --use-system-ca scripts/supabase-admin.mjs advisors
```

`test:auth:live` usa a configuração Supabase existente, cria duas contas temporárias, executa instância local na porta 3200 e remove seus dados no `finally`. Não envia e-mails nem cria cobranças. Exige build atualizado. `test:browser` usa porta 3100; cenários de cadastro/MFA usam respostas simuladas, complementados pelo teste integrado real.

Resultados desta revisão: build e TypeScript aprovados; 8 testes de segurança e 5 de navegador aprovados; integração Auth/MFA real aprovada; migração MFA aplicada; teste SQL PASS; auth hardening aplicado; `npm audit` sem vulnerabilidades conhecidas. Lint sem erros (avisos preexistentes em componentes visuais).
