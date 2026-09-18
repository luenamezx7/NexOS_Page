# NexOS — Documentação Técnica Focada no Funcionamento

> **Objetivo:** explicar o que realmente importa para o site funcionar, sem ruído. Stack: **Next.js 16 App Router + React 19 + TypeScript + Tailwind v4 + Framer Motion + InfinitePay Pix + Notion**.

---

## 1. Visão Geral e Fluxo

```
Usuário → Intro (TextPressure) → Header (glass) → Hero → Services → Testimonials → Contact → Footer
                ↘ HoldButton (scramble)   ↘ SectionIndicator (dots)   ↘ EmbeddedCheckout (Drawer)   ↘ Notion DB
                                       ↘ Pix InfinitePay (QR + polling)
```

- **Estágios** `src/app/home-client.tsx:17`: `loading (2.2s orb) → intro (role/scroll para entrar) → main`. O `main` só monta após `stage==='main'`, evitando flash de conteúdo.
- **Tema** `src/components/ThemeProvider.tsx:19`: `documentElement.classList.toggle('dark')` + `localStorage nexos-theme`. Default `dark`. Todo CSS usa `var(--color-canvas/ink)` que troca no `.dark`.

---

## 2. Estrutura Crítica

```
src/
├─ app/
│  ├─ layout.tsx:15         → RootLayout: fonts next/font (Geist, Geist_Mono, Space_Grotesk), ThemeProvider, SmoothScrollProvider (Lenis), GlobalNoise, GradualBlur
│  ├─ page.tsx:5            → export metadata + <HomeClient />
│  ├─ home-client.tsx:166   → Orquestra loading/intro/main, Header + SectionIndicator + Hero/Services/Testimonials/Contact + Footer
│  ├─ globals.css:1         → Design System v3: tokens --color-canvas/ink, --nex-pink, .bento-card, .glass-header, .pink-marker, animações GPU-only
│  └─ api/
│     ├─ checkout/route.ts:1 → Pix InfinitePay — validação de produto + rate limit + CSP
│     └─ contact/route.ts:1  → Envio para Notion — zod + data_source fallback
├─ config.ts:3              → ÚNICA fonte de verdade: brand, hero, services (id/price), testimonials, whatsapp, meta
├─ types/index.ts           → SiteConfig, Service, Testimonial
└─ components/
   ├─ Header.tsx:104         → glass-header fixo, scrollY → glass-header--scrolled, nav + mobile drawer
   ├─ Hero.tsx:169           → DarkVeil/Grainient + bento 4 cards + HoldButton featured
   ├─ HoldButton.tsx:18      → Segurar 1.5s + scramble hover (debounced, sem remount) + progress bar scaleX
   ├─ Services.tsx:33        → 2 bento-cards + EmbeddedCheckoutDrawer trigger
   ├─ EmbeddedCheckout.tsx:1 → Drawer transparente, Appearance API dual-theme, PaymentElement iFrame, estados loading/processing/success/error
   ├─ Contact.tsx:40         → Form com validação, POST /api/contact → Notion, estados submitted/error
   ├─ SectionIndicator.tsx:26→ Nav lateral xl:flex, IntersectionObserver + scrollYProgress spring, dots + trilho + counter
   ├─ Footer.tsx:74          → glass-footer, Signature (Lastoria), links
   ├─ signature.tsx:23       → SVG 120px com opentype.js, viewBox dinâmico, overflow visible
   ├─ ThemeProvider.tsx:5    → Context theme light/dark
   ├─ SmoothScrollProvider.tsx → Lenis (lenis-smooth)
   └─ ui/Button.tsx          → Variants primary/secondary, loading
```

---

## 3. O Que Realmente Faz Funcionar

### 3.1 `src/app/layout.tsx:73`
- Carrega 3 fontes com `next/font` e `variable` (evita CLS).
- `ThemeProvider` + `SmoothScrollProvider` devem ser `'use client'` — providers não funcionam em Server Component.
- `GlobalNoise` e `GradualBlur` são `pointer-events-none` fixos — perf: só `transform/opacity`.

### 3.2 `src/app/home-client.tsx:24`
- `LoadingScreen` com `ThinkingOrbWrapper` + `exit: blur`.
- `IntroSection` captura `wheel/touchmove/keydown` para `finish()` — intro só sai com interação.
- Após `stage==='main'`, `Header` + `SectionIndicator` + `motion.div` com `Hero/Services/Testimonials/Contact`. O `heroRef` dá scroll suave inicial.

### 3.3 `src/config.ts:3`
- **Altere apenas aqui** para mudar conteúdo/preços. Exemplo crítico:
  ```ts
  services: [{ id:'dev', title:'Desenvolvimento NexOS', price: 499.9 }]
  ```
- Preços vivem no catálogo `config.services` — o checkout cobra `price × 100` centavos, nunca valor do navegador.

### 3.4 `src/app/globals.css:18`
- Tokens semânticos: `--color-canvas: #f4f4f1` / `.dark #050505`, `--color-ink`, `--nex-pink-hot: #ff2e6a`, `--section-indicator` (branco no dark, vermelho no light, glow apagado).
- Classes de sistema: `.bento-card` (hairline 1px), `.glass-header` (backdrop-blur 20px), `.pink-marker` (8x8 glow), `.tech-badge`.
- Performance: anima só `transform/opacity`, `will-change-transform`, `prefers-reduced-motion` desliga tudo.

### 3.5 `src/components/Header.tsx:104`
- `useScroll + useMotionValueEvent` para `scrolled` (evita `window.scroll` listener manual).
- `scrollToHash` com `scrollIntoView smooth` (compatível com Lenis).
- Mobile drawer com `AnimatePresence` + `backdrop-blur`.

### 3.6 `src/components/Hero.tsx:169`
- Fundo condicional: `DarkVeil` (WebGL) no dark, `Grainient` no light + `grid-pattern-subtle`.
- `HoldButton featured` + `btn-secondary-nex` — hero cabe no viewport inicial (título ≤2 linhas, sub ≤20 palavras).

### 3.7 `src/components/HoldButton.tsx:18` — Correção do bug de hover
- **Antes:** `onHoverStart → setScrambleKey(k+1)` remontava `<SpecialText key>` que começava com `" ".repeat(n)` → piscada.
- **Agora:** estado `display` + `isScramblingRef` (guard) + `setInterval` 14 frames × 28ms, reveal gradual, `setTimeout 350ms` debounce. `whileHover scale 1.03` mantido, mas sem blank.

### 3.8 `src/components/Services.tsx:33` — 3 cards
- `R$ {price.toLocaleString('pt-BR', {minimumFractionDigits:2})}` — garante `69,90` e `499,90`.
- `onCheckout(service)` abre `EmbeddedCheckoutDrawer`, não faz redirect externo.

### 3.9 `src/components/EmbeddedCheckout.tsx:1` — Checkout Pix (core de pagamento)
- **Arquitetura:** drawer + `InfinityPixPane` — nome/e-mail validados, `POST /api/checkout` gera o Pix, polling em `/api/checkout/status` confirma sozinho.
- **Container oculto:** `open=false → null` (não no DOM). `open=true → AnimatePresence fade+slide` Drawer `fixed bottom-0 md:right-6` com glass `backdrop-blur-[20px]` + `border`.
- **Segurança:**
  - Nenhum dado bancário toca nossos servidores — o QR/pagamento ocorre na InfinitePay.
  - `order_nsu` próprio por pedido; valor resolvido no servidor a partir do catálogo.
- **Server:** `POST /api/checkout` cria cobrança com `amount` do catálogo (não do client), valida produto, rate limit.
- **Estados:** `idle` (form), `generating`, `pending` (link + polling + verificação manual), `success` (Check + WhatsApp). Tudo `aria-live` e sem redirect brusco.

### 3.10 `src/app/api/checkout/route.ts:1`
```ts
bodySchema = z.object({productId, name, email})
rateLimit: Map<ip, number[]> 8 req/min
POST: validar productId no catálogo → amount = price*100 → links InfinitePay ({handle, order_nsu, customer})
GET: diagnostico hasHandle/products
Headers: CSP default-src 'self', X-Content-Type-Options nosniff
```
- **Por que `output: 'export'` quebrou o Vercel:** `next.config.ts:4` desabilita API Routes. Fix: `...(process.env.NEXT_EXPORT==='1'?{output:'export'}:{})` + `package.json deploy: NEXT_EXPORT=1 npm run build`.

### 3.11 `src/app/api/contact/route.ts:1`
```ts
contactSchema = z.object({name, email, company?, service?, message})
POST: safeParse → getNotionClient() → notion.pages.create({parent:{database_id}, properties:{Nome:title, Email:email, Companhia:rich_text, Serviço:rich_text, Mensagem:rich_text}})
Fallback: se `database_id` falhar, tenta `data_source_id` (modelo novo Notion: data_sources[0].id)
GET: verifica hasToken/hasDatabaseId/title
```
- **Env:** `NOTION_TOKEN=ntn_...` + `NOTION_DATABASE_ID=3dd5882f-67aa-8054-a8a3-f785bb442308` (`.env.local` local, **Vercel → Settings → Environment Variables** + Redeploy obrigatório).
- **DB Notion:** `Contatos de Clientes` com colunas `Nome (title), Email (email), Companhia, Serviço, Mensagem (rich_text)`. Integration conectada via `... → Connections`.

### 3.12 `src/components/Contact.tsx:40`
- `validate` local + `fetch('/api/contact')` com `handleSubmit` → `setSubmitted(true)` só se `res.ok`. `submitError` exibe `details` + `hint` do servidor.
- Valores visíveis escondidos: `Resposta em minutos / Resposta em até 24h / Toque para ligar` (hrefs ainda contêm `mailto:nexosperformance@gmail.com`, `tel:+5564993289250`, `wa.me/5564993289250`).

### 3.13 `src/components/SectionIndicator.tsx:26`
- `useScroll + useSpring(scrollYProgress)` para trilho `scaleY` (GPU-only). `reduce` → fallback discreto.
- `IntersectionObserver rootMargin -45%` + fallback `scroll` para `activeId`. Dots `8px rounded 2px` com `boxShadow 0 0 6px var(--section-indicator-glow)` (dark branco `0.14`, light vermelho `0.4` apagado). Só `xl:flex`.

### 3.14 `src/components/Footer.tsx:74` + `signature.tsx:23`
- **Bug cortado:** `overflow-hidden` + `SVG_HEIGHT 100` + `horizontalPadding 0.1×` cortava floreios da Lastoria.
- **Fix:** `SVG_HEIGHT 120`, `horizontalPadding 0.35×fontSize`, `topMargin 12`, `baseline 0.82×fontSize`, `style overflow:visible`, parent `overflow-visible shrink-0`.

### 3.15 `src/components/ThemeProvider.tsx:5` + `src/components/SmoothScrollProvider.tsx`
- Tema persiste em `localStorage nexos-theme` e aplica `classList.toggle('dark')`. Checkout adapta cores via `useTheme()`.
- Lenis: `html.lenis body {height:auto}`, `lenis-smooth` sem `scroll-behavior`.

---

## 4. Variáveis de Ambiente (Vercel e Local)

```
# Notion
NOTION_TOKEN=ntn_237596445861...
NOTION_DATABASE_ID=3dd5882f-67aa-8054-a8a3-f785bb442308

# InfinitePay — Pix taxa zero
INFINITE_PAY_HANDLE=sua_infinite_tag
NEXT_PUBLIC_SITE_URL=https://seu-dominio.vercel.app

# Site
NEXT_PUBLIC_SITE_URL=http://localhost:3000 (dev)
```

- `.env.local` é gitignore (`/.env*` em `.gitignore:34`). **Vercel precisa das mesmas vars em Settings → Environment Variables + Redeploy com Clear Cache.**

---

## 5. Comandos Essenciais

```bash
npm install          # inclui @notionhq/client
npm run dev          # localhost:3000 (use --use-system-ca se TLS falhar local)
npm run build        # Vercel: build dinâmico (com /api/*). GitHub Pages: NEXT_EXPORT=1 npm run build → out/
npm run lint
npm run typecheck
```

---

## 6. Checklist de Produção

- [ ] Preços conferidos em `config.services[]` (dev R$499,90 · placa R$69,90 · teste R$1,00)
- [ ] `INFINITE_PAY_HANDLE` confere com a InfiniteTag (sem `$`)
- [ ] Vercel envs: `NOTION_TOKEN`, `NOTION_DATABASE_ID`, `INFINITE_PAY_HANDLE`, `NEXT_PUBLIC_SITE_URL`
- [ ] Notion DB tem colunas exatas `Nome/Email/Companhia/Serviço/Mensagem` e Integration em `Connections`
- [ ] Teste: `GET /api/contact` → `{ok:true}` e `GET /api/checkout` → `{ok:true, hasHandle:true}`, `POST /api/contact` cria linha no Notion, `POST /api/checkout` com `productId` retorna `paymentUrl` e o drawer gera o Pix
- [ ] `prefers-reduced-motion` e `prefers-color-scheme` testados

---

## 7. Onde Mexer para Evoluir

- **Novo serviço:** adicione em `config.services` com `id`, `title` e `price` — o checkout usa o catálogo direto, sem passo extra.
- **Novo campo no form:** adicione em `contactSchema` (`route.ts`) + propriedade no Notion + input em `Contact.tsx`.
- **Mudança visual:** edite `globals.css` tokens.
- **Rate limit distribuído:** troque `buckets Map` por Redis/Upstash.

---
