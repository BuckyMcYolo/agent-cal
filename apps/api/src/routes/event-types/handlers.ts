import { db, eq } from "@workspace/db"
import type { AppRouteHandler } from "@/lib/types/app-types"
import { tasks } from "@workspace/db/schema/tasks"
import * as HttpStatusCodes from "@/lib/misc/http-status-codes"
import * as HttpStatusPhrases from "@/lib/misc/http-status-phrases"
import type { ListEventsTypesRoute } from "./routes"

export const listEventTypes: AppRouteHandler<ListEventsTypesRoute> = async (
  c
) => {
  const { orgId, slug, userId } = c.req.valid("query")
  const eventTypes = await db.query.eventType.findMany({
    where: (eventType, operators) => {
      const filters = []
      if (orgId) {
        filters.push(operators.eq(eventType.organizationId, orgId))
      }
      if (slug) {
        filters.push(operators.eq(eventType.slug, slug))
      }
      if (userId) {
        filters.push(operators.eq(eventType.ownerId, userId))
      }
      return operators.and(...filters)
    },
  })
  // If no event types found, return an empty array instead of error
  if (!eventTypes || eventTypes.length === 0) {
    return c.json([], HttpStatusCodes.OK)
  }
  return c.json(eventTypes, HttpStatusCodes.OK)
}
