# Validação de retomada — 12/11/2026

O refinamento local foi retomado pelo checklist existente. Alterações anteriores
foram preservadas. Não houve deploy, alteração de WAF, rotação de segredo ou
provisionamento de conta real nesta etapa.

## Resultados confirmados antes do ajuste final do hero

- `npm run typecheck`: passou.
- `npm run lint`: passou, sem erros e com 30 avisos. Eles se concentram em variáveis
  e props não utilizadas, expressões em Topography e `<img>` no carrossel fatiado.
- `npm run test:unit`: 7/7 passaram.
- `npm run test:security`: 9/9 passaram.
- `npm run test:auth:password`: 6/6 passaram.
- `npm run build`: passou no Next.js 16.4.6. Aviso: fallback automático da fonte
  Google Sans indisponível.
- `PLAYWRIGHT_CHANNEL=chrome npm run test:auth:integration`: 17/17 passaram.
  A suíte utiliza schema temporário, removido ao final, e captura os e-mails de
  teste. Cobertura: senha, recuperação, sessão, MFA, WebAuthn, OAuth legado simulado,
  bloqueio público de cadastro e OAuth, recuperação da identidade anterior,
  limites atômicos e provisionamento administrativo sem confirmar e-mail.
- `PLAYWRIGHT_REUSE_SERVER=true PLAYWRIGHT_CHANNEL=chrome npm run test:browser -- tests/browser/lab-refinement.spec.ts tests/browser/auth-regressions.spec.ts tests/browser/brand-entrance.spec.ts tests/browser/device-performance.spec.ts`:
  28/28 passaram. Valida placas, emenda e teclado em 320, 390, 768, 1280 e 1440 px;
  DPR 1, 1,25 e 2; pausa do carrossel; troca e reversão da tela do MacBook;
  menu mobile; apresentação; movimento reduzido; fallback WebGL e bloqueios de acesso.
  Fundo animado: 29,7 FPS com CPU emulada 6× mais lenta.
- `git diff --check`: passou.

As primeiras tentativas de integração e WebKit encontraram restrições do sandbox
(DNS e abertura da porta local). A integração passou após execução autorizada.
O WebKit instalado anteriormente estava incompleto; o arquivo de instalação local
foi validado e extraído. A primeira execução completa passou em 10/11 testes;
a falha em 768 px era uma suposição sobre largura nominal no teste. A verificação
foi atualizada após a nova orientação de usar uma coluna em todas as larguras.

## Ajuste solicitado durante a retomada

O fundo de fibras foi removido do hero, incluindo seu import e os estilos da camada.
Textos, CTA, placas e suas animações foram preservados. O componente GhostFibers
continua disponível no código, mas não é carregado pela home. Os testes de desempenho
foram ajustados para validar o conteúdo e a navegação sem depender desse fundo.
Build, tipos e lint dos arquivos alterados passaram novamente após a remoção.

Após a correção de disposição solicitada pelo proprietário, título, palavra animada,
texto de apoio e CTA ficam centralizados. O card permanece abaixo do CTA em todas
as larguras, no mesmo eixo central, com espaçamento de 48 px no desktop e 32 px no mobile.
O build passou novamente após essa mudança. As capturas finais foram atualizadas.

Chrome após o ajuste final: 13/13 testes passaram, usando as suítes
`lab-refinement.spec.ts` e `device-performance.spec.ts`. A verificação de geometria
confirmou a composição anterior. O teste foi atualizado para verificar o eixo central
do card e do botão e o alinhamento centralizado do título, de 320 a 1440 px.
Lint dos arquivos alterados e `git diff --check` passaram novamente.

WebKit após o ajuste final: 11/11 testes de `lab-refinement.spec.ts` passaram com
`PLAYWRIGHT_BROWSERS_PATH=/tmp/nexos-playwright PLAYWRIGHT_REUSE_SERVER=true npm run test:browser -- tests/browser/lab-refinement.spec.ts --browser=webkit`.
Isso valida o motor de navegador automatizado no desktop; o teste em iPhone físico
permanece pendente. A prévia local foi deixada disponível na porta 3100.

Diagnóstico Refactoring UI: 9/10 (7 de 8 critérios); a composição preserva alguns
espaçamentos antigos fora da escala recomendada pela skill. Alinhamento, largura
de leitura e hierarquia foram os ajustes aplicados nesta solicitação.

## Prévia e evidências

Principais arquivos da implementação preservada para revisão:

- Home: `Hero.tsx`, `HeroPlates.tsx`, `HeroPlates.module.css`, `Services.tsx`,
  `ui/tilted-grid-hero.tsx`, `sections/MascotSolutions.tsx`,
  `sections/RealEstateVideo.tsx` e seus estilos.
- Movimento: `BrandEntrance.tsx`, `GhostFibers.tsx`, `ScrollReveal.tsx`,
  `SmoothScrollProvider.tsx`, `sections/HomepageJourneyMotion.tsx`,
  `sections/LandingPageBlur.tsx` e `lib/animation-budget.ts`.
- Acesso: `components/auth/LoginForm.tsx`, `lib/auth/instance.ts`,
  `lib/auth/social.ts`, `lib/auth/db.ts`, `lib/auth/supabase-ca.ts`,
  `lib/db/user-scope.ts`, `lib/rate-limit.ts`,
  `lib/account/profile-validation.ts`, handlers de API e `proxy.ts`.
- Operação: `scripts/provision-member.mjs`, `scripts/audit-auth-access.mjs`,
  `.env.example`, `README.md`, dependências e testes em `tests/`.

Executar `npm run build` e, depois, em um terminal separado:

```sh
SITE_URL=http://localhost:3100 NEXT_PUBLIC_SITE_URL=http://localhost:3100 TURNSTILE_ENFORCED=false npm run start -- --hostname 127.0.0.1 --port 3100
```

Abrir `http://localhost:3100`. Essa configuração de Turnstile é exclusiva da prévia local.
Os testes de navegador usam o build de produção, sem publicar o projeto.

Capturas já disponíveis nesta pasta: `final-hero-390.png`, `final-hero-1280.png`,
`final-macbook-390.png`, `final-macbook-1280.png`, `final-carousel-390.png`,
`final-carousel-1280.png`, `final-photo-fade-390.png` e `final-photo-fade-1280.png`.
Métricas anteriores de CLS, long tasks e frames: `performance.json`.
Não existe trace anterior às mudanças para comparação completa de CLS e pintura.

## Pendências externas

- iPhone físico: testar inércia, rotação e barra dinâmica do Safari. Emulação de
  viewport e CPU não confirma comportamento de aparelho ou GPU reais.
- Cloudflare: confirmar hostname privado, zona, plano e acesso. Aplicar e testar
  a proposta de `CLOUDFLARE.md` no ambiente autorizado antes de produção.
- Credencial histórica: coordenar janela e consumidores para rotação conforme
  `SECRET-ROTATION.md`. A exposição registrada continua pendente de revogação.
- Acesso: confirmar o uso do provisionamento administrativo preparado ou escolher
  convites, conforme `ACCESS-MIGRATION.md`. Nenhum membro real foi criado.
- Publicação e mudanças de produção: dependem da aprovação prevista no briefing.
