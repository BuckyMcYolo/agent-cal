import { serverEnv } from "@workspace/env-config/server"
import { pinoLogger } from "hono-pino"
import pino from "pino"
import pretty from "pino-pretty"

export function pinoLoggerMiddleware() {
  return pinoLogger({
    pino: pino(
      {
        level: serverEnv.LOG_LEVEL || "info",
      },
      serverEnv.NODE_ENV === "production" ? undefined : pretty()
    ),
    http: {
      reqId: () => crypto.randomUUID(),
    },
  })
}
