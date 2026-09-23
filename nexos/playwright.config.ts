import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/browser',
  workers: 1,
  use: { baseURL: 'http://localhost:3100', viewport: { width: 1366, height: 768 }, screenshot: 'only-on-failure' },
  webServer: {
    command: 'node --use-system-ca node_modules/next/dist/bin/next start -p 3100',
    url: 'http://localhost:3100/login',
    reuseExistingServer: false,
    env: { SITE_URL: 'http://localhost:3100' },
    timeout: 60000,
  },
});
