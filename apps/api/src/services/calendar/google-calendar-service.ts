import {
  GoogleCalendarClient,
  type OAuthCredentials,
} from "@workspace/calendar-integrations"
import { db, eq } from "@workspace/db"
import { calendarConnection } from "@workspace/db/schema/calendar-connection"
import { serverEnv } from "@workspace/env-config/server"

class GoogleCalendarService {
  private client: GoogleCalendarClient | null = null

  getClient(): GoogleCalendarClient {
    if (!this.client) {
      this.client = new GoogleCalendarClient({
        clientId: serverEnv.GOOGLE_CLIENT_ID,
        clientSecret: serverEnv.GOOGLE_CLIENT_SECRET,
      })
    }
    return this.client
  }

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

export const googleCalendarService = new GoogleCalendarService()
