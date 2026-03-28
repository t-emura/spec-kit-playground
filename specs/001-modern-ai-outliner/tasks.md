# Tasks: Modern Thinking Outliner

**Input**: Design documents from `/specs/001-modern-ai-outliner/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: Feature specでTDD指定はないため、テストタスクは必須化せず実装タスクを優先する。

**Organization**: Tasks are grouped by user story to enable independent implementation and validation.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Monorepo初期化と共通開発基盤の整備

- [ ] T001 Create npm workspaces monorepo configuration in package.json
- [ ] T002 Create root scripts and workspace task runner config in package.json
- [ ] T003 [P] Initialize frontend Vite React TypeScript app skeleton in apps/web/package.json
- [ ] T004 [P] Initialize backend Fastify TypeScript app skeleton in apps/api/package.json
- [ ] T005 [P] Add shared TypeScript base config in tsconfig.base.json
- [ ] T006 [P] Add ESLint and Prettier base configuration in eslint.config.js
- [ ] T007 [P] Add environment variable templates for web and api in .env.example

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 全ユーザーストーリー共通の土台実装

**⚠️ CRITICAL**: このフェーズ完了までUS1-US3の作業を開始しない

- [ ] T008 Setup SQLite connection and Drizzle client bootstrap in apps/api/src/db/client.ts
- [ ] T009 Define foundational database schema for notes and items in apps/api/src/db/schema.ts
- [ ] T010 Create initial Drizzle migration for foundational schema in apps/api/src/db/migrations/0001_initial.sql
- [ ] T011 [P] Implement API server bootstrap with Fastify plugins in apps/api/src/server.ts
- [ ] T012 [P] Implement global error handler and request logging middleware in apps/api/src/middleware/error-handler.ts
- [ ] T013 [P] Implement runtime env validation with zod in apps/api/src/config/env.ts
- [ ] T014 [P] Create shared domain and DTO types in packages/shared-types/src/outliner.ts
- [ ] T015 [P] Configure Tailwind CSS and design tokens in apps/web/src/styles/tokens.css
- [ ] T016 [P] Create API client and base query utilities in apps/web/src/lib/api-client.ts

**Checkpoint**: Foundation ready - user story implementation can begin

---

## Phase 3: User Story 1 - Fast Thought Capture and Structuring (Priority: P1) 🎯 MVP

**Goal**: 階層アウトラインの高速入力、移動、折りたたみ、自動保存を提供する

**Independent Test**: 新規ノートで10項目以上を追加し、並べ替え・インデント変更・折りたたみ後に再読み込みで状態維持を確認する

### Implementation for User Story 1

- [ ] T017 [P] [US1] Implement note repository CRUD methods in apps/api/src/repositories/note-repository.ts
- [ ] T018 [P] [US1] Implement outline item repository and tree move transaction in apps/api/src/repositories/item-repository.ts
- [ ] T019 [US1] Implement note service with optimistic locking for autosave in apps/api/src/services/note-service.ts
- [ ] T020 [US1] Implement item service for create update delete reorder indent logic in apps/api/src/services/item-service.ts
- [ ] T021 [US1] Implement notes and items routes from contract in apps/api/src/routes/notes-routes.ts
- [ ] T022 [US1] Implement item move and collapse routes in apps/api/src/routes/items-routes.ts
- [ ] T023 [P] [US1] Build core outline editor tree component in apps/web/src/features/outliner/components/outline-tree.tsx
- [ ] T024 [P] [US1] Build note workspace page and keyboard input flow in apps/web/src/pages/note-workspace.tsx
- [ ] T025 [US1] Implement autosave hook with debounce and conflict feedback in apps/web/src/features/outliner/hooks/use-autosave.ts
- [ ] T026 [US1] Implement undo redo state history manager in apps/web/src/features/outliner/stores/history-store.ts

**Checkpoint**: User Story 1 is fully functional and independently testable

---

## Phase 4: User Story 2 - Focused Review with Visual Clarity (Priority: P2)

**Goal**: 大規模ノートでも検索・強調・フォーカス表示で見直し効率を高める

**Independent Test**: 100項目ノートで検索して該当へ移動し、強調状態が再表示後も保持されることを確認する

### Implementation for User Story 2

- [ ] T027 [P] [US2] Implement search and filter API endpoint for notes in apps/api/src/routes/search-routes.ts
- [ ] T028 [P] [US2] Implement highlight update use case in item service in apps/api/src/services/item-highlight-service.ts
- [ ] T029 [US2] Persist highlight and focus display properties in item repository in apps/api/src/repositories/item-visual-state-repository.ts
- [ ] T030 [P] [US2] Build search panel with result navigation in apps/web/src/features/search/components/search-panel.tsx
- [ ] T031 [P] [US2] Build highlight and focus toolbar UI in apps/web/src/features/outliner/components/focus-toolbar.tsx
- [ ] T032 [US2] Integrate search highlight focus state into outline tree rendering in apps/web/src/features/outliner/components/outline-tree.tsx

**Checkpoint**: User Stories 1 and 2 work independently

---

## Phase 5: User Story 3 - AI-Ready Context Management (Priority: P3)

**Goal**: AI連携前提のメタ情報管理とメタ情報保持エクスポートを提供する

**Independent Test**: 項目メタ情報を編集し、jsonエクスポート結果に構造とメタ情報が含まれることを確認する

### Implementation for User Story 3

- [ ] T033 [P] [US3] Add metadata and export snapshot tables to schema in apps/api/src/db/schema.ts
- [ ] T034 [P] [US3] Add migration for metadata and export snapshot tables in apps/api/src/db/migrations/0002_metadata_export.sql
- [ ] T035 [P] [US3] Implement metadata repository upsert and validation rules in apps/api/src/repositories/metadata-repository.ts
- [ ] T036 [US3] Implement metadata service for purpose category tags contextNote in apps/api/src/services/metadata-service.ts
- [ ] T037 [US3] Implement export service with json markdown payload generation in apps/api/src/services/export-service.ts
- [ ] T038 [US3] Implement metadata and export contract routes in apps/api/src/routes/metadata-export-routes.ts
- [ ] T039 [P] [US3] Build metadata editor panel in apps/web/src/features/metadata/components/metadata-panel.tsx
- [ ] T040 [US3] Build export action UI and payload download flow in apps/web/src/features/export/components/export-dialog.tsx
- [ ] T041 [US3] Integrate metadata state and export action into note workspace in apps/web/src/pages/note-workspace.tsx

**Checkpoint**: All user stories are independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: 全体品質、運用性、リリース準備

- [ ] T042 [P] Document architecture decision records for stack and persistence choices in docs/decisions/001-outliner-architecture.md
- [ ] T043 [P] Add production-oriented logging redaction and log field policy in apps/api/src/middleware/logging-policy.ts
- [ ] T044 Improve performance hotspots for large outline rendering in apps/web/src/features/outliner/components/outline-tree.tsx
- [ ] T045 [P] Update developer runbook and commands in README.md
- [ ] T046 Validate quickstart flow and align command list in specs/001-modern-ai-outliner/quickstart.md

---

## Dependencies & Execution Order

### Phase Dependencies

- Setup (Phase 1): no dependencies
- Foundational (Phase 2): depends on Phase 1 completion, blocks all user stories
- User Stories (Phase 3-5): depend on Phase 2 completion
- Polish (Phase 6): depends on selected user stories completion

### User Story Dependencies

- US1 (P1): starts after Foundational, no dependency on US2 or US3
- US2 (P2): starts after Foundational, depends functionally on US1 editor surface only
- US3 (P3): starts after Foundational, reuses US1 note workspace and API base

### Story Completion Order

1. US1 (MVP)
2. US2
3. US3

---

## Parallel Opportunities

- Phase 1: T003, T004, T005, T006, T007 are parallelizable after T001-T002
- Phase 2: T011, T012, T013, T014, T015, T016 are parallelizable after T008-T010
- US1: T017 and T018 can run in parallel; T023 and T024 can run in parallel
- US2: T027 and T028 can run in parallel; T030 and T031 can run in parallel
- US3: T033, T034, T035 can run in parallel where migration order is respected; T039 can run parallel to backend service tasks

## Parallel Example: User Story 1

- Run in parallel: T017 in apps/api/src/repositories/note-repository.ts
- Run in parallel: T018 in apps/api/src/repositories/item-repository.ts
- Run in parallel: T023 in apps/web/src/features/outliner/components/outline-tree.tsx
- Run in parallel: T024 in apps/web/src/pages/note-workspace.tsx

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 Setup
2. Complete Phase 2 Foundational
3. Complete Phase 3 US1
4. Validate Independent Test for US1
5. Demo and stabilize before US2

### Incremental Delivery

1. Setup + Foundational for stable base
2. Deliver US1 as MVP
3. Add US2 for review efficiency
4. Add US3 for AI-ready metadata and export
5. Execute Polish tasks for release readiness

### Validation Notes

- All tasks follow required checklist format: checkbox + task ID + optional [P] + required [USx] in story phases + explicit file path
- Story phases are independently testable using each Independent Test definition
