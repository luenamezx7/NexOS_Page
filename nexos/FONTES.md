# Tipografia NexOS

Conjunto conferido no CSS de https://bun.com/ em 18/10/2026.

| Função | Família | Tratamento |
| --- | --- | --- |
| Hero e títulos principais | Archivo Variable | Peso 800–850, largura 78–85%, entrelinha curta |
| Títulos de seção | Archivo Variable | Peso 750–800, largura 85%, escala fluida |
| Subtítulos | Archivo Variable | Peso 650–700, largura 90–100% |
| Textos corridos, navegação, formulários e botões | Fonte nativa do sistema | Base de 16px, entrelinha 1,65–1,75 |
| Quantidades, indicadores, código e rótulos técnicos | Martian Mono Variable | Algarismos tabulares; textos auxiliares com contraste próprio |

Os arquivos WOFF2 são servidos localmente em `public/fonts`, com `font-display: swap`. Apenas Archivo normal e Martian Mono são pré-carregadas; o itálico carrega quando necessário. As licenças SIL Open Font License acompanham os arquivos.

Fontes dos binários:
- https://bun.com/fonts/Archivo.var.woff2
- https://bun.com/fonts/Archivo-italic.var.woff2
- https://bun.com/fonts/MartianMono.var.woff2

Licenças oficiais:
- https://github.com/google/fonts/tree/main/ofl/archivo
- https://github.com/google/fonts/tree/main/ofl/martianmono

Os papéis e tamanhos compartilhados ficam em `src/app/globals.css`. Os módulos de seção consomem esses tokens e preservam as diferenças de escala entre conteúdo editorial, informação técnica e interface.

## Background e leitura

As linhas e campos de cor continuam nas áreas visuais e nas bordas. Na placa, a textura concentra-se à esquerda e o conteúdo comercial recebe uma proteção suave de leitura. Superfícies de conteúdo nas páginas internas são mais opacas nos dois temas, preservando o fundo ao redor delas.

No tema escuro, o hero e as seções alternam entre preto puro (`#000`) e um rosa profundo sólido (`--section-rose-dark`: 8% do magenta da viseira misturado ao preto), sem manchas radiais de cor. As linhas, estrelas, cards e animações coloridas permanecem; `public/nexos-field-dark.svg` mantém o desenho vetorial sem o halo preenchido da versão clara.
