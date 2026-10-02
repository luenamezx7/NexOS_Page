# Relatório de autenticação — 01/10/2026

## Atualização: OAuth e logout

A configuração de produção passou a usar `SOCIAL_AUTH_USE_SUPABASE=true` para
reaproveitar o callback externo existente `/auth/v1/callback`. O retorno interno
`/api/auth/supabase/callback` foi autorizado na allowlist do Supabase. Os providers
Google e GitHub estão habilitados. A sessão final e o MFA permanecem Better Auth.
O Google carregou a tela de autenticação usando o callback do Supabase, eliminando
o `redirect_uri_mismatch` encontrado no modo direto. O GitHub também carregou sua
tela de login. Consentimento de uma conta real continua sendo uma etapa humana.

Os botões sociais aparecem em login e cadastro com os ícones das marcas. Logout
da conta, painel e desafio MFA usa o endpoint nativo `/api/auth/sign-out`; os
endpoints antigos causavam a mensagem de falha ao sair.

Os testes locais atualizados passaram: integração 13/13 e navegador 21/21.
Os testes da ponte cobrem PKCE, estado criptografado, vínculo com cookie, uso único,
cancelamento, expiração, identidade não confirmada e MFA. O restante deste arquivo
é o registro da homologação anterior; o deployment atualizado é registrado ao fim.

## Publicação

- Projeto: `nex-os2/nexos`.
- Produção: https://nexoslab.online
- Deployment: `dpl_2jAFDiLBki4jFYyD3NMTETW2sxa4` — **Ready**.
- URL imutável: https://nexos-b84rcdxsp-nex-os2.vercel.app
- Build Next.js 16.3.5 e TypeScript concluídos na Vercel.
- Variáveis faltantes do Better Auth, Postgres, Google, GitHub, remetente e cron
  configuradas em Production e presença verificada sem descriptografar valores.
- Tabelas de Passkeys e outbox já estavam aplicadas no banco configurado.
- MCP Vercel retornou 403 para a equipe; a CLI autenticada permitiu configurar,
  publicar e verificar o projeto.

## Checklist

- [x] Auditoria do estado real e dependências.
- [x] Etapa 1: dependências e schema presentes; ambiente documentado.
- [x] Etapa 2: Better Auth Core e métodos validados em integração.
- [x] Etapa 3: Resend, templates e notificações validados.
- [x] Etapa 4: telas de acesso e segurança verificadas.
- [x] Etapa 5: Proxy, RSC, autorização, cookies e CSRF verificados.
- [x] Etapa 6: tipagem, lint, testes e build executados.
- [ ] Etapa 7: homologação integral — publicação concluída, pendências externas abaixo.

## Resultados executados

| Comando | Resultado |
|---|---|
| `npm run typecheck` | Passou |
| `npm run lint` | 0 erros; 35 avisos nos componentes existentes |
| `npm run test:security` | 14/14 |
| `npm run test:auth:password` | 6/6; compatibilidade bcrypt/scrypt |
| `npm run test:auth:integration` | 11/11, schema temporário removido ao final |
| `npm run test:email` | 7/7 templates aceitos pelo Resend |
| `npm run build` | Passou localmente e na Vercel |
| `npm run test:browser` | 20/20 |
| `npm run test:auth:production` | 7/7 no domínio real |
| `npm run test:auth:production:authenticated` | Passou no domínio real |

O teste autenticado provisiona uma fixture pelo SDK local com e-mail capturado e
CAPTCHA desabilitado **somente nessa instância de provisionamento**. As operações
de conta, senha, Passkey, TOTP e notificações são realizadas contra o deploy real.
Ele não comprova cadastro/login público com CAPTCHA nem entrega de confirmação.
Usa destinatário de teste oficial `delivered+<label>@resend.dev`; remove a conta e
suas dependências ao final. Não altera contas preexistentes.

## Validação individual

| Função | Evidência | Pendência para homologação completa |
|---|---|---|
| Cadastro e confirmação | Integração testa criação, bloqueio antes da confirmação e consumo do link | Cadastro público + confirmação em caixa real |
| E-mail/senha | Integração testa senha válida/inválida, cookies e logout | Login público com Turnstile real |
| Esqueci/redefinir senha | Integração testa envio, expiração, uso único e revogação de sessões; UI testa erro de token | Solicitar/abrir e-mail real em produção |
| Troca de senha | Tela e API do deploy real concluíram a alteração | Sem pendência funcional encontrada nesse teste |
| Google OAuth | JWT assinado e MFA testados em integração; início/cancelamento em produção passaram | Google real rejeita `redirect_uri_mismatch`; corrigir no painel e concluir consentimento |
| GitHub OAuth | Callback, MFA e cancelamento em integração; início/cancelamento em produção; tela externa de login carregou | Concluir consentimento e retorno com conta real |
| Magic Link | Token com hash, uso único e destino externo recusado em integração; template aceito pelo Resend | Solicitar/abrir link real em produção |
| Passkeys | Cerimônia WebAuthn completa no Chromium local e no deploy; cadastro, login, MFA e remoção | Validar também Touch ID/Face ID/Windows Hello em dispositivo físico |
| TOTP/2FA | Ativação, confirmação, desafio no login por Passkey, recuperação e desativação no deploy real | Sem pendência funcional encontrada nesse teste |
| Códigos de recuperação | Regeneração e login no deploy; uso único testado em integração | Sem pendência funcional encontrada nesse teste |
| Proteção de rotas | Redirecionamento com destino preservado, RSC autenticado e cookie forjado recusado | Sem pendência funcional encontrada nesse teste |
| Autorização administrativa | Usuário comum autenticado, inclusive após MFA, impedido de acessar `/dashboard` | Homologar painel com operador real |
| Cookies/CSRF | HttpOnly, Secure, SameSite=Lax em produção; origem ausente/externa recusada | Sem pendência funcional encontrada nesse teste |
| Boas-vindas/login/segurança | Outbox do deploy registrou status `sent` para a fixture; Resend aceitou templates | Confirmar entrega em caixa real |
| Notificações gerais | Template aceito pelo Resend; função extensível no servidor | Validar disparo pelo evento de negócio escolhido |
| Retentativas/cron | Outbox com leases/retentativas e cron configurados; rota sem autorização retorna 401 | Observar execução agendada e recuperação de uma falha real/simulada |

`sent` representa aceitação pelo Resend, não leitura nem entrega em uma caixa real.
A consulta de logs 5xx do deployment durante os testes não retornou ocorrências.

## Bloqueio confirmado do Google

No cliente OAuth Web correspondente às credenciais configuradas, adicione em
**Google Cloud → APIs e serviços → Credenciais → URIs de redirecionamento autorizados**:

```text
https://nexoslab.online/api/auth/callback/google
```

A URI antiga do Supabase não atende o Better Auth. Depois de salvar, conclua
login e consentimento pelo botão Google no domínio canônico e verifique o retorno.

Referências operacionais: `AUTH-DEPLOY.md` e `EMAIL-SETUP.md`.

## Deployment atualizado: correções solicitadas

- Deployment: `dpl_HnwobqL61LkJ2AMx76V5AaxeqdEC` — **Ready**.
- URL imutável: https://nexos-kn72mtj32-nex-os2.vercel.app
- Domínio ativo: https://nexoslab.online
- `npm run test:auth:production`: 7/7, incluindo OAuth intermediado e cancelamento.
- `npm run test:auth:production:ui`: passou pelos quatro botões (Google/GitHub × login/cadastro), verificou ícones, callback externo e telas dos provedores sem erro de redirect.
- `npm run test:auth:production:authenticated`: passou; a saída foi executada pelo botão real “Sair da conta”, com navegação para acesso e cookie anterior recusado pelo servidor após a revogação.
- A conta descartável do teste autenticado foi removida ao final.
- Tipagem, build e lint dos arquivos alterados passaram.
- Consulta dos logs 5xx deste deployment durante a validação não retornou ocorrências.

As telas Google/GitHub foram abertas sem fornecer credenciais de terceiros.
O consentimento e o retorno final com uma conta pessoal não foram automatizados.
Os testes de integração validam separadamente o retorno, a identidade, o vínculo
de conta e o desafio TOTP, com o intermediário simulado.

## Limpeza de contas solicitada

O usuário excluiu as contas no painel Supabase Authentication, que já estava com
zero usuários. A aplicação ainda possuía 15 usuários Better Auth e uma sessão.
A limpeza operacional removeu os 15 usuários, revogou a sessão e invalidou cinco
verificações pendentes. Credenciais, perfis, Passkeys, índice de e-mail e outbox
associados também ficaram com zero registros. Os cinco pedidos foram preservados;
quatro vínculos de dono foram removidos para impedir sua exclusão por cascade.

A contagem posterior foi confirmada pela conexão Postgres e, independentemente,
pela Management API do projeto Supabase: `auth.users`, `public."user"`,
`public.session` e `public.account` com zero registros. No domínio de produção,
`/api/auth/get-session` retornou `null`, as APIs privadas retornaram 401 e `/conta`
redirecionou para acesso. Nenhuma conta foi criada durante essa verificação.
