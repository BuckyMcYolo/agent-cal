import { createHmac, randomBytes } from "node:crypto"
import { serverEnv } from "@workspace/env-config/server"

/**
 * OAuth state token payload
 */
export interface OAuthStatePayload {
  businessUserId: string
  redirectUri?: string
  nonce: string
  expiresAt: number
}

const STATE_TOKEN_EXPIRY_MS = 10 * 60 * 1000 // 10 minutes

/**
 * Create a signed OAuth state token for CSRF protection.
 * The token encodes the businessUserId and optional redirect URI.
 */
export function createOAuthStateToken(
  businessUserId: string,
  redirectUri?: string
): string {
  const payload: OAuthStatePayload = {
    businessUserId,
    redirectUri,
    nonce: randomBytes(16).toString("hex"),
    expiresAt: Date.now() + STATE_TOKEN_EXPIRY_MS,
  }

  const payloadStr = Buffer.from(JSON.stringify(payload)).toString("base64url")
  const signature = sign(payloadStr)

  return `${payloadStr}.${signature}`
}

/**
 * Verify and decode an OAuth state token.
 * Returns the payload if valid, throws if invalid or expired.
 */
export function verifyOAuthStateToken(token: string): OAuthStatePayload {
  const parts = token.split(".")
  if (parts.length !== 2) {
    throw new Error("Invalid state token format")
  }

  const [payloadStr, signature] = parts as [string, string]

  // Verify signature
  const expectedSignature = sign(payloadStr)
  if (signature !== expectedSignature) {
    throw new Error("Invalid state token signature")
  }

  // Decode payload
  let payload: OAuthStatePayload
  try {
    payload = JSON.parse(Buffer.from(payloadStr, "base64url").toString("utf-8"))
  } catch {
    throw new Error("Invalid state token payload")
  }

  // Check expiry
  if (Date.now() > payload.expiresAt) {
    throw new Error("State token has expired")
  }

  return payload
}

/**
 * Create HMAC signature using BETTER_AUTH_SECRET
 */
function sign(data: string): string {
  return createHmac("sha256", serverEnv.BETTER_AUTH_SECRET)
    .update(data)
    .digest("base64url")
}
