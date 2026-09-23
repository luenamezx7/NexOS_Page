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
- Esses testes não constituem uma inspeção completa das policies/grants do banco. A nova migração MFA e `tests/database-security.sql` **ainda precisam ser executados no banco**: a CLI falhou na conexão à API de gerenciamento. Nenhuma migração remota foi aplicada nesta revisão.

## Configuração necessária antes da publicação

1. Copiar as variáveis de `.env.example` para o ambiente de deploy. A `.env.local` existente já continha uma chave secreta funcional e recebeu `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` e `SUPABASE_JWKS_URL`. Arquivos de segredo continuam ignorados pelo Git.
2. Definir `DASHBOARD_ADMIN_USER_IDS` com os UUIDs escolhidos em **Authentication > Users**. Não promover automaticamente a primeira conta, nem usar metadados editáveis pelo usuário.
3. Definir `SITE_URL` e `NEXT_PUBLIC_SITE_URL` com a origem HTTPS real. Em **Authentication > URL Configuration**, configurar Site URL e permitir exatamente `https://SEU-DOMINIO/auth/callback` (e a variante localhost apenas para desenvolvimento). O fluxo usa o link padrão `{{ .ConfirmationURL }}` com PKCE; confirmar no mesmo navegador que iniciou o cadastro. Não remover os parâmetros do link no template.
4. Configurar SMTP de produção e testar recebimento de confirmação. Os testes não enviaram e-mails nem validaram entrega/SMTP. Para recuperação de acesso ou perda de autenticador, o fluxo atual orienta contatar a equipe; não há recuperação automática de senha/MFA.
5. Em **Authentication**, manter confirmação de e-mail e TOTP habilitados; aplicar no projeto remoto senha mínima de 12 caracteres, proteção contra senhas vazadas quando disponível, rotação de refresh token e limites de autenticação. `supabase/config.toml` configura o ambiente local e não altera automaticamente o remoto.
6. Configurar as duas chaves Turnstile para o domínio. Produção falha fechada se faltar anti-bot. A suíte integrada desabilita Turnstile somente no processo local isolado de teste. Configurar proteção/rate limits também no Supabase Auth e no gateway: o endpoint Auth público pode ser chamado diretamente, sem passar pelos limites do Next.js. Se habilitar CAPTCHA também no Supabase Auth, integrar o token nesse provedor sem verificá-lo duas vezes (tokens Turnstile são de uso único).
7. Aplicar a migração MFA pelo processo de migrations do projeto ou SQL Editor, executar `tests/database-security.sql` (usa rollback) e rodar os Security Advisors. A chave `sb_secret_*` permite usar as APIs de serviço, mas não substitui credenciais de gerenciamento/SQL.
8. Garantir que o proxy de produção sobrescreva os headers de IP, em vez de confiar em valores enviados pelo visitante. Rate limiting de contato/checkout em memória é suplementar; usar WAF/rate limiting distribuído no gateway para esses endpoints públicos.

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

`test:auth:live` usa a configuração Supabase existente, cria duas contas temporárias, executa uma instância local na porta 3200 e remove seus dados no `finally`. Não envia e-mails nem cria cobranças. Exige um build atualizado. `test:browser` usa a porta 3100; os cenários de cadastro/MFA de interface usam respostas simuladas, complementados pelo teste integrado real.

Resultados desta revisão: build e TypeScript aprovados; 8 testes de segurança e 5 de navegador aprovados; integração Auth/MFA real aprovada; `npm audit` sem vulnerabilidades conhecidas. O lint não apresentou erros, mas há avisos preexistentes de componentes visuais.
