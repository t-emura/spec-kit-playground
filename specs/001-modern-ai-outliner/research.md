# Phase 0 Research: Modern Thinking Outliner

## Decision 1: Frontend stack is Vite + React + TypeScript
- Decision: Vite 7, React 19, TypeScript 5.x を採用する。
- Rationale: 起動とHMRが高速で、アウトライナーの試行錯誤を短いフィードバックループで実装できる。TypeScript strict により構造編集ロジックの安全性を確保しやすい。
- Alternatives considered:
  - Next.js: ルーティングやSSRは強力だが、v1要件では過剰でサーバー責務分離も複雑化しやすい。
  - SvelteKit: 軽量だがチーム・エコシステム前提の資産共有性でReactより不利。

## Decision 2: Backend/API is Fastify + TypeScript
- Decision: Node.js 22 LTS 上で Fastify 5 を採用する。
- Rationale: 低オーバーヘッドでJSON APIを構築しやすく、スキーマ駆動のバリデーションを導入しやすい。将来AI連携時のジョブ管理API追加にも拡張しやすい。
- Alternatives considered:
  - Express: 学習コストは低いが型とスキーマ統合が弱く、保守性で不利。
  - Hono: 軽量だが現時点で既存運用知見が少ない。

## Decision 3: Persistence is SQLite + Drizzle ORM
- Decision: SQLite 3 + better-sqlite3 + Drizzle ORM を採用する。
- Rationale: 単一ユーザー中心のv1で運用コストを最小化でき、ローカル実行とバックアップが容易。Drizzleにより型安全なクエリとマイグレーション管理が可能。
- Alternatives considered:
  - PostgreSQL: 将来拡張性は高いが、v1のセットアップ・運用コストが高い。
  - Prisma + SQLite: DXは高いがランタイム依存と生成ステップが増える。

## Decision 4: Modern CSS library is Tailwind CSS + shadcn/ui
- Decision: Tailwind CSS 4 をベースに shadcn/ui を利用する。
- Rationale: 高密度情報UIを短期間で調整でき、トークンベースの一貫したデザインを維持しやすい。必要に応じてコンポーネントをアプリ側で直接調整できる。
- Alternatives considered:
  - MUI: 完成度は高いがデザインの独自性確保に追加コストがかかる。
  - Chakra UI: 実装は容易だが情報密度の高い独自レイアウトには調整工数が必要。

## Decision 5: Data consistency and autosave strategy
- Decision: クライアントで編集イベントを短周期デバウンスし、APIで楽観ロック（updatedAt/version）を確認して保存する。
- Rationale: 入力速度を維持しつつ、同時編集や古いタブからの上書きを検知できる。
- Alternatives considered:
  - 毎キー入力で即時保存: 負荷が高く、競合時のユーザー体験が悪化しやすい。
  - 手動保存のみ: 入力消失リスクが高く要件（FR-004）に不適。

## Decision 6: AI-ready metadata contract
- Decision: 項目ごとに purpose/category/tags/contextNote を持つメタ情報を標準化し、エクスポートに必ず含める。
- Rationale: 現時点でAI処理を実装しなくても、将来のプロンプト生成や要約API連携で再利用しやすい。
- Alternatives considered:
  - 自由形式メモのみ: 将来連携時に構造化再処理が必要となり移行コストが高い。
  - 先にAI専用スキーマを過度に定義: 早期最適化となり要件変化に弱い。

## Decision 7: Testing strategy aligned with constitution
- Decision: unit/integration/e2eの3層を必須化し、P1シナリオはe2eで担保する。
- Rationale: 単一開発体制でも回帰を防ぎ、主要UXを継続的に検証できる。
- Alternatives considered:
  - unit中心: UI回帰や保存フローの結合不具合を検出しにくい。
  - e2e中心: 実行時間と原因切り分けコストが高くなる。
