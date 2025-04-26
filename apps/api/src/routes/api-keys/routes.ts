import jsonContent from "@/lib/helpers/openapi/schemas/json-content"
import { authMiddleware } from "@/middleware/bearer-auth-middleware"
import { createRoute, z } from "@hono/zod-openapi"
import * as HttpStatusCodes from "@/lib/misc/http-status-codes"
import { unauthorizedSchema } from "@/lib/helpers/openapi/schemas/error/unauthorized-schema"
import jsonContentRequired from "@/lib/helpers/openapi/schemas/json-content-required"
import IdStringParamsSchema from "@/lib/helpers/openapi/schemas/params/id-string-params"

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
        permissions: z.array(z.enum(["read", "write"])).optional(),
        expiresIn: z
          .number()
          .min(1)
          .max(1000 * 60 * 60 * 24 * 365) // 1 year
          .optional(),
      }),
      description: "The key to create",
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
      description: "The created API key",
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

export const updateKey = createRoute({
  path: "/api-keys/{id}",
  method: "patch",
  summary: "Update API Key with permissions",
  middleware: [authMiddleware] as const,
  hide: true,
  request: {
    params: IdStringParamsSchema,
    body: jsonContentRequired({
      schema: z.object({
        name: z.string().min(1).max(255),
        permissions: z.array(z.enum(["read", "write"])).optional(),
      }),
      description: "The key to update",
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent({
      schema: z.object({
        id: z.string(),
        name: z.string(),
        permissions: z.object({
          all: z.array(z.enum(["read", "write"])).optional(),
        }),
      }),
      description: "The updated API key",
    }),
    [HttpStatusCodes.UNAUTHORIZED]: unauthorizedSchema,
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent({
      schema: z.object({
        error: z.string(),
      }),
      description: "Internal server error",
    }),
    [HttpStatusCodes.NOT_FOUND]: jsonContent({
      schema: z.object({
        error: z.string(),
      }),
      description: "API key not found",
    }),
    [HttpStatusCodes.FORBIDDEN]: jsonContent({
      schema: z.object({
        error: z.string(),
      }),
      description: "You do not have permission to update this API key",
    }),
  },
})

export type CreateKeyRoute = typeof createKey
export type UpdateKeyRoute = typeof updateKey
