# ezway

## Identidade

Google Sans, preto, branco e o rosa do logotipo formam a base. A navegação usa vidro noturno com tonalidade azul quase preta. Estados operacionais usam os tokens semânticos existentes. O lima mantém o papel de ação ou destaque nos capítulos que já o adotam.

| Papel | Aplicação |
| --- | --- |
| Rosa de marca | Logotipo, pontos de ênfase e CTA original do hero |
| Lima | Destaque funcional e CTA onde definido pelos tokens de superfície |
| Vidro noturno `rgb(5 7 13 / 38%)` | Header, borda fria a 32% e refração SVG em Chromium |
| Texto, bordas e foco | `--color-ink`, `--text-secondary`, `--surface-line` e `--ring` |

## Tipografia e composição

- Google Sans com fontes de sistema como fallback. Hero fluido com máximos de 54 px no celular e 62 px no desktop. Títulos de serviço até 64 px e títulos da conta até 56 px. Texto de formulário a 16 px.
- Grid de referência de 4, 8 e 12 colunas. Os layouts existentes implementam a divisão conforme o conteúdo, com coluna única em telas estreitas, duas colunas para conteúdo e apoio e três onde houver espaço para agrupamentos. Abaixo de 768 px, reduzir gutters e revisar a quebra de ações.
- Usar múltiplos de 4 px para espaçamento. Separar grupos pelo espaço antes de adicionar molduras. Proteger a leitura em cabeçalhos, navegação, consentimento e formulários.

## Superfícies e controles

- O hero usa o vídeo de produto com imagem de poster, camada de contraste e gradiente na divisa com a seção seguinte. Avatar e CTAs usam os componentes originais.
- Header liquid glass noturno com borda translúcida de 1 px, reflexo interno discreto e mapa de deslocamento SVG no backdrop em Chromium. O fallback usa blur de 16 px. A opacidade sobe para 62% ao rolar e nas páginas internas. Sem suporte a blur ou com transparência reduzida, usa fundo sólido #080a10. Modos de alto contraste usam as cores do sistema. O dashboard mantém navegação opaca.
- Ações compartilhadas em superfície sólida, contornada ou sem fundo conforme a hierarquia. Os CTAs de destaque usam o modelo original com seta circular e preenchimento animado. As escolhas de consentimento usam os modelos de origem. Preservar destino, nome acessível e disponibilidade de cada ação.
- Portal com superfícies sólidas, bordas discretas, campos de 48 px e títulos de seção graduados. Manter visíveis os estados de erro, processamento e ausência de dados.

## Motion

- Usar 160 ms no feedback de controles e 250–400 ms nas transições de conteúdo. O conteúdo continua legível com movimento reduzido. As preferências já aprovadas para as cenas da home e os pop-ups seguem o documento mestre.
- GSAP coordena as cenas de scroll existentes. Motion continua responsável por transições locais onde já é usado. Priorizar transform e opacidade, manter o gradiente na divisa do hero. O vídeo de produto aparece também na seção de demonstração.

## Referências e evidência

- Inspo e Awwwards informaram a composição fotográfica editorial em tela cheia de Foster + Partners, o uso de horizonte fotográfico, espaço ao redor do título e transições reservadas a momentos de destaque. Taste Skill e UI/UX Pro Max orientaram consistência, hierarquia, controles de toque e foco. [Foster + Partners](https://www.fosterandpartners.com/) · [Exo Ape](https://www.exoape.com/) · [Kkaa](https://kkaa.co.jp/) · [NB Studio](https://nbstudio.co.uk/) · [BREYDAQS](https://breydaqs.com/)
- Chrome DevTools no ambiente local verificou a home a 320, 390, 768, 1024, 1440 e 1920 px. Essa rodada verificou a largura do conteúdo durante o refinamento. A 390 px verificou também as quatro páginas de soluções, as cinco páginas legais, a entrada do cliente e do operador, o estado de redefinição sem link e o redirecionamento das rotas protegidas.
- A inspeção da área autenticada ainda depende de sessão de teste para cliente e operador. O teste sem sessão confirma apenas os redirecionamentos. O banner de consentimento continua sobreposto ao conteúdo em janelas pequenas até a pessoa escolher.

## Revisão OLED

- A leitura do Inspo destacou o preto monocromático do KVS Studio. O Awwwards mostrou a Exo Ape usando fotografia em escala com navegação discreta. A ezway aplica o contraste ao próprio vídeo e mantém rosa, lima e Google Sans. [KVS Studio](https://kvs.services/) · [Exo Ape](https://www.exoape.com/)
- Magic UI Animated Beam conecta os nós do diagrama institucional. A versão local suspende o feixe fora de vista e mantém o traçado em movimento reduzido. A adaptação React Bits TextType dá ritmo ao título do hero. Os menus shadcn/Base UI preservam navegação por teclado.
- No Chrome DevTools, a home renderizou sem overflow horizontal a 320, 390, 768, 1440 e 1920 px. A revisão OLED anterior verificou a borda branca de 1 px. O refinamento atual usa vidro noturno com tonalidade fria. A revisão de telas estreitas ajustou a quebra dos seletores de Mini-Sites e afastou os rótulos do diagrama das bordas. O painel de cookies continua sobreposto à parte inferior do hero no primeiro acesso.

## Cards de Além da gestão

- Sete capítulos utilizam os nomes e as entregas do catálogo público. A seção mantém a pilha vertical e sua paleta rosa, lima, preto OLED, lavanda, amarelo e azul, com Google Sans. O cartão NFC mantém o fundo preto e a arte existente da placa.
- Sites, portfólio e landing pages usam imagens de demonstração existentes. Cardápio mostra uma interface ilustrativa com categorias. EasyChat usa um fluxo visual simplificado e mantém o estado em desenvolvimento. Suporte conecta diagnóstico e definição de solução.
- Em telas altas, a prévia fica abaixo do texto e as entregas aparecem em etiquetas. Em paisagem baixa, o cartão divide texto e prévia em duas colunas. Sem JavaScript, os itens ficam acessíveis no grid normal.
- Somente a prévia do cartão ativo recebe entrada de 360 ms, com opacidade e deslocamento de 6 px. Com preferência de movimento reduzido, as prévias continuam estáticas. Imagens reutilizam os assets existentes e reservam espaço no cartão.
- O Inspo mostrou na Fellow como manter a prévia e sua superfície na mesma família tonal. A Exo Ape, via Awwwards, orientou a proporção entre título e demonstração visual. [Fellow](https://fellowproducts.com/) · [Exo Ape](https://www.exoape.com/)

## Refinamento das demonstrações nos cards

Os sete capítulos preservam o catálogo e a pilha colorida. Cada card tem título, descrição curta e uma demonstração que ocupa a altura restante. As entregas em etiquetas foram retiradas para dar espaço à demonstração. EasyChat mantém o status de desenvolvimento.

Sites, portfólio e landing pages usam uma janela de navegador com as imagens existentes. Cardápio e EasyChat usam o iPhone do Magic UI, com interface ilustrativa adaptada às informações do catálogo. O suporte usa Avatar do shadcn/Base UI e as etapas do processo existente. As consultas aos registries Magic UI e React Bits confirmaram os componentes disponíveis. A pilha continua coordenada por GSAP e o título da seção mantém o componente de revelação já instalado.

A entrada do mockup ativo dura 500 ms e usa opacidade e translação. A animação termina após a entrada. Em movimento reduzido, o conteúdo permanece estático. Reflexos, textura de pontos e blur nos cards foram retirados. Em paisagem baixa, texto e demonstração dividem a largura. Em telas verticais, a demonstração ocupa a área abaixo da descrição.

## Transições transitions.dev

Os snippets oficiais foram obtidos pela CLI transitions-dev. O carregador usa o identificador publicado skeleton-reveal. Os tokens e classes t-* ficam em src/styles/transitions.css.

Dropdowns Base UI usam abertura de 250 ms, fechamento de 150 ms, escala inicial de 0,97 e origem no gatilho. As imagens do MacBook usam page-side-by-side com deslocamento horizontal de 8 px, blur de 3 px e dissolução, amostrados pela timeline GSAP para permitir retorno pelo scroll. A distância mais longa da seção foi preservada.

O campo de senha usa error-state-shake em respostas de credenciais inválidas, com deslocamento de 6 px, recuperação de 4 px e duração total de 280 ms. A mensagem de erro permanece disponível para leitura. Editar o campo limpa a indicação visual.

O Skeleton compartilhado usa o pulso do snippet. SkeletonReveal cruza o placeholder e os dados da conta em 400 ms, com blur de 2 px. O conteúdo só recebe interação quando disponível. Cada transição respeita prefers-reduced-motion.

A camada óptica do header usa o mapa de refração já existente no projeto, com escala de deslocamento 0,055 e centro mais estável. O filtro afeta apenas o backdrop. Controles e texto ficam em outra camada. Safari e Firefox usam o vidro translúcido com blur. Não há animação contínua do filtro.

O filtro refrativo da navegação recebeu blur adicional (desvio normalizado 0,003 × 0,07), mantendo a distorção das bordas e os controles em camada independente.

## Botões Cnippet

O componente fornecido foi integrado em src/components/ui/cnippet-button.tsx, com variantes, tamanhos, loading, renderização polimórfica e bloqueio de ativação quando desabilitado. Os imports usam @base-ui/react, já instalado. O pacote antigo @base-ui-components/react não apresentou versão disponível no registro consultado.

O modelo usa preto e branco. Primário é preto com texto branco e secundário é branco com texto preto. Bordas neutras definem o contorno e o raio é 8 px. Alvos do produto têm altura mínima de 44 px. O componente Button legado encaminha suas propriedades ao novo modelo. Os botões de formulário, consentimento e CTAs compartilham a linguagem. A ação rosa original do hero conserva seu componente e comportamento.

Os tokens e adaptações monocromáticas ficam em src/styles/buttons.css. O arquivo global principal permanece src/app/globals.css e os componentes seguem o alias shadcn @/components/ui. O demo de variantes está em src/components/ui/cnippet-button-demo.tsx.
