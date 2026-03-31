# Tasks: ファイルベースのデータ保存

**Input**: Design documents from `/specs/006-file-based-storage/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

## Phase 1: Setup

**Purpose**: Remove SQLite/Drizzle dependencies and update build configuration

- [X] T001 Remove `better-sqlite3` from root `package.json` dependencies and `drizzle-orm`, `drizzle-kit` from `apps/api/package.json` dependencies. Run `npm install` to update lock file.
- [X] T002 [P] Update `scripts/build-api-bundle.mjs`: remove `external: ['better-sqlite3']` setting. Update `electron-builder.yml`: remove `asarUnpack: "**/better-sqlite3/**"` entry.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Create the file-based storage layer that all user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T003 [P] Create `apps/api/src/storage/sanitize.ts`: implement `sanitizeFileName(title: string): string` that removes `<>:"/\|?*` and control characters (0x00-0x1F), trims leading/trailing whitespace and dots, falls back to `untitled` for empty results, and truncates to 200 characters. Implement `buildNoteFileName(id: string, title: string): string` that returns `{id}-{sanitized_title}.json`. Implement `extractNoteIdFromFileName(fileName: string): string | null` that parses UUID prefix from filename.
- [X] T004 [P] Create `apps/api/src/storage/note-file-schema.ts`: define Zod schemas for NoteFile, Item (recursive with `children: Item[]`), and Metadata per `data-model.md`. Export TypeScript types inferred from schemas. Include `noteFileSchema.parse()` for validation on file read.
- [X] T005 Create `apps/api/src/storage/file-client.ts`: implement `readNoteFile(filePath: string): NoteFile | null` (returns null on missing/corrupt file, logs error with pino), `writeNoteFile(dirPath: string, note: NoteFile): void` (atomic write via temp file + `renameSync`, pretty-print JSON with 2-space indent), `deleteNoteFile(filePath: string): void`, `listNoteFiles(dirPath: string): string[]` (lists `*.json` files). All I/O errors must be logged with full context (file path, operation, error message).
- [X] T006 Update `apps/api/src/config/env.ts`: replace `SQLITE_DB_PATH` env var with `NOTES_DIR` (default: `'./data/notes'`). Keep all other env vars unchanged.

**Checkpoint**: Storage layer ready — repository rewrite can begin

---

## Phase 3: User Story 1 — データをファイルとして保存・読み込みできる (Priority: P1) 🎯 MVP

**Goal**: ノート・アイテム・メタデータの全CRUD操作をファイルベースで動作させる。アプリ再起動後もデータが保持される。

**Independent Test**: ノートを作成してアイテムを追加し、アプリを再起動して同じデータが表示されれば検証完了。

### Implementation for User Story 1

- [X] T007 [US1] Rewrite `apps/api/src/repositories/note-repository.ts`: replace Drizzle queries with file-client.ts calls. `findAll()` reads all JSON files from `NOTES_DIR` via `listNoteFiles` + `readNoteFile`, returning note metadata (without full item trees for list view). `findById(id)` scans directory for file matching UUID prefix. `create(input)` generates UUID, builds filename via `sanitizeFileName`, writes JSON. `update(id, input)` reads existing file, applies changes, increments version, writes back (rename file if title changed). `delete(id)` calls `deleteNoteFile`. Constructor accepts `notesDir: string` parameter.
- [X] T008 [US1] Rewrite `apps/api/src/repositories/item-repository.ts`: replace Drizzle queries with in-memory operations on the nested item tree stored in the note JSON file. `getItemTree(noteId)` reads note file and returns the `items` array (already nested). `createItem(noteId, input)` reads note, inserts new item at correct parent/position in nested tree, writes back. `updateItem(itemId, input)` finds item by ID in tree (recursive search), applies changes, writes back. `deleteItem(itemId)` removes item and all its children from tree, writes back. `moveItem(itemId, targetParentId, targetIndex)`, `indentItem(itemId)`, `outdentItem(itemId)` manipulate tree structure. Constructor accepts `notesDir: string`.
- [X] T009 [US1] Rewrite `apps/api/src/repositories/metadata-repository.ts`: replace Drizzle queries with operations on the `metadata` field embedded in each item within the note JSON file. `getMetadata(itemId)` finds item in tree and returns its `metadata` field. `upsertMetadata(itemId, input)` finds item, sets/updates `metadata`, writes note file back. Constructor accepts `notesDir: string`.
- [X] T010 [US1] Update `apps/api/src/routes/notes-routes.ts`: change repository initialization from `new NoteRepository(db)` / `new ItemRepository(db)` to `new NoteRepository(env.NOTES_DIR)` / `new ItemRepository(env.NOTES_DIR)`. Remove `db` import. Remove `item-visual-state-repository` usage if present.
- [X] T011 [US1] Update `apps/api/src/routes/items-routes.ts`: change repository initialization to use `env.NOTES_DIR`. Remove `db` import. Update item response shape if needed for nested structure.
- [X] T012 [US1] Update `apps/api/src/routes/metadata-export-routes.ts`: change metadata repository initialization to use `env.NOTES_DIR`. Remove export route (`POST /v1/notes/:noteId/export`) per FR-010 scope exclusion. Remove `ExportService` and `ExportSnapshotRepository` imports.
- [X] T013 [US1] Update `apps/api/src/routes/search-routes.ts`: adapt search to read from JSON files instead of DB. `SearchService` must iterate note files and search item content.
- [X] T014 [US1] Remove `apps/api/src/db/` directory entirely: delete `client.ts`, `schema.ts`, `migrate.ts`, `seed.ts`, and `migrations/` folder. Remove `apps/api/src/repositories/export-snapshot-repository.ts` (scoped out). Remove `apps/api/src/repositories/item-visual-state-repository.ts` if it exists and is DB-dependent.
- [X] T015 [US1] Update `apps/api/src/index.ts`: remove `runMigrations` export. Update `buildServer()` to no longer depend on DB client. Ensure `NOTES_DIR` directory is created with `mkdirSync` if it doesn't exist.
- [X] T016 [US1] Update `apps/electron/main.ts`: replace `process.env.SQLITE_DB_PATH` with `process.env.NOTES_DIR` (packaged: `path.join(app.getPath('userData'), 'data', 'notes')`, dev: `path.join(app.getAppPath(), 'data', 'notes')`). Remove `runMigrations()` call. Remove `migrationsDir` variable. Keep `mkdirSync` for notes directory. Update `startup-checks.ts` if it references DB paths.
- [X] T017 [US1] Update `apps/web/src/lib/api-client.ts`: change item type definitions from flat structure (`parentId`, `depth`) to nested structure (`children: Item[]`). Update all type references used by components.
- [X] T018 [US1] Update web components that consume item data to work with nested `children` arrays instead of flat `parentId`-based lists. Key files: components that render the outline tree, focus view, and any component that builds tree structure from flat items.
- [X] T019 [US1] Rewrite `apps/api/tests/unit/repositories/` test files: replace Drizzle/DB mocks with temp directory-based file I/O tests. Test each repository method (create, read, update, delete) against real files in a temp directory. Use `mkdtempSync` for test isolation.
- [X] T020 [US1] Rewrite `apps/api/tests/integration/` test files: replace in-memory SQLite tests with file-based round-trip tests. Test note creation → file exists on disk → read back matches → update persists → delete removes file. Test corrupted file handling (FR-007): write invalid JSON to a file, verify app loads other notes successfully.
- [X] T021 [US1] Update `apps/api/tests/unit/services/` test files: update mock repository interfaces to match new constructor signatures (`notesDir` instead of `db`). Verify service tests still pass with updated mocks.

**Checkpoint**: At this point, User Story 1 should be fully functional — notes save to and load from JSON files. App restart preserves all data.

---

## Phase 4: User Story 2 — 保存ファイルをユーザーが直接確認・バックアップできる (Priority: P2)

**Goal**: 保存されたJSONファイルが人間に読みやすく、ファイル名からノートを識別でき、手動コピーでバックアップ・復元できる。

**Independent Test**: テキストエディタでノートファイルを開き、タイトルとアイテムが読み取れれば検証完了。

### Implementation for User Story 2

- [X] T022 [US2] Verify and ensure JSON output readability in `apps/api/src/storage/file-client.ts`: confirm `JSON.stringify(note, null, 2)` produces properly indented, human-readable output. Verify Japanese characters are NOT escaped (no `\uXXXX` — Node.js default is fine). Verify file naming includes sanitized title per FR-002.
- [X] T023 [US2] Add integration test for backup/restore scenario in `apps/api/tests/integration/`: create a note via API, copy the resulting JSON file to a temp location, delete the original, copy back, restart server, verify note is restored with all items and metadata intact.

**Checkpoint**: Files are human-readable, identifiable by filename, and can be backed up/restored by simple copy.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Cleanup, documentation, and final validation

- [X] T024 [P] Update `apps/api/src/services/export-service.ts` and `apps/api/src/services/search-service.ts`: remove or stub DB-dependent logic. Remove export-service.ts if no longer used (FR-010 scoped out).
- [X] T025 Run `npm run typecheck` and fix all TypeScript errors across the monorepo.
- [X] T026 Run `npm run test:unit` and `npm run build:electron` — fix all test failures and build errors. Verify esbuild bundle succeeds without better-sqlite3 external.
- [X] T027 Run the full CI pipeline locally (`npm run lint && npm run typecheck && npm run test:unit && npm run build:electron`) and verify all checks pass.
- [X] T028 [P] Clean up unused imports and dead code across all modified files. Remove any remaining references to Drizzle, better-sqlite3, or the old `db/` module.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup (T001 for dependency removal)
- **User Story 1 (Phase 3)**: Depends on Foundational (T003–T006 must be complete)
- **User Story 2 (Phase 4)**: Depends on User Story 1 (file output must exist to verify readability)
- **Polish (Phase 5)**: Depends on User Story 1 completion

### User Story Dependencies

- **User Story 1 (P1)**: Requires Foundational phase only. This is the MVP.
- **User Story 2 (P2)**: Requires US1 — readability and backup/restore are qualities of the files US1 produces.

### Within Each Phase

**Phase 2 parallel opportunities**:
- T003 (sanitize.ts) and T004 (note-file-schema.ts) can run in parallel
- T005 (file-client.ts) depends on T003 and T004
- T006 (env.ts) can run in parallel with T003–T005

**Phase 3 execution order**:
1. T007, T008, T009 (repositories) — can be parallelized (different files)
2. T010, T011, T012, T013 (routes) — after repositories, can be parallelized
3. T014, T015 (remove old code, update index) — after routes updated
4. T016 (Electron main.ts) — after index.ts updated
5. T017, T018 (web frontend) — can be parallelized, independent of backend order
6. T019, T020, T021 (tests) — after implementation is complete

---

## Parallel Example: Phase 3 (User Story 1)

```
# Batch 1 — Repositories (parallel, different files):
T007: Rewrite note-repository.ts
T008: Rewrite item-repository.ts
T009: Rewrite metadata-repository.ts

# Batch 2 — Routes (parallel, after Batch 1):
T010: Update notes-routes.ts
T011: Update items-routes.ts
T012: Update metadata-export-routes.ts
T013: Update search-routes.ts

# Batch 3 — Cleanup + Electron (sequential):
T014: Remove db/ directory
T015: Update index.ts
T016: Update Electron main.ts

# Batch 4 — Frontend (parallel, independent of Batch 2-3):
T017: Update api-client.ts types
T018: Update web components

# Batch 5 — Tests (after all implementation):
T019: Rewrite unit tests
T020: Rewrite integration tests
T021: Update service test mocks
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (remove dependencies)
2. Complete Phase 2: Foundational (storage layer)
3. Complete Phase 3: User Story 1 (full CRUD via files)
4. **STOP and VALIDATE**: Create note, add items, restart app, verify data persists
5. All existing functionality works with file storage

### Incremental Delivery

1. Setup + Foundational → Storage layer ready
2. Add User Story 1 → Full file-based CRUD working (MVP! 🎯)
3. Add User Story 2 → Readability and backup verified
4. Polish → Clean code, passing CI, no dead imports

---

## Notes

- [P] tasks = different files, no dependencies on each other
- [US1]/[US2] labels map tasks to user stories for traceability
- Constitution requires tests (Principle II) — unit and integration tests included in US1
- Atomic writes (temp + rename) are critical for data integrity — implemented in T005
- File name sanitization (T003) must handle all 3 OS platforms
- Commit after each task or logical batch
- Stop at any checkpoint to validate independently
