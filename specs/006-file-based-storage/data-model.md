# Data Model: ファイルベースのデータ保存

**Date**: 2026-03-31
**Feature**: 006-file-based-storage

## Overview

1ノート = 1 JSONファイル。ファイル名は `{UUID}-{sanitized_title}.json`。
アイテムはネスト構造（`children` 配列）で格納。メタデータはアイテムに埋め込み。

## File: ノートファイル (`{UUID}-{title}.json`)

```json
{
  "id": "uuid-v4",
  "title": "ノートのタイトル",
  "description": "任意の説明文",
  "viewMode": "tree | focus",
  "version": 1,
  "createdAt": "2026-03-31T12:00:00.000Z",
  "updatedAt": "2026-03-31T12:00:00.000Z",
  "items": [
    {
      "id": "uuid-v4",
      "orderIndex": 0,
      "content": "アイテムの内容",
      "status": "active | done | blocked",
      "highlightLevel": "none | low | medium | high",
      "isCollapsed": false,
      "createdAt": "2026-03-31T12:00:00.000Z",
      "updatedAt": "2026-03-31T12:00:00.000Z",
      "metadata": {
        "purpose": "idea | task | question | decision | reference",
        "category": "カテゴリ名",
        "tags": ["tag1", "tag2"],
        "contextNote": "補足メモ",
        "confidence": 80
      },
      "children": [
        {
          "id": "uuid-v4",
          "orderIndex": 0,
          "content": "子アイテム",
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
  ]
}
```

## Entity: NoteFile

| Field       | Type     | Required | Default     | Constraints              |
|-------------|----------|----------|-------------|--------------------------|
| id          | string   | Yes      | uuid-v4     | Unique, immutable        |
| title       | string   | Yes      | —           | 1–120 chars              |
| description | string   | No       | null        | Max 500 chars            |
| viewMode    | enum     | Yes      | "tree"      | "tree" \| "focus"        |
| version     | integer  | Yes      | 1           | Optimistic locking       |
| createdAt   | ISO 8601 | Yes      | now()       | Immutable after creation |
| updatedAt   | ISO 8601 | Yes      | now()       | Updated on every save    |
| items       | Item[]   | Yes      | []          | Nested tree structure    |

## Entity: Item (nested within NoteFile)

| Field          | Type     | Required | Default  | Constraints                    |
|----------------|----------|----------|----------|--------------------------------|
| id             | string   | Yes      | uuid-v4  | Unique within note             |
| orderIndex     | integer  | Yes      | 0        | Position among siblings        |
| content        | string   | Yes      | ""       | 0–2000 chars                   |
| status         | enum     | Yes      | "active" | "active" \| "done" \| "blocked"|
| highlightLevel | enum     | Yes      | "none"   | "none"\|"low"\|"medium"\|"high"|
| isCollapsed    | boolean  | Yes      | false    | UI state                       |
| createdAt      | ISO 8601 | Yes      | now()    | Immutable after creation       |
| updatedAt      | ISO 8601 | Yes      | now()    | Updated on content change      |
| metadata       | Metadata | No       | null     | Optional enrichment            |
| children       | Item[]   | Yes      | []       | Recursive nesting, max depth 10|

## Entity: Metadata (embedded in Item)

| Field       | Type     | Required | Default | Constraints                                    |
|-------------|----------|----------|---------|------------------------------------------------|
| purpose     | enum     | Yes      | —       | "idea"\|"task"\|"question"\|"decision"\|"reference"|
| category    | string   | No       | null    | Max 60 chars                                   |
| tags        | string[] | Yes      | []      | Array of strings                               |
| contextNote | string   | No       | null    | Max 2000 chars                                 |
| confidence  | integer  | No       | null    | 0–100                                          |

## Relationships

```
NoteFile (1) ─── contains ──→ (many) Item
Item (1) ─── contains ──→ (many) Item  [recursive children]
Item (1) ─── has ──→ (0..1) Metadata   [embedded]
```

## State Transitions

### NoteFile Lifecycle
```
[Created] → [Active] → [Deleted (file removed)]
            ↕ (updates increment version)
```

### Item Status
```
[active] ↔ [done]
[active] ↔ [blocked]
[done] ↔ [blocked]
```

## Validation Rules

1. **NoteFile.id** は UUID v4 形式。ファイル名のプレフィックスと一致すること
2. **NoteFile.version** は更新のたびにインクリメント。楽観的ロック（同時書き込み防止）
3. **Item.id** はノート内で一意。子孫を含む全アイテムで重複不可
4. **Item.orderIndex** は同一親の兄弟間で 0 から連番
5. **Item のネスト深さ** は最大 10 階層
6. **Metadata** は任意。存在しない場合は `null`（空オブジェクトではない）

## File Naming Rules

1. 形式: `{UUID}-{sanitized_title}.json`
2. サニタイズ: `<>:"/\|?*` および制御文字を除去
3. 先頭・末尾の空白とドットを除去
4. 空文字列の場合は `untitled` にフォールバック
5. タイトル部分は最大200文字に制限
6. タイトル変更時はファイル名も更新（UUID部分は不変）

## Storage Directory Structure

```
{NOTES_DIR}/
├── a1b2c3d4-買い物リスト.json
├── e5f6g7h8-プロジェクト計画.json
└── i9j0k1l2-untitled.json
```
