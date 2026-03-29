# Feature Specification: Electron Binary Distribution via GitHub Releases

**Feature Branch**: `005-electron-release-binary`  
**Created**: 2026-03-29  
**Status**: Draft  
**Input**: User description: "GitHub ReleaseでElectronのバイナリファイルをダウンロードできるようにしたい"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - エンドユーザーがバイナリをダウンロードしてインストールする (Priority: P1)

利用者が GitHub Releases ページにアクセスし、自分の OS に対応したインストーラーまたはパッケージをダウンロードして、アプリケーションをインストールする。

**Why this priority**: リリースの目的そのものであり、ユーザーが開発環境を用意せずにアプリを使えるようにするコアな価値。

**Independent Test**: GitHub Releases ページから macOS/Windows/Linux 用バイナリをダウンロードし、起動確認することで独立してテスト可能。

**Acceptance Scenarios**:

1. **Given** 最新の GitHub Release が公開されている, **When** ユーザーが Releases ページにアクセスする, **Then** macOS・Windows・Linux それぞれ対応したダウンロードファイルが一覧表示される
2. **Given** macOS ユーザーが `.dmg` ファイルをダウンロードした, **When** ファイルを開いてアプリをインストールする, **Then** アプリが起動し正常に動作する
3. **Given** Windows ユーザーが `.exe` インストーラーをダウンロードした, **When** インストーラーを実行する, **Then** アプリがインストールされ起動する
4. **Given** Linux ユーザーが `.AppImage` をダウンロードした, **When** 実行権限を付与して起動する, **Then** アプリが動作する

---

### User Story 2 - 開発者がバージョンタグを push してリリースを作成する (Priority: P1)

開発者が Git タグ（例：`v1.0.0`）を push するだけで、CI がバイナリをビルドし GitHub Release が自動作成される。

**Why this priority**: リリースプロセスを手動作業なしで自動化することで、リリースミスを防ぎ継続的なデリバリーを実現する。

**Independent Test**: バージョンタグを push し、GitHub Actions が完了後に Releases ページへバイナリが添付されていることを確認。

**Acceptance Scenarios**:

1. **Given** 開発者がリリース準備完了のコードをメインブランチにマージした, **When** `vX.Y.Z` 形式のタグを push する, **Then** GitHub Actions ワークフローが自動起動する
2. **Given** ビルドワークフローが実行中である, **When** 全プラットフォームのビルドが完了する, **Then** GitHub Release が自動作成され全バイナリが添付される
3. **Given** ビルドが失敗した, **When** ワークフローが終了する, **Then** GitHub Release は作成されず、失敗した理由がワークフローログで確認できる

---

### User Story 3 - 開発者がビルド成果物を事前確認する (Priority: P2)

タグ push 前に、リリース候補のバイナリが正しくビルドできるかをドライランで確認できる。

**Why this priority**: 本番リリース前に問題を発見できることで、壊れたリリースの公開を防ぐ。

**Independent Test**: ドライランワークフロー（タグなし）を手動起動し、ビルド成果物が artifact として確認できることで独立テスト可能。

**Acceptance Scenarios**:

1. **Given** 開発者が GitHub Actions のワークフロー画面を開く, **When** ビルドワークフローを手動でトリガーする（リリース公開なし）, **Then** 全プラットフォームのビルドが実行され artifact としてダウンロードできる
2. **Given** ドライランビルドが成功した, **When** artifact をダウンロードして起動する, **Then** アプリが期待通りに動作する

---

### Edge Cases

- 同一バージョンタグを再 push（既存 Release の上書き）した場合の挙動は？
- ビルドが一部プラットフォームのみ失敗した場合、成功分だけ Release に添付するか全失敗とするか？
- バイナリサイズが GitHub Release の添付ファイルサイズ上限（2GB）を超えた場合の対処は？
- バージョン番号が `package.json` の `version` フィールドとタグ名の不一致があった場合の検知

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: バージョンタグ（`v*.*.*` 形式）の push をトリガーに、GitHub Actions ワークフローが自動起動しなければならない
- **FR-002**: ワークフローは macOS・Windows・Linux の 3 プラットフォーム向けバイナリを並列ビルドしなければならない
- **FR-003**: ビルド成果物として macOS は `.dmg`、Windows は `.exe` インストーラー、Linux は `.AppImage` を生成しなければならない
- **FR-004**: 全プラットフォームのビルド成功後、GitHub Release を自動作成しバイナリを添付しなければならない
- **FR-005**: GitHub Release のタイトルとタグ名はバージョン番号（例：`v1.0.0`）を含まなければならない
- **FR-006**: ワークフローは手動トリガー（workflow_dispatch）にも対応し、ビルド確認を Release 公開なしで実行できなければならない
- **FR-007**: バイナリには `package.json` の `version` フィールドと一致するバージョン情報が埋め込まれなければならない
- **FR-008**: ビルドが失敗した場合、GitHub Release は作成されてはならない

### Key Entities

- **Release**: タグ名・バージョン番号・リリースノート・添付バイナリで構成されるリリース単位
- **Build Artifact**: 各プラットフォーム向けの実行可能バイナリまたはインストーラーパッケージ
- **Version Tag**: `vX.Y.Z` 形式のセマンティックバージョニングに従う Git タグ

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: バージョンタグを push してから全バイナリが GitHub Release に公開されるまで 15 分以内に完了する
- **SC-002**: ダウンロードした各プラットフォームのバイナリを追加インストール作業なしで起動できる（開封後すぐ使える）
- **SC-003**: リリースワークフローの成功率が 90% 以上（再実行除く初回成功率）
- **SC-004**: ユーザーが Releases ページでプラットフォームに対応するファイルを 1 分以内に見つけ、ダウンロードを開始できる

## Assumptions

- リリース対象プラットフォームは macOS（Intel + Apple Silicon）・Windows（x64）・Linux（x64）の 3 OS
- コード署名（macOS Notarization・Windows EV証明書）は本フィーチャーのスコープ外とする（将来の拡張として扱う）
- バージョン管理は Semantic Versioning（`vMAJOR.MINOR.PATCH`）に従う
- ビルドツールとして `electron-builder`（既に `package.json` に存在）を使用することを前提とする
- GitHub Actions の無料枠または既存の CI 予算の範囲内で動作することを想定
- リリースノートは自動生成（GitHub の自動生成機能）または空欄を許容し、詳細なリリースノート作成は本フィーチャー外とする
- `electron-builder.yml` が既にリポジトリに存在するため、ビルド設定の基盤は整っている
