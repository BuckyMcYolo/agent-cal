import jsonContent from "@/lib/helpers/openapi/schemas/json-content"
import { createRoute, z } from "@hono/zod-openapi"
import {
  insertTasksSchema,
  selectTasksSchema,
  tasks,
  updateTasksSchema,
} from "@workspace/db/schema/tasks"
import * as HttpStatusCodes from "@/lib/misc/http-status-codes"
import jsonContentRequired from "@/lib/helpers/openapi/schemas/json-content-required"
import type { AppRouteHandler } from "@/lib/types/app-types"
import { db } from "@workspace/db"
import { zodSchemaToOpenAPI } from "@/lib/helpers/openapi/drizzle-zod-to-openapi"
import createErrorSchema from "@/lib/helpers/openapi/schemas/create-error-schema"
import IdParamsSchema from "@/lib/helpers/openapi/schemas/id-params"
import UUIDParamsSchema from "@/lib/helpers/openapi/schemas/uuid-params"
import { notFoundSchema } from "@/lib/helpers/openapi/schemas/not-found"

const tags = ["Tasks"]

export const list = createRoute({
  path: "/tasks",
  method: "get",
  summary: "Get all tasks",
  description:
    "This is a test description because I would like to see how it looks in the OpenAPI documentation. This should be a longer description to test how it handles larger text and whether it wraps correctly in the generated docs.",
  tags,
  responses: {
    [HttpStatusCodes.OK]: jsonContent({
      schema: z.array(selectTasksSchema),
      description: "List of tasks",
    }),
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
  },
})

export const getOne = createRoute({
  path: "/tasks/{id}",
  summary: "Get a task by ID",
  method: "get",
  request: {
    params: UUIDParamsSchema,
  },
  tags,
  responses: {
    [HttpStatusCodes.OK]: jsonContent({
      schema: selectTasksSchema,
      description: "List of tasks",
    }),
    [HttpStatusCodes.NOT_FOUND]: jsonContent({
      schema: notFoundSchema,
      description: "Task not found",
    }),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent({
      schema: createErrorSchema(UUIDParamsSchema),
      description: "Invalid UUID error",
    }),
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
  tags,
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
  },
})

export const remove = createRoute({
  path: "/tasks/{id}",
  summary: "Delete a task",
  method: "delete",
  description: "Delete a task by ID",
  request: {
    params: UUIDParamsSchema,
    headers: z.object({
      Authorization: z.string().openapi({
        description: "Authorization token",
      }),
    }),
  },
  tags,
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
  },
})

export type ListRoute = typeof list
export type CreateRoute = typeof create
export type GetOneRoute = typeof getOne
export type PatchRoute = typeof patch
export type RemoveRoute = typeof remove
