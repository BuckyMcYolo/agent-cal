// src/lib/better-auth-middleware.ts
import type { Context, Next } from "hono"
import { auth } from "@workspace/auth"
import * as HttpStatusCodes from "@/lib/misc/http-status-codes"
import type { AppBindings } from "@/lib/types/app-types"

/**
 * Middleware that authenticates requests using Better Auth.
 * The headers can be either an API key (prefixed with 'agentcal_') or a user access token cookie.
 */
export const authMiddleware = async (c: Context<AppBindings>, next: Next) => {
  try {
    const headers = c.req.raw.headers
    // Better Auth automatically will create a session from an API Key so there is no need to do it manually
    // we will get the auth type tho so we can do other things later (like rate limiting/ subtract credits based on if its an api key or user token)

    const session = await auth.api.getSession({ headers })

    console.log("Session:", session)

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
      HttpStatusCodes.UNAUTHORIZED
    )
  }
}
