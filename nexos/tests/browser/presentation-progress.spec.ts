import { expect, test } from '@playwright/test';

for (const width of [390, 1440]) {
  test(`presentation counts from zero to one hundred at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    // Client chunks arriving late must not cut off the counter's first half.
    await page.route('**/*.js*', async route => {
      await new Promise(resolve => setTimeout(resolve, 500));
      await route.continue();
    });
    await page.addInitScript(() => {
      const samples: number[] = [];
      Object.assign(window, { presentationSamples: samples });
      new MutationObserver(() => {
        const counter = document.querySelector('[data-presentation-percentage]');
        if (!counter) return;
        const value = Number(counter.getAttribute('aria-valuenow'));
        if (samples.at(-1) !== value) samples.push(value);
      }).observe(document, { subtree: true, childList: true, attributes: true, attributeFilter: ['aria-valuenow'] });
    });
    await page.goto('/');
    await expect(page.locator('[data-presentation]')).toHaveCount(0, { timeout: 15000 });
    const samples = await page.evaluate(() => (window as unknown as { presentationSamples: number[] }).presentationSamples);
    expect(samples[0]).toBe(0);
    expect(samples.at(-1)).toBe(100);
    for (const [low, high] of [[1, 25], [26, 50], [51, 75], [76, 99]]) {
      expect(samples.some(value => value >= low && value <= high), JSON.stringify(samples)).toBe(true);
    }
    expect(samples.every((value, index) => !index || value >= samples[index - 1])).toBe(true);
    await expect(page.locator('#hero')).toBeFocused();
  });
}
