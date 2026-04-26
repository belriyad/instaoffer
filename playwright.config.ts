import { defineConfig, devices } from '@playwright/test';
import { config } from 'dotenv';
import path from 'path';

// Load .env.test so DEALER_EMAIL / DEALER_PASSWORD are available in auth.setup.ts
config({ path: path.resolve(__dirname, '.env.test') });

/**
 * InstaOffer – Playwright configuration
 * Docs: https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  reporter: [
    ['html', { open: 'never' }],
    ['list'],
  ],

  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
  },

  projects: [
    /* ── Setup project: authenticate once and store state ── */
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },

    /* ── Desktop browsers ── */
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'tests/.auth/dealer.json',
      },
      dependencies: ['setup'],
    },
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        storageState: 'tests/.auth/dealer.json',
      },
      dependencies: ['setup'],
    },
    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
        storageState: 'tests/.auth/dealer.json',
      },
      dependencies: ['setup'],
    },

    /* ── Mobile viewports ── */
    {
      name: 'mobile-chrome',
      use: {
        ...devices['Pixel 7'],
        storageState: 'tests/.auth/dealer.json',
      },
      dependencies: ['setup'],
    },
    {
      name: 'mobile-safari',
      use: {
        ...devices['iPhone 15'],
        storageState: 'tests/.auth/dealer.json',
      },
      dependencies: ['setup'],
    },

    /* ── Unauthenticated tests (public pages) ── */
    {
      name: 'public',
      testMatch: /.*\.public\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
