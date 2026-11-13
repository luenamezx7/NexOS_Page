# NexOS / ezway

Aplicação comercial com páginas de serviços, apresentação da placa NFC + QR Code,
quiz de captação, conta de cliente e diagnóstico administrativo.

## Stack e execução

Next.js 16.4.6 (App Router), React 19, TypeScript, Tailwind 4 e CSS Modules.
Better Auth mantém sessões no Postgres; Supabase atende dados administrativos.
Notion recebe os leads e Resend entrega e-mails transacionais.
O EasyChat é apresentado como produto em desenvolvimento.

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Preencha as variáveis necessárias em `.env.local`, sem versionar credenciais.
`SITE_URL` e `NEXT_PUBLIC_SITE_URL` devem apontar para a origem real.
Autenticação requer `DATABASE_URL`, `BETTER_AUTH_SECRET` e a configuração de e-mail.
Configure Supabase, Notion, Turnstile e providers sociais conforme os fluxos utilizados.
Consulte `AUTH-DEPLOY.md`, `AUTH-VALIDATION.md` e `EMAIL-SETUP.md`.

## Estrutura

- `src/app`: páginas, portal, painel e handlers HTTP.
- `src/components`: interface, cenas e animações.
- `src/lib/auth`: sessões, autorização, MFA e conexão Postgres.
- `src/lib/db`: acesso a dados restrito ao usuário autenticado.
- `src/lib/emails`: envio e retentativas de notificações.
- `supabase/migrations`: histórico SQL; não executar migrações automaticamente em produção.
- `tests`: testes unitários, integração e navegador.

O contato comercial usa `POST /api/contact` e o quiz envia leads ao Notion.
Não há checkout Asaas implementado nas rotas atuais.

## Verificação

```sh
npm run typecheck
npm run lint
npm run test:security
npm run test:auth:password
npm run test:unit
npm run build
npm run test:browser -- tests/browser/device-performance.spec.ts
```

Playwright inicia o build de produção na porta 3100. Testes de integração e os
scripts `test:auth:production*` acessam serviços reais e não fazem parte dos testes locais.

## Deploy e segurança

Requer runtime Node.js (Vercel ou servidor compatível); não é exportação estática
para GitHub Pages. Execute `npm run build` e `npm run start` para servir produção.
`vercel.json` agenda retentativas da outbox; configure `CRON_SECRET`.

A CSP usa um nonce diferente por resposta HTML, por isso documentos não são
compartilhados em cache. Fontes, imagens e vídeos públicos ignoram o proxy e
recebem cache longo: troque seus nomes quando o conteúdo mudar.
Sessões e dados privados permanecem sem cache compartilhado.

TLS do Postgres valida o certificado e o hostname com a CA oficial Supabase incluída.
Para outra CA privada, configure
`DATABASE_SSL_CA` com o certificado PEM fornecido pelo provedor. `DATABASE_SSL=false`
é reservado ao desenvolvimento local. Parâmetros SSL da URI não substituem essa política.

## Movimento e desempenho

Entradas usam Web Animations API com transform e opacidade, inclusive em telas
pequenas. Fundos CSS usam o compositor; efeitos fora da tela e abas ocultas pausam.
O hero usa fundo escuro sem o efeito de fibras. A preferência explícita
`prefers-reduced-motion` continua sendo respeitada nas animações restantes.

A rolagem usa Lenis em desktops compatíveis e rolagem suave nativa nos demais.
Resultados de emulação de CPU não substituem testes numa GPU integrada real.

## Refinamento NexOS LAB

A home segue o briefing em `design-/rebrand-nexos/PROMPT-DOC/prompt-codex-nexos-lab.md`.
Checklist, evidências, auditorias e pendências ficam em `docs/nexos-lab/`.
Resultados da retomada e comandos de prévia: [validação local](docs/nexos-lab/VALIDATION.md).
Cadastro público e OAuth foram desativados no código local; recuperação, sessão e MFA permanecem.
Não publicar antes de revisar o inventário de acesso, provisionamento e rotação de credencial
indicados em `docs/nexos-lab/ACCESS-MIGRATION.md` e `SECRET-ROTATION.md`.
A regra WAF está apenas proposta; não foi ativada em produção.
