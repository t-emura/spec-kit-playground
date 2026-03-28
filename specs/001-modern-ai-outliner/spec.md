# Feature Specification: Modern Thinking Outliner

**Feature Branch**: `[001-modern-ai-outliner]`  
**Created**: 2026-03-28  
**Status**: Draft  
**Input**: User description: "思考の整理に役立つモダンなデザインのアウトライナーをつくりたい。将来的にはAIと連携することも考慮"

## User Scenarios & Testing *(mandatory)*

<!--
  IMPORTANT: User stories should be PRIORITIZED as user journeys ordered by importance.
  Each user story/journey must be INDEPENDENTLY TESTABLE - meaning if you implement just ONE of them,
  you should still have a viable MVP (Minimum Viable Product) that delivers value.
  
  Assign priorities (P1, P2, P3, etc.) to each story, where P1 is the most critical.
  Think of each story as a standalone slice of functionality that can be:
  - Developed independently
  - Tested independently
  - Deployed independently
  - Demonstrated to users independently
-->

### User Story 1 - Fast Thought Capture and Structuring (Priority: P1)

利用者として、思考を階層的な箇条書きとして素早く入力し、並べ替えや入れ子変更をしながら論点を整理したい。これにより、短時間で考えを見える化し、次の行動に移れる。

**Why this priority**: アウトライナーの中核価値は「速く整理できること」であり、これが成立しないと他の機能価値を提供できないため。

**Independent Test**: 新規ノートを作成し、10個以上の項目を追加・インデント変更・並べ替え・折りたたみできれば、主要価値を単独で検証できる。

**Acceptance Scenarios**:

1. **Given** 空のノートが開かれている, **When** 利用者が連続で項目を入力する, **Then** 各項目が即時に表示され、編集可能な状態で保存対象になる
2. **Given** 複数階層の項目が存在する, **When** 利用者が項目の順序と階層を変更する, **Then** 変更後の構造が崩れずに反映される
3. **Given** 長いノートが存在する, **When** 利用者が特定の親項目を折りたたむ, **Then** 子孫項目が非表示になり、再展開で元の状態に戻る

---

### User Story 2 - Focused Review with Visual Clarity (Priority: P2)

利用者として、視認性の高いモダンな画面で重要な項目をすばやく見つけ、集中して見直したい。これにより、情報量が多くても認知負荷を抑えて判断できる。

**Why this priority**: 入力だけでなく「読み返しやすさ」が継続利用の鍵であり、デザイン品質が体験満足度を左右するため。

**Independent Test**: 100項目規模のノートを開き、検索・ハイライト・フォーカス表示で目的項目に到達できることを確認すれば検証できる。

**Acceptance Scenarios**:

1. **Given** 多数の項目を含むノート, **When** 利用者がキーワード検索を実行する, **Then** 一致項目が即時に絞り込まれ、該当位置へ移動できる
2. **Given** 重要項目を識別したい状態, **When** 利用者が項目に強調指定を行う, **Then** 視覚的に区別され、ノート再表示後も維持される

---

### User Story 3 - AI-Ready Context Management (Priority: P3)

利用者として、将来AI支援を使う前提で、ノート内の項目やまとまりに意味づけをして再利用しやすくしておきたい。これにより、後からAI連携を追加しても既存ノート資産を活用できる。

**Why this priority**: 現時点でAI実装がなくても、将来拡張可能なデータ整理を先に整えることで二重作業を防げるため。

**Independent Test**: ノート項目に目的・種類・関連性などのメタ情報を付与し、再編集・検索・エクスポートで維持されることを確認すれば検証できる。

**Acceptance Scenarios**:

1. **Given** 任意の項目が選択されている, **When** 利用者が項目メタ情報を設定する, **Then** メタ情報が項目に紐づいて保持される
2. **Given** メタ情報付きノート, **When** 利用者がノートを外部共有用形式で出力する, **Then** 構造とメタ情報が欠落なく含まれる

---

### Edge Cases

<!--
  ACTION REQUIRED: The content in this section represents placeholders.
  Fill them out with the right edge cases.
-->

- 非常に深い階層（例: 10階層以上）を作成した場合でも、表示と編集が破綻しないこと
- 同名項目が多数ある場合でも、検索結果の識別が可能なこと
- 誤操作で大量移動した際に、直前操作を取り消して復旧できること
- ネットワークが不安定な状態でも、入力済み内容が失われないこと
- 出力時に一部項目へ不正な文字が含まれる場合でも、失敗理由を明示して安全に処理すること

## Requirements *(mandatory)*

<!--
  ACTION REQUIRED: The content in this section represents placeholders.
  Fill them out with the right functional requirements.
-->

### Functional Requirements

- **FR-001**: システムは、利用者がノートを作成・名称変更・複製・削除できること
- **FR-002**: システムは、利用者が階層構造の項目を追加、編集、削除、並べ替え、インデント変更できること
- **FR-003**: システムは、利用者が任意の階層を折りたたみ・展開して表示密度を調整できること
- **FR-004**: システムは、ノート内容を自動保存し、再訪時に最後の確定状態を復元できること
- **FR-005**: システムは、キーワード検索により対象項目へ到達できること
- **FR-006**: システムは、利用者が項目に強調情報（例: 重要度や状態）を付与し、視覚的に識別できること
- **FR-007**: システムは、利用者が項目または項目グループに将来のAI利用を想定したメタ情報を付与・編集・削除できること
- **FR-008**: システムは、ノートを共有可能な出力形式でエクスポートし、階層構造とメタ情報を保持できること
- **FR-009**: システムは、主要操作（編集、移動、削除）に対して取り消しとやり直しを提供すること
- **FR-010**: システムは、入力失敗や保存失敗が発生した場合に、利用者が次の行動を判断できる明確なメッセージを提示すること

### Key Entities *(include if feature involves data)*

- **Workspace Note**: 1つの思考テーマを表す単位。属性: タイトル、作成日時、更新日時、表示設定
- **Outline Item**: ノート内の各思考要素。属性: 本文、階層レベル、表示順序、折りたたみ状態、強調情報
- **Item Metadata**: 将来AI連携や再利用のための補助情報。属性: 目的ラベル、カテゴリ、関連タグ、補足メモ
- **Export Snapshot**: 共有・移行用に生成されるノートの出力結果。属性: 出力日時、含まれるノート構造、含有メタ情報

## Success Criteria *(mandatory)*

<!--
  ACTION REQUIRED: Define measurable success criteria.
  These must be technology-agnostic and measurable.
-->

### Measurable Outcomes

- **SC-001**: 初回利用者の85%以上が、開始から5分以内に3階層以上のアウトラインを完成できる
- **SC-002**: 100項目規模のノートで、主要操作（追加、移動、折りたたみ、検索）の各操作が2秒以内に完了する
- **SC-003**: ユーザーテスト参加者の80%以上が、情報の見つけやすさと見やすさを5段階中4以上で評価する
- **SC-004**: ノート出力を実行した利用者の95%以上が、構造欠落やメタ情報欠落なしで出力できる

## Assumptions

- 主対象ユーザーは、日次でメモや企画整理を行う個人利用者および少人数チームメンバーである
- v1ではリアルタイム共同編集は対象外とし、単一利用者の思考整理体験を優先する
- 利用環境はデスクトップとモバイルの最新ブラウザを想定し、一般的なネットワーク品質下で利用される
- AIによる自動提案や自動生成は初期リリース対象外だが、将来追加しやすいデータ整理要件は本機能に含める
