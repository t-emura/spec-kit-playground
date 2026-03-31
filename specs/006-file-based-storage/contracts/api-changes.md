# API Contract Changes: ファイルベースのデータ保存

**Date**: 2026-03-31

## Overview

REST API のエンドポイントURLとHTTPメソッドは変更なし。レスポンス形式も変更なし — アイテムは引き続きフラット配列（`parentId` + `depth`）で返される。内部ストレージのみJSONファイルのネスト構造に変更。

## Storage Format Change (Internal Only)

アイテムはJSONファイル内ではネスト構造（`children` 配列）で保存されるが、API レスポンスでは従来通りフラット配列に変換して返される。フロントエンド側の変更は不要。

### API Response (unchanged):
```json
{
  "items": [
    { "id": "1", "noteId": "n1", "parentId": null, "orderIndex": 0, "depth": 0, "content": "Parent" },
    { "id": "2", "noteId": "n1", "parentId": "1", "orderIndex": 0, "depth": 1, "content": "Child" }
  ]
}
```

## Unchanged Endpoints

以下のエンドポイントはリクエスト/レスポンス形式に変更なし:

| Endpoint | Method | Notes |
|----------|--------|-------|
| /v1/notes | GET | ノート一覧（アイテムを含まない） |
| /v1/notes | POST | ノート作成 |
| /v1/notes/:noteId | GET | ノート詳細 |
| /v1/notes/:noteId | PATCH | ノート更新 |
| /v1/notes/:noteId | DELETE | ノート削除 |
| /v1/notes/:noteId/items | POST | アイテム作成 |
| /v1/items/:itemId | PATCH | アイテム更新 |
| /v1/items/:itemId | DELETE | アイテム削除 |
| /v1/items/:itemId/move | POST | アイテム移動 |
| /v1/items/:itemId/indent | POST | インデント |
| /v1/items/:itemId/outdent | POST | アウトデント |
| /v1/items/:itemId/metadata | GET | メタデータ取得 |
| /v1/items/:itemId/metadata | PUT | メタデータ更新 |

## Removed Endpoints

| Endpoint | Method | Reason |
|----------|--------|--------|
| /v1/notes/:noteId/export | POST | スコープ外（FR-010）|

## Environment Variable Changes

| Before | After | Purpose |
|--------|-------|---------|
| `SQLITE_DB_PATH` | `NOTES_DIR` | 保存先パス（ファイル→ディレクトリ） |
