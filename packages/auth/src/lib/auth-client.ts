import { createAuthClient } from "better-auth/react"
import {
  adminClient,
  organizationClient,
  apiKeyClient,
} from "better-auth/client/plugins"

export const authClient: ReturnType<typeof createAuthClient> = createAuthClient(
  {
    plugins: [adminClient(), organizationClient(), apiKeyClient()],
    baseURL: "http://localhost:3000",
  }
)
