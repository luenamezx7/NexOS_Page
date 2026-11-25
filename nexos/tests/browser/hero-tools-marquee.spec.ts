import { expect, test, type Page } from '@playwright/test';

async function openMarquee(page: Page) {
  await page.goto('/');
  await expect(page.locator('dialog[data-presentation]')).toHaveCount(0, { timeout: 20000 });
  const marquee = page.locator('[data-hero-tools-marquee]');
  await marquee.scrollIntoViewIfNeeded();
  return marquee;
}

for (const width of [320, 390, 768, 1440]) {
  test(`avatar word stays centered and tools fit at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const marquee = await openMarquee(page);
    await expect(marquee.locator('img')).toHaveCount(4);
    await expect(marquee.locator('li')).toHaveText(['ChatGPT', 'Claude', 'Figma', 'GitHub']);
    await expect(marquee.locator('[data-perspective-marquee]')).toHaveCount(0);
    const geometry = await page.evaluate(() => {
      const avatar = document.querySelector('[data-avatar-stage]')!.getBoundingClientRect();
      const halves = [...document.querySelectorAll('[data-avatar-word] > span')].map(e => e.getBoundingClientRect());
      const hero = document.querySelector('#hero')!.getBoundingClientRect();
      const strip = document.querySelector('[data-hero-tools-marquee]')!.getBoundingClientRect();
      const management = document.querySelector('#gestao')!.getBoundingClientRect();
      return {
        gapCenter: (halves[0].right + halves[1].left) / 2,
        avatarCenter: avatar.x + avatar.width / 2,
        heroGap: strip.top - hero.bottom, sectionGap: management.top - strip.bottom,
        overflow: document.documentElement.scrollWidth > innerWidth,
        loaded: [...document.querySelectorAll('[data-hero-tools-marquee] img')].every(e => (e as HTMLImageElement).complete && (e as HTMLImageElement).naturalWidth > 0),
      };
    });
    expect(Math.abs(geometry.gapCenter - geometry.avatarCenter)).toBeLessThan(1);
    expect(geometry.heroGap).toBe(0);
    expect(geometry.sectionGap).toBe(0);
    expect(geometry.overflow).toBe(false);
    expect(geometry.loaded).toBe(true);
  });
}

test('logos loop twice without a blank cycle and pause offscreen', async ({ page }) => {
  test.setTimeout(60000);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  const marquee = await openMarquee(page);
  await expect(marquee).toHaveAttribute('data-playing', 'true');
  await expect(marquee.locator('[data-marquee-track]')).toBeVisible();
  const loopResult = await page.evaluate(async () => {
    const track = document.querySelector<HTMLElement>('[data-marquee-track]')!;
    const cycle = parseFloat(getComputedStyle(track.firstElementChild!).width);
    const read = () => new DOMMatrixReadOnly(getComputedStyle(track).transform).m41;
    let previous = read();
    let wraps = 0;
    let continuous = true;
    const start = performance.now();
    while (wraps < 2 && performance.now() - start < 25000) {
      await new Promise(resolve => setTimeout(resolve, 80));
      const current = read();
      if (current > previous + cycle / 2) {
        wraps++;
        continuous &&= previous < -cycle + 40 && current > -40;
      }
      previous = current;
    }
    return { wraps, continuous, loaded: [...track.querySelectorAll('img')].every(img => img.complete && img.naturalWidth > 0) };
  });
  expect(loopResult).toEqual({ wraps: 2, continuous: true, loaded: true });
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await expect(marquee).toHaveAttribute('data-playing', 'false');
  const track = marquee.locator('[data-marquee-track]');
  const stopped = await track.getAttribute('style');
  await page.waitForTimeout(300);
  expect(await track.getAttribute('style')).toBe(stopped);
  await marquee.scrollIntoViewIfNeeded();
  await expect(marquee).toHaveAttribute('data-playing', 'true');
  await expect.poll(() => track.getAttribute('style')).not.toBe(stopped);
});
