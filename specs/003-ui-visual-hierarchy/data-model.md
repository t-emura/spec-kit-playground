# Design Token Schema: UI Visual Hierarchy

**Feature**: 003-ui-visual-hierarchy  
**Phase**: 1 — Design  
**Date**: 2026-03-29

---

## Overview

This feature does not introduce new data entities or change the API schema. The "data model" for this feature is the **design token contract** — the named CSS custom properties that all components must use to express spacing, typography, and color. This document defines the full token schema that `tokens.css` must expose after this feature is implemented.

---

## Token Schema

### Color Tokens (existing, unchanged)

| Token | Value (dark) | Value (light) | Purpose |
|-------|-------------|---------------|---------|
| `--color-bg` | `#0f172a` | `#f8fafc` | Page background |
| `--color-surface` | `#1e293b` | `#ffffff` | Panel / card surface |
| `--color-surface-2` | `#334155` | `#f1f5f9` | Elevated surface (nested panels) |
| `--color-border` | `#475569` | `#e2e8f0` | Borders and dividers |
| `--color-text` | `#f1f5f9` | `#0f172a` | Primary text |
| `--color-text-muted` | `#94a3b8` | `#64748b` | Secondary / supporting text |
| `--color-primary` | `#6366f1` | `#6366f1` | Primary actions, highlights |
| `--color-primary-hover` | `#818cf8` | `#818cf8` | Primary action hover state |
| `--color-danger` | `#ef4444` | `#ef4444` | Destructive actions |
| `--color-success` | `#22c55e` | `#22c55e` | Success states |
| `--color-warning` | `#f59e0b` | `#f59e0b` | Warning states |

### Spacing Tokens (new)

| Token | Value | Tailwind Equivalent | Purpose |
|-------|-------|---------------------|---------|
| `--spacing-1` | `4px` | `p-1` / `gap-1` | Intra-element gaps (icon to label) |
| `--spacing-2` | `8px` | `p-2` / `gap-2` | Related element gaps (label to input) |
| `--spacing-3` | `12px` | `p-3` | Compact padding within a panel element |
| `--spacing-4` | `16px` | `p-4` / `gap-4` | Standard internal panel padding |
| `--spacing-6` | `24px` | `p-6` / `gap-6` | Section boundary within a panel |
| `--spacing-10` | `40px` | `p-10` | Panel outer padding (desktop) |
| `--spacing-indent` | `1.5rem` | `pl-6` | Outline item indent per depth level (existing) |

### Typography Tokens (new)

| Token | Value | Tailwind Equivalent | Purpose |
|-------|-------|---------------------|---------|
| `--text-size-heading` | `1.25rem` | `text-xl` | Page/section headings (h1, note title) |
| `--text-size-subheading` | `1rem` | `text-base` | Sub-headings, panel titles, depth-0 outline items |
| `--text-size-body` | `0.875rem` | `text-sm` | Body text, form labels, nested outline items |
| `--text-size-caption` | `0.75rem` | `text-xs` | Meta-labels, save status, counts |
| `--text-weight-heading` | `600` | `font-semibold` | Headings |
| `--text-weight-subheading` | `500` | `font-medium` | Sub-headings, active controls |
| `--text-weight-body` | `400` | `font-normal` | Body text |
| `--text-line-height` | `1.6` | `leading-relaxed` | Prose reading surfaces |

### Highlight Level Tokens (existing, formalized)

| Token | Value | Purpose |
|-------|-------|---------|
| `--color-highlight-none` | `transparent` | No highlight |
| `--color-highlight-low` | `rgba(99,102,241,0.15)` | Low emphasis highlight (existing) |
| `--color-highlight-medium` | `rgba(99,102,241,0.3)` | Medium emphasis highlight (existing) |
| `--color-highlight-high` | `rgba(99,102,241,0.5)` | High emphasis highlight (existing) |

### Border Color for Highlight Strips (new)

| Token | Value | Purpose |
|-------|-------|---------|
| `--color-highlight-strip-none` | `var(--color-border)` | Left-border strip for `highlight=none` items |
| `--color-highlight-strip-low` | `var(--color-primary)` | Left-border strip for `highlight=low` items |
| `--color-highlight-strip-medium` | `var(--color-primary-hover)` | Left-border strip for `highlight=medium` items |
| `--color-highlight-strip-high` | `#a5b4fc` | Left-border strip for `highlight=high` items |

---

## Token Relationships

```
Page background (--color-bg)
  └── Panel surface (--color-surface)          ← panels sit on bg
        └── Nested surface (--color-surface-2)  ← tag chips, nested groups
              └── Borders (--color-border)       ← separate elements within surfaces

--color-text           → Primary text (headings, inputs)
--color-text-muted     → Supporting text (labels, captions, placeholder)
--color-primary        → Active / interactive elements
```

---

## Non-Entities

The following were considered but are **not** new tokens for this feature:

- **Animation timing**: `--transition-fast` and `--transition-base` already defined; no change.
- **Border radius**: Standardized to Tailwind `rounded-md` (6px) for interactive elements, `rounded-xl` (12px) for panels. Not added as tokens — Tailwind utilities are sufficient.
- **Shadow**: Not introduced. Dark surfaces use border-based depth, not shadows, to avoid visual noise on dark backgrounds.
