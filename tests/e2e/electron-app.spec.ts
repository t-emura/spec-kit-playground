import { test, expect } from '@playwright/test';
import { _electron as electron } from 'playwright';
import { execSync } from 'child_process';
import { join } from 'path';

const REPO_ROOT = join(__dirname, '../..');

test.describe('Electron App Smoke Test', () => {
  test.beforeAll(() => {
    // Ensure the app is built before launching
    execSync('npm run build', { cwd: REPO_ROOT, stdio: 'inherit' });
  });

  test('app launches, exposes apiBase, and API responds (SC-002)', async () => {
    const startTime = Date.now();

    const app = await electron.launch({ args: [REPO_ROOT] });

    // (a) BrowserWindow opens
    const windows = app.windows();
    expect(windows.length).toBeGreaterThanOrEqual(1);
    const page = await app.firstWindow();
    await page.waitForLoadState('domcontentloaded');

    // (b) window.electron.apiBase is set in http://127.0.0.1:{port} format
    const apiBase = await page.evaluate(() => (window as any).electron?.apiBase as string);
    expect(apiBase).toMatch(/^http:\/\/127\.0\.0\.1:\d+$/);

    const elapsedMs = Date.now() - startTime;

    // (c) GET {apiBase}/v1/notes returns 200
    const response = await page.evaluate(async (base: string) => {
      const res = await fetch(`${base}/v1/notes`);
      return { status: res.status };
    }, apiBase);
    expect(response.status).toBe(200);

    // (d) SC-002: startup to apiBase available < 30s
    expect(elapsedMs).toBeLessThan(30_000);

    await app.close();
  });
});
