import { OpenAPIHono } from "@hono/zod-openapi"
import { auth } from "@workspace/auth"
import { pinoLoggerMiddleware } from "@/middleware/pino-logger"
import type { PinoLogger } from "hono-pino"
import { config } from "dotenv"
import { expand } from "dotenv-expand"
import env from "@/env"

interface AppBindings {
  Variables: {
    logger: PinoLogger
  }
}

expand(config())

const app = new OpenAPIHono<AppBindings>()

app.use(pinoLoggerMiddleware())

app.get("/", (c) => {
  c.var.logger.warn("Hello Hono!")
  return c.text("Hello Hono!")
})

//handle all better-auth routes
app.on(["POST", "GET"], "/api/auth/**", (c) => auth.handler(c.req.raw))

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

export default app
