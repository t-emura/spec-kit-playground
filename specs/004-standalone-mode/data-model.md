# Data Model: Standalone Mode (Electron)

**Branch**: `004-standalone-mode` | **Date**: 2026-03-29

## 概要

このfeatureはデータエンティティの変更を含まない。Note / Item / Metadata / ItemVisualState はすべてそのまま維持される。

変更対象は**設定・起動方式・データ保存パス**のみ。

---

## 環境変数スキーマ（変更箇所）

`apps/api/src/config/env.ts` の `envSchema` に以下を追加：

| 変数名 | 型 | デフォルト値 | 説明 |
|--------|-----|-------------|------|
| `STATIC_DIR` | `string` | `./public` | 静的ファイルを配信するディレクトリ（CWD相対または絶対パス） |
| `PORT` | `number` | `8787` | 既存。変更なし（0を指定すると空きポートを自動選択） |
| `SQLITE_DB_PATH` | `string` | `./data/outliner.db` | 既存。Electronモードでは `app.getPath('userData')` 配下に上書き |

---

## データ保存パス（Electronモード）

| モード | SQLiteパス |
|--------|-----------|
| 開発（npm run dev） | `apps/api/data/outliner.db`（現行と同じ） |
| Electron（開発） | `app.getPath('userData')/data/outliner.db` |
| Electron（配布版） | `app.getPath('userData')/data/outliner.db` |

`app.getPath('userData')` のOS別パス：
- macOS: `~/Library/Application Support/Modern AI Outliner/`
- Windows: `%APPDATA%\Modern AI Outliner\`
- Linux: `~/.config/Modern AI Outliner/`

---

## 起動モード一覧

| モード | コマンド | プロセス構成 |
|--------|---------|------------|
| **開発（Web）** | `npm run dev` | APIプロセス + Viteプロセス（変更なし） |
| **Electron開発** | `npm run dev:electron` | APIプロセス + Electronプロセス |
| **Electron本番** | `npm start` または アイコンから起動 | Electron単一プロセス（Fastify内包） |

---

## Electron プロセス間データフロー

```
Electron main process
  ├── Fastify server（PORT 自動割り当て）
  │   ├── /v1/*  → APIルート
  │   ├── /health → ヘルスチェック
  │   └── /* → apps/web/dist/public/ の静的ファイル / SPA fallback
  └── BrowserWindow
       └── loadURL("http://localhost:{port}")
            ↑
       preload.ts で window.__API_BASE__ = "http://localhost:{port}" を注入
```
