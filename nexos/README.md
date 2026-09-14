# NexOS — Serviços Digitais de Escala

Landing page corporativa de alta conversão, minimalista (P&B), com motion background animado, checkout Stripe integrado e deploy estático no GitHub Pages.

## Stack

- **Framework**: Next.js 16 (App Router) + React 19 + TypeScript
- **Estilização**: CSS Modules + CSS Custom Properties (design tokens)
- **Animações**: Framer Motion + Canvas API (motion background)
- **Ícones**: Lucide React
- **Pagamentos**: Stripe Checkout
- **Deploy**: GitHub Pages (static export)

## Arquitetura

```
src/
├── app/
│   ├── api/
│   │   ├── checkout/route.ts      # Cria sessão Stripe
│   │   ├── contact/route.ts       # Processa formulário
│   │   └── verify-session/route.ts # Verifica pagamento
│   ├── sucesso/page.tsx           # Página pós-pagamento
│   ├── cancelado/page.tsx         # Página cancelamento
│   ├── globals.css                # Design tokens + reset
│   ├── layout.tsx                 # Root layout + metadata
│   └── page.tsx                   # Home (compose sections)
├── components/
│   ├── ui/
│   │   ├── Button.tsx             # Botão reutilizável
│   │   └── Button.module.css
│   ├── Header.tsx + .module.css   # Navegação responsiva
│   ├── Hero.tsx + .module.css     # Hero com code preview
│   ├── Services.tsx + .module.css # Cards de serviço + Stripe
│   ├── Testimonials.tsx + .module.css # Carrossel acessível
│   ├── Contact.tsx + .module.css  # Form + WhatsApp
│   ├── Footer.tsx + .module.css   # Footer + legal
│   └── MotionBackground.tsx       # Canvas pixel wave
├── config.ts                      # ÚNICO arquivo de configuração
├── types/index.ts                 # Interfaces TypeScript
└── lib/                           # Utilities (futuro)
```

## Configuração

Edite **apenas** `src/config.ts` para personalizar:

- Marca, hero, serviços, preços, depoimentos
- Chaves Stripe, URLs de redirect, WhatsApp
- SEO metadata, navegação, footer

## Desenvolvimento

```bash
# Instalar dependências
npm install

# Desenvolvimento
npm run dev

# Build de produção (static export)
npm run build

# Preview do build
npm run start

# Type check
npm run typecheck

# Lint
npm run lint
```

## Deploy GitHub Pages

1. Configure `NEXT_PUBLIC_SITE_URL` nas variáveis do repositório
2. Adicione secrets do Stripe: `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
3. GitHub Actions fará build e deploy automático do folder `out/`

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: ./out
  deploy:
    needs: build
    permissions:
      pages: write
      id-token: write
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

4. Em Settings → Pages, selecione "GitHub Actions" como source

## Stripe Setup

1. Crie produtos/preços no Dashboard Stripe
2. Copie `price_id` para `config.ts` → `services[].stripePriceId`
3. Configure webhook para `https://seudominio.com/api/stripe/webhook` (opcional)

## WhatsApp Integration

Pós-pagamento redireciona automaticamente para WhatsApp com mensagem pré-preenchida contendo o `session_id`.

## Acessibilidade (WCAG AA)

- Semântica HTML5 correta
- ARIA labels em todos os interativos
- Contraste P&B rigoroso
- `prefers-reduced-motion` respeitado
- Foco visível (`:focus-visible`)
- Touch targets ≥ 44px

## Performance

- Static export (zero JS desnecessário)
- Fontes otimizadas (`next/font`)
- Imagens não otimizadas (export estático)
- Motion background em canvas (GPU accelerated)
- Code splitting automático por rota

## LGPD / Privacidade

- Zero cookies de terceiros
- Dados de formulário apenas para contato
- Links para Política de Privacidade e Termos no footer
- Minimização de dados

## Scripts Disponíveis

| Script | Descrição |
|--------|-----------|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build produção (exporta para `out/`) |
| `npm run start` | Preview do build local |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript strict check |
| `npm run deploy` | Build + instruções deploy |

## Estrutura de Dados (config.ts)

```typescript
interface SiteConfig {
  brand: { name, tagline, logo };
  hero: { headline, subheadline, ctaPrimary, ctaSecondary };
  services: Service[];      // { id, title, description, price, features, stripePriceId }
  testimonials: Testimonial[];
  navigation: NavItem[];
  footer: { links, legal, social };
  stripe: { publishableKey, successUrl, cancelUrl };
  whatsapp: { number, message };
  meta: { title, description, ogImage };
}
```

## Licença

MIT — Use livremente para seus projetos.