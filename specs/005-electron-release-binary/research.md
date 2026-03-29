# Research: Electron Binary Distribution via GitHub Releases

**Branch**: `005-electron-release-binary`  
**Phase**: 0 — Pre-design research

---

## Decision 1: Cross-platform Build Strategy

**Decision**: 各プラットフォーム専用ランナーで並列ビルド（GitHub Actions matrix strategy）

**Rationale**: ネイティブモジュール（`better-sqlite3`）は対象プラットフォームのネイティブコンパイラが必要。electron-builder は `--cross` オプションで一部クロスコンパイルをサポートするが、ネイティブモジュールの ABI が異なるため信頼性が低い。既存の `release.yml` が採用している matrix strategy（ubuntu/macos/windows それぞれの runner）が最も確実。

**Alternatives considered**:
- macOS runner 1台でクロスコンパイル: ネイティブモジュールが Linux/Windows 向け `.node` を生成できないため却下
- QEMU エミュレーション: 速度が極端に遅いため却下

---

## Decision 2: better-sqlite3 の asarUnpack 設定

**Decision**: `electron-builder.yml` に `asarUnpack: ["**/better-sqlite3/**"]` を追加する（**CRITICAL**）

**Rationale**: Electron の `asar` アーカイブはネイティブ `.node` ファイルを正しく読み込めない。`better-sqlite3.node` を asar 外に展開しないとパッケージ版アプリ起動時に `Error: dlopen failed` が発生する。

**Reference**: [electron-builder docs — Native Modules](https://www.electron.build/configuration/configuration.html#asar-unpack)

---

## Decision 3: workflow_dispatch によるドライランサポート

**Decision**: `release.yml` に `workflow_dispatch` トリガーを追加し、`dry_run` input で `--publish never`/`--publish always` を切り替える

**Rationale**: タグ push なしにビルド成果物を検証できることで、リリース前の品質確認が容易になる（FR-006）。`--publish never` 時は GitHub Actions artifact として成果物を保存する。

**Implementation**:
```yaml
on:
  push:
    tags: ['v*.*.*']
  workflow_dispatch:
    inputs:
      dry_run:
        description: 'Dry run (build only, no publish)'
        type: boolean
        default: true
```

---

## Decision 4: SQLITE_DB_PATH のパッケージ版対応

**Decision**: `main.ts` でネイティブモジュールの動的 import 前に `SQLITE_DB_PATH` を設定する方法に切り替える

**Rationale**: 現在 `env.SQLITE_DB_PATH` はモジュールロード時（`await import('../api/src/index.js')`）にキャッシュされるため、`app.whenReady()` 内で設定しても反映されない。パッケージ版では CWD がアプリインストールディレクトリになり、デフォルトの `./data/outliner.db` に書き込めない可能性がある。

**Resolution**: `migrate.ts` の `runMigrations()` 関数に明示的 `dbPath` を渡すように戻す（今回のリリース機能スコープ外の修正）。または、`app.getPath('userData')` パスを環境変数 `SQLITE_DB_PATH` として Electron main エントリポイントの最上位（import より前）に設定する仕組みを導入する。

**Note**: このリリースのスコープでは `SQLITE_DB_PATH` の問題を修正し、パッケージ版でも正しいユーザーデータディレクトリに DB が作成されるようにする。

---

## Decision 5: GitHub Release の publish 設定

**Decision**: `electron-builder.yml` の `publish` セクションを拡張し、自動リリースノート生成を有効にする

**Rationale**: `electron-builder --publish always` はタグに対応する GitHub Release が存在しない場合は Draft を作成し、存在する場合はアップロードのみ行う。`releaseType: release` を指定することで Draft にならない。`generateUpdatesFilesForAllChannels: true` は自動更新対応の将来拡張のために有効化する。

**electron-builder.yml の publish セクション**:
```yaml
publish:
  provider: github
  releaseType: release
```

---

## Decision 6: ビルド成果物の命名規則

**Decision**: electron-builder デフォルトの命名規則を使用（`${productName}-${version}-*.{dmg,exe,AppImage}`）

**Rationale**: `productName` と `version` は `package.json` から自動取得。ユーザーが OS/アーキテクチャを識別しやすい標準形式。

**Expected artifacts**:
- macOS: `Modern AI Outliner-0.1.0-arm64.dmg`, `Modern AI Outliner-0.1.0.dmg`
- Windows: `Modern AI Outliner Setup 0.1.0.exe`
- Linux: `Modern AI Outliner-0.1.0.AppImage`

---

## Decision 7: Linux runner での AppImage ビルド依存ライブラリ

**Decision**: `release.yml` の Linux ジョブに必要なシステムライブラリのインストールステップを追加する

**Rationale**: Ubuntu-latest runner では AppImage ビルドに `rpm`, `snapcraft`, `libarchive-tools` 等が必要な場合がある。electron-builder が必要なものを自動インストールするが、念のため確認が必要。実際には electron-builder が `fuse` 等を要求することが多い。

**Note**: CI e2e テスト用の Xvfb は release ビルドでは不要（パッケージングのみで実行しない）。
