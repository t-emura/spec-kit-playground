# Tasks: Automated Test Pipeline

**Input**: Design documents from `/specs/002-test-pipeline/`  
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup

**Purpose**: Verify local baseline and prepare CI directory structure

- [x] T001 Run `npm run test:all` locally end-to-end and confirm all tests pass as CI baseline; note any environment variables required
- [x] T002 Create `.github/workflows/` directory (if not already present)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Create the workflow file skeleton with trigger events — required before any job can be added

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T003 Create `.github/workflows/ci.yml` with `on:` trigger block (`pull_request` types `[opened, synchronize, reopened]` targeting `main`, and `push` targeting `main`) and top-level `name: CI`

**Checkpoint**: Workflow file exists with correct triggers — job phases can now begin

---

## Phase 3: User Story 1 — Automated Test Execution on PR (Priority: P1) 🎯 MVP

**Goal**: All four test+lint jobs run automatically on every PR and push to main, with results visible as GitHub status checks

**Independent Test**: Create a PR from any branch → verify `lint-and-typecheck`, `unit-tests`, `integration-tests`, and `e2e-tests` status checks all appear and pass on the PR page

### Implementation for User Story 1

- [x] T004 [P] [US1] Add `lint-and-typecheck` job to `.github/workflows/ci.yml`: `runs-on: ubuntu-latest`, `timeout-minutes: 10`, steps: `actions/checkout@v4` → `actions/setup-node@v4` (node-version: `'20'`, cache: `'npm'`) → `npm ci` → `npm run lint` → `npm run typecheck`
- [x] T005 [P] [US1] Add `unit-tests` job to `.github/workflows/ci.yml`: `runs-on: ubuntu-latest`, `timeout-minutes: 15`, same checkout/setup-node/npm-ci steps → `npm run test:unit`
- [x] T006 [P] [US1] Add `integration-tests` job to `.github/workflows/ci.yml`: `runs-on: ubuntu-latest`, `timeout-minutes: 15`, same checkout/setup-node/npm-ci steps → `npm run test:integration`
- [x] T007 [US1] Add `e2e-tests` job to `.github/workflows/ci.yml`: `runs-on: ubuntu-latest`, `timeout-minutes: 20`, `needs: [unit-tests, integration-tests]`, steps: checkout → setup-node → `npm ci` → `npx playwright install --with-deps chromium` → `npm run test:e2e`
- [ ] T008 [US1] Push `.github/workflows/ci.yml` to remote branch `002-test-pipeline`, open a test PR targeting `main`, and verify all four status checks (`lint-and-typecheck`, `unit-tests`, `integration-tests`, `e2e-tests`) appear in the PR checks section and complete successfully

**Checkpoint**: US1 complete — all test jobs run on PRs and results are visible as GitHub status checks

---

## Phase 4: User Story 2 — Main Branch Protection (Priority: P2)

**Goal**: The `main` branch requires all four CI checks to pass before a PR can be merged; failing PRs are blocked

**Independent Test**: Create a PR with an intentional lint error → verify the merge button is blocked and shows a failing required check; revert the error → verify merge becomes unblocked

### Implementation for User Story 2

- [x] T009 [US2] Configure `main` branch protection rule using `gh api` to set required status checks: `lint-and-typecheck`, `unit-tests`, `integration-tests`, `e2e-tests` with `strict: true` (require branch to be up to date); command: `gh api repos/{owner}/{repo}/branches/main/protection --method PUT` with appropriate JSON body — see contracts/ci-workflow-contract.md for full rule specification
- [ ] T010 [US2] Verify branch protection: add `invalid typescript!!!` to `apps/api/src/index.ts`, push to a temporary branch, open a PR targeting `main`, confirm the merge button is blocked due to `lint-and-typecheck` failure; then `git revert HEAD`, push, and confirm the check turns green and merge is re-enabled

**Checkpoint**: US2 complete — broken PRs cannot be merged into main

---

## Phase 5: User Story 3 — Pipeline Execution History and Artifact Retention (Priority: P3)

**Goal**: Coverage reports and Playwright HTML reports are saved as downloadable artifacts for 30 days after each pipeline run

**Independent Test**: After a successful pipeline run, navigate to the GitHub Actions run summary and confirm `coverage-api`, `coverage-web`, and `playwright-report` artifacts are listed and downloadable; download `playwright-report` and open `index.html` in a browser

### Implementation for User Story 3

- [x] T011 [US3] Verify or add `@vitest/coverage-v8` devDependency to `apps/web/package.json` (required by vitest coverage provider `v8`); run `npm install` if added
- [x] T012 [P] [US3] Update `unit-tests` job in `.github/workflows/ci.yml`: change `npm run test:unit` to `npm run test:unit -- --coverage`; add `actions/upload-artifact@v4` step after tests with `name: coverage-web`, `path: apps/web/coverage/`, `retention-days: 30`
- [x] T013 [P] [US3] Update `integration-tests` job in `.github/workflows/ci.yml`: change `npm run test:integration` to `npm run test:integration -- --coverage`; add `actions/upload-artifact@v4` step with `name: coverage-api`, `path: apps/api/coverage/`, `retention-days: 30`
- [x] T014 [US3] Add `actions/upload-artifact@v4` step to `e2e-tests` job in `.github/workflows/ci.yml` with `if: always()`, `name: playwright-report`, `path: playwright-report/`, `retention-days: 30`
- [ ] T015 [US3] Trigger a pipeline run (push to `002-test-pipeline`), navigate to the GitHub Actions run summary, confirm `coverage-api`, `coverage-web`, and `playwright-report` artifacts appear; run `gh run download <run-id> --name playwright-report --dir ./tmp/playwright-report` and open `./tmp/playwright-report/index.html` to verify report content

**Checkpoint**: US3 complete — all artifacts are retained for 30 days and accessible from the Actions UI

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and cleanup

- [ ] T016 Run `gh workflow list` and `gh run list --limit 5` to confirm the `CI` workflow is registered and execution history is visible
- [ ] T017 Follow all steps in `specs/002-test-pipeline/quickstart.md` end-to-end to validate the complete pipeline behavior
- [ ] T018 Clean up any temporary branches or test PRs created during T008, T010, T015
- [ ] T019 Commit all changes to `002-test-pipeline` branch and open PR to `main`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 — creates the YAML file all subsequent tasks write into
- **US1 (Phase 3)**: Depends on Phase 2 — adds jobs to the existing YAML file
- **US2 (Phase 4)**: Depends on Phase 3 — branch protection must reference check names that already exist from US1
- **US3 (Phase 5)**: Depends on Phase 3 — adds artifact steps to jobs defined in US1
- **Polish (Phase 6)**: Depends on Phases 3–5

### User Story Dependencies

- **US1 (P1)**: No dependency on other stories — implement first
- **US2 (P2)**: Requires US1 check names to exist before branch protection can reference them
- **US3 (P3)**: Requires US1 jobs to exist as anchors for artifact upload steps

### Within Each User Story

- T004, T005, T006 can be written in parallel (separate job blocks in the same file — coordinate to avoid edit conflicts)
- T007 depends on T004 + T005 + T006 (e2e job references unit-tests and integration-tests via `needs:`)
- T012, T013 can be written in parallel (different jobs)
- T014 depends on T007 (e2e job must exist)

### Parallel Opportunities

- T004, T005, T006 (US1 job definitions) can be drafted in parallel if working on separate branches and merged
- T012, T013 (US3 coverage artifacts) can be added in parallel
- T009 (US2 branch protection) and T011–T014 (US3 artifacts) can be worked in parallel once US1 is complete

---

## Parallel Example: User Story 1

```bash
# These three jobs can be written in parallel (each is an independent YAML block):
Task T004: "Add lint-and-typecheck job to .github/workflows/ci.yml"
Task T005: "Add unit-tests job to .github/workflows/ci.yml"
Task T006: "Add integration-tests job to .github/workflows/ci.yml"

# T007 must wait for T004-T006 (references them via needs:)
Task T007: "Add e2e-tests job with needs: [unit-tests, integration-tests]"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001–T002)
2. Complete Phase 2: Foundational (T003)
3. Complete Phase 3: US1 (T004–T008)
4. **STOP and VALIDATE**: Open a PR and confirm all 4 checks appear and pass
5. Merge to main if ready — CI is now active

### Incremental Delivery

1. Setup + Foundational → Workflow file skeleton ready
2. US1 → Tests run on every PR (CI is live, delivers core value)
3. US2 → Broken PRs can no longer be merged (quality gate active)
4. US3 → Coverage and test reports preserved per run (observability active)

---

## Notes

- [P] tasks = different file sections/blocks, safe to write concurrently
- All workflow jobs share the same pattern: checkout → setup-node (v4, node 20, cache npm) → npm ci → test command
- `npx playwright install --with-deps chromium` adds ~2–3 min to e2e job; this is expected
- Branch protection (T009) must be applied after T008 confirms checks are working — otherwise protection references non-existent check names
- If `@vitest/coverage-v8` is already installed (check `node_modules`), skip T011
- Commit after each phase to keep history clean and easy to bisect
