# Tasks: Electron Binary Distribution via GitHub Releases

**Input**: Design documents from `/specs/005-electron-release-binary/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel with other [P] tasks at the same phase
- **[Story]**: User story label (US1=end-user download, US2=tag push release, US3=dry run)

> **Baseline note**: Before starting, verify the 3 target files are in their expected pre-modification state:
> `electron-builder.yml` (missing `asarUnpack`/`releaseType`), `release.yml` (missing `workflow_dispatch`),
> `apps/electron/main.ts` (`SQLITE_DB_PATH` not set before dynamic import). If already partially modified,
> skip the corresponding tasks.

---

## Phase 1: Foundational (Blocking Prerequisite — asarUnpack)

**Purpose**: Fix critical packaging configuration without which all packaged binaries crash at launch

**⚠️ CRITICAL**: `better-sqlite3.node` cannot load from inside `.asar` archives. This must be fixed before any release can work.

- [ ] T001 Add `asarUnpack: ["**/better-sqlite3/**"]` to `electron-builder.yml` so the native `.node` file is extracted outside the asar archive
- [ ] T002 Add `releaseType: release` under the `publish:` section in `electron-builder.yml` so GitHub Releases are published (not left as Draft)

**Checkpoint**: `electron-builder.yml` now produces installable binaries that can load `better-sqlite3`

---

## Phase 2: User Story 2 — Tag Push Triggers Release (Priority: P1)

**Goal**: `vX.Y.Z` tag push → GitHub Actions auto-builds all platforms → GitHub Release created with binaries attached

**Independent Test**: Push a `v0.1.0-test` tag to a fork/test repo, verify all 3 platform matrix jobs complete and GitHub Release appears with `.dmg`, `.exe`, `.AppImage` attached.

### Implementation for User Story 2

- [ ] T003 [US2] Add `workflow_dispatch` trigger block to `.github/workflows/release.yml` with a `dry_run` boolean input (default: `true`); also add `fail-fast: true` explicitly to the `strategy:` block to ensure that if one platform fails, remaining jobs are cancelled and no partial Release is created (satisfies FR-008)
- [ ] T004 [US2] Update the `Package and publish` step in `.github/workflows/release.yml` to conditionally pass `--publish never` or `--publish always`: `npx electron-builder --publish ${{ inputs.dry_run == 'true' && 'never' || 'always' }}` — note: `workflow_dispatch` boolean inputs arrive as strings (`'true'`/`'false'`), not JS booleans; tag-push runs have `inputs.dry_run` as empty string which evaluates to `'always'` correctly
- [ ] T005 [P] [US2] Add `upload-artifact` step in `.github/workflows/release.yml` conditioned on `inputs.dry_run == 'true'`, using matrix-specific artifact name `electron-artifacts-${{ matrix.os }}` to avoid name collisions across parallel jobs; glob pattern: `dist-electron/**/*.{dmg,exe,AppImage}` (excludes `.blockmap` and other electron-builder metadata files)
- [ ] T006 [P] [US2] Add an inline comment block in `.github/workflows/release.yml` (above the matrix section) documenting: (a) FR-002 is satisfied by the `matrix.os` strategy, (b) FR-005 and FR-007 are satisfied automatically by `electron-builder` reading `productName` and `version` from `package.json`, (c) FR-008 is satisfied by `fail-fast: true` — this serves as traceability between spec requirements and the workflow configuration

**Checkpoint**: User Story 2 complete — tag push creates GitHub Release; workflow_dispatch can also trigger builds

---

## Phase 3: User Story 1 — End-User Binary Works (Priority: P1)

**Goal**: Downloaded binary launches and creates/reads its SQLite database in the correct user data directory (not the install directory)

**Independent Test**: Package app locally with `npx electron-builder --publish never`, launch the binary, verify a notes database is created at `~/Library/Application Support/<appName>/data/outliner.db` (macOS) or equivalent, and the main window opens with no errors.

### Implementation for User Story 1

- [ ] T007 [US1] In `apps/electron/main.ts`, add a top-level block **before** the `await import('../api/src/index.js')` line: when `app.isPackaged`, compute `path.join(app.getPath('userData'), 'data', 'outliner.db')` and assign to `process.env.SQLITE_DB_PATH` — `app.getPath('userData')` is available before `whenReady()`, so this sets the value before `env.ts` caches it
- [ ] T008 [US1] In the same top-level block (T007), call `mkdirSync(path.join(app.getPath('userData'), 'data'), { recursive: true })` when `app.isPackaged`, so the DB directory exists before the import triggers `env.ts` evaluation
- [ ] T009 [US1] Remove the redundant `mkdirSync(dataDir, ...)` inside `app.whenReady()` that was handling packaged mode (now handled at top-level by T008); keep the dev-mode `dataDir` assignment for non-packaged use and verify `STATIC_DIR` setup is unaffected

### Test for User Story 1 (Constitution §II — required before implementation is complete)

- [ ] T010 [US1] In `tests/e2e/electron-app.spec.ts`, add an assertion after the existing `window.electron.apiBase` check: `GET /v1/notes` returns HTTP 200 with an array response — this confirms the DB was initialized correctly at startup (validates the `app.isPackaged=false` dev path and confirms no regressions from the top-level restructure; the packaged-mode path is validated separately via the independent test in the phase goal above)

**Checkpoint**: User Story 1 complete — packaged binary uses `userData` for DB; dev mode unchanged and covered by test

---

## Phase 4: User Story 3 — Dry Run Confirmation (Priority: P2)

**Goal**: Developer triggers workflow manually without a tag, downloads artifact from Actions, launches it to verify the build is good before publishing

**Independent Test**: Go to GitHub Actions → Release workflow → "Run workflow" button → set `dry_run: true` → verify all 3 matrix jobs succeed and artifacts (`.dmg`, `.exe`, `.AppImage`) appear under the workflow run's Artifacts section.

*Note: Core dry-run implementation (workflow_dispatch trigger + upload-artifact) is in T003–T005. This phase polishes the US3 experience.*

### Implementation for User Story 3

- [ ] T011 [US3] In `.github/workflows/release.yml`, ensure the upload-artifact step created in T005 has its condition expressed as a top-level YAML `if:` field on the step (not embedded inside the `run:` script body): `if: ${{ inputs.dry_run == 'true' }}` — this is a YAML structural concern, not a new condition; T005 defines the step content, T011 confirms the guard is at the YAML step level for readability
- [ ] T012 [P] [US3] Add a workflow summary step (`$GITHUB_STEP_SUMMARY`) to `.github/workflows/release.yml` that outputs the list of built artifacts and whether they were published or uploaded as artifacts — gives developers immediate feedback without navigating to the Artifacts tab

**Checkpoint**: User Story 3 complete — dry run workflow is independently usable and provides clear feedback

---

## Final Phase: Polish & Cross-Cutting Concerns

- [ ] T013 [P] Run `npm run build` locally and verify no TypeScript errors in the modified `apps/electron/main.ts`
- [ ] T014 [P] Run `npm run typecheck` (or equivalent) to confirm no regressions from the `main.ts` changes
- [ ] T015 Run existing CI test suite locally (`npm test`) to confirm the `main.ts` top-level restructure does not break the Electron e2e test (`tests/e2e/electron-app.spec.ts`), including the new T010 assertion
- [ ] T016 Validate `electron-builder.yml` YAML syntax by running `npx electron-builder --config electron-builder.yml --help` or a YAML linter — confirm `asarUnpack` and `releaseType` entries are syntactically valid and interpreted correctly
- [ ] T017 Create `docs/decisions/` directory if it does not already exist, then create `docs/decisions/001-electron-db-path-userdata.md` as an Architecture Decision Record documenting: the decision to use `app.getPath('userData')` for DB storage in packaged mode, the root cause (env.ts caches SQLITE_DB_PATH at module load time), the chosen fix, and the behavioral change (DB location differs between dev and packaged builds) — satisfies constitution §"Technical Decision Guidelines" which requires ADRs for cross-cutting data storage decisions

---

## Dependencies

```
T001–T002 (foundational — asarUnpack) ← MUST complete before any release test
    ↓
T003–T006 (US2: release.yml)    T007–T010 (US1: main.ts + test)   ← can run in parallel
    ↓                                   ↓
T011–T012 (US3: dry-run polish — depends on T003–T005)
    ↓
T013–T017 (polish — all parallel except T015 which depends on T007–T010)
```

## Parallel Execution Opportunities

| Parallel Group | Tasks | Note |
|---|---|---|
| Config + code | T003–T006 + T007–T010 | Different files: `release.yml` vs `main.ts` + test |
| Final validation | T013, T014, T016, T017 | Different commands/files, no conflicts |

## Implementation Strategy

**MVP (Minimum Viable Release)**:
- Phase 1 (T001–T002) + Phase 2 (T003–T006) — packaging fix + release automation
- Phase 3 (T007–T010) — packaged DB path fix + test coverage (constitution-required)

**Full Feature**: All phases including dry run (Phase 4) and polish/ADR (Final Phase).

**Suggested order for a single developer**:
1. T001–T002 (5 min) — edit `electron-builder.yml`
2. T007–T009 (15 min) — edit `main.ts`
3. T010 (10 min) — add e2e test assertion
4. T003–T006 (15 min) — edit `release.yml`
5. T011–T012 (10 min) — polish dry-run UX
6. T013–T017 (15 min) — local verification + ADR
