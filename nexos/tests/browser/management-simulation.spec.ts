import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('nexos-cookie-consent-v1', JSON.stringify({ necessary: true, functional: false, analytics: false, marketing: false, updatedAt: new Date().toISOString() })));
});

test('scroll chapters preserve a manual choice until the next boundary and clean up on resize', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await expect(page.locator('dialog[data-presentation]')).toHaveCount(0, { timeout: 15000 });
  const stage = page.locator('[data-management-stage]');
  await expect(stage).toHaveAttribute('data-management-chapters', 'true');
  const { start, length } = await stage.evaluate(el => ({ start: el.parentElement!.getBoundingClientRect().top + scrollY - 110, length: (innerHeight - 110) * 1.8 }));
  await page.evaluate(y => window.scrollTo({ top: y, behavior: 'instant' }), start + 40);
  await expect(page.locator('#management-demo img')).toHaveAttribute('src', /pipeline/);
  await page.locator('[data-management-tab]').filter({ hasText: 'Financeiro' }).click();
  await page.evaluate(y => window.scrollTo({ top: y, behavior: 'instant' }), start + 150);
  await expect(page.locator('#management-demo img')).toHaveAttribute('src', /financeiro/);
  await page.evaluate(y => window.scrollTo({ top: y, behavior: 'instant' }), start + length * .5);
  await expect(page.locator('#management-demo img')).toHaveAttribute('src', /clientes/);
  await page.evaluate(y => window.scrollTo({ top: y, behavior: 'instant' }), start + length * .9);
  await expect(page.locator('#management-demo img')).toHaveAttribute('src', /financeiro/);
  await expect.poll(() => stage.evaluate(el => Math.round(el.getBoundingClientRect().top))).toBe(110);
  expect(await stage.evaluate(el => el.getBoundingClientRect().bottom <= innerHeight)).toBe(true);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(stage).not.toHaveAttribute('data-management-chapters');
  expect(await stage.evaluate(el => !!el.closest('.pin-spacer'))).toBe(false);
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(stage).toHaveAttribute('data-management-chapters', 'true');
  await expect(page.locator('.pin-spacer:has(> [data-management-stage])')).toHaveCount(1);
  expect(await page.locator('[data-avatar-scene]').evaluate(el => !!el.closest('.pin-spacer'))).toBe(false);
});

for (const width of [390, 1440]) {
  test(`fictional demonstrations work, reset and restore focus at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await expect(page.locator('dialog[data-presentation]')).toHaveCount(0, { timeout: 15000 });
    await page.locator('#gestao').scrollIntoViewIfNeeded();
    await page.locator('[data-management-tab]').filter({ hasText: 'Comercial' }).click();
    const opener = page.locator('[data-management-simulate]');
    await opener.click();
    const dialog = page.locator('dialog[data-management-simulation]');
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText('Nenhuma informação é enviada ao CRM.');
    await expect(dialog).toContainText('Nenhuma informação é enviada ao CRM');
    const writes: string[] = [];
    page.on('request', request => { if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(request.method())) writes.push(request.url()); });
    const position = await page.evaluate(() => scrollY);
    await page.mouse.wheel(0, 700);
    expect(await page.evaluate(() => scrollY)).toBe(position);
    await dialog.getByLabel('Etapa da oportunidade').selectOption('2');
    await dialog.getByLabel('Próximo retorno').fill('2026-12-02');
    await expect(dialog.getByRole('status')).toContainText('Proposta');
    await dialog.getByLabel('Oportunidade', { exact: true }).selectOption('1');
    await expect(dialog.getByLabel('Etapa da oportunidade')).toHaveValue('1');
    await dialog.getByLabel('Oportunidade', { exact: true }).selectOption('0');
    await expect(dialog.getByLabel('Etapa da oportunidade')).toHaveValue('2');
    await expect(dialog.getByLabel('Próximo retorno')).toHaveValue('2026-12-02');
    await dialog.getByRole('button', { name: 'Reiniciar' }).click();
    await expect(dialog.getByLabel('Etapa da oportunidade')).toHaveValue('0');
    await expect(dialog.getByLabel('Próximo retorno')).toHaveValue('2026-11-20');
    await dialog.getByRole('button', { name: 'Clientes', exact: true }).click();
    await dialog.getByLabel('Cliente', { exact: true }).selectOption('1');
    await expect(dialog.getByRole('heading', { name: 'Café Jardim' })).toBeVisible();
    await expect(dialog.locator('ol li')).toHaveCount(3);
    await dialog.getByRole('button', { name: 'Financeiro', exact: true }).click();
    await expect(dialog).toContainText('12.400');
    await dialog.getByLabel('Período').selectOption('1');
    await expect(dialog).toContainText('15.800');
    await dialog.getByRole('button', { name: 'Reiniciar' }).click();
    await expect(dialog.getByLabel('Período')).toHaveValue('0');
    expect(writes).toEqual([]);
    await expect(page.locator('[data-management-tab]').first()).toHaveAttribute('aria-pressed', 'true');
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    await expect(opener).toBeFocused();
    expect(await page.evaluate(() => scrollY)).toBe(position);
    await opener.click();
    await expect(page.locator('dialog[data-management-simulation]').getByLabel('Etapa da oportunidade')).toHaveValue('0');
    await page.getByRole('button', { name: 'Fechar gestão' }).click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

test('system motion preference does not disable chapter animation or management controls', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/#gestao');
  await expect(page.locator('[data-management-stage]')).toHaveAttribute('data-management-chapters', 'true');
  await page.locator('[data-management-tab]').filter({ hasText: 'Financeiro' }).click();
  await expect(page.locator('#management-demo img')).toHaveAttribute('src', /financeiro/);
  await page.locator('[data-management-simulate]').click();
  await expect(page.locator('dialog[data-management-simulation]').getByLabel('Período')).toBeVisible();
  await page.keyboard.press('Escape');
});
