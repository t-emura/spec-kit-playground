# CI Workflow Contract

**Feature**: 002-test-pipeline  
**Date**: 2026-03-28  
**Type**: GitHub Actions Workflow Interface Contract

---

## Overview

このコントラクトは、CIパイプラインが外部（GitHub Actions プラットフォーム、開発者、ブランチ保護ルール）に対して公開するインターフェースを定義する。

---

## 1. Trigger Contract（起動契約）

パイプラインは以下のイベントで自動起動する：

```yaml
on:
  pull_request:
    branches: [main]
    types: [opened, synchronize, reopened]
  push:
    branches: [main]
```

| トリガー | 条件 | 保証 |
|---|---|---|
| `pull_request` → `main` | PR作成・更新・再オープン | 全チェックジョブが実行され、結果がPRのステータスに反映される |
| `push` → `main` | mainへの直接プッシュ | 全チェックジョブが実行される |

**契約違反条件**: トリガーイベント発生後5分以内にパイプラインが起動しない場合（GitHub Actionsインフラ障害を除く）

---

## 2. Status Check Contract（ステータスチェック契約）

パイプラインは以下の4つのステータスチェックをGitHubに報告する：

| チェック名 | 成功条件 | 失敗条件 |
|---|---|---|
| `lint-and-typecheck` | ESLint エラーゼロ かつ TypeScript 型エラーゼロ | いずれかに1件以上のエラー |
| `unit-tests` | 全ユニットテストがパス | 1件以上のテスト失敗またはタイムアウト |
| `integration-tests` | 全インテグレーションテストがパス | 1件以上のテスト失敗またはタイムアウト |
| `e2e-tests` | 全E2Eテストがパス（Playwright retries込み） | リトライ後も1件以上失敗またはタイムアウト |

**ブランチ保護との統合**: 上記4チェック全てが `success` でない限り、`main` ブランチへのマージは GitHub UI によってブロックされる。

---

## 3. Artifact Output Contract（成果物契約）

パイプラインは実行後に以下のアーティファクトを GitHub Actions に公開する：

| 成果物名 | 内容 | 保存期間 | 公開条件 |
|---|---|---|---|
| `coverage-api` | apps/api Vitestカバレッジレポート（HTML + テキスト） | 30日 | unit-tests / integration-tests 成功時 |
| `coverage-web` | apps/web Vitestカバレッジレポート（HTML + テキスト） | 30日 | unit-tests 成功時 |
| `playwright-report` | Playwright HTML テストレポート | 30日 | E2E実行後（成功・失敗問わず） |

アーティファクトは GitHub Actions UI の「Artifacts」セクション、または `gh run download` コマンドでダウンロード可能。

---

## 4. Timeout Contract（タイムアウト契約）

| スコープ | タイムアウト | 動作 |
|---|---|---|
| ジョブ: lint-and-typecheck | 10分 | ジョブを `timed_out` として失敗扱いにする |
| ジョブ: unit-tests | 15分 | ジョブを `timed_out` として失敗扱いにする |
| ジョブ: integration-tests | 15分 | ジョブを `timed_out` として失敗扱いにする |
| ジョブ: e2e-tests | 20分 | ジョブを `timed_out` として失敗扱いにする |

タイムアウト発生時は `e2e-tests` の場合でも `playwright-report` アーティファクトの保存を試みる（`if: always()` 設定）。

---

## 5. Branch Protection Contract（ブランチ保護契約）

`main` ブランチに設定するブランチ保護ルール（GitHub リポジトリ設定で手動構成）：

```
Branch: main
Required status checks:
  - lint-and-typecheck
  - unit-tests
  - integration-tests
  - e2e-tests
Require branches to be up to date: true
Restrict pushes: false (solo developer workflow)
```

**重要**: このコントラクトはワークフロー YAML ファイルに含められないため、パイプラインデプロイ後に手動で設定する必要がある（tasks.md に記載）。
