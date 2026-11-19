# Auditoria responsiva — 18/11/2026

Correções implementadas nas superfícies compartilhadas de navegação e cookies. A validação disponível passou; a homologação integral permanece pendente para áreas autenticadas, Turnstile real e dispositivos físicos. Nenhuma proteção foi desativada, nenhum cookie de autenticação foi fabricado e nenhum endpoint foi interceptado para simular sucesso.

## A. Diagnóstico

| Página/componente | Problema | Resolução/condição | Causa raiz | Prioridade | Status |
|---|---|---|---|---|---|
| Cabeçalho das páginas internas | Links Placa NFC, Serviços e Minha conta desapareciam sem navegação substituta | Até 1099px; reproduzido em 320px | Media query aplicava `display: none` ao nav compartilhado | P1 | Corrigido; links reorganizados, medidos em 23 larguras e três idiomas |
| Preferências de cookies | Conteúdo comprimido/recortado e controles dependentes de espaços verticais insuficientes | 320×568; telas baixas | Sheet com overflow oculto, corpo flexível e regiões de ações concorrendo pela altura; textos globais sobrepunham tamanhos das utilities | P1 | Corrigido; sheet inteira rolável; sete controles alcançáveis |
| Aviso de cookies | Painel excessivamente alto e sem limite proporcional à viewport | Mobile compacto; risco em altura menor que o conteúdo | Parágrafos globais prevaleciam sobre Tailwind; painel fixo sem altura máxima/rolagem própria | P2 | Corrigido; tipografia local, limite em `dvh`, rolagem e safe areas |
| Preferências de cookies | Botão de fechar de 36px e ações menores que 44px | Mobile | Dimensões fixas das utilities | P2 | Corrigido para botões de ação; switches preservados |
| Menu mobile | Padding não considerava notch/indicador de início | Dispositivos com safe areas | Padding constante e altura calculada sem insets | P2 | CSS corrigido; menu e Escape testados; insets físicos não emulados |
| Âncoras internas | Header reorganizado passa a ocupar duas linhas | Até 1099px, consequência da correção | Offset anterior não reservava espaço para nova altura | P2 | Offset ajustado para 160px em main/section com id |
| Logo final da home | Medidor local informa scrollWidth maior que clientWidth | Sete viewports da auditoria com rolagem | Símbolo ® deliberadamente absoluto ao lado da palavra | — | Composição intencional, dentro da viewport; sem alteração |

Não foram identificados P0 nos estados acessíveis testados. A matriz não reproduziu overflow horizontal de documento antes nem depois; isso não foi apresentado como um problema corrigido.

## B. Arquitetura e alterações

Next.js 16.4.6 com App Router (`src/app`), React 19.2.8, TypeScript, Tailwind 4.3 e CSS Modules. Componentes visuais usam Base UI/Radix, Lucide, GSAP, Motion e Lenis. O layout raiz configura Google Sans, viewport escalável e safe areas. O proxy controla entrada/sessão e não foi modificado.

Foram inventariados layouts, páginas, rotas, componentes compartilhados, módulos CSS e testes. A home compõe hero, gestão, ecossistema, EasyChat, serviços, placas, vídeo, processo, FAQ e fechamento. Serviços usam `ServicePage`; páginas legais usam `LegalPage`; login e recuperação compartilham `AuthFrame` e estilos próprios. Conta e dashboard têm módulos separados, mas seus estados autenticados não ficaram acessíveis nesta sessão.

Os principais limites existentes são 479/480, 600, 767/768, 800, 900, 1023/1024, 1099/1100 e 1199/1200px, além de regras por altura, orientação e preferências de movimento. Há containers máximos, `clamp()`, grids, mockups e cenas absolutas que são intencionais. A auditoria manteve esses sistemas, sem reescrever sua arquitetura.

Arquivos desta entrega:

- `src/app/globals.css`: substitui ocultação do nav interno por flex com wrap e linha própria; acrescenta espaço de âncora para o cabeçalho ampliado.
- `src/components/CookieConsent.module.css`: encapsula os ajustes de cookies. A especificidade local resolve o conflito de parágrafos sem alterar a tipografia de todas as páginas. Define limites em `dvh`, safe areas, rolagem do painel e áreas de ação.
- `src/components/cookie-consent.tsx`: associa essas classes aos elementos existentes. Consentimento, persistência, categorias, callbacks e foco mantêm sua implementação.
- `src/components/Header.module.css`: aplica safe areas ao diálogo mobile; o painel usa a altura útil do diálogo.
- `playwright.responsive.config.ts` e `tests/browser/responsive-audit.spec.ts`: cinco testes de regressão contra o servidor normalmente configurado, sem os overrides de segurança da configuração de testes antiga.
- `scripts/responsive-audit.mjs`: matriz por rota, medidas, erros JavaScript e capturas; falha quando detecta overflow, elementos selecionados fora da tela ou pageerror.
- `scripts/responsive-interactions.mjs`: registra cookies, controles, menu, foco, altura reduzida e zoom CSS.
- `scripts/responsive-content-audit.mjs`: percorre conteúdo com rolagem, mede navegação em três idiomas e exercita o modal de gestão.

Não foram acrescentados `overflow-x: hidden` global nem `!important`. Os clips já existentes foram preservados. Alterações anteriores em EasyChat, Management, PlateManagement, Sections, traduções e seus testes foram preservadas e não integram esta correção.

## C. Validação executada

### Matriz por rota

Chrome headless, servidor local em `http://localhost:3000`, em desenvolvimento com a configuração existente. Foram 414 amostras em cada passagem completa: 18 caminhos × 23 larguras.

Larguras: **320, 360, 375, 390, 414, 430, 480, 600, 767, 768, 820, 1024, 1099, 1100, 1199, 1200, 1280, 1366, 1440, 1536, 1920, 2560, 3440px**. Alturas: 844px abaixo de 600px de largura; 900px nas demais.

Rotas renderizadas: `/`, `/placa-nfc`, `/criacao-de-sites`, `/landing-pages`, `/cardapio-digital`, `/portal/acesso`, `/portal/redefinir` sem token, `/admin-dashboard-su/secure-entry`, `/privacidade`, `/termos`, `/cookies`, `/lgpd`, `/reembolso` e `/pagina-inexistente` (404 esperado).

Redirecionamentos observados, sem validação do conteúdo de destino protegido:

| Caminho solicitado | Destino observado |
|---|---|
| `/conta` | `/portal/acesso` |
| `/portal/seguranca` | `/portal/acesso` |
| `/dashboard` | `/admin-dashboard-su/secure-entry` |
| `/verificar` | `/` — configuração local não exibe o desafio |

Resultado final: **nenhum overflow horizontal do documento nas 414 amostras; nenhum pageerror registrado**. A detecção de elementos fora da tela considera seletores de conteúdo e controles visíveis e desconta regiões com clipping/rolagem local; ela não prova ausência de toda sobreposição possível. `pageerror` não equivale a uma coleta de todas as mensagens de console ou falhas de rede.

### Conteúdo, interação e regressões

- 69 verificações de navegação: 23 larguras × português, inglês e espanhol, na página de criação de sites. Links permaneceram visíveis e dentro da viewport.
- 35 combinações com rolagem: home e quatro serviços em **320×568, 600×900, 768×1024, 1024×600, 1440×900, 2560×1080 e 844×390**. Sem overflow de documento após percorrer conteúdo.
- Modal de demonstração de gestão aberto em 320×568; controles percorridos; Escape fechou o diálogo. Não foram enviadas operações reais de negócio.
- Menu mobile aberto em 320×568; Escape devolveu foco ao botão de abertura.
- Sete controles de preferências alcançáveis por rolagem: fechar, três switches, recusar, salvar e aceitar.
- **5 testes Playwright passaram (52,7s)**. Cobrem cookies em **320×240, 320×480, 667×320 e 844×390**, incluindo hit testing real com `elementFromPoint`, rolagem até cada botão/switch, Tab dentro do diálogo e Escape. O quinto cobre navegação nos limites e zoom CSS de 200%.
- Altura de teclado simulada por viewport **390×360**. Isso não representa um teclado nativo real.
- Zoom de **200% por CSS `zoom`** em 640×450 e 640×900: sem overflow de documento observado. Não foi testado o zoom nativo de navegador/SO nem pinch zoom físico.
- Screenshots da home e de páginas internas inspecionados visualmente; montagem mobile examinada com gestão, ecossistema, EasyChat, serviços, placas, vídeo e FAQ. Não houve comparação pixel a pixel determinística: textos animados e cenas respondem ao tempo/rolagem.

### Qualidade do código

| Comando | Resultado |
|---|---|
| `npm run build` — build final | Passou; aviso de fallback de Google Sans |
| `npm run typecheck` | Passou |
| `npm run lint` | Passou com 0 erros e 30 avisos em arquivos fora da alteração |
| ESLint dos novos scripts, teste, configuração e componente alterado | Passou sem avisos |
| `git diff --check` | Passou |

Avisos existentes de lint: Topography, VariableProximity, ui/Button, tilted-grid-hero e use-toast. O build informa que não encontrou métricas para gerar o fallback de Google Sans; a fonte original não foi substituída.

### Evidências e reprodução

- [Comparação visual](comparison.png): home antes/depois e preferências antes/depois, nessa ordem da esquerda para a direita.
- [Dados iniciais](before/results.json) e [dados finais](after/results.json).
- [Interações finais](after/interactions.json).
- [Rolagem e idiomas](content/results.json).
- [Montagem da home mobile](content/home-mobile-overview.png).
- Capturas completas em `before/`, `after/` e `content/`. Capturas iniciais de página inteira podem conter regiões ainda ocultas pelas animações de entrada; as capturas `content/*-scrolled.png` foram feitas após percorrer a página. Uma captura inicial do banner em 320×480 ocorreu antes de sua exibição e não serve de prova daquele estado.

Com o servidor normalmente configurado em execução:

```sh
node scripts/responsive-audit.mjs after
node scripts/responsive-interactions.mjs after
node scripts/responsive-content-audit.mjs
npx playwright test --config playwright.responsive.config.ts
```

O primeiro argumento dos dois primeiros scripts define a pasta de saída. Evite sobrescrever `before` para preservar a referência. Nenhum script inicia servidor com segurança relaxada.

## D. Pendências e limites

1. **Sessão autenticada:** conta, segurança, dashboard e estados de MFA exigem sessão legítima. Somente os redirecionamentos foram testados. É necessária uma sessão de homologação para validar esses conteúdos sem contornar autenticação.
2. **Turnstile real:** o desafio não foi exibido pela configuração local existente; `/verificar` redireciona para a home. Não foram alteradas variáveis de segurança. A aprovação do desafio, iframe, loading, expiração e falhas reais de segurança permanecem sem homologação. A revisão estática também encontrou o widget compartilhado com tamanho padrão `normal`, cujo encaixe em formulários compactos requer confirmação com o widget real.
3. **Fluxos remotos:** não foram enviados login, redefinição real, e-mail, contatos comerciais ou alterações de conta; estados de sucesso/erro/loading dependentes dessas operações não foram declarados aprovados. Recuperação foi auditada no estado sem token.
4. **Dispositivos e motores:** executado Chrome com toque emulado. Safari, Firefox, aparelhos físicos, notch real, teclado virtual nativo e zoom de sistema permanecem pendentes.
5. **Interações adicionais:** não foi homologado cada estado de dropdown, FAQ, carrossel, mídia, tradução completa ou animação em cada resolução. A inspeção com rolagem e a matriz não substituem essa cobertura funcional completa.
6. **Ambiente final:** build de produção passou; as medições visuais foram realizadas no servidor de desenvolvimento, sem alterar suas proteções. A validação do site implantado continua pendente.

Não foram observadas regressões nos checks executados. Pelas limitações acima, este relatório não declara atendidos todos os critérios de aceitação para todas as áreas do produto.
