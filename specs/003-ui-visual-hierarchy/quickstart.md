# Quickstart: UI Visual Hierarchy Implementation

**Feature**: 003-ui-visual-hierarchy  
**Phase**: 1 — Design  
**Date**: 2026-03-29

---

## What This Feature Does

This feature replaces the current unstyled CSS class names with a consistent Tailwind utility class application across all five screens of the Modern AI Outliner. The result is a UI with:

- Clear spacing scale (related items close, unrelated items far)
- Three-level typographic hierarchy (heading → sub-heading → body/muted)
- Differentiated primary vs secondary vs ghost actions
- Card-bounded panels with visible depth
- Highlight strips on outline items (color-only, no text needed)
- Mobile-responsive layouts

---

## Files Changed

| File | Change type |
|------|------------|
| `apps/web/src/styles/tokens.css` | Add new spacing + typography tokens; add `@layer components` button variants |
| `apps/web/src/pages/home-page.tsx` | Apply Tailwind classes per UI contract |
| `apps/web/src/pages/note-workspace-page.tsx` | Apply Tailwind classes per UI contract |
| `apps/web/src/pages/note-workspace.tsx` | Apply Tailwind classes per UI contract |
| `apps/web/src/features/outliner/components/outline-tree.tsx` | Apply Tailwind classes + highlight strip pattern |
| `apps/web/src/features/outliner/components/focus-toolbar.tsx` | Apply pill badge + color dot pattern |
| `apps/web/src/features/search/components/search-panel.tsx` | Apply Tailwind classes per UI contract |
| `apps/web/src/features/metadata/components/metadata-panel.tsx` | Apply Tailwind classes per UI contract |
| `apps/web/src/features/export/components/export-dialog.tsx` | Apply Tailwind classes + overlay wrapper |

No API, backend, or shared-types files are changed.

---

## Step 1: Extend `tokens.css`

Add new spacing and typography tokens to `:root`, and add button component classes via `@layer components`.

**New additions to `:root`**:
```css
/* Spacing scale */
--spacing-1: 4px;
--spacing-2: 8px;
--spacing-3: 12px;
--spacing-4: 16px;
--spacing-6: 24px;
--spacing-10: 40px;

/* Typography */
--text-size-heading: 1.25rem;
--text-size-subheading: 1rem;
--text-size-body: 0.875rem;
--text-size-caption: 0.75rem;
--text-weight-heading: 600;
--text-weight-subheading: 500;
--text-weight-body: 400;
--text-line-height: 1.6;

/* Highlight strips */
--color-highlight-strip-none: var(--color-border);
--color-highlight-strip-low: var(--color-primary);
--color-highlight-strip-medium: var(--color-primary-hover);
--color-highlight-strip-high: #a5b4fc;
```

**New `@layer components` block** (after `@tailwind utilities`):
```css
@layer components {
  .btn-primary {
    @apply inline-flex items-center justify-center px-4 py-2 bg-primary hover:bg-primary-hover text-white text-sm font-medium rounded-md transition-colors disabled:opacity-50 cursor-pointer;
  }
  .btn-secondary {
    @apply inline-flex items-center justify-center px-3 py-1.5 border border-[var(--color-border)] text-[var(--color-text)] text-sm font-medium rounded-md hover:bg-[var(--color-surface-2)] transition-colors;
  }
  .btn-ghost {
    @apply inline-flex items-center justify-center px-2 py-1 text-[var(--color-text-muted)] text-sm hover:text-[var(--color-text)] hover:bg-[var(--color-surface-2)] rounded-md transition-colors;
  }
}
```

**Note**: Since Tailwind config extends `primary` and `primary-hover` as named colors, `bg-primary` and `hover:bg-primary-hover` work directly. For other tokens, use `[var(--token-name)]` arbitrary values.

---

## Step 2: Update Tailwind Config

Add CSS variable references to `tailwind.config.js` so tokens are accessible as Tailwind utilities:

```js
theme: {
  extend: {
    colors: {
      primary: '#6366f1',
      'primary-hover': '#818cf8',
      // Add surface colors for utility class access
      bg: 'var(--color-bg)',
      surface: 'var(--color-surface)',
      'surface-2': 'var(--color-surface-2)',
      border: 'var(--color-border)',
      text: 'var(--color-text)',
      'text-muted': 'var(--color-text-muted)',
      danger: 'var(--color-danger)',
      success: 'var(--color-success)',
    },
    // ... existing fontFamily
  }
}
```

This enables `bg-surface`, `text-text`, `border-border`, etc. as utility classes, making JSX classes readable and theme-aware automatically.

---

## Step 3: Apply Classes to Components

Work through each component following the UI contract in `contracts/ui-visual-contract.md`.

### Key pattern: Outline item highlight strips

The `OutlineTree` component renders items with `data-highlight` attribute. Use CSS in `tokens.css` to apply the border color based on the class:

```css
.outline-item.highlight-none  { border-left-color: var(--color-highlight-strip-none); }
.outline-item.highlight-low   { border-left-color: var(--color-highlight-strip-low); }
.outline-item.highlight-medium { border-left-color: var(--color-highlight-strip-medium); }
.outline-item.highlight-high  { border-left-color: var(--color-highlight-strip-high); }
```

The base `border-l-4` class is applied in the component JSX via Tailwind.

### Key pattern: ExportDialog overlay

The `ExportDialog` currently renders without an overlay. Wrap the dialog content:

```tsx
return (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div data-testid="export-dialog" role="dialog" ... className="bg-surface border border-border rounded-xl p-6 w-full max-w-sm flex flex-col gap-4">
      ...
    </div>
  </div>
);
```

### Key pattern: MetadataPanel on mobile

For viewports ≤768px, `MetadataPanel` should be a bottom drawer. The workspace conditionally applies a class:

```tsx
<MetadataPanel
  className="fixed bottom-0 inset-x-0 rounded-t-2xl md:relative md:rounded-none md:inset-auto md:w-80"
  ...
/>
```

Pass `className` as a prop and apply it to the panel root.

---

## Step 4: Update Vitest Component Tests

Component tests should not assert on CSS class names (tests use `data-testid` and ARIA roles). However, after applying Tailwind classes, any test that checks for the absence of the old bare class names (e.g., `.home-page`) may need updating if the class was removed. Verify that `data-testid` attributes and `role` attributes are preserved unchanged on all modified components.

Run:
```bash
npm run test:unit --workspace=apps/web
```

---

## Step 5: Verify with Playwright E2E

The Playwright tests interact via `data-testid` attributes and do not depend on visual styling. Run the full suite to confirm no interactions broke:

```bash
npm run test:e2e
```

---

## Step 6: Visual Inspection Checklist

Before marking tasks done, manually verify each screen:

- [ ] HomePage: Note list items are visually distinct cards with hover state
- [ ] HomePage: "+ New Note" button is visually primary (filled blue)
- [ ] NoteWorkspace: Title input blends into the header (no visible border when unfocused)
- [ ] NoteWorkspace: Save status is unobtrusive (small, muted)
- [ ] OutlineTree: Depth indentation is visually clear at 3+ levels
- [ ] OutlineTree: Highlighted items show color strip on the left border
- [ ] OutlineTree: Item menu button is hidden at rest, visible on hover
- [ ] FocusToolbar: Status badges are pill-shaped with color fills when active
- [ ] SearchPanel: Appears as a panel strip above the editor, not a floating modal
- [ ] MetadataPanel: Form fields are visually grouped with clear section spacing
- [ ] ExportDialog: Has a dark overlay behind the dialog box
- [ ] Light mode: All screens readable with correct surface/text contrast
- [ ] Mobile (375px): Layout does not overflow horizontally

---

## Acceptance Criteria Summary

From the spec, these are the verifiable outcomes this implementation delivers:

| Criterion | How to verify |
|-----------|--------------|
| Primary element identified in ≤5s (80% success) | First-impression test on redesigned page |
| "Easy to scan" ≥4/5 rating | User feedback session |
| Section location 15% faster | Timed task on note list / workspace |
| Read-recall errors -20% | Comparative test on metadata panel |
| 90% of screens pass visual hierarchy audit | Internal audit using checklist in spec |
