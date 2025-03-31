import { auth } from "@workspace/auth"
import createApp from "@/lib/helpers/app/create-app"
import configureOpenAPI from "@/lib/openapi/configure-openapi"
import index from "@/routes/index.route"
import tasksRouter from "./routes/tasks"
import { cors } from "hono/cors"
import env from "@workspace/env-config/index"
import generateOpenAPI from "./lib/openapi/generate-open-api-doc"

const app = createApp()

app.use(
  "*",
  cors({
    origin: "*",
    allowMethods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  })
)

configureOpenAPI(app)

const routes = [index, tasksRouter] as const

//handle all better-auth routes
app.on(["POST", "GET"], "/api/auth/**", (c) => auth.handler(c.req.raw))

app.get("/docs/auth", async (c) => {
  const openAPIAuth = await auth.api.generateOpenAPISchema()
  return c.json(openAPIAuth)
})

routes.forEach((route) => app.route("/", route))

app.get("/mint", async (c) => {
  generateOpenAPI(app)
  return c.json({ message: "OpenAPI docs generated" })
})

export default app
