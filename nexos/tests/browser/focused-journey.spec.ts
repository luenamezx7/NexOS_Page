import { expect, test } from '@playwright/test';

async function openHome(page: import('@playwright/test').Page) {
  await page.goto('/');
  const intro = page.locator('dialog[data-presentation]');
  if (await intro.isVisible()) await intro.getByRole('button', { name: 'Pular apresentação' }).click();
  await expect(intro).toHaveCount(0);
  const cookieNotice = page.getByRole('dialog', { name: 'Aviso de cookies' });
  await cookieNotice.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
  if (await cookieNotice.isVisible()) {
    await cookieNotice.getByRole('button', { name: 'Recusar', exact: true }).click();
    await expect(cookieNotice).toBeHidden();
  }
}

for (const width of [320, 390, 1366]) {
  test(`${width}px: the MacBook displays two complete illustrations as the page scrolls`, async ({ page }) => {
    await page.setViewportSize({ width, height: width === 320 ? 740 : 844 });
    await openHome(page);
    const services = page.locator('#services');
    const grid = services.locator('[data-services-journey]');
    await expect(grid).toHaveAttribute('data-motion-ready', 'true');
    await expect(services.locator('h2')).toHaveText('Sites para seu negócio, cardápios ou vídeos com IA?');
    await expect(services.locator('h2')).toHaveCount(1);
    for (const index of [0, 1, 0]) {
      await grid.evaluate((element, step) => {
        const top = element.getBoundingClientRect().top + scrollY;
        window.scrollTo({ top: top + (element.clientHeight - innerHeight) * (step ? .95 : .05), behavior: 'instant' });
      }, index);
      const slide = grid.locator('[data-macbook-slide]').nth(index);
      await expect(slide).toHaveAttribute('data-active', 'true');
      await expect.poll(() => services.getAttribute('data-artwork-focus')).toBe('true');
      await expect.poll(() => slide.evaluate(element => {
        const image = element.querySelector('img')!.getBoundingClientRect();
        const screen = element.parentElement!.getBoundingClientRect();
        return image.left < screen.left + screen.width * .1 && image.right > screen.right - screen.width * .1 && Math.abs(image.bottom - screen.bottom) < 2;
      })).toBe(true);
      await expect(slide.locator('img')).toHaveCSS('object-fit', 'cover');
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

test('ScrollTrigger moves the MacBook and reverses the image handoff without leaks', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openHome(page);
  const grid = page.locator('#services [data-services-journey]');
  await expect(grid).toHaveAttribute('data-motion-ready', 'true');
  const frame = grid.locator('[data-macbook-motion]');
  const scrollToProgress = (progress: number) => grid.evaluate((element, amount) => {
    const top = element.getBoundingClientRect().top + scrollY;
    scrollTo({ top: top + (element.clientHeight - innerHeight) * amount, behavior: 'instant' });
  }, progress);
  await scrollToProgress(.05);
  await expect.poll(() => grid.locator('[data-macbook-slide]').first().getAttribute('data-active')).toBe('true');
  const firstPosition = await frame.boundingBox();
  expect(firstPosition).not.toBeNull();
  for (const [progress, index] of [[.95, 1], [.05, 0], [.95, 1]] as const) {
    await scrollToProgress(progress);
    const slide = grid.locator('[data-macbook-slide]').nth(index);
    await expect(slide).toHaveAttribute('data-active', 'true');
    const movement = expect.poll(async () => {
      const position = await frame.boundingBox();
      return Math.abs(position!.y - firstPosition!.y);
    });
    if (index) await movement.toBeGreaterThan(20);
    else await movement.toBeLessThan(10);
    await expect(grid.locator('[data-macbook-screen]')).toHaveCSS('overflow', 'hidden');
    expect(await grid.locator('#services-title').evaluate(element => element.parentElement!.hasAttribute('data-macbook-motion'))).toBe(true);
  }
});

test('hero gradient words match the rest of the heading and the redundant bridge is gone', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openHome(page);
  expect(await page.locator('#hero-title').evaluate(element => {
    const heading = getComputedStyle(element);
    const word = getComputedStyle(element.querySelector('[data-typing-word]')!);
    return heading.fontSize === word.fontSize;
  })).toBe(true);
  await expect(page.locator('#fisico-digital')).toHaveCount(0);
  await expect(page.locator('#showcase-title')).toContainText('O que seu cliente vai abrir na placa?');
  await expect(page.locator('#showcase [class*="productIntro"] p')).toHaveCount(0);
});

for (const width of [390, 1366]) {
  test(`${width}px: process highlights only the current delivery step`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await openHome(page);
    const process = page.locator('#delivery-process');
    await process.scrollIntoViewIfNeeded();
    await expect.poll(() => process.locator('li[data-active="true"]').count()).toBe(1);
    const styles = await process.locator('ol li').evaluateAll(items => items.map(element => ({
      active: element.getAttribute('data-active'),
      opacity: Number(getComputedStyle(element).opacity),
      blur: getComputedStyle(element).filter,
    })));
    expect(styles.find(item => item.active === 'true')?.opacity).toBe(1);
    expect(styles.filter(item => item.active !== 'true').every(item => item.opacity < .5 && item.blur !== 'none')).toBe(true);
  });
}

test('plate detail tilts on hover without flipping or blurring the artwork', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 844 });
  await openHome(page);
  await page.locator('#showcase [data-plate-option] button').first().click();
  const detail = page.getByRole('dialog', { name: 'Cardápio digital' });
  const plate = detail.locator('[class*="tiltPlate"]');
  await plate.hover({ position: { x: 280, y: 90 } });
  await expect.poll(() => plate.evaluate(element => getComputedStyle(element).transform)).not.toBe('none');
  await expect(detail.locator('[data-plate-face] > img')).toHaveCSS('filter', 'none');
  await expect(detail.getByRole('link', { name: 'Entender mais' })).toBeVisible();
  await page.mouse.move(10, 100);
  await expect.poll(() => plate.evaluate(element => getComputedStyle(element).transform)).toMatch(/^(none|matrix3d\(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1\))$/);
});
