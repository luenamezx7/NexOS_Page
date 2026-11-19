# Fade do hero baseado na referência PróLINK

Referência inspecionada no navegador e no CSS público em 18/11/2026: [prolink.rafaeltakehara.pro](https://prolink.rafaeltakehara.pro/), regras `.lx-stage` e `.lx-stage::after` em `quiz.css`. O site apresentou a variante clara durante a captura; a cor do palco é compartilhada pelo fundo e pelo fim do gradiente.

O efeito da referência tem uma camada simples de gradiente transparente → cor do palco, ocupando os últimos 34% do conjunto de aparelhos. Não empilha máscaras independentes de desaparecimento em cada aparelho.

Adaptação implementada:

- Removidas as máscaras antigas do avatar e do card, além da máscara de vários estágios sobre o fade. A pedido posterior do usuário, o PNG recebeu apenas um feather discreto nos últimos 22% (pernas); o card continua sem máscara própria.
- O fundo-base do hero agora tem a mesma cor da seção Gestão. O vídeo permanece escuro na região de leitura e chega a esse fundo antes do fim do conjunto visual; ele não depende do fade dos objetos para trocar de cor.
- Um único gradiente contínuo dissolve os últimos 34% da altura renderizada do PNG, cobrindo também o card e terminando na cor exata da seção seguinte.
- Os 72px de espaço inferior existentes continuam com a mesma cor final, sem introduzir outra troca de cor.
- Medidas, posição, refração e blur do card preservados. Sem novos efeitos de blur, animações ou biblioteca.

Arquivos: `src/components/Hero.module.css`, `HeroVideo.module.css`, `Hero.tsx` e a variável de espaçamento compartilhada em `src/app/globals.css`. O teste do hero também verifica o feather local do PNG, ausência de máscara no card/fade e igualdade das cores de superfície.

Capturas da referência: `reference-390.png` e `reference-1440.png`. Capturas da implementação: `implemented-390.png` e `implemented-1440.png`. A aparência do vídeo/texto animado varia entre capturas; não são comparações determinísticas por pixel.

Medições finais em `results.json`: Chrome e WebKit, larguras 320, 390, 768, 1440 e 2560px. Não representam aparelhos físicos. A inspeção visual principal foi feita em 390 e 1440px.

As pastas anteriores de fade documentam versões superadas. Nenhum deploy foi executado.
