# Tasks: UI Visual Hierarchy & Information Density Redesign

**Input**: Design documents from `/specs/003-ui-visual-hierarchy/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ui-visual-contract.md ✅, quickstart.md ✅

**Tests**: No test tasks generated (not requested in spec). Existing Vitest and Playwright suites are verified in the Polish phase.

**Organization**: Tasks grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story (US1, US2, US3 from spec.md)
- Exact file paths included in all task descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Extend the design token foundation that all user story phases depend on.

- [x] T001 Add new spacing tokens (`--spacing-1` through `--spacing-10`), typography tokens (`--text-size-*`, `--text-weight-*`, `--text-line-height`), and highlight strip color tokens (`--color-highlight-strip-none/low/medium/high`) to the `:root` block in `apps/web/src/styles/tokens.css` per `data-model.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Button component classes and Tailwind color aliases — required by every component in all user story phases.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T002 [P] Add `@layer components` block to `apps/web/src/styles/tokens.css` defining `btn-primary`, `btn-secondary`, and `btn-ghost` utility compositions per `contracts/ui-visual-contract.md` Shared Button Contract
- [x] T003 [P] Extend `theme.extend.colors` in `apps/web/tailwind.config.js` with CSS variable references: `bg`, `surface`, `surface-2`, `border`, `text`, `text-muted`, `danger`, `success` (all pointing to their `var(--color-*)` tokens) so Tailwind utilities like `bg-surface`, `text-text-muted`, and `border-border` are available

**Checkpoint**: Token foundation complete — all user story phases can now proceed in parallel.

---

## Phase 3: User Story 1 — Scanning a Content-Heavy Screen (Priority: P1) 🎯 MVP

**Goal**: Primary elements (headings, CTAs, section titles) are visually distinct from supporting content on every screen, allowing first-time viewers to identify the most important element within 5 seconds.

**Independent Test**: Load the redesigned HomePage and NoteWorkspace header. Confirm: (1) page heading is visually heavier than the note list items, (2) the primary CTA is filled blue (not plain text), (3) the workspace title input is inline with the header bar and visually larger than the action buttons.

- [x] T004 [P] [US1] Apply Tailwind utility classes to `apps/web/src/pages/home-page.tsx` per `contracts/ui-visual-contract.md` HomePage section: `min-h-screen bg-bg px-6 py-10 max-w-3xl mx-auto` page root, `text-xl font-semibold text-text mb-6` heading, `btn-primary` new-note button, `bg-surface border border-border rounded-md` note list cards with `w-full text-left px-4 py-3 text-sm font-medium text-text hover:bg-surface-2 rounded-md transition-colors` link buttons, `text-sm text-text-muted` loading/empty states
- [x] T005 [P] [US1] Apply Tailwind utility classes to `apps/web/src/pages/note-workspace-page.tsx` per `contracts/ui-visual-contract.md` NoteWorkspacePage section: `flex items-center px-4 py-2 border-b border-border bg-surface` nav bar, `btn-ghost text-sm` back button, `text-sm text-text-muted p-6` loading/not-found messages
- [x] T006 [P] [US1] Apply Tailwind utility classes to the workspace header in `apps/web/src/pages/note-workspace.tsx` per `contracts/ui-visual-contract.md` NoteWorkspace section: `flex flex-col h-full` root, `flex items-center gap-3 px-6 py-3 border-b border-border bg-surface` header, `flex-1 text-xl font-semibold bg-transparent border-none outline-none text-text placeholder:text-text-muted` title input, `flex items-center gap-2` action bar, `btn-ghost px-2 py-1 text-lg` undo/redo, `btn-secondary text-sm` export button, `text-xs text-text-muted ml-2` save status, `flex items-center justify-center h-32 text-text-muted` empty hint, `btn-ghost text-sm` add-first-item button

**Checkpoint**: User Story 1 complete — HomePage and workspace header provide clear visual hierarchy. Verify independently before continuing.

---

## Phase 4: User Story 2 — Reading and Comprehending Long-Form Content (Priority: P2)

**Goal**: Three visually distinct typographic levels are apparent in the outline editor. Outline items at each depth level are distinguishable without reading content. Highlight level is communicated via a color strip, not text. Form fields in MetadataPanel are grouped with sufficient whitespace.

**Independent Test**: Open a note with 3+ depth levels in the outline. Confirm: (1) depth-0 items appear visually heavier than depth-2 items, (2) items with different highlight levels show distinct left-border colors, (3) FocusToolbar status badges are pill-shaped and show active color fill. Open MetadataPanel and confirm form fields have visible section spacing with caption-style labels.

- [x] T007 [P] [US2] Apply Tailwind utility classes to `apps/web/src/features/outliner/components/outline-tree.tsx` per `contracts/ui-visual-contract.md` OutlineTree section: `py-2` tree root, `flex items-center gap-2 py-1 border-l-4` item rows (depth indentation preserved via existing `paddingLeft` inline style), `text-xs text-text-muted w-4 h-4 flex-shrink-0` collapse toggle, `w-4 flex-shrink-0` spacer, `flex-1 bg-transparent border-none outline-none text-sm text-text caret-primary` item input, `opacity-0 group-hover:opacity-100 text-text-muted px-1` menu button (add `group` class to item row), `absolute right-0 bg-surface-2 border border-border rounded-md shadow-lg py-1 z-10` menu popup; also add `.outline-item.highlight-none/low/medium/high { border-left-color: var(--color-highlight-strip-*); }` rules to `apps/web/src/styles/tokens.css`
- [x] T008 [P] [US2] Apply Tailwind utility classes to `apps/web/src/features/outliner/components/focus-toolbar.tsx` per `contracts/ui-visual-contract.md` FocusToolbar section: `flex items-center gap-4 px-4 py-2 border-t border-border bg-surface` toolbar, `flex items-center gap-1` highlight group, `w-4 h-4 rounded-full transition-opacity` highlight dot buttons, `flex items-center gap-1 ml-4` status group, `text-xs px-2 py-0.5 rounded-full border transition-colors` status pill badges with active/inactive color classes per the status badge table in the contract
- [x] T009 [P] [US2] Apply Tailwind utility classes to `apps/web/src/features/metadata/components/metadata-panel.tsx` per `contracts/ui-visual-contract.md` MetadataPanel section: `bg-surface border-l border-border p-6 w-80 flex flex-col gap-6 overflow-y-auto` panel root, `text-base font-semibold text-text` panel heading, `text-xs font-medium text-text-muted uppercase tracking-wide` form labels, `w-full bg-surface-2 border border-border rounded-md px-3 py-2 text-sm text-text focus:border-primary outline-none` all inputs/select/textarea, `flex flex-wrap gap-1 mb-2` tag list, `inline-flex items-center gap-1 px-2 py-0.5 bg-surface-2 border border-border rounded-full text-xs text-text` tag chips, `text-text-muted hover:text-danger ml-1` tag remove buttons, `text-xs text-danger mt-1` error alert, `btn-primary w-full mt-2` save button

**Checkpoint**: User Story 2 complete — outline editor and metadata panel provide clear typographic hierarchy and reading comfort. Verify independently before continuing.

---

## Phase 5: User Story 3 — Navigating Between Sections (Priority: P3)

**Goal**: Search panel is visually integrated as a panel strip (not a floating overlay). Export dialog has a dark backdrop overlay. On mobile, panels do not overlap the editor content.

**Independent Test**: (1) Press Ctrl+F — confirm SearchPanel appears as a strip above the outline, not a popup. (2) Click Export — confirm a dark overlay covers the page behind the dialog. (3) Resize browser to 375px wide — confirm MetadataPanel becomes a bottom drawer and the layout does not overflow.

- [x] T010 [P] [US3] Apply Tailwind utility classes to `apps/web/src/features/search/components/search-panel.tsx` per `contracts/ui-visual-contract.md` SearchPanel section: `bg-surface border-b border-border px-6 py-3` panel root, `w-full bg-surface-2 border border-border rounded-md px-3 py-2 text-sm text-text placeholder:text-text-muted outline-none focus:border-primary` search input, `text-xs text-text-muted mt-1` result count, `mt-2 space-y-1 max-h-48 overflow-y-auto` results list, `px-3 py-2 rounded-md text-sm text-text hover:bg-surface-2 cursor-pointer` result items
- [x] T011 [P] [US3] Wrap the dialog content in `apps/web/src/features/export/components/export-dialog.tsx` with a `fixed inset-0 bg-black/50 flex items-center justify-center z-50` overlay div; apply `contracts/ui-visual-contract.md` ExportDialog classes: `bg-surface border border-border rounded-xl p-6 w-full max-w-sm flex flex-col gap-4` dialog card, `text-base font-semibold text-text` heading, `flex flex-col gap-2 border-none p-0` fieldset, `text-xs font-medium text-text-muted uppercase tracking-wide mb-1` legend, `flex items-center gap-2 text-sm text-text cursor-pointer` radio/checkbox labels, `text-xs text-danger` / `text-xs text-success` error and success states, `btn-primary w-full` export button, `btn-ghost w-full` close button
- [x] T012 [US3] Add mobile-responsive layout to `apps/web/src/pages/note-workspace.tsx` and `apps/web/src/features/metadata/components/metadata-panel.tsx`: accept an optional `className` prop on MetadataPanel and apply `fixed bottom-0 inset-x-0 rounded-t-2xl md:relative md:rounded-none md:inset-auto md:w-80` from NoteWorkspace when the panel is shown; add `md:flex-row` to the workspace root to support side-by-side layout at desktop widths

**Checkpoint**: User Story 3 complete — search, export, and mobile layout all function correctly. All three user stories are now independently verified.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validation sweep across all modified files to confirm no regressions, correct light-mode rendering, and passing automated test suites.

- [x] T013 [P] Verify light-mode rendering by inspecting `apps/web/src/styles/tokens.css` — confirm every new class added in T002, T007 uses `var(--color-*)` tokens (not hardcoded hex values) so the `@media (prefers-color-scheme: light)` overrides apply correctly
- [x] T014 [P] Run `npm run test:unit --workspace=apps/web` and confirm all existing Vitest component tests pass; fix any assertions that previously matched bare CSS class names that were replaced or removed during T004–T012
- [x] T015 Run `npm run test:e2e` and confirm all Playwright end-to-end tests pass; no `data-testid` attributes or ARIA roles should have changed
- [x] T016 Perform the manual visual inspection checklist from `specs/003-ui-visual-hierarchy/quickstart.md` across all 5 screens (HomePage, NoteWorkspacePage, NoteWorkspace with OutlineTree, SearchPanel, MetadataPanel/ExportDialog) in both dark and light mode at desktop (1280px) and mobile (375px) viewport widths

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: T002, T003 depend on T001 — run after T001 completes; T002 and T003 are parallel to each other
- **User Stories (Phases 3–5)**: All depend on T002 and T003 — can proceed in parallel once Foundational is complete
- **Polish (Phase 6)**: T013, T014 can run in parallel after all implementation tasks complete; T015 and T016 require T014 to pass first

### User Story Dependencies

| Story | Depends on | Independent of |
|-------|-----------|---------------|
| US1 (P1) | Foundational (T002, T003) | US2, US3 |
| US2 (P2) | Foundational (T002, T003) | US1, US3 |
| US3 (P3) | Foundational (T002, T003) | US1, US2 |

All three user stories touch different files and can be worked on in parallel after Phase 2.

### Within Each User Story

All tasks within US1 (T004, T005, T006), US2 (T007, T008, T009), and US3 (T010, T011) are in different files and fully parallel. T012 (US3 mobile) touches two files also modified by T006 (US1) and T009 (US2) — complete those before starting T012.

---

## Parallel Execution Examples

### User Story 1 (all parallel after T002+T003)

```
Task: T004 — apps/web/src/pages/home-page.tsx
Task: T005 — apps/web/src/pages/note-workspace-page.tsx
Task: T006 — apps/web/src/pages/note-workspace.tsx (header section)
```

### User Story 2 (all parallel after T002+T003)

```
Task: T007 — apps/web/src/features/outliner/components/outline-tree.tsx
Task: T008 — apps/web/src/features/outliner/components/focus-toolbar.tsx
Task: T009 — apps/web/src/features/metadata/components/metadata-panel.tsx
```

### User Story 3 (T010+T011 parallel; T012 after T006+T009)

```
Task: T010 — apps/web/src/features/search/components/search-panel.tsx
Task: T011 — apps/web/src/features/export/components/export-dialog.tsx
── (T012 starts after T006 and T009 complete) ──
Task: T012 — apps/web/src/pages/note-workspace.tsx + metadata-panel.tsx (mobile)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: T001
2. Complete Phase 2: T002 + T003
3. Complete Phase 3: T004 + T005 + T006
4. **STOP and VALIDATE**: Confirm first-viewport hierarchy on HomePage and NoteWorkspace header
5. Ship or demo MVP

### Incremental Delivery

1. Setup + Foundational (T001–T003) → token foundation ready
2. US1 (T004–T006) → visual hierarchy on entry screens → **MVP demo**
3. US2 (T007–T009) → reading comfort in the editor and metadata panel
4. US3 (T010–T012) → search, export, mobile responsive
5. Polish (T013–T016) → full validation sweep → ready to merge

---

## Notes

- `[P]` tasks modify distinct files — safe to run in parallel
- T007 is the only task that modifies two files (outline-tree.tsx + tokens.css highlight strip rules); plan accordingly
- T012 depends on T006 and T009 completing first (shared files)
- No new runtime npm packages are introduced — Tailwind utilities are compile-time only
- All `data-testid` and ARIA `role` attributes are preserved unchanged across all tasks
- Commit after each phase checkpoint for clean rollback points
