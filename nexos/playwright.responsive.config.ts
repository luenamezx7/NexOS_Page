import { defineConfig } from '@playwright/test';

// Audit the running, normally configured local server without security overrides.
export default defineConfig({
  testDir: './tests/browser',
  testMatch: 'responsive-audit.spec.ts',
  workers: 1,
  timeout: 60000,
  outputDir: 'test-results/responsive-audit',
  use: {
    baseURL: 'http://localhost:3000',
    channel: 'chrome',
    hasTouch: true,
    screenshot: 'only-on-failure',
  },
});
