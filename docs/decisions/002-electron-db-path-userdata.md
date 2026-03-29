# ADR 002: Electron Packaged App — SQLite DB Path in userData

**Date**: 2026-03-29  
**Status**: Accepted  
**Feature**: `005-electron-release-binary`

## Context

The Electron app embeds a Fastify API server that uses `better-sqlite3` to store notes in a SQLite database. The database path is configured via the `SQLITE_DB_PATH` environment variable, which is parsed and cached by `apps/api/src/env.ts` at module load time using `parseEnv()`.

In development mode, `SQLITE_DB_PATH` defaults to `./data/outliner.db` (relative to CWD), which is fine because the CWD is the repository root and the developer has write access.

In a packaged Electron app, the CWD is typically the app's installation directory (e.g., `/Applications/Modern AI Outliner.app/Contents/Resources/` on macOS), where the user may not have write access. This would cause the app to silently fail to create the database.

## Problem

`apps/electron/main.ts` uses a top-level `await import('../api/src/index.js')` to load the API server. When this import runs, `env.ts` executes `parseEnv()` and caches `SQLITE_DB_PATH`. Any attempt to set `process.env.SQLITE_DB_PATH` after this import has no effect on the cached value.

The original code set `process.env.SQLITE_DB_PATH` inside `app.whenReady()`, which runs after the top-level import — too late to affect the cached env value.

## Decision

Set `process.env.SQLITE_DB_PATH` at the top level of `main.ts`, **before** the `await import('../api/src/index.js')` call, using `app.getPath('userData')`.

`app.getPath('userData')` is available before `app.whenReady()`, so this assignment runs synchronously before the dynamic import executes and before `env.ts` caches the value.

```typescript
// main.ts — top-level, before import
if (app.isPackaged) {
  const packedDataDir = path.join(app.getPath('userData'), 'data');
  mkdirSync(packedDataDir, { recursive: true });
  process.env.SQLITE_DB_PATH = path.join(packedDataDir, 'outliner.db');
}
const { buildServer, runMigrations } = await import('../api/src/index.js');
```

In dev mode (`app.isPackaged === false`), `SQLITE_DB_PATH` is left unset so it defaults to `./data/outliner.db` (repository root), preserving existing dev behavior.

## Consequences

### Positive

- Packaged app stores the database in the platform-specific user data directory:
  - macOS: `~/Library/Application Support/Modern AI Outliner/data/outliner.db`
  - Windows: `%APPDATA%\Modern AI Outliner\data\outliner.db`
  - Linux: `~/.config/Modern AI Outliner/data/outliner.db`
- The user always has write access to this location.
- Both `runMigrations()` and `buildServer()` use the same cached path (no DB path mismatch).

### Negative / Tradeoffs

- **Behavioral change**: Upgrading from a dev build to a packaged build changes the DB location. Users who have data from a dev build will not see it in the packaged app. This is acceptable because dev builds are not distributed to end users.
- **`app.isPackaged` code path not covered by automated CI tests**: Testing the fully packaged app in CI requires `electron-builder --dir` + launch, which is complex infrastructure. The dev-mode path is covered by the existing e2e test (`tests/e2e/electron-app.spec.ts`). The packaged-mode path is validated manually as part of the release checklist (see `tasks.md` Phase 3 Independent Test).

## Alternatives Considered

1. **Pass explicit `dbPath` to `runMigrations()` and `buildServer()`**: Rejected because `buildServer()` calls `buildDb()` which reads `env.SQLITE_DB_PATH` internally. Changing this would require modifying the API server code, which is a larger and riskier change with more test surface to update.

2. **Reload env module after setting the path**: Not possible in ESM — module cache cannot be cleared at runtime in standard Node.js ESM.

3. **Use a config file instead of env variable**: Out of scope for this feature; would require a larger refactor of the API env system.
