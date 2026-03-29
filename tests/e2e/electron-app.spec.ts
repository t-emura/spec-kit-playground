import { test, expect } from '@playwright/test';
import { _electron as electron } from 'playwright';
import { execSync } from 'child_process';
import { join } from 'path';

const REPO_ROOT = join(__dirname, '../..');
const IS_CI = !!process.env['CI'];

test.describe('Electron App Smoke Test', () => {
  test.beforeAll(async () => {
    // In CI the build is done as a workflow step before this test runs.
    // Locally we build here so the test is self-contained.
    if (!IS_CI) {
      test.setTimeout(180_000); // allow up to 3 min for local build
      execSync('npm run build', { cwd: REPO_ROOT, stdio: 'inherit', timeout: 150_000 });
    }
  });

  test('app launches, exposes apiBase, and API responds (SC-002)', async () => {
    // Electron startup via xvfb in CI is slower than real hardware — give it 2 minutes
    test.setTimeout(120_000);

    const startTime = Date.now();

    const stderrLines: string[] = [];
    const app = await electron.launch({
      args: [
        REPO_ROOT,
        '--no-sandbox',
        '--disable-setuid-sandbox',
      ],
      env: {
        ...process.env,
        // Tell startup-checks to skip blocking dialogs in CI/test environments
        ELECTRON_NO_DIALOG: '1',
      },
    });

    // Capture Electron stderr for diagnostics on failure
    app.process().stderr?.on('data', (d: Buffer) => stderrLines.push(d.toString()));

    // (a) BrowserWindow opens — wait for first window before querying
    const page = await app.firstWindow({ timeout: 90_000 }).catch((err) => {
      console.error('[e2e] firstWindow failed. Electron stderr:', stderrLines.join(''));
      throw err;
    });
    await page.waitForLoadState('domcontentloaded');
    expect(app.windows().length).toBeGreaterThanOrEqual(1);

    // (b) window.electron.apiBase is set in http://127.0.0.1:{port} format
    // preload init() is async (ipcRenderer.invoke), so wait for it to resolve
    await page.waitForFunction(() => !!(window as any).electron?.apiBase, { timeout: 15_000 });
    const apiBase = await page.evaluate(() => (window as any).electron?.apiBase as string);
    expect(apiBase).toMatch(/^http:\/\/127\.0\.0\.1:\d+$/);

    const elapsedMs = Date.now() - startTime;

    // (c) GET {apiBase}/v1/notes returns 200
    const response = await page.evaluate(async (base: string) => {
      const res = await fetch(`${base}/v1/notes`);
      return { status: res.status };
    }, apiBase);
    expect(response.status).toBe(200);

    // (d) SC-002: startup to apiBase available < 30s (on real hardware; skip in CI)
    if (!IS_CI) {
      expect(elapsedMs).toBeLessThan(30_000);
    }

    await app.close();
  });
});
