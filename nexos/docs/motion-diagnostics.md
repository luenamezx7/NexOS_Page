# Movimento e diagnóstico

A política atual respeita `prefers-reduced-motion`. Com redução ativa, o site apresenta conteúdo estático, pula a abertura, pausa reprodução automática, desativa Lenis e simplifica as jornadas de dispositivos e processo. Vídeos continuam com controles manuais. Sem redução, a experiência completa permanece ativa; memória e número de núcleos não alteram a preferência do visitante. A preferência pode mudar durante a visita e é registrada no diagnóstico.

A apresentação começa em CSS no HTML do servidor, sem aguardar hidratação, fontes ou shaders. A capa expira após 2,7 segundos; se o JavaScript chegar depois, não reabre a apresentação. O movimento de entrada usa transform/opacity; a apresentação mostra somente o contador de 0% a 100%, em Satoshi Black (900), sem barra inferior; o contador React acompanha quando a hidratação estiver disponível. Sem JavaScript, o conteúdo fica acessível pelo fallback existente.

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

O CSS preserva as condições nativas de movimento, incluindo regras importadas. O antigo plugin `postcss-full-motion.cjs`, que removia essas condições, foi retirado. As consultas JavaScript usam `motionMedia` sem reescrita e um hook reativo baseado na preferência real do navegador. O relatório usa `effectiveMotion: reduced | full`.

Os resultados abaixo são históricos, anteriores à atualização de 15/11/2026. Para a rodada atual, consulte `site-catalogo-conversao/RELATORIO-2026-11-15.md`; afirmações históricas de movimento completo em `reduce` não descrevem mais a política vigente.

## Preview validado — 13/11/2026

https://nexos-j7ut2qwcb-nex-os2.vercel.app — Vercel Ready, protegido por autenticação. Resposta HTML HTTP 200 confirmada por acesso autenticado do CLI. Produção não foi alterada.

Build e 5 testes unitários passaram. As três suítes principais passaram com 21 cenários; após centralizar o processamento de CSS, as suítes de diagnóstico e dispositivos foram repetidas e passaram com 13 cenários. O CSS final foi inspecionado e não contém condições `prefers-reduced-motion`. O PC físico do trabalho ainda não foi testado.

## Apresentação — contador sem barra (14/11/2026)

A barra inferior e seu texto visual foram removidos. O número de 0% a 100% usa
Satoshi Black (900), com o indicador acessível no próprio contador. Duração,
logo, saída e opção de pular foram preservadas. Build, tipos e lint dos arquivos
alterados passaram. Os oito cenários de apresentação passaram entre a suíte
inicial e a repetição do contador, cujo teste agora observa o 0% no momento da
montagem para evitar uma disputa com o primeiro frame de animação.

Produção Ready: `dpl_21eKv2kXrgqLhdBRgx2VJArNTVgX`,
`https://nexos-7ksh1qob4-nex-os2.vercel.app`, associado a `https://nexoslab.online`.
