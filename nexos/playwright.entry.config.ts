import { defineConfig } from '@playwright/test';

export const entryFixtureSecret = 'local-entry-browser-fixture-secret-64-characters-only';
export default defineConfig({
  testDir: './tests/entry',
  workers: 1,
  use: { baseURL: 'http://localhost:3110', channel: process.env.PLAYWRIGHT_CHANNEL || undefined, screenshot: 'only-on-failure' },
  webServer: {
    command: 'node --use-system-ca node_modules/next/dist/bin/next start -p 3110',
    url: 'http://localhost:3110/verificar',
    timeout: 60000,
    env: {
      SITE_URL: 'http://localhost:3110', NEXT_PUBLIC_SITE_URL: 'http://localhost:3110',
      SITE_ENTRY_ENFORCED: 'true', SITE_ENTRY_SECRET: entryFixtureSecret,
      TURNSTILE_SECRET_KEY: 'local-entry-browser-fixture-secret', NEXT_PUBLIC_TURNSTILE_SITE_KEY: '1x00000000000000000000AA',
      TURNSTILE_ENFORCED: 'false',
    },
  },
});
