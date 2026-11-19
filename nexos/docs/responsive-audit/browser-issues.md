# Complemento — avisos do Chrome

Em 18/11/2026, o Chrome sem extensões reproduziu `LazyLoadImageIssue` para `/images/crm/pipeline.png` na home local. A imagem já declarava 1200×750 no HTML. Foi acrescentado `aspect-ratio: 8 / 5` à classe `.screenshot` em `src/components/sections/Management.module.css`, mantendo a proporção original das três capturas de CRM.

Depois da alteração, a coleta pelo Chrome DevTools Protocol (`Audits.issueAdded`) não registrou issues nas larguras 320, 390, 768 e 1440px durante a rolagem da home. Também não houve eventos `securitypolicyviolation`. Dados: [browser-issues.json](browser-issues.json).

Um teste adicional atrasou apenas as respostas das imagens do CRM, mediu a caixa antes da carga e liberou a requisição real. Dimensões antes/depois idênticas em 320, 768 e 1440px; altura inicial diferente de zero. Nenhuma requisição de segurança ou autenticação foi simulada. Dados: [image-reservation.json](image-reservation.json).

Build e typecheck passaram. O build mantém o aviso existente sobre métricas de fallback de Google Sans.

O bloqueio de eval informado pelo usuário não foi reproduzido. A configuração existente permite unsafe-eval apenas em desenvolvimento, conforme a documentação instalada do Next.js; produção permanece sem essa permissão. Nenhuma alteração de CSP foi feita. A inspeção do código próprio não encontrou eval, new Function ou temporizadores com strings.

Não há `contentscript.js` nem uso de Fenced Frame no código próprio. O aviso sugere origem em extensão, mas o nome do arquivo isoladamente não confirma sua procedência. Foi solicitada a URL afetada e a origem completa indicada pelo DevTools. A coleta local não comprova o comportamento do site publicado ou de extensões do navegador do usuário.

## Verificação do domínio publicado

Após o usuário informar `nexoslab.online`, foi executada uma nova coleta em Chrome sem extensões contra `https://nexoslab.online`, sem falsificar clearance, alterar CSP ou desativar desafios.

- A raiz respondeu com 303 para `/verificar?next=%2F`. O desafio permaneceu pendente após 20 segundos; a home não foi acessada nesta coleta.
- O aviso `FencedFrame` foi reproduzido e sua origem foi identificada como `https://nexoslab.online/cdn-cgi/challenge-platform/scripts/jsd/main.js`. Portanto a hipótese anterior de extensão não explica sozinha os avisos: a Cloudflare também os gera em um navegador limpo. Não é código próprio da aplicação.
- Surgiram mensagens de CSP `connect-src` relativas a `data:,` dentro do iframe em `challenges.cloudflare.com`. A política citada nessas mensagens pertence ao iframe, com origens diferentes da CSP do documento principal; ampliar a CSP da aplicação não modifica essa política de terceiro.
- Não foi reproduzido o bloqueio específico de `eval`. Não houve exceções JavaScript nem eventos de violação de CSP no documento principal durante a coleta.
- O header de produção permanece com nonce, strict-dynamic e autorização do domínio de desafios, sem unsafe-eval. A configuração inclui as origens de script/iframe indicadas na [documentação do Turnstile](https://developers.cloudflare.com/turnstile/reference/content-security-policy/).
- A correção de proporção da imagem permanece no checkout local; esta investigação não publicou um deploy nem validou essa correção em produção.

Evidências: [coleta de produção](production-browser-issues.json) e [captura da verificação](production-security.png). Os avisos de API depreciada no script da Cloudflare dependem de atualização do fornecedor. O nome `contentscript.js` reportado pelo usuário continua sem atribuição individual confirmada.
