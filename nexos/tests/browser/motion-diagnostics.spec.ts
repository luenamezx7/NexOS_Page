import { expect, test, type Page } from '@playwright/test';

test.setTimeout(90000);
test.use({ contextOptions: { reducedMotion: 'no-preference' } });

async function report(page: Page) {
  return JSON.parse(await page.getByRole('textbox', { name: 'Relatório de movimento' }).inputValue());
}

async function open(page: Page) {
  await page.goto('/?motionDebug=1');
  // Exercise the whole opening, rather than skipping the failure under investigation.
  await expect(page.locator('[data-presentation]')).toHaveCount(0, { timeout: 30000 });
  await expect(page.locator('[data-motion-diagnostics]')).toBeVisible();
  await page.locator('[data-motion-diagnostics] summary').click();
}

test('normal motion reports completed intro, GSAP and real video progress', async ({ page }) => {
  await open(page);
  await expect.poll(async () => (await report(page)).resources.presentation?.status).toBe('completed');
  await expect.poll(async () => (await report(page)).resources.homepageGsap?.status).toBe('initialized');
  await expect.poll(async () => (await report(page)).resources.servicesGsap?.status).toBe('initialized');
  await expect.poll(async () => (await report(page)).resources.reveals?.status).toBe('enabled');
  await expect.poll(async () => (await report(page)).video?.advancedSincePreviousSample).toBe(true);
  const result = await report(page);
  expect(result.environment.reducedMotion).toBe(false);
  expect(result.history.some((entry: { resource: string; observation: { status: string } }) => entry.resource === 'presentation' && entry.observation.status === 'entering')).toBe(true);
  await page.screenshot({ path: 'test-results/motion-diagnostics-panel.png' });
});

test('reduced motion names each blocking policy and leaves video source unset', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page);
  for (const name of ['homepageGsap', 'servicesGsap', 'reveals']) {
    await expect.poll(async () => (await report(page)).resources[name]?.status).toBe('blocked-reduced-motion');
  }
  await expect.poll(async () => (await report(page)).resources.heroVideo?.detail).toBe('reduced-motion');
  expect((await report(page)).video.sourceAssigned).toBe(false);
  expect((await report(page)).resources.scroll).toMatchObject({ status: 'native', detail: 'reduced-motion' });
});

test('limited CPU retains full opening and GSAP while explaining native scroll', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 2 });
    Object.defineProperty(navigator, 'deviceMemory', { get: () => 2 });
  });
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 6 });
  await open(page);
  await expect.poll(async () => (await report(page)).resources.homepageGsap?.status).toBe('initialized');
  const result = await report(page);
  expect(result.resources.scroll).toMatchObject({ status: 'native', detail: 'hardware-policy: memory<=4GB or cores<=4' });
  expect(result.resources.presentation.status).toBe('completed');
  expect(result.history.some((entry: { resource: string; observation: { detail?: string } }) => entry.resource === 'presentation' && entry.observation.detail?.includes('durationMs=1850'))).toBe(true);
});

test('autoplay rejection is distinct from reduced motion', async ({ page }) => {
  await page.addInitScript(() => {
    // Native autoplay does not call the JS play() method. Block both paths.
    Object.defineProperty(HTMLMediaElement.prototype, 'autoplay', { configurable: true, get: () => false, set: () => {} });
    const setAttribute = Element.prototype.setAttribute;
    Element.prototype.setAttribute = function (name, value) {
      if (this instanceof HTMLMediaElement && name.toLowerCase() === 'autoplay') return;
      setAttribute.call(this, name, value);
    };
    HTMLMediaElement.prototype.play = () => Promise.reject(new DOMException('Test rejection', 'NotAllowedError'));
  });
  await open(page);
  await expect.poll(async () => (await report(page)).resources.heroVideo?.status).toBe('play-rejected');
  expect((await report(page)).resources.heroVideo.detail).toBe('NotAllowedError');
  expect((await report(page)).environment.reducedMotion).toBe(false);
});

test('invalid media records a native media error code', async ({ page }) => {
  await page.route('**/media/gloved-hand-connecting-iphone.mp4', route => route.fulfill({ status: 200, contentType: 'video/mp4', body: 'invalid video' }));
  await open(page);
  await expect.poll(async () => (await report(page)).video?.errorCode).not.toBeNull();
  expect((await report(page)).history.some((entry: { resource: string; observation: { status: string } }) => entry.resource === 'heroVideo' && entry.observation.status === 'media-error')).toBe(true);
});

test('clipboard rejection offers a manual copy fallback', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: () => Promise.reject(new Error('blocked')) } }));
  await open(page);
  await page.getByRole('button', { name: 'Copiar relatório' }).click();
  await expect(page.locator('[data-motion-diagnostics] [role="status"]')).toContainText('Ctrl+C');
  await expect(page.getByRole('textbox', { name: 'Relatório de movimento' })).toBeFocused();
  const selectedReport = await page.getByRole('textbox', { name: 'Relatório de movimento' }).inputValue();
  await page.waitForTimeout(1200); // Sampling must not reset a manual text selection.
  await expect(page.getByRole('textbox', { name: 'Relatório de movimento' })).toHaveValue(selectedReport);
});

test('normal URL does not mount the diagnostics panel', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('[data-presentation]')).toHaveCount(0, { timeout: 30000 });
  await expect(page.locator('[data-motion-diagnostics]')).toHaveCount(0);
});
