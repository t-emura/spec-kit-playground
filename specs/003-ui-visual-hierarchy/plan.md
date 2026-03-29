# Implementation Plan: UI Visual Hierarchy & Information Density Redesign

**Branch**: `003-ui-visual-hierarchy` | **Date**: 2026-03-29 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-ui-visual-hierarchy/spec.md`

## Summary

The application currently renders all screens using plain CSS class names with minimal styling applied — components have functional structure but lack a consistent visual language. No Tailwind utility classes appear in JSX; all styling relies on a small set of CSS custom properties in `tokens.css`. The redesign will introduce a consistent spacing scale, a three-level typographic hierarchy, and visual differentiation of primary/secondary content across all five screens (HomePage, NoteWorkspacePage, OutlineTree, SearchPanel, MetadataPanel/ExportDialog). Changes are scoped to the frontend (`apps/web`); no API or data-model changes are required.

## Technical Context

**Language/Version**: TypeScript 5.6  
**Primary Dependencies**: React 19, Tailwind CSS 3.4, Vite 5, React Router 6, TanStack Query 5  
**Storage**: N/A (UI-only change; backend remains SQLite via Drizzle ORM)  
**Testing**: Vitest + Testing Library (unit/component), Playwright (e2e)  
**Target Platform**: Web — desktop primary (≥1024px), mobile secondary (≥375px)  
**Project Type**: Web application (frontend in `apps/web`)  
**Performance Goals**: UI interactions ≤200ms p95 (per constitution); visual-only changes must not regress render performance  
**Constraints**: Dark mode and light mode both supported via CSS custom properties in `tokens.css`; accessibility contrast ratios must be preserved; no new runtime dependencies  
**Scale/Scope**: 5 screens — HomePage, NoteWorkspacePage (wrapper), NoteWorkspace (editor), SearchPanel, MetadataPanel/ExportDialog

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **Code quality**: Styling changes via Tailwind utilities and updated CSS tokens; no dead code introduced. All modified components remain single-purpose.
- [x] **Test strategy**: Component-level tests verify class presence/structure; Playwright e2e smoke tests confirm no visual regression breaks interactions. Coverage must not decrease.
- [x] **Security**: No new inputs, API calls, or auth surfaces. No impact.
- [x] **Non-functional (UX)**: Changes are explicitly UX improvements. All components remain sourced from the existing design system (tokens + Tailwind). ARIA roles and keyboard navigation preserved unchanged.
- [x] **Non-functional (Performance)**: Adding Tailwind utility classes is compile-time only; no runtime cost. Bundle size increase from new CSS classes must stay within 10% per constitution.
- [x] **Dependencies**: No new runtime dependencies. Tailwind CSS is already installed.
- [x] **Error handling**: No new error paths introduced.

**Gate result**: ✅ All gates pass. No violations to justify.

## Project Structure

### Documentation (this feature)

```text
specs/003-ui-visual-hierarchy/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output (design token schema)
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (CSS contract)
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code

```text
apps/web/
├── src/
│   ├── styles/
│   │   └── tokens.css              # Extended with spacing scale + typography tokens
│   ├── pages/
│   │   ├── home-page.tsx           # Styled with Tailwind utility classes
│   │   ├── note-workspace-page.tsx # Styled (nav bar, loading states)
│   │   └── note-workspace.tsx      # Styled (header, action bar, layout)
│   └── features/
│       ├── outliner/components/
│       │   ├── outline-tree.tsx    # Typography hierarchy + depth indentation
│       │   └── focus-toolbar.tsx   # Visual differentiation for highlight/status controls
│       ├── search/components/
│       │   └── search-panel.tsx    # Styled search input + results list
│       ├── metadata/components/
│       │   └── metadata-panel.tsx  # Form layout with section grouping + whitespace
│       └── export/components/
│           └── export-dialog.tsx   # Modal-style dialog with clear action hierarchy
└── tests/
    └── unit/                       # Component tests updated to reflect new class structure
```

**Structure Decision**: Frontend-only. All changes are in `apps/web/src`. No backend files touched.
