import { expect, test } from '@playwright/test';
import { enterPresentation } from './helpers/presentation';

test.use({ channel: process.env.PLAYWRIGHT_CHANNEL || undefined });

const servicePaths = ['/criacao-de-sites', '/landing-pages', '/cardapio-digital', '/placa-nfc'];
const publicPaths = ['/', ...servicePaths, '/privacidade', '/termos', '/lgpd', '/reembolso', '/cookies'];

test('home entrega serviços e links no HTML, antes de qualquer interação', async ({ request }) => {
  const response = await request.get('/');
  expect(response.status()).toBe(200);
  const html = await response.text();
  // Verify actual rendered sections, rather than strings inside client hydration scripts.
  expect(html).toContain('id="services"');
  expect(html).toContain('id="showcase"');
  expect(html).toContain('id="cta-final"');
  for (const path of servicePaths) expect(html).toContain(`href="${path}"`);
  expect(html).not.toContain('google-site-verification-code');
  expect(html).not.toMatch(/<dialog\b[^>]*class="waves-entry/);
  expect(html).not.toContain('<div inert=');
  expect(html).toContain('<title>ezway | Sites, Landing Pages, Cardápios Digitais e Placas NFC</title>');
  expect(html).not.toMatch(/lovable/i);
  expect(html).toContain('<meta name="application-name" content="ezway"');
  expect(html).toContain('<meta property="og:site_name" content="ezway"');
  const entities = [...html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)]
    .flatMap(match => JSON.parse(match[1])['@graph']);
  const websites = entities.filter(item => item['@type'] === 'WebSite');
  expect(websites).toHaveLength(1);
  expect(websites[0].name).toBe('ezway');
  expect(websites[0].alternateName).toContain('ezway');
  expect(websites[0].alternateName).not.toContain(new URL(websites[0].url).hostname);
  const organization = entities.find(item => item['@type'] === 'Organization');
  expect(organization.name).toBe('ezway');
  expect(organization.alternateName).toContain('ezway');
  expect(new URL(organization.logo).pathname).toBe('/favicon.png');
});

test('home e páginas comerciais são legíveis e navegáveis sem JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  try {
    await page.goto('http://localhost:3100/');
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('.waves-entry')).toBeHidden();
    await expect(page.locator('h1')).toContainText('Soluções com IA');
    await expect(page.locator('#hero h1')).toHaveCSS('opacity', '1');
    await expect(page.locator('#hero .hero-description')).toContainText('NFC e QR Code');
    await expect(page.locator('footer')).toContainText('ezway');
    await expect(page.locator('#faq summary').first()).toContainText('Quanto custa contratar a ezway?');
    await expect(page.locator('#faq details').first().locator('p')).toBeVisible();
    const brandQuestion = page.locator('#faq details').last();
    await expect(brandQuestion.locator('summary')).toContainText('O que a ezway oferece?');
    await brandQuestion.locator('summary').click();
    await expect(brandQuestion.locator('p')).toContainText('desenvolve sites, landing pages e cardápios digitais');
    await expect(page.getByRole('heading', { name: 'Desenvolvimento ezway' })).toBeVisible();
    expect(await page.locator('#services').evaluate(el => getComputedStyle(el).opacity)).toBe('1');
    await page.getByRole('link', { name: 'Criação de sites', exact: true }).click();
    await expect(page).toHaveURL(/\/criacao-de-sites$/);
    const question = page.locator('details').first();
    await question.locator('summary').click();
    await expect(question.locator('p')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Falar com o comercial', exact: true })).toHaveAttribute('href', /^https:\/\/wa\.me\//);
  } finally {
    await context.close();
  }
});

test('páginas públicas têm canônicas próprias e metadados sociais', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  try {
    let siteOrigin = '';
    const titles = new Set<string>();
    for (const path of publicPaths) {
      await page.goto(`http://localhost:3100${path}`);
      const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
      expect(canonical).toBeTruthy();
      const canonicalUrl = new URL(canonical!);
      if (!siteOrigin) siteOrigin = canonicalUrl.origin;
      expect(canonicalUrl.origin).toBe(siteOrigin);
      expect(canonicalUrl.pathname).toBe(path);
      expect(canonicalUrl.search).toBe('');
      await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', canonical!);
      await expect(page.locator('meta[property="og:site_name"]')).toHaveAttribute('content', 'ezway');
      await expect(page.locator('meta[name="application-name"]')).toHaveAttribute('content', 'ezway');
      expect(await page.content()).not.toMatch(/lovable/i);
      await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', `${siteOrigin}/og`);
      titles.add(await page.title());
    }
    expect(titles.size).toBe(publicPaths.length);
  } finally {
    await context.close();
  }
});

test('robots permite renderização e sitemap contém todas as páginas públicas', async ({ request }) => {
  const robots = await request.get('/robots.txt');
  expect(robots.status()).toBe(200);
  const rules = await robots.text();
  expect(rules).not.toMatch(/Disallow:\s*\/_next/);
  expect(rules).toContain('Disallow: /api/');
  expect(rules).toMatch(/User-Agent: Claude-User\s+Allow: \/\s+Disallow: \/api\//);
  expect(rules).toMatch(/User-Agent: Claude-User[\s\S]*?Disallow: \/portal\//);
  const sitemap = await request.get('/sitemap.xml');
  expect(sitemap.status()).toBe(200);
  const xml = await sitemap.text();
  const locations = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => new URL(match[1]));
  expect(locations.map(url => url.pathname).sort()).toEqual([...publicPaths].sort());
  expect(new Set(locations.map(url => url.origin)).size).toBe(1);
  expect(rules).toContain(`Sitemap: ${locations[0].origin}/sitemap.xml`);
});

test('imagem social é um PNG real de 1200 por 630', async ({ request }) => {
  const image = await request.get('/og');
  expect(image.status()).toBe(200);
  expect(image.headers()['content-type']).toContain('image/png');
  const bytes = await image.body();
  expect(bytes.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
  expect(bytes.readUInt32BE(16)).toBe(1200);
  expect(bytes.readUInt32BE(20)).toBe(630);
});

test('favicon de busca usa o mascote em PNG quadrado e é servido aos crawlers sem login', async ({ browser, request }, testInfo) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  try {
    for (const path of ['/', '/criacao-de-sites']) {
      await page.goto(`http://localhost:3100${path}`);
      await expect(page.locator('head link[rel="icon"][type="image/png"]')).toHaveAttribute('href', '/favicon.png?v=3');
      await expect(page.locator('head link[rel="icon"][type="image/png"]')).toHaveAttribute('sizes', '192x192');
      await expect(page.locator('head link[rel="icon"][type="image/svg+xml"]')).toHaveCount(0);
    }
    const icon = await request.get('/favicon.png', { headers: { 'User-Agent': 'Googlebot-Image/1.0' } });
    expect(icon.status()).toBe(200);
    expect(icon.headers()['content-type']).toContain('image/png');
    expect(icon.headers()['x-robots-tag']).toBeUndefined();
    const bytes = await icon.body();
    expect(bytes.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
    expect(bytes.readUInt32BE(16)).toBe(192);
    expect(bytes.readUInt32BE(20)).toBe(192);
    const legacy = await request.get('/favicon.ico', { maxRedirects: 0 });
    expect(legacy.status()).toBe(308);
    expect(legacy.headers().location).toBe('/favicon.png');
    const svg = await request.get('/logo-ghost.svg');
    expect(svg.status()).toBe(200);
    const artwork = await svg.text();
    expect(artwork).toContain('viewBox="240 215 770 770"');
    expect(artwork).toContain('@keyframes blink');
    await page.goto('http://localhost:3100/favicon.png');
    const renderedIcon = page.locator('img');
    await expect(renderedIcon).toBeVisible();
    const colors = await renderedIcon.evaluate((image: HTMLImageElement) => {
      const canvas = document.createElement('canvas');
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const context = canvas.getContext('2d')!;
      context.drawImage(image, 0, 0);
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
       let pink = 0;
       let dark = 0;
      let left = canvas.width;
      let right = 0;
      let top = canvas.height;
      let bottom = 0;
      for (let i = 0; i < pixels.length; i += 4) {
        const x = (i / 4) % canvas.width;
        const y = Math.floor(i / 4 / canvas.width);
         if (pixels[i] > 225 && pixels[i + 1] < 95 && pixels[i + 2] > 105 && pixels[i + 2] < 205) {
           pink++;
          left = Math.min(left, x);
          right = Math.max(right, x);
          top = Math.min(top, y);
          bottom = Math.max(bottom, y);
        }
         if (pixels[i] < 50 && pixels[i + 1] < 35 && pixels[i + 2] < 70) dark++;
      }
       return { pink, dark, left, right, top, bottom };
    });
     expect(colors.pink).toBeGreaterThan(3000);
     expect(colors.dark).toBeGreaterThan(1000);
    expect(colors.left).toBeGreaterThan(5);
    expect(colors.right).toBeLessThan(186);
    expect(colors.top).toBeGreaterThan(5);
    expect(colors.bottom).toBeLessThan(186);
    expect(colors.right - colors.left).toBeGreaterThan(110);
    await renderedIcon.screenshot({ path: testInfo.outputPath('favicon.png') });
  } finally {
    await context.close();
  }
});

test('ghost mark is shared by headers and footer with pink way lettering', async ({ page, request }) => {
  await page.goto('/#hero');
  await page.evaluate(() => document.fonts.ready);
  const animated = page.locator('header[role="banner"] img[src="/logo-ghost.svg"]');
  await expect(animated).toHaveCSS('filter', /invert/);
  await expect(animated).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  const wordmark = page.locator('header[role="banner"] [data-wordmark="ez"]');
  const logo = await animated.boundingBox();
  const text = await wordmark.boundingBox();
  const way = await page.locator('header[role="banner"] [data-brand-way]').boundingBox();
  expect(logo!.width).toBeGreaterThan(35);
  expect(logo!.width).toBeLessThan(text!.width + way!.width);
  expect(Math.abs(logo!.y + logo!.height / 2 - (text!.y + text!.height / 2))).toBeLessThan(8);
  expect(Math.abs(text!.y + text!.height - way!.y - way!.height)).toBeLessThan(2);
  await expect(page.locator('header[role="banner"] [data-brand-registration]')).toHaveCount(0);
  await expect(page.locator('footer img[src="/logo-ghost.svg"]')).toHaveCount(1);
   await expect(page.locator('footer [data-brand-way]')).toHaveCSS('color', 'rgb(255, 22, 141)');
  const animation = await request.get(await animated.getAttribute('src') as string);
  expect(await animation.text()).toContain('@media (prefers-reduced-motion: reduce)');
  await page.goto('/criacao-de-sites');
  await expect(page.locator('[data-page-header] img[src="/logo-ghost.svg"]')).toHaveCount(1);
});

test('dados estruturados descrevem o produto sem publicar oferta ou preço', async ({ page }) => {
  await page.goto('/placa-nfc');
  const scripts = await page.locator('script[type="application/ld+json"]').allTextContents();
  const entities = scripts.flatMap(text => JSON.parse(text)['@graph']);
  expect(entities.some(item => item['@type'] === 'Organization')).toBe(true);
  expect(entities.some(item => item['@type'] === 'BreadcrumbList')).toBe(true);
  const product = entities.find(item => item['@type'] === 'Product');
  expect(product.offers).toBeUndefined();
  expect(product.price).toBeUndefined();
  await expect(page.locator('main')).not.toContainText(/R\$/);
  expect(product.aggregateRating).toBeUndefined();
});

test('mobile abre diretamente no conteúdo e páginas comerciais não geram overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.locator('.waves-entry')).toHaveCount(0);
  await expect(page.locator('h1')).toContainText('Soluções com IA');
  await expect(page.locator('#hero h1')).toHaveCSS('opacity', '1');
  await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden');
  await expect(page.getByRole('button', { name: 'Continuar para o site' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Abrir menu' }).click();
  await expect(page.getByRole('navigation', { name: 'Navegação móvel' })).toBeVisible();
  await page.getByRole('button', { name: 'Fechar menu' }).click();
  for (const path of servicePaths) {
    await page.goto(path);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.getByRole('link', { name: /^(Falar com o comercial|Adquirir Placa)$/ }).first()).toBeVisible();
  }
});

test('apresentação pode ser revista e encerrada por Escape ou pelo botão de pular', async ({ page }) => {
  await page.goto('/');
  await enterPresentation(page);
  const cookies = page.getByRole('dialog', { name: 'Aviso de cookies' });
  await expect(cookies).toBeVisible();
  await cookies.getByRole('button', { name: 'Recusar', exact: true }).click();
  await expect(cookies).toHaveCount(0);
  await page.getByRole('button', { name: 'Ver apresentação', exact: true }).click();
  await expect(page.getByRole('dialog', { name: /Apresentação ezway/ })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: /Apresentação ezway/ })).toHaveCount(0);
  await expect(page.locator('#hero')).toBeFocused();
  await page.getByRole('button', { name: 'Ver apresentação', exact: true }).click();
  await page.getByRole('button', { name: /Pular apresentação/ }).click();
  await expect(page.getByRole('dialog', { name: /Apresentação ezway/ })).toHaveCount(0);
  await expect(page.locator('#hero')).toBeFocused();
});

test('atalho de teclado para o conteúdo só aparece quando recebe foco', async ({ page }) => {
  await page.goto('/');
  await enterPresentation(page);
  await expect(page.locator('.waves-entry')).toHaveCount(0);
  const skipLink = page.getByRole('link', { name: 'Pular para o conteúdo' });
  expect(await skipLink.evaluate(el => el.getBoundingClientRect().bottom)).toBeLessThan(0);
  // The handoff focuses the hero. Return to the document's first keyboard stop.
  await page.evaluate(() => { document.body.tabIndex = -1; document.body.focus(); document.body.removeAttribute('tabindex'); });
  await page.keyboard.press('Tab');
  await expect(skipLink).toBeFocused();
  expect(await skipLink.evaluate(el => el.getBoundingClientRect().top)).toBeGreaterThanOrEqual(0);
  await page.keyboard.press('Enter');
  await expect(page.locator('#main-content')).toBeFocused();
});
