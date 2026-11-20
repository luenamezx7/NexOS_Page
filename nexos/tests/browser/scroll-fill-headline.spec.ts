import { expect, test } from '@playwright/test';
import { enterPresentation } from './helpers/presentation';

for (const width of [390, 1366]) {
  test(`word fill follows scroll and reverses at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(() => localStorage.setItem('nexos-cookie-consent-v1', JSON.stringify({ necessary: true, functional: false, analytics: false, marketing: false, updatedAt: new Date().toISOString() })));
    await page.goto('/');
    await enterPresentation(page);
    const intro = page.getByRole('region', { name: 'Um link na bio. Seu negócio por inteiro.' });
    const words = intro.locator('[data-scroll-fill-word]');
    await expect(words).toHaveCount(8);
    await expect(intro.locator('h2')).not.toHaveAttribute('data-heading-scroll');
    await expect(intro).toHaveCSS('background-color', 'rgb(248, 248, 250)');
    await expect(intro.locator('h2')).toHaveCSS('color', 'rgb(0, 0, 0)');
    await expect(words.first()).toHaveCSS('-webkit-text-fill-color', 'rgb(0, 0, 0)');
    await expect(words.last()).toHaveCSS('-webkit-text-fill-color', 'rgb(0, 0, 0)');
    const place = async (fraction: number, after = false) => intro.evaluate((el, { fraction, after }) => {
      const top = scrollY + el.getBoundingClientRect().top + (after ? el.getBoundingClientRect().height : 0);
      scrollTo({ top: top - innerHeight * fraction, behavior: 'instant' });
    }, { fraction, after });
    await place(.9);
    await expect.poll(() => words.first().evaluate(el => Number(getComputedStyle(el).opacity))).toBeLessThan(.2);
    await place(.5);
    await expect.poll(() => words.first().evaluate(el => Number(getComputedStyle(el).opacity))).toBeGreaterThan(.9);
    const opacities = await words.evaluateAll(nodes => nodes.map(el => Number(getComputedStyle(el).opacity)));
    expect(opacities[0]).toBeGreaterThan(opacities.at(-1)!);
    await place(.4, true);
    await expect.poll(() => words.last().evaluate(el => Number(getComputedStyle(el).opacity))).toBeGreaterThan(.99);
    await place(.9);
    await expect.poll(() => words.first().evaluate(el => Number(getComputedStyle(el).opacity))).toBeLessThan(.2);
    expect(await intro.evaluate(el => {
      const services = document.getElementById('services')!;
      const miniSites = document.getElementById('mini-sites')!;
      return Boolean(services.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING) && Boolean(el.compareDocumentPosition(miniSites) & Node.DOCUMENT_POSITION_FOLLOWING);
    })).toBe(true);
    await expect(page.locator('h2[data-scroll-fill-heading]')).toHaveCount(9);
    for (const id of ['easychat-title', 'services-title', 'mascot-solutions-title', 'real-estate-video-title']) {
      const heading = page.locator(`#${id}`);
      await expect(heading.locator('[data-scroll-fill-word]').first()).toHaveCSS('-webkit-text-fill-color', 'rgb(0, 0, 0)');
      await expect(heading).not.toHaveAttribute('data-heading-scroll');
      await expect(heading.locator('[data-scroll-fill-word]').first()).toBeAttached();
    }
    const easychatName = page.locator('#easychat p').filter({ has: page.locator('[data-scroll-fill]') }).first();
    await expect(easychatName).toHaveText('EasyChat');
    expect(await easychatName.locator('[data-scroll-fill-word]').evaluate(el => parseFloat(getComputedStyle(el).fontSize))).toBeGreaterThan(40);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await place(.35);
    await page.screenshot({ path: testInfo.outputPath(`scroll-fill-${width}.png`) });
    expect(errors).toEqual([]);
  });
}
