# Data Model: Automated Test Pipeline

**Feature**: 002-test-pipeline  
**Date**: 2026-03-28

---

## Overview

このfeatureはGitHub ActionsのCI設定ファイルを追加するものであり、アプリケーションデータベースのスキーマ変更は一切含まない。「データモデル」はCI/CDパイプラインの設定構造と、GitHub ActionsプラットフォームのEvent/Job/Artifactモデルを指す。

---

## Workflow Event Model

### Trigger Events（トリガーイベント）

```
WorkflowTrigger
├── pull_request
│   ├── branches: [main]
│   └── types: [opened, synchronize, reopened]
└── push
    └── branches: [main]
```

| フィールド | 型 | 説明 |
|---|---|---|
| `event_name` | enum | `pull_request` または `push` |
| `ref` | string | トリガーとなったブランチ/タグ参照（例: `refs/heads/main`） |
| `sha` | string | トリガーとなったコミットSHA |
| `actor` | string | アクションを実行したGitHubユーザー |

---

## Job Model

### Jobs（ジョブ定義）

```
CIWorkflow
├── Job: lint-and-typecheck
│   ├── runs-on: ubuntu-latest
│   ├── timeout-minutes: 10
│   └── steps: checkout → setup-node → npm ci → lint → typecheck
│
├── Job: unit-tests
│   ├── runs-on: ubuntu-latest
│   ├── timeout-minutes: 15
│   └── steps: checkout → setup-node → npm ci → test:unit → upload-coverage
│
├── Job: integration-tests
│   ├── runs-on: ubuntu-latest
│   ├── timeout-minutes: 15
│   └── steps: checkout → setup-node → npm ci → test:integration → upload-coverage
│
└── Job: e2e-tests
    ├── runs-on: ubuntu-latest
    ├── needs: [unit-tests, integration-tests]
    ├── timeout-minutes: 20
    └── steps: checkout → setup-node → npm ci → install-playwright → test:e2e → upload-report
```

### Job Status（ジョブステータス）

| ステータス | 説明 |
|---|---|
| `queued` | 実行待ち（前提ジョブ未完了を含む） |
| `in_progress` | 実行中 |
| `success` | 全ステップ成功 |
| `failure` | いずれかのステップが非ゼロ終了 |
| `cancelled` | 前提ジョブ失敗によりスキップ（`if: success()` デフォルト動作） |
| `timed_out` | タイムアウト上限に達した |

---

## Artifact Model

### Artifacts（成果物）

```
Artifact
├── name: string             # 識別名（例: "coverage-api"）
├── path: string             # アップロード対象のファイルパス
├── retention-days: number   # 保持期間（30日）
└── if: always()             # 失敗時も保存するかどうか
```

| アーティファクト名 | ソースパス | 保持期間 | 失敗時も保存 |
|---|---|---|---|
| `coverage-api` | `apps/api/coverage/` | 30日 | No |
| `coverage-web` | `apps/web/coverage/` | 30日 | No |
| `playwright-report` | `playwright-report/` | 30日 | Yes（失敗調査のため） |

---

## Required Status Checks（必須ステータスチェック）

ブランチ保護ルールに登録するステータスチェック名（GitHub Actionsジョブ名と一致）：

| チェック名 | 対応ジョブ | 必須 |
|---|---|---|
| `lint-and-typecheck` | lint-and-typecheck | ✅ |
| `unit-tests` | unit-tests | ✅ |
| `integration-tests` | integration-tests | ✅ |
| `e2e-tests` | e2e-tests | ✅ |

---

## Environment Variables

CIワークフロー内で参照される環境変数：

| 変数名 | 値 / 設定元 | 用途 |
|---|---|---|
| `CI` | GitHub Actions 自動設定（`true`） | Playwright retries/workers, forbidOnly の切り替え |
| `NODE_ENV` | `test` | テスト実行時の環境識別 |

> シークレットは現時点では不要（外部API呼び出しなし）。将来的な外部サービス連携時は GitHub Actions Secrets を使用する。
