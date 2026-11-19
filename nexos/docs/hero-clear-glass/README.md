# Vidro transparente do hero

**Versão intermediária:** após nova orientação do usuário, foi adicionada refração localizada sem blur. Veja `../hero-clear-refraction/` para o estado atual. Os resultados abaixo correspondem à versão anterior sem refração.

A biblioteca de Liquid Glass foi removida a pedido do usuário por peso e aparência excessivamente fosca. O card usa agora apenas gradiente transparente (1–6%), borda e reflexos internos discretos. Não usa backdrop-filter, filter, SVG, canvas, mapa de refração nem dependência adicional.

Preservados: largura compartilhada com os cards coloridos, altura reduzida, topo na região dos ombros, avatar acima do card, máscara inferior e fade branco existente.

O teste Playwright `hero clear glass preserves the avatar and fade without expensive filters` passou em 320, 390, 768 e 1440px. Typecheck e ESLint passaram. Não foi realizado benchmark comparativo de FPS; a redução de custo descrita é a remoção do processamento de refração, não uma medição de desempenho global.

Capturas e dados da verificação visual estão nesta pasta. As pastas anteriores registram versões superadas. Nenhum deploy foi realizado.

Chrome e WebKit foram verificados em 390 e 1440px, com zero pageerrors, zero overflow e ausência de filtros/canvas/SVG no card. WebKit foi executado pelo Playwright, não em aparelho físico.
