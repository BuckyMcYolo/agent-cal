import { auth } from "@workspace/auth"
import createApp from "@/lib/helpers/app/create-app"
import configureOpenAPI from "@/lib/helpers/openapi/configure-openapi"
import index from "@/routes/index.route"
import tasksRouter from "./routes/tasks"
import { cors } from "hono/cors"
import serverEnv from "@workspace/env-config/server-env"
import apiKeysRouter from "./routes/api-keys"
import eventTypesRouter from "./routes/event-types"
import onboardingRouter from "./routes/onboarding"
import userPreferencesRouter from "./routes/user"
import availabilityRouter from "./routes/availability"

const app = createApp()

console.log("Server Environment:", serverEnv.NODE_ENV)

app.use(
  "*",
  cors({
    origin:
      serverEnv.NODE_ENV === "production"
        ? "*"
        : [
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://localhost:5000",
          ],
    allowHeaders: ["Content-Type", "Authorization", "x-api-key", "Accept"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    exposeHeaders: ["content-length", "keep-alive", "connection"],
    // Cache preflight for performance (in seconds)
    maxAge: 600,
    credentials: true,
  })
)

configureOpenAPI(app)

const routes = [
  index,
  tasksRouter,
  apiKeysRouter,
  eventTypesRouter,
  onboardingRouter,
  userPreferencesRouter,
  availabilityRouter,
] as const

routes.forEach((route) => app.route("/", route))

app.get("/docs/auth", async (c) => {
  const openAPIAuth = await auth.api.generateOpenAPISchema()
  return c.json(openAPIAuth)
})

app.on(["POST", "GET"], "/api/auth/*", (c) => {
  return auth.handler(c.req.raw)
})

export type AppType = (typeof routes)[number]

export default app
