import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/browser',
  timeout: 60000,
  fullyParallel: true,
  workers: process.env.CI ? 2 : 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list']],
  use: {
    baseURL: process.env.TEST_URL || 'http://localhost:5173',
    browserName: 'chromium',
    viewport: { width: 1440, height: 1000 },
    reducedMotion: 'reduce',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 15000,
  },
});
