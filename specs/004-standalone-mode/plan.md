# Implementation Plan: Standalone Mode

**Branch**: `004-standalone-mode` | **Date**: 2026-03-29 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-standalone-mode/spec.md`

## Summary

Fastify APIサーバーとReact SPAを **Electron** で包み、プラットフォームネイティブのデスクトップアプリとして提供する。Electronのmainプロセスが Fastify を起動し、BrowserWindow が `http://localhost:{port}` を表示する構成。`electron-builder` で macOS・Windows・Linux 向けインストーラを生成し、GitHub Release に自動アップロードする。

## Technical Context

**Language/Version**: TypeScript 5.6 / Node.js 22（Electron内蔵）  
**Primary Dependencies**: Fastify 5.8、`@fastify/static ^8`（新規）、`electron ^36`（新規）、`electron-builder ^25`（新規）、`@electron/rebuild`（新規）  
**Storage**: SQLite (better-sqlite3) — `app.getPath('userData')/data/outliner.db`（Electron標準ユーザーデータパス）  
**Testing**: Vitest（unit/integration）、Playwright（e2e）  
**Target Platform**: macOS（arm64/x64）、Windows（x64）、Linux（x64）  
**Distribution**: GitHub Release（electron-builder `publish: github`）  
**Performance Goals**: APIレスポンス ≤500ms p95、UI操作 ≤200ms p95  
**Constraints**: `better-sqlite3` は Electron ABI 向けリビルド必要（`@electron/rebuild`）  
**Scale/Scope**: シングルユーザー、ローカル実行

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **コード品質**: 既存APIとUIのロジックは変更最小限。Electronエントリーポイントのみ追加
- [x] **テスト戦略**: `server-bootstrap.test.ts` に静的配信テストを追加。`contextIsolation` 設定のユニットテストを追加
- [x] **セキュリティ**: `contextIsolation: true`、`nodeIntegration: false`、preload経由のContext Bridgeのみ
- [x] **非機能要件**: ウィンドウサイズ・タイトル・アイコンを既存デザインシステムに準拠。パフォーマンス影響なし
- [x] **依存関係**: electron（メジャー採用実績多数）、electron-builder（GitHub Release連携標準）、@fastify/static（Fastify公式）、@electron/rebuild（ネイティブアドオン標準）

**Gate result: PASS** — 全ゲートクリア

## Project Structure

### Documentation (this feature)

```text
specs/004-standalone-mode/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (変更対象)

```text
apps/electron/                          ← 新規 workspace
├── main.ts                             ← Electronメインプロセス（~140行）
├── preload.ts                          ← Context Bridge（~50行）
├── tsconfig.json
└── package.json

apps/api/
├── src/
│   ├── server.ts                       ← @fastify/static 登録 + SPA fallback 追加
│   ├── index.ts                        ← 直接起動 vs Electron import を分岐
│   └── config/
│       └── env.ts                      ← STATIC_DIR 環境変数追加
└── package.json                        ← @fastify/static ^8 追加

apps/web/
├── src/
│   └── main.tsx                        ← API base URL を preload から取得（~5行）
└── vite.config.ts                      ← proxy 設定を動的切り替え（~10行）

package.json (root)
├── workspaces: [..., "apps/electron"]
└── scripts: dev / build / start 更新

.github/workflows/
└── release.yml                         ← 新規（tag push で GitHub Release 生成）

electron-builder.yml                    ← 新規（配布設定）
```
