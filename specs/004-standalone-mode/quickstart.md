# Quickstart: Standalone Mode (Electron)

**Branch**: `004-standalone-mode` | **Date**: 2026-03-29

---

## シナリオ 1: Electron開発モードで起動する

```bash
# 依存インストール（初回 or 変更後）
npm install

# Electron ABI 向けに better-sqlite3 をリビルド
npm run rebuild:native

# 開発モード起動（API + Electron ウィンドウ）
npm run dev:electron
```

**期待動作**: Electron ウィンドウが開き、React SPA が表示される。APIは `127.0.0.1:{自動ポート}` で動作。

---

## シナリオ 2: 本番ビルドをローカルで確認する

```bash
# Web + API + Electron の全ビルド
npm run build

# ビルド済み Electron アプリを起動
npm start
```

---

## シナリオ 3: GitHub Release 用インストーラをビルドする

```bash
# macOS 向け（実行環境に依存）
npm run dist:mac

# Windows 向け（Windows環境またはCross-compilation）
npm run dist:win

# Linux 向け
npm run dist:linux
```

**出力**: `dist-electron/` 以下にインストーラが生成される。

---

## シナリオ 4: GitHub Release を作成する（CI自動化）

```bash
# バージョンタグをプッシュ → GitHub Actions が自動でリリースを作成
git tag v1.0.0
git push origin v1.0.0
```

**動作**: `.github/workflows/release.yml` が起動 → macOS/Windows/Linux 向けビルド → GitHub Release にアセットをアップロード。

---

## 変更ファイル一覧

| ファイル | 変更内容 |
|---------|---------|
| `apps/electron/main.ts` | 新規。Electronメインプロセス（ウィンドウ作成、Fastify起動） |
| `apps/electron/preload.ts` | 新規。Context Bridge（APIポート番号をRendererに渡す） |
| `apps/electron/package.json` | 新規。workspaceメンバー設定 |
| `apps/api/src/config/env.ts` | `STATIC_DIR` 環境変数追加 |
| `apps/api/src/server.ts` | `@fastify/static` 登録、SPA fallback追加 |
| `apps/api/src/index.ts` | Electron経由の場合は `listen()` しない分岐追加 |
| `apps/api/package.json` | `@fastify/static ^8` 追加 |
| `apps/web/src/main.tsx` | `window.electron.apiBase` からAPI URLを取得（~5行） |
| `apps/web/vite.config.ts` | proxy設定をElectron検出時に無効化（~10行） |
| `package.json`（root） | workspaces更新、scripts更新（dev:electron/build/dist） |
| `electron-builder.yml` | 新規。プラットフォーム設定、GitHub Release設定 |
| `.github/workflows/release.yml` | 新規。タグpushでマルチプラットフォームビルド |

---

## 注意事項

- `better-sqlite3` は Electron の Node.js ABI（Electron内蔵）向けにリビルドが必要。`npm run rebuild:native` で実行
- macOS 署名なしビルドは初回起動時に Gatekeeper 警告が出る（開発・テスト用途では許容）
- 開発中の `npm run dev`（2プロセス起動）は変更なし
