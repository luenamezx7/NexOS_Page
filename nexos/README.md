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

## Cursor, Orca e publicação

Os dois editores usam a mesma pasta `nexos` do checkout principal e o mesmo
local em **http://localhost:3000**. No computador atual, a pasta compartilhada é
`/Users/henriqueemanuel/Desktop/projetos/PROJETO - TTR/NexOS/NexOS/nexos`.
No Orca, selecione o workspace **NexOS · compartilhado Cursor + Orca**.
As worktrees antigas ficam preservadas como histórico; não edite nelas o site principal.

`npm run dev` encontra o checkout principal, independentemente da branch ativa,
e usa suas dependências, seus arquivos
de ambiente e sua cache de desenvolvimento. A porta é explícita: se já estiver
ocupada, use o servidor existente ou pare-o antes de reiniciar; não abra outro na 3001.
As URLs de autenticação locais usam `http://localhost:3000`.
Refatorações usam uma branch de trabalho nesse checkout compartilhado; produção
continua acompanhando a `main`. O plano e o progresso do design estão em
[documento mestre](docs/design/PLANO-MESTRE-REFATORACAO-DESIGN.md).

Produção usa o projeto Vercel **nex-os2/nexos**, raiz **nexos/**, conectado ao
GitHub **luenamezx7/NexOS_Page**, branch de produção **main**.
Salve as alterações em commit e envie a `main` ao GitHub para disparar o deploy.
Não publique arquivos sem commit por CLI: isso cria uma versão que o Git não reproduz.
O domínio **https://nexoslab.online** e o alias **https://nexos-nex-os2.vercel.app**
devem apontar para o mesmo deploy READY. URLs de deploys antigos são imutáveis.
Alterações locais aparecem nos dois editores imediatamente; produção acompanha
o último commit publicado com sucesso, não cada arquivo ainda em edição.

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

## Portal e e-mails

O portal do cliente usa o fundo Silk em WebGL1 e superfícies claras esverdeadas.
O login tem somente o painel centralizado, com a identidade da marca dentro dele.
A redefinição de senha compartilha esse visual em todos os estados do fluxo.
A alternativa por e-mail envia um código de seis dígitos, válido por dez minutos
com até cinco tentativas; a verificação ocorre no servidor e mantém MFA quando
configurado. Links mágicos antigos não autenticam na configuração normal.
O envio usa o Resend já configurado, sem um serviço adicional ou migração de banco.

Todos os templates de e-mail compartilham `src/emails/layout.tsx`, inclusive
boas-vindas e notificações. O banner futuro será configurado em `EMAIL_BRAND.banner`
nesse arquivo, com URL pública, texto alternativo e dimensões. Enquanto `null`,
nenhuma imagem ou espaço reservado é renderizado. E-mails customizados internos
recebem apenas o conteúdo do corpo e são envolvidos pelo mesmo layout.

Validação local dos templates, sem envio: `node --import tsx --test tests/email-templates.test.mjs`.
O teste `tests/portal-authenticated-ui.test.mjs` aceita apenas URL local, usa uma
conta descartável, captura os e-mails em memória e remove a fixture ao terminar.

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

As páginas exigem verificação Turnstile antes de entregar o conteúdo. A tela
`/verificar` é independente da home; somente Siteverify válido emite a liberação
assinada por 30 minutos. Configuração e testes: [entrada protegida](docs/nexos-lab/SITE-ENTRY.md).

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
O hero usa vídeo com poster e controles manuais, sem o efeito de fibras.
A política atual respeita `prefers-reduced-motion`: revela conteúdo sem animação,
pausa reprodução automática e simplifica as jornadas fixadas. O diagnóstico registra a preferência efetiva.
Consulte `docs/motion-diagnostics.md` para os detalhes e a validação dessa política.

A rolagem usa Lenis em desktops compatíveis e rolagem suave nativa nos demais.
Resultados de emulação de CPU não substituem testes numa GPU integrada real.

## Refinamento NexOS LAB

A home segue o briefing em `design-/rebrand-nexos/PROMPT-DOC/prompt-codex-nexos-lab.md`.
Checklist, evidências, auditorias e pendências ficam em `docs/nexos-lab/`.
Resultados da retomada e comandos de prévia: [validação local](docs/nexos-lab/VALIDATION.md).
Estado atual e pendências: [retomada de 14/11](docs/nexos-lab/RETOMADA-2026-11-14.md).
Cadastro público e OAuth foram desativados no código local; recuperação, sessão e MFA permanecem.
Não publicar antes de revisar o inventário de acesso, provisionamento e rotação de credencial
indicados em `docs/nexos-lab/ACCESS-MIGRATION.md` e `SECRET-ROTATION.md`.
A regra WAF está apenas proposta; não foi ativada em produção.
