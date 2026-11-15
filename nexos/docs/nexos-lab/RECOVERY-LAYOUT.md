# Correção das telas enviadas em correções-uso

As três imagens de 14/11/2026 mostram o formulário de redefinição e sua confirmação.
O conteúdo encostava nas bordas do card porque ResetPasswordForm usava somente a
classe externa `panel`, sem os wrappers de padding adotados no login. Na confirmação,
o rodapé acompanhava o conteúdo curto e deixava uma grande faixa vazia abaixo.

## Correção

- Recuperação e estado sem token usam CardHeader, CardContent e CardFooter existentes.
- Padding horizontal de 32 px, reduzido para 24 px em telas pequenas; separação de
  16/24 px entre textos, campos e ações. O foco do campo permanece dentro do card.
- A estrutura de autenticação ocupa a altura disponível com flex; o rodapé fica
  no final da tela quando há pouco conteúdo e segue o fluxo quando é preciso rolar.
- Textos, destinos, token e lógica de redefinição permanecem nos fluxos atuais.

Avaliação Refactoring UI limitada a essas telas: 8/10 antes (6 de 8 critérios),
com falhas em espaço interno e consistência de espaçamento. Após a correção e
inspeção das capturas, os oito critérios do recorte são atendidos (10/10). Essa
avaliação visual não representa uma auditoria completa de acessibilidade do site.

## Verificação

Build, tipos, lint dos arquivos alterados e diff sem erros passaram.
Chrome: 10/10 cenários, incluindo seis regressões de acesso e quatro de layout.
WebKit: 4/4 cenários de layout. Larguras: 320, 390, 932 e 1440 px.
Formulário, sucesso, remoção do token da URL e link ausente foram verificados.
Respostas do reset foram simuladas: nenhuma senha real foi alterada.

Capturas em `recovery-form-{320,390,932,1440}.png` e
`recovery-success-{320,390,932,1440}.png` nesta pasta.

Publicado em `https://nexoslab.online`: deployment
`dpl_6eCwCNi6XnMTuqQ8MM2TugnzLZKa`, estado `READY`.
Versão: `https://nexos-le2ujfh8z-nex-os2.vercel.app`.
A verificação obrigatória de entrada foi mantida explicitamente no deploy.
