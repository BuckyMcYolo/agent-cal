import type { OpenAPIHono, RouteConfig, RouteHandler } from "@hono/zod-openapi"
import type { Session, User } from "@workspace/auth"
import type { Schema } from "hono"
import type { PinoLogger } from "hono-pino"

export interface AppBindings {
  Variables: {
    logger: PinoLogger
    user?: User | null
    session?: Session | null
    authMethod?: "api-key" | "user-token"
  }
}
export type AppOpenAPI<S extends Schema = Record<string, never>> = OpenAPIHono<
  AppBindings,
  S
>

export type AppRouteHandler<R extends RouteConfig> = RouteHandler<
  R,
  AppBindings
>
