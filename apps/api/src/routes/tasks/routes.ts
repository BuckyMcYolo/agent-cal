import jsonContent from "@/lib/helpers/openapi/schemas/json-content"
import { createRoute, z } from "@hono/zod-openapi"
import {
  insertTasksSchema,
  selectTasksSchema,
  tasks,
} from "@workspace/db/schema/tasks"
import * as HttpStatusCodes from "@/lib/misc/http-status-codes"
import jsonContentRequired from "@/lib/helpers/openapi/schemas/json-content-required"
import type { AppRouteHandler } from "@/lib/types/app-types"
import { db } from "@workspace/db"
import { zodSchemaToOpenAPI } from "@/lib/helpers/openapi/drizzle-zod-to-openapi"

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
      schema: zodSchemaToOpenAPI(insertTasksSchema),
      description: "The created task",
    }),
  },
})

export const createTask: AppRouteHandler<CreateRoute> = async (c) => {
  console.log(JSON.stringify(insertTasksSchema.shape, null, 2))

  const task = c.req.valid("json")
  const [inserted] = await db.insert(tasks).values(task).returning()
  return c.json(inserted, HttpStatusCodes.OK)
}

export type ListRoute = typeof list
export type CreateRoute = typeof create
