# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) and other AI assistants when working with code in this repository.

**IMPORTANT**: This project uses [bd (beads)](https://github.com/steveyegge/beads) for ALL issue tracking. Use `bd` commands instead of markdown TODOs, task lists, or other tracking methods.

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

---

## Issue Tracking with bd (beads)

**IMPORTANT**: This project uses **bd (beads)** for ALL issue tracking. Do NOT use markdown TODOs, task lists, or other tracking methods.

### Why bd?

- Dependency-aware: Track blockers and relationships between issues
- Git-friendly: Auto-syncs to JSONL for version control
- Agent-optimized: JSON output, ready work detection, discovered-from links
- Prevents duplicate tracking systems and confusion

### When to Use bd

**✅ Always Use bd For:**

1. **Multi-session work** - Anything that won't complete in this conversation
2. **Complex features** - Break into epic → subtasks with dependencies
3. **Discovered work** - Found a bug/task you can't fix now? File it
4. **Planning phase** - After creating a design doc, structure it as bd issues
5. **Follow-up work** - Tasks that need attention in future sessions

**⚠️ When Starting a Session:**

If the human asks about **what to work on next** or references **previous work**:
```bash
bd ready --json  # Check for tracked work
bd list --json   # See all open issues
```

If implementing something that **spans multiple sessions** or has **multiple phases**:
```bash
bd list --json  # Check if issues already exist
# Or create an epic structure if starting fresh
```

**🚫 Don't Use bd For:**

- Simple one-off fixes that complete in this session
- Answering questions or explaining code  
- Quick refactors with no follow-up work
- Trivial changes (typos, formatting, simple bug fixes)

**Rule of thumb:** If it won't get lost when this session ends, you don't need to track it.

### Quick Start

**Check for ready work:**
```bash
bd ready --json
```

**Create new issues:**
```bash
bd create "Issue title" -t bug|feature|task -p 0-4 --json
bd create "Issue title" -p 1 --deps discovered-from:bd-123 --json
bd create "Subtask" --parent <epic-id> --json  # Hierarchical subtask (gets ID like epic-id.1)
```

**Claim and update:**
```bash
bd update bd-42 --status in_progress --json
bd update bd-42 --priority 1 --json
```

**Complete work:**
```bash
bd close bd-42 --reason "Completed" --json
```

### Issue Types

- `bug` - Something broken
- `feature` - New functionality
- `task` - Work item (tests, docs, refactoring)
- `epic` - Large feature with subtasks
- `chore` - Maintenance (dependencies, tooling)

### Priorities

- `0` - Critical (security, data loss, broken builds)
- `1` - High (major features, important bugs)
- `2` - Medium (default, nice-to-have)
- `3` - Low (polish, optimization)
- `4` - Backlog (future ideas)

### Workflow for AI Agents

1. **Check ready work**: `bd ready` shows unblocked issues
2. **Claim your task**: `bd update <id> --status in_progress`
3. **Work on it**: Implement, test, document
4. **Discover new work?** Create linked issue:
   - `bd create "Found bug" -p 1 --deps discovered-from:<parent-id>`
5. **Complete**: `bd close <id> --reason "Done"`
6. **Commit together**: Always commit the `.beads/issues.jsonl` file together with the code changes so issue state stays in sync with code state

### Writing Self-Contained Issues

Issues must be fully self-contained - readable without any external context (plans, chat history, etc.). A future session should understand the issue completely from its description alone.

**Required elements:**
- **Summary**: What and why in 1-2 sentences
- **Files to modify**: Exact paths (with line numbers if relevant)
- **Implementation steps**: Numbered, specific actions
- **Example**: Show before → after transformation when applicable

**Optional but helpful:**
- Edge cases or gotchas to watch for
- Test references (point to test files or test_data examples)
- Dependencies on other issues

**Bad example:**
```
Implement the refactoring from the plan
```

**Good example:**
```
Add timeout parameter to fetchUser() in src/api/users.ts

1. Add optional timeout param (default 5000ms)
2. Pass to underlying fetch() call
3. Update tests in src/api/users.test.ts

Example: fetchUser(id) → fetchUser(id, { timeout: 3000 })
Depends on: bd-abc123 (fetch wrapper refactor)
```

### Dependencies: Think "Needs", Not "Before"

`bd dep add X Y` = "X needs Y" = Y blocks X

**TRAP**: Temporal words ("Phase 1", "before", "first") invert your thinking!
```
WRONG: "Phase 1 before Phase 2" → bd dep add phase1 phase2
RIGHT: "Phase 2 needs Phase 1" → bd dep add phase2 phase1
```
**Verify**: `bd blocked` - tasks blocked by prerequisites, not dependents.

### Auto-Sync

bd automatically syncs with git:
- Exports to `.beads/issues.jsonl` after changes (5s debounce)
- Imports from JSONL when newer (e.g., after `git pull`)
- No manual export/import needed!

### GitHub Copilot Integration

If using GitHub Copilot, also create `.github/copilot-instructions.md` for automatic instruction loading.
Run `bd onboard` to get the content, or see the `.github/copilot-instructions.md` file.

### MCP Server (Recommended)

If using Claude or MCP-compatible clients, install the beads MCP server:

```bash
pip install beads-mcp
```

Add to MCP config (e.g., `~/.config/claude/config.json`):
```json
{
  "beads": {
    "command": "beads-mcp",
    "args": []
  }
}
```

Then use `mcp__beads__*` functions instead of CLI commands.

### Managing AI-Generated Planning Documents

AI assistants often create planning and design documents during development:
- PLAN.md, IMPLEMENTATION.md, ARCHITECTURE.md
- DESIGN.md, CODEBASE_SUMMARY.md, INTEGRATION_PLAN.md
- TESTING_GUIDE.md, TECHNICAL_DESIGN.md, and similar files

**Best Practice: Use a dedicated directory for these ephemeral files**

**Recommended approach:**
- Create a `history/` directory in the project root
- Store ALL AI-generated planning/design docs in `history/`
- Keep the repository root clean and focused on permanent project files
- Only access `history/` when explicitly asked to review past planning

**Example .gitignore entry (optional):**
```
# AI planning documents (ephemeral)
history/
```

**Benefits:**
- ✅ Clean repository root
- ✅ Clear separation between ephemeral and permanent documentation
- ✅ Easy to exclude from version control if desired
- ✅ Preserves planning history for archeological research
- ✅ Reduces noise when browsing the project

### CLI Help

Run `bd <command> --help` to see all available flags for any command.
For example: `bd create --help` shows `--parent`, `--deps`, `--assignee`, etc.

### Important Rules

- ✅ Use bd for multi-session and discovered work
- ✅ Always use `--json` flag for programmatic use
- ✅ Link discovered work with `discovered-from` dependencies
- ✅ Check `bd ready` before asking "what should I work on?"
- ✅ Store AI planning docs in `history/` directory
- ✅ Run `bd <cmd> --help` to discover available flags
- ❌ Do NOT create markdown TODO lists
- ❌ Do NOT use external issue trackers
- ❌ Do NOT duplicate tracking systems
- ❌ Do NOT clutter repo root with planning documents

---

## Landing the Plane (Session Completion)

**When ending a work session:**

1. **Update bd issues**
   - Close completed work: `bd close <id> --reason "Done"`
   - Update in-progress status on partial work
   - File issues for discovered work that needs follow-up

2. **Run quality gates** (if code changed)
   - Type checking: `pnpm typecheck`
   - Tests: `pnpm test` (if applicable)
   - Linters: Check for errors
   - File P0 issues if builds are broken

3. **Sync issues to JSONL (without committing)**
   ```bash
   bd sync --squash
   ```
   This updates `.beads/issues.jsonl` without creating a commit.

4. **Stop - DO NOT commit or push**
   - All changes (code + JSONL) are uncommitted
   - Human will review everything before committing
   - Human handles all git operations (add, commit, push)

5. **Provide handoff**
   - Summarize what was done
   - List open bd issues for follow-up
   - Note any blockers or decisions needed
   - Mention any quality gate failures

**Critical Rules:**
- ✅ DO run `bd sync --squash` to update JSONL
- ❌ DO NOT run `bd sync` without `--squash` (would auto-commit)
- ❌ DO NOT run `git add`, `git commit`, or `git push`
- ❌ DO NOT say "ready to commit when you are" - just stop

**Workflow Summary:**
```
Agent work → bd sync --squash → stop → human reviews → human commits → human pushes
```

**Example handoff:**
```
Session complete:
- Implemented WebSocket routing (bd-a1b2) ✅
- Discovered auth middleware bug (filed bd-f3e4) 🐛
- Type checking and linting passed
- All changes ready for your review
```
