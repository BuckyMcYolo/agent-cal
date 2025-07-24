import { and, db, eq } from "@workspace/db"
import type { AppRouteHandler } from "@/lib/types/app-types"
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
import { dayToInteger } from "@/lib/time/conversions"
import { validateTimeSlots } from "@/lib/time/timeslot-overlap"

export const listAvailability: AppRouteHandler<ListAvailabilityRoute> = async (
  c
) => {
  const { returnOrg } = c.req.valid("query")

  try {
    const user = c.var.user

    if (!user) {
      return c.json(
        { success: false, message: "User not authenticated" },
        HttpStatusCodes.UNAUTHORIZED
      )
    }
    const userOrg = await getUserOrgbyUserId(user.id)

    if (!userOrg) {
      return c.json(
        { success: false, message: "Organization not found" },
        HttpStatusCodes.BAD_REQUEST
      )
    }

    const availabilitySchedules = await db.query.availabilitySchedule.findMany({
      where: (eventType, operators) => {
        const filters = []
        if (returnOrg && user.role === "admin") {
          filters.push(operators.eq(eventType.organizationId, userOrg?.id))
        } else {
          filters.push(operators.eq(eventType.ownerId, user.id))
        }
        return operators.and(...filters)
      },
      with: {
        weeklySlots: true,
      },
    })
    // If no event types found, return an empty array instead of error
    if (!availabilitySchedules || availabilitySchedules.length === 0) {
      return c.json([], HttpStatusCodes.OK)
    }

    console.log("Returning availability schedules:", availabilitySchedules)

    return c.json(availabilitySchedules, HttpStatusCodes.OK)
  } catch (error) {
    console.error("Error fetching availability schedules:", error)
    return c.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      },
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    )
  }
}

export const postAvailability: AppRouteHandler<PostAvailabilityRoute> = async (
  c
) => {
  const { name, timeSlots } = c.req.valid("json")
  try {
    const user = c.var.user

    if (!user) {
      return c.json(
        { success: false, message: "User not authenticated" },
        HttpStatusCodes.UNAUTHORIZED
      )
    }

    // Validate time slots for overlaps
    const validation = validateTimeSlots(timeSlots)
    if (!validation.isValid) {
      return c.json(
        {
          success: false,
          message: validation.error || "Invalid time slots",
        },
        HttpStatusCodes.BAD_REQUEST
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

    for (const slot of timeSlots) {
      const dayInt = dayToInteger(slot.dayOfWeek)
      if (dayInt === undefined) {
        throw new Error(`Invalid day of week: ${slot.dayOfWeek}`)
      }
      await db.insert(weeklyScheduleSlot).values({
        scheduleId: newSchedule.id,
        dayOfWeek: dayInt,
        startTime: slot.startTime,
        endTime: slot.endTime,
      })
    }

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
