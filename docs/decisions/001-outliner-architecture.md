# ADR 001: Outliner Architecture Decisions

**Date**: 2026-03-28  
**Status**: Accepted

## Context

We are building a modern web-based outliner for fast thought capture, structured review, and AI-ready metadata management. We needed to select:

1. Frontend framework and state management
2. Backend framework and API style
3. Persistence layer
4. Monorepo structure

## Decisions

### Frontend: Vite + React 19 + TypeScript

**Rationale**: React 19 provides the best ecosystem for building interactive UIs with fine-grained reactivity. Vite offers fast HMR and build times. TypeScript provides type safety across the monorepo.

**Alternatives rejected**: Next.js (too heavy for local-first app), SvelteKit (smaller ecosystem).

### Backend: Fastify 5 + TypeScript

**Rationale**: Fastify has excellent performance characteristics, built-in JSON schema validation, and a plugin system that keeps the codebase organized. It is type-safe with TypeScript.

**Alternatives rejected**: Express (less performant, no native TS schema), Hono (newer, less battle-tested).

### Persistence: SQLite + Drizzle ORM

**Rationale**: The application is local-first, single-user in v1. SQLite provides zero-infrastructure persistence with WAL mode for concurrent reads. Drizzle ORM provides type-safe queries and schema migration without the overhead of a full ORM.

**Alternatives rejected**: PostgreSQL (requires infrastructure), Prisma (heavier, runtime overhead).

### Concurrency: Optimistic Locking

**Rationale**: The `version` field on `WorkspaceNote` implements optimistic locking for concurrent save operations (e.g., multiple browser tabs). On conflict, the API returns HTTP 409.

### Monorepo: npm Workspaces

**Rationale**: Native npm workspaces provide dependency hoisting and workspace scripts without additional tooling. The `packages/shared-types` workspace enables type sharing between frontend and backend.

## Consequences

- SQLite is local file-based; no multi-user support in v1
- WAL mode enables concurrent reads but writes are serialized
- Drizzle migrations are plain SQL files for auditability
- The shared-types package must be kept in sync with API contracts

## Performance Targets

| Metric | Target |
|--------|--------|
| UI operation p95 | ≤ 200ms |
| API response p95 | ≤ 500ms |
| Initial page load | ≤ 2.5s |
| Outline size | 500 items per note |
