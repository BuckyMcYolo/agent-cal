import { auth } from "@workspace/auth"
import { and, db, eq } from "@workspace/db"
import { apikey, member } from "@workspace/db/schema/auth"
import { serverEnv } from "@workspace/env-config/server"
import type { Context, Next } from "hono"
import * as HttpStatusCodes from "@/lib/misc/http-status-codes"
import type { AppBindings, AuthMethod } from "@/lib/types/app-types"

/**
 * Middleware that authenticates requests using Better Auth.
 * Supports both API key (prefixed with 'agentcal_') and session token authentication.
 *
 * Sets in context:
 * - user: The authenticated user
 * - session: The session object
 * - organization: The active organization
 * - member: The user's membership in the organization
 * - authMethod: How the user authenticated (api_key or session)
 */
export const authMiddleware = async (c: Context<AppBindings>, next: Next) => {
  try {
    const headers = c.req.raw.headers
    const apiKeyHeader = headers.get("x-api-key")
    const isApiKey = apiKeyHeader?.startsWith("agentcal_")
    const method = c.req.method

    // ============================================================
    // PATH 1: API KEY AUTHENTICATION
    // ============================================================
    if (isApiKey && apiKeyHeader) {
      if (serverEnv.NODE_ENV === "development") {
        console.log("[Auth] Authenticating via API key")
      }

      // Verify the API key permissions
      const requiredPermissions =
        method === "GET" || method === "OPTIONS" ? ["read"] : ["read", "write"]

      const {
        valid,
        error,
        key: apiKeyRecord,
      } = await auth.api.verifyApiKey({
        body: {
          key: apiKeyHeader,
          permissions: { all: requiredPermissions },
        },
      })

      if (!valid || !apiKeyRecord) {
        return c.json(
          { success: false, message: error?.message ?? "Invalid API key" },
          error?.code === "RATE_LIMITED"
            ? HttpStatusCodes.TOO_MANY_REQUESTS
            : HttpStatusCodes.UNAUTHORIZED
        )
      }

      // Fetch the full API key record with user and organization
      const fullApiKeyRecord = await db.query.apikey.findFirst({
        where: eq(apikey.id, apiKeyRecord.id),
        with: {
          user: true,
          organization: true,
        },
      })

      if (!fullApiKeyRecord) {
        return c.json(
          { success: false, message: "API key record not found" },
          HttpStatusCodes.UNAUTHORIZED
        )
      }

      if (!fullApiKeyRecord.user) {
        return c.json(
          { success: false, message: "API key user not found" },
          HttpStatusCodes.UNAUTHORIZED
        )
      }

      if (!fullApiKeyRecord.organization) {
        return c.json(
          {
            success: false,
            message: "API key is not associated with an organization",
          },
          HttpStatusCodes.UNAUTHORIZED
        )
      }

      // Get the member record to determine role in this organization
      const memberRecord = await db.query.member.findFirst({
        where: and(
          eq(member.userId, fullApiKeyRecord.user.id),
          eq(member.organizationId, fullApiKeyRecord.organization.id)
        ),
      })

      if (!memberRecord) {
        return c.json(
          {
            success: false,
            message: "API key user is not a member of the organization",
          },
          HttpStatusCodes.FORBIDDEN
        )
      }

      // Set context for API key authentication
      const authMethod: AuthMethod = {
        type: "api_key",
        apiKeyId: apiKeyRecord.id,
      }

      c.set("user", fullApiKeyRecord.user)
      c.set("session", null)
      c.set("organization", fullApiKeyRecord.organization)
      c.set("member", memberRecord)
      c.set("authMethod", authMethod)

      if (serverEnv.NODE_ENV === "development") {
        console.log("[Auth] API key authentication successful", {
          userId: fullApiKeyRecord.user.id,
          orgId: fullApiKeyRecord.organization.id,
          role: memberRecord.role,
        })
      }

      await next()
      return
    }

    // ============================================================
    // PATH 2: SESSION AUTHENTICATION (user login)
    // ============================================================
    if (serverEnv.NODE_ENV === "development") {
      console.log("[Auth] Authenticating via session")
    }

    const t1 = Date.now()
    const session = await auth.api.getSession({ headers })
    console.log(`[Auth] getSession took ${Date.now() - t1}ms`)

    if (!session) {
      return c.json(
        {
          success: false,
          message:
            "Invalid authentication token. Please provide a valid token.",
        },
        HttpStatusCodes.UNAUTHORIZED
      )
    }

    // Get the active organization from the session
    const activeOrganizationId = session.session?.activeOrganizationId

    if (!activeOrganizationId) {
      return c.json(
        {
          success: false,
          message: "No active organization. Please select an organization.",
        },
        HttpStatusCodes.UNAUTHORIZED
      )
    }

    // Fetch member with organization in a single query
    const t2 = Date.now()
    const memberRecord = await db.query.member.findFirst({
      where: and(
        eq(member.userId, session.user.id),
        eq(member.organizationId, activeOrganizationId)
      ),
      with: {
        organization: true,
      },
    })
    console.log(`[Auth] member+org query took ${Date.now() - t2}ms`)

    if (!memberRecord) {
      return c.json(
        {
          success: false,
          message: "You are not a member of the selected organization",
        },
        HttpStatusCodes.FORBIDDEN
      )
    }

    const org = memberRecord.organization
    if (!org) {
      return c.json(
        { success: false, message: "Organization not found" },
        HttpStatusCodes.UNAUTHORIZED
      )
    }

    // Set context for session authentication
    const authMethod: AuthMethod = {
      type: "session",
      sessionId: session.session.id,
    }

    c.set("user", session.user)
    c.set("session", session.session)
    c.set("organization", org)
    c.set("member", memberRecord)
    c.set("authMethod", authMethod)

    if (serverEnv.NODE_ENV === "development") {
      console.log("[Auth] Session authentication successful", {
        userId: session.user.id,
        orgId: org.id,
        role: memberRecord.role,
      })
    }

    await next()
  } catch (error) {
    c.var.logger?.error({ err: error }, "Authentication error")
    return c.json(
      {
        success: false,
        message: "Authentication failed",
      },
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    )
  }
}
