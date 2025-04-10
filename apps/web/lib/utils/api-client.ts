import { honoClient } from "@workspace/api-client"
import clientEnv from "@workspace/env-config/client-env"
import { getSessionToken } from "./get-session-token"

const apiClient = honoClient(clientEnv.NEXT_PUBLIC_API_URL, {
  headers: {
    Authorization: `Bearer ${getSessionToken()}`,
  },
})

apiClient.tasks.$get
