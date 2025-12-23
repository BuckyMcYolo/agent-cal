import { db, eq } from "@workspace/db"
import { tasks } from "@workspace/db/schema/tasks"
import * as HttpStatusCodes from "@/lib/misc/http-status-codes"
import * as HttpStatusPhrases from "@/lib/misc/http-status-phrases"
import type { AppRouteHandler } from "@/lib/types/app-types"
import type {
  CreateRoute,
  GetOneRoute,
  ListRoute,
  PatchRoute,
  RemoveRoute,
} from "./routes"

export const list: AppRouteHandler<ListRoute> = async (c) => {
  const tasks = await db.query.tasks.findMany()
  return c.json(tasks, HttpStatusCodes.OK)
}

export const createTask: AppRouteHandler<CreateRoute> = async (c) => {
  const task = c.req.valid("json")
  const [inserted] = await db.insert(tasks).values(task).returning()
  return c.json(inserted, HttpStatusCodes.OK)
}

export const getOne: AppRouteHandler<GetOneRoute> = async (c) => {
  const { id } = c.req.valid("param")
  const task = await db.query.tasks.findFirst({
    where(fields, operators) {
      return operators.eq(fields.id, id)
    },
  })
  if (!task) {
    return c.json(
      {
        message: HttpStatusPhrases.NOT_FOUND,
        success: false,
      },
      HttpStatusCodes.NOT_FOUND
    )
  }

  return c.json(task, HttpStatusCodes.OK)
}

export const patch: AppRouteHandler<PatchRoute> = async (c) => {
  const { id } = c.req.valid("param")
  const updates = c.req.valid("json")
  const [task] = await db
    .update(tasks)
    .set(updates)
    .where(eq(tasks.id, id))
    .returning()

  if (!task) {
    return c.json(
      {
        message: HttpStatusPhrases.NOT_FOUND,
        success: false,
      },
      HttpStatusCodes.NOT_FOUND
    )
  }

  return c.json(task, HttpStatusCodes.OK)
}

export const remove: AppRouteHandler<RemoveRoute> = async (c) => {
  const { id } = c.req.valid("param")
  const [deletedTask] = await db.delete(tasks).where(eq(tasks.id, id))
  if (!deletedTask) {
    return c.json(
      {
        message: HttpStatusPhrases.NOT_FOUND,
      },
      HttpStatusCodes.NOT_FOUND
    )
  }

  return c.body(null, HttpStatusCodes.NO_CONTENT)
}
