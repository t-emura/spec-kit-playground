# Tasks: Standalone Mode (Electron)

**Input**: Design documents from `/specs/004-standalone-mode/`
**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, contracts/ ✓, quickstart.md ✓

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Electron workspace の新規作成と依存パッケージの追加

- [X] T001 Create `apps/electron/` directory with:
  - `package.json`:
    ```json
    {
      "name": "electron-app",
      "private": true,
      "main": "dist/main.js",
      "type": "module",
      "scripts": {
        "test:unit": "vitest run --config vitest.config.ts tests/unit"
      },
      "devDependencies": {
        "vitest": "^2"
      }
    }
    ```
    ※ `test:unit` を定義することで root の `npm run test:unit --workspaces --if-present` が T019b のテストを検出・実行する（Constitution Principle II 準拠）
  - `vitest.config.ts`:
    ```ts
    import { defineConfig } from 'vitest/config';
    export default defineConfig({ test: { environment: 'node' } });
    ```
  - `tsconfig.json` extending `../../tsconfig.base.json` with `"compilerOptions": { "target": "ES2022", "module": "NodeNext", "moduleResolution": "NodeNext", "outDir": "./dist" }`
    ※ `NodeNext` は ESM + CJS 自動判別に対応し Electron 36 と相性が良い（`Node16` より推奨）
- [X] T002 Add `"apps/electron"` to `workspaces` array in root `package.json` ※ T001 完了後すぐに実行（npm install より前に workspace 登録が必要）
- [X] T003 Add dependencies to root `package.json` devDependencies に `electron ^36`, `electron-builder ^25`, `@electron/rebuild`, `wait-on`; `apps/api/package.json` の dependencies に `@fastify/static ^8`; run `npm install` from repo root
- [X] T004 [P] Add `STATIC_DIR` env var to `apps/api/src/config/env.ts` — `z.string().min(1).default('./public')` をスキーマに追加

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: APIサーバーの静的配信対応と Electron から呼び出し可能なインターフェース整備

**⚠️ CRITICAL**: すべての US フェーズはこのフェーズ完了後に開始できる

- [X] T005 Update `apps/api/src/server.ts` — `@fastify/static` をインポートし `server.register(fastifyStatic, { root: resolve(env.STATIC_DIR), prefix: '/', wildcard: false })` を登録。APIルート登録後に `server.setNotFoundHandler((_req, reply) => reply.sendFile('index.html'))` を追加して SPA fallback を実装
- [X] T006 [P] Update `apps/api/src/index.ts` — `buildServer` と `startServer` を named export で公開。`if (process.env.ELECTRON !== 'true')` ガード付きで `main()` を自動実行するよう変更
- [X] T007 [P] Create `apps/electron/preload.ts` — `contextBridge.exposeInMainWorld('electron', { apiBase: string })` のスケルトンのみ実装。ポート番号の注入は T008（main.ts）で `ipcMain.handle('get-port', () => port)` を実装した後、preload 側で `const port = await ipcRenderer.invoke('get-port')` で取得する方式（IPC 一本化）。T007 時点では型定義とシェルのみ作成し、IPC 接続実装は T008 完了後に追記する
  ※ **T007 チェックボックスは「型定義とスケルトン完成時」に付けること。IPC 実装は T008 で完結させる。**

**Checkpoint**: Foundational 完了 — US1〜US3 の実装を開始できる

---

## Phase 3: US1 - シングルコマンド起動 (Priority: P1) 🎯 MVP

**Goal**: `npm run dev:electron` でElectronウィンドウが開き、React SPA が動作する

**Independent Test**: `npm run dev:electron` を実行 → ウィンドウが開く → ノートを作成・保存 → APIレスポンスが正常に返ることを確認

- [X] T008 [US1] Create `apps/electron/main.ts`
  **⚠️ 重要: ESM の static import はモジュール評価時に即実行されるため、apps/api/src/index.ts の自動起動ガード（T006）が機能するよう `process.env.ELECTRON = 'true'` を設定してから dynamic import で buildServer を読み込む。**
  実装パターン:
  ```ts
  // static imports（electron 本体のみ）
  import { app, BrowserWindow, ipcMain } from 'electron';
  import path from 'path';

  // ELECTRON フラグを設定してから API モジュールを dynamic import
  process.env.ELECTRON = 'true';
  const { buildServer } = await import('../api/src/index.js');
  ```
  `app.whenReady()` で Fastify を起動（`port: 0` で自動割り当て）し、実際のポートを取得後:
  - `ipcMain.handle('get-port', () => port)` を登録
  - `BrowserWindow` を作成（`webPreferences.preload: path.join(import.meta.dirname, 'preload.js')` — ESM 環境では `__dirname` 不可）
  - `loadURL('http://127.0.0.1:{port}')` でUIを表示
  **T007 完了作業（本タスク内で実施）**: `apps/electron/preload.ts` のスケルトンに IPC 実装を追記する:
  `const port = await ipcRenderer.invoke('get-port'); contextBridge.exposeInMainWorld('electron', { apiBase: \`http://127.0.0.1:\${port}\` })`
  ※ top-level await は ESM + Electron 28+ で動作する
- [X] T009 [P] [US1] Update `apps/web/src/lib/api-client.ts`
  `const BASE_URL = (window as any).electron?.apiBase ?? import.meta.env['VITE_API_BASE_URL'] ?? 'http://localhost:8787'`
  変更理由: Electron モードではポートが実行時自動割当（`port: 0`）のため、preload が `contextBridge.exposeInMainWorld('electron', { apiBase: 'http://127.0.0.1:{port}' })` で注入した値を優先する。`window.electron` が undefined（通常ブラウザ）の場合は `VITE_API_BASE_URL` → fallback の順で解決され、既存 dev/prod 動作に影響しない。
  Unit test として `apps/web/src/lib/api-client.test.ts` を新規作成し、(a) `window.electron.apiBase = 'http://127.0.0.1:12345'` のとき fetch URL が `http://127.0.0.1:12345/v1/notes` になること、(b) `window.electron` が undefined のとき `VITE_API_BASE_URL` fallback になることを検証する。
- [X] T010 [P] [US1] Update `apps/web/vite.config.ts` — ELECTRON proxy bypass
- [X] T011 [US1] Update root `package.json` scripts — main field + build/dev:electron/start scripts
- [X] T012 [US1] Add `rebuild:native` script to root `package.json`

---

## Phase 4: US2 - データの永続化と再起動後の継続利用 (Priority: P2)

**Goal**: 再起動後もデータが `app.getPath('userData')` に保持される

**Independent Test**: `dev:electron` でノート作成 → アプリ終了 → 再起動 → 同じノートが表示されることを確認

- [X] T013 [US2] Update `apps/electron/main.ts` — app.isPackaged STATIC_DIR + SQLITE_DB_PATH env vars
- [X] T014 [P] [US2] Update `apps/electron/main.ts` — DB dir mkdirSync
- [X] T015 [US2] Update `apps/electron/main.ts` — graceful shutdown before-quit handler
- [ ] T016 [P] [US2] Add integration test to `apps/api/tests/integration/server-bootstrap.test.ts` — 以下を検証するテストを追加:
  - `beforeAll` で `mkdtempSync` を使って一時ディレクトリを作成し `index.html`（最小限の内容で可）を書き込む。`STATIC_DIR` にそのパスを設定してサーバーを起動
  - `GET /` が 200 と `index.html` の内容を返すこと
  - `GET /v1/notes` が JSON を返すこと
  - `afterAll` で一時ディレクトリを削除（`rmSync(tmpDir, { recursive: true })`）
- [X] T016b [US2] Add unit test to `apps/api/tests/unit/` for graceful shutdown

---

## Phase 5: US3 - 起動失敗時のわかりやすいエラー通知 (Priority: P3)

**Goal**: `STATIC_DIR` 不在・DB書き込み不可などの起動失敗時に `dialog.showErrorBox()` で明確なメッセージを表示

**Independent Test**: ビルドなしで `npm start` を実行 → `STATIC_DIR` が存在しないエラーダイアログが表示されることを確認

- [X] T017 [US3] Update `apps/electron/main.ts` — STATIC_DIR existence check + error dialog
- [X] T018 [P] [US3] Update `apps/electron/main.ts` — DB write permission check + error dialog
- [X] T019 [P] [US3] Update `apps/api/src/index.ts` — EADDRINUSE error handling
- [X] T019b [P] [US3] startup-errors unit tests in `apps/electron/tests/unit/startup-errors.test.ts`
- [X] T019c [US3] EADDRINUSE integration test (added to server-bootstrap.test.ts)

---

## Phase 6: Polish & GitHub Release

**Purpose**: electron-builder 設定、GitHub Release CI、既存ワークフローの回帰確認

- [X] T020 Create `electron-builder.yml` at repo root
- [X] T020b [P] [US1] Playwright e2e smoke test `tests/e2e/electron-app.spec.ts`
- [X] T021 [P] Create `.github/workflows/release.yml`
- [X] T022 [P] Verify existing `npm run dev` (2-process) is unchanged — builds pass ✓
- [X] T023 Run full test suite — all 25 test files pass (API unit 70, web unit 33, electron unit 4, integration 27)

---

## Dependencies (Story Completion Order)

```text
Phase 1 (T001→T002→T003, T004 parallel)
  └── Phase 2 (T005–T007)
        └── Phase 3/US1 (T008–T012)  ← MVP
              └── Phase 4/US2 (T013–T016b)
                    └── Phase 5/US3 (T017–T019c)
                          └── Phase 6/Polish (T020–T023)
```

## Parallel Execution Opportunities

**Phase 1**: T004 can run in parallel after T003 (T001→T002→T003 are sequential)
**Phase 2**: T006, T007 can run in parallel after T005
**Phase 3 (US1)**: T009, T010 can run in parallel after T008
**Phase 4 (US2)**: T014, T016, T016b can run in parallel after T013 and T015
**Phase 5 (US3)**: T018, T019, T019b can run in parallel after T017; T019c after T019
**Phase 6**: T020b, T021, T022 can run in parallel after T020

## Implementation Strategy

### MVP Scope (Phase 1–3 only, ~8 tasks)

T001 → T002 → T003 → T004+T005 → T006+T007 → T008 → T009+T010 → T011 → T012

**MVP delivers**: `npm run dev:electron` でElectronウィンドウが開き、React UIが表示され、APIが動作する。US1（シングルコマンド起動）が完全に動作した状態。

### Incremental Delivery

1. **MVP** (Phase 1–3): Electron ウィンドウでアプリが動作
2. **+データ永続化** (Phase 4): userData にデータ保存、再起動後も維持
3. **+エラー通知** (Phase 5): ダイアログによる起動エラー表示
4. **+配布** (Phase 6): GitHub Release インストーラ自動生成

---

*Total tasks: 27*  
*US1 tasks: 6 (T008–T012, T020b)*  
*US2 tasks: 5 (T013–T016b)*  
*US3 tasks: 5 (T017–T019c)*  
*Setup/Foundational: 7 (T001–T007)*  
*Polish: 5 (T020b, T020–T023)*
