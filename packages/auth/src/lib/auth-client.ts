import { createAuthClient } from "better-auth/react"
import {
  adminClient,
  organizationClient,
  apiKeyClient,
  emailOTPClient,
} from "better-auth/client/plugins"
import env from "@workspace/env-config"

export const authClient: ReturnType<typeof createAuthClient> = createAuthClient(
  {
    plugins: [
      adminClient(),
      organizationClient(),
      apiKeyClient(),
      emailOTPClient(),
    ],
    baseURL: env.API_URL,
    fetchOptions: {
      onSuccess(context) {
        const authToken = context.response.headers.get("set-auth-token")
        if (authToken) {
          localStorage.setItem("auth-token", authToken)
        }
      },
      auth: {
        type: "Bearer",
        token: () => {
          const token = localStorage.getItem("auth-token")
          return token || ""
        },
      },
    },
  }
)
