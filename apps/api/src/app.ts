import { auth } from "@workspace/auth"
import { serverEnv } from "@workspace/env-config/server"
import { cors } from "hono/cors"
import createApp from "@/lib/helpers/app/create-app"
import configureOpenAPI from "@/lib/helpers/openapi/configure-openapi"
import index from "@/routes/index.route"
import apiKeysRouter from "./routes/api-keys"
import availabilityRouter from "./routes/v1/availability"
import bookingsRouter from "./routes/v1/bookings"
import calendarConnectionsRouter from "./routes/v1/calendar-connections"

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

// Health check at root
app.route("/", index)

// Internal routes (not versioned)
const internalRoutes = [apiKeysRouter] as const
internalRoutes.forEach((route) => app.route("/", route))

// Versioned public API routes
const v1Routes = [
  availabilityRouter,
  bookingsRouter,
  calendarConnectionsRouter,
] as const
v1Routes.forEach((route) => app.route("/v1", route))

// All routes for frontend client types
const allRoutes = [...internalRoutes, ...v1Routes] as const

app.get("/docs/auth", async (c) => {
  const openAPIAuth = await auth.api.generateOpenAPISchema()
  return c.json(openAPIAuth)
})

app.on(["POST", "GET"], "/api/auth/*", (c) => {
  return auth.handler(c.req.raw)
})

export type AppType = (typeof allRoutes)[number]

export default app
