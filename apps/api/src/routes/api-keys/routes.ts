import jsonContent from "@/lib/helpers/openapi/schemas/json-content"
import { authMiddleware } from "@/middleware/bearer-auth-middleware"
import { createRoute, z } from "@hono/zod-openapi"
import * as HttpStatusCodes from "@/lib/misc/http-status-codes"
import { unauthorizedSchema } from "@/lib/helpers/openapi/schemas/error/unauthorized-schema"
import jsonContentRequired from "@/lib/helpers/openapi/schemas/json-content-required"
import { auth } from "@workspace/auth"

export const createKey = createRoute({
  path: "/api-keys",
  method: "post",
  summary: "Create API Key with permissions",
  middleware: [authMiddleware] as const,
  hide: true,
  request: {
    body: jsonContentRequired({
      schema: z.object({
        name: z.string().min(1).max(255),
        // [read, write]
        permissions: z.array(z.enum(["read", "write"])).optional(),
        expiresIn: z
          .number()
          .min(1)
          .max(1000 * 60 * 60 * 24 * 365) // 1 year
          .optional(),
      }),
      description: "The task to create",
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent({
      schema: z.object({
        id: z.string(),
        name: z.string(),
        key: z.string(),
        permissions: z.object({
          all: z.array(z.enum(["read", "write"])).optional(),
        }),
      }),
      description: "List of tasks",
    }),
    [HttpStatusCodes.UNAUTHORIZED]: unauthorizedSchema,
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent({
      schema: z.object({
        error: z.string(),
      }),
      description: "Internal server error",
    }),
  },
})

export type CreateKeyRoute = typeof createKey
