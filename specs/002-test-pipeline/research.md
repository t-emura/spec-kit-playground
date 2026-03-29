# Research: Automated Test Pipeline

**Feature**: 002-test-pipeline  
**Date**: 2026-03-28

---

## 1. GitHub Actions Workflow Structure for Node.js Monorepo

### Decision
単一の `ci.yml` ワークフローに、lint/typecheck・unit・integration・E2E の各ジョブを並列定義する。ジョブ間の依存関係は `needs:` で制御し、E2Eは unit/integration の成功後に実行する。

### Rationale
- 単一ワークフローファイルで全チェックを管理することで、ステータスチェック名が一貫し、ブランチ保護ルール設定が簡単になる
- ジョブ並列化により、unit と integration を同時実行して全体実行時間を短縮できる
- `needs:` によるE2E依存により、基本的なテストが失敗していれば高コストなE2Eをスキップできる

### Alternatives Considered
- **複数ワークフローファイル分割**: 管理が煩雑になるため却下
- **全ジョブ直列実行**: 実行時間が増大するため却下

---

## 2. Playwright in CI Environment

### Decision
`npx playwright install --with-deps chromium` をE2EジョブのSetupステップで実行し、Chromiumのみをインストールする。`CI=true` 環境変数を設定し、`retries: 2`, `workers: 1` の設定（既存の `playwright.config.ts` に定義済み）が自動適用される。

### Rationale
- `--with-deps` により依存OS パッケージ（libglib, libnss等）も自動インストールされる
- `chromium` のみ指定することでインストール時間を最小化（全ブラウザ対応はスコープ外）
- `CI` 環境変数は GitHub Actions が自動設定するため明示的な設定不要
- `forbidOnly: !!process.env.CI` の設定も既存 config で対応済み

### Alternatives Considered
- **`ubuntu-latest` に事前インストール済みのChromiumを使う**: バージョン管理が複雑になるため却下
- **Docker containerを使う**: 設定の複雑さに対してメリットが少ないため却下
- **`playwright/github-actions` アクション**: 公式アクションより `npx playwright install` の方が制御しやすいため却下

---

## 3. Vitest Coverage Reporting in CI

### Decision
`apps/web` の `vitest.config.ts` には v8 coverage が設定済みのため、`--coverage` フラグを付加するだけでHTML・テキストレポートが生成される。`apps/api` は既存設定にcoverageが未定義のため、`--coverage` フラグ追加とv8プロバイダーの設定を追加する。生成されたカバレッジレポートはGitHub Actions Artifactsとして30日間保存する。

### Rationale
- v8 は Node.js ネイティブのカバレッジエンジンで依存追加なし
- アーティファクト保存により、CIを通じてカバレッジトレンドが参照可能
- HTML形式はブラウザで直接確認でき、テキスト形式はログ出力に適している

### Alternatives Considered
- **c8**: v8と実質同等だが、Vitest公式はv8を推奨するため却下
- **Istanbul**: 設定が増えるため却下
- **Codecovなど外部サービス連携**: スコープ外（将来の拡張として検討可）

---

## 4. Branch Protection Rules

### Decision
GitHub リポジトリの `main` ブランチにブランチ保護ルールを設定する。必須ステータスチェックとして以下を指定する：
- `lint-and-typecheck`
- `unit-tests`
- `integration-tests`
- `e2e-tests`

### Rationale
- GitHub Actions のジョブ名がそのままステータスチェック名になるため、ワークフローのジョブ `id` と一致させる
- 「Require status checks to pass before merging」を有効化することで FR-005 を実現
- `Require branches to be up to date before merging` も有効化し、古いブランチでのマージを防ぐ

### Implementation Note
ブランチ保護ルールはGitHub UI（Settings → Branches → Add branch protection rule）または `gh` CLIで設定する。ワークフロー YAML ファイルに含めることはできないため、タスクとして別途実施が必要。

### Alternatives Considered
- **CODEOWNERS + required reviews**: テスト保護とは別の概念、今回はテスト保護が主目的
- **`branch_protection_rules` Terraform管理**: IaC はスコープ外

---

## 5. Artifact Retention Strategy

### Decision
GitHub Actions の `actions/upload-artifact` を使用し、以下のアーティファクトを保存する：

| アーティファクト | 生成元 | 保存期間 |
|---|---|---|
| `coverage-api` | apps/api Vitest coverage | 30日 |
| `coverage-web` | apps/web Vitest coverage | 30日 |
| `playwright-report` | Playwright HTML report | 30日 |

### Rationale
- GitHub Actions のデフォルト保存期間は90日だが、30日に設定してストレージを節約
- FR-007（カバレッジ30日保持）・FR-008（履歴90日保持）の要件を満たす
- Playwright HTML report は `playwright-report/` ディレクトリに出力される（既存config）

### Alternatives Considered
- **GitHub Pagesへのデプロイ**: 常に最新のレポートのみ保持されるため、履歴参照には不向き
- **S3等外部ストレージ**: スコープ外かつコスト増

---

## 6. Job Timeout Configuration

### Decision
ワークフロー全体のタイムアウトは30分（FR-006）。各ジョブレベルでも個別タイムアウトを設定：

| ジョブ | タイムアウト |
|---|---|
| lint-and-typecheck | 10分 |
| unit-tests | 15分 |
| integration-tests | 15分 |
| e2e-tests | 20分 |

### Rationale
- ジョブレベルのタイムアウトを設定することで、1ジョブのハングが全体のタイムアウトを使い切ることを防ぐ
- E2EはサーバーのPRも含むため他ジョブより長めに設定

---

## 7. Node.js Version Pinning

### Decision
`actions/setup-node@v4` を使用し、`node-version: '20'` を指定する（`.nvmrc` がない場合）。`cache: 'npm'` を有効化してインストール時間を短縮する。

### Rationale
- Node.js 20 LTS はGitHub Actionsでサポートされており、package-lock.json が生成されたバージョンと互換性がある
- `npm ci` を使用することで package-lock.json の厳密なバージョンを保証

### Alternatives Considered
- **`node-version-file: '.nvmrc'`**: `.nvmrc` が存在しないため却下（追加もスコープ外）
- **matrix strategy（複数Nodeバージョン）**: 単一開発者プロジェクトでは不要
