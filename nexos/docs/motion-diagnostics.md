# Movimento e diagnóstico

A política atual apresenta a experiência completa em todos os dispositivos. A preferência `prefers-reduced-motion` do navegador continua disponível no relatório, mas não desativa vídeo, GSAP, animações CSS ou suavização no desktop. Não há seletor nem ativação exigida do visitante. Memória e núcleos não desligam movimentos, e a redução adaptativa de detalhes/resolução foi retirada. Layouts continuam responsivos; touch mantém rolagem nativa e os efeitos ligados ao scroll continuam ativos.

A apresentação começa em CSS no HTML do servidor, sem aguardar hidratação, fontes ou shaders. A capa expira após 2,7 segundos; se o JavaScript chegar depois, não reabre a apresentação. O movimento de entrada e a barra usam transform/opacity; o contador React acompanha quando a hidratação estiver disponível. Sem JavaScript, o conteúdo fica acessível pelo fallback existente.

Efeitos continuam pausando fora da tela e em aba oculta. Vídeos continuam com controles manuais. Uma recusa real de autoplay ou uma API gráfica indisponível ainda depende do navegador: o site não consegue garantir suporte ou FPS de hardware desconhecido.

## Coletar um relatório

Abra `/?motionDebug=1`, espere a apresentação terminar, expanda **Diagnóstico de movimento**, role até os exemplos do MacBook e volte ao hero. Aguarde dois segundos e use **Copiar relatório**. Se a área de transferência estiver bloqueada, copie o texto selecionado com Ctrl+C. A amostragem pausa durante a seleção manual.

O relatório fica em memória nesta aba, sem envio remoto ou armazenamento persistente. Só a URL com o parâmetro carrega o painel. `schemaVersion: 2` separa `environment.reducedMotion` (preferência nativa) de `motionPolicy.effectiveMotion: full` (comportamento do site). `build` identifica o host único do deploy Vercel, ou `local`.

- `presentation: completed-before-hydration`: a abertura em CSS já terminou quando os scripts chegaram; o conteúdo continua disponível.
- Scroll `native`: esperado em touch, telas pequenas ou outras rotas; não indica que as animações foram desligadas. Desktop com ponteiro fino usa Lenis independentemente de memória/núcleos.
- GSAP `initialized`: a animação foi instalada; não mede FPS ou suavidade.
- Vídeo `play-rejected`: nome da exceção de `play()`. `NotAllowedError` indica recusa, sem deduzir a política específica do Chrome.
- Vídeo `media-error`: código nativo (1 abortado, 2 rede, 3 decodificação, 4 fonte não suportada). `advancedSincePreviousSample` mostra mudança de tempo entre amostras, inclusive volta do loop; não mede FPS.
- `waiting-presentation`, `offscreen` e `document-hidden`: esperas do ciclo de vida.
- Histórico: até 80 mudanças, amostragem a cada segundo com aba visível. Erros globais são observados depois que o painel carrega, sem detalhes arbitrários.

Se o painel não aparecer, confira console e requisições JavaScript no DevTools. Um painel React não identifica falhas anteriores à própria hidratação.

## Validação

`PLAYWRIGHT_CHANNEL=chrome npm run test:browser -- tests/browser/motion-diagnostics.spec.ts tests/browser/device-performance.spec.ts tests/browser/brand-entrance.spec.ts`

Inclui sistema em `reduce`, CPU limitada em 6 vezes com 2 núcleos/2 GB informados, abertura completa, chunks JavaScript atrasados, ausência de WebGL, touch, autoplay recusado e arquivo de vídeo inválido. A simulação não reproduz o driver, a GPU ou as políticas corporativas do PC do trabalho.

A política de CSS é aplicada pelo plugin local `scripts/postcss-full-motion.cjs` após Tailwind e Autoprefixer. Isso também cobre regras importadas por bibliotecas: os blocos de redução não entram no CSS publicado, e os blocos condicionados a `no-preference` passam a valer em todos os ambientes, preservando condições de viewport e contraste forçado. As consultas JavaScript usam `motionMedia` e o hook de compatibilidade central, sem modificar APIs globais do navegador.

## Preview validado — 13/11/2026

https://nexos-j7ut2qwcb-nex-os2.vercel.app — Vercel Ready, protegido por autenticação. Resposta HTML HTTP 200 confirmada por acesso autenticado do CLI. Produção não foi alterada.

Build e 5 testes unitários passaram. As três suítes principais passaram com 21 cenários; após centralizar o processamento de CSS, as suítes de diagnóstico e dispositivos foram repetidas e passaram com 13 cenários. O CSS final foi inspecionado e não contém condições `prefers-reduced-motion`. O PC físico do trabalho ainda não foi testado.
