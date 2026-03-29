# UI Component Visual Contract

**Feature**: 003-ui-visual-hierarchy  
**Phase**: 1 — Design  
**Date**: 2026-03-29

---

## Overview

This contract defines the **visual interface** each component must expose: which CSS classes, design tokens, and structural expectations are part of the component's public contract. Implementations must not deviate from these classes and roles, as Playwright and Vitest tests use `data-testid` attributes and accessible roles — not CSS class names — for assertions. Visual class names are therefore stable, implementation-level details that test code must not depend on.

---

## Component Contracts

### `HomePage`

**Layout contract**: Full-viewport flex column with top padding. Note list is a vertically stacked card grid.

| Element | Role / testid | Expected classes | Notes |
|---------|--------------|-----------------|-------|
| Page root | `.home-page` | `min-h-screen bg-bg px-6 py-10 max-w-3xl mx-auto` | Centered, max width |
| Page heading | `<h1>` | `text-xl font-semibold text-text mb-6` | Level 1 heading |
| New note button | `data-testid="new-note-btn"` | `btn-primary` (see Button Contract below) | Primary action |
| New note form | `.new-note-form` | `flex gap-2 mb-6 items-center` | Inline form |
| Note list | `.note-list` | `space-y-2 list-none p-0` | No bullet points |
| Note list item | `<li>` | `bg-surface border border-border rounded-md` | Card per note |
| Note list button | `<button>` | `w-full text-left px-4 py-3 text-sm font-medium text-text hover:bg-surface-2 rounded-md transition-colors` | Full-width click target |
| Loading state | `<p>Loading…</p>` | `text-sm text-text-muted` | Muted, not alarming |

---

### `NoteWorkspacePage`

**Layout contract**: Full-height flex column; nav bar + workspace content area.

| Element | Role / testid | Expected classes | Notes |
|---------|--------------|-----------------|-------|
| Nav bar | `<nav>` | `flex items-center px-4 py-2 border-b border-border bg-surface` | Sticky top bar |
| Back button | `aria-label="Back to notes"` | `btn-ghost text-sm` | Ghost action |
| Loading / not-found | `<div>` | `text-sm text-text-muted p-6` | Non-alarming inline message |

---

### `NoteWorkspace`

**Layout contract**: Two-zone vertical layout — fixed header + scrollable editor area. Panels appear conditionally above the editor.

| Element | Role / testid | Expected classes | Notes |
|---------|--------------|-----------------|-------|
| Root | `data-testid="note-workspace"` | `flex flex-col h-full` | Fills its container |
| Header | `.workspace-header` | `flex items-center gap-3 px-6 py-3 border-b border-border bg-surface` | Sticky header |
| Title input | `data-testid="note-title-input"` | `flex-1 text-xl font-semibold bg-transparent border-none outline-none text-text placeholder:text-text-muted` | Inline editable title |
| Action bar | `.workspace-actions` | `flex items-center gap-2` | Right-aligned controls |
| Undo/Redo buttons | `aria-label="Undo"` / `"Redo"` | `btn-ghost px-2 py-1 text-lg` | Icon-like ghost buttons |
| Export button | `data-testid="export-note-btn"` | `btn-secondary text-sm` | Secondary action |
| Save status | `.save-status` | `text-xs text-text-muted ml-2` | Caption-level, unobtrusive |
| Empty hint | `data-testid="empty-outline-hint"` | `flex items-center justify-center h-32 text-text-muted` | Centered empty state |
| Add first item | `data-testid="add-first-item"` | `btn-ghost text-sm` | Ghost CTA for empty state |

---

### `OutlineTree`

**Layout contract**: Vertically stacked items, indented by `--spacing-indent` per depth level. Left-border strip communicates highlight level.

| Element | Role / testid | Expected classes | Notes |
|---------|--------------|-----------------|-------|
| Tree root | `role="tree"` | `py-2` | Small vertical padding |
| Outline item | `role="treeitem"` | `outline-item depth-{n} highlight-{level}` + `flex items-center gap-2 py-1 border-l-4` | Left border is the highlight strip |
| Collapse toggle | `data-testid="collapse-toggle-{id}"` | `text-xs text-text-muted w-4 h-4 flex-shrink-0` | Small, unobtrusive |
| Collapse spacer | `.collapse-spacer` | `w-4 flex-shrink-0` | Aligns leaf items with parent |
| Item input | `role="textbox"` | `flex-1 bg-transparent border-none outline-none text-sm text-text caret-primary` | Full-width in-place edit |
| Menu button | `data-testid="item-menu-btn"` | `opacity-0 group-hover:opacity-100 text-text-muted px-1` | Hidden until hover |
| Menu popup | `.item-menu-popup` | `absolute right-0 bg-surface-2 border border-border rounded-md shadow-lg py-1 z-10` | Floating menu |

**Highlight strip colors** (via Tailwind arbitrary values or CSS class overrides):

| Highlight | Left border color class |
|-----------|------------------------|
| `none` | `border-border` |
| `low` | `border-primary` |
| `medium` | `border-primary-hover` |
| `high` | `border-[#a5b4fc]` |

---

### `FocusToolbar`

**Layout contract**: Horizontal row of compact controls; visually subordinate to the outline editor.

| Element | Role / testid | Expected classes | Notes |
|---------|--------------|-----------------|-------|
| Toolbar root | `role="toolbar"` | `flex items-center gap-4 px-4 py-2 border-t border-border bg-surface` | Bottom bar style |
| Highlight group | `.highlight-controls` | `flex items-center gap-1` | Tight spacing for color dots |
| Highlight button | `data-testid="highlight-{level}"` | `w-4 h-4 rounded-full transition-opacity` | Color dot button |
| Status group | `.status-controls` | `flex items-center gap-1 ml-4` | Separated from highlight group |
| Status button | `data-testid="status-{status}"` | `text-xs px-2 py-0.5 rounded-full border` | Pill badge style |

**Status badge colors**:

| Status | Active classes | Inactive classes |
|--------|---------------|-----------------|
| `active` | `bg-primary text-white border-primary` | `border-border text-text-muted` |
| `done` | `bg-success text-white border-success` | `border-border text-text-muted` |
| `blocked` | `bg-danger text-white border-danger` | `border-border text-text-muted` |

---

### `SearchPanel`

**Layout contract**: Full-width panel with search input at top and results list below.

| Element | Role / testid | Expected classes | Notes |
|---------|--------------|-----------------|-------|
| Panel root | `role="search"` | `bg-surface border-b border-border px-6 py-3` | Top-of-editor panel strip |
| Search input | `role="searchbox"` | `w-full bg-surface-2 border border-border rounded-md px-3 py-2 text-sm text-text placeholder:text-text-muted outline-none focus:border-primary` | Styled input |
| Result count | `.search-result-count` | `text-xs text-text-muted mt-1` | Caption below input |
| Results list | `role="listbox"` | `mt-2 space-y-1 max-h-48 overflow-y-auto` | Scrollable results |
| Result item | `role="option"` | `px-3 py-2 rounded-md text-sm text-text hover:bg-surface-2 cursor-pointer` | Hover highlight |

---

### `MetadataPanel`

**Layout contract**: Slide-in panel with form sections separated by `space-y-6`. Labels are caption-level; inputs are full-width.

| Element | Role / testid | Expected classes | Notes |
|---------|--------------|-----------------|-------|
| Panel root | `data-testid="metadata-panel"` | `bg-surface border-l border-border p-6 w-80 flex flex-col gap-6 overflow-y-auto` | Side panel |
| Panel heading | `<h3>` | `text-base font-semibold text-text` | Sub-heading level |
| Form label | `<label>` | `text-xs font-medium text-text-muted uppercase tracking-wide` | Caption-style labels |
| Select / input | form controls | `w-full bg-surface-2 border border-border rounded-md px-3 py-2 text-sm text-text focus:border-primary outline-none` | Consistent form style |
| Tag list | `.tag-list` | `flex flex-wrap gap-1 mb-2` | Wrapping chip layout |
| Tag chip | `.tag` | `inline-flex items-center gap-1 px-2 py-0.5 bg-surface-2 border border-border rounded-full text-xs text-text` | Pill chip |
| Tag remove | `aria-label="Remove tag {tag}"` | `text-text-muted hover:text-danger ml-1` | Small remove button |
| Error | `role="alert"` | `text-xs text-danger mt-1` | Inline error |
| Save button | `data-testid="metadata-save-btn"` | `btn-primary w-full mt-2` | Full-width primary action |

---

### `ExportDialog`

**Layout contract**: Centered modal overlay with clear action hierarchy.

| Element | Role / testid | Expected classes | Notes |
|---------|--------------|-----------------|-------|
| Overlay | implicit wrapper | `fixed inset-0 bg-black/50 flex items-center justify-center z-50` | Backdrop |
| Dialog root | `role="dialog"` | `bg-surface border border-border rounded-xl p-6 w-full max-w-sm flex flex-col gap-4` | Centered card |
| Dialog heading | `<h2>` | `text-base font-semibold text-text` | Sub-heading level |
| Fieldset | `<fieldset>` | `flex flex-col gap-2 border-none p-0` | No default border |
| Legend | `<legend>` | `text-xs font-medium text-text-muted uppercase tracking-wide mb-1` | Caption-style |
| Radio/checkbox label | `<label>` | `flex items-center gap-2 text-sm text-text cursor-pointer` | Clickable label |
| Error | `role="alert"` | `text-xs text-danger` | Inline error |
| Success | `data-testid="export-success"` | `text-xs text-success` | Inline success |
| Export button | `data-testid="export-submit-btn"` | `btn-primary w-full` | Primary action |
| Close button | `data-testid="export-close-btn"` | `btn-ghost w-full` | Ghost action |

---

## Shared Button Contract

All buttons across all components follow this pattern:

| Variant | Class | Use case |
|---------|-------|---------|
| `btn-primary` | `inline-flex items-center justify-center px-4 py-2 bg-primary hover:bg-primary-hover text-white text-sm font-medium rounded-md transition-colors disabled:opacity-50` | Primary actions |
| `btn-secondary` | `inline-flex items-center justify-center px-3 py-1.5 border border-border text-text text-sm font-medium rounded-md hover:bg-surface-2 transition-colors` | Secondary actions |
| `btn-ghost` | `inline-flex items-center justify-center px-2 py-1 text-text-muted text-sm hover:text-text hover:bg-surface-2 rounded-md transition-colors` | Tertiary / destructive-free cancel |

These will be defined as `@layer components` rules in `tokens.css` to keep Tailwind utility purging intact.
