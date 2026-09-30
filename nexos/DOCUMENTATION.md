# NexOS — Documentação Técnica Focada no Funcionamento

> Stack: **Next.js 16 App Router + React 19 + TypeScript + Tailwind v4 + Framer Motion + Asaas (Pix/Boleto/Cartão) + Notion + Supabase Auth + Resend**.

---

## 1. Visão Geral e Fluxo

```
Usuário → Intro (TextPressure) → Header (glass) → Hero → Services → Testimonials → Contact → Footer
                 ↘ HoldButton (scramble)   ↘ SectionIndicator (dots)   ↘ EmbeddedCheckout (Drawer)   ↘ Notion DB
                                        ↘ Pix/Boleto/Cartão Asaas (invoiceUrl + polling + webhook)

Autenticação:
  /portal/acesso → LoginForm (login/signup/OTP/forgot) → /auth/callback → /conta
  Supabase Auth (SMTP Resend) → e-mails de confirmação, OTP, recuperação, segurança
  Resend SDK → e-mail de boas-vindas pós-confirmação
```

- **Estágios** `src/app/home-client.tsx:17`: `loading (2.2s orb) → intro (role/scroll para entrar) → main`. O `main` só monta após `stage==='main'`, evitando flash de conteúdo.
- **Tema** `src/components/ThemeProvider.tsx:19`: `documentElement.classList.toggle('dark')` + `localStorage nexos-theme`. Default `dark`. Todo CSS usa `var(--color-canvas/ink)` que troca no `.dark`.

---

## 2. Estrutura Crítica

```
src/
├─ app/
│  ├─ layout.tsx:15              → RootLayout: fonts next/font (Geist, Geist_Mono, Space_Grotesk), ThemeProvider, SmoothScrollProvider (Lenis), GlobalNoise, GradualBlur
│  ├─ page.tsx:5                 → export metadata + <HomeClient />
│  ├─ home-client.tsx:166        → Orquestra loading/intro/main, Header + SectionIndicator + Hero/Services/Testimonials/Contact + Footer
│  ├─ globals.css:1              → Design System v3: tokens --color-canvas/ink, --nex-pink, .bento-card, .glass-header, .pink-marker, animações GPU-only
│  ├─ conta/page.tsx             → Tela "Minha Conta" — perfil, segurança, endereços, pedidos, LGPD (dados reais do Supabase)
│  ├─ portal/acesso/page.tsx     → Página de login/cadastro
│  ├─ portal/redefinir/page.tsx  → Página de redefinição de senha
│  ├─ auth/callback/route.ts     → Troca de código OAuth/OTP + dispara e-mail de boas-vindas
│  └─ api/
│     ├─ checkout/route.ts:1           → Asaas — cria cobrança (valida produto, rate limit, CSP)
│     ├─ checkout/status/route.ts:1    → Asaas — polling de status por paymentId/externalReference
│     ├─ webhooks/checkout/route.ts:1  → Asaas webhook (PAYMENT_CONFIRMED/RECEIVED)
│     ├─ contact/route.ts:1            → Envio para Notion — zod + data_source fallback
│     ├─ auth/[action]/route.ts        → Supabase Auth — login, signup, OTP, forgot, reset, MFA (captchaToken)
│     ├─ account/profile/route.ts      → GET/PATCH perfil do usuário
│     ├─ account/addresses/route.ts    → GET/POST endereços
│     ├─ account/addresses/[id]/route.ts → PATCH/DELETE endereço
│     └─ account/orders/route.ts       → GET pedidos do usuário
├─ lib/
│  ├─ asaas.ts:1                 → Helper Asaas: findOrCreateCustomer + createPayment + getPaymentStatus
│  ├─ supabase/server.ts         → Cliente Supabase server-side (cookies SSR)
│  ├─ supabase/admin.ts          → Cliente admin (service_role, bypass RLS)
│  ├─ auth/user.ts               → getUserAccess — valida sessão + MFA + e-mail confirmado
│  ├─ auth/email-errors.ts       → authEmailFailure — mapeia erros do Supabase para respostas seguras
│  ├─ auth/actions.ts            → getUserAccessAction (server action)
│  ├─ account/actions.ts         → updateProfileAction, addAddressAction, deleteAddressAction
│  ├─ emails/resend.ts           → getResend() — lazy init do cliente Resend
│  ├─ emails/actions.ts          → sendWelcomeEmail, sendCustomEmail (e-mails de auth são do Supabase)
│  ├─ emails/welcome.ts          → sendWelcomeIfNeeded — boas-vindas pós-confirmação (idempotente)
│  └─ turnstile.ts               → Verificação Cloudflare Turnstile
├─ components/
│  ├─ Header.tsx:104             → glass-header fixo, scrollY → glass-header--scrolled, nav + mobile drawer
│  ├─ Hero.tsx:169               → DarkVeil/Grainient + bento 4 cards + HoldButton featured
│  ├─ HoldButton.tsx:18          → Segurar 1.5s + scramble hover (debounced, sem remount) + progress bar scaleX
│  ├─ Services.tsx:33            → 2 bento-cards + EmbeddedCheckoutDrawer trigger
│  ├─ EmbeddedCheckout.tsx:1     → Drawer + AsaasCheckoutPane — nome/e-mail validados, estados idle/generating/pending/success
│  ├─ Contact.tsx:40             → Form com validação, POST /api/contact → Notion, estados submitted/error
│  ├─ SectionIndicator.tsx:26    → Nav lateral xl:flex, IntersectionObserver + scrollYProgress spring, dots + trilho + counter
│  ├─ Footer.tsx:74              → glass-footer, Signature (Lastoria), links
│  ├─ signature.tsx:23           → SVG 120px com opentype.js, viewBox dinâmico, overflow visible
│  ├─ ThemeProvider.tsx:5        → Context theme light/dark
│  ├─ SmoothScrollProvider.tsx   → Lenis (lenis-smooth)
│  ├─ auth/LoginForm.tsx         → Formulário de autenticação (login/signup/OTP/forgot/MFA)
│  ├─ auth/ResetPasswordForm.tsx → Formulário de redefinição de senha
│  └─ ui/Button.tsx              → Variants primary/secondary, loading
└─ supabase/migrations/
   ├─ 20260923025930_inicial-schema.sql      → Tabelas iniciais
   ├─ 20260923025933_secure_checkout.sql     → Segurança checkout
   ├─ 20260923030245_auth_rate_limits.sql    → Rate limiting auth
   ├─ 20260923154533_require_order_mfa.sql   → MFA obrigatório para pedidos
   ├─ 20260928000001_account_profiles.sql    → Tabela profiles + trigger
   ├─ 20260928000002_account_addresses.sql  → Tabela addresses
   └─ 20260928000003_orders_and_trigger.sql → Colunas extras em orders + trigger handle_new_user
```

---

## 3. O Que Realmente Faz Funcionar

### 3.1 `src/components/EmbeddedCheckout.tsx:1` — Checkout Asaas (core de pagamento)
- **Arquitetura:** drawer + `AsaasCheckoutPane` — nome/e-mail validados, `POST /api/checkout` gera a cobrança, polling em `/api/checkout/status` confirma sozinho, webhook confirma em real-time.
- **Container oculto:** `open=false → null` (não no DOM). `open=true → AnimatePresence fade+slide` Drawer `fixed bottom-0 md:right-6` com glass `backdrop-blur-[20px]` + `border`.
- **Segurança:**
  - Nenhum dado bancário toca nossos servidores — o pagamento ocorre na página `invoiceUrl` do Asaas.
  - `externalReference` próprio por pedido; valor resolvido no servidor a partir do catálogo.
- **Server:** `POST /api/checkout` cria/atualiza customer por e-mail, cria payment com `billingType: UNDEFINED` (deixa cliente escolher Pix/boleto/cartão no checkout Asaas), rate limit 8 req/min.
- **Estados:** `idle` (form), `generating`, `pending` (link + polling), `success` (Check + WhatsApp). Tudo `aria-live` e sem redirect brusco.

### 3.2 `src/lib/asaas.ts:1` + `src/app/api/checkout/route.ts:1`
```ts
bodySchema = z.object({productId, name, email, quantity?})
rateLimit: Map<ip, number[]> 8 req/min
POST: validar productId no catálogo → amount = bulkUnitPrice*quantity → findOrCreateCustomer(email) → POST /payments { customer, billingType, value, dueDate, description, externalReference } → { invoiceUrl, id }
GET: diagnostico { ok, provider:'asaas', hasKey, products }
Headers: CSP default-src 'self', X-Content-Type-Options nosniff
Env: ASAAS_API_KEY (access_token), ASAAS_ENV (sandbox|production) → baseUrl
```

### 3.3 `src/app/api/checkout/status/route.ts:1`
```ts
POST { paymentId | externalReference } → GET /payments/{id} ou GET /payments?externalReference= → { paid: status in [RECEIVED, CONFIRMED, RECEIVED_IN_CASH], status, value, billingType }
RateLimit 20/min por IP
```

### 3.4 `src/app/api/webhooks/checkout/route.ts:1`
```ts
POST { event, payment: { id, externalReference, status, value, billingType } }
Eventos: PAYMENT_CONFIRMED, PAYMENT_RECEIVED, etc.
GET: healthcheck { ok:true, provider:'asaas' }
Cadastre em Asaas → Minha Conta → Integrações → Webhooks: https://seu-dominio.com/api/webhooks/checkout
```

### 3.5 `src/app/api/auth/[action]/route.ts` — Autenticação Supabase
```ts
Ações: login, logout, signup, resend, otp, otp-verify, oauth, forgot, reset, factor, enroll, verify
Segurança:
  - isSameOrigin(req) — rejeita requests cross-origin
  - consumeAttempt() — rate limit por IP (10/min) e por e-mail (3/15min)
  - captchaToken — repassado ao Supabase (Turnstile validado lá, não aqui)
  - MFA obrigatório para acesso completo (aal2)
Respostas:
  - Erros de CAPTCHA → 400 "A verificação de segurança expirou ou foi recusada"
  - Rate limit → 429 "Limite de solicitações atingido"
  - Erros SMTP → 503 "Não foi possível solicitar o e-mail agora"
  - Credenciais inválidas → 401 genérico (não revela existência de conta)
```

### 3.6 `src/lib/auth/email-errors.ts` — Tratamento de Erros de E-mail
```ts
authEmailFailure(error) → { status, error } | null
  - user_not_found, user_already_exists, email_exists → null (não revela conta)
  - captcha_failed → 400
  - over_email_send_rate_limit, over_request_rate_limit → 429
  - outros → 503
```

### 3.7 `src/lib/emails/welcome.ts` — E-mail de Boas-vindas
```ts
sendWelcomeIfNeeded(userId) → void
  - Verifica email_confirmed_at e app_metadata.welcome_email_sent_at
  - Se já enviou ou não confirmou → não envia
  - Usa idempotência: chave estável welcome/{userId} (Resend: 24h)
  - Registra sucesso em app_metadata.welcome_email_sent_at
  - Falha não impede login; próximo acesso tenta novamente
```

### 3.8 `src/app/conta/page.tsx` — Tela Minha Conta
```ts
Seções:
  - Perfil: nome, e-mail, telefone, membro desde (editável via server action)
  - Segurança: MFA status, status do e-mail, último acesso
  - Endereços: lista, adicionar, remover (CRUD completo)
  - Pedidos: lista com status, itens, total, rastreio
  - LGPD: direitos do usuário, proteção de dados

Dados reais:
  - GET /api/account/profile → { email, fullName, phone, emailConfirmed, lastSignIn, createdAt }
  - GET /api/account/addresses → { addresses: Address[] }
  - GET /api/account/orders → { orders: Order[] }

Server actions:
  - updateProfileAction(formData) → PATCH /api/account/profile
  - addAddressAction(formData) → POST /api/account/addresses
  - deleteAddressAction(id) → DELETE /api/account/addresses/[id]

Design:
  - bg-canvas, text-ink, bg-card (tokens do Design System v3)
  - btn-primary-nex, field-input, bento-card
  - font-display (headings), font-sans (body), font-mono (labels)
  - Dark/light mode automático via variáveis CSS
```

### 3.9 `src/app/api/account/*` — APIs da Conta
```ts
GET  /api/account/profile    → { email, fullName, phone, emailConfirmed, lastSignIn, createdAt }
PATCH /api/account/profile   → { fullName, phone } → upsert profiles
GET  /api/account/addresses  → { addresses: Address[] } (ordenado por is_default, created_at)
POST /api/account/addresses  → cria endereço (valida campos obrigatórios)
PATCH /api/account/addresses/[id] → atualiza endereço (verifica user_id)
DELETE /api/account/addresses/[id] → remove endereço (verifica user_id)
GET  /api/account/orders    → { orders: Order[] } (RLS: owner_id = auth.uid())
```

### 3.10 `src/lib/account/actions.ts` — Server Actions
```ts
updateProfileAction(prevState, formData) → { success } | { error }
  - Valida nome obrigatório
  - UPSERT em profiles (id = user.id)

addAddressAction(prevState, formData) → { success } | { error }
  - Valida campos obrigatórios (street, number, neighborhood, city, state, cep)
  - Se isDefault → remove padrão dos outros
  - INSERT em addresses

deleteAddressAction(id) → { success } | { error }
  - DELETE em addresses (verifica user_id)
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

# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SECRET_KEY=... (server-only)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_JWKS_URL=https://xxx.supabase.co/auth/v1/.well-known/jwks.json

# Resend (e-mail transacional: boas-vindas, notificações)
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=NexOS <noreply@nexoslab.online>

# Cloudflare Turnstile (proteção anti-bot)
NEXT_PUBLIC_TURNSTILE_SITE_KEY=0x4...
TURNSTILE_SECRET_KEY=... (server-only)
TURNSTILE_ENFORCED=true

# Checkout
CHECKOUT_STATUS_SECRET=... (mínimo 32 caracteres)

# Allowlist de admins
DASHBOARD_ADMIN_USER_IDS=uuid1,uuid2
```

- `.env.local` é gitignore (`/.env*` em `.gitignore`). **Vercel precisa das mesmas vars em Settings → Environment Variables + Redeploy com Clear Cache.**
- Sandbox base: `https://sandbox.asaas.com/api/v3` — Produção: `https://api.asaas.com/api/v3` (troca automática via `ASAAS_ENV` em `src/lib/asaas.ts`).

---

## 5. Comandos Essenciais

```bash
npm install          # inclui @notionhq/client, resend, @supabase/supabase-js
npm run dev          # localhost:3000 (use --use-system-ca se TLS falhar local)
npm run build        # Vercel: build dinâmico (com /api/*). GitHub Pages: NEXT_EXPORT=1 npm run build → out/
npm run lint
npm run typecheck
npm run test:security # Testes de segurança (node:test)
npm run test:email   # Testa envio de e-mails via Resend (requer RESEND_API_KEY)
```

### Migrations do Supabase
```bash
# Aplicar manualmente via Supabase Dashboard → SQL Editor
# Ou via Management API (requer SUPABASE_ACCESS_TOKEN)
supabase/migrations/20260928000001_account_profiles.sql
supabase/migrations/20260928000002_account_addresses.sql
supabase/migrations/20260928000003_orders_and_trigger.sql
```

---

## 6. Checklist de Produção

- [ ] Preços conferidos em `config.services[]` (dev R$499,90 · placa R$69,90 · teste R$1,00)
- [ ] `ASAAS_API_KEY` válida (Sandbox vs Production confere com `ASAAS_ENV`)
- [ ] Vercel envs: `NOTION_TOKEN`, `NOTION_DATABASE_ID`, `ASAAS_API_KEY`, `ASAAS_ENV`, `NEXT_PUBLIC_SITE_URL`
- [ ] Notion DB tem colunas exatas `Nome/Email/Companhia/Serviço/Mensagem` e Integration em `Connections`
- [ ] Webhook Asaas cadastrado (opcional mas recomendado) para `PAYMENT_CONFIRMED`/`PAYMENT_RECEIVED`
- [ ] `RESEND_API_KEY` configurada (Vercel + local) — para e-mails de boas-vindas
- [ ] SMTP do Supabase configurado com a mesma key — para e-mails de auth
- [ ] Domínio `nexoslab.online` verificado no Resend (SPF, DKIM, DMARC)
- [ ] `TURNSTILE_ENFORCED=true` em produção
- [ ] `DASHBOARD_ADMIN_USER_IDS` preenchido com UUIDs dos admins
- [ ] Teste: `GET /api/contact` → `{ok:true}` e `GET /api/checkout` → `{ok:true, hasKey:true}`
- [ ] Teste: `POST /api/contact` cria linha no Notion
- [ ] Teste: `POST /api/checkout` com `productId` retorna `paymentUrl` e o drawer gera a cobrança
- [ ] Teste: cadastro → confirmação de e-mail → login → boas-vindas
- [ ] Teste: recuperação de senha via e-mail
- [ ] Teste: login com OTP de 8 dígitos
- [ ] Teste: adicionar/remover endereço em `/conta`
- [ ] `prefers-reduced-motion` e `prefers-color-scheme` testados

---

## 7. Onde Mexer para Evoluir

- **Novo serviço:** adicione em `config.services` com `id`, `title` e `price` — o checkout usa o catálogo direto, sem passo extra.
- **Novo campo no form:** adicione em `contactSchema` (`route.ts`) + propriedade no Notion + input em `Contact.tsx`.
- **Mudança visual:** edite `globals.css` tokens.
- **Rate limit distribuído:** troque `buckets Map` por Redis/Upstash.
- **Novo campo no perfil:** adicione em `profiles` (migration) + `updateProfileAction` + formulário em `conta/page.tsx`.
- **Novo tipo de endereço:** adicione no `check` constraint de `addresses.type` + `addressTypeLabels` em `conta/page.tsx`.
- **Notificações de segurança:** habilite em Supabase Dashboard → Auth → Email Templates (já configurado: password_changed, email_changed, phone_changed, mfa_factor_enrolled, mfa_factor_unenrolled, identity_linked, identity_unlinked).

---

## 8. E-mails

### Fluxo de E-mails do Supabase Auth (SMTP Resend)
| Momento | Template | Conteúdo |
|---------|----------|----------|
| Cadastro | Confirm signup | Link de confirmação + código OTP (8 dígitos) |
| Login por código | Magic link | Link de acesso + código OTP (8 dígitos) |
| Recuperação | Reset password | Link para redefinir senha |
| Senha alterada | Password changed | Notificação de segurança |
| E-mail alterado | Email changed | Notificação de segurança |
| Telefone alterado | Phone changed | Notificação de segurança |
| MFA adicionado | MFA factor enrolled | Notificação de segurança |
| MFA removido | MFA factor unenrolled | Notificação de segurança |
| Login social vinculado | Identity linked | Notificação de segurança |
| Login social removido | Identity unlinked | Notificação de segurança |

### E-mail de Boas-vindas (Resend SDK)
- **Quando:** após autenticação confirmada (callback ou login direto)
- **Como:** `sendWelcomeIfNeeded(userId)` via `after()` (não bloqueia resposta)
- **Idempotência:** chave estável `welcome/{userId}` + `app_metadata.welcome_email_sent_at`
- **Falha:** não impede login; próximo acesso tenta novamente

### Configuração do Resend
- **Domínio:** `nexoslab.online` (verificado com SPF, DKIM, DMARC)
- **SMTP:** `smtp.resend.com:587` (username: `resend`, password: API key)
- **API:** key com permissão de envio
- **Remetente:** `NexOS <noreply@nexoslab.online>`

---

## 9. Segurança

- **CAPTCHA:** Turnstile habilitado no Supabase Auth (login, signup, OTP, recuperação)
- **Rate limiting:** 10/min por IP (auth), 3/15min por e-mail (signup/resend), 8/min (checkout)
- **CSRF:** `isSameOrigin(req)` em todas as rotas de auth
- **RLS:** habilitado em todas as tabelas (profiles, addresses, orders, idempotency_keys, webhook_events)
- **MFA:** obrigatório para acesso completo (aal2)
- **Senhas:** mínimo 12 caracteres, maiúscula, minúscula, número, símbolo
- **Cookies:** HttpOnly, Secure, SameSite=Lax
- **CSP:** `default-src 'self'` nas rotas de API
- **Validação:** zod em todos os inputs
- **Segredos:** nunca logados, nunca expostos ao client

---

## 10. Design System

### Tokens de Cor
| Token | Light | Dark |
|-------|-------|------|
| `--color-canvas` | `#fdf6ec` | `#050505` |
| `--color-ink` | `#231b14` | `#ffffff` |
| `--color-card` | `#fffaf2` | `oklch(0.205 0 0)` |
| `--nex-pink` | `#db2777` | `#db2777` |
| `--nex-pink-hot` | `#ff5c8a` | `#ff5c8a` |
| `--nex-purple` | `#83358F` | `#83358F` |

### Tipografia
| Token | Fonte | Uso |
|-------|-------|-----|
| `--font-display` | Space Grotesk | Headings (h1-h3) |
| `--font-sans` | Geist | Body text |
| `--font-mono` | Geist Mono | Labels, badges, código |

### Componentes
| Classe | Uso |
|--------|-----|
| `.btn-primary-nex` | Botão primário (gradiente pink + glow) |
| `.btn-secondary-nex` | Botão secundário (borda hairline) |
| `.field-input` | Input (borda fina, focus pink) |
| `.bento-card` | Card (borda hairline, radius 1rem) |
| `.glass-header` | Header fixo (glassmorphism) |
| `.pink-marker` | Marcador 8x8px pink |
| `.tech-badge` | Badge pill (mono, uppercase) |

### Animações
- **Easing:** `cubic-bezier(0.16, 1, 0.3, 1)` (fluid)
- **GPU-only:** apenas `transform` e `opacity`
- **Entrada:** `opacity: 0, y: 30, blur(6px)` → `opacity: 1, y: 0, blur(0)` em 0.8s
- **Stagger:** 0.08-0.1s entre filhos
- **Reduced motion:** desabilitado via `prefers-reduced-motion`
