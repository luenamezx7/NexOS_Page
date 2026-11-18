import { expect, test } from '@playwright/test';

const consent = () => localStorage.setItem('nexos-cookie-consent-v1', JSON.stringify({ necessary: true, functional: false, analytics: false, marketing: false, updatedAt: new Date().toISOString() }));
async function openHome(page: import('@playwright/test').Page) {
  await page.goto('/');
  await expect(page.locator('dialog[data-presentation]')).toHaveCount(0, { timeout: 15000 });
  await page.evaluate(() => document.fonts.ready);
}

test('wheel momentum continues after release in both directions without reversing', async ({ page }) => {
  await page.addInitScript(consent);
  await page.setViewportSize({ width: 1440, height: 900 });
  await openHome(page);
  await expect(page.locator('html')).toHaveClass(/lenis/);
  await expect(page.locator('html')).not.toHaveClass(/lenis-stopped/);
  await page.evaluate(() => window.scrollTo({ top: 1000, behavior: 'instant' }));
  for (const direction of [1, -1]) {
    await page.mouse.move(1100, 450);
    await page.mouse.wheel(0, direction * 600);
    const samples = await page.evaluate(async () => {
      const frames: { y: number; time: number }[] = [];
      const start = performance.now();
      await new Promise<void>(resolve => {
        const frame = (time: number) => {
          frames.push({ y: scrollY, time: time - start });
          if (time - start >= 1400) resolve();
          else requestAnimationFrame(frame);
        };
        requestAnimationFrame(frame);
      });
      return frames;
    });
    expect((samples.at(-1)!.y - samples[0].y) * direction).toBeGreaterThan(200);
    const afterRelease = samples.find(sample => sample.time >= 150)!;
    expect((samples.at(-1)!.y - afterRelease.y) * direction).toBeGreaterThan(40);
    for (let i = 1; i < samples.length; i++) expect((samples[i].y - samples[i - 1].y) * direction).toBeGreaterThanOrEqual(-1);
    const gaps = samples.slice(1).map((frame, index) => frame.time - samples[index].time).sort((a, b) => a - b);
    expect(gaps[Math.floor(gaps.length * .95)]).toBeLessThan(50);
  }
});

for (const width of [390, 1440]) {
  test(`MacBook stays framed, reverses and manual selection does not move the page at ${width}px`, async ({ page }) => {
    await page.addInitScript(consent);
    await page.setViewportSize({ width, height: 900 });
    await openHome(page);
    const section = page.locator('#services');
    const geometry = await section.evaluate(el => {
      const stage = el.querySelector<HTMLElement>('[data-services-journey]')!;
      return { top: el.getBoundingClientRect().top + scrollY, distance: el.getBoundingClientRect().height - stage.offsetHeight };
    });
    let previousBox: { x: number; y: number; width: number; height: number } | null = null;
    for (const progress of [.1, .45, .9, .45, .1]) {
      await page.evaluate(y => window.scrollTo({ top: y, behavior: 'instant' }), geometry.top + geometry.distance * progress);
      await expect.poll(() => section.locator('[data-macbook-slide][data-active="true"]').count()).toBe(1);
      const chassis = section.locator('[data-macbook-chassis] > div');
      const box = (await chassis.boundingBox())!;
      const title = (await section.locator('#services-title').boundingBox())!;
      const caption = (await section.locator('[class*="arcBottom"]').boundingBox())!;
      expect(box.y).toBeGreaterThanOrEqual(title.y + title.height - 4);
      expect(box.y + box.height).toBeLessThanOrEqual(caption.y + 4);
      if (previousBox) {
        expect(Math.abs(box.y - previousBox.y)).toBeLessThan(3);
        expect(Math.abs(box.width - previousBox.width)).toBeLessThan(3);
      }
      previousBox = box;
    }
    const before = await page.evaluate(() => scrollY);
    await section.getByRole('button', { name: 'Ver solução: Landing page', exact: true }).click();
    await expect(section.locator('[data-macbook-slide][data-active="true"]')).toContainText('Uma pausa para o seu dia.');
    expect(await page.evaluate(() => scrollY)).toBe(before);
    expect(await section.locator('[data-services-journey]').evaluate(el => el.scrollTop)).toBe(0);
  });
}

const inAppAgents = [
  { name: 'Instagram iPhone', ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Instagram 360.0.0.0' },
  { name: 'Instagram Android', ua: 'Mozilla/5.0 (Linux; Android 15; Pixel 8) AppleWebKit/537.36 Chrome/131.0.0.0 Mobile Safari/537.36 Instagram 360.0.0.0 Android' },
];
for (const profile of inAppAgents) {
  test(`${profile.name} keeps native momentum and stable journey geometry during toolbar resizes`, async ({ browser, baseURL }) => {
    const context = await browser.newContext({ baseURL, viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, userAgent: profile.ua });
    await context.addInitScript(consent);
    const page = await context.newPage();
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await openHome(page);
    await expect(page.locator('html')).toHaveAttribute('data-browser-profile', 'embedded');
    await expect(page.locator('html')).not.toHaveClass(/lenis/);
    await expect(page.locator('.landing-header-blur, .landing-edge-blur')).toHaveCount(0);
    const stage = page.locator('[data-ecosystem-stage]');
    await expect(stage).toHaveAttribute('data-scroll-cards', 'true');
    const geometry = await page.evaluate(() => ({
      pageHeight: document.documentElement.scrollHeight,
      glass: document.querySelector<HTMLElement>('[data-ecosystem-viewport]')!.offsetHeight,
      services: document.querySelector<HTMLElement>('#services')!.offsetHeight,
      stable: getComputedStyle(document.documentElement).getPropertyValue('--page-viewport-height'),
    }));
    await page.setViewportSize({ width: 390, height: 760 });
    await expect.poll(() => page.evaluate(() => document.querySelector<HTMLElement>('#services')!.offsetHeight)).toBe(geometry.services);
    await expect.poll(() => stage.locator('[data-ecosystem-viewport]').evaluate(el => (el as HTMLElement).offsetHeight)).toBe(geometry.glass);
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--page-viewport-height'))).toBe(geometry.stable);
    expect(Math.abs(await page.evaluate(() => document.documentElement.scrollHeight) - geometry.pageHeight)).toBeLessThan(100);
    for (const fraction of [.1, .4, .7, .4, .1]) {
      await page.evaluate(value => window.scrollTo({ top: (document.documentElement.scrollHeight - innerHeight) * value, behavior: 'instant' }), fraction);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
    if (browser.browserType().name() === 'chromium') {
      const cdp = await context.newCDPSession(page);
      await page.evaluate(() => window.scrollTo({ top: 1200, behavior: 'instant' }));
      for (const direction of [-1, 1]) {
        const start = direction < 0 ? 650 : 250;
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 200, y: start, id: 1 }] });
        let previous = await page.evaluate(() => scrollY);
        for (let step = 1; step <= 8; step++) {
          await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 200, y: start + direction * step * 36, id: 1 }] });
          const next = await page.evaluate(() => scrollY);
          if (step > 2) expect((next - previous) * -direction).toBeGreaterThanOrEqual(-2);
          previous = next;
        }
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      }
    }
    expect(errors).toEqual([]);
    await context.close();
  });
}
