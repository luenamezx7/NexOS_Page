# Bio Links - Página de Bio Links

## Princípios

- **Qualidade de Código**: TypeScript estrito (strict:true), zero any implícito, componentes funcionais, props tipados em interfaces nomeadas em `types.ts`, sem lógica de negócio em componentes de UI.

- **Arquitetura**: Customização do usuário em `src/config.ts`; separação clara: config (dados) → types (contratos) → components (UI); dependências mínimas (React, TypeScript, Vite, lib de ícones).

- **Design**: Mobile‑first (320 px), seguir `design-system.md` para cores, tipografia e espaçamento; acessibilidade WCAG AA (aria‑label, alt, contraste).

- **SEO**: Meta tags locais e estruturadas.

- **Deploy**: `vite build` gera saída estática compatível com qualquer CDN; foco principal em GitHub Pages.