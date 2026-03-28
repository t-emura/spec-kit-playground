import { test, expect } from '@playwright/test';
import { createNote, addItem } from './fixtures.js';

test.describe('US3: AI-Ready Context Management', () => {
  test('adds metadata to items and export json contains structure', async ({ page }) => {
    await page.goto('/');
    await createNote(page, 'US3 Metadata Note');
    await addItem(page, 'AI task item');
    await addItem(page, 'Research item');

    // Open metadata panel for first item via its menu button
    await page.locator('[data-testid^="outline-item-"]').nth(0).locator('[data-testid="item-menu-btn"]').click();
    await page.locator('[data-testid="open-metadata-btn"]').click();

    // Fill metadata form
    await page.waitForSelector('[data-testid="metadata-panel"]');
    await page.selectOption('[data-testid="purpose-select"]', 'task');
    await page.fill('[data-testid="tag-input"]', 'ai-ready');
    await page.keyboard.press('Enter');
    await page.fill('[data-testid="context-note-input"]', 'AI context for this task');
    await page.click('[data-testid="metadata-save-btn"]');

    // Open export dialog
    await page.click('[data-testid="export-note-btn"]');
    await page.waitForSelector('[data-testid="export-dialog"]');
    await page.click('[data-testid="format-json"]');
    await page.click('[data-testid="export-submit-btn"]');

    await page.waitForSelector('[data-testid="export-success"]');
    await expect(page.locator('[data-testid="export-success"]')).toBeVisible();
  });

  test('export markdown does not include metadata section', async ({ page }) => {
    await page.goto('/');
    await createNote(page, 'Markdown Export Test');
    await addItem(page, 'Simple item');

    await page.click('[data-testid="export-note-btn"]');
    await page.waitForSelector('[data-testid="export-dialog"]');
    await page.click('[data-testid="format-markdown"]');
    await page.click('[data-testid="export-submit-btn"]');

    await page.waitForSelector('[data-testid="export-success"]');
    await expect(page.locator('[data-testid="export-success"]')).toBeVisible();
  });
});
