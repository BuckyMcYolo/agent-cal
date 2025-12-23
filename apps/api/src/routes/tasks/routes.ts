import { createRoute, z } from "@hono/zod-openapi"
import {
  insertTasksSchema,
  selectTasksSchema,
  updateTasksSchema,
} from "@workspace/db/schema/tasks"
import { zodSchemaToOpenAPI } from "@/lib/helpers/openapi/drizzle-zod-to-openapi"
import createErrorSchema from "@/lib/helpers/openapi/schemas/error/create-error-schema"
import { notFoundSchema } from "@/lib/helpers/openapi/schemas/error/not-found-schema"
import { unauthorizedSchema } from "@/lib/helpers/openapi/schemas/error/unauthorized-schema"
import jsonContent from "@/lib/helpers/openapi/schemas/json-content"
import jsonContentRequired from "@/lib/helpers/openapi/schemas/json-content-required"
import UUIDParamsSchema from "@/lib/helpers/openapi/schemas/params/uuid-params"
import { apiKeySecuritySchema } from "@/lib/helpers/openapi/schemas/security-schemas"
import * as HttpStatusCodes from "@/lib/misc/http-status-codes"
import { authMiddleware } from "@/middleware/bearer-auth-middleware"

const tags = ["Tasks"]

export const list = createRoute({
  path: "/tasks",
  method: "get",
  summary: "Get all tasks",
  description:
    "This is a test description because I would like to see how it looks in the OpenAPI documentation. This should be a longer description to test how it handles larger text and whether it wraps correctly in the generated docs.",
  security: apiKeySecuritySchema,
  tags,
  middleware: [authMiddleware] as const,
  responses: {
    [HttpStatusCodes.OK]: jsonContent({
      schema: z.array(selectTasksSchema),
      description: "List of tasks",
    }),
    [HttpStatusCodes.UNAUTHORIZED]: unauthorizedSchema,
  },
})

export const create = createRoute({
  path: "/tasks",
  method: "post",
  summary: "Create a new task",
  request: {
    body: jsonContentRequired({
      schema: zodSchemaToOpenAPI(insertTasksSchema),
      description: "The task to create",
    }),
  },
  security: apiKeySecuritySchema,
  middleware: [authMiddleware] as const,
  tags,
  responses: {
    [HttpStatusCodes.OK]: jsonContent({
      schema: selectTasksSchema,
      description: "The created task",
    }),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent({
      schema: createErrorSchema(insertTasksSchema),
      description: "Validation error",
    }),
    [HttpStatusCodes.UNAUTHORIZED]: unauthorizedSchema,
  },
})

export const getOne = createRoute({
  path: "/tasks/{id}",
  summary: "Get a task by ID",
  method: "get",
  request: {
    params: UUIDParamsSchema,
  },
  security: apiKeySecuritySchema,
  tags,
  middleware: [authMiddleware] as const,
  responses: {
    [HttpStatusCodes.OK]: jsonContent({
      schema: selectTasksSchema,
      description: "The requested task",
    }),
    [HttpStatusCodes.NOT_FOUND]: jsonContent({
      schema: notFoundSchema,
      description: "Task not found",
    }),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent({
      schema: createErrorSchema(UUIDParamsSchema),
      description: "Invalid UUID error",
    }),
    [HttpStatusCodes.UNAUTHORIZED]: unauthorizedSchema,
  },
})

export const patch = createRoute({
  path: "/tasks/{id}",
  summary: "Update a task",
  method: "patch",
  request: {
    params: UUIDParamsSchema,
    body: jsonContentRequired({
      schema: zodSchemaToOpenAPI(updateTasksSchema),
      description: "The task to update",
    }),
  },
  security: apiKeySecuritySchema,
  tags,
  middleware: [authMiddleware] as const,
  responses: {
    [HttpStatusCodes.OK]: jsonContent({
      schema: selectTasksSchema,
      description: "The updated task",
    }),
    [HttpStatusCodes.NOT_FOUND]: jsonContent({
      schema: notFoundSchema,
      description: "Task not found",
    }),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent({
      schema: createErrorSchema(updateTasksSchema).or(
        createErrorSchema(UUIDParamsSchema)
      ),
      description: "Validation error",
    }),
    [HttpStatusCodes.UNAUTHORIZED]: unauthorizedSchema,
  },
})

export const remove = createRoute({
  path: "/tasks/{id}",
  summary: "Delete a task",
  method: "delete",
  description: "Delete a task by ID",
  request: {
    params: UUIDParamsSchema,
  },
  security: apiKeySecuritySchema,
  tags,
  middleware: [authMiddleware] as const,
  responses: {
    [HttpStatusCodes.NO_CONTENT]: {
      description: "Task deleted successfully",
    },
    [HttpStatusCodes.NOT_FOUND]: jsonContent({
      schema: notFoundSchema,
      description: "Task not found",
    }),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent({
      schema: createErrorSchema(UUIDParamsSchema),
      description: "Validation error",
    }),
    [HttpStatusCodes.UNAUTHORIZED]: unauthorizedSchema,
  },
})

export type ListRoute = typeof list
export type CreateRoute = typeof create
export type GetOneRoute = typeof getOne
export type PatchRoute = typeof patch
export type RemoveRoute = typeof remove
