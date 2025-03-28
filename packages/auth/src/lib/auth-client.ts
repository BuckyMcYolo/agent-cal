import { createAuthClient } from "better-auth/react"
import {
  adminClient,
  organizationClient,
  apiKeyClient,
} from "better-auth/client/plugins"
import env from "@workspace/env-config"

export const authClient: ReturnType<typeof createAuthClient> = createAuthClient(
  {
    plugins: [adminClient(), organizationClient(), apiKeyClient()],
    baseURL: env.API_URL,
  }
)
