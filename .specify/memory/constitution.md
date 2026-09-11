# Bio Links Page Constitution

## Core Principles

### I. Code Quality (NON-NEGOTIABLE)
- **TypeScript Strict Mode**: `strict: true` in tsconfig.json; zero implicit `any`; all variables, parameters, and returns explicitly typed
- **Functional Components Only**: No class components; use React 19 hooks (`useState`, `useEffect`, `useMemo`, `useCallback`)
- **Named Interface Props**: Every component's props defined in `src/types.ts` as named interfaces (e.g., `interface ProfileProps`, `interface LinkButtonProps`); no inline type literals in component signatures
- **No Business Logic in UI Components**: Components receive data via props and render only; all data transformation, validation, and computation lives in `src/lib/` utilities or config
- **ESLint + Prettier Enforced**: CI fails on lint/format errors; `eslint.config.mjs` extends `eslint-config-next` + TypeScript rules

### II. Single-Source Configuration Architecture
- **One Config File**: All user-customizable content lives exclusively in `src/config.ts` — profile, links, theme, SEO, metadata
- **Zero-Code Customization**: Page owners never edit React components, CSS, or build configs; only `src/config.ts`
- **Layer Separation**:
  - `src/config.ts` → raw data (JSON-serializable)
  - `src/types.ts` → TypeScript contracts (interfaces for Profile, Link, Theme, Config)
  - `src/lib/config.ts` → validation, defaults, type guards
  - `src/components/` → pure UI components (zero imports from config)
- **Config Validation at Build Time**: `vite build` runs schema validation (Zod) on `src/config.ts`; fails with clear errors if invalid

### III. Minimal Dependencies
- **Allowed Direct Dependencies Only**:
  - `react`, `react-dom` (React 19)
  - `typescript` (dev)
  - `vite`, `@vitejs/plugin-react` (dev)
  - `lucide-react` (icons — single icon library)
  - `zod` (config validation)
- **No UI Frameworks**: No Tailwind, no MUI, no Chakra — custom CSS Modules or CSS-in-JS only
- **No Runtime State Libraries**: No Redux, Zustand, Jotai — React context only if absolutely necessary
- **Bundle Size Budget**: Production JS ≤ 50KB gzipped (enforced in CI)

### IV. Mobile-First Design System
- **Breakpoint Baseline**: 320px minimum viewport; all components tested at 320px, 375px, 428px, 768px
- **Design System Reference**: `design-system.md` is the absolute source of truth for:
  - Color palette (primary, background, surface, text, border, focus states)
  - Typography scale (font families, sizes, line heights, weights)
  - Spacing scale (4px base unit, consistent padding/margin/gap)
  - Border radius, shadows, transitions
  - Button variants (filled, outlined, ghost), link styles, focus rings
- **Zero Hardcoded Values**: Components reference design tokens only; no magic numbers in styles
- **Touch Targets**: Minimum 44×44px for all interactive elements

### V. Accessibility (WCAG 2.1 AA Minimum)
- **Semantic HTML**: Proper heading hierarchy (`h1` → `h2` → `h3`), landmarks (`main`, `nav`, `footer`), lists for link groups
- **ARIA Labels**: Every link has `aria-label` describing destination; icon-only buttons have accessible names
- **Images**: `alt` text on all images; profile photo has descriptive alt (e.g., "Photo of [name]")
- **Color Contrast**: All text meets 4.5:1 (normal) / 3:1 (large); focus indicators 3:1 against adjacent
- **Keyboard Navigation**: Full page operable via keyboard; visible focus states on all interactive elements
- **Reduced Motion**: Respects `prefers-reduced-motion` for animations/transitions

### VI. SEO & Structured Data
- **Meta Tags**: Title, description, Open Graph (og:title, og:description, og:image, og:url), Twitter Card
- **JSON-LD Person Schema**: Structured data for profile (name, url, sameAs[], image, description)
- **Canonical URL**: Configurable via `config.ts`
- **Static Generation**: All SEO data injected at build time via Vite HTML plugin; no client-side rendering for crawlers

### VII. Zero-Config Static Deployment
- **Output Directory**: `dist/` (Vite default) — ready for any static CDN
- **GitHub Pages Primary**: `vite build` → `dist/` → push to `gh-pages` branch or GitHub Actions deploy
- **No Server-Side Code**: No API routes, no middleware, no edge functions — pure static assets
- **Base Path Support**: `base` in `vite.config.ts` configurable for subpath deploys (e.g., `/username/`)
- **Cache-Friendly**: Hashed asset filenames; `index.html` no-cache; assets long-term cache
- **SPA Fallback**: Not needed (single page); but `404.html` redirect for GitHub Pages if using subpath

## Additional Constraints

### Performance Standards
- **Lighthouse Mobile**: Performance ≥ 90, Accessibility ≥ 95, Best Practices ≥ 90, SEO ≥ 90
- **Core Web Vitals**: LCP < 2.5s, INP < 200ms, CLS < 0.1 on 3G simulation
- **Critical CSS Inlined**: Above-the-fold styles in `<style>` tag in `index.html`
- **Font Optimization**: Self-hosted variable fonts; `preload` + `font-display: swap`

### Security
- **No `dangerouslySetInnerHTML`**: Ever
- **External Links**: `rel="noopener noreferrer"` + `target="_blank"` on all outbound links
- **CSP Compatible**: No inline scripts/styles except critical CSS; nonce-ready build

### Browser Support
- **Modern Only**: Last 2 versions of Chrome, Firefox, Safari, Edge
- **No IE11**: Uses modern JS (optional chaining, nullish coalescing, dynamic import)

## Development Workflow

### Quality Gates (All Must Pass)
1. **TypeScript Compile**: `tsc --noEmit` — zero errors
2. **ESLint**: `eslint src --ext ts,tsx` — zero errors/warnings
3. **Prettier**: `prettier --check src` — zero diffs
4. **Config Validation**: `node scripts/validate-config.ts` — schema valid
5. **Build**: `vite build` — succeeds, outputs to `dist/`
6. **Bundle Size**: `gzip-size dist/assets/*.js` ≤ 50KB
7. **Tests**: `vitest run` — all pass (when tests exist)

### Commit Conventions
- **Conventional Commits**: `feat:`, `fix:`, `docs:`, `refactor:`, `chore:`, `test:`
- **No Direct Commits to Main**: PR required; CI must pass

## Governance

- **Constitution Supersedes All**: No exceptions without documented amendment
- **Amendments**: Require updating this file, version bump, and team approval
- **Complexity Justification**: Any new dependency or abstraction requires written justification in PR
- **Reference Files**: `design-system.md` (design), `src/types.ts` (contracts), `src/config.ts` (data)

**Version**: 1.0.0 | **Ratified**: 2026-09-11 | **Last Amended**: 2026-09-11