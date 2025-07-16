# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

AgentCal is an AI-powered scheduling platform built as a Turborepo monorepo with PNPM workspaces. The project consists of a Next.js frontend, Hono.js API backend, and shared packages for authentication, database, UI components, and utilities.

## Architecture

### Monorepo Structure
- `apps/web/` - Next.js 15 frontend application with React 19
- `apps/api/` - Hono.js API server with OpenAPI documentation
- `packages/` - Shared workspace packages:
  - `db/` - Drizzle ORM schema and database configuration (PostgreSQL)
  - `auth/` - Better Auth authentication system
  - `ui/` - shadcn/ui component library
  - `api-client/` - Type-safe API client
  - `env-config/` - Environment configuration management
  - `eslint-config/` - Shared ESLint configuration
  - `typescript-config/` - Shared TypeScript configuration

### Technology Stack
- **Frontend**: Next.js 15, React 19, TanStack Query, shadcn/ui, Tailwind CSS
- **Backend**: Hono.js with Zod OpenAPI, Pino logging
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Better Auth
- **Build System**: Turborepo with PNPM workspaces
- **Type Safety**: TypeScript throughout, Zod for validation

## Common Commands

### Development
```bash
# Start all apps in development
pnpm dev

# Start specific apps
pnpm dev:web    # Frontend only
pnpm dev:api    # API only
pnpm dev:docs   # Documentation (Mintlify on port 5000)
```

### Building & Testing
```bash
# Build all packages
pnpm build

# Lint all packages
pnpm lint

# Type checking (web app)
pnpm --filter @workspace/web typecheck

# Run API tests
pnpm --filter @workspace/api test
```

### Database Operations
```bash
# Open Drizzle Studio
pnpm db:studio

# Generate migrations
pnpm db:generate

# Push schema changes
pnpm db:push

# Pull schema from database
pnpm db:pull
```

### API Documentation
```bash
# Generate OpenAPI docs
pnpm write-openapi

# Start API server
pnpm start:server
```

## Key Development Patterns

### Package Dependencies
- All workspace packages use `workspace:*` for internal dependencies
- Frontend transpiles `@workspace/ui` and `@workspace/env-config` packages
- API exports app for potential external consumption

### Authentication Flow
- Better Auth handles authentication with generated schema
- Bearer token middleware protects API routes
- Frontend uses session hooks and auth utilities

### Database Schema
- Snake case database columns, camelCase TypeScript
- Schema organized by domain (users, bookings, tasks, event-types, etc.)
- Drizzle migrations in `packages/db/migrations/`

### API Structure
- Hono.js with OpenAPI spec generation
- Routes organized by feature in `apps/api/src/routes/`
- Zod schemas for validation and OpenAPI documentation
- CORS configured for development and production

### Frontend Architecture
- App Router with nested layouts
- Route groups: `(application)`, `(unauthenticated)`, `(settings)`
- Component organization by feature in `components/`
- TanStack Query for server state management

## Environment Configuration

Environment variables are managed through `@workspace/env-config` with separate client and server configurations. The root `.env` file is loaded by both applications.

## Testing

API tests use Vitest with silent logging. Frontend doesn't currently have tests configured - check with the team before adding test frameworks.