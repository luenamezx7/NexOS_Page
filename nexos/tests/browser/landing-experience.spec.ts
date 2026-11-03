import { test, expect, type Page } from '@playwright/test';
import { enterPresentation } from './helpers/presentation';

async function openLanding(page: Page, theme: 'light' | 'dark' | 'system' = 'dark', skipIntro = true) {
  await page.addInitScript(({ theme, skipIntro }) => {
    if (skipIntro) sessionStorage.setItem('nexos-boot-seen', '1');
    if (theme !== 'system' && !localStorage.getItem('nexos-theme')) localStorage.setItem('nexos-theme', theme);
    localStorage.setItem('nexos-cookie-consent-v1', JSON.stringify({ necessary: true, functional: false, analytics: false, marketing: false, updatedAt: new Date().toISOString() }));
  }, { theme, skipIntro });
  await page.goto(skipIntro ? '/#hero' : '/');
  if (skipIntro) {
    await expect(page.locator('#hero-title')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Aumentar quantidade' })).toBeEnabled();
  }
}

test('plate has commercial contact without the obsolete quiz', async ({ page }) => {
  await openLanding(page);
  await expect(page.getByRole('complementary', { name: 'Descubra como usar sua placa' })).toHaveCount(0);
  await expect(page.locator('#showcase').getByRole('link', { name: 'Personalizar minha placa' })).toHaveAttribute('href', /^https:\/\/wa.me\//);
});

test('services show all cards without filters and lead to the commercial team', async ({ page }) => {
  await openLanding(page);
  const services = page.locator('#services');
  await expect(services.getByRole('heading', { name: 'Desenvolvimento NexOS' })).toBeVisible();
  await expect(services.getByRole('link', { name: 'Falar com o comercial' })).toHaveAttribute('href', /^https:\/\/wa.me\//);
  await expect(services.getByRole('article')).toHaveCount(3);
  await expect(services.getByRole('radio')).toHaveCount(0);
});

test('Placa NFC and EasyWay use OLED black without changing edge blur', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openLanding(page);
  await enterPresentation(page);
  const backgrounds = await page.evaluate(() => ['nfc', 'easyway', 'applications'].map(experience => {
    const scene = document.querySelector<HTMLElement>(`[data-home-experience="${experience}"]`)!;
    return { color: getComputedStyle(scene).backgroundColor, light: getComputedStyle(scene.firstElementChild!).backgroundImage };
  }));
  expect(backgrounds[0].color).toBe('rgb(0, 0, 0)');
  expect(backgrounds[1].color).toBe('rgb(0, 0, 0)');
  expect(backgrounds[0].color).not.toBe(backgrounds[2].color);
  expect(backgrounds[1].color).not.toBe(backgrounds[2].color);
  expect(backgrounds[0].light).toBe('none');
  expect(backgrounds[1].light).toBe('none');
  await page.locator('#easyway').scrollIntoViewIfNeeded();
  await expect.poll(() => page.locator('#hero').evaluate(hero => hero.getBoundingClientRect().bottom)).toBeLessThan(0);
  for (const className of ['landing-header-blur', 'landing-edge-blur']) {
    const blur = page.locator(`.${className}`);
    await expect(blur).toHaveCSS('position', 'fixed');
    await expect(blur.locator('[data-gradual-blur-layer]')).toHaveCount(8);
  }
  await expect(page.locator('[data-home-experience="nfc"] .gradual-blur, [data-home-experience="easyway"] .gradual-blur')).toHaveCount(0);
});

test('hero purple grain ends early, header glass is always visible and account has the new icon', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openLanding(page);
  await enterPresentation(page);
  const header = page.locator('header[role="banner"]');
  await expect(header).toHaveAttribute('data-scrolled', 'false');
  await expect(header).toHaveCSS('background-color', /rgba?\(/);
  expect(await header.evaluate(element => getComputedStyle(element).backgroundColor)).not.toBe('rgba(0, 0, 0, 0)');
  if (await page.evaluate(() => matchMedia('(prefers-reduced-transparency: reduce)').matches)) {
    await expect(header).toHaveCSS('backdrop-filter', 'none');
  } else {
    await expect(header).toHaveCSS('backdrop-filter', /blur\(16px\)/);
  }
  const grain = page.locator('#hero .hero-gradient-blend');
  expect((await grain.boundingBox())!.height).toBeLessThan(844 * .6);
  await expect(grain).toHaveCSS('mask-image', /rgba\(0, 0, 0, 0\) 100%/);
  const account = header.getByRole('link', { name: 'Minha conta' });
  await expect(account.locator('[data-profile-orb] svg')).toHaveClass(/lucide-id-card/);
  await expect(account).toHaveAttribute('href', '/portal/acesso');
});

test('mascot carousel is compact with a short summary below each image', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openLanding(page);
  await enterPresentation(page);
  const section = page.locator('#mascot-solutions');
  await section.scrollIntoViewIfNeeded();
  const height = await section.evaluate(element => element.getBoundingClientRect().height);
  expect(height).toBeLessThan(420);
  await expect(section.getByRole('region', { name: 'Suportes e soluções NexOS' })).toHaveAttribute('aria-roledescription', 'carousel');
  await expect(section.locator('ul li')).toHaveCount(4);
  await expect(section.locator('figure img')).toHaveCount(4);
  await expect(section.locator('figcaption')).toHaveCount(4);
  await expect(section.locator('figcaption').first()).toContainText('Placa NFC');
  await expect(section.getByRole('link')).toHaveCount(0);
});

test('mobile hero prioritizes the title and two actions beside the NexOS Lab lockup', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openLanding(page);
  await enterPresentation(page);
  await page.evaluate(() => document.fonts.ready);
  const brand = page.locator('header[role="banner"] a[aria-label="NexOS, início"]');
  await expect(brand).toContainText('nexoslab');
  await expect(brand).not.toContainText('®');
  const logoFont = await brand.locator('[data-wordmark="nexos"]').evaluate(element => getComputedStyle(element).fontFamily);
  expect(logoFont).toContain('unbounded');
  for (const selector of ['.hero-eyebrow', '.hero-description']) {
    await expect(page.locator(`#hero ${selector}`)).toBeHidden();
  }
  await expect(page.locator('#hero-title')).toBeVisible();
  await expect(page.locator('#hero').getByRole('link', { name: 'Agendar conversa' })).toBeVisible();
  await expect(page.locator('#hero').getByRole('link', { name: 'Conhecer a Placa NFC' })).toBeVisible();
  await expect(page.locator('#hero').getByRole('link', { name: /Conheça o EasyWay/ })).toBeVisible();
  await expect(page.locator('#hero-title [data-reveal-word="IA"]')).toHaveCSS('background-image', /linear-gradient/);
  for (const width of [320, 360, 390]) {
    await page.setViewportSize({ width, height: 844 });
    const brandBounds = await brand.boundingBox();
    const mascotBounds = await brand.getByRole('img', { name: 'Logo do mascote Nexbot da NexOS' }).boundingBox();
    const headerBounds = await page.locator('header[role="banner"]').boundingBox();
    const menuBounds = await page.getByRole('button', { name: 'Abrir menu' }).boundingBox();
    const wordBounds = await brand.locator('[data-wordmark="nexos"]').boundingBox();
    const labBounds = await brand.locator('[data-brand-lab]').boundingBox();
    expect(Math.abs(wordBounds!.y + wordBounds!.height - labBounds!.y - labBounds!.height)).toBeLessThan(2);
    expect(mascotBounds!.width).toBeGreaterThanOrEqual(width < 360 ? 38 : 44);
    expect(headerBounds!.height).toBeGreaterThanOrEqual(90);
    expect(brandBounds!.x + brandBounds!.width).toBeLessThan(menuBounds!.x);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
});

test('new section order and contact form work without publishing unverified claims', async ({ page }) => {
  await page.route('**/api/security/config', route => route.fulfill({ json: { required: false, configured: false, siteKey: '' } }));
  await page.route('**/api/contact', route => route.fulfill({ json: { ok: true } }));
  await openLanding(page);
  const order = await page.evaluate(() => ['hero', 'proof', 'fisico-digital', 'services', 'showcase', 'delivery-process', 'mascot-solutions', 'plans', 'easyway', 'testimonials', 'faq', 'contact', 'cta-final'].map(id => document.getElementById(id)?.getBoundingClientRect().top ?? -1));
  expect(order.every((top, index) => index === 0 || top > order[index - 1])).toBe(true);
  await expect(page.locator('#proof')).toContainText('Clientes fundadores');
  await expect(page.locator('#proof li')).toHaveCount(0);
  await expect(page.locator('#plans article')).toHaveCount(0);
  await expect(page.locator('#plans')).toContainText('Start, Pro e Sob medida estão em definição');
  await expect(page.locator('#plans').getByRole('link', { name: 'Agendar conversa' })).toHaveAttribute('href', '#contact');
  await expect(page.locator('#plans')).not.toContainText('A partir de');
  await expect(page.locator('#mascot-solutions article, #mascot-solutions blockquote')).toHaveCount(0);
  await expect(page.locator('#testimonials')).not.toContainText('Quem está por trás da NexOS');
  await expect(page.locator('footer')).not.toContainText('LinkedIn');
  await expect(page.locator('main')).not.toContainText('[PLACEHOLDER]');
  await page.locator('#hero').getByRole('link', { name: 'Agendar conversa' }).click();
  await expect(page.locator('#contact')).toBeInViewport();
  const form = page.locator('#contact form');
  await form.getByLabel('Nome').fill('Teste Contato');
  await form.getByLabel('E-mail').fill('teste@example.com');
  await form.getByLabel('Empresa').fill('Empresa Teste');
  await form.getByLabel('Segmento').fill('Varejo');
  await form.getByLabel('O que você precisa?').fill('Gostaria de conversar sobre um site.');
  await form.getByRole('button', { name: 'Agendar conversa' }).click();
  await expect(page.locator('#contact').getByRole('status')).toContainText('Mensagem enviada');
});

for (const theme of ['dark'] as const) {
  test(`${theme} mobile: hero CTAs fit and page has no horizontal overflow`, async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    await openLanding(page, theme);
    const cta = page.locator('#hero').getByRole('link', { name: 'Agendar conversa', exact: true });
    const box = await cta.boundingBox();
    expect(box!.y + box!.height).toBeLessThan(740);
    await expect(page.getByRole('button', { name: /Ativar modo (claro|escuro)/ })).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await expect(page.locator('#services').getByRole('article')).toHaveCount(3);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
  test(`${theme} responsive: sections and form stay inside 390, 768, 1280 and 1920px`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openLanding(page, theme);
    for (const width of [390, 768, 1280, 1920]) {
      await page.setViewportSize({ width, height: 900 });
      for (const id of ['proof', 'plans', 'easyway', 'contact', 'cta-final']) {
        const section = page.locator(`#${id}`);
        await section.scrollIntoViewIfNeeded();
        const bounds = await section.boundingBox();
        expect(bounds!.x).toBeGreaterThanOrEqual(-1);
        expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width + 1);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      }
    }
  });
}

test('saved light preference and system preference cannot override the single dark theme', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' });
  await openLanding(page, 'light', false);
  await expect(page.locator('#hero-title')).toBeVisible();
  await enterPresentation(page);
  await expect(page.locator('html')).toHaveClass(/dark/);
  await expect(page.getByRole('button', { name: /Ativar modo (claro|escuro)/ })).toHaveCount(0);
  await page.reload();
  await enterPresentation(page);
  await expect(page.locator('#hero-title')).toBeVisible();
  await expect(page.locator('html')).toHaveClass(/dark/);
});
