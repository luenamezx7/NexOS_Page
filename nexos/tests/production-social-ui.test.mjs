import test from 'node:test';
import assert from 'node:assert/strict';
import { chromium, expect } from '@playwright/test';

const site = new URL(process.env.AUTH_SMOKE_URL || 'https://nexoslab.online');
assert.equal(site.protocol, 'https:', 'A homologação remota exige HTTPS.');

test('produção: o visitante recebe apenas a verificação antes de qualquer página', { timeout: 120000 }, async () => {
  const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || undefined });
  try {
    const context = await browser.newContext();
    try {
      const page = await context.newPage();
      await page.route('https://challenges.cloudflare.com/**', route => route.abort());
      for (const path of ['/', '/portal/acesso', '/portal/acesso?mode=signup', '/admin-dashboard-su/secure-entry']) {
        await page.goto(new URL(path, site).href);
        await expect(page).toHaveURL(/\/verificar\?next=/);
        await expect(page.getByRole('heading', { name: 'Verificação de segurança' })).toBeVisible();
        await expect(page.locator('#hero, .site-shell, form')).toHaveCount(0);
        await expect(page.locator('script[src*="/_next/"]')).toHaveCount(0);
      }
    } finally { await context.close(); }
  } finally { await browser.close(); }
});
