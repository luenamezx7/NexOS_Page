# NexOS — Architecture & Performance Charter
> **Escopo:** Next.js App Router / Client-Side Acceleration  
> **Target FPS:** 60 - 120 FPS Constant  
> **Autor:** Principal Performance Architect  
> **Classificação:** NEXOS CORE SPECIFICATION — CONFIDENTIAL  

---

## 1. Visão Geral e Princípios Fundamentais

Este documento estabelece as diretrizes invioláveis para a refatoração do ecossistema **NexOS**. O objetivo primário é alcançar performance fluida constante em **60–120 FPS** em dispositivos mobile de entrada e hardwares limitados, garantindo a preservação integral da linguagem estética e identidade visual do projeto (Glassmorphism, Neon Glows, Framer Motion e Industrial-Brutalist UI).

> **REGRA DE OURO DA ARQUITETURA:**  
> A otimização visual **não deve rebaixar o design**, mas sim rearquitetar a execução matemática do renderizador. O que custa FPS no browser não é a beleza visual, mas sim a triggering de recálculos de layout (*Reflow*) e a rasterização pesada na CPU durante o scroll.

---

## 2. Diretrizes Técnicas de Otimização

### 2.1 Server-First Processing & Dynamic User-Agent Offloading
* **RSC Offloading:** Mover 100% das operações de parsing, estruturação de dados, tratamento de listas e agrupamentos para React Server Components (`RSC`). Zerar a carga JS desnecessária na hydration do cliente.
* **User-Agent Adaptive Rendering:** Identificar navegadores e dispositivos móveis fracos via `headers()` no Next.js Server Components. Desativar camadas de ruído Shader pesadas e substituir por gradientes nativos ultraleves sem alterar o layout final.

### 2.2 Zero-Reflow Motion Standard (Aceleração por Hardware)
* **Transform Isolates:** Proibir estritamente animações de `width`, `height`, `top`, `margin` ou `padding`. Utilizar unicamente `transform` (`translate3d`, `scale`) e `opacity`.
* **Layer Promotion:** Aplicar `will-change: transform` e `transform: translateZ(0)` nos elementos fixos e animados (como o Header e os Botões) para criar instâncias dedicadas de composição na GPU.

### 2.3 Defesa Contra Gargalos de Renderização (Glass & Blur)
* **Otimização de Backdrop Blur:** O filtro `backdrop-blur-xl` força re-rasterização contínua. Substituir por `backdrop-blur-md` combinado com cor de fundo semitransparente em hexadecimal estático e `-webkit-backdrop-filter` para garantir aceleração nativa por hardware em plataformas Apple/WebKit.
* **Glow Stacking Optimization:** Substituir elementos animados com `blur-[120px]` via CSS dinâmico por elementos absolutos isolados com gradientes radiais estáticos e transição única de `opacity`.

### 2.4 Zero-Dead-Code Cleanup & Modular Lazy Loading
* **Dead Code Elimination:** Executar varredura profunda de dependências descartadas, arquivos mortos de teste, SVGs não referenciados e pacotes não utilizados para reduzir o bundle final ao estritamente necessário.
* **Dynamic Imports Strategy:** Aplicar `next/dynamic` com `ssr: false` para componentes secundários (modais, partículas de fundo, gráficos de analytics e o formulário de checkout invisível) que só devem carregar no momento da interação.

---

## 3. O Documento Mestre de Instrução (Prompt de Engenharia)

Abaixo encontra-se a especificação completa para execução direta dentro do ambiente do assistente/desenvolvedor:

```text
================================================================================
NEXOS CORE ENGINEERING DIRECTIVE: PERFORMANCE & ZERO-SLOP ARCHITECTURE
================================================================================

Atue como um Principal Front-End Architect e Performance Engineer especialista em Next.js (App
Router), Framer Motion, Tailwind CSS e Web Vitals.

O objetivo deste encargo é implementar uma auditoria e refatoração completa do projeto NexOS. O site
DEVE rodar suavemente em 60-120 FPS em qualquer dispositivo (incluindo dispositivos móveis de baixo
desempenho e hardwares modestos), SEM REDUZIR nem comprometer a qualidade visual, a estética
glassmorphic, a identidade visual ou a UI/UX da marca.

Siga estritamente as diretrizes e execuções técnicas abaixo utilizando `full-output-enforcement`:

1. ANÁLISE DE USER-AGENT E DESCARREGAMENTO NO SERVIDOR (RSC & ADAPTIVE)
- Movimente todo o processamento de dados, formatação de dados e estruturas de dados pesadas para
  React Server Components (RSC).
- No servidor (Next.js App Router / Middleware), avalie o User-Agent e headers do cliente. Para
  clientes em dispositivos móveis ou CPUs limitadas, envie estruturas já otimizadas, evitando cálculos
  complexos durante a hidratação no cliente.
- Implemente carregamento diferido (`next/dynamic`) para todos os componentes que não fazem parte do
  viewport crítico inicial (Fold Superior), como Modais, Seções de Recursos Inferiores e Checkouts.

2. LIMPEZA PROFUNDA DE CÓDIGO (DEAD CODE ELIMINATION)
- Realize uma limpeza rigorosa no repositório: remova todas as variáveis não utilizadas, componentes
  obsoletos, utilitários orfãos e dependências de pacotes não referenciadas.
- Garanta que o pacote final enviado ao navegador (bundle size) seja ultra-enxuto.

3. ACELERAÇÃO DE HARDWARE E GARANTIA DE 60-120 FPS (ZERO REFLOW)
- Garanta que TODAS as animações do Framer Motion e GSAP utilizem EXCLUSIVAMENTE propriedades
  gerenciadas pela GPU: `transform` (`x`, `y`, `scale`) e `opacity`. NUNCA anime `height`, `width`,
  `margin`, `padding` ou `top`.
- Adicione a instrução `will-change: transform` e `transform: translateZ(0)` nos containers com
  movimento e no Header Flutuante para criar camadas independentes na GPU (GPU Composition Layers).
- Nas transições entre seções ao rolar a página, utilize curvas de aceleração física fluidas:
  `transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}`.

4. OTIMIZAÇÃO TÉCNICA DE GLASSMORPHISM, BLURS E GLOWS
- Otimize o efeito de vidro do Header Flutuante e dos elementos Glass sem estragar o visual: troque
  filtros extremamente pesados por `backdrop-blur-md bg-black/40 border border-white/10` com suporte
  nativo a `-webkit-backdrop-filter`.
- Substitua elementos de brilho (Glow) que forçam o recálculo continuo de pixels por gradientes
  radiais CSS estáticos em camadas de background, alterando apenas a `opacity` no movimento.

5. PRESERVAÇÃO INTEGRAL DE UI/UX E ESTETIKA PREMIUM
- Mantenha exatamente a paleta de cores (Preto Profundo, Branco e Accent Rosado Tech), a tipografia
  refinada, a sequência do Loader inicial, a transição com o texto "NEXOS, A PERFORMANCE QUE SEU
  BUSINESS MERECE." e o Header Flutuante com cantos arredondados.
- Preserve e aprimore os botões com micro-interações responsivas e o efeito neon/shimmer no botão
  CTA principal.

Gere a reestruturação e refatoração completa dos componentes essenciais do projeto
(`HomeClient.tsx`, `Header.tsx`, `Hero.tsx`, `globals.css` e utilitários), fornecendo o código 100%
tipado em TypeScript e otimizado sem truncamentos.
================================================================================