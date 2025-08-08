# Project Structure

## Monorepo Organization

This is a Turborepo monorepo with pnpm workspaces, organized into apps and shared packages.

```
├── apps/                    # Application workspaces
│   ├── api/                # Backend API (Hono.js)
│   └── web/                # Frontend web app (Next.js)
├── packages/               # Shared packages
│   ├── api-client/         # API client library
│   ├── auth/               # Authentication utilities
│   ├── db/                 # Database schema and utilities
│   ├── env-config/         # Environment configuration
│   ├── eslint-config/      # Shared ESLint configuration
│   ├── typescript-config/  # Shared TypeScript configuration
│   └── ui/                 # Shared UI components (shadcn/ui)
└── docs/                   # API documentation (Mintlify)
```

## Apps Structure

### API App (`apps/api/`)

```
src/
├── app.ts                  # Main Hono app configuration
├── index.ts               # Server entry point
├── lib/                   # Shared utilities
│   ├── helpers/           # Helper functions
│   │   ├── app/          # App creation utilities
│   │   └── openapi/      # OpenAPI schema helpers
│   ├── misc/             # Miscellaneous utilities
│   ├── queries/          # Database query functions
│   ├── time/             # Time-related utilities
│   └── types/            # Type definitions
├── middleware/           # Hono middleware
├── routes/              # API route handlers
└── scripts/             # Build/deployment scripts
```

### Web App (`apps/web/`)

```
app/                        # Next.js App Router
├── (application)/         # Authenticated app routes
│   ├── (main)/           # Main application pages
│   └── (settings)/       # Settings pages
└── (unauthenticated)/    # Public routes (sign-in, sign-up)
components/               # React components
├── availability/         # Availability management
├── dashboard/           # Dashboard components
├── event-types/         # Event type management
├── nav/                 # Navigation components
├── settings/            # Settings components
└── tasks/               # Task management
hooks/                   # Custom React hooks
lib/                     # Client-side utilities
```

## Shared Packages

### Database (`packages/db/`)

- Drizzle ORM schema definitions
- Database connection utilities
- Type-safe schema exports
- Migration management

### UI (`packages/ui/`)

- shadcn/ui component library
- Tailwind CSS configuration
- Shared design system
- Custom hooks for UI interactions

### Auth (`packages/auth/`)

- Better Auth configuration
- Authentication utilities
- Session management
- Auth client setup

## Naming Conventions

### Workspace Names

- Apps: `@workspace/web`, `@workspace/api`
- Packages: `@workspace/db`, `@workspace/ui`, etc.

### File Naming

- **Components**: PascalCase for React components (`EventTypesList.tsx`)
- **Utilities**: kebab-case for utility files (`create-app.ts`)
- **Routes**: kebab-case for route files (`event-types.ts`)
- **Schemas**: kebab-case for schema files (`user-preferences.ts`)

### Directory Structure

- **Route grouping**: Next.js route groups with parentheses `(application)`
- **Feature-based**: Components organized by feature/domain
- **Shared utilities**: Common utilities in `lib/` directories
- **Type definitions**: Separate `types/` directories for complex type definitions

## Import Patterns

### Path Aliases

- `@/` - Points to `src/` in each workspace
- `@workspace/*` - References to shared packages

### Import Organization

1. External dependencies
2. Internal workspace dependencies (`@workspace/*`)
3. Relative imports (`./ ../`)

## Configuration Files

### Root Level

- `turbo.json` - Turborepo configuration
- `pnpm-workspace.yaml` - pnpm workspace definition
- `package.json` - Root package with shared scripts
- `.env` - Environment variables (not committed)

### Per Workspace

- `package.json` - Workspace-specific dependencies and scripts
- `tsconfig.json` - TypeScript configuration extending shared config
- Build tool configs (Next.js, Vite, etc.)

## Development Workflow

1. **New features**: Create in appropriate app or shared package
2. **Shared code**: Extract to packages when used by multiple apps
3. **Database changes**: Update schema in `packages/db`, run migrations
4. **API changes**: Update routes in `apps/api`, regenerate OpenAPI docs
5. **UI changes**: Update components in `packages/ui` or app-specific components
