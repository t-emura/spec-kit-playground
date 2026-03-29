# Implementation Plan: Automated Test Pipeline

**Branch**: `002-test-pipeline` | **Date**: 2026-03-28 | **Spec**: [spec.md](spec.md)  
**Input**: Feature specification from `/specs/002-test-pipeline/spec.md`

## Summary

GitHub ActionsのCIワークフローを追加し、PRおよびmainブランチへのプッシュをトリガーに、ユニット・インテグレーション・E2Eテストを自動実行する。既存のVitest（ユニット/インテグレーション）およびPlaywright（E2E）テストスイートをCI環境で動作させ、テスト結果とカバレッジレポートをアーティファクトとして保存する。加えてブランチ保護ルールにより、テスト未通過のPRはmainにマージ不可とする。

## Technical Context

**Language/Version**: TypeScript 5.6 / Node.js 24 (LTS)  
**Primary Dependencies**: GitHub Actions (CI基盤), Vitest 2.1 (unit/integration), Playwright 1.48 (E2E), ESLint (lint), tsc (typecheck)  
**Storage**: N/A（ワークフロー設定ファイルのみ）  
**Testing**: Vitest（apps/api unit+integration, apps/web unit）, Playwright（tests/e2e Chromium）  
**Target Platform**: GitHub Actions ubuntu-latest runner (Linux)  
**Project Type**: CI/CD configuration（GitHub Actions YAMLワークフロー）  
**Performance Goals**: パイプライン全体 ≤15分（平均）、タイムアウト上限30分  
**Constraints**: E2EはAPI+Webサーバーの起動が必要（playwright.config.ts の webServer 設定済み）; CI時は `retries: 2`, `workers: 1` で実行  
**Scale/Scope**: 単一開発者、全PR + mainブランチへの直接プッシュをカバー

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **Code Quality & Observability**: ワークフロー内でESLintおよびtsc typecheckを実行。ステップごとにログ出力を確保
- [x] **Testing Standards**: Unit / Integration / E2E を独立ジョブとして実行。カバレッジレポートを生成・保存
- [x] **Security**: ワークフローにシークレットを直書きしない。GitHub Actions Secretsを使用。`.env`ファイルはコミットしない
- [x] **Non-functional**: パイプライン起動 ≤5分、全体完了 ≤15分（成功基準SC-001, SC-002に対応）。パフォーマンス影響なし（設定ファイルのみ）
- [x] **Dependency & Error Handling**: 新規npm依存なし（GitHub Actions組み込みアクションのみ）。タイムアウト設定でハング対策済み

**Constitution Check: PASS ✅ — 全ゲート通過。Phase 0 に進む。**

## Project Structure

### Documentation (this feature)

```text
specs/002-test-pipeline/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
.github/
└── workflows/
    └── ci.yml           # メインCIワークフロー（lint, typecheck, unit, integration, e2e）
```

**Structure Decision**: このfeatureはGitHub Actionsワークフロー設定ファイルのみを追加する。既存のmonorepo構造（apps/api, apps/web, tests/e2e）に変更を加えず、`.github/workflows/ci.yml` 1ファイルを新規作成する。ブランチ保護ルールはGitHub リポジトリ設定（UIまたはGitHub CLI）で構成する。
