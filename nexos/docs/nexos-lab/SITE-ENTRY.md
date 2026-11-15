# Verificação Turnstile antes das páginas

Pedido de 14/11/2026: todos os visitantes devem passar pela verificação antes de
receber o conteúdo do site. A proteção é executada no servidor da aplicação.

## Fluxo

1. Sem liberação válida, qualquer rota de página redireciona com HTTP 303 para
   `/verificar?next=...`, antes do layout, da sessão otimista e da renderização.
   Cabeçalhos de RSC, prefetch ou Accept não alteram essa decisão.
2. `/verificar` entrega somente um documento independente com o widget real da
   Cloudflare. Não inclui React, scripts Next.js, home, vídeos ou fontes da aplicação.
3. A Cloudflare emite um token; o navegador envia o token a `/api/security/entry`.
   O servidor valida mesma origem, tamanho, desafio assinado, limite de tentativas,
   Siteverify, hostname, ação `site-entry` e `cdata` do desafio daquele navegador.
4. Somente após sucesso é emitido o cookie de liberação assinado, com HttpOnly,
   Secure em HTTPS, SameSite=Lax e caminho `/`. Em HTTPS usa prefixo `__Host-`,
   sem Domain. A validade é de 30 minutos; o desafio inicial dura cinco minutos.
5. O visitante retorna ao caminho e query originais. Cookies forjados, expirados,
   de outra finalidade ou de outro user-agent não liberam páginas.

Falhas de configuração, banco/limite de tentativas ou Siteverify mantêm o bloqueio.
Não há liberação por localStorage, parâmetro de URL, user-agent de crawler ou sessão
de login existente. APIs, assets e endpoints técnicos continuam com suas proteções
próprias; eles não entregam a home. Crawlers de busca também encontram a verificação.

O widget está configurado com `appearance: always`. A Cloudflare pode verificar um
visitante automaticamente ou exigir interação, conforme o tipo do widget e sua
avaliação. Isso não representa uma garantia de que nenhum bot consiga aprovação.

## Configuração e operação

- `SITE_ENTRY_ENFORCED=true`: ativação explícita. Sem valor, produção aplica a
  proteção por padrão, respeitando a configuração de Turnstile do ambiente.
- `SITE_ENTRY_SECRET`: chave opcional de 32+ caracteres para a assinatura. Sem
  valor, usa `BETTER_AUTH_SECRET` com identificação exclusiva da finalidade.
- Site key e secret do Turnstile existentes permanecem nos locais atuais.
- `SITE_ENTRY_ENFORCED=false` é reservado para testes/prévias locais ou reversão
  administrativa explícita. Não usar para contornar falhas do serviço em produção.

O cookie é da aplicação (`__Host-ezway-clearance`), não `cf_clearance`. WAF e
proteção da origem Cloudflare continuam sendo uma etapa de infraestrutura
independente em `CLOUDFLARE.md`; esta entrega não altera regras da zona.

## Validação

- `npm run test:entry`: 7/7 cenários de segurança do servidor passaram.
- `PLAYWRIGHT_CHANNEL=chrome npm run test:entry:browser`: 4/4 passaram.
- `PLAYWRIGHT_BROWSERS_PATH=/tmp/nexos-playwright npm run test:entry:browser -- --browser=webkit`:
  4/4 passaram. Inclui documento sem home/mídia, destino preservado, liberação válida,
  cookie falso, recusa do servidor, HTTP e RSC. Cloudflare é simulada apenas nos
  testes; a versão de produção usa exclusivamente o serviço real.
- Build e tipos passaram; lint mantém 30 avisos preexistentes e zero erros.

## Produção confirmada

Publicado em 14/11/2026 no projeto `nex-os2/nexos`, com
`SITE_ENTRY_ENFORCED=true` explícito. Deployment `dpl_3TE57YakHUsTfPoosv4f8NtebkgY`,
estado `READY`, versão `https://nexos-mvassnxum-nex-os2.vercel.app`, domínio
`https://nexoslab.online`.

Após publicar, a requisição limpa ao domínio retornou HTTP 303 com
`Location: /verificar?next=%2F`. A tela isolada retornou HTTP 200 com CSP nonce,
cookie de desafio Secure/HttpOnly e cache privado sem armazenamento. Os sete
testes HTTP de produção e o teste de interface passaram. O teste de interface
bloqueia o script externo para verificar o bloqueio sem resolver um CAPTCHA real.
O teste HTTP adicional usou um desafio assinado legítimo com token falso e recebeu
403 sem liberação, exercitando também o limite de tentativas e o serviço real.
Nenhuma verificação humana real foi automatizada; os cenários completos com
aprovação/rejeição foram validados com respostas simuladas nos testes locais.

Referência: [validação obrigatória no servidor](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/)
e [configuração do widget](https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/widget-configurations/).
