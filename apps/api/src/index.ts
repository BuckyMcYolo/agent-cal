import { serve } from "@hono/node-server"
import { serverEnv } from "@workspace/env-config"
import app from "@/app"

const port = serverEnv.PORT || 8080

serve(
  {
    fetch: app.fetch,
    port: port,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`)
  }
)
