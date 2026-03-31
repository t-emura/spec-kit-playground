# Implementation Plan: ファイルベースのデータ保存

**Branch**: `006-file-based-storage` | **Date**: 2026-03-31 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/006-file-based-storage/spec.md`

## Summary

データの永続化をSQLite（better-sqlite3 + Drizzle ORM）からJSONファイルに置き換える。既存のRepository層のインターフェースを維持しつつ、実装をファイルI/Oに差し替えることで、Service層・Route層への影響を最小化する。各ノートは `{UUID}-{サニタイズ済みタイトル}.json` 形式の独立ファイルとして保存し、アイテムはネスト構造（`children` 配列）で格納する。

## Technical Context

**Language/Version**: TypeScript 5.6, Node.js (Electron 36 embedded)
**Primary Dependencies**: Fastify 5.8.4, Zod 3.22, React 19, Vite 5.4
**Storage**: JSON files on local filesystem (replacing SQLite/Drizzle ORM)
**Testing**: Vitest 2.1 (unit + integration)
**Target Platform**: Desktop (Electron 36, Linux/macOS/Windows)
**Project Type**: Desktop app (Electron + embedded Fastify API)
**Performance Goals**: ファイル保存 <1s、100ノート×50アイテムの起動読み込み <5s
**Constraints**: 単一プロセス/単一ユーザー、オフライン対応、ファイル破損時の graceful degradation
**Scale/Scope**: 100ノート規模（各50アイテム平均）

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **Code quality and observability** — ファイルI/O操作にstructured logging追加（pino経由）。エラーはフルコンテキスト付きでログ出力。
- [x] **Test strategy** — Unit: FileNoteRepository, FileItemRepository の各メソッド。Integration: ファイル保存→読み込み往復テスト、破損ファイルハンドリング。E2E: 既存のElectron e2eテスト。
- [x] **Security surface** — ファイル名サニタイズ（パストラバーサル防止）。ユーザー入力のタイトルをファイル名に使用するため、`/`, `..`, null bytes等を除去。ファイル権限はOS標準に委任。
- [x] **Non-functional requirements** — SC-001: 保存<1s、SC-002: 起動<5s。atomic write（temp→rename）でデータ整合性保証。JSON pretty-printで可読性確保。
- [x] **Dependency and error handling** — better-sqlite3, drizzle-orm を削除（依存減少）。新規依存なし（Node.js fs API のみ）。ファイルI/Oエラーはノート単位で隔離。

## Project Structure

### Documentation (this feature)

```text
specs/006-file-based-storage/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
apps/
├── api/
│   ├── src/
│   │   ├── config/
│   │   │   └── env.ts                 # MODIFY: SQLITE_DB_PATH → NOTES_DIR
│   │   ├── db/                        # REMOVE: client.ts, schema.ts, migrate.ts, seed.ts
│   │   ├── storage/                   # NEW: ファイルベース永続化層
│   │   │   ├── file-client.ts         # ファイルI/Oユーティリティ（atomic write, read, delete）
│   │   │   ├── note-file-schema.ts    # JSONファイルのZodスキーマ + 型定義
│   │   │   └── sanitize.ts            # ファイル名サニタイズユーティリティ
│   │   ├── repositories/             # MODIFY: DB実装→ファイル実装に差し替え
│   │   │   ├── note-repository.ts     # REWRITE: Drizzle → fs JSON read/write
│   │   │   ├── item-repository.ts     # REWRITE: flat DB rows → nested JSON tree
│   │   │   ├── metadata-repository.ts # REWRITE: DB → JSON内埋め込み
│   │   │   └── export-snapshot-repository.ts  # KEEP (スコープ外、後日対応)
│   │   ├── routes/                    # MINIMAL CHANGE: リポジトリ初期化部分のみ
│   │   ├── services/                  # NO CHANGE: リポジトリIF不変のため
│   │   └── middleware/                # NO CHANGE
│   └── tests/
│       ├── unit/
│       │   ├── storage/               # NEW: file-client, sanitize のユニットテスト
│       │   ├── repositories/          # REWRITE: ファイルベースリポジトリテスト
│       │   └── services/              # MINIMAL CHANGE: モック差し替え
│       └── integration/               # REWRITE: ファイルI/O統合テスト
├── electron/
│   └── main.ts                        # MODIFY: DB初期化 → ノートディレクトリ初期化
└── web/                               # NO CHANGE
```

**Structure Decision**: 既存のMonorepo構造（apps/api, apps/web, apps/electron）を維持。`apps/api/src/db/` を `apps/api/src/storage/` に置き換え、Repository層の実装のみ差し替える。Service層・Route層・Web層は変更最小化。

## Complexity Tracking

> No constitution violations. Dependency count decreases (removing better-sqlite3 + drizzle-orm). No new external dependencies added.
