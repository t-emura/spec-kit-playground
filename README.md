# spec-kit-playground

## Modern Thinking Outliner

A fast, keyboard-driven outliner with AI-ready metadata and structured export.

### Architecture

- **Frontend**: Vite + React 19 + TypeScript (`apps/web`)
- **Backend**: Fastify 5 + TypeScript (`apps/api`)
- **Database**: SQLite + Drizzle ORM
- **Shared types**: `packages/shared-types`

### Prerequisites

- Node.js 22 LTS or 24 LTS
- npm 10+

### Setup

```bash
npm install
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
npm run db:migrate
```

### Development

```bash
npm run dev           # Start all services
```

- Web: http://localhost:5173
- API: http://localhost:8787

### Testing

```bash
npm run test:unit         # Unit tests (Vitest)
npm run test:integration  # Integration tests (Vitest)
npm run test:e2e          # E2E tests (Playwright)
npm run test:all          # Run all tests
```

### Code Quality

```bash
npm run lint          # ESLint
npm run typecheck     # TypeScript checks
npm run secret-scan   # Scan for leaked secrets
```

### Database

```bash
npm run db:generate   # Generate migrations from schema
npm run db:migrate    # Apply pending migrations
npm run db:seed       # Seed with sample data
```

### Project Structure

```
apps/
├── web/              # Vite + React frontend
└── api/              # Fastify backend
packages/
└── shared-types/     # Shared TypeScript types
tests/
└── e2e/              # Playwright E2E tests
docs/
└── decisions/        # Architecture decision records
specs/
└── 001-modern-ai-outliner/  # Feature specification
```

### Key Features

- **US1**: Hierarchical outline editing with keyboard shortcuts, drag-and-drop, autosave
- **US2**: Search across 100+ item outlines with highlight persistence
- **US3**: AI-ready metadata per item with JSON/Markdown export

### Decisions

See [docs/decisions/001-outliner-architecture.md](docs/decisions/001-outliner-architecture.md)
