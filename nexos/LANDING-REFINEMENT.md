# Refinamento da landing NexOS

## Checklist de implementação

- [x] Landing como prioridade, composição desktop-first e adaptação para celular.
- [x] Chakra Petch nos títulos, JetBrains Mono nos detalhes técnicos e Geist na leitura.
- [x] Hero com React Bits GradientASCII, sem ondas, inclusive sob a área do header.
- [x] Ondas mais presentes em trechos selecionados; não atravessam toda a página.
- [x] Claro creme/azul; escuro OLED/violeta profundo, com cenários alternados.
- [x] Arte abstrata local em `public/nexos-field.svg`, com tratamento de cor e movimento suave.
- [x] GradualBlur nas bordas dos cenários e da janela, em cima e embaixo; header acima da faixa superior.
- [x] Entradas de seção, revelação do hero, gráficos e timeline com Motion mais evidente.
- [x] Métricas demonstrativas com troca de período, gráfico de linha e barras.
- [x] Uma placa inicial, leque de identidades ilustrativas e seleção por mouse, toque ou teclado.
- [x] Preço, quantidade, desconto, personalização, preview e checkout do catálogo preservados.
- [x] Timeline alternável entre produto físico e serviço digital.
- [x] Serviços reorganizados, ecossistema, FAQ nativo interativo, CTA final próprio e contato.
- [x] IDs e navegação sincronizados; conteúdo fora de contêineres `aria-hidden`.
- [x] Preferência de movimento reduzido com estado inicial compatível com SSR.

## Onde editar

| Conteúdo | Arquivo |
| --- | --- |
| Ordem e cenários das seções | `src/app/home-client.tsx` |
| Paletas, fundos e layout das novas seções | `src/components/sections/Sections.module.css` |
| Título e texto do hero; parâmetros ASCII | `src/components/Hero.tsx` |
| Apresentação da marca e diferenciais | `src/components/sections/FisicoDigitalSection.tsx` |
| Valores fictícios e etapas de entrega | `src/components/sections/landing-content.ts` |
| Títulos e legendas dos gráficos | `src/components/sections/MetricsSection.tsx` |
| Identidades provisórias do leque; foto para substituir pelo futuro modelo | `src/components/commerce/PlateFan.tsx` |
| Vitrine e ações comerciais da placa | `src/components/ProductShowcase.tsx` |
| Produtos e preços reais | `src/config.ts` |
| Perguntas e respostas | `src/components/FAQ.tsx` |
| CTA final | `src/components/sections/CTAFinal.tsx` |
| Intensidade dos blurs fixos | `src/components/sections/LandingPageBlur.tsx` |

Os números dos gráficos são **demonstrações identificadas**, não resultados publicados da NexOS. As identidades do leque são estudos visuais e não variantes comerciais. A foto atual continua sendo o único ativo real da placa.

## Validação

```bash
npm run typecheck
npm run lint
npm run build
npx playwright test landing-refinement.spec.ts seo.spec.ts checkout.spec.ts waves-entrance.spec.ts performance.spec.ts topography-theme.spec.ts
```

A suíte de refinamento cobre contraste por tema, alternância de cenários, navegação, gráficos, timeline, leque, quantidade, contato e adaptação entre 320 e 1440 px. O contato e os pagamentos são simulados nos testes, sem criar cobranças ou enviar mensagens reais.

Resultado da validação: build e TypeScript aprovados; 46 testes de navegador aprovados nas seis suítes acima. Lint sem erros, com 29 avisos em componentes preexistentes. Revisão visual realizada nos dois temas em desktop e celular, com a faixa superior na camada 40 e o header na camada 50.
