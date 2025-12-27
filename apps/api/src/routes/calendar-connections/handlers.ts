import { and, db, eq } from "@workspace/db"
import { business } from "@workspace/db/schema/business"
import { businessUser } from "@workspace/db/schema/business-user"
import { calendarConnection } from "@workspace/db/schema/calendar-connection"
import { serverEnv } from "@workspace/env-config/server"
import {
  createOAuthStateToken,
  verifyOAuthStateToken,
} from "@/lib/helpers/oauth/state-token"
import * as HttpStatusCodes from "@/lib/misc/http-status-codes"
import { googleCalendarService } from "@/services/calendar/google-calendar-service"
import type { AppRouteHandler } from "@/lib/types/app-types"
import type {
  DeleteConnectionRoute,
  GetConnectionRoute,
  GetGoogleOAuthUrlRoute,
  HandleGoogleOAuthCallbackRoute,
  ListCalendarsRoute,
  ListConnectionsRoute,
  UpdateConnectionCalendarRoute,
} from "./routes"

type BusinessUserAccessError = {
  error: string
  status: typeof HttpStatusCodes.NOT_FOUND
}

type BusinessUserAccessSuccess = {
  businessRecord: typeof business.$inferSelect
  userRecord: typeof businessUser.$inferSelect
}

/**
 * Helper to verify businessUser belongs to the caller's organization
 */
async function verifyBusinessUserAccess(
  organizationId: string,
  businessId: string,
  userId: string
): Promise<BusinessUserAccessError | BusinessUserAccessSuccess> {
  // First verify the business belongs to the organization
  const businessRecord = await db.query.business.findFirst({
    where: and(
      eq(business.id, businessId),
      eq(business.organizationId, organizationId)
    ),
  })

  if (!businessRecord) {
    return { error: "Business not found", status: HttpStatusCodes.NOT_FOUND }
  }

  // Then verify the user belongs to that business
  const userRecord = await db.query.businessUser.findFirst({
    where: and(
      eq(businessUser.id, userId),
      eq(businessUser.businessId, businessId)
    ),
  })

  if (!userRecord) {
    return { error: "User not found", status: HttpStatusCodes.NOT_FOUND }
  }

  return { businessRecord, userRecord }
}

// ============================================================================
// OAuth Handlers
// ============================================================================

export const getGoogleOAuthUrl: AppRouteHandler<
  GetGoogleOAuthUrlRoute
> = async (c) => {
  try {
    const { businessId, userId } = c.req.valid("param")
    const { redirectUri } = c.req.valid("query")
    const org = c.var.organization

    if (!org) {
      return c.json(
        { success: false, message: "Organization context required" },
        HttpStatusCodes.FORBIDDEN
      )
    }

    // Verify access
    const access = await verifyBusinessUserAccess(org.id, businessId, userId)
    if ("error" in access) {
      return c.json(
        { success: false, message: access.error },
        access.status as 404
      )
    }

    // Create state token with businessUserId
    const state = createOAuthStateToken(userId, redirectUri)

    // Build the callback URL
    const callbackUrl = `${serverEnv.API_URL}/v1/oauth/google/callback`

    // Get OAuth URL from Google
    const client = googleCalendarService.getClient()
    const url = await client.getOAuthUrl({
      redirectUri: callbackUrl,
      state,
    })

    return c.json({ url }, HttpStatusCodes.OK)
  } catch (error) {
    console.error("[Get Google OAuth URL] Error:", error)
    return c.json(
      { success: false, message: "Failed to generate OAuth URL" },
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    )
  }
}

export const handleGoogleOAuthCallback: AppRouteHandler<
  HandleGoogleOAuthCallbackRoute
> = async (c) => {
  try {
    const { code, state, error: oauthError } = c.req.valid("query")

    // Handle OAuth errors from Google
    if (oauthError) {
      return c.json(
        { success: false, message: `OAuth error: ${oauthError}` },
        HttpStatusCodes.BAD_REQUEST
      )
    }

    // Verify and decode state token
    let statePayload: ReturnType<typeof verifyOAuthStateToken>
    try {
      statePayload = verifyOAuthStateToken(state)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Invalid state token"
      return c.json({ success: false, message }, HttpStatusCodes.BAD_REQUEST)
    }

    const { businessUserId, redirectUri } = statePayload

    // Verify the business user exists
    const userRecord = await db.query.businessUser.findFirst({
      where: eq(businessUser.id, businessUserId),
    })

    if (!userRecord) {
      return c.json(
        { success: false, message: "Business user not found" },
        HttpStatusCodes.BAD_REQUEST
      )
    }

    // Exchange code for tokens
    const client = googleCalendarService.getClient()
    const callbackUrl = `${serverEnv.API_URL}/v1/oauth/google/callback`

    const credentials = await client.exchangeCodeForTokens({
      code,
      redirectUri: callbackUrl,
    })

    // Get list of calendars and find the primary one
    const calendars = await client.listCalendars(credentials)
    const primaryCalendar = calendars.find((cal) => cal.isPrimary)
    const calendarId = primaryCalendar?.id ?? "primary"

    // Check if connection already exists for this provider/email
    const existingConnection = await db.query.calendarConnection.findFirst({
      where: and(
        eq(calendarConnection.businessUserId, businessUserId),
        eq(calendarConnection.provider, "google"),
        eq(calendarConnection.email, credentials.email)
      ),
    })

    let connection: typeof calendarConnection.$inferSelect | undefined
    if (existingConnection) {
      // Update existing connection
      const [updated] = await db
        .update(calendarConnection)
        .set({
          accessToken: credentials.accessToken,
          refreshToken: credentials.refreshToken ?? existingConnection.refreshToken,
          tokenExpiresAt: credentials.expiresAt ?? null,
          providerAccountId: credentials.providerAccountId ?? null,
          calendarId,
          updatedAt: new Date(),
        })
        .where(eq(calendarConnection.id, existingConnection.id))
        .returning()

      connection = updated
    } else {
      // Create new connection
      const [created] = await db
        .insert(calendarConnection)
        .values({
          businessUserId,
          provider: "google",
          providerAccountId: credentials.providerAccountId ?? null,
          email: credentials.email,
          accessToken: credentials.accessToken,
          refreshToken: credentials.refreshToken ?? null,
          tokenExpiresAt: credentials.expiresAt ?? null,
          calendarId,
        })
        .returning()

      connection = created
    }

    if (!connection) {
      return c.json(
        { success: false, message: "Failed to save calendar connection" },
        HttpStatusCodes.INTERNAL_SERVER_ERROR
      )
    }

    // Return JSON response (omit sensitive fields)
    // If redirectUri was provided, client should handle redirect
    return c.json(
      {
        success: true,
        message: "Calendar connected successfully",
        connection: {
          id: connection.id,
          createdAt: connection.createdAt,
          updatedAt: connection.updatedAt,
          businessUserId: connection.businessUserId,
          provider: connection.provider,
          providerAccountId: connection.providerAccountId,
          email: connection.email,
          tokenExpiresAt: connection.tokenExpiresAt,
          calendarId: connection.calendarId,
        },
      },
      HttpStatusCodes.OK
    )
  } catch (error) {
    console.error("[Google OAuth Callback] Error:", error)
    return c.json(
      { success: false, message: "Failed to complete OAuth flow" },
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    )
  }
}

// ============================================================================
// Connection Management Handlers
// ============================================================================

export const listConnections: AppRouteHandler<ListConnectionsRoute> = async (
  c
) => {
  try {
    const { businessId, userId } = c.req.valid("param")
    const org = c.var.organization

    if (!org) {
      return c.json(
        { success: false, message: "Organization context required" },
        HttpStatusCodes.FORBIDDEN
      )
    }

    // Verify access
    const access = await verifyBusinessUserAccess(org.id, businessId, userId)
    if ("error" in access) {
      return c.json(
        { success: false, message: access.error },
        access.status as 404
      )
    }

    // Get all connections for this user (excluding sensitive fields)
    const connections = await db
      .select({
        id: calendarConnection.id,
        createdAt: calendarConnection.createdAt,
        updatedAt: calendarConnection.updatedAt,
        businessUserId: calendarConnection.businessUserId,
        provider: calendarConnection.provider,
        providerAccountId: calendarConnection.providerAccountId,
        email: calendarConnection.email,
        tokenExpiresAt: calendarConnection.tokenExpiresAt,
        calendarId: calendarConnection.calendarId,
      })
      .from(calendarConnection)
      .where(eq(calendarConnection.businessUserId, userId))

    return c.json({ data: connections }, HttpStatusCodes.OK)
  } catch (error) {
    console.error("[List Connections] Error:", error)
    return c.json(
      { success: false, message: "Failed to list connections" },
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    )
  }
}

export const getConnection: AppRouteHandler<GetConnectionRoute> = async (c) => {
  try {
    const { businessId, userId, connectionId } = c.req.valid("param")
    const org = c.var.organization

    if (!org) {
      return c.json(
        { success: false, message: "Organization context required" },
        HttpStatusCodes.FORBIDDEN
      )
    }

    // Verify access
    const access = await verifyBusinessUserAccess(org.id, businessId, userId)
    if ("error" in access) {
      return c.json(
        { success: false, message: access.error },
        access.status as 404
      )
    }

    // Get the connection
    const connection = await db.query.calendarConnection.findFirst({
      where: and(
        eq(calendarConnection.id, connectionId),
        eq(calendarConnection.businessUserId, userId)
      ),
      columns: {
        accessToken: false,
        refreshToken: false,
      },
    })

    if (!connection) {
      return c.json(
        { success: false, message: "Connection not found" },
        HttpStatusCodes.NOT_FOUND
      )
    }

    return c.json(connection, HttpStatusCodes.OK)
  } catch (error) {
    console.error("[Get Connection] Error:", error)
    return c.json(
      { success: false, message: "Failed to get connection" },
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    )
  }
}

export const deleteConnection: AppRouteHandler<DeleteConnectionRoute> = async (
  c
) => {
  try {
    const { businessId, userId, connectionId } = c.req.valid("param")
    const org = c.var.organization

    if (!org) {
      return c.json(
        { success: false, message: "Organization context required" },
        HttpStatusCodes.FORBIDDEN
      )
    }

    // Verify access
    const access = await verifyBusinessUserAccess(org.id, businessId, userId)
    if ("error" in access) {
      return c.json(
        { success: false, message: access.error },
        access.status as 404
      )
    }

    // Verify connection exists and belongs to user
    const connection = await db.query.calendarConnection.findFirst({
      where: and(
        eq(calendarConnection.id, connectionId),
        eq(calendarConnection.businessUserId, userId)
      ),
    })

    if (!connection) {
      return c.json(
        { success: false, message: "Connection not found" },
        HttpStatusCodes.NOT_FOUND
      )
    }

    // Revoke token at Google (best effort - don't fail if this errors)
    if (connection.accessToken) {
      const client = googleCalendarService.getClient()
      await client.revokeToken(connection.accessToken)
    }

    // Delete the connection from DB
    await db
      .delete(calendarConnection)
      .where(eq(calendarConnection.id, connectionId))

    return c.json(
      { success: true, message: "Connection deleted and token revoked" },
      HttpStatusCodes.OK
    )
  } catch (error) {
    console.error("[Delete Connection] Error:", error)
    return c.json(
      { success: false, message: "Failed to delete connection" },
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    )
  }
}

export const listCalendars: AppRouteHandler<ListCalendarsRoute> = async (c) => {
  try {
    const { businessId, userId, connectionId } = c.req.valid("param")
    const org = c.var.organization

    if (!org) {
      return c.json(
        { success: false, message: "Organization context required" },
        HttpStatusCodes.FORBIDDEN
      )
    }

    // Verify access
    const access = await verifyBusinessUserAccess(org.id, businessId, userId)
    if ("error" in access) {
      return c.json(
        { success: false, message: access.error },
        access.status as 404
      )
    }

    // Get the connection with tokens
    const connection = await db.query.calendarConnection.findFirst({
      where: and(
        eq(calendarConnection.id, connectionId),
        eq(calendarConnection.businessUserId, userId)
      ),
    })

    if (!connection) {
      return c.json(
        { success: false, message: "Connection not found" },
        HttpStatusCodes.NOT_FOUND
      )
    }

    // Get credentials (refreshing if needed)
    const credentials = await googleCalendarService.getCredentialsWithRefresh(connection)

    // List calendars
    const client = googleCalendarService.getClient()
    const calendars = await client.listCalendars(credentials)

    return c.json({ data: calendars }, HttpStatusCodes.OK)
  } catch (error) {
    console.error("[List Calendars] Error:", error)
    return c.json(
      { success: false, message: "Failed to list calendars" },
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    )
  }
}

export const updateConnectionCalendar: AppRouteHandler<
  UpdateConnectionCalendarRoute
> = async (c) => {
  try {
    const { businessId, userId, connectionId } = c.req.valid("param")
    const { calendarId } = c.req.valid("json")
    const org = c.var.organization

    if (!org) {
      return c.json(
        { success: false, message: "Organization context required" },
        HttpStatusCodes.FORBIDDEN
      )
    }

    // Verify access
    const access = await verifyBusinessUserAccess(org.id, businessId, userId)
    if ("error" in access) {
      return c.json(
        { success: false, message: access.error },
        access.status as 404
      )
    }

    // Verify connection exists and belongs to user
    const connection = await db.query.calendarConnection.findFirst({
      where: and(
        eq(calendarConnection.id, connectionId),
        eq(calendarConnection.businessUserId, userId)
      ),
    })

    if (!connection) {
      return c.json(
        { success: false, message: "Connection not found" },
        HttpStatusCodes.NOT_FOUND
      )
    }

    // Update the calendar ID
    const [updated] = await db
      .update(calendarConnection)
      .set({ calendarId, updatedAt: new Date() })
      .where(eq(calendarConnection.id, connectionId))
      .returning({
        id: calendarConnection.id,
        createdAt: calendarConnection.createdAt,
        updatedAt: calendarConnection.updatedAt,
        businessUserId: calendarConnection.businessUserId,
        provider: calendarConnection.provider,
        providerAccountId: calendarConnection.providerAccountId,
        email: calendarConnection.email,
        tokenExpiresAt: calendarConnection.tokenExpiresAt,
        calendarId: calendarConnection.calendarId,
      })

    return c.json(updated, HttpStatusCodes.OK)
  } catch (error) {
    console.error("[Update Connection Calendar] Error:", error)
    return c.json(
      { success: false, message: "Failed to update connection" },
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    )
  }
}
