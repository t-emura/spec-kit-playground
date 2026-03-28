import { test, expect, type Page } from '@playwright/test';

/** Fixture helpers shared across E2E specs */

export async function createNote(page: Page, title: string): Promise<string> {
  await page.click('[data-testid="new-note-btn"]');
  await page.fill('[data-testid="note-title-input"]', title);
  await page.click('[data-testid="note-create-submit"]');
  // Wait for workspace to load fully (not the loading state)
  await page.waitForSelector('[data-testid="note-workspace"]:not(.loading)', { timeout: 10000 });
  const noteId = await page.getAttribute('[data-testid="note-workspace"]', 'data-note-id');
  return noteId ?? '';
}

export async function addItem(page: Page, content: string): Promise<void> {
  const addFirstBtn = page.locator('[data-testid="add-first-item"]');
  const isFirst = await addFirstBtn.isVisible({ timeout: 500 }).catch(() => false);

  const countBefore = await page.locator('[data-testid^="outline-item-"]').count();

  if (isFirst) {
    await addFirstBtn.click();
  } else {
    await page.keyboard.press('Enter');
  }

  // Wait for the new item to appear in the DOM
  await page.locator('[data-testid^="outline-item-"]').nth(countBefore).waitFor({ timeout: 5000 });

  // Click the new item's input to focus it
  await page.locator('[data-testid^="outline-item-"]').nth(countBefore).locator('input').click();

  // Type the content
  await page.keyboard.type(content);

  // Blur by clicking title to trigger save, then re-focus for next addItem
  await page.locator('[data-testid="note-title-input"]').click();
  // Wait until server has saved (data-content updates to reflect saved value)
  await page.locator('[data-testid^="outline-item-"]').nth(countBefore)
    .waitFor({ timeout: 5000 });
  await expect(
    page.locator('[data-testid^="outline-item-"]').nth(countBefore)
  ).toHaveAttribute('data-content', content, { timeout: 5000 });

  // Re-focus the last item's input for subsequent addItem/Enter presses
  await page.locator('[data-testid^="outline-item-"]').last().locator('input').click();
}

export { test, expect };
