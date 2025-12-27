import { z } from "zod"

/**
 * Common types for calendar integrations
 */

export const CalendarProviderEnum = z.enum(["google", "microsoft"])
export type CalendarProvider = z.infer<typeof CalendarProviderEnum>

/**
 * OAuth credentials for a calendar connection
 */
export interface OAuthCredentials {
  accessToken: string
  refreshToken?: string
  expiresAt?: Date
  email: string
  providerAccountId?: string
}

/**
 * Calendar event participant
 */
export interface CalendarEventAttendee {
  email: string
  name?: string
  responseStatus?: "accepted" | "declined" | "tentative" | "needsAction"
}

/**
 * Calendar event data
 */
export interface CalendarEvent {
  id: string
  calendarId: string
  title: string
  description?: string
  startTime: Date
  endTime: Date
  timezone: string
  attendees?: CalendarEventAttendee[]
  location?: string
  meetingUrl?: string
  status?: "confirmed" | "tentative" | "cancelled"
  iCalUID?: string
}

/**
 * Parameters for creating a calendar event
 */
export interface CreateCalendarEventParams {
  calendarId: string
  title: string
  description?: string
  startTime: Date
  endTime: Date
  timezone: string
  attendees?: CalendarEventAttendee[]
  location?: string
  sendUpdates?: boolean
}

/**
 * Parameters for updating a calendar event
 */
export interface UpdateCalendarEventParams {
  calendarId: string
  eventId: string
  title?: string
  description?: string
  startTime?: Date
  endTime?: Date
  timezone?: string
  attendees?: CalendarEventAttendee[]
  location?: string
  sendUpdates?: boolean
}

/**
 * Busy time block from a calendar
 */
export interface BusyTimeBlock {
  start: Date
  end: Date
}

/**
 * Parameters for fetching busy times
 */
export interface GetBusyTimesParams {
  calendarId: string
  startDate: Date
  endDate: Date
  timezone?: string
}

/**
 * OAuth URL generation parameters
 */
export interface OAuthUrlParams {
  redirectUri: string
  state?: string
  scopes?: string[]
}

/**
 * OAuth token exchange parameters
 */
export interface OAuthTokenParams {
  code: string
  redirectUri: string
}

/**
 * OAuth token refresh parameters
 */
export interface RefreshTokenParams {
  refreshToken: string
}

/**
 * Calendar list item
 */
export interface CalendarListItem {
  id: string
  name: string
  description?: string
  isPrimary?: boolean
  accessRole?: string
  backgroundColor?: string
}

/**
 * Common interface for all calendar providers
 */
export interface ICalendarProvider {
  /**
   * Generate OAuth authorization URL
   */
  getOAuthUrl(params: OAuthUrlParams): Promise<string>

  /**
   * Exchange OAuth code for tokens
   */
  exchangeCodeForTokens(params: OAuthTokenParams): Promise<OAuthCredentials>

  /**
   * Refresh access token using refresh token
   */
  refreshAccessToken(params: RefreshTokenParams): Promise<OAuthCredentials>

  /**
   * Get list of calendars for the user
   */
  listCalendars(credentials: OAuthCredentials): Promise<CalendarListItem[]>

  /**
   * Get busy times (events) from calendar
   */
  getBusyTimes(
    credentials: OAuthCredentials,
    params: GetBusyTimesParams
  ): Promise<BusyTimeBlock[]>

  /**
   * Create a new calendar event
   */
  createEvent(
    credentials: OAuthCredentials,
    params: CreateCalendarEventParams
  ): Promise<CalendarEvent>

  /**
   * Update an existing calendar event
   */
  updateEvent(
    credentials: OAuthCredentials,
    params: UpdateCalendarEventParams
  ): Promise<CalendarEvent>

  /**
   * Delete a calendar event
   */
  deleteEvent(
    credentials: OAuthCredentials,
    calendarId: string,
    eventId: string,
    sendUpdates?: boolean
  ): Promise<void>

  /**
   * Get a single calendar event
   */
  getEvent(
    credentials: OAuthCredentials,
    calendarId: string,
    eventId: string
  ): Promise<CalendarEvent | null>

  /**
   * Revoke OAuth token (disconnect from provider)
   * Some providers (like Microsoft) don't support this - they should log and return.
   */
  revokeToken(token: string): Promise<void>
}

/**
 * Error types for calendar operations
 */
export class CalendarError extends Error {
  constructor(
    message: string,
    public code:
      | "UNAUTHORIZED"
      | "NOT_FOUND"
      | "CONFLICT"
      | "RATE_LIMIT"
      | "PROVIDER_ERROR"
      | "INVALID_CREDENTIALS"
      | "TOKEN_EXPIRED",
    public originalError?: unknown
  ) {
    super(message)
    this.name = "CalendarError"
  }
}
