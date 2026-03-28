# Implementation Plan: Modern Thinking Outliner

**Branch**: `[001-modern-ai-outliner]` | **Date**: 2026-03-28 | **Spec**: [/specs/001-modern-ai-outliner/spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-modern-ai-outliner/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

思考整理に特化したモダンUIのアウトライナーを、Webアプリとして実装する。最優先は高速な階層編集体験（追加・移動・折りたたみ・検索）と自動保存であり、将来AI連携を見据えたメタデータ構造を先行して導入する。技術構成は Vite + React + TypeScript をフロントエンド、TypeScriptベースのAPI層と SQLite を永続化に採用し、CSSライブラリは Tailwind CSS + shadcn/ui で統一する。

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: TypeScript 5.x (frontend/backend), SQL (SQLite 3)
**Primary Dependencies**: React 19, Vite 7, Node.js 22 LTS, Fastify 5, better-sqlite3, Drizzle ORM, Tailwind CSS 4, shadcn/ui, TanStack Query
**Storage**: SQLite（ローカルファイルDB、Drizzleマイグレーション管理）
**Testing**: Vitest（unit）, React Testing Library（component）, Playwright（e2e）, Supertest（API integration）
**Target Platform**: モダンブラウザ（Desktop/Mobile）+ Linux上のNode実行環境
**Project Type**: Web application（frontend + backend モノレポ）
**Performance Goals**: UI操作 p95 <= 200ms、主要API p95 <= 500ms、初期表示 <= 2.5s（通常回線）
**Constraints**: オフライン一時編集許容、保存衝突時のデータ保全、100項目規模で快適操作、機密情報をログ出力しない
**Scale/Scope**: 単一ユーザー中心のv1、1ユーザーあたりノート数 1,000 件、1ノートあたり項目数 500 件想定

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] Code quality and observability approach defined
  - ESLint + Prettier + TypeScript strict、構造化ログ（pino）を backend 全APIで採用
- [x] Test strategy documented
  - unit/integration/e2e の3層を明示し、主要ユーザーフローにe2eを設定
- [x] Security surface assessed
  - 入力バリデーション（zod）、SQLはORM/プリペアドのみ、機密情報は環境変数管理
- [x] Non-functional requirements assessed
  - デザインシステムとして shadcn/ui を採用、パフォーマンス目標をTechnical Contextに定義
- [x] Dependency and error handling plan defined
  - 新規依存は purpose/license/maintenance を記録、エラーは統一フォーマットで返却しログ記録

Gate Status: PASS（Phase 0着手可）

## Project Structure

### Documentation (this feature)

```text
specs/001-modern-ai-outliner/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
apps/
├── web/
│   ├── src/
│   │   ├── components/
│   │   ├── features/
│   │   ├── pages/
│   │   ├── stores/
│   │   ├── hooks/
│   │   └── styles/
│   └── tests/
│       ├── unit/
│       └── component/
└── api/
    ├── src/
    │   ├── routes/
    │   ├── services/
    │   ├── repositories/
    │   ├── db/
    │   ├── middleware/
    │   └── schemas/
    └── tests/
        ├── integration/
        └── unit/

packages/
├── shared-types/
└── ui/

infra/
└── sqlite/

tests/
└── e2e/

docs/
└── decisions/
```

**Structure Decision**: frontend/backend分離のWebアプリ構成を採用。UIは apps/web、APIとSQLiteアクセスは apps/api、共通型とUI再利用部品を packages 配下に配置する。将来のAI連携は apps/api の routes/services 拡張で吸収し、既存データモデル互換を維持する。

## Phase 0 Research Plan

1. SQLite + React構成での競合回避と保存整合性の設計方針を確定
2. Tailwind CSS + shadcn/ui による情報密度の高いアウトライナーUIパターンを確定
3. 将来AI連携用メタデータ構造（互換性維持、エクスポート互換）を確定

## Phase 1 Design Outputs

1. data-model.md: Note/OutlineItem/Metadata/ExportSnapshot の論理モデルと制約
2. contracts/: ノート操作APIとエクスポートAPI契約
3. quickstart.md: ローカル開発手順（Vite + API + SQLite + テスト）

## Post-Design Constitution Check

- [x] Principle I (Code Quality): 責務分離と自己レビュー前提の構造
- [x] Principle II (Testing): unit/integration/e2e を成果物に反映
- [x] Principle III (Security): 入力検証、シークレット管理、SQL安全化を契約に反映
- [x] Principle IV (UX/Performance): レスポンス目標とアクセシビリティ観点を設計に反映
- [x] Principle V (Dependency/Error): 依存追加基準とエラー契約を明文化

Post-Design Gate Status: PASS

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None | N/A | N/A |
