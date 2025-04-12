import type { PinoLogger } from "hono-pino"
import type { RouteConfig, RouteHandler, OpenAPIHono } from "@hono/zod-openapi"
import type { Schema } from "hono"
import type { Session, User } from "@workspace/auth"

export interface AppBindings {
  Variables: {
    logger: PinoLogger
    user?: User | null
    session?: Session | null
    authMethod?: "api-key" | "user-token"
  }
}
export type AppOpenAPI<S extends Schema = {}> = OpenAPIHono<AppBindings, S>

export type AppRouteHandler<R extends RouteConfig> = RouteHandler<
  R,
  AppBindings
>
