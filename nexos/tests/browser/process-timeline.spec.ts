import { expect, test } from '@playwright/test';

test.use({ channel: process.env.PLAYWRIGHT_CHANNEL || undefined });

for (const width of [390, 1366]) {
  test(`${width}px: only the step at the scrolling position glows lime`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await expect(page.locator('dialog[data-presentation]')).toHaveCount(0, { timeout: 15000 });
    const section = page.locator('#delivery-process');
    const steps = section.locator('ol > li');
    await expect(steps).toHaveCount(4);
    for (let index = 0; index < 4; index++) {
      await page.evaluate(({ index, desktop }) => {
        const section = document.querySelector<HTMLElement>('#delivery-process')!;
        const timeline = section.querySelector<HTMLOListElement>('ol')!;
        const range = desktop ? section.offsetHeight - innerHeight : timeline.offsetHeight;
        const top = desktop ? section.getBoundingClientRect().top + scrollY : timeline.getBoundingClientRect().top + scrollY - innerHeight / 2;
        scrollTo({ top: top + range * ((index + .5) / 4), behavior: 'instant' });
      }, { index, desktop: width >= 768 });
      await expect(steps.nth(index)).toHaveAttribute('aria-current', 'step');
      await expect(steps.locator('[class*="stepMarker"]').nth(index)).toHaveCSS('background-color', 'rgb(217, 242, 42)');
      for (let other = 0; other < 4; other++) {
        if (other === index) continue;
        await expect(steps.nth(other)).not.toHaveAttribute('aria-current', 'step');
        await expect(steps.locator('[class*="stepMarker"]').nth(other)).not.toHaveCSS('background-color', 'rgb(217, 242, 42)');
      }
    }
    await section.getByRole('radio', { name: 'Serviço digital' }).check();
    await expect(section.getByRole('list', { name: 'Processo do serviço digital' })).toBeVisible();
    await expect(section.locator('ol li[data-active="true"]')).toHaveCount(1);
  });
}
