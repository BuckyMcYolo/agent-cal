import jsonContent from "@/lib/helpers/openapi/schemas/json-content"
import { authMiddleware } from "@/middleware/bearer-auth-middleware"
import { createRoute, z } from "@hono/zod-openapi"
import * as HttpStatusCodes from "@/lib/misc/http-status-codes"
import { unauthorizedSchema } from "@/lib/helpers/openapi/schemas/error/unauthorized-schema"
import jsonContentRequired from "@/lib/helpers/openapi/schemas/json-content-required"
import IdStringParamsSchema from "@/lib/helpers/openapi/schemas/params/id-string-params"
import { selectApiKeySchema } from "@workspace/db/schema/auth"
import { notFoundSchema } from "@/lib/helpers/openapi/schemas/error/not-found-schema"
import { internalServerErrorSchema } from "@/lib/helpers/openapi/schemas/error/internal-server-error-schema"
import { forbiddenSchema } from "@/lib/helpers/openapi/schemas/error/forbidden-schema"
import { paginationSchema } from "@/lib/helpers/openapi/schemas/response/pagination-schema"

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
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: internalServerErrorSchema,
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
        enabled: z.boolean().optional(),
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
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: internalServerErrorSchema,
    [HttpStatusCodes.NOT_FOUND]: jsonContent({
      schema: notFoundSchema,
      description: "API key not found",
    }),
    [HttpStatusCodes.FORBIDDEN]: jsonContent({
      schema: forbiddenSchema,
      description: "You do not have permission to update this API key",
    }),
  },
})

export const listOrgKeys = createRoute({
  path: "/api-keys/org",
  method: "get",
  summary:
    "List API Keys for the organization. Must be an admin to make this call.",
  middleware: [authMiddleware] as const,
  hide: true,
  request: {
    query: z.object({
      page: z
        .number()
        .optional()
        .transform((val) => (val ? 10 : undefined)),
      perPage: z
        .number()
        .optional()
        .transform((val) => (val ? 10 : undefined)),
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent({
      schema: paginationSchema(selectApiKeySchema),
      description: "List of tasks",
    }),
    [HttpStatusCodes.FORBIDDEN]: jsonContent({
      schema: forbiddenSchema,
      description: "You do not have permission to make this request",
    }),
    [HttpStatusCodes.UNAUTHORIZED]: unauthorizedSchema,
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: internalServerErrorSchema,
  },
})

export type CreateKeyRoute = typeof createKey
export type UpdateKeyRoute = typeof updateKey
export type ListOrgKeysRoute = typeof listOrgKeys
