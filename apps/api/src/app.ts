import { auth } from "@workspace/auth"
import createApp from "@/lib/misc/create-app"
import configureOpenAPI from "./lib/openapi/configure-openapi"

const app = createApp()

configureOpenAPI(app)

app.get("/", (c) => {
  c.var.logger.warn("Hello Hono!")
  return c.text("Hello Hono!")
})

//handle all better-auth routes
app.on(["POST", "GET"], "/api/auth/**", (c) => auth.handler(c.req.raw))

export default app
