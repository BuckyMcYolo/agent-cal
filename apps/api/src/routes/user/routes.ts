import { authMiddleware } from "@/middleware/bearer-auth-middleware"
import { createRoute, z } from "@hono/zod-openapi"
import * as HttpStatusCodes from "@/lib/misc/http-status-codes"
import jsonContent from "@/lib/helpers/openapi/schemas/json-content"
import { unauthorizedSchema } from "@/lib/helpers/openapi/schemas/error/unauthorized-schema"
import { selectUserPreferences } from "@workspace/db/schema/user-preferences"
import { notFoundSchema } from "@/lib/helpers/openapi/schemas/error/not-found-schema"
import type { User } from "@workspace/auth"

const UserPreferencesWithUserSchema = z.object({
  ...selectUserPreferences.shape,
  user: z.custom<User>(),
})

export const getUserPreferences = createRoute({
  path: "/my-preferences",
  method: "get",
  summary: "Get a user's preferences",
  hide: true,
  middleware: [authMiddleware] as const,
  responses: {
    [HttpStatusCodes.OK]: jsonContent({
      schema: UserPreferencesWithUserSchema,
      description: "User preferences",
    }),
    [HttpStatusCodes.UNAUTHORIZED]: unauthorizedSchema,
    [HttpStatusCodes.NOT_FOUND]: jsonContent({
      schema: notFoundSchema,
      description: "User preferences not found",
    }),
  },
})
export type GetUserPreferencesRoute = typeof getUserPreferences
