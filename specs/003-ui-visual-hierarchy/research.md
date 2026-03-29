# Research: UI Visual Hierarchy & Information Density

**Feature**: 003-ui-visual-hierarchy  
**Phase**: 0 — Pre-Design Research  
**Date**: 2026-03-29

---

## 1. Spacing Scale for Information Density

**Decision**: Adopt Tailwind's default 4px base-unit spacing scale and map it to semantic tokens: `spacing-xs` (4px), `spacing-sm` (8px), `spacing-md` (16px), `spacing-lg` (24px), `spacing-xl` (40px), `spacing-2xl` (64px).

**Rationale**: A geometric scale (4, 8, 16, 24, 40, 64) creates perceivable contrast between proximity levels. Items that are related (e.g., a label and its input) use `spacing-xs/sm`; section boundaries use `spacing-xl/2xl`. This prevents the "wall of text" effect by making whitespace itself carry semantic meaning. Tailwind's built-in scale (`p-1` = 4px, `p-2` = 8px, etc.) is already calibrated to this ratio and is fully available in the project.

**Alternatives considered**:
- *8px base only*: Too coarse at small sizes; insufficient differentiation at element level.
- *Custom arbitrary values*: Breaks consistency and defeats the design system goal.
- *Linear scale (4, 8, 12, 16…)*: Does not create enough visual contrast between adjacent levels.

---

## 2. Three-Level Typographic Hierarchy

**Decision**: Define three named levels using CSS custom properties, applied via Tailwind utility classes:

| Level | Token | Size | Weight | Color |
|-------|-------|------|--------|-------|
| Primary (page/section heading) | `--text-heading` | 1.25rem (text-xl) | 600 (font-semibold) | `--color-text` |
| Secondary (sub-heading / label) | `--text-subheading` | 0.875rem (text-sm) | 500 (font-medium) | `--color-text` |
| Body / supporting | `--text-body` | 0.875rem (text-sm) | 400 (font-normal) | `--color-text-muted` |

Outline items at depth 0 are rendered at Primary scale; nested items at depth 1+ are rendered at Body scale. The status/highlight controls in `FocusToolbar` are visually subordinate (Body/muted).

**Rationale**: Three levels are the minimum for reliable visual parsing without creating noise. Using weight + color (not just size) means hierarchy is perceivable even when size differences are subtle (important for the compact outline editor context). The existing `--color-text` and `--color-text-muted` tokens already provide sufficient contrast for two of the three levels.

**Alternatives considered**:
- *Size-only hierarchy*: Not accessible to users with text zoom; contrast of meaning is lost at large text sizes.
- *Four levels*: Unnecessary complexity for 5 screens; risks creating false hierarchy for equal-weight content.
- *Color-only hierarchy*: Fails WCAG 1.4.1 (use of color); must be combined with weight/size.

---

## 3. Visual Differentiation of Primary Actions

**Decision**: Primary actions (e.g., "Create", "Export", "Save Metadata") use `bg-primary` + `text-white` + `rounded-md` + `px-4 py-2`. Secondary/ghost actions (e.g., "Cancel", "Close") use `border border-border` + `text-text-muted` + `rounded-md` + `px-3 py-1.5` with no fill. Destructive actions inherit the danger color token.

**Rationale**: Button hierarchy (filled → outlined → ghost) is a well-established pattern that communicates relative importance without relying on position alone. The existing `--color-primary` token is already defined and unused in the component JSX; this decision activates it meaningfully.

**Alternatives considered**:
- *Icon-only differentiation*: Not robust enough without text labels; accessibility concern.
- *Size-only differentiation*: Works but is less scannable at a glance; combined approach is more reliable.

---

## 4. Section Grouping and Panel Layout

**Decision**: Panels (SearchPanel, MetadataPanel, ExportDialog) are visually bounded using `bg-surface` background + `rounded-xl` + `p-6` internal padding + `border border-border` edge. They sit on top of `bg-bg` to create a clear foreground/background contrast. Sections within a panel (e.g., the tag editor block inside MetadataPanel) use `space-y-4` between form fields and `space-y-6` between logical groups.

**Rationale**: Explicit bounding boxes (surface color + border + rounded corners) communicate "this is a self-contained unit" without requiring the user to read labels. This is the standard "card" pattern in modern dark-mode UIs. The existing `--color-surface` token already provides the surface color; only the application via Tailwind classes is missing.

**Alternatives considered**:
- *Divider lines only*: Less perceived depth; still requires reading to understand section boundaries.
- *No bounding, whitespace only*: Works for simple layouts but breaks down inside the workspace where panels overlay the editor.

---

## 5. Line Length and Reading Comfort

**Decision**: Reading surfaces (MetadataPanel `contextNote` textarea, note title input on HomePage) are constrained to `max-w-prose` (65ch). The outline editor does not restrict line length since items are intentionally short (headline-style content, not prose). The MetadataPanel form is constrained to `max-w-lg` (32rem).

**Rationale**: The WCAG 1.4.8 guideline recommends ≤80 characters per line for optimal reading. `max-w-prose` (65ch) is Tailwind's built-in token calibrated to that guideline. The outline editor's items are single-line text inputs that grow with the viewport — constraining them would break the spatial outline metaphor.

**Alternatives considered**:
- *Fixed px widths*: Not responsive; breaks on large monitors and narrow viewports simultaneously.
- *No constraint*: Current state; produces very long inputs on wide monitors that are hard to scan.

---

## 6. Non-Text Visual Indicators

**Decision**: Outline items use color-coded left-border strips for highlight levels (`border-l-4`): muted gray for `none`, primary-blue for `low`, brighter blue for `medium`, accent-light for `high`. Status badges (`active`, `done`, `blocked`) in `FocusToolbar` use color + filled/unfilled circle icons, not text labels alone.

**Rationale**: The current implementation already encodes highlight level via `data-highlight` attribute and CSS class `highlight-${level}`, but no actual visual style is applied. Adding a color strip requires only CSS additions (no component logic changes). This directly addresses the requirement to supplement text labels with non-text indicators.

**Alternatives considered**:
- *Background color fills*: Can overwhelm dark backgrounds; left-border strips provide signal without high visual noise.
- *Icon-only*: Requires icon library addition (new dependency — violates constitution's dependency minimalism).

---

## 7. Dark Mode and Light Mode Consistency

**Decision**: All new tokens and Tailwind class applications will use the existing CSS custom property tokens (`var(--color-*)`, `var(--spacing-*)`) so that dark/light mode switching via `prefers-color-scheme` continues to work automatically. No hardcoded hex values in component JSX.

**Rationale**: `tokens.css` already has a `@media (prefers-color-scheme: light)` block that overrides surface and text colors. Any hardcoded values would break light mode. Using CSS variables as Tailwind `theme.extend` values (or inline `style` props) maintains this.

**Alternatives considered**:
- *Tailwind dark: variant*: Requires adding `darkMode: 'media'` to Tailwind config and duplicating every class with `dark:` prefix. More verbose and harder to maintain than the existing CSS variable approach.

---

## 8. Mobile Viewport Behavior

**Decision**: The workspace layout uses `flex-col` on narrow viewports (≤768px) instead of a side-by-side arrangement. Panels (MetadataPanel, SearchPanel) render as full-width drawers at the bottom of the viewport on mobile (`fixed bottom-0 inset-x-0 rounded-t-2xl`). Font sizes do not change between breakpoints (already small enough to work on mobile).

**Rationale**: The current NoteWorkspace layout has no responsive handling at all — it will stack naturally since it uses block-level elements, but without explicit mobile treatment panels will overlap the editor. The bottom-drawer pattern is the standard mobile idiom for panels that overlay content.

**Alternatives considered**:
- *Side drawer (off-canvas)*: More complex animation logic; not worth the added complexity for a single-developer project.
- *Modals for panels*: Already the pattern for ExportDialog; reusing it for SearchPanel and MetadataPanel would be consistent, but bottom-drawer is more discoverable on mobile.

---

## Summary Table

| Topic | Decision | Key Constraint |
|-------|----------|---------------|
| Spacing scale | Tailwind 4px base, semantic tokens | No new dependencies |
| Typography | 3 levels: size + weight + color | Existing tokens only |
| Primary actions | Filled / outlined / ghost hierarchy | Existing `--color-primary` |
| Section grouping | Card pattern (surface bg + border + radius) | Existing `--color-surface` |
| Line length | `max-w-prose` for reading, `max-w-lg` for forms | No breakpoint overrides needed |
| Non-text indicators | Left-border highlight strips + color badges | CSS-only, no icon library |
| Theme support | CSS custom properties only (no hardcoded hex) | Existing `tokens.css` |
| Mobile | `flex-col` layout + bottom-drawer panels | No new dependencies |
