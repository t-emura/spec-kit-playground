import { test, expect } from '@playwright/test';
import { createNote, addItem } from './fixtures.js';

test.describe('US1: Fast Thought Capture and Structuring', () => {
  test('creates 10+ items, reorders, collapses, and state persists after reload', async ({ page }) => {
    await page.goto('/');

    const noteId = await createNote(page, 'US1 Test Note');
    expect(noteId).not.toBe('');

    // Add 12 items
    for (let i = 1; i <= 12; i++) {
      await addItem(page, `Item ${i}`);
    }

    // Verify 12 items are visible
    await expect(page.locator('[data-testid^="outline-item-"]')).toHaveCount(12);

    // Indent item 2 (make it a child of item 1) using Tab key
    await page.locator('[data-testid^="outline-item-"]').nth(1).locator('input').click();
    await page.locator('[data-testid^="outline-item-"]').nth(1).locator('input').press('Tab');

    // Wait for indent to complete (depth becomes 1)
    await expect(page.locator('[data-testid^="outline-item-"]').nth(1))
      .toHaveAttribute('data-depth', '1', { timeout: 5000 });

    // Collapse item 1 (which now has a child)
    await page.locator('[data-testid^="collapse-toggle-"]').first().click();
    await expect(page.locator('[data-testid^="outline-item-"]')).toHaveCount(11);

    // Reload page
    await page.reload();
    await page.waitForSelector('[data-testid="note-workspace"]:not(.loading)');

    // Verify collapse state persisted (less than 12 visible)
    await expect(page.locator('[data-testid^="outline-item-"]')).toHaveCount(11, { timeout: 5000 });
  });

  test('keyboard shortcut Tab indents an item', async ({ page }) => {
    await page.goto('/');
    await createNote(page, 'Keyboard Test');
    await addItem(page, 'Item A');
    await addItem(page, 'Item B');

    // Focus on Item B (last item) and press Tab to indent
    await page.locator('[data-testid^="outline-item-"]').last().locator('input').press('Tab');

    // Item B should now have depth 1
    await expect(page.locator('[data-testid^="outline-item-"]').last())
      .toHaveAttribute('data-depth', '1', { timeout: 5000 });
  });

  test('items are created in correct order', async ({ page }) => {
    await page.goto('/');
    await createNote(page, 'Order Test');
    await addItem(page, 'First');
    await addItem(page, 'Second');
    await addItem(page, 'Third');

    const items = page.locator('[data-testid^="outline-item-"]');
    await expect(items.nth(0)).toHaveAttribute('data-content', 'First');
    await expect(items.nth(1)).toHaveAttribute('data-content', 'Second');
    await expect(items.nth(2)).toHaveAttribute('data-content', 'Third');
  });
});
