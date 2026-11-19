# Refração transparente do hero

Intensidade atual do blur: cerca de **16px no desktop**, concentrada nas bordas e com queda progressiva até zero no centro. A máscara avança 40% por lado e tem uma queda mais lenta que a versão anterior. As medidas de 4px e capturas de blur anteriores abaixo são históricas; a versão reforçada está em `chrome-*-strong-edge-blur.png`.

Atualização atual: blur progressivo mais forte nas bordas (aproximadamente 4px no desktop), caindo até zero no centro. A máscara usa o canal azul do mesmo mapa óptico; uma etapa de blur é combinada ao centro nítido. A refração intensificada permanece. O mapa foi reduzido para 128×128px para conter o tamanho do asset. Sem biblioteca, canvas ou rasterização por frame.

Versão atual: distorção real do fundo nas bordas do card, sem blur ou camada fosca. A biblioteca anterior permanece removida.

- Um mapa óptico estático de 128×128px, embutido como data URI, controla o deslocamento e a máscara de blur. Usa uma etapa `feDisplacementMap` e uma etapa `feGaussianBlur`; as medidas históricas de 8,6 KB pertencem à versão anterior sem máscara de blur.
- Intensidade ampliada a pedido do usuário: `scale="0.24"` em coordenadas proporcionais. Numa largura de 640px, o deslocamento máximo horizontal fica próximo de 75px. A curvatura agora penetra 38% por lado em cada eixo, com queda progressiva até a região central.
- Mapa calculado somente pelo script `scripts/generate-hero-glass-map.mjs`, que gera `src/lib/hero-glass-map.ts`. Sem rasterização por frame, canvas de runtime, loops ou dependência adicional.
- Dimensões, topo na altura dos ombros, avatar e fade inferior mantidos.
- Refração ativada no Chrome/Edge. WebKit/Safari e outros motores mantêm vidro transparente sem distorção, devido à limitação do filtro SVG sobre o backdrop. Não há alegação de paridade entre motores.

O teste Playwright de geometria/refração cobre 320, 390, 768 e 1440px. Na versão anterior, uma verificação visual com listras de alto contraste confirmou deslocamento localizado: diferença média ~99 na borda e 0 na região central medida, com o filtro ligado/desligado. Esses números pertencem à intensidade anterior e não medem velocidade nem qualidade estética. A versão intensificada tem capturas `chrome-*-intense.png`.

Os dados em `results.json` registram uma primeira passagem durante o ajuste de detecção do Chrome headless; a amostra Chrome 390px ainda está marcada como fallback nessa passagem. O teste Playwright posterior confirmou modo ativo nas quatro larguras. `displacement-check.json` e as capturas `*pattern.png` registram a verificação final de deslocamento localizado. Captura desktop final em `chrome-1440.png`.

Typecheck e ESLint passaram. Não foi realizado benchmark comparativo de FPS contra a biblioteca removida. Nenhum deploy ou relaxamento de CSP foi feito.

Verificação do blur progressivo: `edge-blur-check.json` compara a mesma cena com blur ligado/desligado, mantendo a refração. Na versão de mapa 256px, a diferença média foi ~76 na faixa de borda e ~0,03 no centro (escala 0–255), confirmando a distribuição. A geometria foi novamente testada após reduzir o mapa para 128px. Capturas da versão com blur em `chrome-*-edge-blur.png`.
