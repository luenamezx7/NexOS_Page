import { expect, type Page } from '@playwright/test';

/** Open the optional experience through its real public control. */
export async function openPresentation(page: Page) {
  await page.getByRole('button', { name: 'Ver apresentação', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Apresentação NexOS' })).toBeFocused({ timeout: 15000 });
}

/** Finish an explicitly opened presentation through its keyboard scroll path. */
export async function enterPresentation(page: Page) {
  const dialog = page.getByRole('dialog', { name: 'Apresentação NexOS' });
  if (!await dialog.count()) return;
  await expect(dialog).toBeFocused({ timeout: 15000 });
  await page.keyboard.press('End');
  await expect(dialog).toHaveCount(0, { timeout: 20000 });
}
