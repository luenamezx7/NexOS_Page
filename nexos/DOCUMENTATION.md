# NexOS — Documentação Técnica Focada no Funcionamento

> Stack: **Next.js 16 App Router + React 19 + TypeScript + Tailwind v4 + Framer Motion + Asaas (Pix/Boleto/Cartão) + Notion**.

---

## 1. Visão Geral e Fluxo

```
Usuário → Intro (TextPressure) → Header (glass) → Hero → Services → Testimonials → Contact → Footer
                ↘ HoldButton (scramble)   ↘ SectionIndicator (dots)   ↘ EmbeddedCheckout (Drawer)   ↘ Notion DB
                                       ↘ Pix/Boleto/Cartão Asaas (invoiceUrl + polling + webhook)
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
│     ├─ checkout/route.ts:1        → Asaas — cria cobrança (valida produto, rate limit, CSP)
│     ├─ checkout/status/route.ts:1 → Asaas — polling de status por paymentId/externalReference
│     ├─ webhooks/checkout/route.ts:1 → Asaas webhook (PAYMENT_CONFIRMED/RECEIVED)
│     └─ contact/route.ts:1         → Envio para Notion — zod + data_source fallback
├─ lib/asaas.ts:1           → Helper Asaas: findOrCreateCustomer + createPayment + getPaymentStatus
├─ components/AsaasCheckoutPane.tsx:1 → Pane do checkout Asaas (geração + polling)
├─ config.ts:3              → ÚNICA fonte de verdade: brand, hero, services (id/price), testimonials, whatsapp, meta
├─ types/index.ts           → SiteConfig, Service, Testimonial
└─ components/
   ├─ Header.tsx:104         → glass-header fixo, scrollY → glass-header--scrolled, nav + mobile drawer
   ├─ Hero.tsx:169           → DarkVeil/Grainient + bento 4 cards + HoldButton featured
   ├─ HoldButton.tsx:18      → Segurar 1.5s + scramble hover (debounced, sem remount) + progress bar scaleX
   ├─ Services.tsx:33        → 2 bento-cards + EmbeddedCheckoutDrawer trigger
   ├─ EmbeddedCheckout.tsx:1 → Drawer + AsaasCheckoutPane — nome/e-mail validados, estados idle/generating/pending/success
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

### 3.9 `src/components/EmbeddedCheckout.tsx:1` — Checkout Asaas (core de pagamento)
- **Arquitetura:** drawer + `AsaasCheckoutPane` — nome/e-mail validados, `POST /api/checkout` gera a cobrança, polling em `/api/checkout/status` confirma sozinho, webhook confirma em real-time.
- **Container oculto:** `open=false → null` (não no DOM). `open=true → AnimatePresence fade+slide` Drawer `fixed bottom-0 md:right-6` com glass `backdrop-blur-[20px]` + `border`.
- **Segurança:**
  - Nenhum dado bancário toca nossos servidores — o pagamento ocorre na página `invoiceUrl` do Asaas.
  - `externalReference` próprio por pedido; valor resolvido no servidor a partir do catálogo.
- **Server:** `POST /api/checkout` cria/atualiza customer por e-mail, cria payment com `billingType: UNDEFINED` (deixa cliente escolher Pix/boleto/cartão no checkout Asaas), rate limit 8 req/min.
- **Estados:** `idle` (form), `generating`, `pending` (link + polling), `success` (Check + WhatsApp). Tudo `aria-live` e sem redirect brusco.

### 3.10 `src/lib/asaas.ts:1` + `src/app/api/checkout/route.ts:1`
```ts
bodySchema = z.object({productId, name, email, quantity?})
rateLimit: Map<ip, number[]> 8 req/min
POST: validar productId no catálogo → amount = bulkUnitPrice*quantity → findOrCreateCustomer(email) → POST /payments { customer, billingType, value, dueDate, description, externalReference } → { invoiceUrl, id }
GET: diagnostico { ok, provider:'asaas', hasKey, products }
Headers: CSP default-src 'self', X-Content-Type-Options nosniff
Env: ASAAS_API_KEY (access_token), ASAAS_ENV (sandbox|production) → baseUrl
```

### 3.10.1 `src/app/api/checkout/status/route.ts:1`
```ts
POST { paymentId | externalReference } → GET /payments/{id} ou GET /payments?externalReference= → { paid: status in [RECEIVED, CONFIRMED, RECEIVED_IN_CASH], status, value, billingType }
RateLimit 20/min por IP
```

### 3.10.2 `src/app/api/webhooks/checkout/route.ts:1`
```ts
POST { event, payment: { id, externalReference, status, value, billingType } }
Eventos: PAYMENT_CONFIRMED, PAYMENT_RECEIVED, etc.
GET: healthcheck { ok:true, provider:'asaas' }
Cadastre em Asaas → Minha Conta → Integrações → Webhooks: https://seu-dominio.com/api/webhooks/checkout
```

---

## 4. Variáveis de Ambiente (Vercel e Local)

```
# Notion
NOTION_TOKEN=ntn_237596445861...
NOTION_DATABASE_ID=3dd5882f-67aa-8054-a8a3-f785bb442308

# Asaas
ASAAS_API_KEY=sua_chave_api_aqui
ASAAS_ENV=sandbox            # ou production
# ASAAS_WEBHOOK_URL=https://seu-dominio.com/api/webhooks/checkout (opcional)

# Site
NEXT_PUBLIC_SITE_URL=https://seu-dominio.vercel.app
NEXT_PUBLIC_SITE_URL=http://localhost:3000 (dev)
```

- `.env.local` é gitignore (`/.env*` em `.gitignore:34`). **Vercel precisa das mesmas vars em Settings → Environment Variables + Redeploy com Clear Cache.**
- Sandbox base: `https://sandbox.asaas.com/api/v3` — Produção: `https://api.asaas.com/api/v3` (troca automática via `ASAAS_ENV` em `src/lib/asaas.ts`).

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
- [ ] `ASAAS_API_KEY` válida (Sandbox vs Production confere com `ASAAS_ENV`)
- [ ] Vercel envs: `NOTION_TOKEN`, `NOTION_DATABASE_ID`, `ASAAS_API_KEY`, `ASAAS_ENV`, `NEXT_PUBLIC_SITE_URL`
- [ ] Notion DB tem colunas exatas `Nome/Email/Companhia/Serviço/Mensagem` e Integration em `Connections`
- [ ] Webhook Asaas cadastrado (opcional mas recomendado) para `PAYMENT_CONFIRMED`/`PAYMENT_RECEIVED`
- [ ] Teste: `GET /api/contact` → `{ok:true}` e `GET /api/checkout` → `{ok:true, hasKey:true}`, `POST /api/contact` cria linha no Notion, `POST /api/checkout` com `productId` retorna `paymentUrl` e o drawer gera a cobrança
- [ ] `prefers-reduced-motion` e `prefers-color-scheme` testados

---

## 7. Onde Mexer para Evoluir

- **Novo serviço:** adicione em `config.services` com `id`, `title` e `price` — o checkout usa o catálogo direto, sem passo extra.
- **Novo campo no form:** adicione em `contactSchema` (`route.ts`) + propriedade no Notion + input em `Contact.tsx`.
- **Mudança visual:** edite `globals.css` tokens.
- **Rate limit distribuído:** troque `buckets Map` por Redis/Upstash.

---
