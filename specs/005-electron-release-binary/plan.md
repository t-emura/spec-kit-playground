# Implementation Plan: Electron Binary Distribution via GitHub Releases

**Branch**: `005-electron-release-binary` | **Date**: 2026-03-29 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/005-electron-release-binary/spec.md`

## Summary

バージョンタグ（`v*.*.*`）の push をトリガーに、GitHub Actions が macOS・Windows・Linux 向け Electron バイナリを自動ビルドし、GitHub Releases に公開する。既存の `release.yml` と `electron-builder.yml` をベースに、`asarUnpack`（ネイティブモジュール対応）・`workflow_dispatch`（ドライラン）・パッケージ版 DB パス修正を追加する。

## Technical Context

**Language/Version**: TypeScript 5.6 / Node.js 22  
**Primary Dependencies**: electron-builder 25（既存）, better-sqlite3（ネイティブモジュール）  
**Storage**: better-sqlite3 — userData ディレクトリに SQLite ファイル  
**Testing**: 既存 CI テストスイート（unit/integration/e2e）  
**Target Platform**: macOS（arm64/x64）, Windows x64, Linux x64  
**Project Type**: desktop-app（Electron）  
**Performance Goals**: ビルド完了まで 15 分以内（SC-001）  
**Constraints**: GitHub Actions 無料枠内・GitHub Release 添付ファイル 2GB 上限  
**Scale/Scope**: 3 プラットフォーム × 最大 2 アーキテクチャ = 最大 4 バイナリ/リリース

## Constitution Check

| Gate | Status | Notes |
|------|--------|-------|
| Code quality & observability | ✅ | 既存 lint/typecheck CI で担保 |
| Test strategy | ✅ | 既存テストスイート＋ `main.ts` の DB パス変更に対応した e2e テスト拡張（T010）が必要。リリースワークフロー自体はテスト不要 |
| Security surface | ✅ | `GH_TOKEN`（GITHUB_TOKEN）は Actions Secrets で管理。コード署名秘密鍵はスコープ外 |
| Non-functional requirements | ✅ | ビルド時間 SC-001（15分）、バイナリ即起動 SC-002 |
| Dependency & error handling | ✅ | 新規依存なし。ビルド失敗時は Release 非作成（FR-008 は electron-builder の動作で保証）|

## Project Structure

### Documentation (this feature)

```text
specs/005-electron-release-binary/
├── plan.md              ← This file
├── research.md          ← Phase 0 output
└── tasks.md             ← Phase 2 output (/speckit.tasks)
```

### Source Code (変更対象ファイル)

```text
electron-builder.yml          # asarUnpack 追加 + publish.releaseType
.github/workflows/release.yml # workflow_dispatch + dry_run input
apps/electron/main.ts         # SQLITE_DB_PATH の packaged 版対応
```

## Implementation Phases

### Phase A: electron-builder.yml の修正（Critical Fix）

**目的**: パッケージ版アプリで `better-sqlite3` ネイティブモジュールが正しく動作するよう `asarUnpack` を追加する

**変更内容**:
1. `asarUnpack: ["**/better-sqlite3/**"]` を追加
2. `publish.releaseType: release` を追加（Draft にならないよう）
3. `asar: true`（デフォルト）確認

### Phase B: SQLITE_DB_PATH のパッケージ版対応

**目的**: パッケージ版 Electron アプリで DB が `userData` ディレクトリに正しく作成されるようにする

**問題**: `env.SQLITE_DB_PATH` はモジュールロード時（top-level `await import`）にキャッシュされる。`app.whenReady()` 内で `process.env.SQLITE_DB_PATH = userData` を設定しても `env` オブジェクトに反映されない。

**テスト戦略（packaged モード）**: `app.isPackaged=true` のコードパスは CI での自動テストが困難（Electron の packaging → 起動という完全なパイプラインが必要）。T010 で `app.isPackaged=false`（開発モード）の回帰テストを追加し、packaged モードの動作確認は tasks.md Phase 3 の独立テスト（ローカルでの手動確認）で代替する。これは Constitution §II が求める "critical user journeys の e2e テスト" に対する意図的なトレードオフとして本 PR に明記する。

 `app.isPackaged ? userData/outliner.db : './data/outliner.db'` で決定し、`runMigrations(dbPath)` として渡す。さらに `buildServer()` が使う DB パスも同様に動的に決定する方法として、`SQLITE_DB_PATH` 環境変数を Electron プロセス起動時（`app.whenReady` より前、ただし import より後）に設定する。

**実装**: `app.getPath('userData')` は `app` モジュールインポート直後から使用可能（`whenReady` 前でも OK）。top-level の動的 import 前に `process.env.SQLITE_DB_PATH` を設定することで `env` に正しい値が反映される。

```typescript
// main.ts の top-level
process.env.ELECTRON = 'true';
// userData は whenReady 前でも取得可能
const dataDir = path.join(app.getPath('userData'), 'data');
mkdirSync(dataDir, { recursive: true });
process.env.SQLITE_DB_PATH = path.join(dataDir, 'outliner.db');
// ← この後に import すれば env.SQLITE_DB_PATH が正しい値になる
const { buildServer, runMigrations } = await import('../api/src/index.js');
```

### Phase C: release.yml の改善

**目的**: workflow_dispatch（FR-006）と必要なシステム依存の追加

**変更内容**:
1. `workflow_dispatch` トリガーと `dry_run` input を追加
2. publish コマンドを条件分岐（`--publish always` vs `--publish never`）
3. ドライラン時は `upload-artifact` で成果物を保存
4. macOS・Windows の `rebuild:native` が正しく動作するか確認

## Edge Case Decisions

### 同一バージョンタグの再 push（上書き）

`--publish always` で既存 Release が存在する場合、`electron-builder` はバイナリをアップロード・上書きする（Release 自体は再作成しない）。これは許容動作とする。意図しない再公開を防ぐ場合はブランチ保護ルールで force-push を禁止すること。

### 一部プラットフォームのみ失敗した場合

`strategy.fail-fast: true`（T003 で明示設定）により、1 ジョブの失敗で他ジョブはキャンセルされる。部分的な Release は作成されない（FR-008 遵守）。

### SC-001（15 分以内）の計測

初回リリース実行後に GitHub Actions のワークフロー実行時間を記録し、SC-001 を満たすか確認する。超過した場合は matrix の `cache: npm` 設定や `rebuild:native` のキャッシュを見直す。

### Architecture Decision Record

`apps/electron/main.ts` の `SQLITE_DB_PATH` 変更はユーザーデータ保存場所（クロスカッティング）に関わるため、Constitution §"Technical Decision Guidelines" に従い `docs/decisions/002-electron-db-path-userdata.md` に ADR を作成する（T017）。

## Complexity Tracking

なし（Constitution 違反なし — main.ts の test 拡張を T010 で追加済み）
