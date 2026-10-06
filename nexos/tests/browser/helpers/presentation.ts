import { expect, type Page } from '@playwright/test';

/** Enter via an accessible scroll key; never bypass the application's new F5 rule. */
export async function enterPresentation(page: Page) {
  const dialog = page.getByRole('dialog', { name: 'Apresentação NexOS' });
  if (!await dialog.count()) return;
  await expect(dialog).toBeFocused({ timeout: 15000 });
  await page.keyboard.press('End');
  await expect(dialog).toHaveCount(0, { timeout: 20000 });
}
