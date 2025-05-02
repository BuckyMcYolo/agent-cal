// src/lib/better-auth-middleware.ts
import type { Context, Next } from "hono"
import { auth } from "@workspace/auth"
import * as HttpStatusCodes from "@/lib/misc/http-status-codes"
import type { AppBindings } from "@/lib/types/app-types"
import serverEnv from "@workspace/env-config/server-env"

/**
 * Middleware that authenticates requests using Better Auth.
 * The headers can be either an API key (prefixed with 'agentcal_') or a user session token .
 */
export const authMiddleware = async (c: Context<AppBindings>, next: Next) => {
  try {
    const headers = c.req.raw.headers
    // Better Auth automatically will create a session from an API Key so there is no need to do it manually
    // we will get the auth type tho so we can do other things later (like rate limiting/ subtract credits based on if its an api key or user token etc...)

    const session = await auth.api.getSession({ headers })
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

    const isApiKey = headers.get("x-api-key")?.startsWith("agentcal_")
    const method = c.req.method
    const apiKey = headers.get("x-api-key")

    if (serverEnv.NODE_ENV === "development") {
      console.log("Session:", session)
      console.log("Request Method:", method)
      console.log("Is API Key:", isApiKey)
    }

    // Check if the API key is valid
    if (isApiKey) {
      const requiredPermissions =
        method === "GET" || method === "OPTIONS" ? ["read"] : ["read", "write"]

      const { valid, error } = await auth.api.verifyApiKey({
        body: {
          key: apiKey ?? "",
          permissions: { all: requiredPermissions },
        },
      })

      if (!valid) {
        return c.json(
          { success: false, message: error?.message },
          error?.code === "RATE_LIMITED"
            ? HttpStatusCodes.TOO_MANY_REQUESTS
            : HttpStatusCodes.UNAUTHORIZED
        )
      }
    }

    // Store user info in context
    c.set("user", session.user)
    c.set("session", session.session)
    c.set("authMethod", isApiKey ? "api-key" : "user-token")

    await next()
  } catch (error) {
    c.var.logger.error("Authentication error:", error)
    return c.json(
      {
        success: false,
        message: "Authentication failed",
      },
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    )
  }
}
