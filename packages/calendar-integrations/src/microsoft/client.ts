import type {
  BusyTimeBlock,
  CalendarEvent,
  CalendarListItem,
  CreateCalendarEventParams,
  GetBusyTimesParams,
  ICalendarProvider,
  OAuthCredentials,
  OAuthTokenParams,
  OAuthUrlParams,
  RefreshTokenParams,
  UpdateCalendarEventParams,
} from "../types"
import { CalendarError } from "../types"

export interface MicrosoftCalendarConfig {
  clientId: string
  clientSecret: string
  tenantId?: string // defaults to "common" for multi-tenant
  redirectUri?: string
}

/**
 * Microsoft Calendar client implementing ICalendarProvider
 *
 * Uses Microsoft Graph API for calendar operations.
 * Requires Azure AD app registration with the following permissions:
 * - Calendars.ReadWrite
 * - User.Read
 *
 * TODO: Implement actual Microsoft Graph API calls
 * Reference: https://learn.microsoft.com/en-us/graph/api/resources/calendar
 */
export class MicrosoftCalendarClient implements ICalendarProvider {
  private config: MicrosoftCalendarConfig
  private tenantId: string

  constructor(config: MicrosoftCalendarConfig) {
    this.config = config
    this.tenantId = config.tenantId || "common"
  }

  /**
   * Generate OAuth authorization URL for Microsoft
   *
   * Microsoft OAuth endpoint: https://login.microsoftonline.com/{tenant}/oauth2/v2.0/authorize
   */
  async getOAuthUrl(params: OAuthUrlParams): Promise<string> {
    const scopes = params.scopes || [
      "https://graph.microsoft.com/Calendars.ReadWrite",
      "https://graph.microsoft.com/User.Read",
      "offline_access", // Required for refresh token
    ]

    const baseUrl = `https://login.microsoftonline.com/${this.tenantId}/oauth2/v2.0/authorize`

    const queryParams = new URLSearchParams({
      client_id: this.config.clientId,
      response_type: "code",
      redirect_uri: params.redirectUri || this.config.redirectUri || "",
      scope: scopes.join(" "),
      response_mode: "query",
      state: params.state || "",
    })

    return `${baseUrl}?${queryParams.toString()}`
  }

  /**
   * Exchange OAuth code for tokens
   *
   * Microsoft token endpoint: https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token
   *
   * TODO: Implement actual token exchange
   */
  async exchangeCodeForTokens(
    params: OAuthTokenParams
  ): Promise<OAuthCredentials> {
    // TODO: Implement Microsoft token exchange
    // 1. POST to https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token
    // 2. Body: client_id, client_secret, code, redirect_uri, grant_type=authorization_code
    // 3. Parse response: access_token, refresh_token, expires_in
    // 4. Call /me endpoint to get user email and ID

    throw new CalendarError(
      "Microsoft Calendar integration not yet implemented",
      "PROVIDER_ERROR"
    )

    // Example response structure:
    // return {
    //   accessToken: response.access_token,
    //   refreshToken: response.refresh_token,
    //   expiresAt: new Date(Date.now() + response.expires_in * 1000),
    //   email: userInfo.mail || userInfo.userPrincipalName,
    //   providerAccountId: userInfo.id,
    // }
  }

  /**
   * Refresh access token using refresh token
   *
   * TODO: Implement actual token refresh
   */
  async refreshAccessToken(
    params: RefreshTokenParams
  ): Promise<OAuthCredentials> {
    // TODO: Implement Microsoft token refresh
    // 1. POST to https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token
    // 2. Body: client_id, client_secret, refresh_token, grant_type=refresh_token
    // 3. Parse response and return new credentials

    throw new CalendarError(
      "Microsoft Calendar integration not yet implemented",
      "PROVIDER_ERROR"
    )
  }

  /**
   * Get list of calendars for the user
   *
   * Microsoft Graph endpoint: GET /me/calendars
   *
   * TODO: Implement actual calendar list
   */
  async listCalendars(
    credentials: OAuthCredentials
  ): Promise<CalendarListItem[]> {
    // TODO: Implement Microsoft calendar list
    // 1. GET https://graph.microsoft.com/v1.0/me/calendars
    // 2. Headers: Authorization: Bearer {access_token}
    // 3. Map response to CalendarListItem[]

    throw new CalendarError(
      "Microsoft Calendar integration not yet implemented",
      "PROVIDER_ERROR"
    )

    // Microsoft response shape:
    // {
    //   value: [
    //     {
    //       id: "...",
    //       name: "Calendar",
    //       color: "auto",
    //       isDefaultCalendar: true,
    //       canEdit: true,
    //     }
    //   ]
    // }
    //
    // Map to:
    // return response.value.map(cal => ({
    //   id: cal.id,
    //   name: cal.name,
    //   isPrimary: cal.isDefaultCalendar,
    //   accessRole: cal.canEdit ? "owner" : "reader",
    //   backgroundColor: cal.color,
    // }))
  }

  /**
   * Get busy times (events) from calendar
   *
   * Microsoft Graph endpoint: POST /me/calendar/getSchedule
   *
   * TODO: Implement actual busy times query
   */
  async getBusyTimes(
    credentials: OAuthCredentials,
    params: GetBusyTimesParams
  ): Promise<BusyTimeBlock[]> {
    // TODO: Implement Microsoft busy times
    // 1. POST https://graph.microsoft.com/v1.0/me/calendar/getSchedule
    // 2. Body: { schedules: [email], startTime, endTime, availabilityViewInterval }
    // 3. Parse scheduleItems and return busy blocks

    throw new CalendarError(
      "Microsoft Calendar integration not yet implemented",
      "PROVIDER_ERROR"
    )

    // Microsoft response shape:
    // {
    //   value: [{
    //     scheduleItems: [
    //       { status: "busy", start: {...}, end: {...} }
    //     ]
    //   }]
    // }
  }

  /**
   * Create a new calendar event
   *
   * Microsoft Graph endpoint: POST /me/calendars/{calendarId}/events
   *
   * TODO: Implement actual event creation
   */
  async createEvent(
    credentials: OAuthCredentials,
    params: CreateCalendarEventParams
  ): Promise<CalendarEvent> {
    // TODO: Implement Microsoft event creation
    // 1. POST https://graph.microsoft.com/v1.0/me/calendars/{calendarId}/events
    // 2. Body: { subject, body, start, end, attendees, location }
    // 3. Map response to CalendarEvent

    throw new CalendarError(
      "Microsoft Calendar integration not yet implemented",
      "PROVIDER_ERROR"
    )

    // Microsoft request body shape:
    // {
    //   subject: params.title,
    //   body: { contentType: "text", content: params.description },
    //   start: {
    //     dateTime: params.startTime.toISOString(),
    //     timeZone: this.convertToWindowsTimezone(params.timezone)
    //   },
    //   end: {
    //     dateTime: params.endTime.toISOString(),
    //     timeZone: this.convertToWindowsTimezone(params.timezone)
    //   },
    //   attendees: params.attendees?.map(a => ({
    //     emailAddress: { address: a.email, name: a.name },
    //     type: "required"
    //   })),
    //   location: { displayName: params.location }
    // }
  }

  /**
   * Update an existing calendar event
   *
   * Microsoft Graph endpoint: PATCH /me/calendars/{calendarId}/events/{eventId}
   *
   * TODO: Implement actual event update
   */
  async updateEvent(
    credentials: OAuthCredentials,
    params: UpdateCalendarEventParams
  ): Promise<CalendarEvent> {
    // TODO: Implement Microsoft event update
    // 1. PATCH https://graph.microsoft.com/v1.0/me/calendars/{calendarId}/events/{eventId}
    // 2. Body: only include changed fields
    // 3. Map response to CalendarEvent

    throw new CalendarError(
      "Microsoft Calendar integration not yet implemented",
      "PROVIDER_ERROR"
    )
  }

  /**
   * Delete a calendar event
   *
   * Microsoft Graph endpoint: DELETE /me/calendars/{calendarId}/events/{eventId}
   *
   * TODO: Implement actual event deletion
   */
  async deleteEvent(
    credentials: OAuthCredentials,
    calendarId: string,
    eventId: string,
    sendUpdates = false
  ): Promise<void> {
    // TODO: Implement Microsoft event deletion
    // 1. DELETE https://graph.microsoft.com/v1.0/me/calendars/{calendarId}/events/{eventId}
    // 2. If sendUpdates, may need to set header or use different endpoint

    throw new CalendarError(
      "Microsoft Calendar integration not yet implemented",
      "PROVIDER_ERROR"
    )
  }

  /**
   * Revoke OAuth token (disconnect from Microsoft)
   *
   * Note: Microsoft doesn't have a direct token revocation endpoint like Google.
   * The best practice is to delete the refresh token on your end.
   * For full revocation, users must go to https://account.live.com/consent/Manage
   *
   * TODO: Implement if Microsoft adds revocation endpoint
   */
  async revokeToken(token: string): Promise<void> {
    // Microsoft doesn't have a token revocation endpoint
    // Just log and return - the token will expire naturally
    console.warn(
      "Microsoft token revocation not supported via API. Token will expire naturally."
    )
  }

  /**
   * Get a single calendar event
   *
   * Microsoft Graph endpoint: GET /me/calendars/{calendarId}/events/{eventId}
   *
   * TODO: Implement actual event retrieval
   */
  async getEvent(
    credentials: OAuthCredentials,
    calendarId: string,
    eventId: string
  ): Promise<CalendarEvent | null> {
    // TODO: Implement Microsoft event retrieval
    // 1. GET https://graph.microsoft.com/v1.0/me/calendars/{calendarId}/events/{eventId}
    // 2. Map response to CalendarEvent
    // 3. Return null if 404

    throw new CalendarError(
      "Microsoft Calendar integration not yet implemented",
      "PROVIDER_ERROR"
    )
  }
}

// ===========================================================================
// Microsoft Graph API Types (partial, for reference)
// ===========================================================================

interface MicrosoftGraphEvent {
  id: string
  subject: string
  bodyPreview?: string
  body?: {
    contentType: "text" | "html"
    content: string
  }
  start: {
    dateTime: string
    timeZone: string
  }
  end: {
    dateTime: string
    timeZone: string
  }
  attendees?: Array<{
    emailAddress: {
      address: string
      name?: string
    }
    status?: {
      response?: string
    }
  }>
  location?: {
    displayName?: string
  }
  onlineMeeting?: {
    joinUrl?: string
  }
  showAs?: string
  iCalUId?: string
}
