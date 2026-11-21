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

test('plate dialog closes by button and Escape and restores trigger focus', async ({ page }) => {
  await page.goto('/#showcase');
  await expect(page.locator('dialog[data-presentation]')).toHaveCount(0, { timeout: 15000 });
  const plate = page.locator('[data-plate-option]').first().getByRole('button');
  await plate.click();
  const plateDialog = page.locator('dialog[aria-labelledby="plate-dialog-title"]');
  await expect(plateDialog).toHaveClass(/t-modal.*is-open/);
  await expect(plateDialog).toHaveCSS('opacity', '1');
  await plateDialog.getByRole('button', { name: 'Fechar detalhes da placa' }).click();
  await expect(plateDialog).not.toBeVisible();
  await expect(plate).toBeFocused();
  await plate.click();
  await expect(plateDialog).toHaveCSS('opacity', '1');
  await page.keyboard.press('Escape');
  await expect(plateDialog).not.toBeVisible();
  await expect(plate).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.style.overflow)).not.toBe('hidden');
});

for (const viewport of [{ width: 320, height: 568 }, { width: 390, height: 844 }, { width: 820, height: 1180 }]) {
  test(`mobile menu descends smoothly and fits at ${viewport.width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize(viewport);
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/#hero');
    await expect(page.locator('dialog[data-presentation]')).toHaveCount(0, { timeout: 15000 });
    const trigger = page.getByRole('button', { name: 'Abrir menu' });
    await trigger.click();
    const dialog = page.locator('#mobile-navigation');
    const panel = dialog.locator('.t-panel-slide');
    await expect(panel).toHaveAttribute('data-open', 'true');
    const motion = await panel.evaluate(element => {
      const animations = element.getAnimations();
      const translation = animations.find(animation => (animation as CSSTransition).transitionProperty === 'transform');
      if (!translation) return null;
      animations.forEach(animation => animation.pause());
      const sample = (time: number) => {
        translation.currentTime = time;
        return new DOMMatrixReadOnly(getComputedStyle(element).transform).m42;
      };
      const positions = [sample(0), sample(100), sample(280), sample(400)];
      animations.forEach(animation => animation.finish());
      return positions;
    });
    expect(motion).not.toBeNull();
    expect(motion![0]).toBeCloseTo(-48, 0);
    expect(motion![1]).toBeGreaterThan(motion![0]);
    expect(motion![2]).toBeGreaterThan(motion![1]);
    expect(motion![3]).toBeCloseTo(0, 1);
    await expect(panel).toHaveCSS('opacity', '1');
    const bounds = await panel.boundingBox();
    expect(bounds!.y).toBeGreaterThanOrEqual(0);
    expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(viewport.height);
    const contact = dialog.getByRole('link', { name: 'Conversar no WhatsApp' });
    await contact.scrollIntoViewIfNeeded();
    await expect(contact).toBeVisible();
    const glassCoverage = await panel.evaluate(element => {
      const panel = element.getBoundingClientRect();
      const glass = element.querySelector(':scope > .navigation-glass')!.getBoundingClientRect();
      const scroller = element.querySelector('[data-mobile-menu-scroll]')!;
      return { top: glass.top - panel.top, bottom: panel.bottom - glass.bottom, scrollable: scroller.scrollHeight > scroller.clientHeight, scrollTop: scroller.scrollTop };
    });
    expect(Math.abs(glassCoverage.top)).toBeLessThanOrEqual(1);
    expect(Math.abs(glassCoverage.bottom)).toBeLessThanOrEqual(1);
    await page.screenshot({ path: testInfo.outputPath(`mobile-menu-${viewport.width}.png`) });
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
    await expect(trigger).toBeFocused();
    await trigger.click();
    await expect(panel).toHaveAttribute('data-open', 'true');
    await expect(panel).toHaveCSS('opacity', '1');
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
  });
}
