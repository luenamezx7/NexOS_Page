import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('nexos-cookie-consent-v1', JSON.stringify({ necessary: true, functional: false, analytics: false, marketing: false, updatedAt: new Date().toISOString() })));
  await page.route('**/api/auth/get-session**', route => route.fulfill({ json: null }));
});

for (const reduced of [false, true]) {
  test(`mobile Panel reveal preserves the modal until exit finishes${reduced ? ' with reduced motion' : ''}`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ reducedMotion: reduced ? 'reduce' : 'no-preference' });
    await page.goto('/#hero');
    await expect(page.locator('dialog[data-presentation]')).toHaveCount(0, { timeout: 15000 });
    const trigger = page.getByRole('button', { name: 'Abrir menu' });
    await trigger.click();
    const dialog = page.locator('#mobile-navigation');
    const panel = dialog.locator('.t-panel-slide');
    await expect(panel).toHaveAttribute('data-open', 'true');
    await expect(panel).toHaveCSS('opacity', '1');
    if (reduced) await expect(panel).toHaveCSS('transition-duration', '0s');
    else await expect(panel).toHaveCSS('transition-duration', '0.4s, 0.4s, 0.4s');
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
    await expect(trigger).toBeFocused();
    expect(await page.evaluate(() => document.documentElement.style.overflow)).not.toBe('hidden');
    await trigger.click();
    await expect(panel).toHaveAttribute('data-open', 'true');
    await expect(panel).not.toHaveAttribute('inert');
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
  });
}

test('official modal recipe closes plate and management dialogs and resizes their details', async ({ page }) => {
  await page.goto('/#gestao');
  await expect(page.locator('dialog[data-presentation]')).toHaveCount(0, { timeout: 15000 });
  const explore = page.locator('[data-management-simulate]');
  await explore.click();
  const management = page.locator('dialog[data-management-simulation]');
  await expect(management).toHaveClass(/t-modal/);
  await expect(management).toHaveClass(/is-open/);
  await expect(management).toHaveCSS('opacity', '1');
  const resize = management.locator('[data-resize-transition]');
  await expect.poll(() => resize.evaluate(el => el.getBoundingClientRect().height)).toBeGreaterThan(100);
  await expect(resize).toHaveCSS('transition-duration', '0.3s, 0.3s');
  await management.getByRole('button', { name: 'Clientes', exact: true }).click();
  await expect(management.getByText('Histórico de relacionamento', { exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(management).toHaveCount(0);
  await expect(explore).toBeFocused();
  const plate = page.locator('[data-plate-option]').first().getByRole('button');
  await plate.click();
  const plateDialog = page.locator('dialog[aria-labelledby="plate-dialog-title"]');
  await expect(plateDialog).toHaveClass(/t-modal.*is-open/);
  await expect(plateDialog).toHaveCSS('opacity', '1');
  await plateDialog.getByRole('button', { name: 'Fechar detalhes da placa' }).click();
  await expect(plateDialog).not.toBeVisible();
  await expect(plate).toBeFocused();
});
