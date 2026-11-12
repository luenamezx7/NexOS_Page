import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/browser',
  workers: 1,
  use: { baseURL: `http://localhost:${process.env.PLAYWRIGHT_PORT || '3100'}`, viewport: { width: 1366, height: 768 }, screenshot: 'only-on-failure', channel: process.env.PLAYWRIGHT_CHANNEL || undefined },
  webServer: {
    command: `node --use-system-ca node_modules/next/dist/bin/next start -p ${process.env.PLAYWRIGHT_PORT || '3100'}`,
    url: `http://localhost:${process.env.PLAYWRIGHT_PORT || '3100'}/admin-dashboard-su/secure-entry`,
    reuseExistingServer: process.env.PLAYWRIGHT_REUSE_SERVER === 'true',
    env: { SITE_URL: 'http://localhost:3100', TURNSTILE_ENFORCED: 'false', SOCIAL_AUTH_USE_SUPABASE: 'false',
      GOOGLE_CLIENT_ID: 'browser-test-google-id', GOOGLE_CLIENT_SECRET: 'browser-test-google-secret' },
    timeout: 60000,
  },
});
