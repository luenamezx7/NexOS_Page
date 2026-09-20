# NexOS — Serviços Digitais de Escala

Landing page corporativa de alta conversão, minimalista (P&B), com motion background animado, checkout Pix integrado e deploy estático no GitHub Pages.

## Stack

- **Framework**: Next.js 16 (App Router) + React 19 + TypeScript
- **Estilização**: CSS Modules + CSS Custom Properties (design tokens)
- **Animações**: Framer Motion + Canvas API (motion background)
- **Ícones**: Lucide React
- **Pagamentos**: Pix / Boleto / Cartão via Asaas
- **Deploy**: GitHub Pages (static export)

## Arquitetura

```
src/
├── app/
│   ├── api/
│   │   ├── checkout/route.ts      # Cria cobrança Pix
│   │   ├── contact/route.ts       # Processa formulário
│   │   └── checkout/status/route.ts # Verifica pagamento
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
│   ├── Services.tsx + .module.css # Cards de serviço + checkout
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
- Credenciais Asaas, URLs de retorno, WhatsApp
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
2. Adicione as credenciais Asaas: `ASAAS_API_KEY` e `ASAAS_ENV` (sandbox/production)
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

## Asaas Setup

1. Crie sua conta em https://www.asaas.com (use Sandbox para testes: https://sandbox.asaas.com)
2. Gere sua API Key em **Minha Conta > Integrações > Gerar nova chave de API**
3. Defina no `.env.local` e na Vercel:
   ```
   ASAAS_API_KEY=sua_chave_aqui
   ASAAS_ENV=sandbox  # ou production
   ```
4. (Opcional) Cadastre o Webhook em **Minha Conta > Integrações > Webhooks** apontando para `https://seudominio.com/api/webhooks/checkout` e ative os eventos `PAYMENT_CONFIRMED`, `PAYMENT_RECEIVED`
5. Veja `src/lib/asaas.ts` para `SANDBOX_URL` vs `PROD_URL` — a troca é automática via `ASAAS_ENV`

## Webhook Asaas

O Asaas notifica via `POST /api/webhooks/checkout` com `{ event, payment: { id, externalReference, status } }`.
Responda sempre `200`. A confirmação visível ao usuário também funciona via polling (`POST /api/checkout/status`).

## WhatsApp Integration

Pós-pagamento redireciona automaticamente para WhatsApp com mensagem pré-preenchida contendo o `externalReference` / `paymentId`.

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
  services: Service[];      // { id, title, description, price, features, ctaText }
  testimonials: Testimonial[];
  navigation: NavItem[];
  footer: { links, legal, social };
  whatsapp: { number, message };
  meta: { title, description, ogImage };
}
```

## Licença

MIT — Use livremente para seus projetos.