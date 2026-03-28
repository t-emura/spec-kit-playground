import { test, expect } from '@playwright/test';
import { createNote, addItem } from './fixtures.js';

test.describe('Performance Baselines', () => {
  test('outline renders 20 items without visible lag', async ({ page }) => {
    await page.goto('/');
    await createNote(page, 'Performance Test');

    // Add 20 items
    for (let i = 1; i <= 20; i++) {
      await addItem(page, `Performance item ${i}`);
    }

    // All items are visible
    await expect(page.locator('[data-testid^="outline-item-"]')).toHaveCount(20);
  });

  test('collapse/expand responds within 500ms', async ({ page }) => {
    await page.goto('/');
    await createNote(page, 'Collapse Performance');
    await addItem(page, 'Parent item');
    await addItem(page, 'Child item');

    // Indent child so parent has children
    await page.locator('[data-testid^="outline-item-"]').last().locator('input').click();
    await page.keyboard.press('Tab');
    await expect(page.locator('[data-testid^="outline-item-"]').last())
      .toHaveAttribute('data-depth', '1', { timeout: 5000 });

    // Measure collapse time
    const collapseBtn = page.locator('[data-testid^="collapse-toggle-"]').first();
    await expect(collapseBtn).toBeVisible();

    const start = Date.now();
    await collapseBtn.click();
    await expect(page.locator('[data-testid^="outline-item-"]')).toHaveCount(1, { timeout: 500 });
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThanOrEqual(500);
  });
});
