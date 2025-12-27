# Google Calendar OAuth Flow

## Overview

This documents how the Google Calendar OAuth integration works in AgentCal.

## Flow Diagram

```
Frontend                    AgentCal API                 Google
   │                            │                           │
   │  GET /oauth/google         │                           │
   │───────────────────────────>│                           │
   │                            │                           │
   │  { url: "https://..." }    │                           │
   │<───────────────────────────│                           │
   │                            │                           │
   │  Redirect user ───────────────────────────────────────>│
   │                            │                           │
   │                            │    User approves access   │
   │                            │                           │
   │                            │<──────────────────────────│
   │                            │  Callback with code+state │
   │                            │                           │
   │                            │  Exchange code for tokens │
   │                            │─────────────────────────->│
   │                            │                           │
   │                            │<──────────────────────────│
   │                            │  Access + Refresh tokens  │
   │                            │                           │
   │  { success: true }         │                           │
   │<───────────────────────────│                           │
```

## Key Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/v1/businesses/:bid/users/:uid/oauth/google` | Get OAuth URL |
| GET | `/v1/oauth/google/callback` | Handle Google's redirect |
| GET | `/v1/businesses/:bid/users/:uid/connections` | List calendar connections |
| DELETE | `/v1/businesses/:bid/users/:uid/connections/:id` | Disconnect calendar |

## Key Files

| File | Purpose |
|------|---------|
| `apps/api/src/routes/calendar-connections/handlers.ts` | Route handlers |
| `apps/api/src/routes/calendar-connections/routes.ts` | OpenAPI definitions |
| `apps/api/src/services/calendar/google-calendar-service.ts` | Client + token refresh |
| `apps/api/src/lib/helpers/oauth/state-token.ts` | CSRF protection tokens |
| `packages/calendar-integrations/src/google/client.ts` | Google API wrapper |

## State Token (CSRF Protection)

The state token prevents attackers from forging OAuth callbacks.

**Created in Step 1:**
```typescript
const state = createOAuthStateToken(businessUserId, redirectUri)
// Returns: base64url(payload).signature
```

**Payload contains:**
- `businessUserId` - Who we're connecting for
- `redirectUri` - Where to redirect after (optional)
- `nonce` - Random value
- `expiresAt` - 10 minute expiry

**Verified in callback:**
```typescript
const payload = verifyOAuthStateToken(state)
// Checks HMAC signature + expiry
```

## Token Storage

Tokens are stored in `calendar_connection` table:

| Column | Purpose |
|--------|---------|
| `accessToken` | Used for API calls (~1 hour lifespan) |
| `refreshToken` | Used to get new access tokens (indefinite) |
| `tokenExpiresAt` | When access token expires |
| `calendarId` | Which calendar to use (usually "primary") |

## Token Refresh

Access tokens expire after ~1 hour. The `getCredentialsWithRefresh()` function:

1. Checks if token expires within 5 minutes
2. If expired, calls Google to refresh
3. Updates DB with new tokens
4. Returns valid credentials

```typescript
// Usage
const credentials = await getCredentialsWithRefresh(connection)
const events = await client.getBusyTimes(credentials, {...})
```

## Google Cloud Setup

Required in Google Cloud Console:
1. Create project
2. Enable Calendar API
3. Configure OAuth consent screen
4. Create OAuth 2.0 credentials (Web application)
5. Add authorized redirect URI: `http://localhost:8080/v1/oauth/google/callback`

## Environment Variables

```
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
```

Defined in `packages/env-config/src/server-env.ts`
