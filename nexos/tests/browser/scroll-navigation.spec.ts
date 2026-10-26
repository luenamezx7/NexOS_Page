import { expect, test, type Page } from '@playwright/test';
import { enterPresentation, openPresentation } from './helpers/presentation';

async function aligned(page: Page, id: string) {
  await expect.poll(() => page.locator(`#${id}`).evaluate(element => {
    const header = document.querySelector<HTMLElement>('header[role="banner"]');
    const clearance = Math.max(parseFloat(getComputedStyle(element).scrollMarginTop) || 0, header ? header.getBoundingClientRect().bottom + 16 : 0);
    return Math.abs(element.getBoundingClientRect().top - clearance);
  }), { timeout: 10000 }).toBeLessThan(3);
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('nexos-theme', 'dark');
    localStorage.setItem('nexos-cookie-consent-v1', JSON.stringify({ necessary: true, functional: false, analytics: false, marketing: false, updatedAt: new Date().toISOString() }));
  });
});

for (const width of [390, 1366]) {
  test(`${width}px: manual wheel scrolling crosses the hero boundary without hiding the next section`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/#hero');
    await expect(page.locator('#hero-title')).toBeVisible();
    if (width > 768) await expect(page.locator('html')).toHaveClass(/lenis/);
    for (let pass = 0; pass < 2; pass++) {
      await page.mouse.wheel(0, pass === 0 ? 820 : 600);
      await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(700);
      await expect(page.locator('#fisico-title')).toBeVisible();
      expect(await page.locator('#fisico-digital').evaluate(el => {
        const style = getComputedStyle(el.parentElement!);
        return { opacity: style.opacity, transform: style.transform };
      })).toEqual({ opacity: '1', transform: 'none' });
      await page.mouse.wheel(0, -600);
      await expect.poll(() => page.evaluate(() => scrollY)).toBeLessThan(350);
    }
    await expect(page.locator('html')).not.toHaveClass(/lenis-stopped/);
    await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden');
  });

  test(`${width}px: hero handoff, direct links and history land below the header`, async ({ page }) => {
    test.setTimeout(60000);
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/#hero');
    if (width > 768) await expect(page.locator('html')).toHaveClass(/lenis/);
    await page.locator('#hero .hero-bottom a').click();
    await aligned(page, 'fisico-digital');
    await expect(page).toHaveURL(/#fisico-digital$/);
    await expect(page.locator('#fisico-digital')).toBeFocused();
    if (width < 768) {
      await page.getByRole('button', { name: 'Abrir menu', exact: true }).click();
      await page.getByRole('navigation', { name: 'Navegação móvel', exact: true }).getByRole('link', { name: 'Serviços', exact: true }).click();
    } else await page.getByRole('button', { name: 'Ir para Serviços', exact: true }).click();
    await aligned(page, 'services');
    await expect(page).toHaveURL(/#services$/);
    await page.goBack();
    await aligned(page, 'fisico-digital');
    await page.locator('#fisico-digital a[href="#showcase"]').click();
    await aligned(page, 'showcase');
    await expect(page).toHaveURL(/#showcase$/);
    await page.getByRole('link', { name: 'NexOS, início', exact: true }).click();
    await expect.poll(() => page.evaluate(() => scrollY)).toBeLessThan(2);
  });
}

test('native service anchors and cross-page footer links use the same offsets', async ({ page }) => {
  await page.goto('/criacao-de-sites');
  await page.getByRole('link', { name: 'Como funciona', exact: true }).click();
  await aligned(page, 'como-funciona');
  await page.getByRole('contentinfo').getByRole('link', { name: 'Sobre Nós', exact: true }).click();
  await expect(page).toHaveURL(/\/#testimonials$/);
  await expect(page.getByRole('dialog', { name: 'Apresentação NexOS' })).toHaveCount(0);
  await aligned(page, 'testimonials');
});

test('rapid navigation and wheel interruption do not leave a stale correction running', async ({ page }) => {
  await page.goto('/#hero');
  await expect(page.locator('html')).toHaveClass(/lenis/);
  const nav = page.getByRole('navigation', { name: 'Navegação principal', exact: true });
  await nav.getByRole('link', { name: 'Contato', exact: true }).click();
  await nav.getByRole('link', { name: 'Placa NFC', exact: true }).click();
  await aligned(page, 'showcase');
  await nav.getByRole('link', { name: 'Contato', exact: true }).click();
  await page.mouse.wheel(0, -420);
  await page.waitForTimeout(1500);
  expect(await page.locator('#cta-final').evaluate(el => el.getBoundingClientRect().top)).toBeGreaterThan(400);
});

test('opening presentation releases scroll and the first section remains visible', async ({ page }) => {
  test.setTimeout(60000);
  await page.goto('/');
  await openPresentation(page);
  await enterPresentation(page);
  await expect(page.locator('#hero')).toBeFocused();
  await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden');
  await page.locator('#hero .hero-bottom a').click();
  await aligned(page, 'fisico-digital');
  await expect(page.locator('#fisico-title')).toBeVisible();
  expect(await page.locator('#fisico-digital').evaluate(el => getComputedStyle(el.parentElement!).transform)).toBe('none');
});
