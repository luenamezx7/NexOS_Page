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
  test(`${width}px: digital destinations show one focused step with reachable samples`, async ({ page }) => {
    await page.setViewportSize({ width, height: width === 320 ? 740 : 844 });
    await openHome(page);
    const services = page.locator('#services');
    const grid = services.locator('[data-services-journey]');
    await expect(grid).toHaveAttribute('data-motion-ready', 'true');
    await expect(services.locator('h2')).toContainText('Não tem destino digital? A ezway resolve');
    for (const [position, index] of [0, 1, 2, 1, 0].entries()) {
      await grid.evaluate((element, step) => {
        const top = element.getBoundingClientRect().top + scrollY;
        window.scrollTo({ top: top + (element.clientHeight - innerHeight) * step / 2 + (step === 2 ? -2 : 2), behavior: 'instant' });
      }, index);
      const step = services.locator('[data-services-step]').nth(index);
      await expect(step).toHaveAttribute('data-active', 'true');
      await expect(step).toBeVisible();
      await expect.poll(() => services.locator('[data-services-step]:visible').count()).toBe(1);
      await expect.poll(() => services.getAttribute('data-artwork-focus')).toBe(index < 2 ? 'true' : 'false');
      const geometry = await step.evaluate(element => {
        const screen = element.querySelector('[data-macbook-screen]')!.getBoundingClientRect();
        const frame = element.parentElement!.querySelector('[class*="macbook"]')!.getBoundingClientRect();
        const track = element.querySelector('[class*="sampleTrack"]');
        const image = track?.querySelector('img')?.getBoundingClientRect();
        return { screen: screen.toJSON(), frame: frame.toJSON(), image: image?.toJSON(), stage: element.parentElement!.getBoundingClientRect().toJSON() };
      });
      expect(Math.abs(geometry.frame.left + geometry.frame.right - geometry.stage.left - geometry.stage.right)).toBeLessThan(2);
      expect(geometry.screen.left).toBeGreaterThanOrEqual(geometry.frame.left);
      expect(geometry.screen.right).toBeLessThanOrEqual(geometry.frame.right);
      if (geometry.image && index === 0 && position === 0) {
        expect(geometry.image.top).toBeGreaterThanOrEqual(geometry.screen.top);
        expect(geometry.image.bottom).toBeLessThanOrEqual(geometry.screen.bottom - 40);
      }
      if (index === 0 && position === 0) {
        const next = step.getByRole('button', { name: 'Próxima amostra' });
        const control = await next.boundingBox();
        expect(control).not.toBeNull();
        expect(control!.y + control!.height).toBeLessThanOrEqual(width === 320 ? 740 : 844);
        await page.mouse.click(control!.x + control!.width / 2, control!.y + control!.height / 2);
        await expect(step.getByRole('img', { name: 'Cardápio ilustrativo de restaurante' })).toBeVisible();
        await expect(step.locator('[class*="sampleControls"] > span')).toHaveText('2 / 2');
      }
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

test('MacBook remains still through forward and reverse transitions without artwork leaking out', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openHome(page);
  const grid = page.locator('#services [data-services-journey]');
  await expect(grid).toHaveAttribute('data-motion-ready', 'true');
  const frame = grid.locator('[class*="macbook"]');
  const scrollToProgress = (progress: number) => grid.evaluate((element, amount) => {
    const top = element.getBoundingClientRect().top + scrollY;
    scrollTo({ top: top + (element.clientHeight - innerHeight) * amount, behavior: 'instant' });
  }, progress);
  await scrollToProgress(.1);
  const firstPosition = await frame.boundingBox();
  expect(firstPosition).not.toBeNull();
  for (const [progress, heading] of [[.3, 'Portfólio?'], [.8, 'Vídeos com IA?'], [.3, 'Portfólio?'], [.1, 'Cardápio?']] as const) {
    await scrollToProgress(progress);
    const active = grid.locator('[data-services-step][data-active="true"]');
    await expect(active.locator('h3')).toHaveText(heading);
    await expect.poll(() => grid.locator('[data-services-step]:visible').count()).toBe(1);
    const position = await frame.boundingBox();
    expect(position).not.toBeNull();
    expect(Math.abs(position!.x - firstPosition!.x)).toBeLessThan(1);
    expect(Math.abs(position!.y - firstPosition!.y)).toBeLessThan(1);
    expect(await active.locator('[data-macbook-screen]').evaluate(element => element.scrollHeight <= element.clientHeight + 1)).toBe(true);
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
