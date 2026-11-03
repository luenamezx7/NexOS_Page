# NexOS Lab — Layout Refactor & UI/UX Prompt

*NexOS Lab · nexoslab.online · Prepared 2 Nov 2026*

**How to use:** open the project in your coding assistant (Claude Code, Cursor, etc.) and paste everything from “0. Role and mission” to the end. UI copy stays in Brazilian Portuguese; this prompt is in English.

---

## 0. Role and mission

You are a senior product designer and front-end engineer. Refactor and re-organize the NexOS Lab landing page (nexoslab.online) for a better section sequence, a more vibrant visual treatment and better UI/UX, without changing the brand identity or the signature edge-blur behavior.

Before changing anything, inspect the codebase (framework, styling approach, component structure, scroll and animation libraries, theme handling) and adapt every instruction below to the stack you find. Work in small, reviewable steps and keep the site deployable after each one.

## 1. Business context

- NexOS Lab (also written NexOS) is an early-stage B2B brand focused on optimizing processes for small and large businesses and developing solutions for them.
- Current offers: websites and portfolios, landing pages, digital menus, the NFC + QR Code smart plate (Placa Inteligente NexOS), custom development (Desenvolvimento NexOS) and EasyWay (provisional name, product in development), an AI administrative assistant described in section 4, item 9.
- Audience: owners, managers and decision makers at small and large companies. Tone: clear, direct, confident. Language: pt-BR.
- Primary conversion: book a conversation with the sales team (WhatsApp, e-mail or short form).
- Known gap: the hero promises “IA” and process optimization, while the content mostly sells websites, menus and NFC plates. The “IA” in the hero is EasyWay, the AI administrative assistant, so connect the two: keep the hero copy, add a short EasyWay teaser near the hero CTAs (item 1) and give EasyWay its full treatment in item 9, without inventing facts beyond the product facts listed there.

## 2. Non-negotiable constraints

1. **Edge blur stays EXACTLY as it is.** The blur is fixed at the viewport edges, and page content is revealed progressively as the user scrolls. Do not modify the blur layers, masks, intensity, z-index, scroll-reveal logic or timing. Every new or moved section must plug into the existing reveal mechanism. Glows and gradients must live in section backgrounds, never as fixed overlays, so they cannot interfere with the blur layers. If a change risks touching the blur, stop and flag it.
2. **Keep every existing mockup, template and visual asset:** tiger photo (demo-site card and full-bleed), mascot curved gallery, NFC card mockups (purple, violet, monochrome), white digital-menu mockup, “Do físico ao digital” card, integrations hub diagram, EasyWay phone mockup, process steps, FAQ accordion, marquee, left dot navigation and the large footer wordmark. Restyle and reposition them; replace one only if a section below says so.
3. **EasyWay stays** (navigation item and dedicated section). Improve only its organization and presentation (section 4, item 9).
4. **Brand identity stays:** purple, black and lime, mascot, wordmark and wide display typeface.
5. **Copy:** preserve existing pt-BR copy unless a change is specified. Anything that needs real facts (client logos, metrics, testimonials, prices, team names) uses clearly marked \[PLACEHOLDER\] content. Never invent numbers, clients or quotes.
6. Do not break existing routes and anchors (#hero etc.), the account, portal and auth areas, analytics, the cookie manager, SEO meta tags or the sitemap.
7. The light/dark theme toggle must keep working, and both themes must meet contrast requirements.

## 3. Remove (and delete the related code)

- The quiz “Encontre seu uso ideal”: component, state, handlers, styles, analytics events and the “Duas perguntas. Sem cadastro.” copy.
- The filter chips (Design / Desenvolvimento / Integração) and the “3 soluções disponíveis” counter in “Qual é seu próximo passo?”. Show all solution cards.
- The second hero (“Uma boa ideia. Seu próximo endereço.”) and its three buttons (Explorar tudo, Quero vender, Apresentar marca).
- The “Explore a NexOS ↓” scroll hint (the marquee and dot navigation already guide scrolling).
- The binary/ASCII background in Sobre Nós.
- Jump links in section headers (“Serviços digitais ↗”, “Dúvidas frequentes ↗”, “Falar com a gente ↗”) and secondary arrow links that duplicate a nearby CTA.
- Repeated “Em desenvolvimento” and “Nome provisório” labels. Keep one consistent status chip on EasyWay only; remove “Em desenvolvimento · Global” from the footer.
- “Minha conta” as visible text in the navigation (keep the account icon).
- Footer: the cursive signature logo and the duplicated “Serviços” link. Confirm the purpose of “Ver apresentação” with the owner and remove it if it has none.
- The duplicate use of the tiger image: the full-bleed section “Instinto para criar. Visão para ir além.” becomes the background of the final CTA (item 12).

## 4. Target page structure and sequence

**Navigation (sticky pill, aligned to the content grid):** logo · Soluções ▾ (Sites e Portfólios, Landing Pages, Cardápios Digitais, Placa NFC) · Como funciona · EasyWay · Planos · Sobre · account icon · primary lime button “Agendar conversa”. Add clear active and hover states. On mobile use the existing hamburger with the same items and the CTA inside.

1. **Hero (keep).** Keep eyebrow, H1 (“Soluções com IA que impulsionam seu negócio”), subtitle and marquee. Change the primary CTA label to “Agendar conversa” and keep “Conhecer a Placa NFC” as the secondary. Hold the purple gradient longer so the lower half is not an empty black area (see section 5), with a soft magenta glow in the lower right. Under the CTAs add one small chip that links to the EasyWay section, for example “Novo: EasyWay, seu assistente administrativo com IA · Em desenvolvimento”, so the “IA” in the H1 has a visible payoff.
2. **Proof strip (new).** One row of 3–4 slots for client logos or real metrics, all \[PLACEHOLDER\]. If nothing exists yet, use a “Clientes fundadores” slot.
3. **Tecnologia com ponto de contato (keep).** Keep the headline, the “Do físico ao digital” card and the three columns (Design, Desenvolvimento, NFC e QR Code). Trim copy slightly and remove dead vertical space.
4. **Soluções (merged).** Header: eyebrow “Soluções” and the headline “Soluções para o seu negócio” (suggested, replaces the filter-oriented header). Cards: Sites e Portfólios, Landing Pages, Cardápios Digitais, reusing the existing tiger demo card, landing card and white menu mockup. Below, keep the “Desenvolvimento NexOS” strip with “Falar com o comercial”. No filters, no quiz.
5. **Placa Inteligente NFC (keep).** Keep the three card mockups and the “Aproxime / Ou escaneie” hints. Shorten the two long paragraphs. Keep the tabs (Como funciona, Sua marca, Em quantidade). Fix the overlap so all three card labels are visible. Single CTA: “Personalizar minha placa”.
6. **De ponta a ponta (keep).** Keep the Produto físico / Serviço digital toggle and the 4 steps. Add an estimated duration per step as \[PLACEHOLDER\] and make inactive steps fully legible.
7. **No dia a dia + cases (merged).** Keep the curved mascot gallery with its current header (“NexOS no seu dia a dia — Pequenas conexões. Soluções de verdade.”). Add two result-focused case slots and one testimonial slot, all \[PLACEHOLDER\].
8. **Planos (new).** Three cards: Start, Pro (highlighted) and Sob medida, each with “a partir de” \[PLACEHOLDER\] pricing and a short inclusion list, plus one CTA per card.
9. **EasyWay (keep, reorganized).** Position it after Planos and before Sobre, so the core conversion path is not interrupted while it stays reachable from the nav. Use the same two-column pattern as the NFC section (copy left, phone mockup right). Keep the title “EasyWay”, the headline “Menos complexidade. Mais possibilidades.” and the descriptive paragraph, and add a five-item capability list under it (product facts below). Use ONE status chip “Em desenvolvimento” and ONE small caption (“Nome provisório. Interface conceitual.”). Keep the phone mockup frame, but give the screen a neutral conceptual UI skeleton (placeholder bars, subtle purple glow, caption “Prévia do projeto”) so it never reads as an empty black box. Product facts (use only these, add nothing else): EasyWay is an AI administrative assistant that generates documents from a single request without opening Word or Docs; reads invoices (notas fiscais) and organizes them; converts the files most used in administrative work, such as OFX, PDF and Word, among others; sets reminders and alerts when the date arrives; and helps a little with finances. Suggested pt-BR labels: “Gera documentos em um único pedido”, “Lê e organiza notas fiscais”, “Converte OFX, PDF, Word e mais”, “Lembretes com aviso na data”, “Apoio básico em finanças”. Show them as five compact rows with outline icons (document, receipt, file convert, bell, wallet). Upgrade the neutral skeleton on the phone screen into a conceptual assistant screen: an input bar, one request bubble and result chips named after these features, with placeholder data only, no real figures and no performance or availability claims. Placement: after Planos as above; if EasyWay becomes the lead story, the owner may move it to right after item 6. Optional: a secondary text link that uses the existing contact flow.
10. **Sobre + integrações + time (keep + new).** Keep “Design e tecnologia. Negócios mais próximos.”, the text and the hub diagram (WhatsApp, Instagram, Notion, Google Docs and the lime center chip). Add relevant B2B tools to the hub as \[PLACEHOLDER\] nodes (for example CRM, Pix/payments). Add a founders block with photo, name and role as \[PLACEHOLDER\].
11. **FAQ (keep, reordered).** Same accordion. New order: price, delivery time, what is included in Desenvolvimento NexOS, how the plate works, how to buy, whether a CNPJ is needed, then “O que é o EasyWay?” (answer from the product facts in item 9; availability as \[PLACEHOLDER\]), and last “NexOS, NexOS Lab e NexOS Performance são a mesma empresa?”. Add a CTA below it.
12. **Final CTA + footer (merged).** Use the tiger full-bleed as the background of “Sua próxima ideia. Vamos colocar no ar?” with the lime button “Conversar com a NexOS” and the link “Prefiro conversar por e-mail”. Keep the Instagram strip. Footer: four columns, add LinkedIn and WhatsApp icons next to Instagram with one consistent icon style, brighten link color, and keep the large NEXOS wordmark with tighter vertical spacing.

Also add a floating WhatsApp button (desktop and mobile) and a short contact form (name, company, segment, need) reachable from every “Agendar conversa” CTA, as a modal or an anchored block.

## 5. Visual system (make it vibrant, not dull)

**Diagnosis:** vivid purple appears only at the very top and bottom while the middle of the page is near-black; cards are dark on black with thin borders; secondary text is small and low contrast; accent text is pastel lilac; lime is scattered; inactive steps are almost invisible.

**Fixes:**

- Soft purple/magenta glows behind each section heading, implemented as section backgrounds.
- Cards with a tinted surface, a gradient border and a glow.
- Secondary text lighter and at least 15px (body 16px).
- Highlights as a purple → magenta gradient on text.
- Lime reserved for actions and active states, with a glow on primary CTAs.
- Hero gradient held longer before fading to black.

**CSS recipes (adapt to the stack and token system):**

```css
--hero-bg: radial-gradient(40% 35% at 88% 72%, rgba(224,64,251,.38), transparent 70%),
           linear-gradient(180deg, #7A1FEB 0%, #3A0F85 40%, #07050D 100%);
--section-glow: radial-gradient(45% 55% at 15% 0%, rgba(122,44,245,.5), transparent 70%);
.card { border: 1px solid transparent; border-radius: 22px;
  background: linear-gradient(160deg,#241046,#0F0824) padding-box,
              linear-gradient(135deg,#B65CFF,#2A1D45 50%,#6A1FD6) border-box;
  box-shadow: 0 0 56px rgba(122,44,245,.35); }
.gradient-text { background: linear-gradient(90deg,#B65CFF,#FF6BDD);
  -webkit-background-clip: text; background-clip: text; color: transparent; }
.btn-primary { background: #D6F55B; color: #12081F; box-shadow: 0 0 32px rgba(214,245,91,.45); }
```

**Dark tokens (default, Palette A):** bg-0 #07050D; bg-1 #0F0A1A; surface #170C2B; border #2A1D45; purple-600 #6A1FD6; purple-500 #7A2CF5; purple-300 #B65CFF; magenta #FF6BDD; lime #D6F55B; text #FFFFFF; text-2 #E2D8F5; text-3 #B9B0CC (large text or decoration only).

**Light tokens (recommended hybrid):** mid-page background #F7F5FB; surface #FFFFFF; border #E0D8F0; text #170B2E; text-2 #5B4E78; accent and CTA on light blocks #6A1FD6 with white text; lime CTA only on dark blocks (hero, final CTA, footer, which keep the dark purple-to-black look). The edge-blur tint must follow the theme background token, with the same mask and intensity.

**Alternative palettes** are listed in the appendix and swap tokens only.

**Typography:** keep the wide display face, an Inter-like body sans, and mono only for small technical labels (never on action buttons). Scale: 12 / 14 / 16 / 20 / 24 / 32 / 46 / 72. One H1 per page.

**Spacing and shape:** 8px base; section padding 96–128px on desktop and 64px on mobile; one container (max 1200px) shared by nav, content and footer. Radii: 12 (buttons, chips), 20–22 (cards), 28 (large panels). Icon stroke 1.75px.

**Motion:** keep the existing reveal untouched; add hover glow on cards and buttons (200ms or less); respect prefers-reduced-motion for the marquee and any non-blur animation.

## 6. Component rules

- **Buttons:** one primary (lime), one secondary (ghost, border at least 40% white), one tertiary (text plus arrow, used sparingly). The same label for the same action across the page. Minimum height 44px.
- **Tabs and toggles:** one pill style for both “Como funciona / Sua marca / Em quantidade” and “Produto físico / Serviço digital”.
- **Steps:** active is lime filled with a glow; inactive is purple-tinted filled with text-2 color.
- **Accordion:** keep it; lime circle when open; visible focus ring; aria-expanded.
- **Left dot navigation:** add a hover/focus tooltip with the section name; hide below 1024px.
- **Marquee:** keep it, with a larger pause button (44px target).
- **Forms:** labels always visible, inline validation, success state.
- **Focus ring:** 2px lime outline with 2px offset on dark; 2px purple on light.

## 7. UX and conversion rules

- One primary conversion (“Agendar conversa”) repeated in the nav, hero, after cases/plans and in the final CTA; WhatsApp as the secondary.
- One message and one action per section.
- Show proof early (proof strip) and again mid-page (cases, testimonial).
- Show price signals (Planos) to reduce the “fale com o comercial” friction.
- Keep copy short: at most two short paragraphs per section. Do not rewrite existing headlines unless asked.
- Avoid repeating the same “white line, purple line” headline pattern in every section: vary at least a third of the headings (single color, or highlight a single word).

## 8. Accessibility, performance, SEO, responsive

- WCAG AA: 4.5:1 for text (3:1 for 24px and larger), visible keyboard focus, real buttons and links, aria-labels on icon-only controls, alt text on images.
- Single H1; a logical H2/H3 hierarchy.
- Images: WebP/AVIF, explicit width and height, lazy-load below the fold, preload the hero asset. Measure LCP, CLS and INP with Lighthouse before and after, and mind the cost of large gradients on mobile.
- Responsive checks at 390, 768, 1280 and 1920px: columns stack, wide diagrams scroll or simplify, tap targets at least 44px, no horizontal scroll.
- SEO: update title and meta description to mention the offers, add an Open Graph image and JSON-LD Organization data, keep sitemap and robots.txt consistent.

## 9. Process and deliverables

1. **Audit:** report the stack, a file map, where the blur lives and a change plan. State which files you will NOT touch (the blur layers).
2. **Implement in this order:** design tokens and theme (dark and light) → navigation and CTA → removals (section 3) → section re-ordering (section 4) → new sections as scaffolds with \[PLACEHOLDER\] content → EasyWay reorganization → visual treatment (section 5) → polish (accessibility, performance).
3. **After each step:** build, lint and type-check; test at the four breakpoints in both themes; confirm the blur is visually and technically unchanged.
4. **Final report:** files changed, code removed, new components, the list of \[PLACEHOLDER\] items the owner must fill, and recommended follow-ups.

## 10. Acceptance checklist

- [ ] Blur identical to before (same layers, intensity and reveal behavior)
- [ ] Quiz and everything in section 3 removed, with no dead code
- [ ] EasyWay still present in the nav and on the page, reorganized, with one status chip
- [ ] Section order matches section 4
- [ ] Every existing mockup and template is still present
- [ ] One primary CTA label, one tab style, one logo treatment
- [ ] No invented data; every placeholder is marked
- [ ] AA contrast in dark and light; keyboard navigation works
- [ ] Lighthouse mobile performance is not worse than before
- [ ] No horizontal scroll at 390px

## Appendix: alternative palettes (swap tokens only)

- **B, Indigo corporate:** bg #070614; surface #12102B; indigo #4F46E5 (fills only); violet #8B5CF6; light indigo #A5B4FC (text on dark); lime #C8F04A.
- **C, Violet + cyan signal:** Palette A plus cyan #4DE3FF used only for NFC waves, links and informational states.
- **D, Plum + coral (warm, drops lime):** bg #0B0510; surface #1A0D24; plum #8E2DE2; magenta #D946EF; coral #FF7A59 as the action color with #1A0D24 text.

Palette A is the recommended default.
