import test from 'node:test';
import assert from 'node:assert/strict';
import { chromium, expect } from '@playwright/test';

const SITE = 'https://nexoslab.online';

test('LAB 7 production: published palette, centered hero, guest account, mobile menu and marquee', { timeout: 90000 }, async () => {
  const browser = await chromium.launch();
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(() => {
      localStorage.setItem('nexos-cookie-consent-v1', JSON.stringify({ necessary: true, functional: false, analytics: false, marketing: false, updatedAt: new Date().toISOString() }));
      window.__lab7Vitals = { lcp: null, cls: 0 };
      new PerformanceObserver(list => { window.__lab7Vitals.lcp = list.getEntries().at(-1)?.startTime ?? null; }).observe({ type: 'largest-contentful-paint', buffered: true });
      new PerformanceObserver(list => { for (const entry of list.getEntries()) if (!entry.hadRecentInput) window.__lab7Vitals.cls += entry.value; }).observe({ type: 'layout-shift', buffered: true });
    });
    const response = await page.goto(SITE);
    assert.equal(response.status(), 200);
    await expect(page.locator('[data-presentation]')).toHaveCount(0, { timeout: 20000 });
    await expect(page.locator('#hero-title')).toHaveAccessibleName('Soluções com IA que impulsionam seu negócio');
    await expect(page.locator('#hero-title [data-reveal-word="Soluções"] [data-blur-letter]').first()).toHaveCSS('background-image', /linear-gradient/);
    await expect(page.locator('#hero-title [data-reveal-word="IA"] [data-blur-letter]').first()).toHaveCSS('background-image', /linear-gradient/);
    await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(0, 0, 0)');
    await expect(page.getByRole('banner').getByRole('link', { name: 'Minha conta', exact: true })).toHaveAttribute('href', '/portal/acesso');
    await expect(page.locator('[data-home-experience]')).toHaveCount(9);
    await expect(page.locator('[data-marquee-track]')).toHaveCSS('animation-duration', '32s');
    await expect(page.getByRole('link', { name: 'Explorar soluções', exact: true }).first()).toHaveCSS('background-color', 'rgb(216, 239, 112)');
    await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
    await expect(page.getByRole('banner')).toHaveAttribute('data-scrolled', 'false');
    const vitals = await page.evaluate(() => ({ ...window.__lab7Vitals, ttfb: performance.getEntriesByType('navigation')[0]?.responseStart, transferredKB: Math.round(performance.getEntriesByType('resource').reduce((sum, item) => sum + item.transferSize, 0) / 1024) }));
    console.log('Production browser sample (single local Chromium run, not field CWV):', JSON.stringify(vitals));
    for (const width of [375, 430, 768, 1024, 1440, 1920]) {
      await page.setViewportSize({ width, height: width < 768 ? 844 : 900 });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
      const box = await page.locator('#hero-title').boundingBox();
      assert.ok(Math.abs(box.x + box.width / 2 - width / 2) < 2);
    }
    await page.setViewportSize({ width: 375, height: 844 });
    await page.screenshot({ path: 'test-results/lab7-production-mobile.png' });
    await page.getByRole('button', { name: 'Abrir menu' }).click();
    const menu = page.getByRole('dialog', { name: 'Explore a NexOS' });
    await expect(menu.getByRole('link', { name: 'Minha conta', exact: true })).toBeVisible();
    await menu.getByRole('link', { name: 'EasyWay', exact: true }).click();
    await expect(menu).not.toBeVisible();
    await expect(page).toHaveURL(/#easyway$/);
    await expect(page.locator('#easyway')).toContainText('Nome provisório. Interface conceitual.');
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.getByRole('link', { name: 'NexOS, início' }).click();
    await expect.poll(() => page.evaluate(() => scrollY)).toBeLessThan(5);
    await page.screenshot({ path: 'test-results/lab7-production-desktop.png' });
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
});
