# Fade refinado do hero

O véu branco deixou de atingir opacidade alta no meio do card. A progressão foi redistribuída: 15% de opacidade no meio do gradiente (antes 60% pouco depois do meio), concentrando a chegada ao fundo claro abaixo da figura.

Altura do véu: 280px no mobile e até 360px no desktop. As máscaras próprias do PNG e do card continuam dissolvendo a base; o fundo chega à cor exata da próxima seção. Dimensões e posição do avatar/card, refração e blur foram preservados.

Capturas revisadas em 390 e 1440px. Teste Playwright do hero passou em 320, 390, 768 e 1440px, verificando geometria, encaixe do fade, refração e ausência de overflow. Nenhuma biblioteca, blur extra ou animação foi adicionada. Sem deploy.
