# AgentCal

**Scheduling infrastructure for AI agents.**

APIs, SDKs, and embeddable components for SaaS companies building AI-powered scheduling.

---

## What is AgentCal?

AgentCal provides the backend infrastructure that AI agents need to schedule appointments. Instead of building calendar integrations, availability logic, and booking management from scratch, use our APIs and SDKs to add scheduling to your AI product in minutes.

**Built for any B2B product that books appointments** (optimized for AI agents):

AgentCal operates in a **B2B2B model**:
- **Your SaaS platform** (our customer) integrates our API
- **Your customers** (businesses) connect their calendars and configure availability
- **Their end users** book appointments through your platform

Whether you're building AI assistants, scheduling tools, or vertical SaaS, AgentCal handles the complex calendar infrastructure so you can focus on your product.

---

## Quick Example

```typescript
import { AgentCal } from '@agentcal/sdk'

const agentcal = new AgentCal({ apiKey: 'sk_live_xxx' })

// AI agent checks availability
const slots = await agentcal.availability.list('acct_456', {
  userId: 'user_123',
  startDate: '2025-01-15',
  endDate: '2025-01-22'
})

// AI agent books appointment
const booking = await agentcal.bookings.create('acct_456', {
  userId: 'user_123',
  eventTypeId: 'evt_789',
  startTime: '2025-01-15T14:00:00Z',
  attendee: {
    email: 'customer@example.com',
    name: 'John Customer'
  }
})
```

---

## Key Features

- **REST API** - Complete scheduling API for AI agents to query availability and manage bookings
- **TypeScript/Python SDKs** - Type-safe clients with first-class AI support
- **Calendar Integrations** - Google Calendar, Microsoft 365 (coming soon)
- **Embeddable Components** - Pre-built UI for calendar connection, booking management, and settings
- **AI-Native Interfaces** - MCP server for Claude, OpenAI function definitions, tool handlers
- **Multi-Tenant** - Built for SaaS companies serving multiple customers
- **Webhooks** - Real-time notifications powered by SVIX

---

## Architecture

```
Your SaaS Platform
    ↓ Uses AgentCal API
Your Customers (Businesses)
    ↓ Connect their Google Calendars
    ↓ Configure availability rules
End Users
    ↓ Book appointments via AI
```

AgentCal sits two layers deep: you integrate our API, your customers connect their calendars, and your AI agents book appointments with their end users.

---

## Documentation

See [PRODUCT_VISION.md](./PRODUCT_VISION.md) for the full product vision and roadmap.

Detailed API documentation coming soon.

---

## Status

**Phase 1 (In Progress):** Core API + Google Calendar integration
- ✅ Google Calendar OAuth and API operations
- 🚧 OAuth routes
- 🚧 Availability calculation engine
- 🚧 Bookings API
- 🚧 Background jobs (token refresh)

See the [Product Vision](./PRODUCT_VISION.md) for the complete roadmap.

---

## Tech Stack

**Monorepo (Turborepo + PNPM):**
- `apps/web` - Next.js 15 developer dashboard
- `apps/api` - Hono.js REST API with OpenAPI
- `packages/db` - Drizzle ORM + PostgreSQL
- `packages/auth` - Better Auth
- `packages/calendar-integrations` - Google/Microsoft calendar clients

**Infrastructure:**
- PostgreSQL database
- Redis (BullMQ for background jobs)
- SVIX (webhook delivery)

---

## Development

```bash
# Install dependencies
pnpm install

# Start all apps
pnpm dev

# Start specific apps
pnpm dev:web    # Developer dashboard (Next.js)
pnpm dev:api    # API server (Hono)

# Database
pnpm db:studio  # Open Drizzle Studio
pnpm db:push    # Push schema changes
```

See [CLAUDE.md](./CLAUDE.md) for detailed development guide.

---

## Contributing

This is an open-source project and contributions are welcome. Feel free to open issues or submit pull requests.

---

## License

This project is licensed under the **GNU Affero General Public License v3.0 (AGPL-3.0)**.

- ✅ Commercial use allowed
- ✅ Modify and customize as needed
- ⚠️ Modified versions must be open source
- ⚠️ Network use triggers distribution (must share source with users)

See [LICENSE](./LICENSE) for full details.
