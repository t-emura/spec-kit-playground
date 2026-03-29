# Quickstart: Automated Test Pipeline

**Feature**: 002-test-pipeline  
**Date**: 2026-03-28

---

## 概要

このガイドでは、CIパイプラインの動作確認手順を説明する。パイプラインは `.github/workflows/ci.yml` として実装され、PR作成時・mainへのプッシュ時に自動実行される。

---

## 前提条件

- GitHubリポジトリへのプッシュ権限があること
- `gh` CLI がインストール・認証済みであること（ブランチ保護設定に使用）
- ローカルで `npm ci && npm run test:all` が成功すること

---

## Step 1: ワークフローファイルのデプロイ確認

```bash
# ワークフローファイルが正しく配置されているか確認
cat .github/workflows/ci.yml

# GitHub ActionsがYAMLを認識しているか確認（CI実行後）
gh workflow list
```

期待値: `CI` ワークフローが一覧に表示される。

---

## Step 2: PRを作成してパイプラインをトリガーする

```bash
# テスト用ブランチを作成してプッシュ
git checkout -b test/verify-ci-pipeline
git commit --allow-empty -m "test: verify CI pipeline triggers"
git push origin test/verify-ci-pipeline

# PRを作成
gh pr create --title "test: verify CI pipeline" --body "CI動作確認用のテストPR" --base main
```

---

## Step 3: パイプラインの実行状況を確認する

```bash
# 最新のワークフロー実行一覧を表示
gh run list --limit 5

# 特定の実行の詳細ログを確認
gh run view <run-id> --log
```

GitHub UI からも確認可能: `github.com/<owner>/<repo>/actions`

---

## Step 4: PR上でのステータスチェック確認

PRページを開き、以下の4つのチェックが表示されていることを確認する：

```
✅ lint-and-typecheck
✅ unit-tests
✅ integration-tests
✅ e2e-tests
```

全チェックが通過すると、マージボタンが有効になる。

---

## Step 5: アーティファクトのダウンロード確認

```bash
# 実行IDを取得
gh run list --limit 1

# アーティファクトをダウンロード
gh run download <run-id> --name coverage-web --dir ./tmp/coverage-web
gh run download <run-id> --name playwright-report --dir ./tmp/playwright-report

# カバレッジHTMLレポートをブラウザで開く
open ./tmp/coverage-web/index.html
```

---

## Step 6: ブランチ保護の動作確認

テストが失敗する変更を加えてPRを作成し、マージボタンがブロックされることを確認する：

```bash
# 意図的に失敗するコードを追加（確認後は必ず元に戻す）
echo "invalid typescript!!!" >> apps/api/src/index.ts
git add . && git commit -m "test: intentional failure"
git push origin test/verify-ci-pipeline
```

`lint-and-typecheck` が失敗し、PR上でマージボタンが無効化（またはブロックメッセージが表示）されることを確認する。確認後は変更を元に戻す：

```bash
git revert HEAD
git push origin test/verify-ci-pipeline
```

---

## Step 7: テスト用PRのクリーンアップ

```bash
# PRをクローズしてブランチを削除
gh pr close <pr-number> --delete-branch
```

---

## トラブルシューティング

### E2Eテストがタイムアウトする
- Playwrightの `webServer` 起動待ちがタイムアウトしている可能性がある
- ワークフローログで `npm run dev --workspace=apps/api` と `npm run dev --workspace=apps/web` の起動ログを確認する

### `lint-and-typecheck` が失敗する
- ローカルで `npm run lint && npm run typecheck` を実行して同じエラーが再現するか確認する
- TypeScriptのバージョン差異がある場合は `node_modules` を削除して `npm ci` を再実行する

### カバレッジアーティファクトが生成されない
- `--coverage` フラグ付きでテストが正常完了しているか確認する
- `apps/api/coverage/` または `apps/web/coverage/` ディレクトリが生成されているかログで確認する
