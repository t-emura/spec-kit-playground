# Tasks: Modern Thinking Outliner

**Input**: Design documents from `/specs/001-modern-ai-outliner/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: MANDATORY per Constitution Principle II. All new features MUST include tests before implementation is complete. Tests follow TDD: write failing tests first, then implement to pass. Test coverage targets: unit (critical logic paths), integration (service boundaries), e2e (user workflows).

**Organization**: Tasks are grouped by user story to enable independent implementation and validation.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Monorepo初期化と共通開発基盤の整備、テスト基盤の確立

- [ ] T001 Create npm workspaces monorepo configuration in package.json
- [ ] T002 Create root scripts and workspace task runner config in package.json
- [ ] T003 [P] Initialize frontend Vite React TypeScript app skeleton in apps/web/package.json
- [ ] T004 [P] Initialize backend Fastify TypeScript app skeleton in apps/api/package.json
- [ ] T005 [P] Add shared TypeScript base config in tsconfig.base.json
- [ ] T006 [P] Add ESLint and Prettier base configuration in eslint.config.js
- [ ] T007 [P] Add environment variable templates for web and api in .env.example
- [ ] T008 [P] Setup test infrastructure: configure Vitest in apps/api/vitest.config.ts with unit and integration test paths
- [ ] T009 [P] Setup frontend test infrastructure: configure Vitest + React Testing Library in apps/web/vitest.config.ts
- [ ] T010 [P] Configure E2E test infrastructure: setup Playwright in tests/e2e with browser config and fixture patterns
- [ ] T011 [P] Setup Dependabot vulnerability scanning and license audit in .github/dependabot.yml
- [ ] T012 Create root scripts for test execution: npm run test:unit, test:integration, test:e2e, test:all in package.json

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 全ユーザーストーリー共通の土台実装とメタデータスキーマ統合

**⚠️ CRITICAL**: このフェーズ完了までUS1-US3の作業を開始しない

- [ ] T013 Setup SQLite connection and Drizzle client bootstrap in apps/api/src/db/client.ts
- [ ] T014 Define foundational database schema for notes, items, metadata, and export snapshots in apps/api/src/db/schema.ts
- [ ] T015 Create initial Drizzle migration for foundational schema in apps/api/src/db/migrations/0001_initial.sql
- [ ] T016 [P] Implement API server bootstrap with Fastify plugins in apps/api/src/server.ts
- [ ] T017 [P] Implement global error handler and request logging middleware in apps/api/src/middleware/error-handler.ts
- [ ] T018 [P] Implement runtime env validation with zod in apps/api/src/config/env.ts
- [ ] T019 [P] Create shared domain and DTO types in packages/shared-types/src/outliner.ts
- [ ] T020 [P] Configure Tailwind CSS and design tokens in apps/web/src/styles/tokens.css
- [ ] T021 [P] Create API client and base query utilities in apps/web/src/lib/api-client.ts
- [ ] T022 [P] Setup unit tests for schema validation and migration integrity in apps/api/tests/unit/db-schema.test.ts
- [ ] T023 [P] Setup integration tests for Fastify server startup and middleware stack in apps/api/tests/integration/server-bootstrap.test.ts

**Checkpoint**: Foundation ready - user story implementation can begin

---

## Phase 3: User Story 1 - Fast Thought Capture and Structuring (Priority: P1) 🎯 MVP

**Goal**: 階層アウトラインの高速入力、移動、折りたたみ、自動保存を提供する

**Independent Test**: 新規ノートで10項目以上を追加し、並べ替え・インデント変更・折りたたみ後に再読み込みで状態維持を確認する

### Tests for User Story 1 🚨 WRITE TESTS FIRST

- [ ] T024 [P] [US1] Write unit tests for note-repository CRUD methods (expectations only, no implementation) in apps/api/tests/unit/repositories/note-repository.test.ts
- [ ] T025 [P] [US1] Write unit tests for item-repository tree move transaction logic in apps/api/tests/unit/repositories/item-repository.test.ts
- [ ] T026 [P] [US1] Write unit tests for note-service optimistic locking and version conflicts in apps/api/tests/unit/services/note-service.test.ts
- [ ] T027 [P] [US1] Write unit tests for item-service create/delete/reorder/indent operations in apps/api/tests/unit/services/item-service.test.ts
- [ ] T028 [US1] Write integration test for note creation to persistence workflow in apps/api/tests/integration/note-workflow.test.ts
- [ ] T029 [US1] Write integration test for item tree move and collapse state persistence in apps/api/tests/integration/item-tree-workflow.test.ts
- [ ] T030 [P] [US1] Write component tests for outline-tree rendering and editing interactions in apps/web/tests/components/outline-tree.test.tsx
- [ ] T031 [P] [US1] Write component tests for note-workspace keyboard navigation and item focus in apps/web/tests/components/note-workspace.test.tsx
- [ ] T032 [US1] Write integration test for autosave debounce and conflict resolution flow in apps/web/tests/integration/autosave.test.ts
- [ ] T033 [US1] Write E2E test for US1 independent test scenario (10+ items, reorder, collapse, reload state) in tests/e2e/us1-capture-structure.spec.ts

### Implementation for User Story 1

- [ ] T034 [P] [US1] Implement note repository CRUD methods in apps/api/src/repositories/note-repository.ts (make T024 tests pass)
- [ ] T035 [P] [US1] Implement outline item repository and tree move transaction in apps/api/src/repositories/item-repository.ts (make T025 tests pass)
- [ ] T036 [US1] Implement note service with optimistic locking for autosave in apps/api/src/services/note-service.ts (make T026 tests pass)
- [ ] T037 [US1] Implement item service for create update delete reorder indent logic in apps/api/src/services/item-service.ts (make T027 tests pass)
- [ ] T038 [US1] Implement notes and items routes from contract in apps/api/src/routes/notes-routes.ts (verify T028 passes)
- [ ] T039 [US1] Implement item move and collapse routes in apps/api/src/routes/items-routes.ts (verify T029 passes)
- [ ] T040 [P] [US1] Build core outline editor tree component in apps/web/src/features/outliner/components/outline-tree.tsx (make T030 tests pass)
- [ ] T041 [P] [US1] Build note workspace page and keyboard input flow in apps/web/src/pages/note-workspace.tsx (make T031 tests pass)
- [ ] T042 [US1] Implement autosave hook with debounce and conflict feedback in apps/web/src/features/outliner/hooks/use-autosave.ts (make T032 tests pass)
- [ ] T043 [US1] Implement undo redo state history manager in apps/web/src/features/outliner/stores/history-store.ts (verify undo/redo in T033 e2e)

**Checkpoint**: User Story 1 is fully functional and independently testable

---

## Phase 4: User Story 2 - Focused Review with Visual Clarity (Priority: P2)

**Goal**: 大規模ノートでも検索・強調・フォーカス表示で見直し効率を高める

**Independent Test**: 100項目ノートで検索して該当へ移動し、強調状態が再表示後も保持されることを確認する

### Tests for User Story 2 🚨 WRITE TESTS FIRST

- [ ] T044 [P] [US2] Write unit tests for search/filter query logic in apps/api/tests/unit/services/search-service.test.ts
- [ ] T045 [P] [US2] Write unit tests for highlight state update and persistence in apps/api/tests/unit/repositories/item-visual-state-repository.test.ts
- [ ] T046 [US2] Write integration test for search endpoint with large outline (100+ items) in apps/api/tests/integration/search-performance.test.ts
- [ ] T047 [P] [US2] Write component tests for search-panel result navigation and highlighting in apps/web/tests/components/search-panel.test.tsx
- [ ] T048 [P] [US2] Write component tests for focus-toolbar and highlight state toggling in apps/web/tests/components/focus-toolbar.test.tsx
- [ ] T049 [US2] Write E2E test for US2 independent test scenario (search 100-item outline, navigate results, persist highlight) in tests/e2e/us2-focused-review.spec.ts

### Implementation for User Story 2

- [ ] T050 [P] [US2] Implement search and filter API endpoint for notes in apps/api/src/routes/search-routes.ts (make T044 tests pass)
- [ ] T051 [P] [US2] Implement highlight update use case in item service in apps/api/src/services/item-highlight-service.ts (make T045 tests pass)
- [ ] T052 [US2] Persist highlight and focus display properties in item repository in apps/api/src/repositories/item-visual-state-repository.ts (verify T046 passes)
- [ ] T053 [P] [US2] Build search panel with result navigation in apps/web/src/features/search/components/search-panel.tsx (make T047 tests pass)
- [ ] T054 [P] [US2] Build highlight and focus toolbar UI in apps/web/src/features/outliner/components/focus-toolbar.tsx (make T048 tests pass)
- [ ] T055 [US2] Integrate search highlight focus state into outline tree rendering in apps/web/src/features/outliner/components/outline-tree.tsx (verify T049 e2e passes)

**Checkpoint**: User Stories 1 and 2 work independently

---

## Phase 5: User Story 3 - AI-Ready Context Management (Priority: P3)

**Goal**: AI連携前提のメタ情報管理とメタ情報保持エクスポートを提供する

**Independent Test**: 項目メタ情報を編集し、jsonエクスポート結果に構造とメタ情報が含まれることを確認する

### Tests for User Story 3 🚨 WRITE TESTS FIRST

- [ ] T056 [P] [US3] Write unit tests for metadata-repository upsert and validation rules in apps/api/tests/unit/repositories/metadata-repository.test.ts
- [ ] T057 [P] [US3] Write unit tests for export-service json/markdown payload generation and checksum validation in apps/api/tests/unit/services/export-service.test.ts
- [ ] T058 [P] [US3] Write unit tests for metadata schemas with purpose/category/tags/contextNote constraints in apps/api/tests/unit/schemas/metadata-schema.test.ts
- [ ] T059 [US3] Write integration test for metadata upsert to persistence and export with metadata in apps/api/tests/integration/metadata-export-workflow.test.ts
- [ ] T060 [P] [US3] Write component tests for metadata-panel editing and validation in apps/web/tests/components/metadata-panel.test.tsx
- [ ] T061 [P] [US3] Write component tests for export-dialog format selection and payload download in apps/web/tests/components/export-dialog.test.tsx
- [ ] T062 [US3] Write E2E test for US3 independent test scenario (add metadata, export json, verify structure and metadata) in tests/e2e/us3-ai-ready-metadata.spec.ts

### Implementation for User Story 3

- [ ] T063 [P] [US3] Implement metadata repository upsert and validation rules in apps/api/src/repositories/metadata-repository.ts (make T056 tests pass)
- [ ] T064 [P] [US3] Implement export service with json markdown payload generation in apps/api/src/services/export-service.ts (make T057 tests pass)
- [ ] T065 [P] [US3] Create metadata validation schemas in apps/api/src/schemas/metadata-schema.ts (make T058 tests pass)
- [ ] T066 [US3] Implement metadata service for purpose category tags contextNote in apps/api/src/services/metadata-service.ts (verify T059 passes)
- [ ] T067 [US3] Implement metadata and export contract routes in apps/api/src/routes/metadata-export-routes.ts (verify T059 passes)
- [ ] T068 [P] [US3] Build metadata editor panel in apps/web/src/features/metadata/components/metadata-panel.tsx (make T060 tests pass)
- [ ] T069 [US3] Build export action UI and payload download flow in apps/web/src/features/export/components/export-dialog.tsx (make T061 tests pass)
- [ ] T070 [US3] Integrate metadata state and export action into note workspace in apps/web/src/pages/note-workspace.tsx (verify T062 e2e passes)

**Checkpoint**: All user stories are independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: 全体品質、運用性、パフォーマンス検証、リリース準備

- [ ] T071 [P] Document architecture decision records for stack and persistence choices in docs/decisions/001-outliner-architecture.md
- [ ] T072 [P] Add production-oriented logging redaction and log field policy in apps/api/src/middleware/logging-policy.ts
- [ ] T073 Setup performance baseline testing with Playwright: 100-item outline p95 UI response time (target: ≤200ms) in tests/e2e/performance-baselines.spec.ts
- [ ] T074 Setup API performance testing: measure p95 response times for major endpoints (target: ≤500ms) in apps/api/tests/performance/api-profiles.test.ts
- [ ] T075 Improve performance hotspots for large outline rendering in apps/web/src/features/outliner/components/outline-tree.tsx (based on T073 results)
- [ ] T076 [P] Update developer runbook and commands in README.md
- [ ] T077 Validate quickstart flow and align command list in specs/001-modern-ai-outliner/quickstart.md
- [ ] T078 Run all tests and verify coverage meets baseline (target: >80%) in CI: npm run test:all
- [ ] T079 Validate Constitution Principle compliance: code quality, testing, security, UX/performance, dependencies before merge

---

## Dependencies & Execution Order

### Phase Dependencies

- Setup (Phase 1): no dependencies EXCEPT T001-T002 must complete before T003-T012
- Foundational (Phase 2): depends on Phase 1 completion (T008-T012 essential), blocks all user stories
- User Stories (Phase 3-5): depend on Phase 2 completion; tests (TXX) MUST be written before implementations (TYY) in each phase
- Polish (Phase 6): depends on US1-US3 completion and all test tasks passing

### User Story Dependencies

- US1 (P1): starts after Foundational Phase 2, no dependency on US2 or US3. Test tasks (T024-T033) must pass before implentation tasks (T034-T043) begin.
- US2 (P2): starts after Foundational Phase 2 AND US1 completion, depends functionally on US1 editor surface. Test tasks (T044-T049) before implementations (T050-T055).
- US3 (P3): starts after Foundational Phase 2 AND US1 completion, reuses US1 note workspace and API base. Test tasks (T056-T062) before implementations (T063-T070).

### Story Completion Order

1. US1 (MVP)
2. US2
3. US3

---

## Parallel Opportunities

- Phase 1 setup: T003-T007 parallelizable after T001-T002; T008-T012 (test infra) can partially overlap
- Phase 2 foundational: T016-T021 parallelizable after T013-T015; T022-T023 unit/integration tests can overlap with implementation prep
- Phase 3 US1: T024-T027 unit tests parallelizable; T028-T029 integration tests can overlap; T030-T031 component tests parallelizable; then T034-T035 implementations can run after their corresp. tests
- Phase 4 US2: T044-T045 unit tests parallelizable; T047-T048 component tests parallelizable; then T050-T051 implementations
- Phase 5 US3: T056-T058 unit tests parallelizable; T060-T061 component tests parallelizable; then T063-T065 implementations
- Phase 6 polish: T073-T074 performance testing parallelizable; T071-T072, T076-T077 documentation parallelizable

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
