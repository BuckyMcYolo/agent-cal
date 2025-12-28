import { createRoute, z } from "@hono/zod-openapi"
import { selectApiKeySchema } from "@workspace/db/schema/better-auth-schema"
import { forbiddenSchema } from "@/lib/helpers/openapi/schemas/error/forbidden-schema"
import { internalServerErrorSchema } from "@/lib/helpers/openapi/schemas/error/internal-server-error-schema"
import { notFoundSchema } from "@/lib/helpers/openapi/schemas/error/not-found-schema"
import { unauthorizedSchema } from "@/lib/helpers/openapi/schemas/error/unauthorized-schema"
import jsonContent from "@/lib/helpers/openapi/schemas/json-content"
import jsonContentRequired from "@/lib/helpers/openapi/schemas/json-content-required"
import IdStringParamsSchema from "@/lib/helpers/openapi/schemas/params/id-string-params"
import { paginationSchema } from "@/lib/helpers/openapi/schemas/response/pagination-schema"
import * as HttpStatusCodes from "@/lib/misc/http-status-codes"
import { authMiddleware } from "@/middleware/auth-middleware"

// Schema for API key with optional user info (who created it)
const ApiKeyWithUserSchema = z.object({
  ...selectApiKeySchema.shape,
  user: z
    .object({
      id: z.string(),
      name: z.string(),
      email: z.string(),
    })
    .nullable(),
})

export const listKeys = createRoute({
  path: "/api-keys",
  method: "get",
  summary: "List API Keys for the organization",
  description: "Returns all API keys owned by the organization.",
  middleware: [authMiddleware] as const,
  hide: true,
  request: {
    query: z.object({
      page: z
        .string()
        .optional()
        .transform((val) => (val ? Number.parseInt(val, 10) : undefined)),
      perPage: z
        .string()
        .optional()
        .transform((val) => (val ? Number.parseInt(val, 10) : undefined)),
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent({
      schema: paginationSchema(ApiKeyWithUserSchema),
      description: "List of API keys",
    }),
    [HttpStatusCodes.FORBIDDEN]: jsonContent({
      schema: forbiddenSchema,
      description: "User does not belong to an organization",
    }),
    [HttpStatusCodes.UNAUTHORIZED]: unauthorizedSchema,
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: internalServerErrorSchema,
  },
})

export const getKey = createRoute({
  path: "/api-keys/{id}",
  method: "get",
  summary: "Get an API key by ID",
  middleware: [authMiddleware] as const,
  hide: true,
  request: {
    params: IdStringParamsSchema,
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent({
      schema: ApiKeyWithUserSchema,
      description: "The API key",
    }),
    [HttpStatusCodes.UNAUTHORIZED]: unauthorizedSchema,
    [HttpStatusCodes.FORBIDDEN]: jsonContent({
      schema: forbiddenSchema,
      description: "User does not belong to an organization",
    }),
    [HttpStatusCodes.NOT_FOUND]: jsonContent({
      schema: notFoundSchema,
      description: "API key not found",
    }),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: internalServerErrorSchema,
  },
})

export const createKey = createRoute({
  path: "/api-keys",
  method: "post",
  summary: "Create an API key for the organization",
  description:
    "Creates a new API key owned by the organization. The creating user is tracked for auditing.",
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
      description: "The API key to create",
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent({
      schema: z.object({
        id: z.string(),
        name: z.string().nullable(),
        key: z.string(), // Only returned on creation
        createdAt: z.coerce.date(),
        updatedAt: z.coerce.date(),
        enabled: z.boolean().nullable(),
        permissions: z.string().nullable(),
        expiresAt: z.coerce.date().nullable(),
      }),
      description: "The created API key (includes the key value)",
    }),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent({
      schema: z.object({
        success: z.boolean(),
        message: z.string(),
      }),
      description: "API key name must be unique",
    }),
    [HttpStatusCodes.UNAUTHORIZED]: unauthorizedSchema,
    [HttpStatusCodes.FORBIDDEN]: jsonContent({
      schema: forbiddenSchema,
      description: "User does not belong to an organization",
    }),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: internalServerErrorSchema,
  },
})

export const updateKey = createRoute({
  path: "/api-keys/{id}",
  method: "patch",
  summary: "Update an API key",
  middleware: [authMiddleware] as const,
  hide: true,
  request: {
    params: IdStringParamsSchema,
    body: jsonContentRequired({
      schema: z.object({
        name: z.string().min(1).max(255).optional(),
        permissions: z.array(z.enum(["read", "write"])).optional(),
        enabled: z.boolean().optional(),
      }),
      description: "The fields to update",
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
    [HttpStatusCodes.FORBIDDEN]: jsonContent({
      schema: forbiddenSchema,
      description: "User does not belong to an organization",
    }),
    [HttpStatusCodes.NOT_FOUND]: jsonContent({
      schema: notFoundSchema,
      description: "API key not found",
    }),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: internalServerErrorSchema,
  },
})

export const deleteKey = createRoute({
  path: "/api-keys/{id}",
  method: "delete",
  summary: "Delete an API key",
  middleware: [authMiddleware] as const,
  hide: true,
  request: {
    params: IdStringParamsSchema,
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent({
      schema: z.object({
        success: z.boolean(),
        message: z.string(),
      }),
      description: "API key deleted successfully",
    }),
    [HttpStatusCodes.UNAUTHORIZED]: unauthorizedSchema,
    [HttpStatusCodes.FORBIDDEN]: jsonContent({
      schema: forbiddenSchema,
      description: "User does not belong to an organization",
    }),
    [HttpStatusCodes.NOT_FOUND]: jsonContent({
      schema: notFoundSchema,
      description: "API key not found",
    }),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: internalServerErrorSchema,
  },
})

export type ListKeysRoute = typeof listKeys
export type GetKeyRoute = typeof getKey
export type CreateKeyRoute = typeof createKey
export type UpdateKeyRoute = typeof updateKey
export type DeleteKeyRoute = typeof deleteKey
