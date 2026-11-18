# Documento mestre — Refatoração visual e experiência cinematográfica da ezway

**Versão:** 14 — correções do usuário incorporadas em 17/11/2026.

**Regra prioritária atualizada:** avatar estático, sem animação ou pinning. Pop-ups somente com texto em verde lima (#b9ef75), sem moldura, fundo, halo ou ícone. Troca automática a cada três segundos com surgimento suave de 400 ms (opacidade e 6 px de deslocamento), sem seletor, botões ou contador. Movimento completo também quando o sistema informa redução, conforme nova solicitação do usuário. Esta escolha substitui as propostas anteriores para esse bloco.  
**Correção de escopo:** cards coloridos com scroll preso pertencem a “Além da gestão.”; “Controle & Gestão” não deve ter MacBook. Fora essas alterações, manter o documento mestre.  
**Método:** implementação por partes, com evidências e revisão entre etapas.  
**Acompanhamento:** [EXECUCAO.md](./EXECUCAO.md).  
**Referência inicial:** commit `bcd6fb0`; site e portal existentes.

## 1. Objetivo e direção aprovada

Refinar profundamente o site público e o portal, preservando a identidade e a base estrutural existentes, com uma experiência bem dinâmica, demonstrativa e cinematográfica.

GSAP ScrollTrigger e Framer Motion são centrais: coordenam apresentação, rolagem, transição de conteúdo e resposta às ações do visitante. A referência principal é o próprio site atual; o resultado deve ser uma evolução reconhecível da ezway.

### Decisões confirmadas

- Preservar preto, branco, rosa, Google Sans, logotipo e mascote.
- Manter a base estrutural e a sequência principal da home.
- Preservar o título do hero com digitação.
- Manter o avatar na divisa após o conteúdo principal do hero, indicando as soluções nos pop-ups.
- Refinar detalhadamente composição, transições e scrolling.
- Criar narrativa cinematográfica com cenas temporariamente fixadas no desktop.
- Manter experiência animada no celular, adaptada à rolagem natural.
- Combinar telas reais protegidas com simulações locais identificadas.
- Comparar duas propostas para a aparência dos pop-ups; o usuário escolhe a versão definitiva.
- Incluir site público, acesso, recuperação, conta, segurança e painel técnico.
- Executar e revisar uma etapa por vez.

## 2. Invariantes

### Estrutura e identidade

A sequência atual é o ponto de partida: hero e avatar, gestão, ecossistema, EasyChat, serviços, NFC e suas demonstrações, processo, aplicações, apresentação institucional, FAQ e contato. Refinar esses blocos; não reconstruir a home como uma sequência genérica de seções novas.

Preservar âncoras, URLs, contatos reais, navegação institucional, idioma e identificação das ofertas. Extrações internas de componentes não quebram os links existentes.

### Conteúdo e produto

A conversão principal continua sendo uma conversa pelo WhatsApp. EasyChat permanece em desenvolvimento. Screenshots demonstram apenas o que foi verificado. Simulações não comprovam integrações ou funcionalidades adicionais.

Não introduzir preços, depoimentos, indicadores, clientes ou promessas sem confirmação. Manter o catálogo comercial em `src/config/solutions.ts`; fixtures de demonstração ficam separadas.

### Portal e segurança

Refinar os fluxos existentes: acesso de cliente/admin, recuperação e redefinição de senha, MFA, perfil, segurança e diagnóstico técnico. Não criar outro CRM nem ampliar silenciosamente as funcionalidades do portal.

Preservar autenticação, autorização, sessões, consentimento e verificação de entrada. As demos públicas não consultam dados privados nem executam ações reais.

### Implementação

Reutilizar bibliotecas, componentes e assets. Não adicionar outro motor de scroll ou uma biblioteca visual completa. Exceção autorizada pelo usuário: GradientWave em WebGL somente como fundo da cena existente do MacBook, sem novo motor/biblioteca e com fallback CSS animado quando WebGL não estiver disponível. Separar problemas funcionais descobertos do escopo visual autorizado.

## 3. Papel das skills

- **frontend-design:** direção principal de composição do site público.
- **interface-design:** organização das interfaces de acesso, conta, segurança e painel.
- **build-awwwards-quality-sites:** referência para narrativa, cenas e demonstrações cinematográficas.
- **design-taste-frontend:** recursos e verificações seletivos; não aplicar contatos fictícios, fontes, paletas ou regras de tela inteira automaticamente.
- **gsap-scrolltrigger:** timelines de scroll, pinning, scrub e medidas.
- **motion-design:** ritmo, hierarquia e personalidade do movimento.
- **emil-design-eng:** feedback, transições interrompíveis e acabamento.
- **better-typography:** escala, pesos, quebras e leitura.
- **accessibility / accessible-animation:** teclado, foco, semântica e contraste; política de movimento atual definida explicitamente pelo usuário.
- **vercel-react-best-practices:** renderização, carregamento e ciclo de vida.

Anatomy, Image, Graphic Designer e Video são recursos complementares, usados somente quando uma necessidade visual concreta justificar nova mídia. Não combinar sistemas completos de direção visual na mesma página.

## 4. Sistema visual compartilhado

### Identidade e tipografia

Preservar Google Sans e consolidar tokens semânticos para superfícies, textos, bordas, controles, foco, marca e estados. Manter alternância entre superfícies claras e escuras.

Consolidar escala para títulos, subtítulos, corpo, controles e legendas. Usar títulos fluidos no comercial e escala mais estável no portal. Conferir português, inglês e espanhol. Textos divididos para animação preservam um nome acessível íntegro.

### Espaçamento e componentes

Adotar base de 4 px e documentar ajustes ópticos. Diferenciar proporções de controles, painéis e grandes superfícies. Extrair componentes onde houver reutilização real, sem criar um componente universal com dezenas de opções.

Controles precisam de normal, hover, pressionado, foco, indisponível e processamento. Dados precisam de carregamento, vazio, erro e sucesso.

### Estilos

Consolidar fundamentos de forma incremental em `src/app/globals.css`, com CSS Modules nas composições específicas. Verificar consumidores antes de mudar tokens; manter aliases enquanto necessários. Remover código antigo somente após verificar usos.

## 5. Arquitetura de animação

### GSAP / ScrollTrigger

Responsáveis por entradas coordenadas, transições ligadas ao scroll, parallax decorativo, transformação de dispositivos, pinning e capítulos. Cada cena tem timeline local, gatilhos definidos, estado final e limpeza.

### Framer Motion

Usar o pacote já instalado `motion`, via `motion/react`; não instalar uma segunda cópia como `framer-motion`. Responsável por abas, seletores de demonstrações, menus, painéis, simulações e estados do portal. O texto das soluções do hero usa animação CSS local; o avatar não recebe Motion.

### CSS e composição

CSS cuida de feedback simples e frequente. Quando GSAP e Motion participarem da mesma cena, usar camadas distintas: GSAP no wrapper das cenas de demonstração, Motion nos elementos internos. O avatar permanece estático; apenas o texto das soluções tem uma entrada CSS local. Nunca disputar `transform` ou opacidade do mesmo elemento.

### Ritmo inicial

- Pressionamento: 100–150 ms.
- Hover e seleção: 160–240 ms.
- Conteúdo: 240–400 ms.
- Modais/painéis: 280–400 ms.
- Entradas principais: 700–1.100 ms.
- Hero: até aproximadamente 1.400 ms; ações utilizáveis antes do término.
- Stagger: normalmente 40–80 ms, sem repetição mecânica.
- Scrub: progresso definido pelo scroll, sem espera obrigatória.

## 6. Contrato do scrolling cinematográfico

### Condição para pinning

Em “Além da gestão.”, manter animação e fixação em todos os dispositivos e tamanhos, incluindo toque, celular, tablet e orientação horizontal. Ausência de JavaScript mantém conteúdo legível no fluxo natural. Com JavaScript, manter movimento completo inclusive sob preferência de redução do sistema. Nas outras cenas (gestão, NFC e processo), manter a condição inicial de largura mínima de 1.200 px, altura mínima de 800 px, ponteiro fino e movimento completo. Fora dessa geometria, gestão mantém capítulos por scroll sem pinning. O avatar e os pop-ups ficam no fluxo normal, sem pinning. Cada uma mantém sua posição na sequência da página.

### Tablet, telas baixas e celular

Adaptar às mesmas ideias em fluxo contínuo: revelações, transformações menores, troca de conteúdo e feedback de toque. Não reproduzir toda a extensão de pinning do desktop. Manter rolagem nativa e conteúdo completo.

### Navegação e estabilidade

- Sem snap obrigatório ou percurso horizontal indispensável.
- Navegação interrompível e apenas um Lenis nos contextos compatíveis. Ponteiro fino com movimento completo usa duração de 1,2 s e desaceleração cúbica nos dois sentidos; toque e navegadores embutidos (incluindo Instagram) usam a inércia nativa; a escolha do motor não desativa as coreografias.
- Em toque e navegadores embutidos, variações apenas de altura causadas pela barra do navegador não recalculam as cenas; atualizar ao mudar largura/orientação. Não sobrepor amortecimentos por RAF ao scrub do GSAP.
- No mockup de MacBook dos serviços, manter o dispositivo estável e trocar as telas por opacidade. Seletores mudam a demonstração sem deslocar a página. No Instagram, reduzir filtros e perspectiva para aliviar composição.
- Destinos consideram cabeçalho flutuante; foco não provoca segundo deslocamento.
- Preservar links diretos, recarregamento e histórico.
- Reservar dimensões antes de carregar mídia.
- Atualizar medidas após fontes, imagens e mudanças reais de layout; nunca fazer refresh por frame.
- Criar triggers de cima para baixo e desfazê-los ao desmontar.
- Menu e modal não podem deixar scroll bloqueado.

## 7. Coreografia por trecho

### 7.1 Apresentação e hero

Preservar abertura, pular e replay. Coordenar passagem para o conteúdo: atmosfera, título, typing, descrição e ações. A cena seguinte aparece em continuidade. Não reiniciar apresentação a cada mudança de estado. Reservar a altura integral da linha de digitação, inclusive quando a palavra estiver vazia, para impedir saltos periódicos no título, texto e ações.

### 7.2 Avatar na divisa

Preservar asset, gesto e enquadramento atual. Avatar e área reservada das soluções ficam parados no fluxo normal, na divisa depois do hero. Não aplicar GSAP, Motion, pinning, parallax, scale, fade ou deslocamento ao avatar nem aos seus wrappers. Somente o texto das soluções recebe o surgimento local definido abaixo. A rolagem apenas transporta o documento naturalmente. Preservar cabeça, mão e recorte inferior.

### 7.3 Soluções automáticas em texto, sem moldura

Manter Controle e gestão, Sites e portfólios, Mini-sites/Bio-links e EasyChat em desenvolvimento. Trocar somente o texto a cada três segundos, com surgimento suave de 400 ms, opacidade e deslocamento vertical de 6 px. Remover toda moldura, superfície, halo e ponto decorativo. Texto e nota em verde lima dos cards (#b9ef75). Reservar altura para todas as mensagens, evitando saltos de layout. Não exibir setas, contador, pausa, seletor, tabs ou controles. Pausar o timer fora da tela, com aba oculta e durante a apresentação. A troca permanece automática com surgimento suave em todos os modos do sistema. Sem JS, primeiro item visível. Não anunciar automaticamente cada troca a leitores de tela.

### 7.4 Aparência escolhida pelo usuário

Texto sem moldura em verde lima, com surgimento suave, conforme solicitação mais recente. A comparação anterior entre duas propostas foi encerrada por essa escolha. Padronizar os verdes decorativos da interface no mesmo lima dos cards; conservar contraste escuro sobre superfícies lima.

### 7.5 Gestão por capítulos

Sem MacBook ou moldura de notebook. Apresentar diretamente as telas reais protegidas; cena fixa e scroll percorre Comercial, Clientes e Financeiro. Tela, texto e indicador avançam coordenados. Limite inicial de percurso adicional: 180% da altura útil.

Seleção manual muda conteúdo sem deslocar página; automático só retoma no próximo limite de capítulo. Não transformar screenshots enquanto isso prejudicar a leitura. Manter aprofundamentos em “Mais sobre a gestão”.

### 7.6 Ecossistema e serviços

Em “Além da gestão.”, fixar temporariamente a cena e empilhar os cards de vidro verticalmente pelo scroll, usando o componente StackedCards adaptado do script fornecido pelo usuário. Cada card entra de baixo para cima; os anteriores reduzem suavemente de escala com origem no topo. A limpeza do GSAP deve afetar apenas esta cena. Apresentar sete cards já existentes no catálogo: sites, cardápios, NFC, portfólios, landing pages, EasyChat e suporte. Sequência rosa, verde, preto, lavanda, amarelo suave, azul suave e verde lima. EasyChat mantém a indicação de desenvolvimento. Não repetir a solução de gestão neste bloco.

Cards devem ter formato vertical e alto, preenchendo a altura útil da tela. A altura é calculada a partir da área restante abaixo do título e do cabeçalho; largura ampliada até 640 px, aproveitando a área disponível no celular. Título e descrição ficam empilhados, centralizados, com espaçamentos e posições consistentes entre os cards. Bordas luminosas, reflexos e textura de vidro seguem o exemplo do usuário; aplicar blur apenas ao card ativo para limitar o custo de composição. Em paisagem baixa, adaptar a largura à leitura e preencher a altura disponível sem sobrepor o cabeçalho. O usuário detalhará o conteúdo posteriormente; manter textos comerciais concisos. Remover “Saiba mais” e seus detalhes dos cards; manter navegação por foco no artigo.

Título e apresentação permanecem parados durante a cena. Ao terminar o último card, liberar a fixação e seguir a rolagem padrão. O percurso se ajusta ao deslocamento total dos sete cards, sem bloquear wheel/touch nem interceptar o scroll global. Todos os sete ficam disponíveis diretamente, sem expansor de catálogo.

Manter a mesma animação e fixação em todos os dispositivos, incluindo celular, tablet, telas baixas e toque; adaptar o enquadramento à área útil. Sem JavaScript, manter os sete cards legíveis no fluxo natural. Preferência de redução não desativa a animação, por orientação do usuário. Em serviços, preservar a jornada de demonstrações existente e refinar detalhes sem aplicar uma segunda fixação. Integrar o GradientWave fornecido pelo usuário como camada absoluta dentro da cena do MacBook, preenchendo o fundo sem consumir espaço do título, dispositivo ou controles. Usar branco, rosa suave e lavanda da paleta, com véu claro de leitura. Medir o container, limitar resolução/FPS, pausar fora de vista/aba oculta e oferecer gradiente CSS animado em falha ou ausência de WebGL. Não alocar WebGL fora da área visível.

### 7.7 EasyChat

Preservar desenvolvimento. Coordenar dispositivo e mensagens aproveitando jornada existente, sem segunda fixação sobre container já controlado. Não transformar ancestral do texto de modo a rasterizá-lo e prejudicar nitidez.

### 7.8 NFC

Sequência: produto físico → aproximação/leitura → destino digital. Após “Um gesto. Seu negócio conectado.”, mostrar “Mudou de cardápio? Sua placa acompanha.”; depois, “Transpareça a verdadeira qualidade do seu trabalho.”. Remover “Da presença digital ao próximo contato”. Unir “Mudou de cardápio?” ao mesmo painel preto de NFC imediatamente após “Um gesto.”, sem máscara, fade branco ou faixa clara entre os dois. O topo escuro da seção de NFC e o topo de “De ponta a ponta. Com você.” usam os mesmos cantos arredondados dos demais blocos pretos (32 px no desktop, 24 px no celular). Usar mídias existentes. Percurso fixado adicional inicial de até 150% da altura útil no desktop; sequência vertical no celular. Não sugerir integração automática entre produtos.

### 7.9 Processo

Progressão por etapas, com destaque coordenado. Percurso fixado adicional inicial de até 100% da altura útil. Informações disponíveis como conteúdo estruturado mesmo sem timeline.

### 7.10 Institucional e encerramento

Reduzir intensidade depois das demos para facilitar leitura e decisão. Motion em FAQ e estados; chegada coordenada ao CTA e assinatura. Preservar acesso rápido ao contato.

## 8. Telas reais e simulações

### Telas reais

Manter screenshots protegidas de Comercial, Clientes e Financeiro. Refinar enquadramento, ampliação, seleção e explicação. Identificar a origem real.

### Simulações locais

Ação explícita abre a experiência correspondente:

- Comercial: selecionar oportunidade fictícia, etapa e próximo retorno.
- Clientes: selecionar cliente fictício e consultar histórico ilustrativo.
- Financeiro: alternar períodos de uma base fictícia fixa.

Motion controla seleção, painéis e atualização visual. Exibir “Demonstração com dados fictícios”; manter estado na memória, permitir reinício e não enviar informações ao CRM. Sem cobrança, emissão fiscal, envio de mensagens ou outras capacidades não confirmadas.

Carregar ao solicitar. Abrir pausa a cena de fundo; fechar preserva posição e devolve foco. Usar teclado e toque.

## 9. Páginas públicas e portal

### Comerciais

Refinar sites, landing pages, cardápio e NFC com sistema compartilhado, entrada própria e mídia pertinente. GSAP em apresentação/leitura e Motion nos controles. Não replicar automaticamente os pins planejados para as demonstrações da home.

### Institucionais

Priorizar leitura e navegação. Entrada discreta, sem animação contínua do texto jurídico. Preservar conteúdo e metadados salvo correções registradas.

### Acesso e recuperação

Refinar composição, validação, foco e processamento. Motion entre passos existentes. Não atrasar foco/campos para acompanhar animação. Preservar públicos, MFA e callbacks.

### Conta e segurança

Melhorar agrupamento, edição e status. Feedback claro de sucesso/erro e leitura estável.

### Painel técnico

Refinar integrações, diagnósticos e ações existentes. Distinguir indisponível de falha; não fabricar métricas. Scroll nativo e nenhum pin cinematográfico nas tarefas operacionais.

## 10. Movimento completo e desempenho

### Política atual do produto

Solicitação explícita do usuário: manter movimentos em todo dispositivo, incluindo PCs fracos, sem modo de redução. A política compartilhada mantém animações JS e CSS ativas inclusive quando o sistema informa prefers-reduced-motion. Não modificar window.matchMedia: o diagnóstico continua exibindo a preferência real do sistema e a política efetiva do produto. Preservar regras responsivas, cores forçadas, teclado e foco. Avatar continua estático pela orientação específica anterior.

Não usar quantidade de núcleos, memória, saveData ou classificação do aparelho para desligar coreografias. Pausar somente conteúdo fora da tela, aba oculta e controles explícitos do usuário. Sem WebGL, manter fundo animado em CSS; sem JavaScript, conteúdo legível. Gestão em telas sem espaço para pin mantém a troca de capítulos pelo scroll normal.

Preto de interface = #000000: superfícies, cards pretos, cabeçalho e fundos escuros. Retirar rótulos públicos como exemplo, ilustrativo, demonstrativo e equivalentes, inclusive nomes acessíveis. Não transformar material comercial em alegação de resultados reais nem conectar operações locais ao CRM.

### Desempenho

Priorizar transform/opacity, limitar blur, pausar fora da tela/aba oculta, evitar render React por pixel de scroll, carregar demos sob demanda e limpar timelines/timers/observers. Não atualizar dependências apenas para seguir exemplos das skills.

Ler documentação instalada do Next antes de código. Medir antes/depois nas mesmas condições. Não prometer 60 fps universal nem equivaler emulação a hardware real.

## 11. Execução por etapas

Cada etapa deve registrar tarefas concluídas, evidências, testes, limitações e próximo passo no acompanhamento. Estados: pendente, em andamento, em revisão, concluída.

### Etapa 0 — Documento

- [x] Salvar plano e acompanhamento.
- [x] Registrar decisões, limites e checkpoints.

**Aceite:** arquivo completo, acessível e executável por partes.

### Etapa 1 — Referência e diagnóstico

- [ ] Capturar home e cenas prioritárias em desktop/celular.
- [ ] Capturar páginas internas públicas e estados acessíveis do portal.
- [ ] Mapear scroll, estilos e animações.
- [ ] Registrar problemas, desempenho e limitações autenticadas.

**Aceite:** achados com evidências e localização; sem contornar acesso privado.

### Etapa 2 — Fundamentos

- [ ] Consolidar tokens, tipografia, controles e parâmetros de movimento.
- [ ] Separar responsabilidades de GSAP e Motion por camada.
- [ ] Verificar consumidores e compatibilidade de componentes existentes.

**Aceite:** estados completos e sem regressões nos consumidores.

### Etapa 3 — Navegação

- [ ] Refinar header, navegação interna, menu mobile e consentimento.
- [ ] Conferir foco e liberação de scroll em sobreposições.

**Aceite:** nenhuma perda de foco, salto ou bloqueio residual.

### Etapa 4 — Hero/avatar/pop-ups

- [x] Refinar hero e estabilizar avatar e área dos textos sem pinning.
- [x] Aparência escolhida: somente textos lima, sem moldura, com surgimento suave.
- [x] Manter avatar sem animação e troca automática sem controles.
- [ ] Validar movimento completo com e sem preferência de redução do sistema e ausência de JS.

**Aceite:** identidade preservada e gesto indicando cards sem cortes.

### Etapa 5 — Gestão e demos

- [x] Implementar capítulos por scroll, screenshots, seleção e ampliação.
- [x] Implementar simulações locais identificadas e reiniciáveis.

**Aceite:** entendimento claro e nenhuma consulta/gravação no CRM.

### Etapa 6 — Demais cenas da home

- [ ] Refinar ecossistema, EasyChat, serviços, NFC, processo e encerramento.
- [ ] Intercalar demonstração e leitura mantendo sequência atual.

**Progresso:** cards de vidro, centralização, EasyChat e correção do scroll do MacBook implementados. Scroll global e perfis de navegador revisados; ver registro de estabilidade em EXECUCAO.md. NFC, processo e encerramento ainda precisam da revisão completa prevista nesta etapa.

**Aceite:** estrutura reconhecível e coreografia coerente por trecho.

### Etapa 7 — Páginas públicas

- [ ] Estender fundamentos e comportamentos às comerciais/institucionais.
- [ ] Preservar conteúdo, links e especificidade de cada serviço.

**Aceite:** unidade sem páginas indiferenciadas.

### Etapa 8 — Acesso/recuperação

- [ ] Refinar formulários e passos com Motion.
- [ ] Validar estados, permissões e redirecionamentos existentes.

**Aceite:** comportamento funcional preservado.

### Etapa 9 — Conta/segurança/painel

- [ ] Refinar dados, ações e estados reais.
- [ ] Cobrir com fixtures de teste sem expor rotas privadas.

**Aceite:** tarefas claras sem capacidades inventadas.

### Etapa 10 — Scroll integrado

- [ ] Validar offsets, pins, interrupções, resize e ciclo de vida.
- [ ] Comparar custo com referência.

**Aceite:** nenhuma retenção indevida nem timelines duplicadas.

### Etapa 11 — Entrega

- [ ] Build, tipos, lint e testes pertinentes.
- [ ] Capturas antes/depois e relatório.
- [ ] Revisão final e versão identificada por commit.

**Aceite:** entrega revisável e limitações explícitas antes da publicação.

## 12. Matriz de testes e critérios globais

### Viewports

320, 390, 430, 768, 1024 e 1440 px; desktop baixo, orientação, zoom, idiomas e teclado virtual. Chrome e WebKit nos percursos principais.

### Scroll

Lento/rápido/reverso, deep link no início/meio da cena, interrupção, reload após rolar, histórico, retorno da aba, modal/menu durante pin, passagem entre breakpoints e mídia tardia.

### Avatar

Cabeça/mão preservadas, alinhamento com diferentes alturas de texto, tradução, alternância automática, ausência de animações/controles e comparação por capturas e transição para gestão.

### Fluxos

CTAs reais, idioma, consentimento, credenciais, perfil, recuperação, MFA e autorização. Demos por teclado/toque, reinício, fechar e devolver foco.

### Adversidades

Reduce ativo/alterado ao vivo, JS ausente, autoplay recusado, mídia indisponível e conexão lenta. Demos podem exigir JS, mas screenshots e explicações não dependem delas.

### Aceite global

- [ ] Identidade e base estrutural preservadas.
- [ ] Avatar na divisa após hero, indicando soluções, sem animação. Pop-ups automáticos sem seletores.
- [x] Escolha visual dos pop-ups registrada: texto lima, sem moldura e com surgimento suave.
- [ ] Sem overflow, corte de texto, controles sobrepostos ou scroll preso.
- [ ] Navegação, histórico e segurança preservados.
- [ ] Dados fictícios identificados e separados.
- [ ] Movimento completo validado sob preferência de redução e em CPU limitada.
- [ ] Build/tipos/lint/testes pertinentes aprovados.
- [ ] Sem regressão de desempenho sem justificativa.
- [ ] Evidências e limitações registradas.

Pontuação automática não comprova conformidade integral nem fluidez em todos os dispositivos. Diferenciar emulação de teste físico.

## 13. Controle de execução e publicação

Ciclo: conferir → registrar → implementar → validar → apresentar → atualizar documento. Etapa sem validação fica em revisão. Concluir uma parte não implica marcar as demais como concluídas.

Usar branch de trabalho e commits pequenos sem incluir skills/arquivos alheios por conveniência. Push na main dispara produção: não usar produção para experimentar.

Coordenar checkout/servidor de Cursor e Orca; não voltar a locais independentes divergentes. Não trocar branch de servidor ativo silenciosamente. A aparência dos textos do hero foi definida pelo usuário; a publicação permanece um checkpoint explícito.

## 14. Definição de sucesso

Uma ezway reconhecível, com narrativa cinematográfica: GSAP ScrollTrigger conduz cenas/scroll e Framer Motion responde às interações. Avatar preservado na divisa, demonstrações claras e exploráveis, páginas internas coerentes e portal orientado às tarefas.

O documento é a fonte de orientação e deve refletir o que foi realmente concluído.

## 15. Histórico de decisões

- **17/11/2026:** usuário definiu site público e portal, preservação de cores/fonte/mascote e foco em demonstrações.
- **17/11/2026:** usuário pediu manter a base estrutural, avatar na divisa apontando aos pop-ups e refinamento detalhado de scrolling.
- **17/11/2026:** usuário escolheu combinar telas reais e simulações e comparar dois visuais de pop-up.
- **17/11/2026:** usuário exigiu GSAP ScrollTrigger e Framer Motion bem dinâmicos e escolheu narrativa cinematográfica.
- **17/11/2026:** execução iniciada; aparência A permanece padrão até revisão comparativa.

- **17/11/2026 — correção prioritária:** usuário removeu animações e pinning do avatar e dos pop-ups; exigiu pop-ups automáticos, sem seletor nem controles. As animações cinematográficas ficam nas demais cenas.
- **17/11/2026 — escopo confirmado:** cards rosa, verde, preto e complementares com movimento suave e fixação temporária na seção “Além da gestão.”. A seção “Controle & Gestão” não recebe MacBook. Restante do documento mantido.

- **17/11/2026 — todos os dispositivos:** usuário determinou manter a animação dos cards também em celular, tablet, toque e telas baixas. Essa decisão substitui a alternativa estática por tamanho/dispositivo da versão 4. Movimento reduzido e ausência de JS continuam respeitados.

- **17/11/2026 — eixo, quantidade e formato:** usuário escolheu arraste vertical, mais cards e formato menos vertical com menos espaço vazio. Sete soluções existentes foram incluídas; detalhamento de conteúdo fica para uma próxima revisão.

- **17/11/2026 — proporção final esclarecida:** usuário definiu cards verticais e altos, ocupando melhor a altura útil da tela. Esta orientação substitui o formato baixo da versão 6; movimento continua vertical e mantém os sete cards.

- **17/11/2026 — componente solicitado:** integração do script de stacking glass cards em `src/components/ui/glass-cards.tsx`, com textos renderizados e alinhados, sete soluções existentes, largura máxima ampliada para 640 px e margem lateral de 16 px no celular. Sem novo hero ou main aninhado; dados recebidos por props e cleanup GSAP local.

- **17/11/2026 — alinhamento e EasyChat:** centralizar títulos de apresentação da home e seus grupos de conteúdo, preservando níveis h1/h2/h3 e escalas. Hero com título, descrição e ações no mesmo eixo; cursor de digitação fora da medida do texto. EasyChat com um único controle de GSAP para título/dispositivo, deslocamento por top inteiro em todas as larguras, espera da apresentação, refresh após fontes e cleanup local. Sem transformação/escala no ancestral do chat, nem fixação adicional.

- **17/11/2026 — nova escolha do usuário:** verdes da página em lima dos cards; soluções do hero apenas em texto, sem moldura, com surgimento suave. Avatar permanece sem animação.

- **17/11/2026 — prioridade atual:** movimento completo sem redução por aparelho/sistema; preto OLED #000000; retirar qualificadores públicos e “Saiba mais”; manter os dois trechos de NFC no mesmo fundo preto sem fade branco.
