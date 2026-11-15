import { expect, test } from '@playwright/test';
import { createHmac } from 'node:crypto';
import { createEntryToken } from '../../src/lib/site-entry';
import { entryFixtureSecret } from '../../playwright.entry.config';

test.beforeEach(async ({ page }) => {
  await page.route('https://challenges.cloudflare.com/**', route => route.fulfill({ contentType: 'application/javascript', body: `window.turnstile={render:function(target,options){window.entryOptions=options;document.querySelector(target).innerHTML='<button type="button" id="test-verify">Verificação de teste</button>';document.querySelector('#test-verify').onclick=function(){options.callback('browser-fixture-token')};return 'fixture';}};window.ezwayEntryReady();` }));
});

function clearance(userAgent: string) {
  const previous = process.env.SITE_ENTRY_SECRET;
  process.env.SITE_ENTRY_SECRET = entryFixtureSecret;
  try { return createEntryToken('clearance', userAgent).token; }
  finally { if (previous === undefined) delete process.env.SITE_ENTRY_SECRET; else process.env.SITE_ENTRY_SECRET = previous; }
}

test('fresh entry shows only verification, loads no home content/media and preserves the intended route', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', request => requests.push(request.url()));
  await page.goto('/placa-nfc?campaign=test');
  await expect(page).toHaveURL(/\/verificar\?next=/);
  await expect(page.getByRole('heading', { name: 'Verificação de segurança' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Verificação de teste' })).toBeVisible();
  await expect(page.locator('#hero, [data-presentation], .site-shell')).toHaveCount(0);
  expect(requests.some(url => /\/_next\/|\.mp4(?:\?|$)|\.woff2?(?:\?|$)/.test(url))).toBe(false);
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: `test-results/entry-${width}.png` });
  }
});

test('successful server confirmation opens the original page, and later navigation uses clearance', async ({ page, context }) => {
  await page.route('**/api/security/entry', async route => {
    expect(route.request().postDataJSON()).toEqual({ token: 'browser-fixture-token', next: '/placa-nfc?campaign=test' });
    const userAgent = route.request().headers()['user-agent'];
    await context.addCookies([{ name: 'ezway-clearance', value: clearance(userAgent), domain: 'localhost', path: '/', httpOnly: true, sameSite: 'Lax' }]);
    await route.fulfill({ json: { redirectTo: '/placa-nfc?campaign=test' } });
  });
  await page.goto('/placa-nfc?campaign=test');
  await page.getByRole('button', { name: 'Verificação de teste' }).click();
  await expect(page).toHaveURL('/placa-nfc?campaign=test');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Aproxime. Escaneie. Conecte.');
  await page.goto('/cardapio-digital');
  await expect(page).toHaveURL('/cardapio-digital');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('cardápio');
});

test('rejected confirmation and forged clearance keep the visitor outside the application', async ({ page, context }) => {
  await context.addCookies([{ name: 'ezway-clearance', value: createHmac('sha256', 'attacker').update('forged').digest('hex'), domain: 'localhost', path: '/' }]);
  await page.route('**/api/security/entry', route => route.fulfill({ status: 403, json: { error: 'Verificação recusada.' } }));
  await page.goto('/');
  await page.getByRole('button', { name: 'Verificação de teste' }).click();
  await expect(page.getByRole('status')).toHaveText('Verificação recusada.');
  await expect(page.getByRole('button', { name: 'Tentar novamente', exact: true })).toBeVisible();
  await expect(page).toHaveURL(/\/verificar\?/);
  await expect(page.locator('#hero')).toHaveCount(0);
});

test('HTTP and RSC requests without clearance never receive the home document', async ({ request }) => {
  for (const headers of [{}, { RSC: '1', 'Next-Router-Prefetch': '1', Accept: 'text/x-component' }] as Record<string, string>[]) {
    const response = await request.get('/', { headers, maxRedirects: 0 });
    expect(response.status()).toBe(303);
    expect(response.headers().location).toContain('/verificar?next=');
    expect(await response.text()).not.toContain('hero-title');
  }
  const denied = await request.post('/api/security/entry', { headers: { Origin: 'http://localhost:3110' }, data: { token: 'forged' } });
  expect(denied.status()).toBe(403);
  expect(denied.headers()['set-cookie']).toBeUndefined();
});
