import { auth } from "@workspace/auth"
import createApp from "@/lib/misc/create-app"
import configureOpenAPI from "@/lib/openapi/configure-openapi"
import index from "@/routes/index.route"

const app = createApp()

configureOpenAPI(app)

const routes = [index]

routes.forEach((route) => app.route("/", route))

app.get("/test", (c) => {
  c.var.logger.warn("Hello Hono!")
  return c.text("Hello Hono!")
})

//handle all better-auth routes
app.on(["POST", "GET"], "/api/auth/**", (c) => auth.handler(c.req.raw))

app.get("/docs/auth", async (c) => {
  const openAPIAuth = await auth.api.generateOpenAPISchema()
  return c.json(openAPIAuth)
})

export default app
