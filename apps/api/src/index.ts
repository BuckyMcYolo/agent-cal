import { serve } from "@hono/node-server"
import app from "@/app"
import env from "@/env"

const port = env.PORT || 8080

serve(
  {
    fetch: app.fetch,
    port: port,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`)
  }
)
