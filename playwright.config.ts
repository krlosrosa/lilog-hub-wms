import { defineConfig, devices } from '@playwright/test';

const webBaseUrl = process.env.E2E_WEB_URL ?? 'http://localhost:3000';
const pwaBaseUrl = process.env.E2E_PWA_URL ?? 'http://localhost:5174';

export default defineConfig({
  testDir: './e2e/tests',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  timeout: 180_000,
  expect: {
    timeout: 30_000,
  },
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 20_000,
    navigationTimeout: 45_000,
  },
  globalSetup: './e2e/global-setup.ts',
  projects: [
    {
      name: 'recebimento-rc-full-flow',
      testMatch: 'recebimento-rc-full-flow.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'e2e/.auth/web.json',
      },
    },
  ],
  webServer: [
    {
      command: 'pnpm --filter web dev',
      url: webBaseUrl,
      reuseExistingServer: true,
      timeout: 120_000,
    },
    {
      command: 'pnpm --filter pwa dev',
      url: pwaBaseUrl,
      reuseExistingServer: true,
      timeout: 120_000,
    },
  ],
});

export { webBaseUrl, pwaBaseUrl };
