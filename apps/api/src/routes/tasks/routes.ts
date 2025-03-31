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

export type ListRoute = typeof list
export type CreateRoute = typeof create
export type GetOneRoute = typeof getOne
export type PatchRoute = typeof patch
