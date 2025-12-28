import type {
  ICalendarProvider,
  OAuthCredentials,
} from "@workspace/calendar-integrations"
import type { calendarConnection } from "@workspace/db/schema/calendar-connection"
import { googleCalendarService } from "./google-calendar-service"
import { microsoftCalendarService } from "./microsoft-calendar-service"

export type CalendarProvider = "google" | "microsoft"

export interface CalendarService {
  isEnabled(): boolean
  getClient(): ICalendarProvider
  getCredentialsWithRefresh(
    connection: typeof calendarConnection.$inferSelect
  ): Promise<OAuthCredentials>
}

/**
 * Get the calendar service for a given provider
 */
export function getCalendarService(
  provider: CalendarProvider
): CalendarService {
  switch (provider) {
    case "google":
      return googleCalendarService
    case "microsoft":
      return microsoftCalendarService
    default:
      throw new Error(`Unknown calendar provider: ${provider}`)
  }
}

/**
 * Get the calendar service for a connection, based on its provider field
 */
export function getCalendarServiceForConnection(
  connection: typeof calendarConnection.$inferSelect
): CalendarService {
  return getCalendarService(connection.provider as CalendarProvider)
}

/**
 * Check which calendar providers are currently enabled
 */
export function getEnabledProviders(): CalendarProvider[] {
  const providers: CalendarProvider[] = []

  // Google is always enabled (required env vars)
  providers.push("google")

  // Microsoft is optional
  if (microsoftCalendarService.isEnabled()) {
    providers.push("microsoft")
  }

  return providers
}

// Re-export individual services for direct access when needed
export { googleCalendarService } from "./google-calendar-service"
export { microsoftCalendarService } from "./microsoft-calendar-service"
