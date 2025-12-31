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
│   │    Businesses (their customers)                                 │  │
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

### Core Booking Model

**The bookable entity is the BUSINESS, but bookings are fulfilled by USERS.**

This model gives developers maximum flexibility: they can book with a business (system auto-assigns a user) or book with a specific user when needed.

#### Data Hierarchy

```
organization (SaaS company - your direct customer)
  └── business (THE BOOKABLE ENTITY - their customer)
      ├── slug (globally unique for URLs)
      ├── eventTypes (belong to business, not users)
      │   ├── assignmentStrategy (round_robin, least_busy, random, manual)
      │   ├── eligibleUserIds (optional - null = all users can fulfill)
      │   └── businessUserId (optional - if set, locks to specific user)
      │
      └── businessUsers (the people who fulfill bookings)
          ├── slug (unique per business)
          ├── calendarConnection (Google, Microsoft)
          ├── availabilitySchedule → availabilityRules
          └── bookings (assigned to them at booking time)
```

#### Two Booking Modes

| Mode | When to Use | URL | API Call |
|------|-------------|-----|----------|
| **Business Booking** | Developer doesn't know/care which user | `/acme-insurance/consultation` | `POST /businesses/:id/bookings` (no user_id) |
| **User Booking** | Developer wants a specific person | `/acme-insurance/john/consultation` | `POST /businesses/:id/bookings` (with user_id) |

#### Why This Model?

1. **Optimal DX for AI agents**: Developer just says "book at Acme Insurance" - no need to know staff
2. **Flexibility**: Can still book with specific user when needed (follow-ups, VIPs)
3. **Scales**: Works for 1-person businesses and 100-person teams
4. **Clean URLs**: `agentcal.ai/acme-insurance/consultation` for any-user, `agentcal.ai/acme-insurance/john/consultation` for specific user

### Booking Flow

AgentCal supports two booking modes to handle different use cases:

#### Mode 1: "Book with Anyone" (Default for AI Agents)

When an event type has no assigned user (`businessUserId = NULL`), any available staff member can fulfill the booking. This is the primary mode for AI agent integrations.

```
┌─────────────────────────────────────────────────────────────────────────┐
│  AI Agent Booking Flow                                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  1. Customer: "Book me an appointment with Acme Insurance"              │
│                          │                                              │
│                          ▼                                              │
│  2. AI Agent calls: GET /v1/businesses/:id/availability                 │
│                     ?event_type_id=consultation                         │
│                     &start_date=2025-01-15                              │
│                     &end_date=2025-01-22                                │
│                          │                                              │
│                          ▼                                              │
│  3. AgentCal aggregates availability across ALL users:                  │
│     ┌─────────────────────────────────────────────────────────┐        │
│     │  John's Calendar    Sarah's Calendar    Mike's Calendar │        │
│     │  ─────────────────  ─────────────────  ──────────────── │        │
│     │  Mon 9-10 ✓         Mon 9-10 ✗         Mon 9-10 ✓       │        │
│     │  Mon 10-11 ✗        Mon 10-11 ✓        Mon 10-11 ✓      │        │
│     │  Mon 11-12 ✓        Mon 11-12 ✓        Mon 11-12 ✗      │        │
│     └─────────────────────────────────────────────────────────┘        │
│                          │                                              │
│                          ▼                                              │
│  4. Returns merged slots: [Mon 9-10, Mon 10-11, Mon 11-12]              │
│     (at least one user available for each slot)                         │
│                          │                                              │
│                          ▼                                              │
│  5. AI Agent books: POST /v1/businesses/:id/bookings                    │
│                     { start_time: "Mon 10-11", event_type_id: ... }     │
│                          │                                              │
│                          ▼                                              │
│  6. AgentCal assigns to available user (round-robin/least-busy):        │
│     → Sarah gets the booking (John busy, Mike or Sarah available)       │
│     → Calendar event created on Sarah's Google Calendar                 │
│     → Webhook fired: booking.created                                    │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

**URL Structure:** `agentcal.ai/acme-insurance/consultation`

**Use Cases:**
- AI agents booking on behalf of customers
- "Next available" appointment scheduling
- Call centers, support teams, sales teams

#### Mode 2: "Book with Specific User"

When an event type has an assigned user (`businessUserId = set`), only that user's availability is considered. Used when the customer specifically wants a particular person.

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Specific User Booking Flow                                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  1. Customer: "Book me an appointment with John at Acme Insurance"      │
│                          │                                              │
│                          ▼                                              │
│  2. AI Agent calls: GET /v1/businesses/:id/availability                 │
│                     ?user_id=john-123                                   │
│                     &event_type_id=consultation                         │
│                          │                                              │
│                          ▼                                              │
│  3. AgentCal checks ONLY John's calendar                                │
│                          │                                              │
│                          ▼                                              │
│  4. Returns John's available slots only                                 │
│                          │                                              │
│                          ▼                                              │
│  5. AI Agent books with user_id specified                               │
│     → Booking assigned to John                                          │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

**URL Structure:** `agentcal.ai/acme-insurance/john/consultation`

**Use Cases:**
- Follow-up appointments with same person
- VIP customers with dedicated account managers
- Specialists with unique skills

#### Assignment Strategies (for "Book with Anyone")

When multiple users are available for a slot, AgentCal uses configurable assignment strategies:

| Strategy | Description |
|----------|-------------|
| `round_robin` | Rotate evenly across all available users |
| `least_busy` | Assign to user with fewest bookings this week |
| `random` | Random selection among available users |
| `priority` | Assign based on user priority/seniority |

```typescript
// Event type configuration
{
  "slug": "consultation",
  "title": "30-Minute Consultation",
  "businessUserId": null,  // Any user can fulfill
  "assignmentStrategy": "round_robin",
  "eligibleUserIds": ["john-123", "sarah-456"]  // Optional: limit which users
}
```

### Source of Truth Philosophy

**AgentCal is the source of truth for all booking state.** This is a deliberate architectural decision with important implications.

#### How It Works

All booking mutations flow through AgentCal:

```
User action → AgentCal API → Updates DB → Fires webhook → Syncs to Google Calendar
```

This means:
- **Reschedules and cancellations** happen via AgentCal (API, embeds, or email links)
- **Calendar events are synced TO external calendars**, not synced FROM them
- **Webhooks fire reliably** because we control all mutations

#### What We Don't Do

We do NOT attempt to sync changes made directly in Google/Microsoft Calendar back to AgentCal. If a user deletes an event directly in Google Calendar:
- The booking still exists in AgentCal
- We don't detect or react to this change
- This matches how Cal.com and Calendly handle it

#### Why This Approach?

1. **Reliable webhooks** — Customers can trust that `booking.cancelled` means it was cancelled through AgentCal. No race conditions or missed events from external calendar polling.

2. **Simpler architecture** — No webhook renewal jobs (Google webhooks expire after 7 days), no polling infrastructure, no complex reconciliation logic.

3. **Industry standard** — Cal.com, Calendly, and other scheduling platforms work this way.

4. **Clear contract** — Developers know exactly what triggers events.

#### How Users Cancel/Reschedule

Instead of detecting calendar changes, we provide clear paths for users to manage bookings:

1. **Email confirmations** include cancel/reschedule links
2. **Calendar event description** includes management links:
   ```
   Manage this booking: https://app.agentcal.ai/bookings/abc123/manage
   Cancel: https://app.agentcal.ai/bookings/abc123/cancel
   Reschedule: https://app.agentcal.ai/bookings/abc123/reschedule
   ```
3. **Embeds** allow viewing and managing bookings
4. **API** supports programmatic cancellation/rescheduling

#### Future Consideration

If needed, we can add an optional daily reconciliation job that checks for orphaned calendar events and marks bookings as `cancelled_external`. This is a data hygiene feature, not a core sync mechanism.

---

## Product Surface

### 1. Core API

The primary interface for AI agents to interact with scheduling.

```
# Businesses (SaaS's customers)
POST   /v1/businesses                    # Create business
GET    /v1/businesses                    # List businesses
GET    /v1/businesses/:id                # Get business details
PATCH  /v1/businesses/:id                # Update business
DELETE /v1/businesses/:id                # Delete business

# Users (Schedulable people within a business)
POST   /v1/businesses/:id/users          # Create user
GET    /v1/businesses/:id/users          # List users
GET    /v1/businesses/:id/users/:id      # Get user
PATCH  /v1/businesses/:id/users/:id      # Update user
DELETE /v1/businesses/:id/users/:id      # Delete user

# OAuth / Calendar Connections (per user)
GET    /v1/businesses/:id/users/:uid/oauth/google   # Get Google OAuth URL
GET    /v1/businesses/:id/users/:uid/oauth/microsoft # Get Microsoft OAuth URL
GET    /v1/businesses/:id/users/:uid/connections    # List calendar connections
DELETE /v1/businesses/:id/users/:uid/connections/:id # Disconnect calendar

# Event Types
POST   /v1/businesses/:id/event-types    # Create event type
GET    /v1/businesses/:id/event-types    # List event types
GET    /v1/businesses/:id/event-types/:id
PATCH  /v1/businesses/:id/event-types/:id
DELETE /v1/businesses/:id/event-types/:id

# Availability
GET    /v1/businesses/:id/availability   # Get available slots
       ?event_type_id=...                # Required
       &start_date=...                   # Required
       &end_date=...                     # Required
       &timezone=...                     # Optional (default: UTC)
       &user_id=...                      # Optional (omit for pooled availability)

# Response includes which users are available per slot:
# { "slots": [{ "startTime": "...", "availableUserIds": ["user_1", "user_2"] }] }

# Bookings
POST   /v1/businesses/:id/bookings       # Create booking
       # user_id optional - if omitted, auto-assigns using event type strategy
GET    /v1/businesses/:id/bookings       # List bookings
GET    /v1/businesses/:id/bookings/:id   # Get booking (includes assignedTo)
PATCH  /v1/businesses/:id/bookings/:id   # Reschedule
DELETE /v1/businesses/:id/bookings/:id   # Cancel

# Webhooks
POST   /v1/webhooks                    # Register webhook
GET    /v1/webhooks                    # List webhooks
DELETE /v1/webhooks/:id                # Delete webhook
```

### 2. Embeddable Components

Pre-built UI that SaaS companies embed in their apps for their customers. Components are organized by who uses them.

#### Business Admin Embeds

For business owners/managers to configure their whole business.

| Component | Purpose | Scope |
|-----------|---------|-------|
| `<agentcal-event-types>` | Create/edit event types for the business | Business |
| `<agentcal-team>` | Invite/manage staff members | Business |
| `<agentcal-business-bookings>` | View all bookings across all staff | Business |
| `<agentcal-business-settings>` | Business-level settings (name, slug, etc.) | Business |

```html
<script src="https://js.agentcal.dev/v1/embeds.js"></script>

<!-- Business admin managing event types -->
<agentcal-event-types
  publishable-key="pk_live_abc123"
  business-id="biz_456">
</agentcal-event-types>

<!-- Business admin viewing all bookings -->
<agentcal-business-bookings
  publishable-key="pk_live_abc123"
  business-id="biz_456">
</agentcal-business-bookings>
```

#### User Embeds

For individual staff members to manage their own calendar and availability.

| Component | Purpose | Scope |
|-----------|---------|-------|
| `<agentcal-connect>` | OAuth calendar connection flow | User |
| `<agentcal-availability>` | Configure working hours | User |
| `<agentcal-user-bookings>` | View/manage user's own bookings | User |

```html
<!-- Staff member connecting their calendar -->
<agentcal-connect
  publishable-key="pk_live_abc123"
  business-id="biz_456"
  user-id="user_john_123">
</agentcal-connect>

<!-- Staff member setting their availability -->
<agentcal-availability
  publishable-key="pk_live_abc123"
  business-id="biz_456"
  user-id="user_john_123">
</agentcal-availability>
```

#### Public Embeds

For end-customers to book appointments. No authentication required.

| Component | Purpose | Scope |
|-----------|---------|-------|
| `<agentcal-booking-page>` | Full booking flow | Public |

```html
<!-- Public booking page for the business (any available user) -->
<agentcal-booking-page
  business-slug="acme-insurance"
  event-type-slug="consultation">
</agentcal-booking-page>

<!-- Public booking page for a specific user -->
<agentcal-booking-page
  business-slug="acme-insurance"
  user-slug="john"
  event-type-slug="consultation">
</agentcal-booking-page>
```

#### Embed Authentication

**Private embeds** (admin + user): Use publishable key + IDs. Security relies on:
- Business/User IDs are UUIDs (unguessable)
- Publishable key scopes requests to the organization
- Optional: HMAC signing for security-conscious customers

**Public embeds**: No auth needed. Uses slugs for human-readable URLs.

### 3. SDKs

**The Happy Path - No User Required:**

```typescript
// TypeScript/JavaScript SDK - Optimal DX for AI Agents
import { AgentCal } from '@agentcal/sdk';

const agentcal = new AgentCal({ apiKey: 'sk_live_xxx' });

// Step 1: Get available slots (NO user_id needed!)
const slots = await agentcal.availability.list('biz_456', {
  eventTypeId: 'evt_consultation',
  startDate: '2025-01-15',
  endDate: '2025-01-22',
});
// Returns merged availability across ALL eligible users

// Step 2: Book a slot (NO user_id needed!)
const booking = await agentcal.bookings.create('biz_456', {
  eventTypeId: 'evt_consultation',
  startTime: slots[0].startTime,
  attendee: {
    email: 'customer@example.com',
    name: 'John Customer',
  },
});
// Returns: {
//   id: 'booking_123',
//   businessUserId: 'user_sarah_456',  // Auto-assigned!
//   assignedTo: { name: 'Sarah Johnson', email: 'sarah@acme.com' },
//   assignedVia: 'round_robin'
// }
```

**With Specific User (for follow-ups, VIPs, etc.):**

```typescript
// Book with a specific user when needed
const booking = await agentcal.bookings.create('biz_456', {
  eventTypeId: 'evt_consultation',
  businessUserId: 'user_john_123',  // Optional: specify user
  startTime: '2025-01-15T14:00:00Z',
  attendee: {
    email: 'customer@example.com',
    name: 'John Customer',
  },
});
```

```python
# Python SDK - Same simplicity
from agentcal import AgentCal

client = AgentCal(api_key="sk_live_xxx")

# Get available slots (no user needed)
slots = client.availability.list(
    business_id="biz_456",
    event_type_id="evt_consultation",
    start_date="2025-01-15",
    end_date="2025-01-22",
)

# Book a slot (user auto-assigned)
booking = client.bookings.create(
    business_id="biz_456",
    event_type_id="evt_consultation",
    start_time=slots[0].start_time,
    attendee_email="customer@example.com",
    attendee_name="John Customer",
)
# booking.assigned_to -> { "name": "Sarah Johnson", "email": "sarah@acme.com" }
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
const result = await agentcal.executeToolCall(toolCall, { businessId: 'biz_456' });
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
      agentcal.executeToolCall(tc, { businessId: 'biz_456' })
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
├── businesses (their customers)
│   ├── id: uuid
│   ├── organization_id: fk
│   ├── external_business_id: string (org's internal ID)
│   ├── name: string
│   ├── slug: string (globally unique, for URLs like agentcal.ai/acme-insurance)
│   ├── metadata: jsonb
│   ├── created_at: timestamp
│   │
│   ├── business_users (schedulable people)
│   │   ├── id: uuid
│   │   ├── business_id: fk
│   │   ├── external_user_id: string (org's internal ID)
│   │   ├── email: string
│   │   ├── name: string
│   │   ├── slug: string (unique per business, for URLs like /acme/john/consultation)
│   │   ├── timezone: string
│   │   ├── metadata: jsonb
│   │   └── created_at: timestamp
│   │
│   ├── calendar_connections (per user)
│   │   ├── id: uuid
│   │   ├── business_user_id: fk
│   │   ├── provider: enum (google, microsoft)
│   │   ├── provider_account_id: string
│   │   ├── email: string
│   │   ├── access_token: encrypted
│   │   ├── refresh_token: encrypted
│   │   ├── token_expires_at: timestamp
│   │   ├── calendar_id: string
│   │   └── created_at: timestamp
│   │
│   ├── event_types
│   │   ├── id: uuid
│   │   ├── business_id: fk
│   │   ├── business_user_id: fk (optional - if null, "book with anyone")
│   │   ├── slug: string (unique per business)
│   │   ├── title: string
│   │   ├── description: string
│   │   ├── duration_minutes: integer
│   │   ├── location_type: enum (google_meet, zoom, phone, in_person, custom)
│   │   ├── buffer_before: integer
│   │   ├── buffer_after: integer
│   │   ├── min_notice_minutes: integer
│   │   ├── max_days_in_advance: integer
│   │   ├── availability_schedule_id: fk (optional)
│   │   ├── assignment_strategy: enum (round_robin, least_busy, random, manual)
│   │   ├── eligible_user_ids: jsonb (optional - null = all business users)
│   │   ├── metadata: jsonb
│   │   └── created_at: timestamp
│   │
│   ├── availability_schedules (per user)
│   │   ├── id: uuid
│   │   ├── business_user_id: fk
│   │   ├── name: string
│   │   ├── timezone: string
│   │   ├── is_default: boolean
│   │   └── created_at: timestamp
│   │
│   ├── availability_rules (per schedule)
│   │   ├── id: uuid
│   │   ├── schedule_id: fk
│   │   ├── day_of_week: integer (0-6, null for date overrides)
│   │   ├── specific_date: date (for date overrides)
│   │   ├── start_time: time
│   │   ├── end_time: time
│   │   ├── is_available: boolean
│   │   └── created_at: timestamp
│   │
│   ├── bookings
│   │   ├── id: uuid
│   │   ├── business_id: fk
│   │   ├── business_user_id: fk (assigned at booking time for "book with anyone")
│   │   ├── event_type_id: fk
│   │   ├── title: string
│   │   ├── description: string
│   │   ├── start_time: timestamp
│   │   ├── end_time: timestamp
│   │   ├── timezone: string
│   │   ├── status: enum (pending, confirmed, cancelled, completed, no_show)
│   │   ├── location_type: enum (google_meet, zoom, phone, in_person, custom)
│   │   ├── location: string (address or custom details)
│   │   ├── meeting_url: string (video call URL)
│   │   ├── calendar_event_id: string (external calendar ID)
│   │   ├── assigned_via: string (round_robin, least_busy, manual, event_type_locked)
│   │   ├── assignment_metadata: jsonb (available users, selection reason)
│   │   ├── attendee_email: string
│   │   ├── attendee_name: string
│   │   ├── attendee_timezone: string
│   │   ├── cancellation_reason: string
│   │   ├── metadata: jsonb
│   │   └── created_at: timestamp
│   │
│   └── booking_events (audit log)
│       ├── id: uuid
│       ├── booking_id: fk
│       ├── event_type: string (created, confirmed, rescheduled, cancelled)
│       ├── old_status: enum
│       ├── new_status: enum
│       ├── metadata: jsonb (reason, previous times, etc.)
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
- [x] Review existing schema in `packages/db/src/schema/`
- [x] Remove tables/fields related to old scope (tasks, agent canvas, knowledge base, monitoring)
- [x] Identify which existing tables can be repurposed (event_types, availability, bookings, users)
- [x] Document schema changes needed for multi-tenant model
- [x] Create migration plan for schema updates

#### Step 1.1: Multi-tenant Data Model
- [x] Create `organizations` table (API keys, publishable keys, plan)
- [x] Create `businesses` table (formerly "connected_accounts" - belongs to org, stores metadata)
- [x] Create `calendar_connections` table (OAuth tokens, encrypted)
- [x] Create `business_users` table (formerly "users" - schedulable people within a business)
- [x] Update existing `event_types`, `availability_rules`, `bookings` to reference businesses
- [x] Add API key authentication middleware

#### Step 1.2: Google Calendar Integration
- [x] Set up Google Cloud project + OAuth consent screen
- [x] Implement OAuth redirect flow (`/v1/accounts/:id/oauth/google`)
- [x] Implement OAuth callback + token exchange
- [x] Store refresh tokens (encryption at rest is TODO)
- [x] Build token refresh (on-demand in `getCredentialsWithRefresh`, background job TODO)
- [x] Implement calendar read (get events/busy times)
- [x] Implement calendar write (create/update/delete events)

#### Step 1.3: Availability API
- [x] `GET /v1/businesses/:id/availability` endpoint
- [x] Availability rule storage (day of week, start/end time, timezone)
- [x] Conflict detection against existing calendar events
- [x] Timezone conversion (store UTC, accept/return with timezone param)
- [x] Buffer time handling (before/after meetings)
- [x] Minimum notice period enforcement

#### Step 1.4: Bookings API
- [x] `POST /v1/businesses/:id/bookings` - create booking
- [x] `GET /v1/businesses/:id/bookings` - list bookings
- [x] `GET /v1/businesses/:id/bookings/:bookingId` - get booking
- [x] `PATCH /v1/businesses/:id/bookings/:bookingId` - reschedule
- [x] `DELETE /v1/businesses/:id/bookings/:bookingId` - cancel
- [x] Create Google Calendar event on booking
- [x] Update/delete calendar event on reschedule/cancel

#### Step 1.4.1: Email Notifications (via Resend)
- [x] Set up Resend integration (`RESEND_API_KEY`, `EMAIL_FROM`, `BOOKING_MANAGE_BASE_URL` env vars)
- [x] Create email service with React templates (`apps/api/src/services/email/`)
- [x] Create notifications helper (`apps/api/src/lib/notifications/`)
- [x] Booking confirmation email to attendee (with cancel/reschedule links)
- [x] Booking notification email to host
- [x] Cancellation email to attendee and host
- [x] Reschedule email to attendee and host
- [x] Send calendar invite (.ics) attachment (using `ical-generator`)

#### Step 1.5: Webhooks (via SVIX)

Using managed SVIX for MVP. Can self-host later for the Railway one-click deploy story (Phase 4.4).

- [ ] Set up SVIX account + get API keys
- [ ] Integrate SVIX SDK into API
- [ ] `POST /v1/webhooks` - register webhook endpoint (via SVIX)
- [ ] `GET /v1/webhooks` - list webhooks
- [ ] `DELETE /v1/webhooks/:id` - delete webhook
- [ ] SVIX handles delivery, retries, and signature verification

**MVP Events (3 events):**

| Event | Trigger | Notes |
|-------|---------|-------|
| `booking.created` | New booking confirmed | Includes assigned user, meeting details |
| `booking.cancelled` | Booking cancelled via API/embed/link | Includes cancellation reason if provided |
| `booking.rescheduled` | Booking time changed | Includes old and new times |

**Post-MVP Events:**

| Event | Trigger | Notes |
|-------|---------|-------|
| `booking.reminder` | X hours before meeting | Requires BullMQ job (Step 1.6) |
| `booking.completed` | Meeting time has passed | For follow-up workflows |
| `booking.no_show` | Manually marked as no-show | Analytics, follow-up sequences |

**Webhook Payload Shape:**
```json
{
  "id": "evt_abc123",
  "type": "booking.created",
  "created_at": "2025-01-15T10:30:00Z",
  "data": {
    "booking": {
      "id": "booking_xyz",
      "business_id": "biz_456",
      "business_user_id": "user_789",
      "event_type_id": "evt_type_123",
      "start_time": "2025-01-20T14:00:00Z",
      "end_time": "2025-01-20T14:30:00Z",
      "status": "confirmed",
      "attendee": {
        "email": "customer@example.com",
        "name": "John Customer"
      },
      "assigned_to": {
        "id": "user_789",
        "name": "Sarah Smith",
        "email": "sarah@acme.com"
      },
      "meeting_url": "https://meet.google.com/abc-xyz",
      "metadata": {}
    }
  }
}
```

See [Source of Truth Philosophy](#source-of-truth-philosophy) for why webhooks only fire for changes made through AgentCal.

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
