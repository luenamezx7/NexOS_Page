# SEO do NexOS — checklist por prioridade

## P1 — Conteúdo e rastreamento

- [x] Home com conteúdo comercial no HTML inicial, sem clique ou rolagem para desbloquear.
- [x] Abertura Waves na primeira visita da aba, com entrada direta, sem repetição na sessão e com replay pelo botão “Ver apresentação” no rodapé. Links diretos para seções e navegação sem JavaScript seguem para o conteúdo.
- [x] Seções de serviços, contato, FAQ e rodapé renderizadas no servidor.
- [x] Conteúdo legível mesmo com JavaScript desativado.
- [x] JavaScript e CSS de `/_next/` liberados no robots da aplicação.
- [x] Domínio centralizado em `src/lib/seo.ts`, com padrão `https://nexoslab.online`.
- [x] Canônica própria para cada página pública indexável.

## P2 — Relevância e apresentação

- [x] Título e descrição da home explicitam sites, landing pages, cardápios e placas NFC.
- [x] Imagem de compartilhamento PNG de 1200 × 630 em `/og`.
- [x] Dados estruturados Organization e WebSite com informações públicas da empresa.
- [x] Dados estruturados Service/BreadcrumbList nas páginas de serviços e Product na página da placa.
- [x] Conteúdo específico, perguntas frequentes e canais de contratação em quatro páginas:
  - `/criacao-de-sites`
  - `/landing-pages`
  - `/cardapio-digital`
  - `/placa-nfc`
- [x] Links internos na home e entre as soluções.
- [x] Sitemap inclui as páginas comerciais; não inventa datas de modificação a cada acesso.
- [x] Código de verificação de exemplo removido.
- [x] Verificação por metatag preparada com a variável opcional `GOOGLE_SITE_VERIFICATION`.

## P3 — Ações na conta Google

Essas ações dependem de acesso ao Search Console e, para verificação por DNS, ao painel do domínio.

1. Acesse https://search.google.com/search-console e selecione a propriedade existente.
2. Se não houver propriedade, adicione `nexoslab.online` como **Domínio** e publique o TXT que o Google fornecer no DNS. Essa opção cobre HTTP/HTTPS e subdomínios.
3. Alternativamente, crie uma propriedade **Prefixo do URL** para `https://nexoslab.online/`. Na opção “Tag HTML”, copie apenas o valor `content` para `GOOGLE_SITE_VERIFICATION` nas variáveis do projeto Vercel e faça um novo deploy. Não use o código do OAuth/Google Login.
4. Em **Sitemaps**, envie `https://nexoslab.online/sitemap.xml`.
5. Na **Inspeção de URL**, teste a home e as quatro páginas comerciais na versão publicada. Confira o HTML renderizado e solicite indexação.
6. Acompanhe os relatórios de páginas indexadas, consultas, impressões e cliques. A solicitação não garante indexação nem posição.

- [x] Confirmar a propriedade e a verificação no Search Console (conclusão informada pelo proprietário).
- [x] Enviar o sitemap na conta Google (conclusão informada pelo proprietário).
- [x] Inspecionar as URLs publicadas e solicitar indexação (conclusão informada pelo proprietário).
- [ ] Medir Core Web Vitals com dados de campo, quando houver tráfego suficiente.
- [x] Executar a rodada de otimização mobile orientada pelo diagnóstico de laboratório, reduzindo LCP e trabalho de JavaScript.
- [ ] Refinar o LCP até a meta de 2,5 s, guiado pelas próximas medições e pelos dados de campo.
- [ ] Publicar cases, fotos e resultados reais autorizados conforme estiverem disponíveis.

## Infraestrutura e manutenção

- O projeto Vercel é `nexos`, com root directory `nexos/`.
- O Cloudflare adiciona regras próprias ao robots. Confira também o arquivo servido pelo domínio depois de publicar; mudar o código não altera essas regras externas.
- O código já configura redirecionamento permanente do host `www`. Se o domínio continuar respondendo com 307, a configuração que antecede a aplicação precisa ser revisada no painel correspondente. Preserve o caminho e a query string.
- Não adicione palavras-chave ocultas, avaliações inventadas ou páginas repetidas para cidades.
- Novas alterações de preço devem continuar usando `src/config.ts` como fonte, inclusive nos dados estruturados da placa.

## Verificação técnica

```bash
npm run typecheck
npm run build
npx playwright test seo.spec.ts performance.spec.ts
```

Os testes verificam o HTML sem interação, a navegação sem JavaScript, as canônicas, o sitemap, o robots, o PNG social, os dados estruturados e a navegação mobile.

- [x] TypeScript e ESLint dos arquivos alterados aprovados.
- [x] Build de produção aprovado localmente e na Vercel.
- [x] Dezesseis testes de navegador aprovados em `tests/browser/seo.spec.ts` e `tests/browser/performance.spec.ts`.
- [x] Publicação de produção em `https://nexoslab.online`, deployment `dpl_BqVo3rZS2gVE1RQkZWgbNsYabuAH` em estado `READY`.
- [x] As dez URLs públicas do sitemap retornam HTTP 200 em produção, com canônicas próprias.
- [x] Robots sem bloqueio de `/_next/` e imagem `/og` PNG 1200 × 630 confirmados no domínio publicado.
- [x] Home e navegação para a página de sites verificadas em produção sem JavaScript, em viewport mobile.
- [x] Revisão visual em desktop/mobile e temas claro/escuro.

### Medição de laboratório em produção — 03/10/2026

Lighthouse 13.5.0, perfil mobile padrão, em `https://nexoslab.online/` após a primeira publicação das correções:

- SEO técnico: **100/100**.
- Acessibilidade: **94/100** antes dos ajustes pontuais de contraste e ARIA.
- Performance: **57/100**.
- FCP: **1,8 s**; LCP: **6,6 s**; TBT: **560 ms**; CLS: **0**.

São resultados de uma execução sintética, não dados de campo nem garantia de ranking. A carga de JavaScript e os efeitos visuais ainda merecem uma rodada específica de otimização. O relatório também apontou problemas em recursos externos do Cloudflare, que devem ser investigados no contexto da política CSP e do painel do serviço.

Após os ajustes finais, nova execução direcionada de Lighthouse em produção, às 21:56 UTC de 03/10/2026, confirmou **SEO 100/100 e acessibilidade 100/100**, sem auditorias reprovadas nessas duas categorias. A performance não foi medida novamente nessa execução.

### Rodada de desempenho — 04/10/2026 UTC

A etapa do Search Console foi registrada como concluída conforme informado pelo proprietário, sem presumir posições ou resultados de indexação.

Implementações:

- Texto principal da home e links de ação nativos, sem animação de JavaScript no primeiro conteúdo.
- Benefícios, estrutura do rodapé e perguntas frequentes simplificados; FAQ nativo funciona sem JavaScript, com todas as respostas no HTML.
- Estrelas estáticas no mobile e em movimento reduzido; efeitos GPU e dithering opcionais somente em desktop, depois do carregamento inicial.
- Biblioteca de desenho de fontes e fonte Lastoria carregadas perto do rodapé.
- Captcha carregado perto do formulário, mantendo o envio bloqueado enquanto a verificação é necessária.
- Apresentação de marca carregada sob demanda e consulta de sessão decorativa removida da home pública.
- Prioridade de fontes reservada às famílias usadas no conteúdo principal.
- SVG fornecido pelo proprietário preservado e registrado pela convenção `app/icon.svg`.
- Exceção `email_off` documentada pelo Cloudflare aplicada ao contato e às páginas legais, preservando os endereços e links `mailto:` sem mudar a CSP nem configurações globais do domínio.

Comparação das execuções Lighthouse 13.5.0, perfil mobile padrão, no mesmo domínio:

| Métrica | Diagnóstico às 00:22 UTC | Versão final às 01:06 UTC |
| --- | --- | --- |
| Performance | 49/100 | 76/100 |
| LCP | 6,8 s | 3,7 s |
| TBT | 1.000 ms | 390 ms |
| FCP | 1,8 s | 1,7 s |
| CLS | aproximadamente 0 | 0,001 |
| SEO | — | 100/100 |
| Acessibilidade | — | 100/100 |
| Boas práticas | — | 81/100 |

Execuções intermediárias variaram entre 67 e 77 pontos de performance; a tabela apresenta o diagnóstico inicial e a última versão publicada, sem tratar a melhor pontuação isolada como resultado final. O último relatório não registrou erros no console. As medições são sintéticas, não garantem ranking e não substituem dados de campo. O LCP ainda está acima da meta de 2,5 s.

Validação final: dez URLs públicas com HTTP 200 e canônicas próprias, sitemap com dez URLs, robots sem bloqueio dos recursos, PNG social e SVG de ícone válidos, e-mail íntegro após o processamento do Cloudflare, navegação/FAQ sem JavaScript e revisão mobile nos temas claro e escuro sem overflow ou erros de execução.

### Fechamento da tarefa retomada — 04/10/2026 UTC

O histórico local apontava a validação final como a etapa ainda em andamento. O fechamento foi concluído sobre a versão já publicada, sem nova alteração no código da aplicação.

- [x] Deployment `dpl_BqVo3rZS2gVE1RQkZWgbNsYabuAH` confirmado novamente como **Ready**, com alias `https://nexoslab.online`, pela Vercel CLI.
- [x] `npm run typecheck` e `npm run build` aprovados.
- [x] ESLint aprovado nos componentes de desempenho, layout, hook de efeitos e testes envolvidos na rodada.
- [x] `npx playwright test seo.spec.ts performance.spec.ts`: **16 testes aprovados**.
- [x] Dez páginas públicas revalidadas com HTTP 200, canônicas próprias e dados estruturados; sitemap, robots, PNG social, SVG de ícone e links de e-mail íntegros.
- [x] Home revisada em desktop (1366 × 768) e mobile (390 × 844), nos temas claro e escuro, sem overflow horizontal nem erros de execução; FAQ e navegação sem JavaScript revalidados em produção.

Lighthouse 13.5.0, perfil mobile padrão, execução isolada às **15:43 UTC**:

| Métrica | Resultado |
| --- | --- |
| Performance | 84/100 |
| LCP | 3,6 s |
| TBT | 220 ms |
| FCP | 1,7 s |
| CLS | 0,001 |
| Speed Index | 4,1 s |
| SEO | 100/100 |
| Acessibilidade | 100/100 |
| Boas práticas | 81/100 |

A primeira execução desta retomada, às 15:40 UTC, ocorreu em paralelo com o build local e registrou performance 70/100, LCP 3,8 s e TBT 570 ms. A repetição isolada acima reduz a interferência da disputa por CPU. As duas medições usam o mesmo deployment: a diferença demonstra variabilidade de laboratório, não uma nova melhoria de código nesta retomada.

O relatório isolado não registrou erros no console. As três advertências de APIs obsoletas apontam para o script externo do Cloudflare `/cdn-cgi/challenge-platform/scripts/jsd/main.js`. A meta de LCP de 2,5 s e a avaliação com dados de campo permanecem como próximos objetivos; a validação e o relatório desta rodada estão concluídos.

### Identidade na busca: nome antigo “Lovable App” — 04/10/2026

O proprietário informou que a busca ainda apresenta o nome antigo. Antes do ajuste, o código e o HTML público já não continham referências a Lovable, inclusive em requisições com user-agent do Googlebot. O resultado exibido na busca não foi confirmado automaticamente; a persistência do nome antigo é compatível com informações ainda não reprocessadas pelo buscador.

Foi reforçada a preferência de nome conforme a documentação de [nomes de sites do Google](https://developers.google.com/search/docs/appearance/site-names):

- Título da home: **NexOS | Criação de Sites, Landing Pages e Placas NFC**; títulos sociais usam a mesma identificação.
- Metadado `application-name`: **NexOS**, herdado pelas páginas públicas.
- `og:site_name` e `WebSite.name`: **NexOS**.
- O nó `WebSite` existente inclui `alternateName: ["nexoslab.online"]`, oferecendo o domínio como nome alternativo caso o Google não selecione a marca.
- Testes de SEO verificam a identidade publicada, a existência de um único nó `WebSite` na home e a ausência de Lovable no HTML público.

TypeScript, ESLint, build e os 16 testes de SEO/desempenho passaram. Deployment `dpl_AeikYrGm1dsQoZ9N1rSitWtWid3G` confirmado como **Ready** e associado a `https://nexoslab.online`. As dez páginas públicas servem os metadados NexOS; HTTP e `www` convergem para a home HTTPS canônica.

**Ação após esta publicação:** no Search Console, inspecionar `https://nexoslab.online/`, executar **Testar URL publicada** e **Solicitar indexação**. Essa nova solicitação corresponde aos metadados atualizados nesta publicação. O Google precisa rastrear e reprocessar a página para atualizar o nome; a documentação indica que isso pode levar de alguns dias a algumas semanas. Não há garantia de atualização imediata nem edição direta do nome exibido na busca pela aplicação.

### Descoberta pelas buscas de marca — 05/10/2026 UTC

O proprietário informou ausência nas buscas “nexos lab online” e “nexos lab performance”. A auditoria confirmou uma lacuna de identificação: antes desta rodada, o HTML não mencionava “NexOS Lab” ou “NexOS Performance” como nomes da marca.

Correções publicadas:

- Nome completo `NexOS Lab` e nome alternativo `NexOS Performance` centralizados em `src/config.ts`, preservando a marca curta `NexOS`.
- Home com título **NexOS Lab | Criação de Sites, Landing Pages e Placas NFC**, descrição de busca e texto principal identificando a marca.
- Rodapé apresenta os dois nomes em texto visível, disponível também sem JavaScript na home e nas páginas comerciais.
- `WebSite.name`, `og:site_name` e `application-name`: **NexOS Lab**. O nó `WebSite` relaciona `NexOS`, `NexOS Performance` e `nexoslab.online` como alternativas; o nó `Organization` relaciona os nomes da mesma empresa.
- Build, TypeScript, ESLint e 16 testes de navegador aprovados. Verificação em produção das dez páginas com HTTP 200, canônicas próprias e identidade atualizada; conteúdo legível sem JavaScript e sem overflow em 360, 390 e 1366 px.
- Deployment `dpl_336BxdCEwHk4Xd4SSBNBpgD3ZADM` confirmado como **Ready**, associado a `https://nexoslab.online`.

Diagnóstico de rastreamento e limites da auditoria:

- Robots servido pelo Cloudflare permite a busca e não bloqueia o Googlebot. Os bloqueios de `Google-Extended` e de crawlers de treinamento não equivalem a um bloqueio da busca Google.
- Home e sitemap acessíveis com HTTP 200; metadados `index, follow`, sem `X-Robots-Tag: noindex`. O HTML completo também foi servido em requisição com user-agent do Googlebot, o que não comprova o acesso de um Googlebot real/verificado.
- A consulta automatizada à pesquisa Google foi bloqueada por verificação de tráfego. Não foi possível confirmar o índice ou a posição do site por essa via.
- O `www` ainda retorna 307 antes de convergir para a URL HTTPS canônica. A consulta à configuração Vercel confirmou apenas o domínio principal no projeto, sem uma regra de redirecionamento `www` editável ali; a regra externa precisa ser revisada no painel que a fornece. Não foi presumido que isso explique a ausência na pesquisa.
- Nota SEO do Lighthouse e aprovação do sitemap não comprovam indexação nem posição para uma consulta.

**Próximo diagnóstico necessário:** no Search Console, usar **Inspeção de URL** para `https://nexoslab.online/` e conferir **Indexação de páginas**, a última data de rastreamento e a canônica selecionada pelo Google. Solicitar uma captura dessa tela ao proprietário. Se a URL não estiver no Google, registrar o motivo exato (não descoberta, descoberta sem indexação, rastreada sem indexação, duplicidade, erro ou bloqueio) antes de escolher a próxima correção. Se já estiver no Google, investigar associação de marca e consultas/impressões no relatório de desempenho. Testar a URL publicada e solicitar indexação após esta publicação; não repetir pedidos diariamente esperando acelerar o processamento.

### Buscas de marca e favicon da pesquisa — 05/10/2026

O proprietário informou que encontra o site pesquisando pelo domínio exato, mas não por “nexos”, “nexos lab” ou “nexos performance”, e pediu o mesmo ícone do navegador nos resultados.

Auditoria do deployment ativo `dpl_HtWsKvB8wnu3uSPiciBw8ZBT5rff`:

- Home HTTP 200, canônica no domínio oficial, `index, follow` e sem cabeçalho `noindex`.
- Os três nomes já estavam nos metadados e no nó `WebSite`. Não foi identificado bloqueio do Googlebot ou Googlebot-Image no robots publicado. Isso não comprova rastreamento real, indexação ou posição por consulta.
- Havia apenas um favicon SVG retangular, 307 × 257, com query gerada pelo Next.js. `/favicon.ico` retornava 404.
- A [documentação atual de favicons do Google](https://developers.google.com/search/docs/appearance/favicon-in-search) exige proporção quadrada, recomenda mais de 48 × 48 px e lista formatos raster como PNG e ICO; SVG não consta nessa lista. A URL deve ser estável e acessível aos crawlers.

Correções:

- SVG original preservado integralmente em `public/icon.svg`, mantendo a URL pública `/icon.svg`.
- `/favicon.png` gera no build um PNG 192 × 192 a partir desse SVG, sem recorte ou distorção. O desenho fica centralizado sobre fundo preto para preservar o contraste em resultados claros e escuros.
- Metadados globais anunciam explicitamente o PNG com URL fixa e dimensões, além do SVG para navegadores. `/favicon.ico` redireciona permanentemente para o PNG.
- `Organization.name`, autoria e publicação usam `NexOS Lab`, alinhados a `WebSite.name`; `NexOS` e `NexOS Performance` são nomes alternativos da mesma organização.
- A FAQ esclarece os três nomes em texto visível, aberto inicialmente e disponível sem JavaScript, incluindo o domínio oficial e os serviços oferecidos.

Validação local: TypeScript, ESLint dos arquivos envolvidos e build aprovados; **17 testes** de SEO/desempenho aprovados. O teste de favicon verifica os links no HTML, acesso como Googlebot-Image, PNG real quadrado, desenho contrastante não vazio, redirecionamento legado e preservação do SVG. O PNG gerado também foi revisado visualmente.

Publicação: deployment **`dpl_9TVbTJ3kXbg5q3SwXRPLcRtDPq7W`**, confirmado como **Ready**, com alias `https://nexoslab.online`. Dez páginas públicas verificadas com HTTP 200, canônicas próprias, nome e alternativas da organização e links explícitos para os dois formatos de ícone. `/favicon.png` retorna PNG 192 × 192, inclusive com user-agent Googlebot-Image, com cache público de um dia; `/favicon.ico` retorna 308 para o PNG. FAQ e associação de marca foram verificadas sem JavaScript; viewport de 360 px e navegação mobile claro/escuro em 390 px sem overflow.

Observação adicional da navegação em produção: algumas cargas diretas com JavaScript registraram o erro recuperável React #418 (hidratação); outras execuções com respostas interceptadas pelo navegador não o reproduziram. A página continuou funcional e o HTML público e favicon estavam íntegros. O domínio injeta scripts externos do Cloudflare, mas estes experimentos não comprovaram a causa nem uma regressão em relação ao deployment anterior. Investigar esse aviso separadamente; não considerar a ausência de erro numa repetição como resolução.

**Próximas ações na conta Google:** após publicar, inspecionar a home, testar a URL publicada e solicitar indexação uma vez para atualizar os sinais de marca e favicon. Registrar a última data de rastreamento e a canônica escolhida pelo Google. Em **Desempenho → Resultados da pesquisa**, filtrar consultas por `nexos` e comparar impressões e posição média nas próximas semanas. Se houver indexação mas pouca visibilidade, manter nome, site e link oficial consistentes no Instagram e em perfis públicos reais da empresa; buscar referências legítimas de clientes/parceiros. A consulta curta “nexos” pode competir com outras entidades; dados estruturados e favicon não garantem posição ou exibição imediata. O Google pode levar dias ou semanas para reprocessar a home e o ícone.

### Evidência dos prints e home antiga com www — 05/10/2026

Foram analisadas quatro capturas em `PRINTS-IA`: três de 05/10 e uma de 04/10. As capturas de 05/10 mostram:

- Na consulta `nexos lab online`, o domínio aparece como resultado orgânico, abaixo do resumo de IA. Portanto, nessas capturas a descoberta não se limita à consulta pelo domínio exato.
- O resultado da home exibe `https://www.nexoslab.online`, título do link **Lovable App**, descrição antiga iniciada por “Acelere seu negócio com NexOS” e o favicon antigo “OS”.
- Na consulta `nexoslab.online`, as quatro páginas comerciais sem `www` já aparecem com títulos e descrições NexOS. O processamento do buscador está mostrando versões de épocas distintas da home e das páginas comerciais.
- Na área visível da consulta `nexos lab`, aparecem outras empresas com nomes semelhantes. As capturas não permitem concluir ausência em toda a lista, posição estável ou desempenho para `nexos performance`, que não foi mostrado.

Reverificação atual do site, com user-agents de navegador e Googlebot:

- A home sem `www` retorna 200 e título **NexOS Lab | Criação de Sites, Landing Pages e Placas NFC**, sem qualquer ocorrência de Lovable no HTML.
- A versão HTTPS com `www` retorna **307** para a home sem `www`, que serve o título e ícones novos; não foi encontrada uma aplicação Lovable ainda ativa nessa cadeia.
- HTTP redireciona com 308 para HTTPS. O redirecionamento de `www` preserva caminho e parâmetros. A regra anterior à aplicação continua devolvendo um código temporário 307, apesar da regra permanente já existente no Next.js.

O título, descrição e ícone antigos nas capturas são compatíveis com uma representação ainda desatualizada no índice ou sinais antigos usados pelo Google; o conteúdo atual não os fornece. Confirmar no Search Console inspecionando **as duas URLs** (`https://nexoslab.online/` e `https://www.nexoslab.online/`): última data de rastreamento, canônica declarada e escolhida pelo Google e, se disponível, **Ver página rastreada → HTML**, pesquisando `Lovable`. Testar a URL publicada da home canônica e solicitar indexação se essa solicitação ainda não tiver sido feita após a publicação do favicon. Revisar a regra externa de `www` no painel responsável para redirecionamento permanente 301/308; não presumir que o 307 seja a causa única do título antigo ou da posição nas buscas. Não usar remoção de resultados ou `noindex` para tentar atualizar o título.

### Search Console: conflito de canônicas confirmado e www corrigido — 05/10/2026

O proprietário substituiu as capturas anteriores por oito prints do Search Console em `PRINTS-IA`, de 15:55 a 15:58. Eles confirmam:

| URL | Estado registrado no índice | Último rastreamento mostrado | Canônica |
| --- | --- | --- | --- |
| `https://www.nexoslab.online/` | Indexada | 09/09/2026, 19:25:39 | Nenhuma declarada; Google escolheu a própria URL com www |
| `https://nexoslab.online/` | Não indexada separadamente: “Cópia, o Google e o usuário selecionaram uma página canônica diferente” | 03/10/2026, 21:17:25 | Declarada sem www; Google escolheu a versão com www |

Ambas as inspeções registram rastreamento e indexação permitidos e busca de página com êxito. O teste em tempo real de `www` informa disponibilidade para o Google, o que não significa mudança da canônica escolhida no índice. A captura de 15:58:38 mostra **Indexação solicitada** para a home sem www; não é necessário repetir esse pedido agora. “Nenhum sitemap de referência foi detectado” aparece nesses registros de URL, mas não comprova que o sitemap atual não tenha sido enviado ou esteja inválido: a verificação pública confirmou HTTP 200 e dez URLs canônicas no sitemap.

O Google ainda está usando uma versão da home com www rastreada antes das correções recentes. Isso é consistente com o resultado “Lovable App” e favicon antigo observado anteriormente. O HTML da página rastreada de setembro não foi fornecido nos prints; não foi presumido que a captura de HTML do teste em tempo real fosse uma cópia desse registro antigo.

Investigação da infraestrutura:

- A resposta temporária 307 de www continha `x-vercel-id`; `server: cloudflare` sozinho não determinava a origem da regra.
- A API Vercel, acessada pela CLI autenticada na equipe `nex-os2`, confirmou que apenas o domínio sem www estava associado ao projeto `prj_HuEB41QNsOmunUVqGs09ximPX3PM`. A consulta de aliases para www não encontrou alias na equipe. A configuração de DNS indica nameservers Cloudflare e serviço externo, sem presumir necessidade de alteração de DNS.
- Foi adicionado **`www.nexoslab.online` ao mesmo projeto**, como domínio de redirecionamento para **`nexoslab.online`**, com **`redirectStatusCode: 308`**. A Vercel confirmou **`verified: true`**. Uma segunda leitura confirmou os dois domínios e a configuração permanente.

Validação pública após a alteração: www retorna **308 permanente** na home, na página de sites com query string e em `/favicon.png`, tanto com user-agent de navegador quanto Googlebot. Caminhos e parâmetros são preservados e os destinos retornam 200. A home canônica continua com o título NexOS Lab e sem Lovable. Não foi necessário alterar DNS, trocar a canônica da aplicação ou fazer novo deploy.

**Próximo acompanhamento:** manter a solicitação de indexação já enviada e observar no Search Console um rastreamento posterior às correções de 05/10, a escolha da home sem www como canônica e o reprocessamento do título e favicon. Pode-se executar **Testar URL publicada** em www para conferir a resposta atual, lembrando que o teste pode acompanhar o redirecionamento e exibir a disponibilidade do destino. Quando o índice se atualizar, www pode passar a “Página com redirecionamento”; isso é esperado, não um motivo para removê-lo manualmente ou usar noindex. Se a home sem www continuar excluída após novo rastreamento, comparar novamente as duas inspeções e os sinais de canônica. A correção consolida os endereços, mas não garante posição para buscas de marca ou atualização imediata da pesquisa.

### Abertura Waves solicitada pelo proprietário — 05/10/2026

- Nova tela anterior à home, com a frase exata **“Nexos, a performance que seu business merece.”**, em Satoshi Black 900 auto-hospedada, centralizada e responsiva.
- Fragment shader fornecido preservado em `src/lib/shaders/waves.ts`. Um único triângulo fullscreen em WebGL1 nativo, sem biblioteca de renderização, com todas as cores e uniforms empacotadas exatamente conforme a receita. Presença do cursor e coordenadas do ponteiro permanecem zero.
- DPR limitado a 2, fluxo limitado a 30 FPS sem mudar a velocidade temporal `seconds * -0.73`. RAF pausado com aba oculta; preferência de movimento reduzido renderiza um quadro estático. Recursos WebGL são liberados no fechamento, e perda/restauração de contexto é tratada.
- Fallback estático mantém a paleta se WebGL não estiver disponível. Um scrim independente do canvas garante a leitura da frase sem alterar o shader.
- Entrada por botão, Enter ou Escape. Dialog nativo na top layer, com título, foco contido, travamento e restauração da rolagem. Conclusão vai diretamente à home, sem etapa adicional de logo ou temporizador obrigatório.
- Uma abertura por sessão de aba (`nexos-boot-seen`); replay pelo rodapé. Links com hash seguem diretamente para a seção. Armazenamento indisponível não bloqueia a entrada.
- Conteúdo comercial completo permanece no HTML inicial, com um único h1 da home, títulos, canônicas, sitemap e favicon preservados. Sem JavaScript, o fallback `noscript` oculta a apresentação e a home continua acessível. Essa preservação técnica não constitui garantia de posição na busca.
- Os outros efeitos opcionais GPU e a animação das estrelas são pausados durante a apresentação, evitando múltiplos backgrounds ativos.

Validação local: build/TypeScript aprovados, ESLint sem erros nos arquivos envolvidos (Button mantém avisos preexistentes de props não utilizadas) e **24 testes de navegador aprovados** nas suítes Waves, SEO e desempenho. Verificados: uniforms reais e shader ligado em WebGL1, desenho, foco/teclado, memória de sessão, pausa/resumo, movimento reduzido e retorno, DPR em retina, fallback sem WebGL, perda/restauração de contexto, links diretos, SEO e navegação sem JavaScript. Revisão visual nos temas claro e escuro em 1366 × 768, 360 × 740 e 844 × 390, sem overflow ou cortes.

A primeira publicação (`dpl_CoVWZVjWteFr8iLTdeGtGkVA34Sr`) foi validada no domínio em desktop e mobile: shader animado, entrada, persistência de sessão e navegação sem JavaScript funcionais, sem erros de execução nas verificações. Uma medição Lighthouse mobile de 05/10 às 20:05 UTC apontou LCP 6,6 s e TBT 3.054 ms, indicando custo excessivo da compilação inicial no thread principal. Isso motivou a otimização a seguir, mantendo o fragment shader original.

Otimização final: WebGL1 é renderizado em **OffscreenCanvas em um Dedicated Worker** nos navegadores compatíveis. O renderer nativo compartilhado mantém a mesma receita e oferece compatibilidade no thread principal quando necessário. O worker é encerrado ao fechar a apresentação; visibilidade, tamanho/DPR e preferência de movimento são sincronizados pelo componente, sem React state por frame. A CSP permite somente workers da própria origem (`worker-src 'self'`). O script inicial com nonce evita flash da abertura em retornos da sessão e links diretos; o replay continua disponível. Build/TypeScript, lint e **25 testes de navegador**, incluindo o worker real e pausa/restauração, aprovados; **14 testes de segurança** aprovados.

Fechamento: ativação e remoção da abertura são agendadas após o primeiro frame, evitando forçar hidratação síncrona da home inteira no layout effect. A frase fica legível imediatamente, com revelação por deslocamento, enquanto o botão mantém a entrada suave. A versão final foi publicada no deployment **`dpl_31CvJ5xvtHYaQyMfFzSBevYh12C8`**, confirmado **Ready** e associado ao domínio. Worker animado, texto exato, fechamento com Escape, sessão sem reapresentação, desktop/mobile sem erros de execução e redirecionamento www 308 revalidados em produção.

Última medição Lighthouse 13.5.0, perfil mobile padrão, em produção:

| Métrica | Resultado |
| --- | --- |
| Performance | 65/100 |
| SEO | 100/100 |
| Acessibilidade | 100/100 |
| Boas práticas | 81/100 |
| FCP | 1,8 s |
| LCP | 3,9 s |
| TBT | 575 ms |
| CLS | 0,001 |

Sem erros de console nesse relatório. A otimização reduziu o bloqueio em relação à primeira implementação da abertura (3.054 ms), mas a performance mobile e a meta de LCP de 2,5 s ainda têm espaço de melhoria. As medições são sintéticas, sujeitas a variação, e não substituem dados de campo nem comprovam posição na busca. Relatório local: `C:\Users\User\AppData\Local\Temp\opencode\nexos-waves-final-lighthouse.json`.

### Refinamento da abertura: rosa, transição e estrelas ASCII — 05/10/2026

Solicitado pelo proprietário: substituir apenas a paleta azul pelos tons rosados da marca, suavizar a transição que apresentava cortes e adicionar as estrelas do ASCII Flow à apresentação.

- Paleta baixa → alta: **#180810, #D60070, #FF459F, #FFF3FA**, alinhando o rosa principal e o rosa de destaque do site. Fallback, scrim e cores de leitura usam a mesma família. Texto, fonte e parâmetros matemáticos do shader permanecem iguais.
- Estrelas brancas e glifos ASCII reaproveitam o componente `Slipstream`, em uma camada decorativa sobre as ondas e sob o scrim/texto. Brilho discreto, sem interação com o cursor, com movimento reduzido respeitado e pausa na saída. A atmosfera da home continua suspensa durante a abertura.
- Saída com crossfade de **700 ms**, backdrop transparente e conclusão pelo evento real de transição. O último quadro do shader é congelado após confirmação do renderer, mantendo canvas/worker alocados até a saída terminar; as estrelas também preservam o último quadro. Isso evita tela escura, descarte do drawing buffer e competição entre renderização e fade.
- O topo da home é preparado enquanto a abertura ainda está opaca, inclusive ao voltar da apresentação aberta no rodapé. Cada replay recebe uma instância própria e callbacks antigos não podem fechar uma nova apresentação.
- Build/TypeScript e lint aprovados. **27 testes** de Waves, SEO e desempenho aprovados, incluindo pixels brancos reais das estrelas, shaders/worker, fallback, pausa, movimento reduzido, crossfade intermediário e replay em 1366 e 390 px. Revisão visual desktop/mobile nos temas claro e escuro.

As medições Lighthouse anteriores acima correspondem à versão anterior à camada de estrelas e a este refinamento; não foram apresentadas como medições novas dessa alteração.

Publicação confirmada: **`dpl_5Q1Gs7AfaEdX8NLFrSwqpnGrkh3n`**, estado **Ready**, alias `https://nexoslab.online`. Em produção, paleta rosada, estrelas animadas/pixels brancos, pausa de ambos os canvases durante o crossfade, backdrop transparente e chegada ao topo da home foram verificados em 1366 e 390 px, sem erros de execução nas verificações. Nova medição Lighthouse mobile: **performance 67/100, acessibilidade 100/100, SEO 100/100 e boas práticas 81/100**. Relatório: `C:\Users\User\AppData\Local\Temp\opencode\nexos-waves-rose-stars-lighthouse.json`; resultados sintéticos, sujeitos a variação.
