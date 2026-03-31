# Research: ファイルベースのデータ保存

**Date**: 2026-03-31
**Feature**: 006-file-based-storage

## R1: Atomic File Writes in Node.js

**Decision**: temp file + `fs.renameSync()` パターンを使用する

**Rationale**: `fs.writeFileSync()` は書き込み途中でプロセスがクラッシュした場合にファイルが破損する。同一ファイルシステム上の `rename()` はPOSIX仕様でアトミック操作が保証されている。temp file に書き込み後、`renameSync()` で最終ファイル名に差し替えることで、常に完全なファイルか以前の完全なファイルのどちらかがディスク上に存在する状態を保証する。

**Alternatives considered**:
- `write-file-atomic` npm パッケージ — 外部依存が増える。Node.js標準APIで十分実現可能
- `fsync` + direct write — rename よりアトミック性の保証が弱い
- SQLite WAL mode（現状維持）— ファイルベースへの移行という要件に反する

## R2: ファイル名サニタイズ戦略

**Decision**: OS共通の禁止文字セットを除去し、UUIDプレフィックスで一意性を保証する

**Rationale**: Windows/macOS/Linux でファイル名に使えない文字が異なる（Windows: `<>:"/\|?*`、macOS: `:/`、Linux: `/`）。全OS共通で安全にするため、以下のルールを適用:
1. `<>:"/\|?*` および制御文字(0x00-0x1F)を除去
2. 先頭・末尾の空白とドットを除去
3. 空文字列になった場合は `untitled` にフォールバック
4. 最大長を200文字に制限（ファイルシステムの255byte制限に余裕を持たせる）

**Alternatives considered**:
- Base64エンコード — 可読性が失われる（FR-002の要件違反）
- ハッシュのみ — 人間が識別できない（FR-002の要件違反）
- encodeURIComponent — `%xx` エンコードは可読性を損なう

## R3: Repository層の差し替え戦略

**Decision**: 既存のRepositoryクラスのインターフェース（メソッドシグネチャ）を維持し、内部実装のみファイルI/Oに置き換える

**Rationale**: 現在のアーキテクチャは明確な3層構造:
- Routes → Services → Repositories → DB
Services はRepository のメソッド（`findAll`, `findById`, `create`, `update`, `delete`）を呼ぶ。このインターフェースを変えなければ、Service層とRoute層は一切変更不要。

**Alternatives considered**:
- Service層から直接ファイルI/O — 層の責務分離が崩れる。テスタビリティ低下
- 新しい抽象インターフェース（interface + DI） — 現時点では過剰。将来必要になったら導入

## R4: ネスト構造のJSON ↔ フラット構造の変換

**Decision**: ファイル上はネスト構造、メモリ上もネスト構造で扱い、APIレスポンスもネスト構造で返す

**Rationale**: 現在のAPIは `GET /v1/notes/:noteId/items` でフラットなアイテム配列を返している。ファイル形式がネスト構造になるため、APIレスポンスもネスト構造に変更する方が自然。ただし、個別アイテムの CRUD（`PATCH /v1/items/:itemId`）はIDベースのルックアップが必要なため、内部的にはフラットなMapも保持する。

**Alternatives considered**:
- ファイルはネスト、APIはフラット（変換コスト＋複雑性）
- 両方フラット（ファイルの可読性が低下、SC-003違反）

## R5: Drizzle ORM / better-sqlite3 の削除

**Decision**: `better-sqlite3` をルートの `dependencies` から削除、`drizzle-orm` を `apps/api` の `dependencies` から削除

**Rationale**: ファイルベースに移行するためDBドライバとORMは不要になる。依存削減は Constitution Principle V（Dependency Management）に合致。`esbuild` バンドルからも `better-sqlite3` の external 設定を削除できる。`electron-builder.yml` の `asarUnpack: "**/better-sqlite3/**"` も不要になる。

**Alternatives considered**:
- 残しておく（将来使うかも） — 不要な依存は削除すべき（Constitution V）
- 段階的削除 — 一度に削除する方がシンプル。export_snapshots はスコープ外だがDB不要

## R6: Electron main.ts の初期化フロー変更

**Decision**: `SQLITE_DB_PATH` → `NOTES_DIR` に変更。ノートディレクトリの存在確認と作成をDB初期化の代わりに行う。

**Rationale**: 現在 `main.ts` は `process.env.SQLITE_DB_PATH` をセットして `runMigrations()` を呼んでいる。ファイルベースでは:
1. `process.env.NOTES_DIR` をノートディレクトリパスにセット
2. `mkdirSync(notesDir, { recursive: true })` でディレクトリ作成
3. `runMigrations()` 呼び出しを削除
4. `buildServer()` はそのまま（env.NOTES_DIR を読んでファイルリポジトリに渡す）

**Alternatives considered**:
- `buildServer()` にパスを引数で渡す — env.ts のキャッシュパターンが既に確立されているため、同じパターンを踏襲する方が一貫性がある
