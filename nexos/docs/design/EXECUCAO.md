# Acompanhamento — refatoração cinematográfica ezway

Plano: [documento mestre](./PLANO-MESTRE-REFATORACAO-DESIGN.md).

## Alinhamento da home e fundo do MacBook — 21/11/2026

- Removido o bloco de abas da placa: “Como funciona”, “Sua marca” e “Para seu espaço”, com seus respectivos textos.
- Retirada a centralização global de títulos e parágrafos. A abertura da placa acompanha o centro da vitrine; atendimento, sobre, FAQ e contato seguem o eixo de leitura à esquerda, com ações e textos relacionados no mesmo alinhamento.
- Fundo do MacBook com rosa `#ff3f9f` do wordmark e variações do mesmo matiz. WebGL com antialias, resolução até DPR 2, orçamento de pixels limitado e malha mais fina para suavizar bordas e facetas.
- Cinco testes existentes aprovados no Chrome: transições reversíveis do MacBook em 390/1366 px e responsividade em PT/EN/ES. Revisão geométrica de cinco seções em 320/390/768/1440 px sem overflow, com capturas inspecionadas em celular e desktop. Canvas retina confirmado em 2796 × 1800 para área CSS de 1398 × 900, antialias ativo.
- Lint dos arquivos TypeScript alterados, tipos e build aprovados. O build reportou aviso de compactação de cache e o fallback de Google Sans já conhecido. Alterações locais, sem novo deploy.

## Portal Silk, código por e-mail e templates — 21/11/2026

- Implementação local autorizada, sem novo deploy. Login final com apenas um painel centralizado; logotipo e mascote dentro dele. Removidos o painel lateral e os elementos externos de navegação/rodapé do acesso do cliente.
- Shader Silk WebGL1 com os uniforms fornecidos, DPR até 2, resize, pausa em aba oculta, fallback e recuperação de contexto. Corrigidos somente os dois erros de transcrição do GLSL. Conta e segurança usam a mesma moldura e o vidro claro esverdeado.
- Componente OTP em `src/components/ui`, com colagem, autofill, teclado, feedback animado e movimento reduzido. Substitui o link mágico no login; o código é validado pelo Better Auth no servidor, com HMAC no armazenamento, dez minutos, cinco tentativas, uso único, CAPTCHA de envio, limites de requisição e MFA preservado. Nenhum serviço novo nem migração.
- E-mails de acesso, confirmação, recuperação, boas-vindas e notificações compartilham `src/emails/layout.tsx`. O banner futuro é opcional e centralizado em `EMAIL_BRAND.banner`, sem placeholder quando ausente.
- Redefinição de senha atualizada para o mesmo painel centralizado, Silk e vidro claro, incluindo sucesso, link ausente e erro de expiração. Composição compartilhada em `CustomerAuthPanel.tsx`. Nova rodada: 13 testes de recuperação/regressão aprovados no Chrome, de 320 a 1440 px; build, tipos e lint dos arquivos alterados aprovados.
- Build e tipos aprovados. Lint dos arquivos alterados aprovado; lint global anterior com zero erros e nove avisos preexistentes. Segurança 9/9 e unidades 7/7. Servidor: 17 regressões e três cenários novos de OTP aprovados entre as rodadas, em schema isolado removido ao final.
- Chrome: 36 cenários distintos do portal/login aprovados entre as rodadas, mais seis de código por e-mail e dois de recuperação/MFA. Teste autenticado local aprovado em 390, 820, 1440 e 1920 px, incluindo edição/cancelamento, carregamento/erro e logout; conta temporária removida. Perfil e envio de e-mail das fixtures não usam dados reais.
- Templates: seis testes de renderização aprovados, com dez capturas em 320/600 px sem overflow. Não houve disparo de mensagens para usuários reais nem teste de entrega em caixa postal.
- Limitação: WebKit instalado estava incompleto; a tentativa de reinstalação encontrou restrição de espaço e não concluiu. Safari/iPhone físico não foi homologado. Builds terminaram com sucesso, mas a gravação da cache Turbopack em disco reportou falta de espaço; aviso preexistente de fallback de Google Sans permanece.

## Retomada e publicação autorizada — 20–21/11/2026

- O usuário autorizou concluir a validação e publicar. A base é `41281a4`, com novo login, navegação direta e redirecionamentos das quatro páginas de serviços para a home.
- Finalizados contraste do painel do login, raio dos botões, espaço de feedback e divisor entre senha e alternativas de acesso. Capturas atualizadas em 390, 820 e 1440 px.
- Corrigido o processamento de CSS: as regras de movimento reduzido já previstas em `LoginForm.module.css` eram removidas pelo plugin de movimento completo. A exceção fica restrita ao formulário e às receitas de interação existentes; o comportamento cinematográfico da home permanece.
- Atualizado o teste de diálogos para a vitrine de placas atual, cobrindo botão, Escape, retorno de foco e liberação do scroll. A simulação de gestão citada no histórico abaixo foi removida em alterações posteriores.
- Build final e TypeScript aprovados. Lint global: zero erros e nove avisos preexistentes. Segurança: 9/9; compatibilidade de senha: 6/6; unidades: 7/7.
- Navegador Chrome: 41 cenários distintos aprovados entre as rodadas; repetição final de login/copy/diálogos: 22/22. Inclui erro de credenciais, rede, limites, senha visível, movimento reduzido, callback, responsividade, navegação, cabeçalho e perfil de scroll.
- Publicação pelo Git na `main`, projeto Vercel `nex-os2/nexos`, raiz `nexos/`. O arquivo não rastreado `../.vercelignore` foi preservado fora deste commit.
- Os registros abaixo são históricos e não comprovam o estado atual de produção. O build conserva o aviso de fallback de Google Sans; a rodada local não valida biometria física nem entrega de e-mail real.
- Primeiro deploy desta retomada: `9b8a976`, READY, `nexos-khly9p331-nex-os2.vercel.app`, com domínio canônico e alias Vercel associados. Verificação de entrada no navegador aprovada. O smoke remoto foi alinhado ao redirecionamento permanente de `/placa-nfc` para a home, conferindo que a página de destino continua protegida pelo Turnstile.
- Verificação remota após o alinhamento: 7/7 testes HTTP e 1/1 teste de navegador aprovados. Consulta dos logs de erro do primeiro deploy, nos dez minutos anteriores, retornou zero registros. Nenhuma conta criada ou e-mail real enviado.

## Situação

- Etapa 0 — **concluída:** documento mestre e acompanhamento gravados.
- Etapa 1 — **em andamento:** referência visual, mapa técnico e diagnóstico.
- Etapa 2 — **em andamento:** parâmetros compartilhados de movimento; consolidação completa de estilos ainda pendente.
- Etapa 3 — **pendente**.
- Etapa 4 — **em revisão:** entrada do texto do hero em GSAP. Avatar e card estáticos; alternância automática direta a cada três segundos, sem seletores ou controles.
- Etapa 5 — **implementada, em revisão visual:** capítulos de Comercial/Clientes/Financeiro por scroll, telas reais diretas sem MacBook e simulações locais identificadas/reiniciáveis.
- Etapa 6 — **em andamento:** cards de “Além da gestão.” e correção do scroll/alinhamento do EasyChat implementados; demais cenas pendentes.
- Etapas 7–11 — **pendentes**.

## Checkpoints

- Avatar/pop-ups: nenhuma animação, pinning, fade, zoom ou deslocamento. Pop-ups automáticos, sem controles. Essa correção do usuário prevalece sobre a versão 2 do plano.
- Cards animados com scroll preso pertencem a “Além da gestão.”. “Controle & Gestão” não deve ter MacBook. Restante do plano mestre mantido.
- Aparência: A (verde) permanece padrão. Se a comparação com B ainda for solicitada, mostrar capturas; não criar seletor na página ou prévia.
- Não publicar sem revisão final/autorização.
- Limitações de acesso ao portal autenticado devem ser registradas; não contornar autenticação.

## Ambiente inicial

- Checkout compartilhado Cursor/Orca; fonte inicial `bcd6fb0`.
- Local compartilhado: http://localhost:3000.
- Branch atual: `design/cinematic-refinement`, no mesmo checkout. Nenhum push/deploy desta rodada.
- Next 16.4.6, GSAP 3.15, Motion 13 e Lenis já instalados.
- Skills e `skills-lock.json` têm alterações do usuário, preservadas fora do escopo.

## Histórico

- 17/11/2026 — plano aprovado transcrito e execução iniciada.
- 17/11/2026 — launcher ajustado para localizar o checkout principal pelo caminho, sem depender de estar na branch main.
- 17/11/2026 — primeiro build e tipos passaram; testes detectaram interferência de transformações responsivas. O usuário solicitou retirar completamente o movimento do avatar/card.
- 17/11/2026 — removidos pinning e timeline do avatar, AnimatePresence/Motion do card, controles e rota de comparação. Timer mantido em 3 s, pausado apenas fora da tela, durante apresentação e com aba oculta. Nenhum seletor exibido.
- 17/11/2026 — esclarecido o alvo dos cards: seção “Além da gestão.”. Implementados cards rosa, verde e preto; soluções expandidas com tons complementares. GSAP fixa apenas a cena e desloca a faixa de cards com scrub suave; após o último card, a página segue o fluxo normal. Sem interceptar wheel/touch.
- 17/11/2026 — versão 4 do plano registra gestão sem MacBook. Nenhuma moldura de notebook adicionada à gestão. Navegação por teclado revela os cards fora do enquadramento; celular, telas baixas e movimento reduzido mantêm fluxo natural.

## Limitações desta parte

- Conta, segurança e painel autenticados ainda não foram auditados visualmente com uma sessão autorizada.
- Demais cenas cinematográficas, páginas públicas e portal ainda pendentes. Cards de “Além da gestão.” e etapa 5 da gestão já implementados.
- Etapa 4 permanece em revisão visual; a parte funcional desta rodada foi validada.

## Evidência visual atual

- [Avatar e pop-up estáticos — 390 × 844](./evidencias/avatar-estatico-mobile-390.png): local compartilhado após as correções. Aviso de desenvolvimento preservado; nenhum controle de alternância exibido.
- Inspeção no navegador: zero botões/seletores no bloco, zero animações em sua subárvore e nenhum pin-spacer ancestral.
- Build de produção aprovado após retirada da animação e da rota de revisão. Permanece o aviso preexistente de fallback de Google Sans.
- ESLint dos arquivos de implementação/testes alterados: aprovado.
- Rodada final: **33 testes de navegador aprovados** (Chrome, 2,9 min), cobrindo ausência de movimento/seletores em cinco larguras, alternância automática, traduções, ausência de JS, CTAs, âncoras, reload e apresentação.
- Nenhum push ou deploy realizado nesta rodada.

## Evidências — cards de “Além da gestão.”

- [Desktop — 1200 × 850](./evidencias/alem-da-gestao-desktop-1200.png): título estático e cards na faixa horizontal; apenas os cards recebem deslocamento.
- [Celular — 390 × 844](./evidencias/alem-da-gestao-mobile-390.png): sequência vertical, sem fixação e sem overflow lateral.
- Build de produção e tipos aprovados. Aviso preexistente de fallback de Google Sans permanece.
- ESLint dos três arquivos desta parte e `git diff --check`: aprovados.
- **19 testes de navegador distintos aprovados entre as rodadas**: cinco específicos dos cards (pin/liberação, teclado e alternância de preferência, celular, tela baixa, ausência de JS), sete da jornada de gestão/catálogo e sete de avatar/pop-ups. O teste de teclado foi ajustado para aguardar a navegação da abertura antes de exercer o foco; a limpeza do transform ao sair da cena também foi corrigida e validada.
- Limite da cena: 180% da altura útil, sem bloquear scroll global. Encerrada a sequência, o spacer do ScrollTrigger devolve a página ao fluxo normal. Mudanças de breakpoint/preferência revertem a cena.
- Gestão permanece com screenshot direto, sem MacBook. Capítulos da gestão e simulações locais continuam pendentes na etapa 5; demais itens do documento mestre preservados.
- Prévia: http://localhost:3000/#ecossistema, checkout compartilhado Cursor/Orca. Nenhum push/deploy nesta continuação.

## Correção — animação em todos os dispositivos

- A pedido do usuário, removidos os limites de largura, altura e ponteiro da cena “Além da gestão.”. A sequência com fixação e scrub agora também funciona em celular, tablet e telas baixas/deitadas.
- Em celular, cada card ocupa a largura útil; em paisagem baixa, conteúdo em duas colunas para caber entre o cabeçalho e o rodapé da tela. Detalhes expandidos podem rolar internamente.
- Preferência de movimento reduzido e ausência de JS continuam com conteúdo estático legível. Avatar e pop-ups seguem sem animação; gestão segue sem MacBook.
- As capturas mobile anteriores registram a versão 4 e foram substituídas como referência de comportamento pela decisão da versão 5 do plano.

## Ajuste — sequência vertical e cards compactos

- “Além da gestão.” passou a sete cards: sites, cardápios, NFC, portfólios, landing pages, EasyChat e suporte. Textos comerciais existentes preservados para detalhamento posterior pelo usuário.
- Movimento vertical, de baixo para cima, em todos os dispositivos; título estático e liberação do scroll após o último card. O comprimento da cena acompanha o deslocamento da sequência.
- Formato reduzido: 240 px de altura na apresentação padrão, 260 px em celulares estreitos, 180/150 px em paisagem baixa. Telas maiores usam título e descrição em duas colunas.
- Capturas anteriores desta seção são históricas: a versão atual corresponde ao documento mestre v6.

## Proporção final — cards verticais e altos

- Orientação mais recente do usuário: cards em formato vertical, preenchendo mais a altura da tela. Substitui as dimensões compactas da seção anterior.
- Altura calculada pela área útil abaixo do cabeçalho e do título, com margem inferior de 24 px. Largura máxima de 400 px na apresentação vertical; ajuste de leitura em paisagem baixa.
- Sete cards, movimento vertical e fixação em todos os dispositivos mantidos. Conteúdo detalhado fica para revisão posterior.

### Validação da proporção final

- Build de produção, TypeScript, ESLint dos arquivos alterados e `git diff --check` aprovados. Aviso preexistente de fallback de Google Sans permanece.
- Nove testes finais dos cards aprovados (Chrome): sequência vertical, sete itens e chegada ao último, liberação do pin, teclado, troca de preferência, ausência de JS e seis formatos de toque/tela (320×568, 390×844, 768×1024, 844×390, 568×320, 1440×700).
- A rodada anterior com gestão/catálogo e avatar/pop-ups teve 23 testes aprovados; o ajuste final de proporção foi verificado novamente nos nove testes específicos.
- Evidência atual: [celular vertical, 390×844](./evidencias/alem-da-gestao-vertical-mobile-390.png) e [desktop, 1200×850](./evidencias/alem-da-gestao-vertical-desktop-1200.png).
- Prévia compartilhada: http://localhost:3000/#ecossistema. Nenhum push/deploy nesta rodada.

## Etapa 5 — gestão e demonstrações locais

- GSAP fixa a cena da gestão em desktop compatível (1200×800 ou maior, ponteiro fino, movimento normal) e percorre Comercial, Clientes e Financeiro. React atualiza apenas nas divisões dos capítulos. Escolha manual permanece até a próxima divisão; resize e movimento reduzido revertem a fixação.
- Screenshots reais protegidas continuam sem MacBook, sem zoom ou transformação durante a leitura; ampliação e aprofundamentos preservados. Layout de duas colunas apenas na cena fixada. Em telas menores, seleção e leitura seguem no fluxo normal.
- Motion controla indicador de seleção, descrição e troca dos painéis das simulações. A imagem real permanece nítida e estável.
- Demonstração carregada ao solicitar, em dialog nativo com fechamento por Escape, foco e trava de scroll. Dados fictícios, somente memória, sem conexão ou gravação no CRM.
- Comercial: duas oportunidades fictícias, etapa e próximo retorno editáveis. Clientes: dois clientes e históricos ilustrativos. Financeiro: três períodos de dados fixos. Reiniciar limpa todos os estados; fechar e reabrir também reinicia.
- Corrigido o seletor do teste antigo para distinguir abas do novo botão de demonstração. A primeira rodada teve um fechamento isolado do Chrome ao navegar em 1024 px; o caso foi repetido e passou.
- Etapas posteriores do plano permanecem pendentes; nenhum push/deploy realizado.

### Validação da etapa 5

- Build de produção e TypeScript aprovados; ESLint dos arquivos alterados e `git diff --check` aprovados.
- **20 testes distintos aprovados entre as rodadas**: nove dos cards de “Além da gestão.”, sete da gestão/catálogo e quatro novos de capítulos/simulações. A repetição dirigida após os ajustes passou nos seis casos selecionados; o ajuste final de cores dos campos/barra de rolagem também passou nos dois testes de demonstrações em 390 e 1440 px.
- Cobertura nova: escolha manual até a próxima divisão de capítulo, sequência por scroll, limite visual da cena, resize sem pins duplicados, movimento reduzido, edição/retorno por oportunidade, histórico, períodos, reinício, fechamento/reabertura, trava de fundo, retorno do foco e nenhuma requisição de gravação durante a simulação.
- Evidências: [gestão no desktop, sem MacBook](./evidencias/gestao-capitulos-desktop-1200.png) e [simulação no celular](./evidencias/gestao-simulacao-mobile-390.png).
- Prévia compartilhada Cursor/Orca: http://localhost:3000/#gestao. Etapa 5 implementada para revisão; demais itens do plano continuam com o status registrado acima. Sem push/deploy.

## Cards de vidro — integração do script fornecido

- Criado `src/components/ui/glass-cards.tsx`, exportando StackedCards com dados tipados por props. Estilos em CSS Module junto do componente; estrutura shadcn já configurada em components.json, Tailwind e TypeScript existentes. Nenhuma dependência nova necessária (GSAP já instalado).
- Substituído o deslocamento da faixa pelo empilhamento do exemplo: entrada vertical de cada card, escala regressiva dos anteriores, origem no topo, borda conic-gradient, reflexos, brilho e textura de vidro.
- Sete soluções e suas cores mantidas. Títulos e descrições renderizados; o exemplo original recebia esses dados mas não os exibia. Textos alinhados à esquerda e blocos padronizados.
- Largura máxima ampliada de 400 para 640 px; margem lateral de 16 px no celular. Altura útil continua calculada pelo espaço restante na tela.
- Integração adaptada ao Next: client boundary e import de GSAP apenas no efeito, sem cardData inexistente em utils, sem segundo hero/h1/main. Contexto e cleanup locais; não usar ScrollTrigger.getAll().forEach(kill), pois destruiria gestão e outras cenas.
- Mantidos teclado, dados fictícios de demonstrações, ausência de JS e movimento reduzido. Vidro com blur apenas no card ativo. Nenhuma imagem adicional necessária neste componente.

### Validação dos cards de vidro e da largura ampliada

- Build de produção, TypeScript, ESLint e `git diff --check` aprovados.
- Nove testes finais de navegador aprovados: escala/empilhamento, sete cards, último card/liberação, teclado, movimento reduzido, preservação do pin da gestão, conteúdo sem JS e seis formatos responsivos/toque.
- A rodada anterior também aprovou os sete testes do avatar/pop-ups e os quatro de gestão/simulações. Nenhuma animação global é removida pelo novo componente.
- Corrigidas as verificações que ainda mediam deslocamento da faixa; agora verificam escala dos cards, empilhamento e nova largura responsiva.
- Evidências atuais: [desktop com cards até 640 px](./evidencias/glass-cards-desktop-1200.png) e [celular com largura útil ampliada](./evidencias/glass-cards-mobile-390.png).
- Prévia compartilhada: http://localhost:3000/#ecossistema. Nenhum push/deploy.

## Centralização dos títulos, hero e correção do EasyChat

- Títulos h2/h3 de apresentação da home centralizados dentro de seus grupos, mantendo níveis e tamanhos. Títulos/descrições dos cards, introdução da gestão e introdução/badge do EasyChat acompanham o eixo do conteúdo. Formulários e rótulos operacionais preservam suas estruturas.
- Hero com coluna de texto alinhada pelo centro, descrição e ações no mesmo eixo, botão responsivo e cursor de digitação absoluto para não deslocar visualmente a palavra.
- Corrigido PhoneScrollHero: antes, o celular recebia transform no ancestral da conversa, com um segundo comportamento por breakpoint, e o título também era controlado pelo HeadingScrollMotion. Agora título com data-heading-static e uma única timeline local usa top inteiro em todas as larguras, sem escala/filtro no texto do chat.
- Inicialização espera a apresentação, atualiza medidas após fontes e resize, reverte ao mudar para movimento reduzido e registra falhas de importação. Conversa/status de desenvolvimento e rolagem natural mantidos, sem pin adicional.

- Corrigida também a rolagem interna do hero: overflow hidden criava um scroll-container que podia deslocar o conteúdo ao focar. Usado overflow clip, mantendo o recorte sem scroll interno; título continua abaixo do cabeçalho.
- Destaque da segunda linha do EasyChat usa a opção multiline, com box-decoration-break clone e tinta sólida sobre o destaque para acompanhar quebras sem distorção.

### Validação da centralização e do EasyChat

- Quatorze testes aprovados na rodada dirigida: quatro de alinhamento/EasyChat, sete do avatar/pop-ups e três da conversa do EasyChat. Hero abaixo do cabeçalho em 320, 390, 768 e 1440 px; avatar e pop-ups sem animação preservados.

## Scroll global, MacBook e estabilidade no Instagram — 17/11/2026

### Referência e diagnóstico

- Analisado o código público e os recursos de [Stellar Gaming](https://stellargaming.com/): Lenis 1.1.18 com duração de 1,2 s, RAF próprio e GSAP/ScrollTrigger. A referência orientou o peso e a desaceleração; nenhuma biblioteca adicional foi instalada.
- No MacBook, havia amortecimento próprio por RAF sobreposto ao scroll suave e ao progresso da cena. O layout também variava com o texto de cada demonstração.
- Alturas móveis baseadas na viewport variável podiam reconstruir cenas e alterar o comprimento da página durante a abertura/fechamento da barra do navegador. Overflow hidden em regiões focáveis podia produzir scroll interno.

### Implementação

- Um Lenis para ponteiro fino e movimento normal: duração de 1,2 s, desaceleração cúbica, wheelMultiplier 0,9 e continuação após soltar a roda em ambos os sentidos. Sem sincronização artificial do toque. Ao retornar à aba, descartar alvo antigo antes de reiniciar o RAF.
- Toque, movimento reduzido e navegadores embutidos usam scroll nativo. Instagram/Facebook/LINE/TikTok são identificados pelo user-agent; links internos são imediatos nesses contextos para não disputar com o gesto.
- Altura de cena estabilizada em toque e navegadores embutidos: ignorar resize somente de altura; atualizar ao mudar largura/orientação. Processo e cards usam a mesma referência estável. ScrollTrigger ignora resize móvel de barra.
- MacBook com uma única interpolação GSAP local e scrub de 0,25 s; apenas a opacidade das telas muda. Chassi e áreas de título/legenda mantêm medidas estáveis. Seleção manual não rola a página e permanece até a próxima divisão real de capítulo.
- Overflow clip impede scroll interno na cena. Títulos e demonstrações não recebem outro controlador de animação. Cleanup restrito ao contexto local.
- Em navegadores embutidos, removidos blur de página inteira, backdrop-filter dos cards e perspectiva do notebook. Empilhamento, troca das telas e conteúdo continuam disponíveis.

### Verificação e limites

- Build de produção e TypeScript aprovados; ESLint dos arquivos alterados e git diff --check aprovados. Aviso preexistente de fallback de Google Sans permanece.
- **31 execuções de testes aprovadas:** cinco de estabilidade no Chrome; 23 de regressão no Chrome (alinhamento/EasyChat, cards, posição inicial/links diretos e gestão/simulações); três no WebKit (MacBook em 390 e 1440 px e perfil Instagram iPhone).
- Teste real de wheel no Chrome verificou continuação após soltar, ausência de reversão e intervalos de frame no ambiente de teste em ambos os sentidos. MacBook verificado quanto a geometria, chassi estável, seleção sem scroll e ausência de scroll interno.
- Perfis emulados de Instagram iPhone/Android verificaram ausência de Lenis, altura estável durante mudança de barra, ausência de overflow e avanço/retorno. Chrome também recebeu gestos de toque via CDP. WebKit cobriu o perfil iPhone e mudança de viewport.
- Emulação não substitui abrir o site no aplicativo Instagram em aparelhos reais. A validação física após publicação continua necessária; os resultados não constituem garantia de desempenho em todo aparelho/rede.
- Evidência: [MacBook estável no desktop](./evidencias/macbook-scroll-estavel-desktop-1200.png).
- Correções no local compartilhado http://localhost:3000. Sem push ou deploy nesta rodada. O documento mestre permanece parcialmente implementado.

## Correção do salto periódico no hero e alinhamento dos textos — 17/11/2026

- Reproduzido no Google Chrome: ao apagar a palavra inteira do título, o TextType passava de 63,94 px para 59,75 px de altura no desktop. A descrição e as ações subiam aproximadamente 4 px e voltavam quando começava a próxima palavra. A posição de scroll permanecia igual; o salto vinha do layout.
- TextType agora reserva a altura da linha (1lh) e mantém uma linha tipográfica com um caractere invisível via pseudo-elemento mesmo no quadro vazio. Digitação, troca automática dos pop-ups e avatar estático preservados.
- Alinhados os textos de apoio do processo, a observação do ecossistema, os parágrafos de Sobre nós e o texto/ação do convite final com o eixo central dos respectivos blocos e títulos. Campos operacionais e conversas mantêm sua estrutura.
- Conferência visual do convite final em 1200×850 e medição de eixos: título e descrição no mesmo centro horizontal.
- Validação final: sete testes aprovados no Chrome. Quatro de alinhamento/EasyChat em 320, 390, 768 e 1440 px; três amostram 14 segundos de digitação/pop-ups em 320, 390 e 1440 px, incluindo palavra vazia, e confirmam variação menor que 1 px no título, descrição, ações, altura do hero e posição da página. Alinhamento dos textos corrigidos também verificado.
- Build/TypeScript, ESLint do teste e git diff --check aprovados. Sem push/deploy; disponível no local compartilhado.

## Verde lima e soluções do hero em texto — 17/11/2026

- Escolha mais recente do usuário substitui a regra anterior que proibia animação nos textos do hero: apenas as mensagens recebem surgimento suave; avatar e área reservada continuam estáticos, sem pinning.
- Criado token --brand-lime #b9ef75, baseado no card verde de “Além da gestão.”, com RGB e tinta escura para superfícies claras. Padronizados barra de progresso, cards verdes do ecossistema e suporte, detalhes verdes da interface de demonstração e consentimento, avatares/botões/mensagens das conversas ilustrativas. Metadados escuros nas mensagens lima e texto claro nos anexos preservam leitura.
- Removidos fundo, moldura, sombras, blur, halo e ponto decorativo dos pop-ups. Somente título e indicação de desenvolvimento, ambos em lima.
- CSS local anima a entrada por 400 ms, opacidade e 6 px para cima, com desaceleração suave. A troca continua automática a cada três segundos, sem seletor. Timer pausa fora da tela, durante a apresentação ou com aba oculta. Movimento reduzido mantém troca direta.
- Espaço de texto reservado para todas as mensagens e texto acima do degradê de passagem do hero. Animação restrita ao texto, sem alterar a geometria da página.
- Validação: 14 testes aprovados no Chrome, cobrindo cinco larguras dos textos/cores, ausência de moldura e controles, avatar sem animação, troca automática em movimento reduzido, alinhamento e estabilidade por múltiplos ciclos. Build final e TypeScript aprovados; ESLint e git diff --check aprovados.
- Conferência visual final no local: [textos lima sem moldura ao lado do avatar](./evidencias/hero-textos-lima-sem-moldura-desktop-1200.png). Documento mestre v11 atualizado com a escolha definitiva. Sem push/deploy.

## Ordem das demonstrações e topos arredondados — 17/11/2026

- Ordem solicitada aplicada: “Um gesto. Seu negócio conectado.” (detalhes das placas) → “Mudou de cardápio? Sua placa acompanha.” → “Transpareça a verdadeira qualidade do seu trabalho.”. Removido o bloco “Da presença digital ao próximo contato” da home e seu import.
- Topo do painel NFC com raio compartilhado de 32 px no desktop e 24 px no celular. A máscara de fundo agora começa opaca, para mostrar o contorno arredondado na entrada; desvanecimento inferior preservado.
- “De ponta a ponta. Com você.” recebe o mesmo raio superior, sem depender de qual seção vem imediatamente antes. Fundo claro atrás dos dois painéis torna os cantos visíveis, seguindo os demais blocos pretos. Overflow clip conserva os recortes sem criar um scroll-container.
- Verificação no Chrome em 390 e 1200 px: ordem dos blocos, ausência do texto de transição, raios/fundos calculados e ausência de overflow horizontal aprovados. Conferência visual das duas entradas. Build/TypeScript, ESLint e git diff --check aprovados.
- Evidências: [NFC no celular](./evidencias/nfc-topo-arredondado-390.png) e [processo no desktop](./evidencias/process-topo-arredondado-1200.png). Documento mestre v12 atualizado. Sem push/deploy.
- Conferidos também os quatro capítulos do processo por scroll em 390 e 1200 px: indicação ativa acompanha cada etapa corretamente após a inclusão da base clara e do recorte.
