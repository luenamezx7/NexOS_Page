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
