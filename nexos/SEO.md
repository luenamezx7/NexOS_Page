# SEO do NexOS — checklist por prioridade

## P1 — Conteúdo e rastreamento

- [x] Home com conteúdo comercial no HTML inicial, sem clique ou rolagem para desbloquear.
- [x] Apresentação visual opcional, acessível pelo botão “Ver apresentação” no rodapé.
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
