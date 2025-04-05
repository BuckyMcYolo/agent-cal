import { OpenAPIHono } from "@hono/zod-openapi"
import { pinoLoggerMiddleware } from "@/middleware/pino-logger"
import type { Schema } from "hono"
import type { AppBindings, AppOpenAPI } from "@/lib/types/app-types"
import defaultHook from "../../misc/default-hook.js"
import onError from "@/middleware/on-error"
import notFound from "@/middleware/not-found"
import { requestId } from "hono/request-id"
import serveFavicon from "@/middleware/serve-favicon.js"

export function createRouter() {
  return new OpenAPIHono<AppBindings>({
    strict: false,
    defaultHook,
  })
}
export default function createApp() {
  const app = createRouter()
  app.use(requestId()).use(pinoLoggerMiddleware())
  app.use(serveFavicon("⚡"))
  app.notFound(notFound)
  app.onError(onError)
  return app
}

export function createTestApp<S extends Schema>(router: AppOpenAPI<S>) {
  return createApp().route("/", router)
}
