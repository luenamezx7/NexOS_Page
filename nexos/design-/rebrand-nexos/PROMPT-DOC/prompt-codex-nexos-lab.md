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

- [ ] Leia as instruções do repositório e verifique as alterações locais existentes. Preserve o trabalho em andamento. Identifique framework, scripts, aliases, componentes de UI, tokens e estilos.
- [ ] Mapeie a home real, a ordem das seções, os textos entre elas, as âncoras, os CTAs, o menu, os mockups e os SVGs de NFC. Identifique as timelines, os elementos que elas controlam e o responsável pelo scroll, se houver.
- [ ] Registre a referência inicial em desktop e mobile. Tente reproduzir os pulinhos e a linha branca. Inspecione o ponto de junção e os elementos animados antes de alterar o código. Se o problema depender do aparelho, registre as condições em que conseguiu observá-lo.
- [ ] Localize o provedor de autenticação, o fluxo de criação de contas, o backend, os pontos públicos de escrita, os endpoints sensíveis e a infraestrutura de produção. Entenda as dependências dos logins antigos antes de alterar os provedores.
- [ ] Mantenha um checklist atualizado por etapa no plano da tarefa ou no relatório final. Marque cada item após a implementação e a verificação correspondente. Registre bloqueios específicos e siga com os itens independentes.

## 1. Refinar a estrutura visual e o hero

- [ ] Use o **rosa-choque atual** da EZway. Identifique no projeto o token ou valor utilizado pela marca e reaproveite-o em CTAs, destaques e estados ativos. Ajuste o contraste de texto pequeno sobre branco quando necessário. Distribua blocos pretos e brancos com largura de leitura consistente e bom espaçamento. Use o rosa como destaque.
- [ ] Mantenha o **header arredondado e o glassmorphism leve**. Preserve seus estados, o menu mobile e a navegação. Garanta que o header fixo ou sticky respeite as âncoras, o foco e a área segura do celular. Reduza o custo do backdrop se a medição apontar gargalo.
- [ ] Use **algumas seções como cards**, por exemplo a seção de soluções ou o showcase de mockups. Escolha as que se beneficiam de um enquadramento visual. Deixe áreas de leitura e transição respirarem em largura integral. Use raios coerentes com o header e o card do hero.
- [ ] Preserve os textos de ligação já existentes entre as seções. Posicione-os perto da passagem a que pertencem, com espaço suficiente para leitura. Aplique fade na entrada conforme a etapa 4. Para a referência da foto, use uma máscara ou um gradiente sobre a própria imagem ou composição, com a última cor igual ao fundo local. Deixe títulos, texto de apoio e botões em uma camada legível.
- [ ] No desktop, organize o hero com conteúdo e CTAs à esquerda e um card de produto à direita. No mobile, empilhe os elementos na ordem título, texto, CTAs e card. Preserve os destinos e a hierarquia dos CTAs.
- [ ] No card, inclua **todas as placas NFC do catálogo atual em SVG**. Localize os arquivos reais e confira se há variantes além de Cardápio, Instagram, WhatsApp e Google. Use Cardápio como peça principal se o catálogo atual confirmar essa composição. Recrie o painel escuro, a luz rosa suave, os anéis discretos e a sobreposição controlada da prévia. Distribua as placas com rotação e profundidade leves. Se a sobreposição apertar no mobile, use uma composição mais aberta ou uma grade 2 × 2 para o conjunto de quatro. Toda placa deve ser identificável, com proporção original, sem recorte ou deformação do QR Code.
- [ ] Resolva a linha branca entre hero e próxima seção. Verifique fundo do documento e dos wrappers, bordas, pseudoelementos, margens negativas, máscaras, frações de pixel e camadas criadas por transforms. Mantenha o card de transição no fluxo, com fundo contínuo sob a junção. Compare o antes e o depois rolando em ambos os sentidos, inclusive com diferentes proporções de pixel.

## 2. Integrar o carrossel e melhorar os mockups

### Um caminho para cada necessidade.

- [ ] Use o **TiltedGridHero** do apêndice A como base do carrossel dessa seção. A faixa deve se curvar nas extremidades, ficar mais frontal ao centro e desaparecer gradualmente nas laterais. Mantenha o título, os textos e os links da seção acessíveis fora da camada decorativa.
- [ ] Alimente o componente com os assets reais da EZway. Siga os aliases, a estrutura de componentes e a utilidade de classes do projeto. Use o stack existente para a integração. Preserve a experiência mesmo com poucos assets e mantenha uma apresentação útil quando o movimento estiver reduzido.
- [ ] Reserve espaço para a faixa antes da medição e dimensione as imagens. Carregue a seção e os assets quando fizer sentido para a posição na página. Revise o preload de todas as imagens do exemplo e o custo de multiplicar as 16 fatias por peça. Meça e reduza fatias, peças simultâneas ou profundidade no mobile conforme necessário. Mantenha o fade lateral também em uma variante mais leve.
- [ ] Pause a animação quando a seção sair da tela ou a aba ficar em segundo plano. Ofereça pausa e retomada se houver movimento contínuo. Preserve o scroll vertical em telas de toque. Se as imagens forem essenciais à navegação, mantenha controles e nomes acessíveis fora da banda decorativa.

### Demonstrações de iPhone, MacBook e outros dispositivos

- [ ] Preserve os mockups, assets, demonstrações e animações existentes. Reaproveite os próprios componentes e mantenha as versões de conteúdo que já fazem parte de cada demonstração.
- [ ] Refine especialmente a alternância dos MacBooks. Mantenha o enquadramento da câmera, o tamanho do chassi, o recorte da tela e a posição da composição estáveis durante a troca. Priorize as capturas originais na resolução adequada para a área exibida. Use proporção explícita, carregue a próxima imagem antes de exibi-la e evite esticar ou ampliar capturas pequenas.
- [ ] Faça uma transição curta com fade e leve deslocamento usando a timeline existente quando possível. Se os modelos compartilham o mesmo chassi, mantenha-o fixo e anime a troca dentro da área da tela. Se variam, preserve os chassis originais e alinhe as camadas no mesmo palco. Mantenha os controles atuais e verifique navegação rápida, redimensionamento, mobile e movimento reduzido.

## 3. Aplicar fade visual e GradualBlur nas bordas

- [ ] Use o **GradualBlur** do apêndice B e o CSS correspondente. Aplique nas bordas superior e inferior da composição da página, alinhando a camada superior com o header e a inferior com a área segura e os controles fixos. Use `target="page"` para uma borda de viewport quando necessário. Em áreas que precisam de recorte próprio, use `target="parent"` no wrapper posicionado.
- [ ] Comece com poucas camadas e intensidade discreta. Use faixas mais estreitas no mobile e mantenha `pointer-events: none`. Faça o desfoque respeitar os cantos quando aplicado a uma seção-card. Defina a ordem de empilhamento de forma que header, menus, diálogos, foco e CTAs fiquem legíveis e utilizáveis.
- [ ] Trate o fade da referência, o fade lateral do carrossel e o desfoque de borda como efeitos com papéis próprios. No ponto em que preto e branco se encontram, confira se a cor e a opacidade de cada camada acompanham a superfície visível. Evite somar backdrops em tela inteira. Caso o Safari mobile sofra com o custo de composição, use menos camadas ou um gradiente estático equivalente naquele contexto. Use `autoHide` apenas onde houver benefício e valide o custo do listener.

## 4. Distribuir GSAP ScrollTrigger e preservar a fluidez

- [ ] Preserve as animações atuais, incluindo entradas, timelines, efeitos dos mockups, faixa animada e interações entre seções que existirem. Ajuste seletivamente gatilhos, distâncias e pontos de início/fim quando a nova geometria exigir.
- [ ] Distribua fades do GSAP ScrollTrigger pelo hero, textos de transição e blocos principais das seções. Use `opacity` e deslocamentos curtos com `transform` para os reveals. Agrupe elementos relacionados quando fizer sentido. Mantenha a primeira dobra e os textos essenciais disponíveis mesmo antes de o JavaScript iniciar.
- [ ] Use o fluxo atual como ponto de partida e mantenha o gesto de toque nativo onde houver conflito. Evite adicionar um segundo controlador de scroll. Inspecione `pin`, `scrub`, wrappers transformados, alturas dependentes do viewport, listeners, loops de animação e chamadas a `ScrollTrigger.refresh()`. Reduza ou adapte somente o que causar jank e preserve a intenção do efeito em mobile.
- [ ] Use o mecanismo de escopo e limpeza de GSAP já adotado no projeto ou `gsap.context()` e `gsap.matchMedia()` quando compatíveis. Limpe triggers, observers e listeners ao desmontar ou mudar de breakpoint. Faça refresh em mudanças reais de layout, fora do gesto ativo quando possível. Considere `ignoreMobileResize` se o problema for recalcular posições quando a barra do navegador muda de altura. Teste rotação e links com âncoras.
- [ ] Respeite `prefers-reduced-motion`. Meça antes e depois no trecho hero → primeira seção e na área dos mockups. Observe long tasks, mudanças de layout, custo de pintura e scroll em ambos os sentidos. Emulação ajuda a reproduzir layout e carga, e a confirmação dos pulinhos no Safari depende de um iPhone físico. [Documentação do ScrollTrigger](https://gsap.com/docs/v3/Plugins/ScrollTrigger/) · [gsap.matchMedia()](https://gsap.com/docs/v3/GSAP/gsap.matchMedia%28%29/)

## 5. Deixar apenas login

- [ ] Na interface, deixe somente a opção de **entrar** pelo método próprio do projeto. Remova botões, links e estados de cadastro público e as opções de login via GitHub e Google. Preserve recuperação de acesso, logout, sessão e as áreas privadas existentes.
- [ ] Desative a criação pública de contas no backend e na configuração do provedor. Verifique rotas diretas de cadastro e os pontos de entrada de GitHub/Google, incluindo callbacks. Use provisionamento administrativo ou por convite se esse fluxo já existir. Se não houver forma autorizada de criar contas, registre como os membros serão provisionados antes de desligar os provedores em produção.
- [ ] Verifique contas antigas dependentes de OAuth e prepare uma forma verificada de migração ou recuperação antes de desativar o último método de entrada dessas pessoas. Preserve registros, permissões e vínculos com produtos ou comunidade. Revise o comportamento para visitante, conta válida, credenciais inválidas e acesso sem permissão. [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)

## 6. Auditar segurança, segredos e rate limit

- [ ] Faça uma varredura do código, histórico Git disponível, configuração de CI, arquivos de ambiente rastreados, assets públicos, bundles do cliente, sourcemaps, responses e logs relevantes. Diferencie IDs ou chaves publicáveis previstos pelo provedor de chaves privadas, tokens e credenciais. Mantenha segredos no servidor ou no gerenciador do ambiente. Se identificar exposição, relate somente localização, impacto e correção, sem imprimir valores. Trate a credencial como comprometida e encaminhe a revogação e rotação conforme o acesso e a autorização disponíveis.
- [ ] Revise autenticação e autorização no servidor, acesso entre contas, escopo de consultas, cookies e sessões, validação de entradas, CSRF onde a autenticação por cookie exigir, CORS, cache de páginas privadas, mensagens de erro e cabeçalhos. Se houver CSP, teste a integração com estilos dinâmicos, GSAP, mocks e Cloudflare sem afrouxá-la globalmente para acomodar um componente.
- [ ] Configure limites para login, recuperação e endpoints sensíveis ou de custo elevado que existirem. No servidor, use contadores consistentes entre instâncias e combine sinais de origem com conta quando adequado. Confie em IP encaminhado apenas de proxies verificados. Defina janelas e limites por rota a partir do tráfego esperado e das capacidades do ambiente. Verifique bloqueio temporário, recuperação e comportamento da resposta. Para APIs, retorne `429` e `Retry-After` quando aplicável. Use o WAF como camada adicional.
- [ ] Revise dependências e otimizações que estejam no escopo. Registre o que foi verificado, o que foi corrigido e o que depende de acesso externo. Diferencie ausência de achados na varredura realizada de uma garantia absoluta de segurança. [OWASP Secrets Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html) · [Parâmetros de rate limiting do Cloudflare](https://developers.cloudflare.com/waf/rate-limiting-rules/parameters/)

## 7. Preparar a verificação do Cloudflare antes da home

- [ ] Configure e teste em ambiente privado autorizado uma **Challenge Page da Cloudflare via WAF** para navegação HTML no hostname correto. O visitante sem clearance deve passar pela verificação na borda antes de receber o HTML da aplicação. Para exigir interação visível, confirme se **Interactive Challenge** está disponível no plano e para a regra pretendida. **Managed Challenge** é uma alternativa que pode verificar de forma automática, então documente essa diferença se ela for usada.
- [ ] Revise a expressão conforme as rotas, os métodos e os hostnames reais. Inclua entradas diretas nas páginas públicas se o requisito abranger o site inteiro. Mantenha assets, APIs, webhooks, callbacks necessários e monitoramento compatíveis com seus fluxos e protegidos pelas regras apropriadas. Confira a passagem do desafio e o `cf_clearance`, para evitar repetição dentro do período configurado. Valide também se a origem direta, endereços alternativos ou aliases de produção podem contornar o WAF e trate conforme a hospedagem real.
- [ ] Teste sessão limpa sem clearance, aprovação manual, retorno ao caminho original, acesso com clearance válido, login depois do desafio e endpoints que precisam responder JSON. Se faltarem plano, permissão, domínio ou ambiente de teste, entregue a regra proposta com os valores que faltam, passos no painel, verificação e reversão. A ativação em produção depende da minha aprovação. [Challenge Pages via WAF](https://developers.cloudflare.com/cloudflare-challenges/challenge-types/challenge-pages/create-custom-rule/) · [Tipos de desafio e compatibilidade](https://developers.cloudflare.com/cloudflare-challenges/challenge-types/challenge-pages/) · [Challenge Passage](https://developers.cloudflare.com/cloudflare-challenges/challenge-types/challenge-pages/challenge-passage/)

## 8. Validar, corrigir e entregar para revisão

- [ ] Execute os scripts de build, tipos, lint e testes relevantes existentes no projeto. Corrija as regressões introduzidas. Registre os comandos e os resultados reais.
- [ ] Teste em 320, 390, 768 e 1280 px, mais desktop largo se disponível. Confira header e menu, todas as placas no hero, textos de transição, seções arredondadas, ausência de overflow horizontal, foco, teclado e contraste. Revise a emenda em movimento e no frame parado.
- [ ] Teste no Chrome e no Safari/WebKit se disponíveis. Valide scroll rápido, inércia, rotação, alteração da barra de endereço, âncoras, troca dos mockups, carrossel e movimento reduzido. Identifique expressamente o que foi simulado e o que foi verificado em aparelho real.
- [ ] Verifique login válido, erro, recuperação, logout, bloqueio do cadastro direto, ausência dos provedores removidos, autorização entre contas, rate limiting e os cenários Cloudflare aplicáveis ao ambiente.
- [ ] Entregue o checklist atualizado, os arquivos principais alterados, a forma de rodar a prévia, evidência visual de desktop e mobile se disponível e um resumo dos testes. Liste pendências de infraestrutura, acesso ou aparelho com a próxima ação concreta. Deixe o trabalho disponível para revisão local ou privada.

## Apêndices de implementação

Os trechos abaixo são os componentes fornecidos. Adapte a tipagem, os estilos e os imports ao projeto, preserve os créditos e aplique as decisões do checklist. Os exemplos de imagem e os textos genéricos da demonstração ficam fora da integração.

### A. TiltedGridHero

```tsx
"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/* ── the curved row ──────────────────────────────────────────────
 * Scroll Tilted Grid turned on its side, with the tilt drawn as a curve.
 * One row of images streams from right to left around the inside of a
 * cylinder. The centre faces you flat, the ends bend toward you so each
 * end image curves along its length, and the ends fade into the page.
 *
 * A CSS box can't bend, so every tile is cut into SLICES vertical strips,
 * each a flat facet of the cylinder showing its share of the image. The
 * strips sit still inside their tile, each turned its own few degrees
 * round the cylinder's axis, and the tile (preserve-3d) is what moves: one
 * rotateY about that same axis carries the whole tile along the arc. A
 * tile is one animation, so its strips can never drift apart or show
 * different images. Only a tile's delay differs, and that sets where on
 * the arc it sits. The band is transform-only on the compositor; the fade
 * is a static mask over it.
 *
 * The only JS is a ResizeObserver that sizes the loop, and a handler that
 * hands a tile its next image each time it wraps, out of sight.
 * ─────────────────────────────────────────────────────────────── */

// Strips per tile. Each is a few degrees of arc, too little to read as a
// facet; fewer starts to show corners along the top and bottom edges. A
// tight curve wraps a tile round a wide arc, so it needs this many.
const SLICES = 16;

// Camera distance from the screen, as a multiple of the cylinder's radius.
// Just past the axis, so the ends come right up to the lens and swell; much
// further back and the row flattens out however tight the cylinder.
const CAMERA = 1.6;

/**
 * Cylinder radius, as a share of the hero's width, that puts the frame's
 * edge `bend` radians round the arc as seen through the camera:
 * r·sinθ · CAMERA / (CAMERA − 1 + cosθ) = width / 2, solved for r.
 */
function arc(bend: number) {
  return (CAMERA - 1 + Math.cos(bend)) / (2 * CAMERA * Math.sin(bend));
}

// A tile is never wider than this share of the hero, so a phone still
// shows its neighbours instead of one tile edge to edge.
const MAX_WIDTH = 55;

/**
 * Lays the loop on the cylinder. The radius puts the frame's edge `bend`
 * radians round the arc (see `arc`). Angles come back in degrees: `unit`
 * is the arc one tile-height spans, `limit` how far round a tile's centre
 * can go before the whole tile is off-screen, and `sweep` how far round
 * the loop's ends sit. The loop reaches past `limit`, so a tile only ever
 * wraps out of sight, and is rounded up to a whole number of tiles so the
 * gap never stretches.
 */
function measure(
  width: number,
  height: number,
  tile: number,
  aspect: number,
  gap: number,
  bend: number,
) {
  const h = Math.min(
    (tile / 100) * height,
    ((MAX_WIDTH / 100) * width) / aspect,
  );
  const radius = width * arc(bend);
  if (!(h > 0) || !(radius > 0))
    return { columns: 2, sweep: 0, unit: 0, limit: 0 };
  const deg = (rad: number) => (rad * 180) / Math.PI;
  const unit = deg(h / radius);
  const pitch = (aspect + gap / 100) * unit;
  const limit = deg(bend) + (aspect * unit) / 2;
  // Capped so a hero squeezed to a sliver can't mount thousands of tiles.
  const columns = Math.min(60, Math.max(2, Math.ceil((2 * limit) / pitch)));
  const round = (n: number) => +n.toFixed(4);
  const sweep = round((columns * pitch) / 2);
  return {
    columns,
    sweep,
    unit: round(unit),
    limit: round(Math.min(sweep, limit)),
  };
}

export type TiltedGridImage = {
  src: string;
  /** Only used if you drop the decorative treatment; the band is aria-hidden. */
  alt?: string;
};

export type TiltedGridHeroProps = {
  /**
   * Images run along the row in order. A tile takes its next image each
   * time it wraps off-screen, so the whole list plays through however
   * few tiles the frame needs. Short lists simply repeat.
   */
  images: TiltedGridImage[];
  /**
   * Seconds for the row to advance by one tile. Speed is per tile, not per
   * crossing, so a phone and an ultrawide move at the same pace.
   * @default 4
   */
  speed?: number;
  /** Tile height, as a percentage of the hero's height. @default 26 */
  tileHeight?: number;
  /** Tile width divided by tile height. @default 16 / 9 */
  aspectRatio?: number;
  /** Space between tiles, as a percentage of a tile's height. @default 6 */
  gap?: number;
  /** Vertical centre of the row, as a percentage of the hero's height. @default 56 */
  axis?: number;
  /**
   * How far the row has bent round by the frame's edge, in degrees. Higher
   * curls the ends harder toward the viewer. Clamped to 5–85.
   * @default 80
   */
  curve?: number;
  /** Width of the fade at each end, as a percentage of the hero's width. @default 12 */
  fade?: number;
  /** Content rendered above the band. */
  children?: React.ReactNode;
  className?: string;
};

export function TiltedGridHero({
  images,
  speed = 4,
  tileHeight = 26,
  aspectRatio = 16 / 9,
  gap = 6,
  axis = 56,
  curve = 80,
  fade = 12,
  children,
  className,
  ...props
}: React.ComponentProps<"div"> & TiltedGridHeroProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const id = React.useId().replace(/[^a-zA-Z0-9]/g, "");
  const orbit = `tgh-o-${id}`;
  const tile = `tgh-t-${id}`;
  const bend = (Math.min(85, Math.max(5, curve)) * Math.PI) / 180;

  // Null until the observer has measured the hero. The band stays hidden
  // until then, so a first paint laid out for the wrong size never shows.
  const [layout, setLayout] = React.useState<ReturnType<typeof measure> | null>(
    null,
  );

  // The image each tile shows, as a position in the run of images. It
  // only changes when the tile wraps, which is out of sight, so a resize
  // never swaps an image on screen either.
  const [shown, setShown] = React.useState<Record<number, number>>({});

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      const next = measure(width, height, tileHeight, aspectRatio, gap, bend);
      setLayout((prev) =>
        prev?.columns === next.columns &&
        prev.sweep === next.sweep &&
        prev.unit === next.unit
          ? prev
          : next,
      );
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [tileHeight, aspectRatio, gap, bend]);

  // Fetch every image up front. A tile picks up its next one just before
  // it comes back into view, too late to start loading it then.
  React.useEffect(() => {
    for (const { src } of images) new Image().src = src;
  }, [images]);

  const { columns, sweep, unit, limit } =
    layout ?? measure(1200, 560, tileHeight, aspectRatio, gap, bend);

  // Every length is a multiple of the tile's height, which follows the
  // hero's height until MAX_WIDTH caps it on narrow screens.
  const u = (n: number) =>
    `calc(${+n.toFixed(4)} * min(${tileHeight}cqh, ${+(
      MAX_WIDTH / aspectRatio
    ).toFixed(4)}cqw))`;

  const r = 100 * arc(bend);
  const radius = `${+r.toFixed(3)}cqw`;
  // Out to the axis, round it, back in: a box sits on the cylinder at the
  // angle rotateY gives it.
  const turn = (deg: number) =>
    `translateZ(${radius}) rotateY(${+deg.toFixed(4)}deg) translateZ(-${radius})`;

  // Beyond `limit` a tile is wholly off-screen, so it is hidden there. The
  // loop's ends, where it wraps, fall inside that stretch, and so do tiles
  // swinging round behind the camera.
  const hide = +(((sweep - limit) / (2 * sweep || 1)) * 100).toFixed(4);
  const css =
    `@keyframes ${orbit}{` +
    `from{transform:${turn(-sweep)}}to{transform:${turn(sweep)}}` +
    `0%,${hide}%,${100 - hide}%,100%{visibility:hidden}` +
    `${hide + 0.001}%,${100 - hide - 0.001}%{visibility:visible}}` +
    // Pausing rather than removing the motion keeps the band whole: every
    // tile is already placed by its negative delay, so it freezes as a
    // finished still.
    `@media(prefers-reduced-motion:reduce){.${tile}{animation-play-state:paused}}`;

  const share = aspectRatio / SLICES;
  const duration = columns * speed;
  const mask = `linear-gradient(90deg,transparent,#000 ${fade}%,#000 ${
    100 - fade
  }%,transparent)`;

  return (
    <div
      ref={ref}
      className={cn("relative overflow-hidden", className)}
      {...props}
      style={{ containerType: "size", ...props.style }}
    >
      <style>{css}</style>

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 transition-opacity duration-500"
        style={{
          opacity: layout ? 1 : 0,
          // A shared vanishing point on the row's centre line, so the ends
          // grow evenly above and below it as they come toward the viewer.
          perspective: `${+(r * CAMERA).toFixed(3)}cqw`,
          perspectiveOrigin: `50% ${axis}%`,
          maskImage: mask,
          WebkitMaskImage: mask,
        }}
      >
        {Array.from({ length: columns }, (_, t) => {
          // Tile `columns - 1` starts nearest the exit and tile 0 furthest
          // back, so this numbers tiles in the order they come on.
          const first = columns - 1 - t;
          const img = images[(shown[t] ?? first) % Math.max(images.length, 1)];
          return (
            <div
              key={t}
              className={cn(tile, "absolute")}
              style={{
                left: `calc(50% - ${u(aspectRatio / 2)})`,
                top: `calc(${axis}% - ${u(0.5)})`,
                width: u(aspectRatio),
                height: u(1),
                transformStyle: "preserve-3d",
                // Tile t starts t tiles along the loop.
                animation: `${orbit} ${duration}s linear ${-t * speed}s infinite`,
              }}
              onAnimationIteration={(e) => {
                // elapsedTime counts whole loops, missed events included.
                const lap = Math.round(e.elapsedTime / duration);
                setShown((prev) => {
                  const next = lap * columns + first;
                  return prev[t] === next ? prev : { ...prev, [t]: next };
                });
              }}
            >
              {Array.from({ length: SLICES }, (_, k) => (
                <div
                  key={k}
                  className={cn(
                    "absolute top-0 overflow-hidden bg-muted",
                    k === 0 && "rounded-l-lg",
                    k === SLICES - 1 && "rounded-r-lg",
                  )}
                  style={{
                    // Every strip starts at the tile's centre and is turned
                    // round the axis to its own place on the arc.
                    left: u((aspectRatio - share) / 2),
                    // A pixel wider than its share, so neighbouring facets
                    // overlap and no hairline opens between them. The last
                    // has no neighbour to cover.
                    width:
                      k === SLICES - 1 ? u(share) : `calc(${u(share)} + 1px)`,
                    height: u(1),
                    transform: turn(
                      (aspectRatio / 2 - (k + 0.5) * share) * unit,
                    ),
                  }}
                >
                  {img ? (
                    <img
                      src={img.src}
                      alt={k === 0 ? (img.alt ?? "") : ""}
                      draggable={false}
                      className="absolute top-0 max-w-none object-cover"
                      style={{
                        left: u(-k * share),
                        width: u(aspectRatio),
                        height: u(1),
                      }}
                    />
                  ) : null}
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {children}
    </div>
  );
}

export default TiltedGridHero;
```

### B. GradualBlur

```jsx
'use client';

import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';

import './GradualBlur.css';

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

const CURVES = {
  linear: t => t,
  bezier: t => t * t * (3 - 2 * t),
  'ease-in': t => t * t,
  'ease-out': t => 1 - (1 - t) * (1 - t),
  'ease-in-out': t => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2)
};

const DIRECTIONS = { top: 'to top', bottom: 'to bottom', left: 'to left', right: 'to right' };

const clamp01 = value => Math.min(Math.max(value, 0), 1);

const toLength = value => (typeof value === 'number' ? `${value}px` : value);

const toTime = value => (typeof value === 'number' ? `${value}s` : value);

const findScroller = (container, root, target, vertical) => {
  if (container) {
    if (typeof container === 'string') return document.querySelector(container);
    return 'current' in container ? container.current : container;
  }
  if (target === 'page') return window;
  const parent = root.parentElement;
  if (!parent) return null;
  const scrolls = node => {
    const style = getComputedStyle(node);
    return /(auto|scroll|overlay)/.test(vertical ? style.overflowY : style.overflowX);
  };
  const sibling = Array.from(parent.children).find(child => child !== root && scrolls(child));
  return sibling || (scrolls(parent) ? parent : null);
};

const GradualBlur = ({
  position = 'bottom',
  target = 'parent',
  height = '6rem',
  width,
  strength = 2,
  layers = 8,
  curve = 'linear',
  exponential = true,
  opacity = 1,
  saturation = 1,
  tint = 'transparent',
  autoHide = false,
  container,
  hoverIntensity = 1,
  duration = 0.3,
  easing = 'ease-out',
  zIndex = 1000,
  className = '',
  style
}) => {
  const rootRef = useRef(null);
  const edge = DIRECTIONS[position] ? position : 'bottom';
  const vertical = edge === 'top' || edge === 'bottom';

  const stack = useMemo(() => {
    const count = Math.min(Math.max(Math.round(layers) || 1, 1), 16);
    const shape = CURVES[curve] || CURVES.linear;
    const maxBlur = Math.max(strength, 0) * 12;
    const level = u => {
      const t = shape(clamp01(u));
      return maxBlur * (exponential ? (Math.pow(2, 4 * t) - 1) / 15 : t);
    };
    const boost = Math.pow(Math.max(saturation, 0), 1 / count);
    const fade = `${toTime(duration)} ${easing}`;
    const direction = DIRECTIONS[edge];
    const steps = [];
    for (let i = 0; i < count; i++) {
      const from = level(i / count);
      const to = level((i + 1) / count);
      const radius = Math.sqrt(Math.max(to * to - from * from, 0));
      const filter = [
        `blur(calc(${radius.toFixed(3)}px * var(--gradual-blur-reveal, 1) * var(--gradual-blur-hover, 1)))`,
        boost !== 1 ? `saturate(calc(1 + ${(boost - 1).toFixed(4)} * var(--gradual-blur-reveal, 1)))` : ''
      ]
        .filter(Boolean)
        .join(' ');
      const mask = `linear-gradient(${direction}, transparent ${((i / count) * 100).toFixed(2)}%, #000 ${(((i + 1) / count) * 100).toFixed(2)}%)`;
      steps.push({
        position: 'absolute',
        inset: 0,
        borderRadius: 'inherit',
        backdropFilter: filter,
        WebkitBackdropFilter: filter,
        maskImage: mask,
        WebkitMaskImage: mask,
        opacity,
        transition: `backdrop-filter ${fade}, -webkit-backdrop-filter ${fade}`
      });
    }
    const stops = Array.from({ length: 9 }, (_, k) => {
      const u = k / 8;
      const t = shape(u);
      const alpha = t * t * t * (t * (t * 6 - 15) + 10);
      return `rgba(0, 0, 0, ${alpha.toFixed(3)}) ${(u * 100).toFixed(1)}%`;
    }).join(', ');
    const tintMask = `linear-gradient(${direction}, ${stops})`;
    const wash =
      tint && tint !== 'transparent'
        ? {
            position: 'absolute',
            inset: 0,
            borderRadius: 'inherit',
            background: tint,
            maskImage: tintMask,
            WebkitMaskImage: tintMask,
            opacity: 'calc(var(--gradual-blur-reveal, 1) * min(var(--gradual-blur-hover, 1), 1))',
            transition: `opacity ${fade}`
          }
        : null;
    return { steps, wash };
  }, [layers, curve, strength, exponential, saturation, duration, easing, edge, opacity, tint]);

  useIsomorphicLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    if (!autoHide) {
      root.style.removeProperty('--gradual-blur-reveal');
      return undefined;
    }
    const scroller = findScroller(container, root, target, vertical);
    if (!scroller) return undefined;
    const element = scroller instanceof Element ? scroller : null;
    const start = edge === 'top' || edge === 'left';

    const update = () => {
      const page = document.documentElement;
      const offset = element
        ? vertical
          ? element.scrollTop
          : element.scrollLeft
        : vertical
          ? window.scrollY
          : window.scrollX;
      const limit = element
        ? vertical
          ? element.scrollHeight - element.clientHeight
          : element.scrollWidth - element.clientWidth
        : vertical
          ? page.scrollHeight - window.innerHeight
          : page.scrollWidth - window.innerWidth;
      const box = root.getBoundingClientRect();
      const reach = Math.max(vertical ? box.height : box.width, 1);
      const room = start ? offset : limit - offset;
      root.style.setProperty('--gradual-blur-reveal', clamp01(room / reach).toFixed(3));
    };

    update();
    const source = element ?? window;
    source.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    const observer = element && typeof ResizeObserver !== 'undefined' ? new ResizeObserver(update) : null;
    if (observer && element) {
      observer.observe(element);
      if (element.firstElementChild) observer.observe(element.firstElementChild);
    }
    return () => {
      source.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
      observer?.disconnect();
    };
  }, [autoHide, container, target, edge, vertical]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || hoverIntensity === 1) return undefined;
    let frame = 0;
    let inside = false;
    let point = null;

    const check = () => {
      frame = 0;
      if (!point) return;
      const box = root.getBoundingClientRect();
      const now = point.x >= box.left && point.x <= box.right && point.y >= box.top && point.y <= box.bottom;
      if (now === inside) return;
      inside = now;
      root.style.setProperty('--gradual-blur-hover', inside ? String(Math.max(hoverIntensity, 0)) : '1');
    };

    const onMove = event => {
      point = { x: event.clientX, y: event.clientY };
      if (!frame) frame = requestAnimationFrame(check);
    };

    const onLeave = () => {
      point = null;
      inside = false;
      root.style.setProperty('--gradual-blur-hover', '1');
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', onLeave);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('pointermove', onMove);
      document.documentElement.removeEventListener('pointerleave', onLeave);
      root.style.removeProperty('--gradual-blur-hover');
    };
  }, [hoverIntensity]);

  const depth = toLength(vertical ? height : (width ?? height));
  const span = vertical && width != null ? toLength(width) : null;

  const rounded = target !== 'page' && !span;
  const corner = (a, b) => (rounded && (edge === a || edge === b) ? 'inherit' : undefined);

  const rootStyle = {
    position: target === 'page' ? 'fixed' : 'absolute',
    zIndex,
    borderTopLeftRadius: corner('top', 'left'),
    borderTopRightRadius: corner('top', 'right'),
    borderBottomLeftRadius: corner('bottom', 'left'),
    borderBottomRightRadius: corner('bottom', 'right'),
    top: edge === 'bottom' ? undefined : 0,
    bottom: edge === 'top' ? undefined : 0,
    left: edge === 'right' ? undefined : 0,
    right: edge === 'left' ? undefined : 0,
    height: vertical ? depth : undefined,
    width: vertical ? (span ?? undefined) : depth,
    marginInline: span ? 'auto' : undefined,
    ...style
  };

  return (
    <div ref={rootRef} className={`gradual-blur ${className}`.trim()} style={rootStyle} aria-hidden="true">
      {stack.steps.map((layer, index) => (
        <div key={index} style={layer} />
      ))}
      {stack.wash && <div style={stack.wash} />}
    </div>
  );
};

export default GradualBlur;
```

#### GradualBlur.css

```css
.gradual-blur {
  pointer-events: none;
}
```
