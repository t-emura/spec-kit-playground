# Quickstart: ファイルベースのデータ保存

**Date**: 2026-03-31

## Prerequisites

- Node.js (package.json に記載のバージョン)
- npm (workspaces 対応)

## Setup

```bash
# リポジトリのクローンとブランチ切り替え
git checkout 006-file-based-storage
npm install
```

## Development

```bash
# API + Web の開発サーバー起動
npm run dev

# Electron アプリとして起動
npm run dev:electron
```

ノートデータは以下に保存される:
- 開発モード: `./data/notes/`
- パッケージ済みバイナリ: `{userData}/data/notes/`

## Testing

```bash
# 全ユニットテスト
npm run test:unit

# API テストのみ
cd apps/api && npx vitest run

# 型チェック
npm run typecheck
```

## Key Files to Understand

| File | Purpose |
|------|---------|
| `apps/api/src/storage/file-client.ts` | Atomic write/read/delete ユーティリティ |
| `apps/api/src/storage/note-file-schema.ts` | JSON ファイルの Zod スキーマ |
| `apps/api/src/storage/sanitize.ts` | ファイル名サニタイズ |
| `apps/api/src/repositories/note-repository.ts` | ノートの CRUD（ファイルI/O） |
| `apps/api/src/repositories/item-repository.ts` | アイテムの CRUD（ネスト構造操作） |
| `apps/api/src/config/env.ts` | `NOTES_DIR` 環境変数の定義 |
| `apps/electron/main.ts` | Electron 起動時のディレクトリ初期化 |

## Architecture Overview

```
[Electron main.ts]
  ├── Sets process.env.NOTES_DIR
  ├── mkdirSync(notesDir)
  └── buildServer() → Fastify
        ├── Routes → Services → Repositories
        │                         └── file-client.ts (fs operations)
        └── Static files (web app)
```

## JSON File Example

`data/notes/a1b2c3d4-買い物リスト.json`:
```json
{
  "id": "a1b2c3d4-...",
  "title": "買い物リスト",
  "description": null,
  "viewMode": "tree",
  "version": 1,
  "createdAt": "2026-03-31T12:00:00.000Z",
  "updatedAt": "2026-03-31T12:00:00.000Z",
  "items": [
    {
      "id": "...",
      "orderIndex": 0,
      "content": "牛乳",
      "status": "active",
      "highlightLevel": "none",
      "isCollapsed": false,
      "createdAt": "...",
      "updatedAt": "...",
      "metadata": null,
      "children": []
    }
  ]
}
```
