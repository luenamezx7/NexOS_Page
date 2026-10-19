import { expect, test } from '@playwright/test';

test.setTimeout(60000);

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('nexos-theme', 'light');
    localStorage.setItem('nexos-cookie-consent-v1', JSON.stringify({ necessary: true, functional: false, analytics: false, marketing: false, updatedAt: new Date().toISOString() }));
  });
});

test('a abertura não mantém efeitos WebGL e blurs da home trabalhando por baixo', async ({ page }) => {
  await page.goto('/');
  const dialog = page.getByRole('dialog', { name: 'Apresentação NexOS' });
  await expect(dialog.locator('[data-topography]')).toHaveAttribute('data-motion', 'animated');
  await expect(page.locator('[data-scene="waves"] [data-topography]')).toHaveCount(0);
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

test('o gradiente de blur recortado preserva a aparência da composição original', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/#hero');
  const blur = page.locator('.hero-ascii .gradual-blur');
  await expect(blur).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  const optimized = await blur.screenshot();
  await blur.evaluate(root => {
    const layers = [...root.querySelectorAll<HTMLElement>('[data-gradual-blur-layer]')];
    layers.forEach((layer, index) => {
      Object.assign(layer.style, { inset: '0', width: 'auto', height: 'auto', maskImage: `linear-gradient(to bottom, transparent ${index / layers.length * 100}%, #000 ${(index + 1) / layers.length * 100}%)` });
    });
  });
  const original = await blur.screenshot();
  const difference = await page.evaluate(async ({ a, b }) => {
    const pixels = async (data: number[]) => {
      const image = await createImageBitmap(new Blob([new Uint8Array(data)], { type: 'image/png' }));
      const canvas = new OffscreenCanvas(image.width, image.height);
      const context = canvas.getContext('2d')!;
      context.drawImage(image, 0, 0); image.close();
      return context.getImageData(0, 0, canvas.width, canvas.height).data;
    };
    const left = await pixels(a), right = await pixels(b);
    let delta = 0;
    for (let i = 0; i < left.length; i++) delta += Math.abs(left[i] - right[i]);
    return delta / left.length;
  }, { a: [...optimized], b: [...original] });
  expect(difference).toBeLessThan(1);
});

for (const theme of ['light', 'dark']) {
  test(`blur com bloom ${theme} reage ao cursor e desaparece no fim da página`, async ({ page }, testInfo) => {
    await page.addInitScript(theme => localStorage.setItem('nexos-theme', theme), theme);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/#hero');
    const blur = page.locator('.landing-edge-blur');
    const bloom = blur.locator('.gradual-blur-bloom');
    await expect(blur).toBeVisible();
    await expect(blur.locator('[data-gradual-blur-layer]')).toHaveCount(8);
    await expect.poll(() => blur.evaluate(root => (root as HTMLElement).style.getPropertyValue('--gradual-blur-reveal'))).toBe('1.000');
    await expect(bloom).toHaveCSS('opacity', '0.12');
    await expect(bloom).toHaveCSS('transition-duration', '0s');
    await expect(blur.locator('[data-gradual-blur-layer]').last()).toHaveCSS('backdrop-filter', /brightness\(1\.0/);

    for (const width of [1366, 390]) {
      await page.setViewportSize({ width, height: 844 });
      await page.mouse.move(width / 2, 830);
      await expect.poll(() => blur.evaluate(root => (root as HTMLElement).style.getPropertyValue('--gradual-blur-hover'))).toBe('1.2');
      expect(await page.evaluate(() => document.elementFromPoint(innerWidth / 2, innerHeight - 14)?.closest('.gradual-blur') === null)).toBe(true);
      await page.screenshot({ path: testInfo.outputPath(`bloom-${theme}-${width}.png`) });
      await page.mouse.move(width / 2, 300);
      await expect(bloom).toHaveCSS('opacity', '0.12');
    }

    await page.evaluate(() => scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }));
    await expect.poll(() => blur.evaluate(root => (root as HTMLElement).style.getPropertyValue('--gradual-blur-reveal'))).toBe('0.000');
    await expect(bloom).toHaveCSS('opacity', '0');
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
