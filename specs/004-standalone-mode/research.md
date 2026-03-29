# Research: Standalone Mode

**Branch**: `004-standalone-mode` | **Date**: 2026-03-29  
**追記**: GitHub Release配布（バイナリ化）を見据えた設計に更新

---

## Decision 1: 静的ファイル配信の方式

**Decision**: `@fastify/static ^8` を使用し `dist/public/` を配信する

**Rationale**:
- Fastify公式プラグイン。v5対応済み（`fastify-plugin ^5`）
- SPAフォールバックは `setNotFoundHandler` で `index.html` を返す
- パストラバーサル防止が組み込み済み

**Implementation**:
```ts
import fastifyStatic from '@fastify/static';
import { resolve, dirname } from 'path';

// STATIC_DIR は env.ts で管理（後述）
server.register(fastifyStatic, {
  root: resolve(env.STATIC_DIR),
  prefix: '/',
  wildcard: false,
});
// SPA fallback: /v1/* 以外の未マッチルートに対して
server.setNotFoundHandler((_req, reply) => {
  reply.sendFile('index.html');
});
```
APIルート `/v1/*` とヘルスチェック `/health` は先に登録するため優先される。

**Alternatives considered**:
- 手動 `fs` ルーティング: セキュリティリスク大、再発明のコスト高

---

## Decision 2: ビルド成果物の集約構造（★ GitHub Release配布対応）

**Decision**: APIのビルド成果物と Web 静的ファイルを `dist/` に集約する

```text
dist/
├── index.js      ← API (tsc ビルド)
└── public/       ← Web 静的ファイル (apps/web/dist/ をコピー)
    ├── index.html
    └── assets/
```

**Rationale**:
- `dist/` 以下だけを zip に固めれば配布できる（将来の GitHub Release 対応）
- `@yao-pkg/pkg` でバイナリ化する際も `dist/` を基点にすれば `public/` をアセットとして同梱できる
- `apps/web/dist/` と `apps/api/dist/` に分散していると、配布パッケージ作成スクリプトが複雑になる

**Build script**:
```jsonc
// package.json (root)
{
  "scripts": {
    "build": "npm run build --workspace=apps/web && npm run build --workspace=apps/api && node scripts/prepare-dist.js",
    "start": "node dist/index.js"
  }
}
```

`scripts/prepare-dist.js`: `apps/web/dist/` → `dist/public/` へコピー

**Alternatives considered**:
- `apps/web/dist/` を直接参照: 相対パスが開発環境依存になり、バイナリ配布時に機能しない
- Vite の `outDir` を `../api/dist/public` に変更: workspace間の依存が密結合になる

---

## Decision 3: STATIC_DIR のパス解決（★ バイナリ配布対応の核心）

**Decision**: デフォルトを `./public`（CWD相対）とし、`path.resolve(process.cwd(), env.STATIC_DIR)` で解決する

**Rationale**:
- `npm start` 実行時: `dist/` からプロセスを起動すれば `./public` が `dist/public/` を指す
- `@yao-pkg/pkg` バイナリ実行時: バイナリと同ディレクトリの `public/` を参照できる（pkg の `/snapshot/` を使わず実ファイルとして同梱）
- 環境変数 `STATIC_DIR` で絶対パス指定にオーバーライド可能（テスト・CI対応）

**start スクリプトの実行場所**:
```jsonc
// package.json (root) — dist/ 内から node を呼び出す
"start": "cd dist && node index.js"
// または環境変数で明示
"start": "STATIC_DIR=./dist/public node dist/index.js"
```

**Alternatives considered**:
- `../../apps/web/dist`（元の設計）: monorepo ディレクトリ構造依存、バイナリ配布時に機能しない
- `__dirname` 相対: ESM では `__dirname` が使えないため `import.meta.url` + `fileURLToPath` が必要（pkg での動作が不安定）

---

## Decision 4: ポート競合時のエラー処理

**Decision**: `EADDRINUSE` を `catch` でキャッチし、利用者向けメッセージを出力して終了

```ts
main().catch((err) => {
  if ((err as NodeJS.ErrnoException).code === 'EADDRINUSE') {
    console.error(`❌ Port ${env.PORT} is already in use.`);
    console.error(`   Try: PORT=<other-port> npm start`);
  } else {
    console.error(err);
  }
  process.exit(1);
});
```

---

## Decision 5: STATIC_DIR が存在しない場合のガード

**Decision**: サーバー起動前に `STATIC_DIR` の存在チェックを行い、存在しない場合は明確なエラーで終了する

```ts
import { existsSync } from 'fs';
const staticDir = resolve(env.STATIC_DIR);
if (env.NODE_ENV === 'production' && !existsSync(staticDir)) {
  console.error(`❌ Static directory not found: ${staticDir}`);
  console.error(`   Run: npm run build`);
  process.exit(1);
}
```

開発モード（`NODE_ENV=development`）ではチェックをスキップ（Vite が担当）。

---

## Decision 6: GitHub Release 配布パッケージング戦略（Electron）

**Decision**: `electron` + `electron-builder` を使用し、プラットフォーム別ネイティブアプリとして配布する

**Rationale**:
- Electron は VS Code・Slack・Discord で採用されている最もメジャーなデスクトップ配布方式
- `electron-builder` が GitHub Release への自動アップロード（`publish: github`）を提供し、macOS/Windows/Linux 向けインストーラを一括生成できる
- ブラウザ起動不要、アイコンからダブルクリックで利用開始できる（FR: "ダウンロード後即利用"）
- `better-sqlite3` のリビルドは `@electron/rebuild` が担当し、CI で自動化可能

**アーキテクチャ（Option A: Fastify in Electron main process）**:
```
Electron main process
  ├── Fastify API server (apps/api の buildServer() を import)
  │    └── /v1/* ルート、/health、静的ファイル配信
  └── BrowserWindow → http://localhost:{自動割り当てポート}
```

- `apps/api` と `apps/web` のソースは変更最小限（~50行の既存ファイル変更）
- 新規: `apps/electron/main.ts`（~140行）、`apps/electron/preload.ts`（~50行）

**better-sqlite3 のリビルド**:
- Electron は独自の Node.js ABI を使用するため、`better-sqlite3`（ネイティブアドオン）を Electron ABI 向けに再ビルドする必要がある
- `@electron/rebuild` を `postinstall` スクリプトに追加して自動化
- CI（electron-builder）はこの処理を内包している

**配布形式（electron-builder が生成）**:

| プラットフォーム | 形式 | 備考 |
|----------------|------|------|
| macOS (arm64/x64) | `.dmg` | 署名なしは初回起動時に Gatekeeper 警告あり |
| Windows (x64) | `.exe` (NSIS installer) | |
| Linux (x64) | `.AppImage` | |

**GitHub Actions 連携**:
```yaml
# .github/workflows/release.yml (新規)
# main ブランチへの tag push（v*.*.* ）で自動トリガー
# electron-builder --publish always → GitHub Release に自動アップロード
```

**Alternatives considered**:
- `@yao-pkg/pkg`: メンテナンス状況が不安定、ネイティブアドオンのクロスコンパイルが複雑
- `@vercel/ncc` + Node.js SEA: 追加依存なしだが Electron より UX が劣る（ブラウザ必要）
- Tauri: Electron より軽量だが Rust が必要、better-sqlite3 の置き換えが必要

---

## Post-Design Constitution Re-check（更新版）

- [x] 新依存 `@fastify/static ^8` — 公式プラグイン、MIT、v5対応、justification済み
- [x] 新依存 `electron` + `electron-builder` — メジャー採用実績あり、MIT、GitHub Release連携
- [x] 新依存 `@electron/rebuild` — Electronネイティブアドオン再ビルド標準ツール
- [x] セキュリティ: `contextIsolation: true`、`nodeIntegration: false` でプリロード経由のみ
- [x] テスト: `server-bootstrap.test.ts` に静的配信・SPA fallbackテストを追加
- [x] パフォーマンス: 静的配信はシングルユーザー用途、キャッシュなしで許容範囲
- [x] GitHub Release対応: electron-builder による自動リリースワークフロー

**Gate result: PASS**
