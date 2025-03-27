import { OpenAPIHono } from "@hono/zod-openapi"
import { pinoLoggerMiddleware } from "@/middleware/pino-logger"
import env from "@/env"
import type { AppBindings } from "@/lib/types/app-types"

function createApp() {
  const app = new OpenAPIHono<AppBindings>({
    strict: false,
  })

  app.use(pinoLoggerMiddleware())

  //not found JSON handler
  app.notFound((c) => {
    return c.json(
      {
        message: `Not Found - ${c.req.path}`,
      },
      404
    )
  })
  //default error handler
  app.onError((err, c) => {
    const currentStatus =
      "status" in err ? (err.status as number) : c.newResponse(null).status
    const statusCode = currentStatus !== 200 ? currentStatus : 500
    return c.json(
      {
        message: err.message,
        stack: env.NODE_ENV === "production" ? undefined : err.stack,
      },
      statusCode as 404 | 500
    )
  })
  return app
}

export default createApp
