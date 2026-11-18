import { expect, test } from '@playwright/test';

for (const locale of ['pt', 'en', 'es']) {
  test(`public copy, OLED panels and continuous NFC chapter in ${locale}`, async ({ page }) => {
    await page.addInitScript(language => {
      localStorage.setItem('easyway-language', language);
      localStorage.setItem('nexos-cookie-consent-v1', JSON.stringify({ necessary: true, functional: false, analytics: false, marketing: false, updatedAt: new Date().toISOString() }));
    }, locale);
    await page.goto('/');
    await expect(page.locator('dialog[data-presentation]')).toHaveCount(0, { timeout: 15000 });
    await expect(page.locator('#ecossistema details, #ecossistema summary')).toHaveCount(0);
    await page.locator('.business-examples-disclosure').evaluate(el => (el as HTMLDetailsElement).open = true);
    const text = await page.locator('#main-content').innerText();
    expect(text).not.toMatch(/ilustrativ|exemplar|exemplo|demonstrativ|demonstração|fictíci|illustrativ|\bexamples?\b|demonstration|fictional|ejemplo|demostraci[oó]n/i);
    const labels = await page.locator('#main-content [aria-label], #main-content [alt]').evaluateAll(elements => elements.map(el => el.getAttribute('aria-label') || el.getAttribute('alt')).join(' '));
    expect(labels).not.toMatch(/ilustrativ|exemplar|exemplo|demonstrativ|illustrativ|\bexamples?\b|demonstration|ejemplo|demostraci[oó]n/i);
    const nfc = page.locator('[data-home-experience="nfc"]');
    expect(await nfc.evaluate(el => {
      const showcase = el.querySelector('#showcase')!, support = el.querySelector('#plate-management')!;
      const video = document.querySelector('#real-estate-video-title')!;
      return { sameChapter: !!showcase && !!support, mask: getComputedStyle(el, '::before').maskImage, background: getComputedStyle(el, '::before').backgroundColor, after: Boolean(support.compareDocumentPosition(video) & Node.DOCUMENT_POSITION_FOLLOWING), seam: Math.abs(showcase.getBoundingClientRect().bottom - support.getBoundingClientRect().top) };
    })).toEqual({ sameChapter: true, mask: 'none', background: 'rgb(0, 0, 0)', after: true, seam: 0 });
    await expect(page.locator('[data-home-experience="process"]')).toHaveCSS('background-color', 'rgb(0, 0, 0)');
    await expect(page.locator('header').first()).toHaveCSS('background-color', 'rgb(0, 0, 0)');
    await expect(page.locator('[data-glass-card][data-solution="nfc"] [class*="surface"]')).toHaveCSS('background-color', 'rgb(0, 0, 0)');
    await page.locator('[data-management-simulate]').click();
    const dialog = page.locator('dialog[data-management-simulation]');
    await expect(dialog).toBeVisible();
    expect(await dialog.innerText()).not.toMatch(/ilustrativ|exemplo|demonstração|fictíci|illustrativ|\bexamples?\b|demonstration|fictional|ejemplo|demostraci[oó]n/i);
    await page.keyboard.press('Escape');
  });
}
