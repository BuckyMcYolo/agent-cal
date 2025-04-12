import { createAuthClient } from "better-auth/react"
import {
  adminClient,
  organizationClient,
  apiKeyClient,
  emailOTPClient,
} from "better-auth/client/plugins"
import { clientEnv } from "@workspace/env-config"

export const authClient = createAuthClient({
  plugins: [
    adminClient(),
    organizationClient(),
    apiKeyClient(),
    emailOTPClient(),
  ],
  baseURL: clientEnv.NEXT_PUBLIC_API_URL,
})
