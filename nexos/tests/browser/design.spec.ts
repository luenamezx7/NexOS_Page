import { test, expect, type Page } from '@playwright/test';

async function noOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
}

async function skipIntro(page: Page, theme = 'dark') {
  await page.addInitScript(theme => {
    sessionStorage.setItem('nexos-boot-seen', '1');
    localStorage.setItem('nexos-theme', theme);
  }, theme);
}

test('stage 2: header alignment and mobile navigation', async ({ page }) => {
  await skipIntro(page);
  await page.goto('/');
  const header = page.getByRole('banner');
  await expect(header).toBeVisible();
  for (const width of [320, 390, 768, 1024, 1280, 1536]) {
    await page.setViewportSize({ width, height: 900 });
    const account = header.getByRole('link', { name: 'Minha conta' });
    const theme = header.getByRole('button', { name: 'Ativar modo claro' });
    const a = await account.boundingBox();
    const b = await theme.boundingBox();
    expect(Math.abs(a!.y + a!.height / 2 - b!.y - b!.height / 2)).toBeLessThan(2);
    expect(Math.round(a!.height)).toBeGreaterThanOrEqual(44);
    await noOverflow(page);
    if (width < 1200) {
      await header.getByRole('button', { name: 'Abrir menu' }).click();
      await expect(page.getByRole('navigation', { name: 'Navegação móvel' })).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(page.getByRole('navigation', { name: 'Navegação móvel' })).toHaveCount(0);
    }
  }
  await page.screenshot({ path: 'test-results/header-desktop.png' });
});

test('stage 3: customer login is compact, theme-aware and functional', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await skipIntro(page, 'light');
  await page.goto('/portal/acesso');
  await page.getByRole('button', { name: 'Recusar', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Entrar na sua conta' })).toBeVisible();
  const submit = page.getByRole('button', { name: 'Entrar', exact: true });
  const box = await submit.boundingBox();
  expect(box!.y + box!.height).toBeLessThan(844);
  expect(await page.getByLabel('Senha', { exact: true }).evaluate(el => getComputedStyle(el).fontSize)).toBe('16px');
  await noOverflow(page);
  await page.waitForTimeout(600);
  await page.screenshot({ path: 'test-results/login-redesign-light.png', fullPage: true });
  await page.getByRole('button', { name: 'Ativar modo escuro' }).click();
  await expect(page.locator('html')).toHaveClass(/dark/);
  await page.waitForTimeout(600);
  await page.screenshot({ path: 'test-results/login-redesign-dark.png', fullPage: true });
  await page.getByRole('button', { name: 'Criar uma conta', exact: true }).click();
  await page.getByLabel('Senha', { exact: true }).fill('curta');
  await expect(page.getByText('Mínimo de 12 caracteres', { exact: false })).toBeVisible();
  await noOverflow(page);
});

test('stage 1: intro keeps its sequence and completes on mobile', async ({ page }) => {
  test.setTimeout(60000);
  await page.setViewportSize({ width: 360, height: 780 });
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Continuar para o site' })).toBeVisible({ timeout: 20000 });
  await noOverflow(page);
  const title = page.getByRole('heading', { name: 'NexOS, a performance que seu business merece.' });
  const box = await title.boundingBox();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(360);
  await page.getByRole('button', { name: 'Continuar para o site' }).evaluate(el => el.getAnimations().forEach(a => a.finish()));
  await page.waitForTimeout(1200);
  await page.screenshot({ path: 'test-results/intro-mobile.png' });
  await page.getByRole('button', { name: 'Continuar para o site' }).click();
  await expect(page.getByRole('banner')).toBeVisible({ timeout: 15000 });
  expect(await page.evaluate(() => sessionStorage.getItem('nexos-boot-seen'))).toBe('1');
  await page.reload();
  await expect(page.getByRole('banner')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Continuar para o site' })).toHaveCount(0);
});

test('stage 4: plate showcase and services stay clear at every breakpoint', async ({ page }) => {
  test.setTimeout(60000);
  await skipIntro(page, 'light');
  await page.goto('/');
  await page.getByRole('button', { name: 'Recusar', exact: true }).click().catch(() => {});

  const showcase = page.locator('#showcase');
  await expect(showcase).toBeVisible();
  await expect(showcase.getByRole('img', { name: /Placa NexOS/ })).toBeVisible();
  await expect(showcase.getByRole('heading', { name: 'Seu próximo contato.' })).toBeVisible();

  const total = showcase.getByTestId('plate-total');
  await expect(total).toHaveText(/R\$\s?69,90/);
  await showcase.getByRole('button', { name: 'Aumentar quantidade' }).click();
  await showcase.getByRole('button', { name: 'Aumentar quantidade' }).click();
  await showcase.getByRole('button', { name: 'Aumentar quantidade' }).click();
  await expect(total).toHaveText(/R\$\s?279,60/);
  await showcase.getByRole('button', { name: 'Diminuir quantidade' }).click();
  await expect(total).toHaveText(/R\$\s?209,70/);
  await expect(showcase.getByRole('button', { name: /Comprar placa/ })).toBeVisible();
  await expect(showcase.getByRole('link', { name: /Personalizar minha placa/ })).toBeVisible();

  const tablist = showcase.getByRole('tablist', { name: 'Detalhes da placa' });
  await expect(tablist).toBeVisible();
  await tablist.getByRole('tab', { name: 'Sua marca' }).click();
  await expect(showcase.getByRole('tabpanel', { name: /Sua marca/ })).toBeVisible();
  await expect(showcase.getByRole('tabpanel', { name: /Como funciona/ })).toBeHidden();
  await tablist.getByRole('tab', { name: 'Em quantidade' }).click();
  await expect(showcase.getByRole('tabpanel', { name: /Em quantidade/ })).toBeVisible();

  const services = page.locator('#services');
  await expect(services).toBeVisible();
  await expect(services.getByRole('heading', { name: 'Ideias boas merecem' })).toBeVisible();
  await expect(services.getByRole('article', { name: /Desenvolvimento NexOS/ })).toBeVisible();
  await expect(services.getByRole('button', { name: /Iniciar projeto/ })).toBeVisible();
  await expect(services.getByRole('article', { name: /TESTE CHECKOUT|Teste de checkout/ })).toBeVisible();

  for (const width of [320, 360, 390, 768, 1024, 1280, 1536]) {
    await page.setViewportSize({ width, height: 900 });
    await noOverflow(page);
    const buy = showcase.getByRole('button', { name: /Comprar placa/ });
    const box = await buy.boundingBox();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(width);
    expect(box!.height).toBeGreaterThanOrEqual(44);
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await showcase.scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  await page.screenshot({ path: 'test-results/showcase-mobile-light.png', fullPage: false });
  await page.locator('#services').scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  await page.screenshot({ path: 'test-results/services-mobile-light.png', fullPage: false });

  await page.setViewportSize({ width: 1440, height: 900 });
  await showcase.scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  await page.screenshot({ path: 'test-results/showcase-desktop-light.png', fullPage: false });
  await page.locator('#services').scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  await page.screenshot({ path: 'test-results/services-desktop-light.png', fullPage: false });
});

const WIDTHS = [320, 360, 390, 768, 1024, 1280, 1536] as const;

async function assertNoViewportLeaks(page: Page, width: number) {
  await noOverflow(page);
  const leaks = await page.evaluate(() => {
    const vw = window.innerWidth;
    const bad: string[] = [];
    const selectors = 'h1, h2, h3, p, a, button, input, textarea, img, [role="tab"]';
    for (const el of document.querySelectorAll<HTMLElement>(selectors)) {
      const style = getComputedStyle(el);
      if (style.visibility === 'hidden' || style.display === 'none' || style.opacity === '0') continue;
      if (el.closest('[aria-hidden="true"]') || el.hasAttribute('aria-hidden')) continue;
      let scrollAncestor: HTMLElement | null = el.parentElement;
      let inHorizontalScroll = false;
      while (scrollAncestor) {
        const ox = getComputedStyle(scrollAncestor).overflowX;
        if (ox === 'auto' || ox === 'scroll') { inHorizontalScroll = true; break; }
        scrollAncestor = scrollAncestor.parentElement;
      }
      if (inHorizontalScroll) continue;
      const r = el.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) continue;
      if (r.right > vw + 1 || r.left < -1) {
        const id = el.id ? `#${el.id}` : '';
        const cls = typeof el.className === 'string' && el.className ? `.${el.className.split(/\s+/)[0]}` : '';
        bad.push(`${el.tagName.toLowerCase()}${id}${cls} [${Math.round(r.left)}..${Math.round(r.right)}] "${(el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 40)}"`);
      }
      if (bad.length >= 6) break;
    }
    return bad;
  });
  expect(leaks, `viewport ${width}px leaks: ${leaks.join(' | ')}`).toEqual([]);
}

test('stage 5: full-page resolution sweep keeps layout and CTAs intact', async ({ page }) => {
  test.setTimeout(120000);
  await skipIntro(page, 'dark');
  await page.goto('/');
  await page.getByRole('button', { name: 'Recusar', exact: true }).click().catch(() => {});

  const sections = ['#hero', '#showcase', '#services', '#testimonials', '#faq', '#contact'];
  for (const width of WIDTHS) {
    await page.setViewportSize({ width, height: 900 });
    await page.waitForTimeout(250);
    await assertNoViewportLeaks(page, width);

    for (const selector of sections) {
      const section = page.locator(selector);
      if ((await section.count()) === 0) continue;
      await section.scrollIntoViewIfNeeded();
      await page.waitForTimeout(120);
      await assertNoViewportLeaks(page, width);
    }

    const buy = page.getByRole('button', { name: /Comprar placa/ });
    const buyBox = await buy.boundingBox();
    expect(buyBox, `CTA placa @${width}`).toBeTruthy();
    expect(buyBox!.x).toBeGreaterThanOrEqual(0);
    expect(buyBox!.x + buyBox!.width).toBeLessThanOrEqual(width + 1);
    expect(buyBox!.height).toBeGreaterThanOrEqual(44);

    const hire = page.getByRole('button', { name: /Iniciar projeto/ });
    const hireBox = await hire.boundingBox();
    expect(hireBox, `CTA dev @${width}`).toBeTruthy();
    expect(hireBox!.x + hireBox!.width).toBeLessThanOrEqual(width + 1);
    expect(hireBox!.height).toBeGreaterThanOrEqual(44);

    const heading = page.locator('#showcase-title');
    const hbox = await heading.boundingBox();
    expect(hbox!.x).toBeGreaterThanOrEqual(-1);
    expect(hbox!.x + hbox!.width).toBeLessThanOrEqual(width + 1);

    const contactTitle = page.locator('#contact-title');
    if ((await contactTitle.count()) > 0) {
      await contactTitle.scrollIntoViewIfNeeded();
      const cbox = await contactTitle.boundingBox();
      expect(cbox!.x + cbox!.width).toBeLessThanOrEqual(width + 1);
    }
  }

  await page.setViewportSize({ width: 320, height: 720 });
  await page.goto('/');
  await page.waitForTimeout(300);
  await page.screenshot({ path: 'test-results/sweep-320-dark.png', fullPage: true });

  await page.setViewportSize({ width: 768, height: 900 });
  await page.goto('/');
  await page.waitForTimeout(300);
  await page.screenshot({ path: 'test-results/sweep-768-dark.png', fullPage: true });

  await page.setViewportSize({ width: 1536, height: 900 });
  await page.goto('/');
  await page.waitForTimeout(300);
  await page.screenshot({ path: 'test-results/sweep-1536-dark.png', fullPage: true });

  await page.evaluate(() => localStorage.setItem('nexos-theme', 'light'));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.waitForTimeout(300);
  await page.screenshot({ path: 'test-results/sweep-390-light.png', fullPage: true });
});

test('stage 6: FAQ accordion and contact funnel stay usable end to end', async ({ page }) => {
  test.setTimeout(90000);
  await skipIntro(page, 'light');
  await page.goto('/');
  await page.getByRole('button', { name: 'Recusar', exact: true }).click().catch(() => {});

  const faq = page.locator('#faq');
  await expect(faq).toBeVisible();
  await expect(faq.getByRole('heading', { name: 'Perguntas frequentes.' })).toBeVisible();
  await expect(faq.getByRole('link', { name: /Falar com a gente/ }).first()).toBeVisible();

  const first = faq.getByRole('button', { name: /O que está incluso/ });
  const second = faq.getByRole('button', { name: /Como funciona a Placa/ });
  await expect(first).toHaveAttribute('aria-expanded', 'true');
  await second.click();
  await expect(second).toHaveAttribute('aria-expanded', 'true');
  await expect(first).toHaveAttribute('aria-expanded', 'false');
  await expect(faq.getByText(/Acrílico cristal cortado/)).toBeVisible();
  await expect(faq.getByText(/Entrega sob medida/)).toBeHidden();
  await second.click();
  await expect(second).toHaveAttribute('aria-expanded', 'false');

  const contact = page.locator('#contact');
  await expect(contact).toBeVisible();
  await expect(contact.getByRole('heading', { name: 'Vamos conversar?' })).toBeVisible();
  await expect(contact.getByRole('link', { name: /WhatsApp/ }).first()).toBeVisible();
  await expect(contact.getByRole('link', { name: /Ver dúvidas frequentes/ })).toBeVisible();

  await contact.getByRole('button', { name: /Enviar projeto/ }).click();
  await expect(contact.getByText('Nome é obrigatório')).toBeVisible();
  await expect(contact.getByText('E-mail é obrigatório')).toBeVisible();
  await expect(contact.getByText('Mensagem é obrigatória')).toBeVisible();

  await contact.getByLabel('Nome completo *').fill('Ana Silva');
  await contact.getByLabel('E-mail corporativo *').fill('ana@empresa.com');
  await contact.getByLabel('Mensagem *').fill('Quero uma landing page para minha marca.');
  await expect(contact.getByText('Nome é obrigatório')).toHaveCount(0);

  for (const width of [320, 390, 768, 1024, 1280, 1536]) {
    await page.setViewportSize({ width, height: 900 });
    await noOverflow(page);
    await faq.scrollIntoViewIfNeeded();
    await noOverflow(page);
    await contact.scrollIntoViewIfNeeded();
    await noOverflow(page);
    const send = contact.getByRole('button', { name: /Enviar projeto/ });
    const box = await send.boundingBox();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(width + 1);
    expect(box!.height).toBeGreaterThanOrEqual(44);
  }

  const cookieBtn = page.getByRole('button', { name: 'Gerenciar cookies' });
  await cookieBtn.scrollIntoViewIfNeeded();
  const cookieBox = await cookieBtn.boundingBox();
  expect(cookieBox!.height).toBeGreaterThanOrEqual(44);

  await page.setViewportSize({ width: 390, height: 844 });
  await faq.scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  await page.screenshot({ path: 'test-results/faq-mobile-light.png' });
  await contact.scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  await page.screenshot({ path: 'test-results/contact-mobile-light.png' });

  await page.setViewportSize({ width: 1440, height: 900 });
  await contact.scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  await page.screenshot({ path: 'test-results/contact-desktop-light.png' });
});

test('stage 7: benefits bento, ecosystem terminal and footer stay coherent', async ({ page }) => {
  test.setTimeout(90000);
  await skipIntro(page, 'dark');
  await page.goto('/');
  await page.getByRole('button', { name: 'Recusar', exact: true }).click().catch(() => {});

  const benefits = page.locator('#benefits-title');
  await expect(benefits).toBeVisible();
  const bento = page.getByRole('article', { name: /Controle total do seu branding/ });
  await expect(bento).toBeVisible();
  await expect(bento.getByRole('button', { name: 'Ver Serviços' })).toBeVisible();
  const featured = page.getByRole('article', { name: /Performance que gera valor/ });
  await expect(featured).toBeVisible();
  await expect(page.getByRole('article', { name: /A melhor estratégia para seu Business/ }).first()).toBeVisible();

  const eco = page.locator('#testimonials');
  await expect(eco).toBeVisible();
  await expect(eco.getByRole('heading', { name: 'Três pilares.' })).toBeVisible();
  await expect(eco.getByRole('region', { name: /terminal/ })).toBeVisible();
  await expect(eco.getByRole('button', { name: /Copiar pilares/ })).toBeVisible();
  await expect(eco.getByRole('button', { name: 'Adquirir em Lote' })).toBeVisible();
  await eco.getByRole('button', { name: /Copiar pilares/ }).click();
  await expect(eco.getByRole('button', { name: /Pilares copiados|Copiado/ })).toBeVisible();

  for (const width of [320, 390, 768, 1024, 1280, 1536]) {
    await page.setViewportSize({ width, height: 900 });
    await noOverflow(page);
    await benefits.scrollIntoViewIfNeeded();
    await noOverflow(page);
    await eco.scrollIntoViewIfNeeded();
    await noOverflow(page);
    const action = eco.getByRole('button', { name: 'Adquirir em Lote' });
    const box = await action.boundingBox();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(width + 1);
    expect(box!.height).toBeGreaterThanOrEqual(44);
  }

  const cookie = page.getByRole('button', { name: 'Gerenciar cookies' });
  await cookie.scrollIntoViewIfNeeded();
  await expect(cookie).toBeVisible();
  await expect(page.getByRole('contentinfo')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Política de Privacidade' }).last()).toBeVisible();

  await page.setViewportSize({ width: 390, height: 844 });
  await benefits.scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  await page.screenshot({ path: 'test-results/benefits-mobile-dark.png' });
  await eco.scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  await page.screenshot({ path: 'test-results/ecosystem-mobile-dark.png' });

  await page.setViewportSize({ width: 1440, height: 900 });
  await eco.scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  await page.screenshot({ path: 'test-results/ecosystem-desktop-dark.png' });
  await cookie.scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  await page.screenshot({ path: 'test-results/footer-desktop-dark.png' });
});
