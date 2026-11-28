# EZWAY — Auditoria integral, performance e refinamento premium

**Diretiva de execução para Claude Code | Site institucional principal | 27/11/2026**

## 1. Missão, contexto e precedência

O site principal da Ezway está atualmente no domínio `nexoslab.online`. O novo domínio já foi adquirido, mas a migração de domínio não faz parte desta tarefa. Trabalhe no repositório local correto; confirme que corresponde ao site institucional, não ao gerador de minisites, CRM ou workspace de outro projeto. Use o site publicado como referência do estado anterior, quando acessível, e o ambiente local para validar as mudanças.

O objetivo é transformar o site inteiro em uma experiência premium, responsiva, tecnicamente leve e visualmente refinada, preservando sua identidade, conteúdo verdadeiro, funcionalidades e qualidade de motion design. O problema relatado inclui layouts quebrados em diferentes dispositivos, elementos cortados/sobrepostos, lag intenso no mobile e perceptível mesmo em computadores capazes, hierarquia visual pouco trabalhada e seções com conteúdo insuficiente. Esses relatos são hipóteses de investigação, não diagnósticos técnicos já comprovados.

**Não faça apenas sugestões. Audite, reproduza, meça, implemente, teste, critique e refine.** Percorra todos os componentes e seções reais, do header ao footer, inclusive estados interativos e rotas públicas auxiliares. Não encerre após corrigir apenas os exemplos citados. Você tem liberdade para alterar composições, acrescentar conteúdo pertinente, reorganizar elementos e substituir implementações ineficientes, desde que preserve o posicionamento da Ezway e não invente funcionalidades ou comprometa o produto.

Leia integralmente o `CLAUDE.md`, `DESIGN_SYSTEM.md`, `ART_DIRECTION.md`, `EZWAY_MASTER_DESIGN_DIRECTIVE_V2.md` e demais documentos de referência que efetivamente existirem e forem aplicáveis. Leia também os materiais de contexto, imagens e vídeos. Não presuma que o design system de um projeto diferente deva ser aplicado automaticamente a este site institucional. Preserve a identidade cromática vigente, refine-a com base na auditoria e respeite a direção visual explicitamente aprovada para este repositório. Esta diretiva prevalece nos pontos específicos de header, cards pretos e carrossel do MacBook.

## 2. Ferramentas e preparação obrigatória

- Inspecione o repositório, stack, scripts, lockfile, estilos globais, componentes, assets e configurações de build. Verifique `git status` e preserve mudanças locais do usuário. Não faça reset destrutivo nem deploy sem autorização.
- Inventarie todas as skills e MCPs disponíveis no Claude Code (locais, globais e de projeto). Leia as instruções das skills relevantes, ative-as nas fases correspondentes e registre quais foram realmente usadas. Não simule acesso nem carregue ferramentas redundantes apenas para cumprir uma lista.
- Priorize, quando instaladas: Impeccable (auditoria e anti-AI slop), Taste Skill e High-End Visual Design (direção artística), Anthropic Frontend Design e UI/UX Pro Max (composição e sistemas), Emil Kowalski/skills de motion (interação), React Bits (técnicas de componentes), Awwwards, Inspo e Design Lounge (referências). Utilize também as demais skills relevantes já disponíveis.
- Use Playwright MCP, Playwright local ou ferramenta equivalente para abrir a aplicação real, capturar screenshots, reproduzir interações, registrar console e testar diferentes viewports. Use DevTools/performance traces, Lighthouse e ferramentas do stack quando disponíveis. Verifique `claude mcp list` se o CLI estiver acessível. Caso Playwright esteja ausente, consulte a documentação oficial e configure apenas se autorizado; referência: https://github.com/microsoft/playwright-mcp (comando usual: `claude mcp add playwright -- npx -y @playwright/mcp@latest`). Não reinstale conexões funcionais.
- Consulte as referências visuais existentes antes de redesenhar. Use Apple como referência de continuidade, hierarquia e acabamento; Framer, Linear e Awwwards como referências de demonstração de produto e variedade de composição. Não copie interfaces.
- Execute o servidor de desenvolvimento para inspeção e use também build de produção para medições confiáveis. Não confunda overhead de desenvolvimento com custo real de produção.

## 3. Ordem de execução — obrigatória

1. Mapear e reproduzir o estado atual; capturar baseline visual e de desempenho.
2. Corrigir responsividade, bugs estruturais e enquadramento em todas as seções.
3. Otimizar arquitetura, dependências, assets, renderização e animações, mantendo a experiência visual.
4. Refinar a direção artística e o conteúdo, do header ao footer, incluindo os pedidos específicos abaixo.
5. Repetir testes de responsividade e performance após as alterações visuais; corrigir regressões.
6. Realizar revisão crítica independente, quando houver subagentes, e entregar relatório com evidências.

Não aguarde aprovação a cada pequena alteração: prossiga com mudanças locais reversíveis dentro deste escopo. Peça autorização apenas para decisões destrutivas, custos, serviços externos ou mudanças de negócio fora do escopo.

## 4. Auditoria inicial — inventário completo

Crie `docs/EZWAY_AUDIT.md` (ou localização equivalente conforme o repositório). Liste todas as seções na ordem real da página, seus componentes e arquivos, incluindo header, navegação mobile, hero, cards, mockups, carrosséis, seções sticky, CTAs, overlays e footer. Para cada item registre: problema observado, resolução/dispositivo, evidência, causa provável, prioridade, alteração proposta e critério verificável de aceite. Atualize o registro durante o trabalho.

Capture a página completa e recortes por seção antes de alterar o código. Reproduza carregamento inicial, scroll lento e rápido, resize, rotação, abertura/fechamento de menus, cliques, toque, navegação por teclado e retorno ao topo. Verifique console, erros de rede, hidratação, fontes, imagens ausentes e comportamento com conexão lenta. Use conteúdo real e teste textos longos e estados dinâmicos quando aplicável.

## 5. Responsividade — auditoria de cada elemento

Teste no mínimo os seguintes viewports CSS (largura × altura), ajustando conforme o conteúdo:

| Categoria | Viewports |
|---|---|
| Celular compacto | 320×568, 360×640 |
| Celular intermediário | 375×667, 390×844, 393×852 |
| Celular grande | 414×896, 430×932 |
| Tablet retrato | 768×1024, 820×1180, 834×1194 |
| Tablet paisagem | 1024×768, 1180×820 |
| Notebook | 1280×720, 1366×768, 1440×900 |
| Desktop | 1536×864, 1920×1080, 2560×1440 |

Teste larguras intermediárias e imediatamente antes/depois dos breakpoints, não apenas presets. Teste DPR diferentes, orientação paisagem, zoom de 200%, toque e ponteiro, Chromium e WebKit (e Firefox quando possível). A emulação não substitui um iPhone/iPad real: indique o que foi emulado e solicite validação física final quando necessário.

Para **cada seção, card e elemento**:

- Verifique overflow horizontal indesejado, clipping, sobreposição, elementos fora do viewport, imagens deformadas, texto truncado, botões cobertos e áreas clicáveis inacessíveis.
- Confirme que dimensões, aspect ratios, alinhamentos, grids, gaps, margens, paddings e max-width são coerentes; revise `min-width: 0`, flex wrapping, grid tracks, posicionamentos absolutos e containers que dependem de alturas fixas.
- Use tipografia responsiva com limites legíveis (`clamp` quando apropriado). Não resolva tudo reduzindo o tamanho do texto ou comprimindo o desktop dentro do mobile.
- Revise `vh`, `svh`, `dvh`, safe areas e teclados virtuais quando aplicável; evite cortes causados por barras dinâmicas do Safari.
- Garanta que mockups de iPhone/MacBook, suas telas internas e imagens permaneçam corretamente enquadrados. Preserve perspectiva, legibilidade e proporção.
- Inspecione stacking contexts, z-index, elementos sticky, máscaras, transforms, pinning e overlays. Garanta que nenhum elemento esconda conteúdo necessário.
- Distinga overflow intencional de galerias/carrosséis de vazamentos reais. Não mascare bugs com `overflow-x: hidden` global.
- Teste conteúdo com texto ampliado, foco visível, navegação por teclado, áreas de toque confortáveis e estados hover/focus/active.
- Verifique mudanças de layout após carregar fontes, imagens, JS e ao iniciar animações. Evite flashes e layout shifts.

Ajuste a composição de cada seção para mobile e tablet; não apenas empilhe tudo de maneira automática. O resultado deve funcionar e parecer projetado para cada faixa de tamanho.

## 6. Performance — investigação antes de otimizar

O lag relatado é prioridade crítica. Não escolha uma causa sem evidência. Compare scroll estático, scroll com animações, carregamento e interações. Identifique quais seções, efeitos ou componentes geram trabalho excessivo. Registre métricas e traces antes/depois, sob condições comparáveis.

Meça pelo menos: tamanho transferido de JS/CSS/imagens/fontes/vídeos, número de requisições, tempo de inicialização, LCP, CLS, TBT em laboratório, long tasks, custo de scripting/layout/paint/compositing, memória quando possível e estabilidade de frames durante scroll. INP real depende de dados de campo; use testes de interações como aproximação e não declare INP de campo sem dados. Faça múltiplas execuções de produção, com cache frio e condições consistentes; teste também CPU/network throttling mobile.

Metas de referência, não promessa: LCP até 2,5 s, CLS até 0,1 e INP de campo até 200 ms no percentil 75 quando houver dados. Busque frames próximos de 16,7 ms em tela de 60 Hz e ausência de travamentos recorrentes, especialmente durante scroll. Reporte resultados reais e exceções; não invente percentuais de melhoria.

### 6.1 Código, dependências e arquitetura

- Analise bundles e imports, dependências duplicadas, componentes mortos, assets órfãos, CSS não usado e código experimental. Verifique referências dinâmicas, CMS, rotas e configurações antes de remover. Não faça limpeza cega baseada apenas em busca textual.
- Remova dependências comprovadamente desnecessárias; mantenha lockfile consistente e rode testes após alterações. Evite instalar ferramentas pesadas para solucionar problemas simples.
- Divida código por rota/componente, carregue sob demanda módulos pesados não críticos e minimize JS enviado ao navegador. Se a stack usar Next/React, prefira componentes server-side quando não necessitarem de estado/interatividade e reduza fronteiras client desnecessárias, sem alterar contratos.
- Identifique rerenders em cascata, listeners globais, timers órfãos, observers redundantes, work repetido em scroll, medições síncronas de DOM e hydration excessiva. Otimize com evidência, sem memoização indiscriminada.
- Verifique caching, compressão, fontes e preloads de recursos críticos. Não aplique prefetch indiscriminado nem bloqueie o primeiro render com scripts de terceiros.

### 6.2 Imagens, vídeos, mockups e efeitos

- Entregue imagens dimensionadas por viewport, `srcset/sizes` ou mecanismo equivalente, formatos modernos quando compatíveis, dimensões explícitas e compressão visualmente aceitável. Não aplique lazy loading ao provável LCP; carregue conteúdo abaixo da dobra sob demanda.
- Otimize vídeos e animações pesadas mantendo qualidade percebida. Use poster, dimensões reservadas, codecs/bitrates adequados e pause conteúdo fora de visão quando apropriado. Não carregue todas as mídias antecipadamente.
- Audite canvas, WebGL, shaders, partículas, blur, backdrop-filter, máscaras, sombras, blend modes e transparências grandes. Reduza área afetada, resolução, camadas ou frequência quando o trace demonstrar custo excessivo. Ofereça alternativas visuais equivalentes em dispositivos de menor capacidade, sem eliminar indiscriminadamente o design.
- Avalie `content-visibility` ou técnicas equivalentes somente em seções compatíveis; não comprometa medições e pinning de ScrollTrigger.

### 6.3 GSAP, ScrollTrigger, Motion e scroll suave

**Preserve o scroll fluido, a linguagem das animações e GSAP/ScrollTrigger e Motion onde agregam valor.** Não desative todas as animações para obter pontuação de benchmark. Substitua apenas implementações problemáticas por alternativas visualmente equivalentes.

- Mapeie todos os timelines, triggers, pinning, scrubs, listeners e loops RAF. Evite duas bibliotecas escrevendo simultaneamente a mesma propriedade no mesmo elemento.
- Se houver Lenis ou outro controlador de smooth scroll, coordene-o com o ticker/RAF e ScrollTrigger conforme a versão instalada. Evite loops duplicados, atualizações desnecessárias e conflitos com scroll nativo.
- Use `gsap.context`, `matchMedia` ou mecanismos equivalentes conforme a arquitetura e as versões existentes. Faça cleanup de timelines, triggers, observers e listeners no unmount e em mudanças de breakpoint; verifique Strict Mode e navegação entre rotas.
- Prefira transform e opacity quando apropriado; evite leitura/escrita alternada de layout a cada frame e animações caras de grandes áreas. Use `will-change` seletivamente e remova quando não necessário.
- Evite `ScrollTrigger.refresh()` em cada frame; atualize após mudanças estruturais relevantes, carregamento de recursos que alterem geometria e resize controlado. Verifique posições e espaçadores de pinning após resize e rotação.
- Use IntersectionObserver ou mecanismos equivalentes para suspender animações contínuas fora de visão. Pause loops decorativos em aba oculta. Não desative a atualização necessária para conteúdo visível.
- Garanta que o scroll tenha desaceleração leve, natural e responsiva, sem atraso perceptível, saltos ou scroll hijacking. No touch, preserve resposta nativa quando for mais adequada. Verifique âncoras, teclado, trackpad, toque e interação com modais.
- Respeite `prefers-reduced-motion`, mantendo conteúdo integral e alternativas estáticas. A redução de movimento não pode ocultar informação.
- Teste cada seção problemática isoladamente para identificar a contribuição de cada efeito. Compare antes/depois em produção com as animações habilitadas.

## 7. Refinamento visual — regras globais

Após corrigir estrutura e performance, revise a linguagem visual seção por seção. O minimalismo deve ser resultado de composição sofisticada, não ausência de design.

- Revise a hierarquia de todos os títulos, subtítulos, descrições, labels e CTAs. Use um H1 principal, headings semânticos e escalas coerentes. Reduza repetição e excesso de texto centralizado.
- Alterne alinhamentos: textos à esquerda quando a leitura se beneficiar, composições divididas, layouts editoriais, imagens em diferentes escalas e blocos de largura variada. Centralize apenas onde houver intenção composicional.
- Organize os cards e elementos para que estejam bem dispostos, visíveis e proporcionais. Evite cardzinhos idênticos de ícone+título+descrição e bento grids indiscriminados. Cards não são proibidos; repetição sem propósito é.
- Audite paleta, contraste, estados interativos, consistência de cores, transições de superfície e legibilidade. Preserve as cores aprovadas para este site, corrija combinações problemáticas e centralize tokens. Não imponha a paleta de outro produto da Ezway sem confirmação de que é a identidade vigente.
- Refine espaçamento, grids, alinhamentos, bordas, sombras, profundidade, iconografia e tratamento de imagens. Use gradientes claros e fades naturais entre seções quando fizerem sentido. Evite glow exagerado e elementos decorativos genéricos.
- Enriqueça seções que estejam cruas com conteúdo útil, demonstrações, benefícios reais, imagens e exemplos relevantes. Consulte os textos do repositório, páginas comerciais, materiais de produto e documentação disponíveis. Não invente clientes, números, funcionalidades, preços ou depoimentos. Identifique exemplos fictícios como demonstrações quando necessário.
- Preserve a identidade de cada cliente exibido em mockups. Use imagens reais licenciadas ou geradas quando houver ferramenta autorizada e construa telas convincentes antes de colocá-las em molduras. Evite placeholders de fundo sólido com apenas o nome do negócio.
- Acrescente elementos e seções somente se melhorarem narrativa, conversão ou clareza. Não aumente o comprimento com conteúdo redundante.

## 8. Header — comportamento específico obrigatório

Preserve a linguagem de glassmorphism existente, porém refine a geometria, a disposição, o menu e a sensação de interação.

**Estado inicial (topo):** header retangular, colado à borda superior e ocupando a largura de ponta a ponta, sem aparência de cápsula flutuante. Respeite safe areas e mantenha o conteúdo legível sobre o hero. O estado inicial deve estar correto desde o primeiro frame, sem flash de estilo ou blur atrasado.

**Primeiro scroll:** assim que o usuário começar a descer, transicione suavemente para um header flutuante, com margens laterais, largura máxima apropriada, cantos refinados e leve elevação visual. Não espere uma longa distância de scroll. Use um pequeno limiar/histerese se necessário para evitar alternância tremida perto do topo. Ao retornar ao topo, restaure o estado retangular. Sincronize o comportamento com o controlador de scroll existente.

A transição deve ser contínua, natural, reversível e interrompível, sem salto no conteúdo. Reserve espaço adequadamente ou mantenha uma camada estável; não provoque CLS. Prefira técnicas de baixo custo; evite animar blur intenso, largura de grandes layouts ou propriedades que disparem reflow contínuo se houver alternativa. O glassmorphism deve estar presente já na abertura, com fallback legível e leve quando necessário.

**Menu:** redesenhe o acionador de três traços, explorando uma composição mais elegante (duas linhas refinadas ou outra solução que mantenha reconhecimento). Crie transformação coerente para estado aberto/fechado, feedback tátil visual e abertura mais fluida, reativa e espacialmente conectada ao header. Não use atraso artificial antes de o menu responder. Harmonize o menu com o glassmorphism e com os estados retangular/flutuante.

Teste abertura e fechamento rápidos, clique fora, Escape, navegação por teclado, `aria-expanded`, nome acessível, retorno de foco e, se modal, contenção de foco e bloqueio/restauração corretos do scroll. Teste resize, rotação, navegação por links, mobile Safari e abertura durante scroll. Não deixe o menu atrás de seções sticky nem permita que o blur apareça atrasado. Revise logo, links, CTAs, ícones, alinhamento e espaço de toque em todos os tamanhos.

## 9. Hero — auditoria e aprimoramento

Inspecione composição inicial, impacto visual, enquadramento, background, contraste, largura e quebra de textos, posições de CTAs e mockups, animação de entrada e tempo até conteúdo utilizável. Corrija falhas concretas e registre as causas.

Refine o hero para que represente claramente o valor da Ezway, com hierarquia forte e direção artística premium. Use os elementos reais do produto e exemplos visuais existentes com profundidade e proporções intencionais. Não mantenha texto centralizado por convenção; avalie alternativas editoriais. O background deve integrar a composição sem competir com o texto nem causar custo excessivo. A informação principal e o CTA precisam permanecer disponíveis mesmo se JS ou animações atrasarem. Valide o primeiro viewport em celulares pequenos e notebooks de baixa altura.

## 10. Seção específica — “Além da Gestão”

Localize a seção real pelo título e pelo componente correspondente. Substitua as cores dos cards atualmente coloridos por uma direção **preta**, elegante e coerente com o restante do site. Use preto/grafite muito escuro (por exemplo #101010 a #181818 como ponto de partida ajustável) como superfície predominante; texto claro, contraste suficiente, bordas e detalhes discretos. Não recolora logotipos/imagens de clientes ou estados semânticos quando isso destruir significado.

Revise todos os cards: tamanho, proporções, conteúdo, hierarquia tipográfica, alinhamento, imagens, ícones, elementos absolutos, animações, estados interativos e enquadramento. Corrija os problemas de resolução relatados, inclusive cards que se sobrepõem, ficam cortados ou escondem conteúdo. Em mobile, adote composição própria se necessário, sem reduzir artificialmente o conteúdo. Teste cada card em todas as faixas de viewport, inclusive durante animações e scroll. Não use preto apenas como substituição de HEX: refine a composição interna para o novo contraste.

## 11. Seção específica — “Sites, cardápios e páginas para o seu negócio”

Esta seção contém um mockup de MacBook e está pouco desenvolvida. Reorganize a seção, aprimore o texto e o layout e torne a demonstração de produto mais convincente.

### 11.1 Remover dependência da rolagem nas imagens

Identifique a implementação atual que troca imagens conforme o scroll. Desvincule **a troca de imagens/slides** do progresso de ScrollTrigger, scrub, pinning ou wheel listeners. Preserve animações de entrada e outros efeitos de scroll que continuarem fazendo sentido; remova pinning/espaçadores que existam exclusivamente para avançar slides, caso não tenham outra função. O usuário deve conseguir continuar navegando verticalmente sem precisar percorrer uma distância artificial para trocar imagens.

Implemente uma apresentação automática, independente da posição da rolagem enquanto a seção estiver visível, com intervalo inicial sugerido de 4–5 segundos e transição de aproximadamente 400–650 ms, ajustável após teste visual. O slide deve continuar avançando enquanto o usuário rola dentro da área visível, sem ser reiniciado a cada evento de scroll. Fora de visão ou em aba oculta, pause para economizar recursos; retome sem saltar vários slides. Não crie múltiplos timers. Limpe recursos no unmount.

Use um quadro centralizado, organizado, com proporções estáveis e transições suaves (fade/crossfade ou outro movimento coerente), sem alteração de altura a cada imagem, flickering, cortes ou flashes. Preserve o MacBook se ele contribuir para a demonstração; refine moldura e tela interna. O conjunto deve ter aparência de apresentação de produto, não de galeria genérica. Pré-carregue somente a próxima imagem se necessário, não todas em alta resolução.

Forneça controles discretos de anterior/próximo, indicação de slide e pausa/reprodução; permita teclado e toque quando apropriado. Pause durante foco/hover quando necessário para leitura, preserve escolha explícita de pausa e respeite `prefers-reduced-motion` (sem autoplay por padrão nesse caso). Evite anúncios constantes para leitores de tela durante autoplay; forneça nomes acessíveis e anuncie mudanças manuais de forma adequada. Não capture o scroll vertical para navegação horizontal.

### 11.2 Conteúdo, informação e hierarquia

Pesquise nos materiais e funcionalidades reais da Ezway o que diferencia sites, cardápios e páginas comerciais. Amplie a seção com uma headline clara, descrição de valor, exemplos de aplicação e textos curtos que expliquem o que cada slide demonstra. Use informações verificadas; se uma capacidade ainda não existir, não a anuncie como disponível. Considere exemplos de cardápio digital de hamburgueria, página de serviços, site institucional e outros segmentos pertinentes, conforme o produto real.

Organize a composição com texto e mockup de forma equilibrada: título e explicação podem ficar à esquerda no desktop, com apresentação centralizada em seu próprio quadro; no mobile, reorganize em sequência legível, sem comprimir uma tela de desktop até torná-la inútil. Adicione CTA coerente se houver destino funcional. Não invente um novo fluxo comercial.

Os slides devem conter interfaces plausíveis e ricas, com fotografia de qualidade, tipografia, conteúdo, hierarquia e identidade própria, não apenas cor sólida e nome. Use capturas de interfaces reais ou demos construídas e identificadas como tal. Preserve a qualidade do conteúdo independente da moldura do MacBook.

### 11.3 Critérios específicos de aceite

- A troca automática funciona sem o usuário rolar e continua enquanto ele rola na área visível.
- Scroll vertical não é bloqueado e não existe seção artificialmente longa apenas para avançar imagens.
- Imagens e textos permanecem estáveis, alinhados e legíveis em todas as resoluções.
- Controles, pausa, retomada, foco, toque e movimento reduzido funcionam corretamente.
- Não há timer duplicado, download desnecessário de todas as mídias nem regressão perceptível de performance.
- A seção comunica mais informação real e útil do que a versão anterior.

## 12. Demais seções, navegação e footer

Aplique o mesmo grau de inspeção a **todas** as seções restantes, na ordem real da página. Para cada uma, defina finalidade, mensagem principal, hierarquia, composição, conteúdo ausente, interação, comportamento responsivo e custo de renderização. Corrija as falhas e refine o que puder melhorar sem fugir do tema. Verifique links, CTAs, formulários, estados de feedback, destinos externos e menus. No footer, revise distribuição das colunas, quebras, contraste, ícones, links legais, contatos e empilhamento mobile; mantenha informações existentes corretas. Não invente contatos, políticas ou links.

## 13. Validação final e revisão crítica

Faça pelo menos três ciclos: (1) correção estrutural e performance, (2) revisão visual e narrativa, (3) regressão integrada e polimento. Use screenshots antes/depois por seção nas principais resoluções; teste automaticamente os viewports da matriz quando viável. Registre vídeos curtos do header, carrossel e scroll quando a ferramenta permitir.

Rode lint, typecheck, testes e build conforme scripts reais. Teste a versão de produção com animações ligadas e movimento reduzido. Compare performance com baseline nas mesmas condições. Inspecione console e rede; teste interação rápida, navegação, retorno ao topo, resize e rotação. Verifique que nenhum link, formulário, autenticação ou funcionalidade existente foi quebrado.

Use Impeccable e as skills pertinentes para crítica final, ou faça uma revisão equivalente se estiverem indisponíveis. A página deve ser avaliada por sua renderização real, não apenas pelo código. Corrija problemas concretos identificados e repita os testes. Não atribua notas subjetivas como se fossem métricas verificadas.

## 14. Entrega e critérios de conclusão

Atualize `docs/EZWAY_AUDIT.md` e produza `docs/EZWAY_REFINEMENT_REPORT.md` (adapte ao padrão do projeto). Inclua:

- Inventário completo de seções e status de cada uma: corrigida, validada ou pendente, com evidência e causa dos problemas.
- Arquivos modificados e mudanças relevantes de arquitetura, dependências, assets e componentes.
- Matriz de dispositivos/viewports/navegadores realmente testados, distinguindo emulação de hardware físico.
- Métricas comparativas de performance, condições de teste e traces ou screenshots disponíveis.
- Decisões de direção artística e conteúdo, referências e skills/MCPs realmente utilizados.
- Evidências específicas do header retangular → flutuante, cards pretos de “Além da Gestão” e autoplay independente do scroll na seção do MacBook.
- Resultado de lint/typecheck/testes/build, com falhas e limitações explícitas. Não declare como executado algo não executado.
- Pendências, riscos, melhorias futuras e roteiro curto de validação física pelo usuário.

Considere o trabalho concluído somente quando todas as seções mapeadas tiverem sido examinadas e os critérios aplicáveis verificados, ou quando bloqueios reais estiverem explicitamente documentados. Não prometa compatibilidade de 100% com dispositivos não testados. Busque cobertura ampla e evidência concreta.

**Restrições finais:** não alterar domínio/DNS, infraestrutura de produção, backend, banco, permissões, autenticação ou regras de negócio fora do necessário e autorizado. Não apagar conteúdo ou animações para maquiar resultados. Não instalar serviços pagos nem publicar mudanças sem autorização. Não sacrificar qualidade visual por pontuação artificial. Preserve a experiência cinematográfica, o scroll fluido e a identidade da Ezway, entregando um site mais leve, confiável, responsivo e autoral.

**Comece agora pelo inventário e baseline. Prossiga etapa por etapa até a validação integrada.**
