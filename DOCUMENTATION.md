# NexOS — Documentação Técnica (API + Interface)

> Stack: **Next.js 16 App Router + React 19 + TypeScript + Tailwind v4 + Motion + InfinitePay Pix + Notion**.
> Código-fonte do app em `nexos/src/`. Este arquivo vive **estritamente na raiz do repositório** (`DOCUMENTATION.md`).

---

## 1. Visão geral e fluxo

```
Usuário → Loading (orb 2.2s) → Intro (TextPressure, role/scroll) → main
  main → Header (glass) + SectionIndicator + Hero + Services + Documentação & Ecossistema (#testimonials)
         + FAQ + Contact (#contact) + Footer
  Serviços → EmbeddedCheckoutDrawer → POST /api/checkout → InfinitePay (link Pix)
           → QR na InfinitePay → polling /api/checkout/status → success (WhatsApp)
  Contato  → POST /api/contact → Notion DB (Contatos de Clientes)
  Legal    → /privacidade | /termos | /lgpd | /reembolso | /cookies (rotas) + LegalModal (abas, mesmo padrão do checkout)
           + CookieConsent (banner LGPD + central de preferências, localStorage)
```

- Orquestração: `nexos/src/app/home-client.tsx` — stages `loading → intro → main`. `main` só monta após interação, evitando flash.
- Tema: `nexos/src/components/ThemeProvider.tsx` — `documentElement.classList.toggle('dark')` + `localStorage nexos-theme` (default `dark`).
- Smooth scroll: `SmoothScrollProvider` (Lenis). Containers internos de modal/drawer usam `data-lenis-prevent` + `overscroll-behavior: contain` para não vazar scroll (ver §3.1).

---

## 2. Estrutura

```
nexos/src/
├─ app/
│  ├─ layout.tsx            → fonts next/font, ThemeProvider, SmoothScrollProvider, GlobalNoise, GradualBlur
│  ├─ page.tsx              → metadata + <HomeClient />
│  ├─ home-client.tsx       → loading/intro/main, Header + SectionIndicator + seções + Footer
│  ├─ globals.css           → Design System v3 (tokens --color-canvas/ink, --nex-pink-hot, .bento-card, .glass-*)
│  ├─ privacidade/page.tsx  → <LegalPage slug="privacidade" />
│  ├─ termos/page.tsx       → <LegalPage slug="termos" />
│  ├─ lgpd/page.tsx         → <LegalPage slug="lgpd" />
│  ├─ reembolso/page.tsx    → <LegalPage slug="reembolso" />
│  ├─ cookies/page.tsx      → <LegalPage slug="cookies" />
│  ├─ robots.ts             → robots.txt (allow /, disallow /api/, /sucesso, /cancelado, /_next/)
│  ├─ sitemap.ts            → sitemap.xml (home + 5 legais)
│  └─ api/
│     ├─ checkout/route.ts        → Pix InfinitePay (create) + rate limit + CSP
│     ├─ checkout/status/route.ts → polling payment_check + verificação manual
│     ├─ webhooks/checkout/route.ts → confirmação real-time InfinitePay
│     └─ contact/route.ts         → Notion insert + zod + data_source fallback
├─ config.ts                → fonte de verdade: brand, hero, services (id/price), footer.legal, whatsapp, meta
├─ types/index.ts           → SiteConfig, Service, Testimonial, FooterLink
└─ components/
   ├─ EmbeddedCheckout.tsx  → drawer Pix, body lock, CustomerFields, sucesso
   ├─ InfinityPixPane.tsx   → gerar Pix, polling, verificação manual
   ├─ LegalModal.tsx        → modal legal com abas (mesmo padrão do checkout: backdrop, body lock, ESC)
   ├─ LegalPage.tsx         → layout das 5 rotas legais (tabs + conteúdo)
   ├─ legal-content.ts      → LEGAL_DOCS (5 docs) + getLegalDoc()
   ├─ Hero.tsx              → 4 bento-cards (Branding Control, Performance & Valor featured, Discovery, MVP Development)
   ├─ Services.tsx          → 3 bento-cards (dev, placa + teste) + drawer sob demanda
   ├─ Testimonials.tsx      → seção id="testimonials" = "Documentação & Ecossistema" em code-viewer Unix + copy
   ├─ FAQ.tsx               → accordion (frete por região; item internacional removido)
   ├─ SectionIndicator.tsx  → nav lateral minimalista neon (label atualizado)
   ├─ Contact.tsx           → form + POST /api/contact
   └─ Footer.tsx            → colunas + legal (5 links) + dados da empresa (CNPJ/endereço)
```

---

## 3. Módulo de Checkout — InfinitePay, todos os métodos (`EmbeddedCheckout.tsx` + `InfinityPixPane` + `api/checkout`)

> Checkout 100% Pix via InfinitePay (amount via catálogo `config.services`). O link de pagamento aceita Pix (QR na hora, taxa zero), cartão em até 12x e carteiras digitais (Apple Pay, Google Pay) — o cliente escolhe no checkout da InfinitePay.

### 3.1 Event Delegation & Body Lock

```tsx
// Qualquer modal/drawer: useScrollLock(open) — nexos/src/components/useScrollLock.ts
useScrollLock(open);
```

- **Causa raiz do bug página × checkout**: só `overflow: hidden` não para o Lenis — ele intercepta wheel/touch num raf próprio e continua dirigindo `window.scroll` com o body travado. A página rolava atrás do drawer e o scroll interno brigava com o da página.
- **Fix**: `lenis.stop()` ao abrir / `lenis.start()` + `lenis.resize()` ao fechar (via `useScrollContext()`), + `overflow: hidden` em body/html como trava secundária (teclado, scrollbar drag, ScrollTrigger), + compensação da largura da scrollbar (sem layout shift). O Lenis ignora eventos dentro de `[data-lenis-prevent]` **antes** do check de `isStopped` (ver `onVirtualScroll` no `lenis.mjs`), então o container interno continua rolando nativo com o Lenis parado.
- Scroll restrito ao container interno:
  ```tsx
  <div data-lenis-prevent className="touch-pan-y overflow-y-auto overscroll-contain"
       style={{ overscrollBehavior: 'contain', WebkitOverflowScrolling: 'touch' }}>
  ```
  `data-lenis-prevent` é respeitado pelo Lenis (`globals.css`: `.lenis-smooth [data-lenis-prevent] { overscroll-behavior: contain }`). Mitiga scroll chaining/jank.
- Contador global no hook: 2 modais sobrepostos (ex.: checkout + central de cookies) não destravam cedo; o Lenis gerencia a classe `lenis-stopped` no `<html>` sozinho. Mesmo hook usado em `LegalModal` e na central de cookies.
- Fechamento: backdrop click + `Escape`. Sem SDK externo no drawer — nada para limpar além de `drawerState`.

### 3.2 Validação e feedback reativo

| Campo | Regra | Feedback inline |
|---|---|---|
| `checkout-name` (Nome completo *) | obrigatório, `trim().length >= 3` | `<p role="alert" class="text-red-500">` + `aria-invalid` + `aria-describedby` + borda `!border-red-500/60` |
| `checkout-email` (E-mail *) | obrigatório + `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` | idem acima |

- `CustomerFields` (drawer) compartilhado; validação no blur + no `Gerar Pix` (foca o primeiro inválido). Estado de erro do Pix (`fatal`) inline com `role="alert"`.

### 3.3 UX do pagamento — `InfinityPixPane`

- **Fluxo**: `Pagar {valor}` (valida nome/e-mail) → `POST /api/checkout` → botão `Pagar na InfinitePay` (nova aba — a InfinitePay só oferece link, sem API transparente/iframe) + chips de métodos (Pix · Cartão até 12x · Apple Pay · Google Pay) + `Copiar link` + polling automático a cada 5s (até ~5 min) + `Já paguei, verificar` → `success`. A verificação manual exibe o método detectado (Pix/cartão).
- **Anti-travamento** (bugs já corrigidos): fetches com `AbortSignal.timeout`; trava de sobreposição no polling (1 request por vez — ticks acumulados pareciam "travado"); ao expirar, mostra orientação + abre a verificação manual (pagou outra cobrança, ex.: manual no app, nunca confirmaria este `order_nsu`); seção "Criou a cobrança no app?" aceita link/`order_nsu` colado; `/sucesso?provider=infinitepay&order_nsu=…` verifica no servidor com polling curto antes de confirmar.
- **Verificação manual**: `POST /api/checkout/status` aceita `{ orderNsu | slug | transactionNsu | code }` (slug = fim do link `checkout.infinitepay.com.br/<slug>`). Rate limit 20/min.

### 3.4 API — `POST /api/checkout`

- **Request**
  ```http
  POST /api/checkout
  Content-Type: application/json

  { "productId": "placa", "name": "Ada Lovelace", "email": "ada@empresa.com" }
  ```
  Contrato zod: `productId` existente em `config.services` + `name` (3–120) + `email`. Amount em centavos = `Math.round(service.price * 100)` — nunca do client.
- **Response 200**
  ```json
  { "paymentUrl": "https://checkout.infinitepay.com.br/...", "orderNsu": "nexos-...", "amount": 6990, "currency": "brl" }
  ```
- **Erros**: `400 { error:'Dados inválidos', details }` · `400 { error:'Produto inválido.' }` · `429` (8 req/min por IP) · `500 { error:'Pagamentos temporariamente indisponíveis.' }` (sem `INFINITE_PAY_HANDLE`).
- **Servidor**: valida produto no catálogo → `order_nsu` próprio → `POST api.checkout.infinitepay.io/links` com `handle`, `customer`, `redirect_url` (`/sucesso?provider=infinitepay&order_nsu=…`), `webhook_url` (default `/api/webhooks/checkout`).
- **Diagnóstico**: `GET /api/checkout → { ok, hasHandle, products: [{id,title,price}] }`.
- **Headers**: CSP mínima `default-src 'self'`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`.
- **`POST /api/webhooks/checkout`** — confirmação real-time (`invoice_slug`, `capture_method`, `transaction_nsu`, `order_nsu`…): valida shape, loga, responde `200` (<1s; `400` retenta). Sem banco: confirmação visível via polling.
- **Env**: `INFINITE_PAY_HANDLE=sua_infinite_tag` (sem `$`) + opcional `INFINITE_PAY_WEBHOOK_URL`. Helper em `nexos/src/lib/infinitepay.ts`.

---

## 4. API — `POST /api/contact` → Notion

- **Request**
  ```http
  POST /api/contact
  Content-Type: application/json

  {
    "name": "Ada Lovelace",
    "email": "ada@empresa.com",
    "company": "Analytical Engines (opcional)",
    "service": "dev (opcional, id de config.services)",
    "message": "Quero um MVP em 6 semanas..."
  }
  ```
  Contrato zod: `name/email/message` obrigatórios, `email` com formato, `company/service` opcionais.
- **Response 200**: `{ ok: true, id: "<notion-page-id>" }`. **Erros**: `400 { error, details, hint }` (zod) · `500 { error:'Falha ao salvar contato.' }` (Notion ou env ausente).
- **Servidor**: `getNotionClient()` → `notion.pages.create({ parent:{ database_id }, properties:{ Nome:title, Email:email, Companhia:rich_text, Serviço:rich_text, Mensagem:rich_text } })`; fallback para `data_source_id` (modelo novo do Notion: `data_sources[0].id`).
- **Diagnóstico**: `GET /api/contact → { ok, hasToken, hasDatabaseId, title }`.
- **Env**: `NOTION_TOKEN=ntn_…` + `NOTION_DATABASE_ID=3dd5882f-…` (`.env.local` local; Vercel → Settings → Environment Variables + Redeploy). DB `Contatos de Clientes` com colunas `Nome(title) Email(email) Companhia Serviço Mensagem(rich_text)` e Integration em `Connections`.

---

## 5. FAQ (`FAQ.tsx`)

- Itens `01–05` preservados (Desenvolvimento, Placa NFC, checkout seguro, prazo, CNPJ).
- **Removido**: `06 'Vocês atendem fora do Brasil?'` (internacionalização/venda exterior).
- **Inserido**:
  ```ts
  { id: '06', question: 'Como é calculado o frete?',
    answer: 'Calculamos o frete de acordo com sua região.' }
  ```
- A11y: `aria-expanded/controls`, `AnimatePresence` de altura, `role="list"`.

---

## 6. Seções, navegação e estilização

### 6.1 Renomeação
- `SectionIndicator.tsx`: `{ id:'testimonials', label:'Documentação & Ecossistema', number:'03' }` (antes `Ecossistema`).
- `Testimonials.tsx`: `<h2>Documentação & Ecossistema</h2>` (antes `Ecossistema NexOS`). `id="testimonials"` preservado para não quebrar âncoras `#testimonials`.

### 6.2 Scroll jank no Ecossistema — diagnóstico e fix
- **Causa**: 3 `motion.article` com `y + scale` + `will-change-transform` permanente + `staggerChildren 0.12` + `viewport amount 0.15` + layers com blur → repaint/reflow a cada frame ao interpolar a viewport; `SectionIndicator` com `ping` infinito + `pill backdrop-blur` + observer com 5 thresholds + `scroll` listener sem throttle (offsetTop por frame).
- **Fix em `Testimonials.tsx`**: animação só `opacity + y` (sem `scale`); sem `will-change-transform` permanente; `staggerChildren 0.06`; `viewport amount 0.2 + margin -8%`; `section style={{ contentVisibility:'auto', containIntrinsicSize:'auto 640px' }}` (pula pintura off-screen); `overflow-clip`; hover via CSS transform GPU em vez de `whileHover` JS por card.
- **Fix em `SectionIndicator.tsx`**: removidos ping, pill e sub-pilares; observer com `threshold: 0` + `rootMargin -40%`; fallback de scroll com **throttle via rAF**; progresso só com `scaleY` (transform GPU).

### 6.3 Code-viewer Unix (substitui grid de cards)
- `Testimonials.tsx` renderiza **uma janela macOS**: title bar com semáforos + `nexos — ecossistema · zsh` + **botão Copiar no canto superior direito** (`absolute right-3 top-1/2`).
- Corpo: `<ul role="list">` com 3 `<li>` estilo linha de terminal (`$ OVERLINE + id`, título, descrição, `métrica + pilar`, botão de ação que faz `smooth scroll` para `#services`/`#hero`).
- **Clipboard API**:
  ```ts
  await navigator.clipboard.writeText(CLIPBOARD_PAYLOAD); // fallback: textarea + execCommand('copy')
  // feedback: 'Copiar' → 'Copiado' (Check verde) por 1.8s, aria-live="polite"
  ```
  Payload = 3 blocos `$ nexos pillar --id …` com overline/title/metric/pilar.
- Status bar inferior: `3 pilares · utf-8` + `exit 0 — pronto para escalar`.

### 6.4 SectionIndicator minimalista neon
- Trilho fino `w-px bg-ink/10`; progresso `bg-[#ff2e6a]` com `box-shadow: 0 0 8px rgba(255,46,106,.45), 0 0 2px rgba(255,46,106,.8)` (glow sutil, estética neon/cyberpunk, paleta primária preservada).
- Dots `8px rounded-[2px]`: ativo = pink + glow; passado = pink 45%; futuro = hairline. Sem ping/pill. Label ativo com `textShadow: 0 0 12px rgba(255,46,106,.35)`.
- Counter `01 / 05` minimalista. Só `xl:block`. `prefers-reduced-motion` mantém glow estático sem spring.

---

## 7. Páginas legais (Legal Compliance)

| Rota | Doc | Título |
|---|---|---|
| `/privacidade` | `privacidade` | Política de Privacidade |
| `/termos` | `termos` | Termos de Uso |
| `/lgpd` | `lgpd` | LGPD — Direitos do Titular |
| `/reembolso` | `reembolso` | Política de Reembolso |
| `/cookies` | `cookies` | Política de Cookies |

- Arquivos: `nexos/src/app/{privacidade,termos,lgpd,reembolso,cookies}/page.tsx` → `<LegalPage slug>` + `metadata` por página.
- Conteúdo: `nexos/src/components/legal-content.ts` — `LEGAL_DOCS` (intro + 4 seções por doc; reembolso inclui `Calculamos o frete de acordo com sua região` e regra de 7 dias/arrependimento; cookies documenta `nexos-theme` + `nexos-cookie-consent-v1` e categorias opcionais).
- Visualização: `nexos/src/components/LegalPage.tsx` — header + **abas** (links para as 5 rotas, ativa com `aria-current="page"`) + `bento-card` com seções. `LegalModal.tsx` — **modal** com o mesmo comportamento do checkout (backdrop, painel `bottom-sheet → right-6`, **body lock idêntico**, `Escape`, scroll isolado `data-lenis-prevent`, abas `role="tablist"` Privacidade/Termos/LGPD/Reembolso/Cookies).
- `config.footer.legal` agora tem 5 links (inclui `{ label:'Política de Reembolso', href:'/reembolso' }` e `{ label:'Política de Cookies', href:'/cookies' }`), consumidos por `Footer.tsx` (+ botão `Gerenciar cookies` que dispara `nexos:open-cookie-preferences`).

## 7.1. Cookies / Consentimento LGPD (`cookie-consent.tsx`)

- `CookieConsentProvider` montado em `app/layout.tsx` (dentro de Theme + Lenis) — vale para home e páginas legais.
- Banner inferior em `z-[65]`, **sem body lock** (não bloqueia navegação), com `Aceitar tudo / Recusar / Personalizar` + link `/cookies`; aparece após ~1.2s só se `localStorage nexos-cookie-consent-v1` ausente.
- Central de preferências em modal (padrão checkout): backdrop, body lock + `lenis-stopped`, `Escape`, scroll isolado `data-lenis-prevent`, switches `role="switch"` para `functional / analytics / marketing` (`necessary` sempre on).
- Persistência: `{ necessary:true, functional, analytics, marketing, updatedAt }` (12 meses, só em `localStorage` — nenhum cookie de tracking é criado pelo próprio banner).
- Gating para futuro: `window.__nexosConsent` + evento `nexos:consent-updated` — só carregue GA4/pixels se `consent.analytics/marketing === true`. Hoje analytics/marketing nascem desligados.

---

## 8. Hero (`Hero.tsx`)

Design system preservado (`bento-card`, `tech-badge`, `HoldButton featured`, `DarkVeil/Grainient`, `ENTER/RELIEF` com `FLUID_EASE`).

| Card | badge | Título | Copy | Métrica | CTA → |
|---|---|---|---|---|---|
| 1 `branding` (ex-Product Design) | Branding Control | Controle total do seu branding | controle de branding, design system, identidade corporativa e escalabilidade | 100% consistência de marca | Ver Serviços → `#services` (smooth scroll) |
| 2 `performance-valor` (ex-FullStack) | Performance & Valor | Performance que gera valor B2B | modelo B2B, impulsionamento de negócios, valor agregado mensurável | +35% valor agregado B2B | Ver Serviços → `#services` |
| 3 `strategy` (Discovery mantido) | Discovery | A melhor estratégia para seu Business | "A melhor estratégia para seu Business: validação… 90 dias…" | 6 sem MVP médio | Agendar Discovery → `#contact` (formulário de captação) |
| 4 `mvp` (ex-Edge Runtime) | MVP Development | Do protótipo à validação | prototipagem rápida, MVPs para validação: Landing Pages, Cardápios, Portfólios, Biolinks e Gateways | 4 sem protótipo validado | Ver Serviços → `#services` |

- **Event binding**: `navigate(href)` faz `document.getElementById(id).scrollIntoView({ behavior:'smooth' })`; todos exceto Discovery apontam para `#services`; Discovery aponta para `#contact`.
- **Destaque visual** (só Performance & Valor): `featured: true` → `!border-pink-500/50` + `shadow 0 0 28px pink + 0 18px 60px` + badge flutuante `Destaque B2B` (`absolute -top-3`, `bg-[#ff2e6a]`, glow) + `tech-badge` com borda pink.

---

## 9. Variáveis de ambiente

```
# InfinitePay — Pix taxa zero (único meio de pagamento)
INFINITE_PAY_HANDLE=sua_infinite_tag            # sem o $ inicial
# INFINITE_PAY_WEBHOOK_URL=https://seudominio.com/api/webhooks/checkout  # opcional
NEXT_PUBLIC_SITE_URL=http://localhost:3000    # dev; produção: https://seu-dominio.vercel.app

# Notion
NOTION_TOKEN=ntn_...
NOTION_DATABASE_ID=3dd5882f-67aa-8054-a8a3-f785bb442308
```

- `.env.local` é gitignore. Vercel precisa das mesmas vars + **Redeploy com Clear Cache** (`NEXT_PUBLIC_*` é injetado no build). `ntn_` nunca vai pro client.

---

## 10. Comandos

```bash
cd nexos
npm install
npm run dev        # localhost:3000
npm run build      # Vercel: dinâmico (com /api/*). GitHub Pages: NEXT_EXPORT=1 npm run build → out/
npm run lint
npm run typecheck  # tsc --noEmit
```

> `next.config.ts` desabilita `output:'export'` fora de `NEXT_EXPORT=1`, senão API Routes quebram na Vercel.

---

## 11. Checklist de produção

- [ ] Preços conferidos em `config.services[]` (o checkout cobra `price × 100` centavos)
- [ ] Vercel envs: `INFINITE_PAY_HANDLE`, `NOTION_TOKEN`, `NOTION_DATABASE_ID`, `NEXT_PUBLIC_SITE_URL` (+ opcional `INFINITE_PAY_WEBHOOK_URL`)
- [ ] Notion DB com colunas `Nome/Email/Companhia/Serviço/Mensagem` e Integration em `Connections`
- [ ] Teste: `GET /api/checkout → {ok:true, hasHandle:true}`, `POST /api/checkout {productId,name,email}` → `paymentUrl` + drawer gera Pix e confirma sozinho; `GET /api/contact → {ok:true}`, `POST /api/contact` cria linha no Notion
- [ ] Checkout com body lock (sem scroll do fundo), erros inline nome/e-mail, polling com timeout e verificação manual
- [ ] FAQ sem item internacional e com frete por região; seção `Documentação & Ecossistema` em code-viewer com Copiar; indicator minimalista neon; Hero com 4 cards novos (Performance & Valor em destaque); `/privacidade /termos /lgpd /reembolso /cookies` acessíveis + abas
- [ ] Cookies: banner aparece 1ª visita, aceitar/recusar/personalizar persiste `nexos-cookie-consent-v1`, `Gerenciar cookies` no rodapé reabre a central, analytics/marketing seguem desligados sem aceite
- [ ] SEO: `/robots.txt` libera `/` e bloqueia `/api/`, `/sucesso`, `/cancelado`, `/_next/`; `/sitemap.xml` lista home + 5 legais; `NEXT_PUBLIC_SITE_URL` com o domínio final
- [ ] Lazy: fundo do hero/intro acende sem piscar (fallback estático), drawer baixa o chunk só no 1º clique em comprar
- [ ] `prefers-reduced-motion` testado (sem springs/pings/shimmer)

---

## 12. SEO e performance (lazy loading)

- **robots.txt** (`app/robots.ts`): `Allow: /` para `*`, `Disallow: /api/`, `/sucesso`, `/cancelado`, `/_next/` + `Sitemap:` apontando pro domínio de `NEXT_PUBLIC_SITE_URL` (fallback `https://nexos.digital`). Páginas legais e `/cookies` indexáveis de propósito (conteúdo).
- **sitemap.xml** (`app/sitemap.ts`): `/` (weekly, 1.0) + 5 legais (yearly, 0.4).
- **Lazy pesado** (`next/dynamic`, `ssr: false`): `DarkVeil` (WebGL/ogl) e `Grainient` (canvas) fora do bundle inicial e da hidratação, no Hero e na intro, com `VeilFallback` (brilho radial estático) — sem isso, canvas/WebGL iam no SSR à toa. `TextPressure` (canvas 2D leve) e orb de loading ficaram estáticos de propósito (primeira tinta).
- **Drawer sob demanda** (`Services.tsx`): `EmbeddedCheckoutDrawer` via `dynamic` + mount condicional (`activeService &&`) — o chunk só baixa ao segurar o botão de compra.
- **Reversão**: árvore estava limpa antes; o diff é só `Hero.tsx`, `home-client.tsx`, `Services.tsx` — `git stash`/`checkout` desfaz.
