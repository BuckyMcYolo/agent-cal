import { OpenAPIHono } from "@hono/zod-openapi"

import { auth } from "@workspace/auth"
import { pinoLoggerMiddleware } from "./middleware/pino-logger"

const app = new OpenAPIHono()

app.get("/", (c) => {
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
  const env = process.env?.NODE_ENV
  return c.json(
    {
      message: err.message,
      stack: env === "production" ? undefined : err.stack,
    },
    statusCode as 404 | 500
  )
})

app.use(pinoLoggerMiddleware())

export default app
