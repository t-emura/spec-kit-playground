import { defineConfig } from '@playwright/test';

// Separate config for Electron e2e tests.
// Electron starts its own Fastify server internally, so no webServer is needed.
export default defineConfig({
  testDir: './tests/e2e',
  testMatch: '**/electron-app.spec.ts',
  fullyParallel: false,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 2 : 0,
  workers: 1,
  reporter: 'html',
  use: {
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'electron',
    },
  ],
});
