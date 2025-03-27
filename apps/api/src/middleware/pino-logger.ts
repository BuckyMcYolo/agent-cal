import { pinoLogger } from "hono-pino"

export function pinoLoggerMiddleware() {
  return pinoLogger()
}
