import {
  MicrosoftCalendarClient,
  type OAuthCredentials,
} from "@workspace/calendar-integrations"
import { db, eq } from "@workspace/db"
import { calendarConnection } from "@workspace/db/schema/calendar-connection"
import { serverEnv } from "@workspace/env-config/server"

/**
 * Microsoft Calendar Service
 *
 * Mirrors the structure of GoogleCalendarService.
 * Currently disabled - enable by setting MICROSOFT_CLIENT_ID and MICROSOFT_CLIENT_SECRET.
 */
class MicrosoftCalendarService {
  private client: MicrosoftCalendarClient | null = null

  /**
   * Check if Microsoft integration is enabled
   */
  isEnabled(): boolean {
    return Boolean(
      serverEnv.MICROSOFT_CLIENT_ID && serverEnv.MICROSOFT_CLIENT_SECRET
    )
  }

  /**
   * Get the Microsoft Calendar client (lazy initialization)
   */
  getClient(): MicrosoftCalendarClient {
    if (!this.isEnabled()) {
      throw new Error(
        "Microsoft Calendar integration not configured. Set MICROSOFT_CLIENT_ID and MICROSOFT_CLIENT_SECRET."
      )
    }

    if (!serverEnv.MICROSOFT_CLIENT_ID || !serverEnv.MICROSOFT_CLIENT_SECRET) {
      throw new Error(
        "Microsoft Calendar integration not configured. Set MICROSOFT_CLIENT_ID and MICROSOFT_CLIENT_SECRET."
      )
    }

    if (!this.client) {
      this.client = new MicrosoftCalendarClient({
        clientId: serverEnv.MICROSOFT_CLIENT_ID,
        clientSecret: serverEnv.MICROSOFT_CLIENT_SECRET,
        tenantId: serverEnv.MICROSOFT_TENANT_ID,
      })
    }
    return this.client
  }

  /**
   * Get OAuth credentials from a calendar connection, refreshing if expired.
   * Updates the database with new tokens if refreshed.
   */
  async getCredentialsWithRefresh(
    connection: typeof calendarConnection.$inferSelect
  ): Promise<OAuthCredentials> {
    const now = new Date()
    const bufferMs = 5 * 60 * 1000 // 5 minutes buffer

    // Check if token is expired or about to expire
    const isExpired =
      connection.tokenExpiresAt &&
      connection.tokenExpiresAt.getTime() - bufferMs < now.getTime()

    if (!isExpired) {
      // Token is still valid, return current credentials
      return {
        accessToken: connection.accessToken,
        refreshToken: connection.refreshToken ?? undefined,
        expiresAt: connection.tokenExpiresAt ?? undefined,
        email: connection.email,
        providerAccountId: connection.providerAccountId ?? undefined,
      }
    }

    // Token expired, need to refresh
    if (!connection.refreshToken) {
      throw new Error(
        "Cannot refresh token: no refresh token stored for this connection"
      )
    }

    const client = this.getClient()
    const refreshed = await client.refreshAccessToken({
      refreshToken: connection.refreshToken,
    })

    // Update the database with new tokens
    await db
      .update(calendarConnection)
      .set({
        accessToken: refreshed.accessToken,
        refreshToken: refreshed.refreshToken ?? connection.refreshToken,
        tokenExpiresAt: refreshed.expiresAt ?? null,
        updatedAt: new Date(),
      })
      .where(eq(calendarConnection.id, connection.id))

    return refreshed
  }
}

export const microsoftCalendarService = new MicrosoftCalendarService()
