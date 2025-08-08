import { db, eq } from "@workspace/db"
import type { AppRouteHandler } from "@/lib/types/app-types"
import * as HttpStatusCodes from "@/lib/misc/http-status-codes"
import {
  availabilitySchedule,
  weeklyScheduleSlot,
} from "@workspace/db/schema/availability"
import {
  getUserOrgbyUserId,
  getUserPreferencesByUserId,
} from "@/lib/queries/users"
import type {
  ListAvailabilityRoute,
  GetAvailabilityRoute,
  PostAvailabilityRoute,
  UpdateAvailabilityRoute,
} from "./routes"
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

export const getAvailability: AppRouteHandler<GetAvailabilityRoute> = async (
  c
) => {
  const { id } = c.req.valid("param")

  try {
    const user = c.var.user

    if (!user) {
      return c.json(
        { success: false, message: "User not authenticated" },
        HttpStatusCodes.UNAUTHORIZED
      )
    }

    const userOrg = await getUserOrgbyUserId(user.id)

    // Find the availability schedule with weekly slots
    const availabilitySchedule = await db.query.availabilitySchedule.findFirst({
      where: (schedule, operators) => operators.eq(schedule.id, id),
      with: {
        weeklySlots: true,
      },
    })

    if (!availabilitySchedule) {
      return c.json(
        { success: false, message: "Availability schedule not found" },
        HttpStatusCodes.NOT_FOUND
      )
    }

    // Check authorization: user must own the schedule or be an admin in the organization
    const isOwner = availabilitySchedule.ownerId === user.id
    const isOrgAdmin =
      user.role === "admin" &&
      availabilitySchedule.organizationId === userOrg?.id

    if (!isOwner && !isOrgAdmin) {
      return c.json(
        { success: false, message: "Forbidden - insufficient permissions" },
        HttpStatusCodes.FORBIDDEN
      )
    }

    return c.json(availabilitySchedule, HttpStatusCodes.OK)
  } catch (error) {
    console.error("Error fetching availability schedule:", error)
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

export const updateAvailability: AppRouteHandler<
  UpdateAvailabilityRoute
> = async (c) => {
  const { id } = c.req.valid("param")
  const { name, timeSlots, isDefault, timeZone } = c.req.valid("json")

  try {
    const user = c.var.user

    if (!user) {
      return c.json(
        { success: false, message: "User not authenticated" },
        HttpStatusCodes.UNAUTHORIZED
      )
    }

    const userOrg = await getUserOrgbyUserId(user.id)

    // Find the existing availability schedule
    const existingSchedule = await db.query.availabilitySchedule.findFirst({
      where: (schedule, operators) => operators.eq(schedule.id, id),
      with: {
        weeklySlots: true,
      },
    })

    if (!existingSchedule) {
      return c.json(
        { success: false, message: "Availability schedule not found" },
        HttpStatusCodes.NOT_FOUND
      )
    }

    // Check authorization: user must own the schedule or be an admin in the organization
    const isOwner = existingSchedule.ownerId === user.id
    const isOrgAdmin =
      user.role === "admin" && existingSchedule.organizationId === userOrg?.id

    if (!isOwner && !isOrgAdmin) {
      return c.json(
        { success: false, message: "Forbidden - insufficient permissions" },
        HttpStatusCodes.FORBIDDEN
      )
    }

    // Validate time slots if provided
    if (timeSlots) {
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
    }

    // Update the schedule name/timeZone if provided
    if (name !== undefined || timeZone !== undefined) {
      await db
        .update(availabilitySchedule)
        .set({
          ...(name !== undefined ? { name } : {}),
          ...(timeZone !== undefined ? { timeZone } : {}),
          updatedAt: new Date(),
        })
        .where(eq(availabilitySchedule.id, id))
    }

    // Toggle default if requested
    if (isDefault !== undefined) {
      if (isDefault) {
        // Unset others for this owner
        await db
          .update(availabilitySchedule)
          .set({ isDefault: false })
          .where(eq(availabilitySchedule.ownerId, existingSchedule.ownerId))
        await db
          .update(availabilitySchedule)
          .set({ isDefault: true, updatedAt: new Date() })
          .where(eq(availabilitySchedule.id, id))
      } else {
        await db
          .update(availabilitySchedule)
          .set({ isDefault: false, updatedAt: new Date() })
          .where(eq(availabilitySchedule.id, id))
      }
    }

    // Update weekly slots if provided
    if (timeSlots) {
      // Delete existing weekly slots
      await db
        .delete(weeklyScheduleSlot)
        .where(eq(weeklyScheduleSlot.scheduleId, id))

      // Insert new weekly slots
      for (const slot of timeSlots) {
        const dayInt = dayToInteger(slot.dayOfWeek)
        if (dayInt === undefined) {
          throw new Error(`Invalid day of week: ${slot.dayOfWeek}`)
        }
        await db.insert(weeklyScheduleSlot).values({
          scheduleId: id,
          dayOfWeek: dayInt,
          startTime: slot.startTime,
          endTime: slot.endTime,
        })
      }
    }

    // Fetch and return the updated schedule with weekly slots
    const updatedSchedule = await db.query.availabilitySchedule.findFirst({
      where: (schedule, operators) => operators.eq(schedule.id, id),
      with: {
        weeklySlots: true,
      },
    })

    if (!updatedSchedule) {
      throw new Error("Failed to fetch updated availability schedule")
    }

    return c.json(updatedSchedule, HttpStatusCodes.OK)
  } catch (error) {
    console.error("Error updating availability schedule:", error)
    return c.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      },
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    )
  }
}

export const deleteAvailability: AppRouteHandler<
  import("./routes").DeleteAvailabilityRoute
> = async (c) => {
  const { id } = c.req.valid("param")
  try {
    const user = c.var.user
    if (!user) {
      return c.json(
        { success: false, message: "User not authenticated" },
        HttpStatusCodes.UNAUTHORIZED
      )
    }

    // Fetch schedule to validate ownership/org admin
    const existingSchedule = await db.query.availabilitySchedule.findFirst({
      where: (schedule, operators) => operators.eq(schedule.id, id),
    })

    if (!existingSchedule) {
      return c.json(
        { success: false, message: "Availability schedule not found" },
        HttpStatusCodes.NOT_FOUND
      )
    }

    const userOrg = await getUserOrgbyUserId(user.id)
    const isOwner = existingSchedule.ownerId === user.id
    const isOrgAdmin =
      user.role === "admin" && existingSchedule.organizationId === userOrg?.id

    if (!isOwner && !isOrgAdmin) {
      return c.json(
        { success: false, message: "Forbidden - insufficient permissions" },
        HttpStatusCodes.FORBIDDEN
      )
    }

    // Deleting the parent schedule will cascade delete weekly slots via FK
    await db.delete(availabilitySchedule).where(eq(availabilitySchedule.id, id))

    return c.body(null, HttpStatusCodes.NO_CONTENT)
  } catch (error) {
    console.error("Error deleting availability schedule:", error)
    return c.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      },
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    )
  }
}
