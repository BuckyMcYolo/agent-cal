# AgentCal Product Vision

> **Scheduling infrastructure for AI agents.**
> APIs, SDKs, embeddable components, and calendar integrations for SaaS companies building AI-powered scheduling.

---

## Executive Summary

AgentCal is pivoting from a "Cal.com clone with AI" to **scheduling infrastructure for AI agents**. Instead of competing with Cal.com and Calendly on the consumer scheduling app market, we're becoming the backend that powers scheduling for any AI-powered product.

### The Core Value Prop

SaaS companies building AI assistants (phone bots, chatbots, copilots, autonomous agents) need scheduling capabilities. Building this from scratch is painful—timezone handling, availability conflicts, calendar integrations, buffer times, etc.

AgentCal provides:
- **API** for AI agents to query availability and create bookings
- **SDKs** to import tool calls and tool call handler functions to have AI powered booking up in minutes
- **Calendar integrations** (Google, Microsoft) so bookings sync to real calendars
- **Embeddable components** for humans to configure settings and view bookings
- **AI-native interfaces** (MCP server, OpenAI tool definitions) for seamless agent integration

---

## Target Customers

### Primary: SaaS Companies Building AI Products

Examples:
- AI phone agent platforms (like Vapi, Bland, Retell)
- AI chatbot/assistant builders
- Vertical SaaS adding AI scheduling (healthcare, insurance, real estate, etc.)
- Autonomous agent frameworks

### The User Chain

```
AgentCal (us)
    → SaaS Company (our customer, e.g., "Insurance AI SaaS")
        → Business (their customer, e.g., "Acme Insurance")
            → End User (books appointments)
```

We are **two layers removed** from the end user. Our direct customers are developers at SaaS companies.

---

## Architecture

### Multi-Tenant Model

```
┌────────────────────────────────────────────────────────────────────────┐
│                         AGENTCAL PLATFORM                              │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│   Organizations (our direct customers - SaaS companies)                │
│   ┌────────────────────────────────────────────────────────────────┐  │
│   │  Insurance AI SaaS (org_123)                                    │  │
│   │    API Key: sk_live_xxxxx                                       │  │
│   │    Publishable Key: pk_live_xxxxx                               │  │
│   │                                                                 │  │
│   │    Connected Accounts (their customers)                         │  │
│   │    ┌─────────────────────────────────────────────────────────┐ │  │
│   │    │  Acme Insurance (acct_456)                              │ │  │
│   │    │    └── Google Calendar OAuth token                      │ │  │
│   │    │    └── Staff: john@acme.com, sarah@acme.com             │ │  │
│   │    │    └── Event Types: "Consultation", "Follow-up"         │ │  │
│   │    ├─────────────────────────────────────────────────────────┤ │  │
│   │    │  BigCorp Insurance (acct_789)                           │ │  │
│   │    │    └── Microsoft 365 OAuth token                        │ │  │
│   │    │    └── Staff: mike@bigcorp.com                          │ │  │
│   │    └─────────────────────────────────────────────────────────┘ │  │
│   └────────────────────────────────────────────────────────────────┘  │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

### Calendar OAuth Flow

Since we're two layers removed from the business calendars, we provide an **embeddable OAuth flow**:

1. SaaS Company embeds our calendar connect component in their app
2. Business admin (Acme Insurance) clicks "Connect Google Calendar"
3. OAuth redirects through AgentCal
4. We store the tokens, associated with that connected account
5. SaaS Company's AI can now query availability via our API

```
Insurance SaaS Dashboard
┌─────────────────────────────────────────────────────┐
│  Acme Insurance - Settings                          │
│                                                     │
│  Calendar Integration                               │
│  ┌─────────────────────────────────────────────┐   │
│  │  <agentcal-connect account-id="acct_456">   │   │
│  │                                              │   │
│  │    [Connect Google Calendar]                 │   │ ← Our embed
│  │                                              │   │
│  └─────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

---

## Product Surface

### 1. Core API

The primary interface for AI agents to interact with scheduling.

```
# Accounts (Connected Accounts = SaaS's customers)
POST   /v1/accounts                    # Create connected account
GET    /v1/accounts                    # List connected accounts
GET    /v1/accounts/:id                # Get account details
DELETE /v1/accounts/:id                # Delete account

# OAuth / Calendar Connections
GET    /v1/accounts/:id/oauth/google   # Get Google OAuth URL
GET    /v1/accounts/:id/oauth/microsoft # Get Microsoft OAuth URL
GET    /v1/accounts/:id/connections    # List calendar connections
DELETE /v1/accounts/:id/connections/:id # Disconnect calendar

# Users (Schedulable people within an account)
POST   /v1/accounts/:id/users          # Create user
GET    /v1/accounts/:id/users          # List users
GET    /v1/accounts/:id/users/:id      # Get user
PATCH  /v1/accounts/:id/users/:id      # Update user
DELETE /v1/accounts/:id/users/:id      # Delete user

# Event Types
POST   /v1/accounts/:id/event-types    # Create event type
GET    /v1/accounts/:id/event-types    # List event types
GET    /v1/accounts/:id/event-types/:id
PATCH  /v1/accounts/:id/event-types/:id
DELETE /v1/accounts/:id/event-types/:id

# Availability
GET    /v1/accounts/:id/availability   # Get available slots
       ?user_id=...
       &event_type_id=...
       &start_date=...
       &end_date=...
       &timezone=...

POST   /v1/accounts/:id/availability/query  # Natural language query (optional)
       { "query": "next Tuesday afternoon, 30 minutes" }

# Bookings
POST   /v1/accounts/:id/bookings       # Create booking
GET    /v1/accounts/:id/bookings       # List bookings
GET    /v1/accounts/:id/bookings/:id   # Get booking
PATCH  /v1/accounts/:id/bookings/:id   # Reschedule
DELETE /v1/accounts/:id/bookings/:id   # Cancel

# Webhooks
POST   /v1/webhooks                    # Register webhook
GET    /v1/webhooks                    # List webhooks
DELETE /v1/webhooks/:id                # Delete webhook
```

### 2. Embeddable Components

Pre-built UI that SaaS companies embed in their apps for their customers.

| Component | Purpose | Auth Required |
|-----------|---------|---------------|
| `<agentcal-connect>` | OAuth calendar connection flow | Yes |
| `<agentcal-availability>` | Configure working hours | Yes |
| `<agentcal-event-settings>` | Configure event type settings | Yes |
| `<agentcal-bookings>` | View/manage bookings | Yes |
| `<agentcal-booking-page>` | Public booking page | No (public) |

#### Embed Authentication (Simple Approach)

For private embeds, use publishable key + account ID:

```html
<script src="https://js.agentcal.dev/v1/embeds.js"></script>

<agentcal-bookings
  publishable-key="pk_live_abc123"
  account-id="acct_456">
</agentcal-bookings>
```

Security: Account IDs are UUIDs (unguessable). Publishable key scopes to the organization.

Optional (for security-conscious customers): Add HMAC signing of account ID.

For public booking pages, no auth needed:

```html
<agentcal-booking-page
  account-id="acct_456"
  event-type-id="evt_789">
</agentcal-booking-page>
```

### 3. SDKs

```typescript
// TypeScript/JavaScript SDK
import { AgentCal } from '@agentcal/sdk';

const agentcal = new AgentCal({ apiKey: 'sk_live_xxx' });

const slots = await agentcal.availability.list('acct_456', {
  userId: 'user_123',
  eventTypeId: 'evt_789',
  startDate: '2025-01-15',
  endDate: '2025-01-22',
});

const booking = await agentcal.bookings.create('acct_456', {
  userId: 'user_123',
  eventTypeId: 'evt_789',
  startTime: '2025-01-15T14:00:00Z',
  attendee: {
    email: 'customer@example.com',
    name: 'John Customer',
  },
});
```

```python
# Python SDK
from agentcal import AgentCal

client = AgentCal(api_key="sk_live_xxx")

slots = client.availability.list(
    account_id="acct_456",
    user_id="user_123",
    start_date="2025-01-15",
    end_date="2025-01-22",
)

booking = client.bookings.create(
    account_id="acct_456",
    user_id="user_123",
    event_type_id="evt_789",
    start_time="2025-01-15T14:00:00Z",
    attendee_email="customer@example.com",
)
```

### 4. MCP Server (Model Context Protocol)

For AI agents using Anthropic's MCP standard:

```json
{
  "tools": [
    {
      "name": "get_availability",
      "description": "Get available time slots for scheduling a meeting",
      "parameters": {
        "account_id": "string",
        "user_id": "string (optional)",
        "duration_minutes": "number",
        "start_date": "string (ISO date)",
        "end_date": "string (ISO date)"
      }
    },
    {
      "name": "create_booking",
      "description": "Book a meeting at a specific time",
      "parameters": {
        "account_id": "string",
        "user_id": "string",
        "start_time": "string (ISO datetime)",
        "attendee_email": "string",
        "attendee_name": "string"
      }
    },
    {
      "name": "cancel_booking",
      "description": "Cancel an existing booking",
      "parameters": {
        "booking_id": "string"
      }
    }
  ]
}
```

### 5. OpenAI Function Definitions

For AI agents using OpenAI's function calling. Tools are exported directly from the SDK so developers can pick what they need:

```typescript
import { AgentCal } from '@agentcal/sdk';
import { 
  tools,                    // All tools as an array
  // Or import individually:
  getAvailabilityTool,
  createBookingTool,
  cancelBookingTool,
  rescheduleBookingTool,
  listBookingsTool,
} from '@agentcal/sdk/openai';

const agentcal = new AgentCal({ apiKey: process.env.AGENTCAL_API_KEY });

// Use all tools
const response = await openai.chat.completions.create({
  model: 'gpt-4',
  messages: [...],
  tools: tools,
});

// Or just the ones you need
const response = await openai.chat.completions.create({
  model: 'gpt-4', 
  messages: [...],
  tools: [getAvailabilityTool, createBookingTool],
});

// Handle tool calls - accountId passed at execution time
const result = await agentcal.handleToolCall(toolCall, { accountId: 'acct_456' });
```

#### Full Example

```typescript
import { AgentCal } from '@agentcal/sdk';
import { tools } from '@agentcal/sdk/openai';
import OpenAI from 'openai';

const agentcal = new AgentCal({ apiKey: process.env.AGENTCAL_API_KEY });
const openai = new OpenAI();

const messages = [
  { role: 'system', content: 'You help users schedule appointments.' },
  { role: 'user', content: 'Book me a meeting next Tuesday at 2pm' }
];

// 1. Call OpenAI with our tools
const response = await openai.chat.completions.create({
  model: 'gpt-4',
  messages,
  tools,
});

// 2. Handle any tool calls
const message = response.choices[0].message;

if (message.tool_calls) {
  const toolResults = await Promise.all(
    message.tool_calls.map(tc => 
      agentcal.handleToolCall(tc, { accountId: 'acct_456' })
    )
  );

  // 3. Send results back to OpenAI
  const finalResponse = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      ...messages,
      message,
      ...toolResults.map((result, i) => ({
        role: 'tool',
        tool_call_id: message.tool_calls[i].id,
        content: JSON.stringify(result),
      })),
    ],
  });
  
  console.log(finalResponse.choices[0].message.content);
  // "Done! I've booked your meeting for Tuesday at 2pm."
}
```

#### Available Tools

| Export | Description |
|--------|-------------|
| `tools` | Array of all tools |
| `getAvailabilityTool` | Get available time slots |
| `createBookingTool` | Book a meeting |
| `cancelBookingTool` | Cancel a booking |
| `rescheduleBookingTool` | Move a booking to a new time |
| `listBookingsTool` | List upcoming/past bookings |

#### Why Direct Exports?

- **Tree-shakeable** — Only bundle what you use
- **Explicit** — Developers see exactly what tools they're adding
- **Flexible** — Easy to combine with other tools
- **TypeScript-friendly** — Full type inference on tool arguments

### 6. Web Dashboard (for our direct customers)

The `/web` app becomes a B2B developer dashboard:

| Route | Purpose |
|-------|---------|
| `/` | Marketing landing page |
| `/pricing` | Plans and pricing |
| `/docs` | Documentation (links to Mintlify) |
| `/login`, `/signup` | Auth for SaaS developers |
| `/dashboard` | Overview, quick stats |
| `/dashboard/api-keys` | Create/manage API keys |
| `/dashboard/accounts` | View connected accounts |
| `/dashboard/usage` | API usage metrics |
| `/dashboard/webhooks` | Configure webhooks |
| `/dashboard/logs` | Request logs, debugging |
| `/dashboard/playground` | Test embeds, generate snippets |

---

## Data Model

### Core Schema

```
organizations (our customers - SaaS companies)
├── id: uuid
├── name: string
├── api_key_hash: string (sk_live_xxx)
├── publishable_key: string (pk_live_xxx)
├── plan: enum
├── created_at: timestamp
│
├── connected_accounts (their customers)
│   ├── id: uuid
│   ├── organization_id: fk
│   ├── name: string
│   ├── metadata: jsonb (their internal IDs, etc.)
│   ├── created_at: timestamp
│   │
│   ├── calendar_connections
│   │   ├── id: uuid
│   │   ├── connected_account_id: fk
│   │   ├── provider: enum (google, microsoft)
│   │   ├── access_token: encrypted
│   │   ├── refresh_token: encrypted
│   │   ├── token_expires_at: timestamp
│   │   ├── email: string
│   │   └── created_at: timestamp
│   │
│   ├── users (schedulable people)
│   │   ├── id: uuid
│   │   ├── connected_account_id: fk
│   │   ├── email: string
│   │   ├── name: string
│   │   ├── calendar_id: string
│   │   ├── timezone: string
│   │   └── created_at: timestamp
│   │
│   ├── event_types
│   │   ├── id: uuid
│   │   ├── connected_account_id: fk
│   │   ├── name: string
│   │   ├── slug: string
│   │   ├── duration_minutes: integer
│   │   ├── buffer_before: integer
│   │   ├── buffer_after: integer
│   │   ├── min_notice_hours: integer
│   │   └── created_at: timestamp
│   │
│   ├── availability_rules
│   │   ├── id: uuid
│   │   ├── user_id: fk (or event_type_id)
│   │   ├── day_of_week: integer (0-6)
│   │   ├── start_time: time
│   │   ├── end_time: time
│   │   └── timezone: string
│   │
│   └── bookings
│       ├── id: uuid
│       ├── connected_account_id: fk
│       ├── user_id: fk
│       ├── event_type_id: fk
│       ├── start_time: timestamp
│       ├── end_time: timestamp
│       ├── status: enum (confirmed, cancelled, completed)
│       ├── attendee_email: string
│       ├── attendee_name: string
│       ├── calendar_event_id: string (external calendar ID)
│       ├── metadata: jsonb
│       └── created_at: timestamp
│
└── webhooks
    ├── id: uuid
    ├── organization_id: fk
    ├── url: string
    ├── events: string[] (booking.created, booking.cancelled, etc.)
    ├── secret: string
    └── created_at: timestamp
```

---

## Directory Structure (New)

```
agent-cal/
├── apps/
│   ├── web/                          # B2B Dashboard + Marketing
│   │   ├── app/
│   │   │   ├── (marketing)/          # Landing, pricing, etc.
│   │   │   ├── (auth)/               # Login, signup
│   │   │   └── (dashboard)/          # Developer dashboard
│   │   └── ...
│   │
│   └── api/                          # Core API (keep & expand)
│       └── src/
│           ├── routes/
│           │   ├── accounts/         # Connected accounts CRUD
│           │   ├── availability/     # Availability queries
│           │   ├── bookings/         # Booking CRUD
│           │   ├── event-types/      # Event type CRUD
│           │   ├── users/            # Schedulable users
│           │   ├── oauth/            # Google/Microsoft OAuth
│           │   ├── webhooks/         # Webhook management
│           │   └── embed-sessions/   # (optional) Session tokens
│           ├── services/
│           │   ├── calendar/         # Calendar integration logic
│           │   ├── availability/     # Availability calculation
│           │   └── notifications/    # Email/calendar invites
│           └── ...
│
├── packages/
│   ├── db/                           # Keep - update schema
│   ├── auth/                         # Keep - for dashboard auth
│   ├── ui/                           # Keep - for dashboard UI
│   │
│   ├── embeds/                       # NEW: Embeddable components
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── connect.ts
│   │   │   │   ├── bookings.ts
│   │   │   │   ├── availability.ts
│   │   │   │   ├── event-settings.ts
│   │   │   │   └── booking-page.ts
│   │   │   └── index.ts
│   │   ├── dist/                     # Built bundle for CDN
│   │   └── package.json
│   │
│   ├── react/                        # NEW: React SDK
│   │   ├── src/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   └── index.ts
│   │   └── package.json              # @agentcal/react
│   │
│   ├── sdk-typescript/               # NEW: TS API SDK
│   │   ├── src/
│   │   └── package.json              # @agentcal/sdk
│   │
│   ├── sdk-python/                   # NEW: Python SDK
│   │   ├── agentcal/
│   │   └── pyproject.toml
│   │
│   ├── mcp-server/                   # NEW: MCP server
│   │   ├── src/
│   │   └── package.json
│   │
│   └── calendar-integrations/        # NEW: Calendar providers
│       ├── src/
│       │   ├── google/
│       │   ├── microsoft/
│       │   └── types.ts
│       └── package.json
│
├── docs/                             # Mintlify docs (expand significantly)
│
└── infrastructure/                   # NEW: Deployment configs
    ├── docker/
    ├── kubernetes/
    └── terraform/
```

---

## Migration from Current Codebase

### Remove / Archive

| Current | Action | Reason |
|---------|--------|--------|
| `agent-canvas/` | Remove | Was for AI agent builder UI |
| `knowledge-base/` | Remove | Was for RAG features |
| `monitoring/` | Remove | Was for AI agent monitoring |
| `connectors/` | Remove | Not needed in new model |
| `tasks/` | Remove | Not core to scheduling infra |

### Keep & Repurpose

| Current | Action | New Purpose |
|---------|--------|-------------|
| `dashboard/` | Repurpose | Developer dashboard (API keys, usage) |
| `bookings/` | Repurpose | Embed playground / preview |
| `event-types/` | Repurpose | Embed playground / preview |
| `availability/` | Repurpose | Embed playground / preview |
| `onboarding/` | Repurpose | Developer onboarding flow |

### Keep & Expand

| Current | Action |
|---------|--------|
| `apps/api/` | Expand significantly - this is the core product |
| `packages/db/` | Update schema for multi-tenant model |
| `packages/auth/` | Keep for dashboard auth |
| `packages/ui/` | Keep for dashboard UI |

---

## Build Priority

### Phase 1: Core API + Google Calendar (MVP)

#### Step 1.0: Database Audit & Cleanup
- [ ] Review existing schema in `packages/db/src/schema/`
- [ ] Remove tables/fields related to old scope (tasks, agent canvas, knowledge base, monitoring)
- [ ] Identify which existing tables can be repurposed (event_types, availability, bookings, users)
- [ ] Document schema changes needed for multi-tenant model
- [ ] Create migration plan for schema updates

#### Step 1.1: Multi-tenant Data Model
- [ ] Create `organizations` table (API keys, publishable keys, plan)
- [ ] Create `connected_accounts` table (belongs to org, stores metadata)
- [ ] Create `calendar_connections` table (OAuth tokens, encrypted)
- [ ] Create `users` table (schedulable people within an account)
- [ ] Update existing `event_types`, `availability_rules`, `bookings` to reference connected accounts
- [ ] Add API key authentication middleware
- [ ] Add `X-Account-ID` header parsing for scoping requests

#### Step 1.2: Google Calendar Integration
- [ ] Set up Google Cloud project + OAuth consent screen
- [ ] Implement OAuth redirect flow (`/v1/accounts/:id/oauth/google`)
- [ ] Implement OAuth callback + token exchange
- [ ] Store encrypted refresh tokens
- [ ] Build token refresh background job
- [ ] Implement calendar read (get events/busy times)
- [ ] Implement calendar write (create/update/delete events)

#### Step 1.3: Availability API
- [ ] `GET /v1/accounts/:id/availability` endpoint
- [ ] Availability rule storage (day of week, start/end time, timezone)
- [ ] Conflict detection against existing calendar events
- [ ] Timezone conversion (store UTC, accept/return with timezone param)
- [ ] Buffer time handling (before/after meetings)
- [ ] Minimum notice period enforcement

#### Step 1.4: Bookings API
- [ ] `POST /v1/accounts/:id/bookings` - create booking
- [ ] `GET /v1/accounts/:id/bookings` - list bookings
- [ ] `GET /v1/accounts/:id/bookings/:id` - get booking
- [ ] `PATCH /v1/accounts/:id/bookings/:id` - reschedule
- [ ] `DELETE /v1/accounts/:id/bookings/:id` - cancel
- [ ] Create Google Calendar event on booking
- [ ] Send calendar invite (.ics) to attendee via email
- [ ] Update/delete calendar event on reschedule/cancel

#### Step 1.5: Webhooks (via SVIX)
- [ ] Set up SVIX account + get API keys
- [ ] Integrate SVIX SDK into API
- [ ] `POST /v1/webhooks` - register webhook endpoint (via SVIX)
- [ ] `GET /v1/webhooks` - list webhooks
- [ ] `DELETE /v1/webhooks/:id` - delete webhook
- [ ] Configure webhook event types: `booking.created`, `booking.cancelled`, `booking.rescheduled`
- [ ] SVIX handles delivery, retries, and signature verification

#### Step 1.6: Background Jobs (BullMQ)
- [ ] Set up Redis instance for job queue
- [ ] Configure BullMQ in API
- [ ] Create `email-reminder` job (send reminder X hours before booking)
- [ ] Create `calendar-sync` job (periodic token refresh, calendar sync)
- [ ] Create `webhook-cleanup` job (remove failed endpoints after X retries)
- [ ] Add job dashboard for monitoring (Bull Board or similar)

#### Step 1.7: Simple Dashboard
- [ ] Auth (sign up, login) for SaaS company developers
- [ ] Organization creation on signup
- [ ] API key generation + display (show once)
- [ ] API key revocation
- [ ] List connected accounts (read-only view)

**Milestone:** Functional API that an AI agent can call to check availability and book meetings on Google Calendar, with reliable webhooks and email reminders.

---

### Phase 2: Embeds + Developer Experience

#### Step 2.1: Embed Infrastructure
- [ ] Create `packages/embeds` package
- [ ] Set up build pipeline (bundle to single JS file)
- [ ] Host on CDN (e.g., `https://js.agentcal.dev/v1/embeds.js`)
- [ ] Publishable key validation in embeds
- [ ] Account ID validation

#### Step 2.2: Calendar Connect Embed
- [ ] `<agentcal-connect>` web component
- [ ] Trigger OAuth flow in popup/redirect
- [ ] Handle OAuth callback
- [ ] Show connected state + disconnect option

#### Step 2.3: Bookings List Embed
- [ ] `<agentcal-bookings>` web component
- [ ] List upcoming/past bookings
- [ ] Cancel booking action
- [ ] Reschedule booking action (date picker)

#### Step 2.4: Event Type Settings Embed
- [ ] `<agentcal-event-settings>` web component
- [ ] Edit duration, buffer times, min notice
- [ ] Edit availability rules (working hours)

#### Step 2.5: TypeScript SDK
- [ ] Create `packages/sdk-typescript` package
- [ ] Thin HTTP client wrapper
- [ ] Full TypeScript types for all API responses
- [ ] `agentcal.availability.list()`, `agentcal.bookings.create()`, etc.
- [ ] Publish to npm as `@agentcal/sdk`

#### Step 2.6: Documentation
- [ ] Expand Mintlify docs with SDK examples
- [ ] Add "Getting Started" guide
- [ ] Add embed integration guide
- [ ] Add webhook integration guide
- [ ] API reference with code samples (TypeScript, cURL)

**Milestone:** SaaS companies can integrate without building UI from scratch.

---

### Phase 3: AI-Native Features

#### Step 3.1: OpenAI Tool Definitions
- [ ] Create `@agentcal/sdk/openai` export
- [ ] Static tool exports: `getAvailabilityTool`, `createBookingTool`, `cancelBookingTool`, etc.
- [ ] `tools` array export (all tools)
- [ ] `agentcal.handleToolCall()` method
- [ ] TypeScript types for tool arguments
- [ ] Documentation + examples

#### Step 3.2: MCP Server
- [ ] Create `packages/mcp-server` package
- [ ] Implement MCP protocol
- [ ] Tools: `get_availability`, `create_booking`, `cancel_booking`, `list_bookings`
- [ ] Configuration via environment variables (API key, default account)
- [ ] Publish to npm
- [ ] Add to MCP registry

#### Step 3.3: Python SDK (Basic)
- [ ] Create `packages/sdk-python` package
- [ ] Generate from OpenAPI spec (using openapi-generator) OR hand-write thin client
- [ ] Basic methods: `availability.list()`, `bookings.create()`, etc.
- [ ] Publish to PyPI as `agentcal`

**Milestone:** Seamless integration with AI agent frameworks (Claude, OpenAI, LangChain, etc.).

---

### Phase 4: Scale & Polish

#### Step 4.1: Microsoft 365 Integration
- [ ] Set up Azure AD app registration
- [ ] Implement Microsoft OAuth flow
- [ ] Microsoft Graph API for calendar read/write
- [ ] Handle token refresh

#### Step 4.2: React Component Library
- [ ] Create `packages/react` package
- [ ] React wrappers for all embeds
- [ ] `<AgentCalProvider>` context
- [ ] Hooks: `useBookings()`, `useAvailability()`
- [ ] Publish to npm as `@agentcal/react`

#### Step 4.3: Usage-Based Billing
- [ ] Track API calls per organization
- [ ] Track bookings created per organization
- [ ] Stripe integration for billing
- [ ] Usage dashboard in web app
- [ ] Plan limits + enforcement

#### Step 4.4: Self-Hosted Option
- [ ] Docker image for API
- [ ] Docker Compose for full stack (API + Postgres)
- [ ] Environment variable documentation
- [ ] Instructions for registering own Google/Microsoft OAuth apps
- [ ] Helm chart for Kubernetes (optional)

#### Step 4.5: Enterprise Features
- [ ] SSO (SAML/OIDC)
- [ ] Audit logs
- [ ] Role-based access control
- [ ] Custom SLA
- [ ] Dedicated support

**Milestone:** Production-ready platform that can scale and monetize.

---

## Business Model

### Hosted SaaS (Primary)

Usage-based pricing:

| Tier | Price | Limits |
|------|-------|--------|
| **Free** | $0 | 100 bookings/mo, 5 connected accounts |
| **Pro** | $49/mo | 1,000 bookings/mo, 50 accounts |
| **Scale** | $199/mo | 10,000 bookings/mo, unlimited accounts |
| **Enterprise** | Custom | Custom limits, SLA, support |

Or simpler: **$0.05 per booking**, first 100 free.

### Self-Hosted (Secondary)

- Open source core (AGPL license)
- Self-hosted = they run their own instance
- They register their own Google/Microsoft OAuth apps
- Free, but no support
- Enterprise support contracts available

---

## Competitive Positioning

| Solution | What it is | Our Differentiator |
|----------|------------|-------------------|
| **Nylas / Cronofy** | Raw calendar API | We provide scheduling *logic*, not just CRUD |
| **Cal.com API** | API for their product | We're API-first, AI-native, multi-tenant |
| **Calendly API** | Limited, consumer-focused | We're open source, embeddable, flexible |
| **Build it yourself** | Pain | We handle the hard parts |

### Our Unique Angle

**"AI-native scheduling infrastructure"**

- MCP server for Claude/Anthropic ecosystem
- OpenAI function definitions
- Designed for AI agents from day one
- Not retrofitting an existing consumer product

---

## Open Questions

1. **Pricing model** - Per booking? Per connected account? Per API call?
2. **Self-hosted priority** - How important is this vs. hosted-first?
3. **Which calendar first** - Google is most common, but Microsoft is big in enterprise
4. **Embed framework** - Web components? React-first? Both?
5. **Natural language queries** - Is this a real need or nice-to-have?

---

## Success Metrics

1. **Connected accounts** - How many businesses are using us through our customers
2. **Bookings created** - Volume of actual scheduling happening
3. **API calls** - Overall platform usage
4. **Time to first booking** - Developer experience metric
5. **Customer retention** - Are SaaS companies sticking with us

---

## References

- [Stripe Connect](https://stripe.com/connect) - Multi-tenant platform model
- [Nylas](https://nylas.com) - Calendar API (competitor/reference)
- [Cronofy](https://cronofy.com) - Calendar API (competitor/reference)
- [Cal.com](https://cal.com) - Open source scheduling (different market)
- [MCP Specification](https://modelcontextprotocol.io) - AI tool integration standard

---

*Last updated: December 22nd, 2025*
