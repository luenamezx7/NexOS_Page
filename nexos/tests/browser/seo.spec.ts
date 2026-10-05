import { expect, test } from '@playwright/test';

const servicePaths = ['/criacao-de-sites', '/landing-pages', '/cardapio-digital', '/placa-nfc'];
const publicPaths = ['/', ...servicePaths, '/privacidade', '/termos', '/lgpd', '/reembolso', '/cookies'];

test('home entrega serviços e links no HTML, antes de qualquer interação', async ({ request }) => {
  const response = await request.get('/');
  expect(response.status()).toBe(200);
  const html = await response.text();
  // Verify actual rendered sections, rather than strings inside client hydration scripts.
  expect(html).toContain('id="services"');
  expect(html).toContain('id="showcase"');
  expect(html).toContain('id="contact"');
  for (const path of servicePaths) expect(html).toContain(`href="${path}"`);
  expect(html).not.toContain('google-site-verification-code');
  expect(html).not.toContain('Continuar para o site');
  expect(html).toContain('<title>NexOS Lab | Criação de Sites, Landing Pages e Placas NFC</title>');
  expect(html).not.toMatch(/lovable/i);
  expect(html).toContain('<meta name="application-name" content="NexOS Lab"');
  expect(html).toContain('<meta property="og:site_name" content="NexOS Lab"');
  const entities = [...html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)]
    .flatMap(match => JSON.parse(match[1])['@graph']);
  const websites = entities.filter(item => item['@type'] === 'WebSite');
  expect(websites).toHaveLength(1);
  expect(websites[0].name).toBe('NexOS Lab');
  expect(websites[0].alternateName).toEqual(expect.arrayContaining(['NexOS', 'NexOS Performance']));
  expect(websites[0].alternateName).toContain(new URL(websites[0].url).hostname);
  const organization = entities.find(item => item['@type'] === 'Organization');
  expect(organization.alternateName).toEqual(expect.arrayContaining(['NexOS Lab', 'NexOS Performance']));
});

test('home e páginas comerciais são legíveis e navegáveis sem JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  try {
    await page.goto('http://localhost:3100/');
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('h1')).toContainText('Sites para');
    await expect(page.locator('#hero .hero-description')).toContainText('NexOS Lab');
    await expect(page.locator('footer')).toContainText('NexOS Performance');
    await expect(page.getByRole('heading', { name: 'Desenvolvimento NexOS' })).toBeVisible();
    expect(await page.locator('#services').evaluate(el => getComputedStyle(el).opacity)).toBe('1');
    await page.getByRole('link', { name: 'Criação de sites', exact: true }).click();
    await expect(page).toHaveURL(/\/criacao-de-sites$/);
    const question = page.locator('details').first();
    await question.locator('summary').click();
    await expect(question.locator('p')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Conversar sobre o projeto' })).toHaveAttribute('href', /^https:\/\/wa\.me\//);
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
      await expect(page.locator('meta[property="og:site_name"]')).toHaveAttribute('content', 'NexOS Lab');
      await expect(page.locator('meta[name="application-name"]')).toHaveAttribute('content', 'NexOS Lab');
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

test('dados estruturados usam informações e preço do conteúdo visível', async ({ page }) => {
  await page.goto('/placa-nfc');
  const scripts = await page.locator('script[type="application/ld+json"]').allTextContents();
  const entities = scripts.flatMap(text => JSON.parse(text)['@graph']);
  expect(entities.some(item => item['@type'] === 'Organization')).toBe(true);
  expect(entities.some(item => item['@type'] === 'BreadcrumbList')).toBe(true);
  const product = entities.find(item => item['@type'] === 'Product');
  expect(product.offers.priceCurrency).toBe('BRL');
  await expect(page.getByText(Number(product.offers.price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), { exact: false }).first()).toBeVisible();
  expect(product.aggregateRating).toBeUndefined();
});

test('mobile abre no conteúdo e páginas comerciais não geram overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.locator('h1')).toContainText('Sites para');
  await expect(page.getByRole('button', { name: 'Continuar para o site' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Abrir menu' }).click();
  await expect(page.getByRole('navigation', { name: 'Navegação móvel' })).toBeVisible();
  await page.getByRole('button', { name: 'Fechar menu' }).click();
  for (const path of servicePaths) {
    await page.goto(path);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.getByRole('link', { name: /Conversar sobre/ })).toBeVisible();
  }
});

test('apresentação é opcional e pode ser fechada com Escape', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Ver apresentação', exact: true }).click();
  await expect(page.getByRole('dialog', { name: /Apresentação NexOS/ })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Continuar para o site' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: /Apresentação NexOS/ })).toHaveCount(0);
  await expect(page.locator('#hero')).toBeFocused();
});

test('atalho de teclado para o conteúdo só aparece quando recebe foco', async ({ page }) => {
  await page.goto('/');
  const skipLink = page.getByRole('link', { name: 'Pular para o conteúdo' });
  expect(await skipLink.evaluate(el => el.getBoundingClientRect().bottom)).toBeLessThan(0);
  await page.keyboard.press('Tab');
  await expect(skipLink).toBeFocused();
  expect(await skipLink.evaluate(el => el.getBoundingClientRect().top)).toBeGreaterThanOrEqual(0);
  await page.keyboard.press('Enter');
  await expect(page.locator('#main-content')).toBeFocused();
});
