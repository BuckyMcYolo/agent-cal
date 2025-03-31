import { db } from "@workspace/db"
import type { CreateRoute, ListRoute } from "./routes"
import type { AppRouteHandler } from "@/lib/types/app-types"
import { insertTasksSchema, tasks } from "@workspace/db/schema/tasks"
import * as HttpStatusCodes from "@/lib/misc/http-status-codes"

export const list: AppRouteHandler<ListRoute> = async (c) => {
  const tasks = await db.query.tasks.findMany()
  return c.json(tasks)
}

export const create: AppRouteHandler<CreateRoute> = async (c) => {
  const body = await c.req.json()
  const task = insertTasksSchema.parse(body)
  const [inserted] = await db.insert(tasks).values(task).returning()
  return c.json(inserted, HttpStatusCodes.OK)
}
