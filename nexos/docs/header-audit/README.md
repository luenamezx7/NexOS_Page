# Refinamento do header ezway — 22/11/2026

Escopo: corrigir a navegação existente, preservando logotipo, rosa da marca, tipografia, cantos arredondados, vidro escuro e destinos. As alterações preexistentes no worktree foram preservadas. Por instrução explícita do usuário, a publicação final cobre a versão local completa, inclusive as alterações preexistentes fora do header. Os commits desta tarefa permanecem limitados ao refinamento do header e à sua validação. O resultado da publicação é registrado ao fim deste relatório.

## Auditoria antes das alterações

Inspeção do código e do navegador local a 1440 px, antes da edição:

- Header: x=107, largura=1216, y=16, altura=66. Navegação: x=294,8125, largura=643,453125. Centro do nav: 616,539 px; centro do viewport: 720 px. Desvio aproximado de 103,46 px. O grid `auto minmax(0, 1fr) auto` dividia o espaço restante entre laterais desiguais.
- Cinco filtros SVG no header, com 153.776 caracteres de definições incorporadas. Cada controle criava seu próprio `feImage` e filtro de deslocamento.
- `NavigationGlass` usava `useSyncExternalStore` para detectar Chromium após a hidratação. A primeira renderização usava blur CSS; a seguinte acrescentava `url(#...)`. Essa troca e a decodificação dos mapas introduziam trabalho óptico adicional. A duração exata do atraso original não foi medida.
- O painel mobile animava 48 px, opacidade e `filter`; seu vidro ficava numa camada descendente. O filtro/opacidade do ancestral podia criar uma nova raiz para o backdrop, alterando o que o vidro conseguia amostrar durante a transição.
- O placeholder de sessão participava do flex, mudando a largura das ações quando a consulta terminava.
- Havia receitas concorrentes nos estilos globais, na camada de navegação e nas transições compartilhadas. As definições ópticas da navegação foram consolidadas; receitas fora do escopo foram preservadas.
- A preferência por movimento reduzido estava sendo removida pelo plugin PostCSS de full motion, inclusive no CSS do header. Apenas adicionar uma media query ao componente não bastava.
- O controlador de seções existente já calcula o espaço do header (`section-position.ts`); foi preservado e exercitado na navegação mobile.
- A produção encaminhou a inspeção automatizada para `/verificar?next=%2F`. A comparação visual foi feita com a implementação local existente, não com uma captura liberada da produção.

## Correções

### Geometria

Grid com duas colunas laterais iguais e um espaço central de 360 px, suficiente para os três idiomas atuais. Os links são centralizados dentro desse espaço; a validação mede o centro entre o primeiro e o último link, não apenas a caixa do nav.

O header usa `100vw` para compensar a diferença entre o viewport e o espaço reservado ao scrollbar. A navegação completa começa em 1280 px; abaixo disso, usa o menu compacto. Conta, idioma e WhatsApp têm espaços estáveis. Logo e controles têm alvos de pelo menos 44 px de altura.

### Vidro

Header, controles e menus possuem o próprio `backdrop-filter: blur(18px) saturate(135%)`, incluindo a propriedade prefixada para WebKit. O fundo e o blur estão no mesmo elemento, nos estilos iniciais. Não há espera artificial para abrir o menu, animação de backdrop ou detecção de navegador para a aparência da navegação.

As definições SVG da navegação foram removidas. A refração do card do hero continua independente e preservada.

Após o feedback sobre excesso de opacidade, o fundo do header e dos controles foi reduzido de 78% para **36%**. O header usa **52%** ao rolar e os painéis **62%** para favorecer a leitura. Reflexos e bordas permanecem sutis. Há fallback sólido, redução de transparência e suporte a cores forçadas.

### Interação e movimento

Abertura de 200 ms, fechamento de 160 ms e deslocamento de 6 px. O painel mobile não usa mais blur de primeiro plano nem a receita de viagem longa. Idioma e conta compartilham estado para evitar menus concorrentes. Abrir o menu mobile fecha dropdowns.

O diálogo mantém Escape, clique fora, contenção de foco, retorno ao gatilho e liberação do scroll antes de navegar. A inércia é removida antes de reabrir para permitir o foco inicial também nas aberturas seguintes. A chegada do Lenis não reinicia a animação do menu.

O acompanhamento do scroll usa um snapshot booleano com `useSyncExternalStore`, evitando atualizações React por pixel. O PostCSS preserva as regras de movimento reduzido especificamente no header, idioma e material de navegação; a política das demais cenas continua intacta.

## Arquivos desta tarefa

- `src/components/Header.tsx` e `Header.module.css`
- `src/components/HeaderAccount.tsx`
- `src/components/LanguageSwitch.tsx` e `LanguageSwitch.module.css`
- `src/components/NavigationGlass.tsx`
- `src/styles/navigation-glass.css`
- `scripts/postcss-full-motion.cjs`
- `tests/full-motion-css.test.mjs`
- `tests/browser/header-refinement.spec.ts`
- Este relatório e capturas em `docs/header-audit/`.

## Validação

Resultados locais finais:

- **5 cenários de navegador aprovados no Chrome**: geometria nos 8 viewports × 3 idiomas; menu mobile; teclado/idioma/login/scroll; cache frio com throttling; movimento reduzido. O cenário mobile foi reexecutado após corrigir o foco em reaberturas.
- **6 testes do pipeline CSS aprovados**, preservando a política geral e as exceções de movimento reduzido.
- **TypeScript e ESLint aprovados**, além de `git diff --check`.
- **Toque emulado aprovado**: abrir, fechar por toque e reabrir/fechar por Escape. Detalhes em `touch-validation.json`.
- Detector Impeccable executado, sem achados no código analisado.
- No teste extra de altura de 320 px, o aviso de cookies pode cobrir o header. O teste dispensa o aviso pelo botão real antes de avaliar o menu. O aviso de cookies não foi alterado nesta tarefa.

As capturas `header-*.jpg` mostram as oito larguras; `dropdown-1440.jpg` e `mobile-menu-390.jpg` mostram os menus com a transparência final.

 A suíte cobre 360, 390, 430, 768, 1024, 1280, 1440 e 1920 px, nos idiomas português, inglês e espanhol; centro dos links com tolerância de 0,6 px; separação dos grupos; ausência de overflow; filtros nativos; ciclos de menu, teclado e scroll.

O teste de carregamento desativa o cache, limita a CPU em 4× e a rede a 500.000 bytes/s de download, 250.000 bytes/s de upload e latência de 120 ms. Amostra geometria e filtro por requestAnimationFrame, além dos frames do painel aberto. Isso verifica os estilos computados sob essas condições; não é uma garantia de composição para toda GPU e navegador.

Os testes de navegação simulam uma sessão anônima no endpoint de sessão. O link de login e a chegada ao portal são exercitados; autenticação real e conta privada não fazem parte dessa validação.

## Limitações do ambiente

- WebKit: a pasta instalada contém apenas uma biblioteca; o executável `pw_run.sh` está ausente. A execução foi tentada, mas os testes não chegaram a iniciar. Safari e iPhone físicos continuam pendentes.
- O disco ficou sem espaço e causou erros 500 no servidor e falhas ENOSPC nas primeiras capturas. Foram removidos somente caches gerados do Next.js, e o servidor local foi reiniciado. Capturas finais usam JPEG compacto.
- Build de produção não foi repetido devido ao espaço livre reduzido; a compilação das rotas utilizadas, tipagem, lint e testes locais são verificados separadamente.
- A verificação de segurança bloqueou a inspeção visual automatizada da produção; o status do deploy e as verificações HTTP são registrados separadamente.

## Publicação final

- Projeto: `nex-os2/nexos`; status **READY**.
- Deployment: `dpl_Fu3U6BZiQPvXBQCK6JKetU8ijx4S`.
- URL: https://nexos-513x0xq8g-nex-os2.vercel.app
- Domínio: https://nexoslab.online (também `www.nexoslab.online`).
- Escopo: **versão local completa**, por instrução explícita do usuário; inclui alterações preexistentes de home, entrada e autenticação, além do header.
- Build remoto aprovado, aproximadamente 50 segundos.
- `/api/health`: HTTP 200. A home encaminha o navegador automatizado para a verificação de segurança, com HTTP 200; isso não constitui validação visual da home publicada.
- Manifesto publicado: 13 arquivos essenciais comparados por SHA-1 com a versão local, todos correspondentes, incluindo package/lockfile, home, login, código de acesso, runtime da apresentação e arquivos do header. Evidência em `deployment.json`.
- Commits de implementação: `c989d88` e `735a954`. Os arquivos preexistentes fora deste escopo não foram incluídos nesses commits.
