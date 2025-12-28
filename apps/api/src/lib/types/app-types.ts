import type { OpenAPIHono, RouteConfig, RouteHandler } from "@hono/zod-openapi"
import type { Session, User } from "@workspace/auth"
import type { member, organization } from "@workspace/db/schema/better-auth-schema"
import type { Schema } from "hono"
import type { PinoLogger } from "hono-pino"

// Infer types from schema
export type Organization = typeof organization.$inferSelect
export type Member = typeof member.$inferSelect

// Auth method discriminator - tells you HOW the user authenticated
export type AuthMethod =
  | { type: "session"; sessionId: string }
  | { type: "api_key"; apiKeyId: string }

export interface AppBindings {
  Variables: {
    logger: PinoLogger
    user?: User | null
    session?: Session | null
    organization?: Organization | null
    member?: Member | null
    authMethod?: AuthMethod
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
