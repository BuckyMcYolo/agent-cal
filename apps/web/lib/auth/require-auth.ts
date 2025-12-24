import { authClient } from "@workspace/auth/client"
import { redirect } from "next/navigation"

/**
 * Gets the current session, optionally refreshing from the database.
 * For use in Server Components only.
 */
export async function getSession(refreshCookie?: boolean) {
  const response = await authClient.getSession({
    query: {
      disableCookieCache: refreshCookie,
    },
  })
  return response.data
}

/**
 * Requires authentication for SSR pages.
 * Redirects to /sign-in if no valid session exists.
 * For use in Server Components only.
 *
 * @param refreshCookie - Force refresh session from database (default: false)
 * @returns The authenticated session with user and session data
 */
export async function requireAuth(refreshCookie?: boolean) {
  const session = await getSession(refreshCookie)

  if (!session?.user) {
    redirect("/sign-in")
  }

  return session
}
