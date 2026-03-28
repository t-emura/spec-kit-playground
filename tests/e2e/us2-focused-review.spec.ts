import { test, expect } from '@playwright/test';
import { createNote, addItem } from './fixtures.js';

test.describe('US2: Focused Review with Visual Clarity', () => {
  test('searches outline, navigates results, and persists highlight', async ({ page }) => {
    await page.goto('/');

    await createNote(page, 'US2 Outline');
    for (let i = 1; i <= 10; i++) {
      await addItem(page, i % 3 === 0 ? `Important: item ${i}` : `Regular item ${i}`);
    }

    // Open search panel with Ctrl+F
    await page.keyboard.press('Control+f');
    await expect(page.locator('[role="searchbox"]')).toBeVisible();

    // Search for "Important"
    await page.fill('[role="searchbox"]', 'Important');
    await expect(page.locator('.search-result-item')).toHaveCount(3, { timeout: 5000 });

    // Click first result to navigate to it
    await page.click('.search-result-item');
    await expect(page.locator('.search-match').first()).toBeVisible();
  });

  test('search panel clears results when query is cleared', async ({ page }) => {
    await page.goto('/');
    await createNote(page, 'Search Clear Test');
    await addItem(page, 'Findable item');
    await addItem(page, 'Another item');

    await page.keyboard.press('Control+f');
    await page.fill('[role="searchbox"]', 'Findable');
    await expect(page.locator('.search-result-item')).toHaveCount(1, { timeout: 5000 });

    // Clear search
    await page.fill('[role="searchbox"]', '');
    await expect(page.locator('.search-result-item')).toHaveCount(0);
  });
});
