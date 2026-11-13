# Diagnóstico de movimento

Abra o preview com `/?motionDebug=1` no computador afetado. Deixe a apresentação terminar, expanda **Diagnóstico de movimento**, role até os exemplos do MacBook e volte ao hero. Aguarde dois segundos e use **Copiar relatório**. Se a área de transferência estiver bloqueada, copie o texto selecionado com Ctrl+C. O painel é recolhível para não atrapalhar a navegação.

O relatório fica em memória nesta aba; não há envio remoto, armazenamento persistente ou alteração das preferências de animação. Só a URL com o parâmetro carrega o painel. Recarregue a página para iniciar uma nova sessão. `build` identifica o host único do deploy Vercel (ou `local`).

- `blocked-reduced-motion` / `reduced-motion`: a condição foi lida do navegador. Não comprova uma configuração manual feita pelo usuário no Windows.
- Scroll `native` com `hardware-policy`: a regra atual impediu o Lenis por memória ou núcleos informados. Não significa que GSAP ou vídeo também foram desativados.
- GSAP `initialized`: o código instalou a animação. Não comprova taxa de quadros ou suavidade; role a página para avaliar visualmente.
- Vídeo `play-rejected`: registra o nome da exceção de `play()`. `NotAllowedError` indica recusa de reprodução, sem deduzir a política específica do Chrome.
- Vídeo `media-error`: código nativo de mídia (1 abortado, 2 rede, 3 decodificação, 4 fonte não suportada). `advancedSincePreviousSample` informa mudança de tempo entre amostras, inclusive volta do loop; não mede FPS.
- `waiting-presentation`, `offscreen` e `document-hidden` são esperas de ciclo de vida, não falhas de hardware.
- Recursos ausentes não foram observados. O histórico guarda até 80 mudanças; a amostragem ocorre a cada segundo apenas enquanto a aba está visível. Erros globais só são observados depois que o painel carrega, e detalhes arbitrários são omitidos.

Se o painel não aparecer mesmo com o parâmetro, verifique no DevTools erros do console e requisições JavaScript que falharam. Um painel React não diagnostica falhas anteriores à própria hidratação. Não há mudança da política de animações nesta etapa: o relatório do PC afetado é necessário para confirmar a causa e definir a correção.

Verificação automatizada: `PLAYWRIGHT_CHANNEL=chrome npm run test:browser -- tests/browser/motion-diagnostics.spec.ts`. O cenário limitado emula 2 núcleos/2 GB e CPU 6 vezes mais lenta, aguardando a apresentação inteira. Isso não reproduz todas as condições de um PC real, como driver, aceleração gráfica e políticas corporativas.
