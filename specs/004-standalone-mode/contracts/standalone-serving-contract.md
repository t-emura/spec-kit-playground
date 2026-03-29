# Contract: Standalone Mode (Electron)

**Branch**: `004-standalone-mode` | **Date**: 2026-03-29

## 概要

ElectronメインプロセスとFastify APIサーバー間、およびRenderer（React SPA）間のインターフェースを定義する。

---

## 1. Electron ↔ Fastify インターフェース

### サーバー起動

```ts
// apps/electron/main.ts が apps/api/src/server.ts を import して利用
import { buildServer } from '../api/src/server.js';

const server = buildServer();
await server.listen({ port: 0, host: '127.0.0.1' }); // 0 = 空きポート自動割り当て
const { port } = server.addresses()[0]; // 実際のポートを取得
```

### データパスの注入

```ts
// Electron main がデータパスを環境変数で注入してから buildServer() を呼ぶ
process.env.SQLITE_DB_PATH = path.join(app.getPath('userData'), 'data', 'outliner.db');
process.env.STATIC_DIR = path.join(app.getAppPath(), 'public');
```

---

## 2. Electron ↔ Renderer（preload）インターフェース

### Context Bridge API

```ts
// apps/electron/preload.ts
contextBridge.exposeInMainWorld('electron', {
  apiBase: `http://localhost:${port}`,
});
```

### Renderer 側の利用

```ts
// apps/web/src/main.tsx
const apiBase = (window as any).electron?.apiBase ?? '';
// TanStack Query の baseURL として利用
```

---

## 3. HTTP ルーティング優先順位（Fastify）

| 優先度 | パターン | 処理 |
|--------|---------|------|
| 1 | `/v1/*` | APIルートハンドラー |
| 2 | `/health` | `{"status":"ok"}` |
| 3 | `/assets/*` 等 | `STATIC_DIR` から静的ファイル配信 |
| 4 | その他（未マッチ） | `index.html` を返す（SPA fallback） |

---

## 4. electron-builder 配布コントラクト

### 生成される GitHub Release アセット

| ファイル名 | プラットフォーム | 備考 |
|-----------|----------------|------|
| `Modern-AI-Outliner-{version}-arm64.dmg` | macOS (Apple Silicon) | |
| `Modern-AI-Outliner-{version}-x64.dmg` | macOS (Intel) | |
| `Modern-AI-Outliner-Setup-{version}.exe` | Windows x64 | NSIS installer |
| `Modern-AI-Outliner-{version}.AppImage` | Linux x64 | |

### トリガー条件

`v*.*.*` 形式のタグを main ブランチにプッシュすると `.github/workflows/release.yml` が起動。

---

## 5. エラーコントラクト

| 状態 | 動作 |
|------|------|
| PORT 競合（EADDRINUSE） | ポート `0` を使うため発生しない（自動割り当て） |
| `STATIC_DIR` が存在しない | 起動時に `dialog.showErrorBox()` でユーザーに通知し終了 |
| DB 書き込み不可 | Fastify の errorHandler → BrowserWindow にエラー表示 |
