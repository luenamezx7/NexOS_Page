# Mola física para as bordas

Base física em `src/lib/edge-spring.ts`, usando `motion@13.3.0`, já instalado no projeto. Nenhuma biblioteca adicional foi necessária.

A implementação nativa da Apple é [CASpringAnimation](https://developer.apple.com/documentation/quartzcore/caspringanimation)/SwiftUI. Esta base web usa o modelo físico do [Motion](https://motion.dev/docs/spring), inspirado nesse comportamento; não é uma biblioteca oficial da Apple nem uma cópia exata dos presets nativos.

Preset: massa 1,35, rigidez 95 e amortecimento 19. Não usa duração fixa, cubic-bezier ou bounce artificial. A resposta tem um pequeno overshoot e dissipa energia até repousar.

- `edgeSpringPhysics`: opções para `useSpring`/`springValue`, com um valor independente para a borda superior e outro para a inferior.
- `edgeSpringTransition`: transição de componente Motion.
- `getEdgeSpringTransition(reducedMotion)`: versão de componente sem animação quando a preferência reduzida está ativa.
- `createEdgeSpring(from, to, velocity)`: gerador físico independente, preservando a velocidade de entrada. Não cria RAF, listeners, timers ou animações sozinho; só avança quando for amostrado.

## Interação implementada

`EdgeSpring` monta somente na homepage. Ao puxar além do limite, abre uma reserva real de rolagem de meia viewport. No topo, um espaço vazio temporário é inserido antes do conteúdo e a página rola dentro dele; o header continua fixo, sem transform ou mola. No final, a seção preta expande meia viewport, mantendo o wordmark ancorado na mesma superfície. A rolagem revela o restante da logo e desloca o footer no fluxo normal, sem sobreposição.

O gesto usa resistência progressiva. Ao soltar, `createEdgeSpring` anima o offset real da página (via scroll nativo em desktop e toque), preservando velocidade; no repouso a reserva é removida no mesmo frame e o limite normal é restaurado. O Lenis sincroniza os limites ao encerrar o gesto. Eventos de entrada consecutivos são agrupados por frame. Não há translação do conteúdo nem animação isolada da logo. A posição visual fica limitada a meia viewport.

Modais, header, campos, sliders e áreas com rolagem própria não iniciam o efeito. Perda de foco, resize, navegação, apresentação e desmontagem restauram o fluxo. Listeners, timers e RAF são removidos ao desmontar. O bounce nativo vertical é desativado enquanto a homepage está montada para evitar duas molas simultâneas. Segue a política atual do produto de movimento ativo.

O comportamento de referência é o [bounce do UIScrollView](https://developer.apple.com/documentation/uikit/uiscrollview/bounces). É uma implementação web inspirada no modelo nativo; não executa UIKit/SwiftUI no navegador.
