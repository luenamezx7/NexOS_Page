import { expect, test } from '@playwright/test';

for (const width of [390, 1440]) {
  test(`management heading fills on scroll with room around its smaller image at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/');
    await expect(page.locator('dialog[data-presentation]')).toHaveCount(0, { timeout: 20000 });
    const title = page.locator('#management-title');
    const firstWord = title.locator('[data-scroll-fill-word]').first();
    const lastWord = title.locator('[data-scroll-fill-word]').last();
    await expect(firstWord).toBeAttached();
    await expect(title).not.toHaveAttribute('data-heading-scroll');
    await title.evaluate(el => window.scrollTo({ top: scrollY + el.getBoundingClientRect().top - innerHeight * .92, behavior: 'instant' }));
    await expect.poll(() => firstWord.evaluate(el => Number(getComputedStyle(el).opacity))).toBeLessThan(.3);
    await title.evaluate(el => window.scrollTo({ top: scrollY + el.getBoundingClientRect().bottom - innerHeight * .4, behavior: 'instant' }));
    await expect.poll(() => lastWord.evaluate(el => Number(getComputedStyle(el).opacity))).toBeGreaterThan(.99);
    const layout = await page.locator('#gestao').evaluate(section => {
      const header = section.querySelector('header')!;
      const figure = section.querySelector('figure')!;
      const screen = section.querySelector('#management-demo')!;
      return {
        topPadding: parseFloat(getComputedStyle(section).paddingTop),
        gap: figure.getBoundingClientRect().top - header.getBoundingClientRect().bottom,
        imageWidth: screen.getBoundingClientRect().width,
        available: section.clientWidth - 48,
        glow: getComputedStyle(screen).boxShadow,
        overflow: document.documentElement.scrollWidth > innerWidth,
      };
    });
    expect(layout.topPadding).toBeGreaterThanOrEqual(112);
    expect(layout.gap).toBeGreaterThanOrEqual(56);
    expect(layout.imageWidth).toBeLessThanOrEqual(760);
    expect(layout.imageWidth).toBeLessThan(layout.available);
    expect(layout.glow).not.toBe('none');
    expect(layout.overflow).toBe(false);
    await title.evaluate(el => window.scrollTo({ top: scrollY + el.getBoundingClientRect().top - innerHeight * .92, behavior: 'instant' }));
    await expect.poll(() => firstWord.evaluate(el => Number(getComputedStyle(el).opacity))).toBeLessThan(.3);
  });
}
