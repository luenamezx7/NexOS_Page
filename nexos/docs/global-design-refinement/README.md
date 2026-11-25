# Refinamento global EZWAY — 24/11/2026

## Implementação

O refinamento mantém a direção existente e não substitui os assets da marca. Não houve deploy nem adição de dependências.

| Área | Alteração e motivo |
| --- | --- |
| Hero | “Presença” alongada verticalmente (1,4 desktop / 1,55 mobile), escala horizontal discreta e camada própria para evitar disputas de transform. Máscara WebGL acompanha a escala; fallback rosa e granulação preservados. Revelação por máscara no elemento externo. Menos espaço acima da chamada. CTAs originais preservados. |
| Gestão | Prévia ilustrativa navegável de clientes, vendas e financeiro no lugar do login isolado. Dados fictícios identificados, sem conexão com o CRM. Geometria reservada entre estados. |
| Header | Vidro escurecido em todas as seções, conforme a orientação final do usuário, sem mudança de altura. Estado de localização na navegação e foco preservado. |
| Além da gestão | Sem redesign ou mudança nos componentes da pilha. A preferência real de movimento passa a ativar sua alternativa estática já existente. |
| EasyChat | Solicitação, preparação do rascunho e revisão explicadas ao redor do telefone. Documento ilustrativo no desktop. Mensagens entram progressivamente com indicador de digitação; a sequência pausa em aba oculta e reinicia quando o telefone volta à viewport. Status de desenvolvimento preservado. |
| Sites e notebook | Chassi e transições GSAP preservados. Ajustes de hierarquia semântica e nomes acessíveis dos controles. |
| Mini-Sites | Três dispositivos e composição existentes preservados. Animação respeita movimento reduzido e exibe leque estático nessa preferência. |
| Placas NFC | Somente o design Instagram fica exposto, centralizado, por orientação final do usuário. Os demais designs saem desta vitrine; catálogo e destinos subjacentes são preservados para a futura substituição. QR e contato do Instagram mantidos. Nome acessível aproveita o conteúdo visível. Diálogo nativo mantém teclado, Escape e retorno de foco. |
| Comparação | Vídeo genérico removido da home. Sem/Com EZWAY agrupa operação, presença digital e contato presencial. Cada par permanece junto no celular. EasyChat aparece separadamente como projeto em desenvolvimento. CTA usa o diagnóstico comercial existente. |
| Processo | Etapas inativas legíveis, sem blur. Segmentos de conexão mostram o percurso concluído e revertem ao voltar o scroll. Estrutura vertical no celular. |
| Suporte | Cilindro preservado com menor curvatura, controles anterior/próximo, pausa e gesto horizontal. Toque vertical continua rolando a página. |
| Diagrama | Nós conduzem às soluções correspondentes, com foco visível e cores distintas. Feixes existentes preservados. |
| FAQ | Accordion nativo, foco, estado selecionado e expansão com interpolação intrínseca onde suportada. Fallback nativo nos demais motores. |
| CTA e footer | Ação final utiliza o botão compartilhado. Mãos, marca ampliada e personagem preservados. Microinterações dos links e semântica das redes sociais ajustadas. |
| Botões | Feedback compartilhado de hover 1,035 / pressionado 0,97, setas reativas, foco e respeito ao movimento reduzido. Aplicação na landing; hero e cards aprovados excluídos. |

## Correção técnica de movimento

`usePrefersReducedMotion` retornava sempre `false`; `motionMedia` reescrevia as consultas do navegador; o plugin PostCSS removia regras de redução de movimento. A política agora respeita o dispositivo, inclusive em alterações durante a sessão. As animações normais continuam disponíveis. Os testes unitários verificam que as regras CSS chegam ao navegador.

A opacidade inicial dos títulos com preenchimento por scroll passou de 0,16 para 0,6. Títulos genéricos começam em 0,65; informações continuam legíveis antes do término da animação. O fade de saída que reduzia a visibilidade do CTA de gestão foi removido.

## Validação

Resultados finais e limitações são registrados após a rodada de navegador. Capturas por seção ficam em `test-results/global-design-refinement-*`; capturas selecionadas em `.impeccable/review/global/`.

## Apresentação em hardware limitado

Foi reproduzido um caso em que o worker aceita a inicialização mas não responde:
o mascote alternativo ficava oculto durante toda a abertura. O teste validou o
conteúdo efetivamente visível, e não apenas a presença do container no DOM.

A versão corrigida mantém o SVG da marca visível em `loading`, só adota o desenho
WebGL quando o worker confirma prontidão e aciona a alternativa animada após
1,8 s sem confirmação. Falhas de download, mensagem, transferência ou renderização
usam a mesma recuperação. A alternativa preserva a revelação e os olhos animados,
sem exigir GPU. O worker interrompido é encerrado e seus observadores são limpos.
O prazo de saída e a liberação de foco/scroll continuam independentes da GPU.

O GradualBlur existente foi habilitado somente na borda inferior da viewport,
como elemento irmão da página: três camadas, faixa de 44–72 px, sem listeners de
scroll, interação ou animação extra de filtros. Acompanha todas as seções e fica
abaixo dos diálogos. Não foi adicionado blur superior.

## Resultado da validação

- Build de produção e TypeScript: aprovados após as alterações finais.
- Lint completo: zero erros; 39 avisos em código gerado/componentes existentes. A rodada final `eslint --quiet` passou. `git diff --check` passou.
- Unitários: 10 aprovados. Segurança: 9 aprovados. Proteção de entrada: 9 aprovados. Nenhuma regra dessas áreas foi alterada.
- Navegador Chrome: 17 regressões da pilha aprovada, 25 cenários do refinamento global/header/shader/notebook e 11 cenários finais de apresentação/blur aprovados em rodadas incrementais. As duas falhas intermediárias (referência de centralização no teste e transição residual do menu) foram corrigidas e revalidadas.
- As dez larguras pedidas passaram: 320, 375, 390, 430, 768, 1024, 1280, 1440, 1920 e 2560 px. A pilha foi testada também em paisagem curta e reversões rápidas de scroll.
- A recuperação da apresentação foi reproduzida antes da correção (mascote oculto com worker silencioso) e passou depois em quatro falhas simuladas com CPU 6× mais lenta. A versão WebGL normal, piscada, Retina, hidratação atrasada e bloqueio da thread principal também passaram.
- Mensagens do EasyChat: revelação progressiva, digitação e repetição ao reentrar verificadas. Menu: fundo do título transparente, Escape e foco verificados. Placa: somente Instagram e alinhamento central dentro da vitrine verificados.
- GradualBlur: posição fixa relativa à viewport, persistência entre seções e toque atravessando o overlay verificados.

## Limites da evidência

As verificações de navegador usaram Chrome em desktop e emulação mobile/touch. Não equivalem a testes em aparelhos físicos ou Safari/Firefox. A medição final com o gradual blur teve mediana e p95 de 16,7 ms nas amostras em velocidade normal, sem tarefas longas ou layout shifts. Com CPU 4× mais lenta, o p95 foi 49,9 ms no mobile e 33,4 ms no desktop, com tarefas longas pontuais; não há promessa de 60 fps universal. A abertura em worker teve p95 de 16,8 ms no teste final com thread principal bloqueada.

O Lighthouse final (snapshot mobile, 390×844, movimento reduzido) registrou 100 em acessibilidade, boas práticas e SEO técnico: 41 auditorias passaram e nenhum achado permaneceu. Isso não comprova conformidade WCAG completa nem posicionamento em buscadores. O detector marcou somente dois gradientes tipográficos preservados pelo briefing.

Persistem avisos de fallback de fonte Google Sans na build, licença Remotion e resolução de IP no servidor local. A build de produção amostrada não apresentou erros de runtime ou recursos HTTP falhos. O DevTools persistente no servidor Turbopack mostrou preloads 404 de chunks dinâmicos de QR/wave seguidos de carregamento do hash válido; isso não foi reproduzido na build de produção e não foi tratado como a causa do mascote vazio.

A skill oficial `ChromeDevTools/chrome-devtools-mcp/skills/chrome-devtools` foi instalada em `~/.codex/skills/chrome-devtools`; suas instruções foram lidas e aplicadas. O instalador precisou usar Git após uma falha de certificados no download Python. Não foram desativadas verificações TLS.

A descrição final do hero foi refinada com a confirmação do usuário sobre sites, SEO e GEO: “Organize clientes, vendas e financeiro. Criamos sites com SEO e GEO para ampliar a visibilidade do seu negócio no Google e nas buscas com IA.” As versões inglesa e espanhola também foram atualizadas.
