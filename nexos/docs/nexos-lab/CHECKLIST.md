# Prompt para Cursor + Codex | Refinamento da home EZway / NexOS LAB

Trabalhe no repositório aberto. Refine a **home existente** usando a prévia privada para a organização visual, hierarquia, alinhamento e ritmo entre as seções. Use os componentes, conteúdo, imagens, animações e fluxos do projeto atual como base. O card com todas as placas NFC no hero é uma adição explícita. As mudanças de autenticação e segurança descritas abaixo também fazem parte da entrega.

Implemente, revise e teste por etapas. Trabalhe localmente e, quando houver ambiente privado autorizado, use-o para validação. Publicação, ampliação de visibilidade e mudanças no domínio de produção dependem da minha aprovação. Aplique as skills de design, performance, acessibilidade, segurança e testes que estiverem instaladas e forem úteis para a tarefa.

## Referências e como usá-las

| Referência | Aplicação no projeto |
| --- | --- |
| [Prévia privada NexOS LAB](https://nexos-lab-preview.bestdove3.chatgpt.site) | Organização da página, hero em duas colunas, alternância de superfícies, respiro e posição dos CTAs. Se pedir login, siga os critérios visuais deste documento. |
| [PróLINK](https://prolink.rafaeltakehara.pro/) | Inspiração de ritmo editorial, contraste, espaço entre blocos e protagonismo dos mockups. Use o conteúdo e a identidade da EZway. |
| `WhatsApp Image 2026-11-12 at 18.30.28.jpeg` | Na região marcada, a imagem permanece nítida na parte superior e se dissolve progressivamente no fundo claro na base. Um pequeno bloco informativo fica sobre a área ainda legível e a frase seguinte tem espaço próprio na superfície clara. Reproduza a lógica de posicionamento e contraste com os textos e imagens da EZway. |
| `Texto colado.txt` | Componente **TiltedGridHero**, com faixa curva, movimento horizontal e fade lateral. Use na seção **Um caminho para cada necessidade.** O código está no apêndice A. |
| `Texto colado (2)(1).txt` | Componente **GradualBlur**, da React Bits, para desfoque progressivo nas bordas. O código e o CSS estão no apêndice B. |

## 0. Mapear o projeto e criar o checklist de execução

- [x] Leia as instruções do repositório e verifique as alterações locais existentes. Preserve o trabalho em andamento. Identifique framework, scripts, aliases, componentes de UI, tokens e estilos.
- [x] Mapeie a home real, a ordem das seções, os textos entre elas, as âncoras, os CTAs, o menu, os mockups e os SVGs de NFC. Identifique as timelines, os elementos que elas controlam e o responsável pelo scroll, se houver.
- [x] Registre a referência inicial em desktop e mobile. Tente reproduzir os pulinhos e a linha branca. Inspecione o ponto de junção e os elementos animados antes de alterar o código. Se o problema depender do aparelho, registre as condições em que conseguiu observá-lo.
- [x] Localize o provedor de autenticação, o fluxo de criação de contas, o backend, os pontos públicos de escrita, os endpoints sensíveis e a infraestrutura de produção. Entenda as dependências dos logins antigos antes de alterar os provedores.
- [x] Mantenha um checklist atualizado por etapa no plano da tarefa ou no relatório final. Marque cada item após a implementação e a verificação correspondente. Registre bloqueios específicos e siga com os itens independentes.

## 1. Refinar a estrutura visual e o hero

- [x] Use o **rosa-choque atual** da EZway. Identifique no projeto o token ou valor utilizado pela marca e reaproveite-o em CTAs, destaques e estados ativos. Ajuste o contraste de texto pequeno sobre branco quando necessário. Distribua blocos pretos e brancos com largura de leitura consistente e bom espaçamento. Use o rosa como destaque.
- [x] Mantenha o **header arredondado e o glassmorphism leve**. Preserve seus estados, o menu mobile e a navegação. Garanta que o header fixo ou sticky respeite as âncoras, o foco e a área segura do celular. Reduza o custo do backdrop se a medição apontar gargalo.
- [x] Use **algumas seções como cards**, por exemplo a seção de soluções ou o showcase de mockups. Escolha as que se beneficiam de um enquadramento visual. Deixe áreas de leitura e transição respirarem em largura integral. Use raios coerentes com o header e o card do hero.
- [x] Preserve os textos de ligação já existentes entre as seções. Posicione-os perto da passagem a que pertencem, com espaço suficiente para leitura. Aplique fade na entrada conforme a etapa 4. Para a referência da foto, use uma máscara ou um gradiente sobre a própria imagem ou composição, com a última cor igual ao fundo local. Deixe títulos, texto de apoio e botões em uma camada legível.
- [x] No desktop, organize o hero com conteúdo e CTAs à esquerda e um card de produto à direita. No mobile, empilhe os elementos na ordem título, texto, CTAs e card. Preserve os destinos e a hierarquia dos CTAs.
- [x] No card, inclua **todas as placas NFC do catálogo atual em SVG**. Localize os arquivos reais e confira se há variantes além de Cardápio, Instagram, WhatsApp e Google. Use Cardápio como peça principal se o catálogo atual confirmar essa composição. Recrie o painel escuro, a luz rosa suave, os anéis discretos e a sobreposição controlada da prévia. Distribua as placas com rotação e profundidade leves. Se a sobreposição apertar no mobile, use uma composição mais aberta ou uma grade 2 × 2 para o conjunto de quatro. Toda placa deve ser identificável, com proporção original, sem recorte ou deformação do QR Code.
- [x] Resolva a linha branca entre hero e próxima seção. Verifique fundo do documento e dos wrappers, bordas, pseudoelementos, margens negativas, máscaras, frações de pixel e camadas criadas por transforms. Mantenha o card de transição no fluxo, com fundo contínuo sob a junção. Compare o antes e o depois rolando em ambos os sentidos, inclusive com diferentes proporções de pixel.

## 2. Integrar o carrossel e melhorar os mockups

### Um caminho para cada necessidade.

- [x] Use o **TiltedGridHero** do apêndice A como base do carrossel dessa seção. A faixa deve se curvar nas extremidades, ficar mais frontal ao centro e desaparecer gradualmente nas laterais. Mantenha o título, os textos e os links da seção acessíveis fora da camada decorativa.
- [x] Alimente o componente com os assets reais da EZway. Siga os aliases, a estrutura de componentes e a utilidade de classes do projeto. Use o stack existente para a integração. Preserve a experiência mesmo com poucos assets e mantenha uma apresentação útil quando o movimento estiver reduzido.
- [x] Reserve espaço para a faixa antes da medição e dimensione as imagens. Carregue a seção e os assets quando fizer sentido para a posição na página. Revise o preload de todas as imagens do exemplo e o custo de multiplicar as 16 fatias por peça. Meça e reduza fatias, peças simultâneas ou profundidade no mobile conforme necessário. Mantenha o fade lateral também em uma variante mais leve.
- [x] Pause a animação quando a seção sair da tela ou a aba ficar em segundo plano. Ofereça pausa e retomada se houver movimento contínuo. Preserve o scroll vertical em telas de toque. Se as imagens forem essenciais à navegação, mantenha controles e nomes acessíveis fora da banda decorativa.

### Demonstrações de iPhone, MacBook e outros dispositivos

- [x] Preserve os mockups, assets, demonstrações e animações existentes. Reaproveite os próprios componentes e mantenha as versões de conteúdo que já fazem parte de cada demonstração.
- [x] Refine especialmente a alternância dos MacBooks. Mantenha o enquadramento da câmera, o tamanho do chassi, o recorte da tela e a posição da composição estáveis durante a troca. Priorize as capturas originais na resolução adequada para a área exibida. Use proporção explícita, carregue a próxima imagem antes de exibi-la e evite esticar ou ampliar capturas pequenas.
- [x] Faça uma transição curta com fade e leve deslocamento usando a timeline existente quando possível. Se os modelos compartilham o mesmo chassi, mantenha-o fixo e anime a troca dentro da área da tela. Se variam, preserve os chassis originais e alinhe as camadas no mesmo palco. Mantenha os controles atuais e verifique navegação rápida, redimensionamento, mobile e movimento reduzido.

## 3. Aplicar fade visual e GradualBlur nas bordas

- [x] Use o **GradualBlur** do apêndice B e o CSS correspondente. Aplique nas bordas superior e inferior da composição da página, alinhando a camada superior com o header e a inferior com a área segura e os controles fixos. Use `target="page"` para uma borda de viewport quando necessário. Em áreas que precisam de recorte próprio, use `target="parent"` no wrapper posicionado.
- [x] Comece com poucas camadas e intensidade discreta. Use faixas mais estreitas no mobile e mantenha `pointer-events: none`. Faça o desfoque respeitar os cantos quando aplicado a uma seção-card. Defina a ordem de empilhamento de forma que header, menus, diálogos, foco e CTAs fiquem legíveis e utilizáveis.
- [x] Trate o fade da referência, o fade lateral do carrossel e o desfoque de borda como efeitos com papéis próprios. No ponto em que preto e branco se encontram, confira se a cor e a opacidade de cada camada acompanham a superfície visível. Evite somar backdrops em tela inteira. Caso o Safari mobile sofra com o custo de composição, use menos camadas ou um gradiente estático equivalente naquele contexto. Use `autoHide` apenas onde houver benefício e valide o custo do listener.

## 4. Distribuir GSAP ScrollTrigger e preservar a fluidez

- [x] Preserve as animações atuais, incluindo entradas, timelines, efeitos dos mockups, faixa animada e interações entre seções que existirem. Ajuste seletivamente gatilhos, distâncias e pontos de início/fim quando a nova geometria exigir.
- [x] Distribua fades do GSAP ScrollTrigger pelo hero, textos de transição e blocos principais das seções. Use `opacity` e deslocamentos curtos com `transform` para os reveals. Agrupe elementos relacionados quando fizer sentido. Mantenha a primeira dobra e os textos essenciais disponíveis mesmo antes de o JavaScript iniciar.
- [x] Use o fluxo atual como ponto de partida e mantenha o gesto de toque nativo onde houver conflito. Evite adicionar um segundo controlador de scroll. Inspecione `pin`, `scrub`, wrappers transformados, alturas dependentes do viewport, listeners, loops de animação e chamadas a `ScrollTrigger.refresh()`. Reduza ou adapte somente o que causar jank e preserve a intenção do efeito em mobile.
- [x] Use o mecanismo de escopo e limpeza de GSAP já adotado no projeto ou `gsap.context()` e `gsap.matchMedia()` quando compatíveis. Limpe triggers, observers e listeners ao desmontar ou mudar de breakpoint. Faça refresh em mudanças reais de layout, fora do gesto ativo quando possível. Considere `ignoreMobileResize` se o problema for recalcular posições quando a barra do navegador muda de altura. Teste rotação e links com âncoras.
- [ ] Respeite `prefers-reduced-motion`. Meça antes e depois no trecho hero → primeira seção e na área dos mockups. Observe long tasks, mudanças de layout, custo de pintura e scroll em ambos os sentidos. Emulação ajuda a reproduzir layout e carga, e a confirmação dos pulinhos no Safari depende de um iPhone físico. [Documentação do ScrollTrigger](https://gsap.com/docs/v3/Plugins/ScrollTrigger/) · [gsap.matchMedia()](https://gsap.com/docs/v3/GSAP/gsap.matchMedia%28%29/)

## 5. Deixar apenas login

- [x] Na interface, deixe somente a opção de **entrar** pelo método próprio do projeto. Remova botões, links e estados de cadastro público e as opções de login via GitHub e Google. Preserve recuperação de acesso, logout, sessão e as áreas privadas existentes.
- [ ] Desative a criação pública de contas no backend e na configuração do provedor. Verifique rotas diretas de cadastro e os pontos de entrada de GitHub/Google, incluindo callbacks. Use provisionamento administrativo ou por convite se esse fluxo já existir. Se não houver forma autorizada de criar contas, registre como os membros serão provisionados antes de desligar os provedores em produção.
- [x] Verifique contas antigas dependentes de OAuth e prepare uma forma verificada de migração ou recuperação antes de desativar o último método de entrada dessas pessoas. Preserve registros, permissões e vínculos com produtos ou comunidade. Revise o comportamento para visitante, conta válida, credenciais inválidas e acesso sem permissão. [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)

## 6. Auditar segurança, segredos e rate limit

- [x] Faça uma varredura do código, histórico Git disponível, configuração de CI, arquivos de ambiente rastreados, assets públicos, bundles do cliente, sourcemaps, responses e logs relevantes. Diferencie IDs ou chaves publicáveis previstos pelo provedor de chaves privadas, tokens e credenciais. Mantenha segredos no servidor ou no gerenciador do ambiente. Se identificar exposição, relate somente localização, impacto e correção, sem imprimir valores. Trate a credencial como comprometida e encaminhe a revogação e rotação conforme o acesso e a autorização disponíveis.
- [x] Revise autenticação e autorização no servidor, acesso entre contas, escopo de consultas, cookies e sessões, validação de entradas, CSRF onde a autenticação por cookie exigir, CORS, cache de páginas privadas, mensagens de erro e cabeçalhos. Se houver CSP, teste a integração com estilos dinâmicos, GSAP, mocks e Cloudflare sem afrouxá-la globalmente para acomodar um componente.
- [x] Configure limites para login, recuperação e endpoints sensíveis ou de custo elevado que existirem. No servidor, use contadores consistentes entre instâncias e combine sinais de origem com conta quando adequado. Confie em IP encaminhado apenas de proxies verificados. Defina janelas e limites por rota a partir do tráfego esperado e das capacidades do ambiente. Verifique bloqueio temporário, recuperação e comportamento da resposta. Para APIs, retorne `429` e `Retry-After` quando aplicável. Use o WAF como camada adicional.
- [x] Revise dependências e otimizações que estejam no escopo. Registre o que foi verificado, o que foi corrigido e o que depende de acesso externo. Diferencie ausência de achados na varredura realizada de uma garantia absoluta de segurança. [OWASP Secrets Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html) · [Parâmetros de rate limiting do Cloudflare](https://developers.cloudflare.com/waf/rate-limiting-rules/parameters/)

## 7. Preparar a verificação do Cloudflare antes da home

- [ ] Configure e teste em ambiente privado autorizado uma **Challenge Page da Cloudflare via WAF** para navegação HTML no hostname correto. O visitante sem clearance deve passar pela verificação na borda antes de receber o HTML da aplicação. Para exigir interação visível, confirme se **Interactive Challenge** está disponível no plano e para a regra pretendida. **Managed Challenge** é uma alternativa que pode verificar de forma automática, então documente essa diferença se ela for usada.
- [ ] Revise a expressão conforme as rotas, os métodos e os hostnames reais. Inclua entradas diretas nas páginas públicas se o requisito abranger o site inteiro. Mantenha assets, APIs, webhooks, callbacks necessários e monitoramento compatíveis com seus fluxos e protegidos pelas regras apropriadas. Confira a passagem do desafio e o `cf_clearance`, para evitar repetição dentro do período configurado. Valide também se a origem direta, endereços alternativos ou aliases de produção podem contornar o WAF e trate conforme a hospedagem real.
- [ ] Teste sessão limpa sem clearance, aprovação manual, retorno ao caminho original, acesso com clearance válido, login depois do desafio e endpoints que precisam responder JSON. Se faltarem plano, permissão, domínio ou ambiente de teste, entregue a regra proposta com os valores que faltam, passos no painel, verificação e reversão. A ativação em produção depende da minha aprovação. [Challenge Pages via WAF](https://developers.cloudflare.com/cloudflare-challenges/challenge-types/challenge-pages/create-custom-rule/) · [Tipos de desafio e compatibilidade](https://developers.cloudflare.com/cloudflare-challenges/challenge-types/challenge-pages/) · [Challenge Passage](https://developers.cloudflare.com/cloudflare-challenges/challenge-types/challenge-pages/challenge-passage/)

## 8. Validar, corrigir e entregar para revisão

- [x] Execute os scripts de build, tipos, lint e testes relevantes existentes no projeto. Corrija as regressões introduzidas. Registre os comandos e os resultados reais.
- [x] Teste em 320, 390, 768 e 1280 px, mais desktop largo se disponível. Confira header e menu, todas as placas no hero, textos de transição, seções arredondadas, ausência de overflow horizontal, foco, teclado e contraste. Revise a emenda em movimento e no frame parado.
- [ ] Teste no Chrome e no Safari/WebKit se disponíveis. Valide scroll rápido, inércia, rotação, alteração da barra de endereço, âncoras, troca dos mockups, carrossel e movimento reduzido. Identifique expressamente o que foi simulado e o que foi verificado em aparelho real.
- [ ] Verifique login válido, erro, recuperação, logout, bloqueio do cadastro direto, ausência dos provedores removidos, autorização entre contas, rate limiting e os cenários Cloudflare aplicáveis ao ambiente.
- [x] Entregue o checklist atualizado, os arquivos principais alterados, a forma de rodar a prévia, evidência visual de desktop e mobile se disponível e um resumo dos testes. Liste pendências de infraestrutura, acesso ou aparelho com a próxima ação concreta. Deixe o trabalho disponível para revisão local ou privada.


## Registro de execução

- Alterações locais anteriores preservadas; sem deploy ou alteração de WAF de produção.
- Base: Next.js 16.3.5 / React 19, aliases @/*, Tailwind 4 e CSS Modules. Rosa da marca: --palette-cta (#ff3f9f).
- Home: hero → faixa NFC/showcase → transição → MacBooks → imóvel → gestão → transição → EasyChat/iPhone → processo → aplicações → prova → sobre → FAQ/CTA → social → footer. Lenis desktop, gesto nativo mobile; GSAP e WAAPI em escopos distintos.
- Linha branca reproduzida após encerramento automático: outline de foco de 2 px no hero. Corrigido e verificado antes desta etapa.
- Auth: Better Auth/Postgres, sessão no servidor, 2FA admin, OAuth direto/broker Supabase; Notion para leads; Resend para e-mail; Vercel e Cloudflare.
- Provisionamento administrativo preparado e validado em schema temporário; escolha do fluxo e hostname privado continuam pendentes. Resultados locais consolidados em VALIDATION.md.

### Estado após primeira validação

- Prévia privada exige login. PróLINK foi inspecionado; fontes, conteúdo e assets EZway preservados.
- A foto de referência e os dois arquivos .txt não foram encontrados no repositório. Os apêndices foram usados como fonte; a foto foi aplicada conforme a descrição textual, usando a imagem imobiliária existente.
- Catálogo confirmado: nfccardapio.svg, nfcinsta.svg, nfcwpp.svg e nfcgoogle.svg, todos em public/nfcs e no diretório de design.
- Screenshots hero-320/390/768/1280/1440.png: quatro placas e nenhum overflow horizontal. O fundo manteve 29,6 FPS em emulação com CPU 6× mais lenta.
- TiltedGridHero deriva diretamente do apêndice A; 12 fatias desktop, 6 mobile, até 14 tiles, carga perto da viewport e pausa automática/manual. GradualBlur reutiliza a versão TS do apêndice B já existente, com 2 camadas desktop e 1 mobile.
- Chassi único do MacBook com quatro demonstrações originais; câmera e recorte fixos, transição de tela reversível. Demais mockups e textos preservados.
- Leitura de contas: seis usuários, todos com e-mail verificado, todos sem senha local; recuperação da mesma identidade foi testada em schema isolado. Nenhuma conta real foi alterada ou recebeu e-mail.
- Limites atômicos em Postgres para contato e por e-mail na autenticação; Better Auth mantém limites de origem no mesmo banco. IP só é confiado no header sobrescrito pela Vercel; fora dela, contador compartilhado conservador.
- Auditoria: vulnerabilidades de produção baixaram de 23 (2 críticas, 9 altas) para 9 (0 críticas/altas; 4 moderadas, 5 baixas). Pendências sem fix compatível listadas em dependency-audit.json.
- Senha de banco encontrada no histórico: SECRET-ROTATION.md registra localização, impacto e roteiro, sem valor. Rotação não executada porque altera infraestrutura de produção.
- Retomada: suíte de integração completa passou, 17/17, com PLAYWRIGHT_CHANNEL=chrome. Recuperação de identidade antiga, bloqueios de cadastro/OAuth, MFA, rate limit e provisionamento verificados em schema temporário.
- Retomada: suíte Chrome passou, 28/28, incluindo o contador de apresentação corrigido, home, autenticação e desempenho. Fundo a 29,7 FPS sob CPU emulada 6× mais lenta. Tipos, build e 22 testes locais passaram; lint sem erros, com 30 avisos.
- WAF e proteção da origem permanecem não ativados; proposta, testes e reversão em CLOUDFLARE.md.
- Pendências antes de produção: confirmar provisionamento, hostname privado/plano WAF, rotação da senha exposta e validação em iPhone físico.

### Validação de retomada

Relatório e comandos reproduzíveis em [VALIDATION.md](./VALIDATION.md). Os itens mistos
de navegador/aparelho, acesso/Cloudflare e desempenho antes/depois permanecem abertos
até concluir suas partes externas. Os resultados locais confirmados estão no relatório.

- Ajuste posterior solicitado pelo proprietário: fundo GhostFibers removido do hero.
  As medições de FPS de fibras acima pertencem à composição anterior; não descrevem
  o hero atual. Ver a validação final em VALIDATION.md.

- Orientação posterior do proprietário substitui o hero em duas colunas do briefing:
  título alinhado à esquerda e card das placas abaixo do CTA em todas as larguras.

- Correção final de disposição: todo o conteúdo do hero centralizado, incluindo
  título, palavra animada, apoio e CTA; card centralizado logo abaixo do botão.
