# NexOS — diagnóstico e checklists de performance

Data: 18/10/2026.

## Resumo

O principal problema encontrado na navegação pública é o trabalho de composição gráfica: várias camadas de `backdrop-filter` recebem fundos que mudam continuamente. Havia também trabalho efetivo de shaders fora da área útil e recompilações ao revisitar seções.

Foi aplicada uma primeira rodada de otimizações preservando a paleta, as fontes, o glassmorphism, os raios de desfoque, as camadas do gradiente e os limites de FPS dos efeitos visíveis. Os checklists abaixo distinguem o que já foi corrigido do que ainda precisa de implementação ou medição.

## Escopo e método

- Revisão da arquitetura em `src`, providers globais, componentes da landing, fundos Canvas/WebGL, animações, navegação, carregamento de fontes/imagens, configuração Next.js e política de cache do proxy.
- Build de produção local, iniciado com `next start`, sem o custo do servidor de desenvolvimento.
- Chromium 145, desktop 1366 × 768/DPR 1 e emulação mobile 390 × 844/DPR 3.
- Amostragem de `requestAnimationFrame`, tarefas longas, métricas CDP, chamadas de desenho, compilação de shaders e recursos de rede; teste A/B temporário de desfoques apenas dentro do navegador de diagnóstico.
- Comparação visual automatizada da composição de blur otimizada com a composição original.

**Limite da medição:** o navegador desta máquina usa SwiftShader, uma GPU por software. Intervalos de frames são indicadores de laboratório, não uma promessa de FPS em celulares ou GPUs físicas. A auditoria não mede latência real do banco, pagamentos, sessões autenticadas nem Core Web Vitals de visitantes em produção.

## Evidências e resultados da primeira rodada

As janelas paradas duraram aproximadamente 2,5 segundos. O ensaio de rolagem executou a mesma sequência de 24 movimentos para baixo e para cima; sua duração real varia conforme o navegador processa os frames.

| Observação | Antes | Depois | Interpretação |
| --- | ---: | ---: | --- |
| Camadas de backdrop que intersectam o viewport na abertura clara | 23 | 3 | A apresentação não monta mais os blurs de página e de seção que estavam por baixo dela. A contagem não desconta oclusão pelo dialog. |
| Topography da primeira seção desenhando atrás da abertura | 15 chamadas | 0 | O shader da seção não é mais inicializado durante a apresentação. |
| Topography abaixo do hero, ainda fora do viewport | 16 chamadas | 0 | Pré-carregamento próximo da tela não significa mais animação fora da tela. |
| Hero ASCII na seção “O estúdio”, visível apenas na faixa coberta pelo header | 85 chamadas | 0 | O efeito pausa quando sai da área útil abaixo da navegação fixa. |
| Compilações de shader do Topography na ida e volta da rolagem | 2 | 0 | O canvas é retido e pausado, em vez de destruído e reconstruído. |
| Soma das áreas dos backdrops no hero, em múltiplos do viewport | 2,35 | 1,39 | Cerca de 41% menos área geométrica nas superfícies de filtro; não é uma medida direta de uso de GPU. |
| Mediana do intervalo de frame na abertura clara | 149,9 ms | 33,3 ms | Melhoria no ambiente de laboratório. |
| Mediana do intervalo de frame no estúdio escuro, parado | 83,4 ms | 16,7 ms | O ASCII oculto atrás do header deixou de disputar processamento. |

O teste A/B sem backdrops ajudou a localizar o custo: na rolagem do estúdio claro, a mediana foi de 66,8 ms para 16,7 ms ao desativar temporariamente os filtros. **Essa desativação não foi aplicada ao site.** A solução implementada conserva o vidro e reduz as regiões transparentes processadas pelas camadas.

Não houve melhora uniforme em todos os números. O hero continua sendo a cena mais cara nesse renderizador por software; alguns cenários tiveram mais callbacks/tarefas porque passaram a produzir mais frames. Por isso, a conclusão se apoia também nos desenhos ocultos eliminados, na reutilização de canvases e na redução de área de filtros, e não apenas em contagens de tarefas longas.

### Carga e arquitetura ainda relevantes

- A amostra inicial registrou oito arquivos de fonte, aproximadamente 155 kB de corpo transferido.
- O grupo de recursos iniciado como `script` registrou cerca de 811 kB descomprimidos/253 kB comprimidos antes da rodada. Isso não é o total completo do JavaScript, pois também há preloads classificados como `link`.
- Dois CSS globais de aproximadamente 120 kB e 77 kB descomprimidos aparecem entre os maiores recursos.
- Ao chegar ao rodapé, a assinatura pode solicitar a fonte OTF de 177.816 bytes e um chunk de aproximadamente 235 kB associado ao parser de fontes. Esse custo está adiado, mas ainda existe.
- `src/app/layout.tsx` lê `headers()` para o nonce; o build confirma páginas públicas dinâmicas. O proxy também define `private, no-store` para as respostas que intercepta.
- A foto original `public/placas/codex-1.png` tem aproximadamente 1,58 MB, mas usa `next/image` com formatos modernos. O tamanho do original, sozinho, não prova que esse volume é enviado ao visitante.

## Checklist A — aplicado nesta rodada

### Composição visual

- [x] Recortar a região totalmente transparente de cada camada do `GradualBlur`.
- [x] Recalcular as posições da máscara para conservar o mesmo gradiente e os mesmos raios de desfoque.
- [x] Manter as sete camadas dos blurs de página e as seis camadas dos blurs de seção/hero.
- [x] Não instalar listeners de scroll e observers de tamanho para o cálculo de `autoHide` quando essa opção está desativada.
- [x] Separar o observer de ocultação no footer do cálculo de scroll.

Arquivos: `src/components/ui/GradualBlur.tsx`, `src/components/sections/LandingPageBlur.tsx`, `src/components/Hero.tsx`.

### Ciclo de vida dos efeitos

- [x] Compartilhar a detecção da apresentação em `usePresentationActive`.
- [x] Adiar os fundos de seção e os blurs da home enquanto a apresentação está aberta.
- [x] Não criar shaders metálicos de CTAs atrás da apresentação.
- [x] Pré-carregar o Topography ao se aproximar da seção, mas animar apenas quando ela está visível.
- [x] Reutilizar o canvas do Topography após a primeira aproximação e pausá-lo fora da tela.
- [x] Pausar o ASCII quando só resta a faixa encoberta pelo header fixo.
- [x] Reutilizar superfícies metálicas já inicializadas ao rolar, pausando-as em vez de recompilar na volta.
- [x] Evitar redesenho de superfícies metálicas quando a velocidade solicitada não mudou.
- [x] Não montar as estrelas do tema escuro nas páginas internas claras.
- [x] Ler o estado de animação das estrelas uma vez por desenho, em vez de várias vezes por estrela.
- [x] Reutilizar sprites de estrelas quando uma mutação da classe do `html` não altera as cores reais do tema.

Arquivos: `src/components/sections/SectionBackground.tsx`, `src/components/ui/GradientASCII.tsx`, `src/components/ui/metallic-button.tsx`, `src/components/ui/background-ascii-flow.tsx`, `src/components/SiteAtmosphere.tsx`, `src/lib/use-presentation-active.ts`.

### Navegação

- [x] Centralizar a rolagem programática em `useSectionScroll`.
- [x] Usar o Lenis existente no header, indicador de seções e ações do ecossistema.
- [x] Habilitar o tratamento de âncoras pelo Lenis para links comuns da landing.
- [x] Respeitar `scroll-margin-top` nos controles programáticos.
- [x] Corrigir suavemente a posição final se animações de entrada ou métricas de fontes deslocarem o destino durante a viagem.
- [x] Manter rolagem nativa em mobile e com movimento reduzido.

Arquivos: `src/components/SmoothScrollProvider.tsx`, `src/components/Header.tsx`, `src/components/SectionIndicator.tsx`, `src/components/Testimonials.tsx`.

### Rodapé

- [x] Exibir apenas `CNPJ 69.194.842/0001-28` no bloco cadastral.
- [x] Remover endereço, cidade/UF e CEP desse bloco.
- [x] Manter marca, links, redes sociais e navegação, conforme a preferência confirmada.

Arquivo: `src/components/Footer.tsx`.

## Checklist B — prioridade alta para a próxima rodada

### B1. Medir em hardware real

- [ ] Gravar o Chrome Performance em desktop com GPU física e em Android intermediário/entrada.
- [ ] Repetir em Safari/iPhone, especialmente o custo de backdrops e das máscaras SVG da abertura.
- [ ] Medir separadamente abertura, hero, estúdio, navegação longa, troca de tema e abertura/fechamento do preview.
- [ ] Registrar LCP, INP e CLS de visitantes reais com o mecanismo de métricas adotado pelo projeto.
- [ ] Comparar o mesmo aparelho, viewport, rede, versão de build e trajeto antes/depois.

Critérios de referência: LCP p75 até 2,5 s; INP p75 até 200 ms; CLS p75 até 0,1. Para scroll em tela de 60 Hz, usar 16,7 ms como orçamento do frame, distinguindo o compositor dos efeitos decorativos limitados a 24/30 FPS.

### B2. Renderizar somente os pixels necessários

- [ ] Investigar recorte/scissor do WebGL em seções muito altas, mantendo as coordenadas originais do efeito e margem suficiente para os blurs.
- [ ] Avaliar composição compartilhada de glass em regiões sobre o mesmo fundo, com comparação visual antes de substituir filtros independentes.
- [ ] Medir se filtros de vidro completamente encobertos por modais precisam continuar ativos.
- [ ] Criar orçamento de contextos WebGL simultâneos antes de aumentar a quantidade de CTAs animados.
- [ ] Avaliar um agendador compartilhado para os desenhos de fundo, preservando sua frequência e movimento atuais.

Não reduzir resolução, densidade, camadas visíveis ou intensidade dos efeitos como solução automática: primeiro eliminar trabalho repetido ou invisível.

## Checklist C — carregamento e resposta de navegação

### C1. JavaScript e hidratação

- [ ] Separar conteúdo editorial de ilhas interativas no `home-client.tsx` quando isso reduzir hidratação sem retirar HTML do servidor.
- [ ] Distinguir code-splitting de carregamento realmente sob demanda: um componente `dynamic()` renderizado imediatamente ainda pode solicitar seu chunk no começo.
- [ ] Adiar o código da central de preferências de cookies até sua abertura, mantendo o banner e o gerenciamento de consentimento funcionais.
- [ ] Revisar os prefetches de links do footer: houve uma concentração de requisições de RSC ao chegar ao final da página.
- [ ] Considerar prefetch por intenção para documentos secundários; manter o cuidado já existente com links de checkout/acesso.
- [ ] Criar estados de carregamento/Suspense coerentes com o design nas navegações que aguardam dados.
- [ ] Analisar bundles do build para atribuir o peso a módulos reais antes de remover dependências.

### C2. Fontes e assinatura

- [ ] Mover fontes específicas da landing para o escopo em que são usadas, preservando as mesmas famílias e pesos.
- [ ] Revisar os preloads globais; uma fonte não usada na primeira dobra não precisa competir com os recursos iniciais.
- [ ] Pré-calcular os paths da assinatura do rodapé a partir da OTF original, preservando contornos, escala e animação e evitando parser de fontes em runtime.
- [ ] Validar acentos, pesos e quebras de linha caso sejam criados subsets das fontes.

### C3. CSS e mídia

- [ ] Investigar a origem dos dois CSS grandes e a abrangência do scanner Tailwind.
- [ ] Limitar a geração a fontes reais de classes, mantendo as classes necessárias dos componentes de UI.
- [ ] Confirmar `sizes` e dimensões reais dos slots de imagem em mobile e desktop.
- [ ] Comparar os bytes efetivamente entregues por `/_next/image`, e não apenas o peso dos PNGs de origem.
- [ ] Auditar cache e versionamento dos assets que usam URLs fixas com `immutable` antes de substituir seu conteúdo.

## Checklist D — servidor, cache e manutenção

- [ ] Medir TTFB e cold starts nas rotas públicas em produção.
- [ ] Avaliar uma arquitetura de páginas públicas estáticas/cacheáveis que seja compatível com a CSP escolhida.
- [ ] Tratar o nonce dinâmico como uma decisão arquitetural: não basta retirar `headers()` ou `no-store` sem redesenhar a política das páginas públicas.
- [ ] Manter o isolamento de sessão e de respostas privadas ao revisar cache/prefetch.
- [ ] Revisar o matcher do proxy para fontes e outros arquivos estáticos que não precisam de processamento de página.
- [ ] Medir APIs de conta, autenticação e checkout com dados de observabilidade próprios; o perfil gráfico da landing não identifica gargalos do banco.
- [ ] Mapear componentes legados e duplicados antes de removê-los. Existem variantes de `Topography`/`GradualBlur` e efeitos antigos sem chamada na landing atual.
- [ ] Auditar dependências sem importação no grafo ativo. Remover um pacote não enviado ao cliente melhora manutenção, mas não representa, por si só, ganho de FPS.

## Validação da rodada

- [x] Build de produção e TypeScript.
- [x] ESLint nos arquivos TypeScript alterados.
- [x] Testes de abertura, alternância de tema, desktop, mobile e paisagem.
- [x] Teste que impede shaders/blurs ocultos da home durante a apresentação.
- [x] Teste de retenção e pausa do canvas do Topography.
- [x] Teste de navegação longa do header e retorno pelo indicador.
- [x] Comparação de pixels do blur otimizado com a composição original: diferença média inferior a 1 nível por canal.
- [x] Teste do CNPJ isolado no bloco cadastral do footer.
- [x] Testes existentes de movimento reduzido, carregamento tardio da fonte do footer, CAPTCHA próximo do contato e uso de CTA/FAQ sem JavaScript.

Comandos de verificação:

```bash
npm run typecheck
node --use-system-ca node_modules/next/dist/bin/next build
npx playwright test tests/browser/performance-lifecycle.spec.ts tests/browser/performance.spec.ts tests/browser/topography-theme.spec.ts tests/browser/waves-entrance.spec.ts
```

Os checkboxes em aberto são próximos passos, não otimizações já executadas. A primeira rodada reduz trabalho gráfico desnecessário e melhora a navegação; o hero ainda merece uma medição específica em hardware físico antes de escolher uma alteração adicional de composição.
