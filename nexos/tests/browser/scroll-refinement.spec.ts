import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('nexos-cookie-consent-v1', JSON.stringify({ necessary: true, functional: false, analytics: false, marketing: false, updatedAt: new Date().toISOString() }));
  });
});

test('scroll entries settle into focus once and release their animated styles', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  const title = page.locator('#metrics-title');
  await expect(title).toHaveAttribute('data-reveal-state', 'pending');
  await title.scrollIntoViewIfNeeded();
  await expect(title).toHaveAttribute('data-reveal-state', 'visible');
  await expect(title).toHaveCSS('opacity', '1');
  await expect(title).toHaveCSS('filter', 'none');
  await expect(title).toHaveCSS('transform', 'none');
  await page.locator('#hero').scrollIntoViewIfNeeded();
  await expect(title).toHaveAttribute('data-reveal-state', 'visible');
  await title.scrollIntoViewIfNeeded();
  await expect(title).toHaveAttribute('data-reveal-state', 'visible');
  expect(errors).toEqual([]);
});

test('keyboard focus immediately reveals an offscreen interactive group', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  const group = page.locator('#cta-final [data-reveal]').last();
  await expect(group).toHaveAttribute('data-reveal-state', 'pending');
  await group.locator('a').first().evaluate((element: HTMLAnchorElement) => element.focus({ preventScroll: true }));
  await expect(group).toHaveAttribute('data-reveal-state', 'visible');
  await expect(group).toHaveCSS('opacity', '1');
});

test('reduced motion exposes every entry and removes decorative parallax', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('[data-reveal-state="pending"], [data-reveal-state="entering"]')).toHaveCount(0);
  await expect(page.locator('[data-scroll-float]').first()).toHaveCSS('transform', 'none');
  await page.locator('#showcase').getByRole('button', { name: 'Aumentar quantidade' }).click();
  await expect(page.getByRole('status', { name: 'Quantidade selecionada' })).toHaveText('2');
});

test('server content remains readable without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('http://localhost:3100/');
  for (const selector of ['#hero-title', '#metrics-title', '#showcase-title', '#faq-title', '#cta-title']) {
    const title = page.locator(selector);
    await expect(title).toBeVisible();
    await expect(title).toHaveCSS('opacity', '1');
    await expect(title).toHaveCSS('filter', 'none');
  }
  await context.close();
});

for (const theme of ['light', 'dark']) {
  for (const width of [390, 1366]) {
    test(`${theme} / ${width}px: rounded section panels and internal surfaces`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.addInitScript(theme => localStorage.setItem('nexos-theme', theme), theme);
      await page.goto('/');
      await expect(page.locator('header [class*="wordmark"]')).toHaveText('nexos');
      if (theme === 'light') await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(238, 229, 216)');
      await expect(page.locator('[data-section-panel]')).toHaveCount(2);
      await expect(page.locator('[data-section-panel] #showcase')).toHaveCount(1);
      await expect(page.locator('[data-section-panel] #services')).toHaveCount(1);
      await expect(page.locator('#hero .hero-overhead-light')).toHaveCSS('background-image', /radial-gradient/);
      const firstPanel = page.locator('[data-section-panel]').first();
      expect(await firstPanel.evaluate(el => parseFloat(getComputedStyle(el).borderTopLeftRadius))).toBeGreaterThanOrEqual(28);
      const box = await firstPanel.boundingBox();
      expect(box!.x).toBeCloseTo(0, 0);
      expect(box!.width).toBeCloseTo(width, 0);
      await page.screenshot({ path: testInfo.outputPath(`hero-${theme}-${width}.png`) });
      for (const id of ['fisico-digital', 'metrics', 'showcase', 'services', 'testimonials', 'faq', 'cta-final']) {
        await page.locator(`#${id}`).scrollIntoViewIfNeeded();
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), id).toBe(true);
        if (['fisico-digital', 'services', 'cta-final'].includes(id)) {
          await page.locator(`#${id}`).evaluate(element => scrollTo({ top: scrollY + element.getBoundingClientRect().top - 104, behavior: 'instant' }));
          await page.screenshot({ path: testInfo.outputPath(`${id}-${theme}-${width}.png`) });
        }
      }
      const instagram = page.getByRole('region', { name: 'Visite nosso Instagram.' });
      await expect(instagram.getByRole('link', { name: 'Visitar Instagram' })).toHaveAttribute('href', /^https:\/\/www.instagram.com\/_nexoslab/);
      await expect(instagram.getByRole('link', { name: 'Visitar Instagram' })).toHaveAttribute('target', '_blank');
      await instagram.scrollIntoViewIfNeeded();
      await page.screenshot({ path: testInfo.outputPath(`instagram-${theme}-${width}.png`) });
      await expect(page.locator('#brand-closing h2')).toHaveText('NEXOS');
      await page.locator('#brand-closing').scrollIntoViewIfNeeded();
      await page.evaluate(() => document.fonts.ready);
      const wordmark = await page.locator('#brand-closing h2').boundingBox();
      expect(wordmark!.x).toBeGreaterThanOrEqual(0);
      expect(wordmark!.x + wordmark!.width).toBeLessThanOrEqual(width);
      await page.screenshot({ path: testInfo.outputPath(`closing-${theme}-${width}.png`) });
      await expect(page.getByRole('link', { name: 'Minha conta', exact: true }).locator('[data-profile-orb]')).toBeVisible();
      await page.goto('/criacao-de-sites');
      await expect(page.locator('h1')).toBeVisible();
      await page.screenshot({ path: testInfo.outputPath(`service-${theme}-${width}.png`) });
      await page.goto('/portal/acesso');
      await expect(page.locator('#login-title')).toBeVisible();
      await page.screenshot({ path: testInfo.outputPath(`login-${theme}-${width}.png`) });
    });
  }
}
