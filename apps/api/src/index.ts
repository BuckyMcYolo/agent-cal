import { serve } from "@hono/node-server"
import { Hono } from "hono"
import { auth } from "@workspace/auth"

const app = new Hono()

app.get("/", (c) => {
  return c.text("Hello Hono!")
})

auth.api

serve(
  {
    fetch: app.fetch,
    port: 8080,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`)
  }
)
