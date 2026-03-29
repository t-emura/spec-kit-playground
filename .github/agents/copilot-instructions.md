# spec-kit-playground Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-03-29

## Active Technologies
- TypeScript 5.6 / Node.js 24 (LTS) + GitHub Actions (CI基盤), Vitest 2.1 (unit/integration), Playwright 1.48 (E2E), ESLint (lint), tsc (typecheck) (002-test-pipeline)
- N/A（ワークフロー設定ファイルのみ） (002-test-pipeline)
- TypeScript 5.6 + React 19, Tailwind CSS 3.4, Vite 5, React Router 6, TanStack Query 5 (003-ui-visual-hierarchy)
- N/A (UI-only change; backend remains SQLite via Drizzle ORM) (003-ui-visual-hierarchy)
- TypeScript 5.6 / Node.js 22 + Fastify 5.8, `@fastify/static` (新規追加), Vite 6 (ビルド), React 19 (004-standalone-mode)
- SQLite (better-sqlite3) — `apps/api/data/outliner.db`（デフォルト） (004-standalone-mode)
- TypeScript 5.6 / Node.js 22（Electron内蔵） + Fastify 5.8、`@fastify/static ^8`（新規）、`electron ^36`（新規）、`electron-builder ^25`（新規）、`@electron/rebuild`（新規） (004-standalone-mode)
- SQLite (better-sqlite3) — `app.getPath('userData')/data/outliner.db`（Electron標準ユーザーデータパス） (004-standalone-mode)
- TypeScript 5.6 / Node.js 22 + electron-builder 25（既存）, better-sqlite3（ネイティブモジュール） (005-electron-release-binary)
- better-sqlite3 — userData ディレクトリに SQLite ファイル (005-electron-release-binary)

- TypeScript 5.x (frontend/backend), SQL (SQLite 3) + React 19, Vite 7, Node.js 22 LTS, Fastify 5, better-sqlite3, Drizzle ORM, Tailwind CSS 4, shadcn/ui, TanStack Query (001-modern-ai-outliner)

## Project Structure

```text
src/
tests/
```

## Commands

npm test && npm run lint

## Code Style

TypeScript 5.x (frontend/backend), SQL (SQLite 3): Follow standard conventions

## Recent Changes
- 005-electron-release-binary: Added TypeScript 5.6 / Node.js 22 + electron-builder 25（既存）, better-sqlite3（ネイティブモジュール）
- 004-standalone-mode: Added TypeScript 5.6 / Node.js 22（Electron内蔵） + Fastify 5.8、`@fastify/static ^8`（新規）、`electron ^36`（新規）、`electron-builder ^25`（新規）、`@electron/rebuild`（新規）
- 004-standalone-mode: Added TypeScript 5.6 / Node.js 22 + Fastify 5.8, `@fastify/static` (新規追加), Vite 6 (ビルド), React 19


<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
