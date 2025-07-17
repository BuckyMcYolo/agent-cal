import { and, db, eq } from "@workspace/db"
import type { AppRouteHandler } from "@/lib/types/app-types"
import { tasks } from "@workspace/db/schema/tasks"
import * as HttpStatusCodes from "@/lib/misc/http-status-codes"
import * as HttpStatusPhrases from "@/lib/misc/http-status-phrases"
import { availabilitySchedule } from "@workspace/db/schema/availability"
import { getUserOrgbyUserId } from "@/lib/queries/users"
import type { ListAvailabilityRoute } from "./routes"

export const listAvailability: AppRouteHandler<ListAvailabilityRoute> = async (
  c
) => {
  const { orgId, userId } = c.req.valid("query")
  const availabilitySchedules = await db.query.eventType.findMany({
    where: (eventType, operators) => {
      const filters = []
      if (orgId) {
        filters.push(operators.eq(eventType.organizationId, orgId))
      }
      if (userId) {
        filters.push(operators.eq(eventType.ownerId, userId))
      }
      return operators.and(...filters)
    },
  })
  // If no event types found, return an empty array instead of error
  if (!availabilitySchedules || availabilitySchedules.length === 0) {
    return c.json([], HttpStatusCodes.OK)
  }
  return c.json(availabilitySchedules, HttpStatusCodes.OK)
}
