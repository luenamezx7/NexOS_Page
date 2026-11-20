import { expect, test } from '@playwright/test';
import { enterPresentation } from './helpers/presentation';

for (const width of [390, 1366]) {
  test(`Mini-Sites after the MacBook at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    await page.addInitScript(() => localStorage.setItem('nexos-cookie-consent-v1', JSON.stringify({ necessary: true, functional: false, analytics: false, marketing: false, updatedAt: new Date().toISOString() })));
    await page.goto('/');
    await enterPresentation(page);
    const section = page.getByRole('region', { name: 'Mini-Sites', exact: true });
    const stage = section.locator('[data-mini-site-mockups]');
    const preview = section.getByRole('group', { name: 'Exemplo ilustrativo de Mini-Site', exact: true });
    await expect(stage).toHaveAttribute('data-fan-ready', 'true');
    await expect(stage.locator('[data-iphone15pro]')).toHaveCount(3);
    await expect(stage.locator('img[src="/mockups/iphone-15-pro.svg"]')).toHaveCount(3);
    expect(await stage.locator('[data-mini-site-side="left"]').evaluate(el => new DOMMatrixReadOnly(getComputedStyle(el).transform).e)).toBeCloseTo(0, 1);
    await section.scrollIntoViewIfNeeded();
    await expect(section).toHaveCSS('background-color', 'rgb(248, 248, 250)');
    expect(await section.evaluate(el => Boolean(document.getElementById('services')!.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING))).toBe(true);
    await expect(preview.getByText('Conheça nosso catálogo', { exact: true })).toBeVisible();
    await section.getByRole('button', { name: 'Catálogo', exact: true }).click();
    await expect(section.getByRole('button', { name: 'Catálogo', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await expect(preview.getByText('Seu produto', { exact: true })).toBeVisible();
    await section.getByRole('button', { name: 'Links', exact: true }).click();
    await expect(preview.getByText('Converse no WhatsApp', { exact: true })).toBeVisible();
    await stage.evaluate(el => scrollTo({ top: scrollY + el.getBoundingClientRect().top - innerHeight * .3, behavior: 'instant' }));
    const left = stage.locator('[data-mini-site-side="left"]');
    const right = stage.locator('[data-mini-site-side="right"]');
    await expect.poll(() => left.evaluate(el => new DOMMatrixReadOnly(getComputedStyle(el).transform).e)).toBeLessThan(-30);
    await expect.poll(() => right.evaluate(el => new DOMMatrixReadOnly(getComputedStyle(el).transform).e)).toBeGreaterThan(30);
    const motion = await left.evaluate(el => ({ offset: Math.abs(new DOMMatrixReadOnly(getComputedStyle(el).transform).e), width: parseFloat(getComputedStyle(el).width) }));
    expect(motion.offset).toBeLessThan(motion.width * .5);
    await expect.poll(() => left.evaluate(el => Math.abs(new DOMMatrixReadOnly(getComputedStyle(el).transform).e))).toBeCloseTo(motion.width * (width < 768 ? .34 : .4), 0);
    const url = new URL(await section.getByRole('link', { name: 'Quero meu Mini-Site' }).getAttribute('href') as string);
    expect(url.hostname).toBe('wa.me');
    expect(url.searchParams.get('text')).toContain('Mini-Site');
    if (width < 768) {
      const actionBox = await section.getByRole('link', { name: 'Quero meu Mini-Site' }).boundingBox();
      const mockupBox = await stage.boundingBox();
      expect(actionBox!.y).toBeGreaterThan(mockupBox!.y + mockupBox!.height);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath(`mini-sites-${width}.png`) });
    await stage.screenshot({ path: testInfo.outputPath(`mini-sites-phones-${width}.png`) });
  });
}
