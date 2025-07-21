import { and, db, eq } from "@workspace/db"
import type { AppRouteHandler } from "@/lib/types/app-types"
import { tasks } from "@workspace/db/schema/tasks"
import * as HttpStatusCodes from "@/lib/misc/http-status-codes"
import * as HttpStatusPhrases from "@/lib/misc/http-status-phrases"
import {
  availabilitySchedule,
  weeklyScheduleSlot,
} from "@workspace/db/schema/availability"
import {
  getUserOrgbyUserId,
  getUserPreferencesByUserId,
} from "@/lib/queries/users"
import type { ListAvailabilityRoute, PostAvailabilityRoute } from "./routes"

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

export const postAvailability: AppRouteHandler<PostAvailabilityRoute> = async (
  c
) => {
  const { name, weeklySchedule } = c.req.valid("json")
  try {
    const user = c.var.user

    if (!user) {
      return c.json(
        { success: false, message: "User not authenticated" },
        HttpStatusCodes.UNAUTHORIZED
      )
    }

    const userOrg = await getUserOrgbyUserId(user.id)

    const userPreferences = await getUserPreferencesByUserId(user.id)

    // Insert the new availability schedule
    const [newSchedule] = await db
      .insert(availabilitySchedule)
      .values({
        name: name,
        ownerId: user.id,
        organizationId: userOrg?.id,
        timeZone: userPreferences?.timezone || "UTC",
      })
      .returning()

    if (!newSchedule) {
      throw new Error("Failed to create availability schedule")
    }

    if (weeklySchedule.length !== 7) {
      return c.json(
        {
          success: false,
          message: "Weekly schedule must have exactly 7 days",
        },
        HttpStatusCodes.BAD_REQUEST
      )
    }

    weeklySchedule.forEach((slot) => {
      return db.insert(weeklyScheduleSlot).values({
        scheduleId: newSchedule.id,
        dayOfWeek: slot.dayOfWeek,
        startTime: slot.startTime,
        endTime: slot.endTime,
      })
    })

    return c.json(newSchedule, HttpStatusCodes.CREATED)
  } catch (error) {
    console.error("Error creating availability schedule:", error)
    return c.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      },
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    )
  }
}
