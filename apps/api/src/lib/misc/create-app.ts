import { OpenAPIHono } from "@hono/zod-openapi"
import { pinoLoggerMiddleware } from "@/middleware/pino-logger"
import type { Schema } from "hono"
import type { AppBindings, AppOpenAPI } from "@/lib/types/app-types"
import defaultHook from "./default-hook"
import onError from "@/middleware/on-error"
import notFound from "@/middleware/not-found"
import { requestId } from "hono/request-id"

export function createRouter() {
  return new OpenAPIHono<AppBindings>({
    strict: false,
    defaultHook,
  })
}

export default function createApp() {
  const app = createRouter()
  app.use(requestId()).use(pinoLoggerMiddleware())

  app.notFound(notFound)
  app.onError(onError)
  return app
}

export function createTestApp<S extends Schema>(router: AppOpenAPI<S>) {
  return createApp().route("/", router)
}
