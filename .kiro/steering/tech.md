# Technology Stack

## Build System & Package Management

- **Monorepo**: Turborepo for build orchestration and caching
- **Package Manager**: pnpm (v10.4.1+)
- **Node.js**: v21.0.0+ required
- **TypeScript**: v5.7.3 across all packages

## Frontend (Web App)

- **Framework**: Next.js 15.2+ with App Router
- **React**: v19.0.0
- **Styling**: Tailwind CSS via @workspace/ui package
- **UI Components**: shadcn/ui component library
- **State Management**: TanStack Query (React Query) v5.72.2+
- **Forms**: React Hook Form with Zod validation
- **Icons**: Tabler Icons, Lucide React
- **Charts**: Recharts
- **Drag & Drop**: @dnd-kit for agent canvas interface

## Backend (API)

- **Framework**: Hono.js v4.7.5+ (lightweight web framework)
- **Runtime**: Node.js with @hono/node-server
- **API Documentation**: OpenAPI 3.0 via @hono/zod-openapi
- **Validation**: Zod schemas
- **Logging**: Pino logger with hono-pino middleware
- **Authentication**: Better Auth (@workspace/auth package)

## Database

- **ORM**: Drizzle ORM v0.41.0+
- **Database**: PostgreSQL with postgres driver
- **Schema**: Drizzle Zod integration for type-safe schemas
- **Migrations**: Drizzle Kit for schema management

## Development Tools

- **Linting**: ESLint with custom @workspace/eslint-config (errors will be reported by user if needed)
- **Formatting**: Prettier
- **Type Checking**: TypeScript strict mode
- **Dev Server**: tsx with watch mode for API, Next.js with Turbopack for web

## Common Commands

### Development

```bash
# Start all apps
turbo dev

# Start specific app
turbo dev --filter @workspace/web
turbo dev --filter @workspace/api

# Start docs server
pnpm dev:docs
```

### Database Operations

```bash
# Open Drizzle Studio
pnpm db:studio

# Push schema changes
pnpm db:push

# Generate migrations
pnpm db:generate

# Pull schema from database
pnpm db:pull
```

### Build & Deploy

```bash
# Build all packages
turbo build

# Start production API server
pnpm start:server

# Generate OpenAPI documentation
pnpm write-openapi
```

### Code Quality

```bash
# Format code
pnpm format

# Type checking (optional - user will report issues)
turbo check-types
```

### Authentication

```bash
# Generate Better Auth schema
pnpm generate:better-auth
```

## Architecture Patterns

- **Workspace-based**: Shared packages (@workspace/\*) for common functionality
- **Type-safe APIs**: Hono + Zod + OpenAPI for contract-first development
- **Schema-first**: Database schema drives TypeScript types via Drizzle
- **Modular routing**: Route-based API organization with middleware composition

## Development Workflow Guidelines

### Testing & Quality Assurance

- **No unit tests required**: Focus on functional implementation
- **No linter validation**: User will report linting issues if they occur
- **Type safety**: Rely on TypeScript compiler for type checking
- **Manual testing**: Test functionality through UI/API interaction

### Task Management

- **Auto-completion**: Mark tasks as completed when AI believes implementation is done
- **Minimal validation**: Skip extensive testing phases
- **Iterative approach**: Implement, verify basic functionality, mark complete

### Spec Generation

- **Concise documentation**: Keep specs brief and focused
- **Essential details only**: Include only critical implementation details
- **Fast iteration**: Prioritize speed over comprehensive documentation
