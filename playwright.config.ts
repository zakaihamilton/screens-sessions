import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3112';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  expect: {
    toHaveScreenshot: { animations: 'disabled', maxDiffPixelRatio: 0.03 },
  },
  use: { baseURL, trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run dev -- --hostname 127.0.0.1 --port 3112',
    url: `${baseURL}/?token=repnix-test-secret`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: { ADMIN_KEY: 'repnix-test-secret' },
  },
});
