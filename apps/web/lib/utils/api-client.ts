import { honoClient } from "@workspace/api-client"
import clientEnv from "@workspace/env-config/client-env"

const customFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const isServer = typeof window === "undefined"

  if (isServer) {
    const { cookies } = await import("next/headers")
    const cookieStore = await cookies()
    const allCookies = cookieStore.getAll()
    const cookieHeader = allCookies
      .map((cookie) => `${cookie.name}=${cookie.value}`)
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
}

export const apiClient = honoClient(clientEnv.NEXT_PUBLIC_API_URL, {
  headers: {
    "Content-Type": "application/json",
  },
  fetch: customFetch,
})
