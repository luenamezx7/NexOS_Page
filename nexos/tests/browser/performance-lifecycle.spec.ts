import { expect, test } from '@playwright/test';
import { openPresentation } from './helpers/presentation';

test.setTimeout(60000);

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('nexos-theme', 'light');
    localStorage.setItem('nexos-cookie-consent-v1', JSON.stringify({ necessary: true, functional: false, analytics: false, marketing: false, updatedAt: new Date().toISOString() }));
  });
});

test('a abertura não mantém efeitos WebGL e blurs da home trabalhando por baixo', async ({ page }) => {
  await page.goto('/');
  await openPresentation(page);
  const dialog = page.getByRole('dialog', { name: 'Apresentação NexOS' });
  await expect(dialog.locator('[data-topography]')).toHaveAttribute('data-motion', 'animated');
  await expect(page.locator('[data-scene="waves"] [data-topography]')).toHaveCount(0);
  await expect(page.locator('#hero .grainient-container')).toHaveCount(0);
  await expect(page.locator('.landing-header-blur, .landing-edge-blur, .hero-ascii .gradual-blur')).toHaveCount(0);
  await expect(page.locator('[data-metallic-surface] canvas')).toHaveCount(0);
});

test('o Topography pausa fora da tela e reutiliza o canvas ao voltar', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/#fisico-digital');
  const topology = page.locator('[data-scene="waves"] [data-topography]').first();
  await expect(topology).toHaveAttribute('data-motion', 'static');
  await topology.locator('canvas').evaluate(canvas => { canvas.dataset.retainedCanvas = 'yes'; });
  await page.evaluate(() => scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }));
  await expect(topology).toHaveAttribute('data-motion', 'paused');
  await page.locator('#fisico-digital').scrollIntoViewIfNeeded();
  await expect(topology).toHaveAttribute('data-motion', 'static');
  await expect(topology.locator('canvas')).toHaveAttribute('data-retained-canvas', 'yes');
});

test('a navegação do header e do indicador chega à seção sem disputa de scroll', async ({ page }) => {
  await page.goto('/#hero');
  await expect(page.locator('html')).toHaveClass(/lenis/);
  await page.getByRole('navigation', { name: 'Navegação principal', exact: true }).getByRole('link', { name: 'Contato', exact: true }).click();
  await expect.poll(() => page.locator('#cta-final').evaluate(element => Math.abs(element.getBoundingClientRect().top - parseFloat(getComputedStyle(element).scrollMarginTop || '0'))), { timeout: 20000 }).toBeLessThan(4);
  await page.getByRole('button', { name: 'Ir para Início', exact: true }).click();
  await expect.poll(() => page.evaluate(() => scrollY), { timeout: 20000 }).toBeLessThan(4);
});

test('o gradual blur fica apenas nas bordas da tela, sem blur entre seções', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/#hero');
  await expect(page.locator('.gradual-blur')).toHaveCount(2);
  await expect(page.locator('.landing-header-blur')).toHaveCSS('position', 'fixed');
  await expect(page.locator('.landing-edge-blur')).toHaveCSS('position', 'fixed');
  await expect(page.locator('#hero .gradual-blur, [data-scene] .gradual-blur')).toHaveCount(0);
  await page.locator('#showcase').scrollIntoViewIfNeeded();
  await expect(page.locator('.gradual-blur')).toHaveCount(2);
  const bottom = await page.locator('.landing-edge-blur').boundingBox();
  expect(bottom!.y + bottom!.height).toBeCloseTo(page.viewportSize()!.height, 0);
});

for (const theme of ['light', 'dark']) {
  test(`degradê de blur ${theme} intensifica as bordas e desaparece no fim da página`, async ({ page }, testInfo) => {
    await page.addInitScript(theme => localStorage.setItem('nexos-theme', theme), theme);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/#hero');
    const blur = page.locator('.landing-edge-blur');
    await expect(blur).toBeVisible();
    await expect(blur.locator('[data-gradual-blur-layer]')).toHaveCount(8);
    await expect.poll(() => blur.evaluate(root => (root as HTMLElement).style.getPropertyValue('--gradual-blur-reveal'))).toBe('1.000');
    await expect(blur.locator('.gradual-blur-bloom, .gradual-blur-tint')).toHaveCount(0);
    const layers = blur.locator('[data-gradual-blur-layer]');
    const radii = await layers.evaluateAll(elements => elements.map(element =>
      Number(getComputedStyle(element).backdropFilter.match(/blur\(([\d.]+)px\)/)?.[1])
    ));
    expect(radii[0]).toBeLessThan(1);
    expect(radii.at(-1)).toBeGreaterThanOrEqual(32);
    expect(radii.every((radius, index) => index === 0 || radius > radii[index - 1])).toBe(true);
    await expect(layers.first()).toHaveCSS('mask-image', /transparent|rgba\(0, 0, 0, 0\)/);
    await expect(layers.last()).toHaveCSS('opacity', '1');
    await expect(layers.last()).toHaveCSS('transition-duration', '0s');

    for (const width of [1366, 390]) {
      await page.setViewportSize({ width, height: 844 });
      await page.locator('#manifesto').scrollIntoViewIfNeeded();
      await page.locator('#manifesto img').evaluate((image: HTMLImageElement) => image.decode());
      await page.mouse.move(width / 2, 830);
      await expect(layers.last()).toHaveCSS('backdrop-filter', 'blur(48px)');
      const box = await blur.boundingBox();
      expect(box!.height).toBeGreaterThanOrEqual(120);
      expect(box!.height).toBeLessThanOrEqual(240);
      const topBox = await page.locator('.landing-header-blur').boundingBox();
      expect(topBox!.y + topBox!.height).toBeLessThan(422);
      expect(box!.y).toBeGreaterThan(422);
      expect(await page.evaluate(() => document.elementFromPoint(innerWidth / 2, innerHeight - 14)?.closest('.gradual-blur') === null)).toBe(true);
      await page.screenshot({ path: testInfo.outputPath(`edge-blur-${theme}-${width}.png`) });
      await page.mouse.move(width / 2, 300);
      await expect(layers.last()).toHaveCSS('backdrop-filter', 'blur(48px)');
    }

    await page.evaluate(() => scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }));
    await expect.poll(() => blur.evaluate(root => (root as HTMLElement).style.getPropertyValue('--gradual-blur-reveal'))).toBe('0.000');
    await expect(layers.last()).toHaveCSS('backdrop-filter', 'blur(0px)');
    await expect(page.getByRole('contentinfo').getByRole('navigation', { name: 'Legal', exact: true })).toBeVisible();
  });
}

test('o rodapé mantém a navegação e exibe apenas o CNPJ nos dados cadastrais', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/criacao-de-sites');
  const footer = page.getByRole('contentinfo');
  await expect(footer.locator('p').filter({ hasText: 'CNPJ' })).toHaveText('CNPJ 69.194.842/0001-28');
  await expect(footer).not.toContainText('Rua Joaquim');
  await expect(footer).not.toContainText('CEP');
  await expect(footer.getByRole('navigation', { name: 'Legal', exact: true })).toBeVisible();
});
