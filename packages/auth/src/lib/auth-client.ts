import { createAuthClient } from "better-auth/react"
import {
  adminClient,
  organizationClient,
  apiKeyClient,
  emailOTPClient,
  inferAdditionalFields,
} from "better-auth/client/plugins"
import { clientEnv } from "@workspace/env-config"
import { auth } from "./auth"

export const authClient = createAuthClient({
  plugins: [
    adminClient(),
    organizationClient(),
    apiKeyClient(),
    emailOTPClient(),
    inferAdditionalFields<typeof auth>(),
  ],
  baseURL: clientEnv.NEXT_PUBLIC_API_URL,
  fetchOptions: {
    customFetchImpl: async (input: RequestInfo | URL, init?: RequestInit) => {
      const isServer = typeof window === "undefined"

      if (isServer) {
        //@ts-ignore
        const { cookies } = await import("next/headers")
        const cookieStore = await cookies()
        const allCookies = cookieStore.getAll()
        const cookieHeader: string = allCookies
          .map(
            (cookie: { name: string; value: string }) =>
              `${cookie.name}=${cookie.value}`
          )
          .join("; ")

        return fetch(input, {
          ...init,
          headers: {
            ...init?.headers,
            Cookie: cookieHeader,
          },
        })
      }

      return fetch(input, {
        ...init,
        credentials: "include",
      })
    },
  },
})
