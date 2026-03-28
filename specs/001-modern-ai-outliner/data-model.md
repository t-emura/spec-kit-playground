# Data Model: Modern Thinking Outliner

## Entity: WorkspaceNote
- Purpose: 思考テーマ単位の親ドキュメント。
- Fields:
  - id: string (UUID, required)
  - title: string (1..120 chars, required)
  - description: string (0..500 chars, optional)
  - viewMode: enum(tree, focus) default tree
  - createdAt: datetime (required)
  - updatedAt: datetime (required)
  - version: integer (required, optimistic locking)
  - archived: boolean default false
- Relationships:
  - 1:N with OutlineItem
  - 1:N with ExportSnapshot
- Validation Rules:
  - title はトリム後空文字不可
  - archived=true のノートは編集APIで更新不可

## Entity: OutlineItem
- Purpose: ノート内の階層化された思考要素。
- Fields:
  - id: string (UUID, required)
  - noteId: string (FK WorkspaceNote.id, required)
  - parentId: string | null (self FK)
  - orderIndex: integer (required)
  - depth: integer (0..10, required)
  - content: string (1..2000 chars, required)
  - isCollapsed: boolean default false
  - highlightLevel: enum(none, low, medium, high) default none
  - status: enum(active, done, blocked) default active
  - createdAt: datetime (required)
  - updatedAt: datetime (required)
- Relationships:
  - N:1 with WorkspaceNote
  - 1:1 optional with ItemMetadata
- Validation Rules:
  - parentId が設定される場合、同一 noteId 内の項目のみ参照可
  - depth は親の depth + 1 と一致
  - sibling 内で orderIndex 一意
- State Transitions:
  - active -> done 許可
  - active -> blocked 許可
  - blocked -> active 許可
  - done -> active 許可（再オープン）

## Entity: ItemMetadata
- Purpose: 将来AI連携向けの構造化コンテキスト保持。
- Fields:
  - itemId: string (PK/FK OutlineItem.id)
  - purpose: enum(idea, task, question, decision, reference)
  - category: string (0..60 chars)
  - tags: string[] (max 20, each 1..24 chars)
  - contextNote: string (0..2000 chars)
  - confidence: integer (0..100, optional)
  - updatedAt: datetime (required)
- Relationships:
  - 1:1 with OutlineItem
- Validation Rules:
  - tags は重複不可
  - category/tags は制御文字を含まない

## Entity: ExportSnapshot
- Purpose: 共有・バックアップ・AI連携前処理に使う出力履歴。
- Fields:
  - id: string (UUID)
  - noteId: string (FK WorkspaceNote.id)
  - format: enum(json, markdown)
  - includeMetadata: boolean default true
  - exportedBy: string (local user identifier, optional)
  - checksum: string (sha256)
  - payloadSizeBytes: integer
  - createdAt: datetime
- Relationships:
  - N:1 with WorkspaceNote
- Validation Rules:
  - format=json の場合は構造とメタ情報の完全性検証を通過すること
  - payloadSizeBytes は 0 より大きいこと

## Derived Views
- NoteTreeView:
  - WorkspaceNote + OutlineItem を orderIndex と parentId で木構造再構成
- SearchResultView:
  - content + metadata(tags/category/contextNote) 横断検索結果

## Integrity and Concurrency Rules
- 保存APIは WorkspaceNote.version を必須入力とし、差異がある場合 409 Conflict を返す。
- 項目移動時は対象サブツリー全体の depth/orderIndex を同一トランザクションで更新。
- 削除はソフト削除ではなくハード削除（v1）だが、ExportSnapshot は監査用途で保持。
