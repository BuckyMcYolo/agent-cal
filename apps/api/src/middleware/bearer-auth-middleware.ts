// src/lib/better-auth-middleware.ts
import type { Context, Next } from "hono"
import { auth } from "@workspace/auth"
import * as HttpStatusCodes from "@/lib/misc/http-status-codes"
import type { AppBindings } from "@/lib/types/app-types"

/**
 * Extracts the bearer token from the Authorization header
 * @param headers Request headers
 * @returns The bearer token or null if not found
 */
export const extractBearerToken = (headers: Headers): string | null => {
  const authHeader = headers.get("authorization")

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null
  }

  return authHeader.substring(7).trim()
}

/**
 * Middleware that authenticates using a Bearer token.
 * The token can be either an API key (prefixed with 'booker_') or a user access token
 */
export const bearerAuthMiddleware = async (
  c: Context<AppBindings>,
  next: Next
) => {
  try {
    // Get headers from request
    const headers = c.req.raw.headers

    // Extract bearer token
    const token = extractBearerToken(headers)

    if (!token) {
      return c.json(
        {
          success: false,
          error: "Authentication required. Please provide a Bearer token.",
        },
        HttpStatusCodes.UNAUTHORIZED
      )
    }

    const isApiKey = token.startsWith("booker_")

    const authHeaders = new Headers(headers)

    if (isApiKey) {
      // If it's an API key, set it in the x-api-key header for Better Auth
      authHeaders.set("x-api-key", token)
    } else {
      // do nothing
      // If it's a user access token, don't do anything, it will automatically work using the better auth Bearer token plugin
      // See https://www.better-auth.com/docs/plugins/bearer
    }
    const session = await auth.api.getSession({ headers: authHeaders })

    if (!session) {
      return c.json(
        {
          success: false,
          error: "Invalid authentication token",
        },
        HttpStatusCodes.UNAUTHORIZED
      )
    }

    // Store user info in context
    c.set("user", session.user)
    c.set("session", session.session)
    c.set("authMethod", isApiKey ? "api-key" : "user-token")
    c.set("token", token)

    await next()
  } catch (error) {
    console.error("Authentication error:", error)
    return c.json(
      {
        success: false,
        error: "Authentication failed",
      },
      HttpStatusCodes.UNAUTHORIZED
    )
  }
}
