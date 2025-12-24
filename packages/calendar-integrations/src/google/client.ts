import { google, type calendar_v3 } from "googleapis"
import type {
  BusyTimeBlock,
  CalendarError,
  CalendarEvent,
  CalendarEventAttendee,
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
import { CalendarError as CalendarErrorClass } from "../types"

export interface GoogleCalendarConfig {
  clientId: string
  clientSecret: string
  redirectUri?: string
}

export class GoogleCalendarClient implements ICalendarProvider {
  private oauth2Client: InstanceType<typeof google.auth.OAuth2>

  constructor(private config: GoogleCalendarConfig) {
    this.oauth2Client = new google.auth.OAuth2(
      config.clientId,
      config.clientSecret,
      config.redirectUri
    )
  }

  /**
   * Generate OAuth authorization URL
   */
  async getOAuthUrl(params: OAuthUrlParams): Promise<string> {
    const scopes = params.scopes || [
      "https://www.googleapis.com/auth/calendar",
      "https://www.googleapis.com/auth/calendar.events",
      "https://www.googleapis.com/auth/userinfo.email",
    ]

    const url = this.oauth2Client.generateAuthUrl({
      access_type: "offline", // Required for refresh token
      scope: scopes,
      state: params.state,
      redirect_uri: params.redirectUri || this.config.redirectUri,
      prompt: "consent", // Force consent screen to get refresh token
    })

    return url
  }

  /**
   * Exchange OAuth code for tokens
   */
  async exchangeCodeForTokens(
    params: OAuthTokenParams
  ): Promise<OAuthCredentials> {
    try {
      // Create a new client with the specific redirect URI if provided
      const client = params.redirectUri
        ? new google.auth.OAuth2(
            this.config.clientId,
            this.config.clientSecret,
            params.redirectUri
          )
        : this.oauth2Client

      const { tokens } = await client.getToken(params.code)

      if (!tokens.access_token) {
        throw new CalendarErrorClass(
          "No access token received from Google",
          "PROVIDER_ERROR"
        )
      }

      // Set credentials to fetch user info
      client.setCredentials(tokens)

      // Get user email
      const oauth2 = google.oauth2({ version: "v2", auth: client })
      const userInfo = await oauth2.userinfo.get()

      return {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token || undefined,
        expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : undefined,
        email: userInfo.data.email || "",
        providerAccountId: userInfo.data.id || undefined,
      }
    } catch (error) {
      throw this.handleError(error, "Failed to exchange code for tokens")
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(
    params: RefreshTokenParams
  ): Promise<OAuthCredentials> {
    try {
      this.oauth2Client.setCredentials({
        refresh_token: params.refreshToken,
      })

      const { credentials } = await this.oauth2Client.refreshAccessToken()

      if (!credentials.access_token) {
        throw new CalendarErrorClass(
          "No access token received from refresh",
          "PROVIDER_ERROR"
        )
      }

      // Get user email (cached in most cases)
      const oauth2 = google.oauth2({ version: "v2", auth: this.oauth2Client })
      const userInfo = await oauth2.userinfo.get()

      return {
        accessToken: credentials.access_token,
        refreshToken: credentials.refresh_token || params.refreshToken,
        expiresAt: credentials.expiry_date
          ? new Date(credentials.expiry_date)
          : undefined,
        email: userInfo.data.email || "",
        providerAccountId: userInfo.data.id || undefined,
      }
    } catch (error) {
      throw this.handleError(error, "Failed to refresh access token")
    }
  }

  /**
   * Get list of calendars for the user
   */
  async listCalendars(
    credentials: OAuthCredentials
  ): Promise<CalendarListItem[]> {
    try {
      const auth = this.getAuthClient(credentials)
      const calendar = google.calendar({ version: "v3", auth })

      const response = await calendar.calendarList.list()

      return (response.data.items || []).map((item) => ({
        id: item.id || "",
        name: item.summary || "",
        description: item.description || undefined,
        isPrimary: item.primary || undefined,
        accessRole: item.accessRole || undefined,
        backgroundColor: item.backgroundColor || undefined,
      }))
    } catch (error) {
      throw this.handleError(error, "Failed to list calendars")
    }
  }

  /**
   * Get busy times (events) from calendar
   */
  async getBusyTimes(
    credentials: OAuthCredentials,
    params: GetBusyTimesParams
  ): Promise<BusyTimeBlock[]> {
    try {
      const auth = this.getAuthClient(credentials)
      const calendar = google.calendar({ version: "v3", auth })

      const response = await calendar.freebusy.query({
        requestBody: {
          timeMin: params.startDate.toISOString(),
          timeMax: params.endDate.toISOString(),
          timeZone: params.timezone || "UTC",
          items: [{ id: params.calendarId }],
        },
      })

      const busyBlocks =
        response.data.calendars?.[params.calendarId]?.busy || []

      return busyBlocks.map((block) => ({
        start: new Date(block.start || ""),
        end: new Date(block.end || ""),
      }))
    } catch (error) {
      throw this.handleError(error, "Failed to get busy times")
    }
  }

  /**
   * Create a new calendar event
   */
  async createEvent(
    credentials: OAuthCredentials,
    params: CreateCalendarEventParams
  ): Promise<CalendarEvent> {
    try {
      const auth = this.getAuthClient(credentials)
      const calendar = google.calendar({ version: "v3", auth })

      const response = await calendar.events.insert({
        calendarId: params.calendarId,
        sendUpdates: params.sendUpdates ? "all" : "none",
        requestBody: {
          summary: params.title,
          description: params.description,
          start: {
            dateTime: params.startTime.toISOString(),
            timeZone: params.timezone,
          },
          end: {
            dateTime: params.endTime.toISOString(),
            timeZone: params.timezone,
          },
          attendees: params.attendees?.map((attendee) => ({
            email: attendee.email,
            displayName: attendee.name,
          })),
          location: params.location,
        },
      })

      return this.mapToCalendarEvent(response.data, params.calendarId)
    } catch (error) {
      throw this.handleError(error, "Failed to create event")
    }
  }

  /**
   * Update an existing calendar event
   */
  async updateEvent(
    credentials: OAuthCredentials,
    params: UpdateCalendarEventParams
  ): Promise<CalendarEvent> {
    try {
      const auth = this.getAuthClient(credentials)
      const calendar = google.calendar({ version: "v3", auth })

      const updateData: Record<string, unknown> = {}

      if (params.title !== undefined) updateData.summary = params.title
      if (params.description !== undefined)
        updateData.description = params.description
      if (params.location !== undefined) updateData.location = params.location

      if (params.startTime && params.timezone) {
        updateData.start = {
          dateTime: params.startTime.toISOString(),
          timeZone: params.timezone,
        }
      }

      if (params.endTime && params.timezone) {
        updateData.end = {
          dateTime: params.endTime.toISOString(),
          timeZone: params.timezone,
        }
      }

      if (params.attendees) {
        updateData.attendees = params.attendees.map((attendee) => ({
          email: attendee.email,
          displayName: attendee.name,
        }))
      }

      const response = await calendar.events.patch({
        calendarId: params.calendarId,
        eventId: params.eventId,
        sendUpdates: params.sendUpdates ? "all" : "none",
        requestBody: updateData,
      })

      return this.mapToCalendarEvent(response.data, params.calendarId)
    } catch (error) {
      throw this.handleError(error, "Failed to update event")
    }
  }

  /**
   * Delete a calendar event
   */
  async deleteEvent(
    credentials: OAuthCredentials,
    calendarId: string,
    eventId: string,
    sendUpdates = false
  ): Promise<void> {
    try {
      const auth = this.getAuthClient(credentials)
      const calendar = google.calendar({ version: "v3", auth })

      await calendar.events.delete({
        calendarId,
        eventId,
        sendUpdates: sendUpdates ? "all" : "none",
      })
    } catch (error) {
      throw this.handleError(error, "Failed to delete event")
    }
  }

  /**
   * Get a single calendar event
   */
  async getEvent(
    credentials: OAuthCredentials,
    calendarId: string,
    eventId: string
  ): Promise<CalendarEvent | null> {
    try {
      const auth = this.getAuthClient(credentials)
      const calendar = google.calendar({ version: "v3", auth })

      const response = await calendar.events.get({
        calendarId,
        eventId,
      })

      return this.mapToCalendarEvent(response.data, calendarId)
    } catch (error) {
      if (this.isNotFoundError(error)) {
        return null
      }
      throw this.handleError(error, "Failed to get event")
    }
  }

  /**
   * Helper: Create authenticated client
   */
  private getAuthClient(credentials: OAuthCredentials) {
    const client = new google.auth.OAuth2(
      this.config.clientId,
      this.config.clientSecret,
      this.config.redirectUri
    )

    client.setCredentials({
      access_token: credentials.accessToken,
      refresh_token: credentials.refreshToken,
      expiry_date: credentials.expiresAt?.getTime(),
    })

    return client
  }

  /**
   * Helper: Map Google Calendar event to our CalendarEvent type
   */
  private mapToCalendarEvent(
    event: calendar_v3.Schema$Event,
    calendarId: string
  ): CalendarEvent {
    const attendees: CalendarEventAttendee[] = (event.attendees || []).map(
      (attendee) => ({
        email: attendee.email || "",
        name: attendee.displayName || undefined,
        responseStatus: attendee.responseStatus as
          | "accepted"
          | "declined"
          | "tentative"
          | "needsAction"
          | undefined,
      })
    )

    return {
      id: event.id || "",
      calendarId,
      title: event.summary || "",
      description: event.description || undefined,
      startTime: new Date(event.start?.dateTime || event.start?.date || ""),
      endTime: new Date(event.end?.dateTime || event.end?.date || ""),
      timezone: event.start?.timeZone || "UTC",
      attendees,
      location: event.location || undefined,
      meetingUrl: event.hangoutLink || undefined,
      status: event.status as "confirmed" | "tentative" | "cancelled" | undefined,
      iCalUID: event.iCalUID || undefined,
    }
  }

  /**
   * Helper: Check if error is 404 Not Found
   */
  private isNotFoundError(error: unknown): boolean {
    return (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === 404
    )
  }

  /**
   * Helper: Handle and transform errors
   */
  private handleError(error: unknown, message: string): CalendarError {
    if (error instanceof CalendarErrorClass) {
      return error
    }

    // Handle Google API errors
    if (typeof error === "object" && error !== null && "code" in error) {
      const code = (error as { code?: number }).code

      if (code === 401 || code === 403) {
        return new CalendarErrorClass(
          `${message}: Unauthorized`,
          "UNAUTHORIZED",
          error
        )
      }

      if (code === 404) {
        return new CalendarErrorClass(
          `${message}: Not found`,
          "NOT_FOUND",
          error
        )
      }

      if (code === 409) {
        return new CalendarErrorClass(
          `${message}: Conflict`,
          "CONFLICT",
          error
        )
      }

      if (code === 429) {
        return new CalendarErrorClass(
          `${message}: Rate limit exceeded`,
          "RATE_LIMIT",
          error
        )
      }
    }

    return new CalendarErrorClass(message, "PROVIDER_ERROR", error)
  }
}
