import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('nexos-cookie-consent-v1', JSON.stringify({ necessary: true, functional: false, analytics: false, marketing: false, updatedAt: new Date().toISOString() })));
});

test('glass cards stack while the stage is pinned, then normal scrolling resumes', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/#ecossistema');
  await expect(page.locator('dialog[data-presentation]')).toHaveCount(0, { timeout: 15000 });
  const stage = page.locator('[data-ecosystem-stage]');
  await expect(stage).toHaveAttribute('data-scroll-cards', 'true');
  const geometry = await stage.evaluate(el => {
    const spacer = el.parentElement!;
    const start = spacer.getBoundingClientRect().top + scrollY - 110;
    return { start, end: start + parseFloat(getComputedStyle(spacer).paddingBottom) };
  });
  await page.evaluate(y => window.scrollTo({ top: y, behavior: 'instant' }), geometry.start + 20);
  await expect.poll(() => stage.evaluate(el => Math.round(el.getBoundingClientRect().top))).toBe(110);
  await expect(page.locator('[data-glass-card]')).toHaveCount(7);
  await page.evaluate(y => window.scrollTo({ top: y, behavior: 'instant' }), (geometry.start + geometry.end) / 2);
  await expect.poll(() => page.locator('[data-glass-card]').first().evaluate(el => new DOMMatrixReadOnly(getComputedStyle(el).transform).a)).toBeLessThan(.95);
  await expect(page.locator('[data-glass-card][data-active="true"]')).toHaveCount(1);
  await expect.poll(() => stage.evaluate(el => Math.round(el.getBoundingClientRect().top))).toBe(110);
  await expect(page.locator('[data-ecosystem-track] article')).toHaveCount(7);
  await expect(page.locator('#ecossistema [data-solution="site"]')).toHaveCSS('background-color', 'rgb(255, 120, 187)');
  await expect(page.locator('#ecossistema [data-solution="menu"]')).toHaveCSS('background-color', 'rgb(185, 239, 117)');
  await expect(page.locator('#ecossistema [data-solution="nfc"]')).toHaveCSS('background-color', 'rgb(0, 0, 0)');
  await page.evaluate(y => window.scrollTo({ top: y, behavior: 'instant' }), geometry.end - 1);
  await expect.poll(() => page.locator('#ecossistema [data-solution="suporte"]').evaluate(el => {
    const card = el.getBoundingClientRect();
    const frame = el.closest('[data-ecosystem-viewport]')!.getBoundingClientRect();
    return card.top >= frame.top - 3 && card.bottom <= frame.bottom + 3;
  })).toBe(true);
  await page.evaluate(y => window.scrollTo({ top: y, behavior: 'instant' }), geometry.end + 180);
  await expect.poll(() => stage.evaluate(el => el.getBoundingClientRect().top)).toBeLessThan(0);
  expect(await page.locator('[data-avatar-scene]').evaluate(el => !!el.closest('.pin-spacer'))).toBe(false);
  await expect(page.locator('#gestao img[src*="mackbook"]')).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('keyboard reveals cards and native motion preferences switch between the stack and readable flow', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await expect(page.locator('dialog[data-presentation]')).toHaveCount(0, { timeout: 15000 });
  await page.locator('#hero .hero-secondary-action').click();
  await expect(page.locator('#ecossistema')).toBeFocused();
  const stage = page.locator('[data-ecosystem-stage]');
  await expect(stage).toHaveAttribute('data-scroll-cards', 'true');
  await page.locator('#ecossistema [data-solution="nfc"]').focus();
  await expect.poll(() => page.locator('#ecossistema [data-solution="nfc"]').evaluate(el => {
    const rect = el.getBoundingClientRect();
    const viewport = el.closest('[data-ecosystem-viewport]')!.getBoundingClientRect();
    return rect.top >= viewport.top - 2 && rect.bottom <= viewport.bottom + 2;
  })).toBe(true);
  await expect(page.locator('#ecossistema [data-solution="nfc"]')).toBeFocused();
  await expect(page.locator('#ecossistema details, #ecossistema summary')).toHaveCount(0);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(stage).not.toHaveAttribute('data-scroll-cards');
  await expect(page.locator('[data-ecosystem-viewport]')).toHaveAttribute('data-stack-reduced', 'true');
  expect(await stage.evaluate(el => !!el.closest('.pin-spacer'))).toBe(false);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect(stage).toHaveAttribute('data-scroll-cards', 'true');
  await expect(page.locator('.pin-spacer:has(> [data-ecosystem-stage])')).toHaveCount(1);
  await expect(page.locator('.pin-spacer:has(> [data-management-stage])')).toHaveCount(0);
});

test('cards start at the first chapter after a responsive composition resize', async ({ page }) => {
  await page.setViewportSize({ width: 500, height: 900 });
  await page.goto('/#ecossistema');
  const stage = page.locator('[data-ecosystem-stage]');
  await expect(page.locator('dialog[data-presentation]')).toHaveCount(0, { timeout: 20000 });
  await expect(stage).toHaveAttribute('data-scroll-cards', 'true', { timeout: 20000 });
  await expect(page.locator('html')).toHaveAttribute('data-scroll-engine', 'smooth');

  // The card changes from a vertical composition to two columns at desktop.
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(stage).toHaveAttribute('data-scroll-cards', 'true');
  const start = await stage.evaluate(el => el.parentElement!.getBoundingClientRect().top + scrollY - 110);
  await page.evaluate(y => window.scrollTo({ top: y + 2, behavior: 'instant' }), start);
  await expect.poll(() => stage.evaluate(el => Math.round(el.getBoundingClientRect().top))).toBe(110);
  await expect(page.locator('#ecossistema [data-solution="site"]')).toHaveAttribute('data-active', 'true');
  await expect.poll(() => page.locator('[data-management-stage]').evaluate(el => el.getBoundingClientRect().bottom)).toBeLessThan(110);

  await page.evaluate(y => window.scrollTo({ top: y + 1600, behavior: 'instant' }), start);
  await expect(page.locator('#ecossistema [data-solution="site"]')).toHaveAttribute('data-active', 'false');
  await page.evaluate(y => window.scrollTo({ top: y + 2, behavior: 'instant' }), start);
  await expect(page.locator('#ecossistema [data-solution="site"]')).toHaveAttribute('data-active', 'true');
});

test.describe('animated cards on touch devices and short screens', () => {
  test.use({ hasTouch: true });
  for (const viewport of [{ width: 320, height: 568 }, { width: 390, height: 844 }, { width: 768, height: 1024 }, { width: 844, height: 390 }, { width: 568, height: 320 }, { width: 1440, height: 700 }]) {
    test(`pin, move and release at ${viewport.width} × ${viewport.height}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto('/');
      await expect(page.locator('dialog[data-presentation]')).toHaveCount(0, { timeout: 15000 });
      await page.locator('#hero .hero-secondary-action').click();
      await expect(page.locator('#ecossistema')).toBeFocused();
      const stage = page.locator('[data-ecosystem-stage]');
      await expect(stage).toHaveAttribute('data-scroll-cards', 'true');
      const geometry = await stage.evaluate(el => {
        const clearance = Math.min(110, Math.max(80, Math.round(innerHeight * .25)));
        const start = el.parentElement!.getBoundingClientRect().top + scrollY - clearance;
        return { start, end: start + parseFloat(getComputedStyle(el.parentElement!).paddingBottom), clearance };
      });
      await page.evaluate(y => window.scrollTo({ top: y, behavior: 'instant' }), geometry.start + 10);
      await expect.poll(() => stage.evaluate(el => Math.round(el.getBoundingClientRect().top))).toBe(geometry.clearance);
      expect(await stage.evaluate(el => el.getBoundingClientRect().bottom <= innerHeight)).toBe(true);
      if (viewport.height > viewport.width) {
        expect(await stage.locator('article').first().evaluate(el => {
          const rect = el.getBoundingClientRect();
          return rect.width >= Math.min(innerWidth - 32, 640) - 2 && rect.height >= innerHeight * .4;
        })).toBe(true);
      }
      await expect(page.locator('[data-glass-card]')).toHaveCount(7);
      const firstLeft = await page.locator('[data-glass-card]').first().evaluate(el => el.getBoundingClientRect().left);
      await page.evaluate(y => window.scrollTo({ top: y, behavior: 'instant' }), (geometry.start + geometry.end) / 2);
      await expect.poll(() => page.locator('[data-glass-card]').first().evaluate(el => new DOMMatrixReadOnly(getComputedStyle(el).transform).a)).toBeLessThan(.95);
      expect(await page.locator('[data-glass-card]').first().evaluate(el => el.getBoundingClientRect().left)).toBeGreaterThanOrEqual(firstLeft);
      await expect(page.locator('[data-glass-card][data-active="true"]')).toHaveCount(1);
      await expect.poll(() => stage.evaluate(el => Math.round(el.getBoundingClientRect().top))).toBe(geometry.clearance);
      await page.locator('#ecossistema [data-solution="nfc"]').focus();
      await expect(page.locator('#ecossistema [data-solution="nfc"]')).toBeFocused();
      await expect(page.locator('#ecossistema details, #ecossistema summary')).toHaveCount(0);
      await page.evaluate(y => window.scrollTo({ top: y, behavior: 'instant' }), geometry.end + 180);
      await expect.poll(() => stage.evaluate(el => el.getBoundingClientRect().top)).toBeLessThan(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    });
  }
});

test('the full catalogue stays readable without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/#ecossistema');
  await expect(page.locator('[data-ecosystem-track] article')).toHaveCount(7);
  await expect(page.locator('#ecossistema [data-solution="suporte"]')).toBeVisible();
  await expect(page.locator('[data-ecosystem-track]')).toHaveCSS('transform', 'none');
  await context.close();
});
