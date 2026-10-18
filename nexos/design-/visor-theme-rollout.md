# Paleta da viseira — aplicação por etapas

## Referência

Mascote original: `design-/mascote_lobo_header_capuz.svg`.

A paleta foi extraída diretamente dos stops do gradiente SVG `mirror`, sem estimar as cores por uma imagem rasterizada.

| Cor da lente | HEX | Aplicação |
| --- | --- | --- |
| Violeta | `#3328BC` | Profundidade dos gradientes e CTAs |
| Azul | `#005DDA` | Ações e foco do tema claro; transições dos fundos |
| Ciano | `#0BD2D3` | Acentos luminosos no escuro, Topography e reflexos |
| Menta | `#95E9DA` | Transições claras da viseira |
| Amarelo | `#FFE36B` | Reflexos e pontos de luz |
| Laranja | `#FF913E` | Faixas quentes dos gradientes |
| Coral | `#FC3768` | Transição quente entre laranja e magenta |
| Magenta | `#E6008B` | Acentos, fundos e brilho do tema escuro |
| Ameixa | `#650C66` | Profundidade do acabamento metálico |

## Etapa 1 — marca do header

- [x] Publicar uma cópia idêntica do SVG em `public/mascote-lobo-header.svg`.
- [x] Criar a marca compartilhada em `src/components/BrandMark.tsx`.
- [x] Aplicar nos headers da home, dos serviços e do acesso à conta.
- [x] Exibir o lobo em suas cores originais, sem filtro de inversão entre temas.
- [x] Adaptar a largura da marca para desktop e mobile, mantendo texto e mascote visíveis e alinhados também em telas estreitas.
- [x] Usar Aerobus Dotty com o texto `nexos` em minúsculas, altura visual equivalente à do mascote e alinhamento óptico entre as duas marcas.

## Etapa 2 — tokens dos temas

- [x] Definir a paleta de origem em `src/lib/brand-palette.ts` para os renderizadores.
- [x] Definir os tokens `--visor-*` em `src/app/globals.css` para os estilos.
- [x] Migrar os acentos antigos azuis/rosas/roxos para essa família.
- [x] Aplicar gradientes multicoloridos em títulos destacados, detalhes, CTAs e acabamentos.
- [x] Manter a leitura nos dois temas com variações específicas de contraste.

### Tema claro

Textos usam derivados mais profundos de azul, turquesa, âmbar, coral, magenta e violeta. O amarelo e o ciano luminosos da lente aparecem em fundos, reflexos e faixas decorativas.

As paradas do gradiente de texto são `#005DDA`, `#007A7B`, `#9A5700`, `#BA1D47`, `#B6006E` e `#3328BC`: seus contrastes individuais com o fundo creme são de aproximadamente 4,8:1 a 9:1.

### Tema escuro

Textos e acentos combinam ciano, menta, amarelo, laranja, coral, magenta e uma derivação luminosa do violeta (`#8172FF`). As ações usam magenta profundo `#C20076`, violeta e azul para manter texto branco legível, com o espectro completo nos contornos e reflexos.

## Etapa 3 — fundos e efeitos

- [x] Usar azul/ciano da lente na paleta compartilhada do Topography claro.
- [x] Aplicar o espectro ao fundo ASCII do hero nos dois temas.
- [x] Usar a paleta de oito cores no Waves da abertura escura, dentro dos uniforms já existentes.
- [x] Atualizar nuvens, campos radiais, ilustração de linhas e estudos visuais da placa.
- [x] Atualizar os acabamentos metálicos e os defaults dos efeitos reutilizáveis.
- [x] Preservar as superfícies de leitura com glassmorphism.

## Etapa 4 — gradientes animados pontuais

- [x] Adicionar faixas espectrais ao CTA principal e ao botão desktop do header.
- [x] Animar somente `transform` em uma faixa de 3 px, sem animar `background-position` em áreas grandes.
- [x] Usar `IntersectionObserver` por meio de `useInView` para pausar faixas fora da tela.
- [x] Pausar durante a apresentação e a rolagem controlada pelo Lenis.
- [x] Exibir uma versão estática quando `prefers-reduced-motion: reduce` está ativo.
- [x] Reaproveitar as animações WebGL existentes para os fundos multicoloridos.

Componente: `src/components/VisorSpectrum.tsx`. A cópia do mascote permanece um SVG estático, e as faixas não criam novos contextos WebGL.

## Validação

- [x] Cópia publicada do mascote comparada com o SVG original, sem diferenças de conteúdo.
- [x] Build e TypeScript.
- [x] 23 testes de navegador: temas, abertura, ciclo de vida dos efeitos, navegação e regressões de performance.
- [x] Inspeção em desktop e mobile, nos temas claro e escuro.
- [x] Verificação da animação normal e da versão estática com movimento reduzido.
- [x] Verificação de overflow horizontal e de ausência de inversão de cores do mascote.

Os avisos de lint existentes no componente legado `src/components/Topography.tsx` não estão relacionados à mudança de paleta; não houve erro de lint nos arquivos revisados.
