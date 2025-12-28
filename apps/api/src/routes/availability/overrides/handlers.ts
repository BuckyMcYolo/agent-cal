import { and, db, eq, gte, lte } from "@workspace/db"
import { availabilityOverride } from "@workspace/db/schema/availability-override"
import { availabilitySchedule } from "@workspace/db/schema/availability-schedule"
import {
  isAccessError,
  verifyBusinessUserAccess,
} from "@/lib/helpers/access/verify-business-access"
import * as HttpStatusCodes from "@/lib/misc/http-status-codes"
import type { AppRouteHandler } from "@/lib/types/app-types"
import type {
  CreateOverrideRoute,
  DeleteOverrideRoute,
  ListOverridesRoute,
  UpdateOverrideRoute,
} from "./routes"

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Verify schedule belongs to the user
 */
async function verifyScheduleAccess(
  scheduleId: string,
  userId: string
): Promise<typeof availabilitySchedule.$inferSelect | undefined> {
  return db.query.availabilitySchedule.findFirst({
    where: and(
      eq(availabilitySchedule.id, scheduleId),
      eq(availabilitySchedule.businessUserId, userId)
    ),
  })
}

// ============================================================================
// Override Handlers
// ============================================================================

export const listOverrides: AppRouteHandler<ListOverridesRoute> = async (c) => {
  try {
    const { businessId, userId, scheduleId } = c.req.valid("param")
    const { startDate, endDate } = c.req.valid("query")
    const org = c.var.organization

    if (!org) {
      return c.json(
        { success: false, message: "Organization context required" },
        HttpStatusCodes.FORBIDDEN
      )
    }

    const access = await verifyBusinessUserAccess(org.id, businessId, userId)
    if (isAccessError(access)) {
      return c.json(
        { success: false, message: access.error },
        access.status as 404
      )
    }

    const schedule = await verifyScheduleAccess(scheduleId, userId)
    if (!schedule) {
      return c.json(
        { success: false, message: "Schedule not found" },
        HttpStatusCodes.NOT_FOUND
      )
    }

    // Build query conditions
    const conditions = [eq(availabilityOverride.scheduleId, scheduleId)]

    if (startDate) {
      conditions.push(gte(availabilityOverride.date, startDate))
    }
    if (endDate) {
      conditions.push(lte(availabilityOverride.date, endDate))
    }

    const overrides = await db.query.availabilityOverride.findMany({
      where: and(...conditions),
      orderBy: (override, { asc }) => [asc(override.date)],
    })

    return c.json({ data: overrides }, HttpStatusCodes.OK)
  } catch (error) {
    console.error("[List Overrides] Error:", error)
    return c.json(
      { success: false, message: "Failed to list overrides" },
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    )
  }
}

export const createOverride: AppRouteHandler<CreateOverrideRoute> = async (
  c
) => {
  try {
    const { businessId, userId, scheduleId } = c.req.valid("param")
    const body = c.req.valid("json")
    const org = c.var.organization

    if (!org) {
      return c.json(
        { success: false, message: "Organization context required" },
        HttpStatusCodes.FORBIDDEN
      )
    }

    const access = await verifyBusinessUserAccess(org.id, businessId, userId)
    if (isAccessError(access)) {
      return c.json(
        { success: false, message: access.error },
        access.status as 404
      )
    }

    const schedule = await verifyScheduleAccess(scheduleId, userId)
    if (!schedule) {
      return c.json(
        { success: false, message: "Schedule not found" },
        HttpStatusCodes.NOT_FOUND
      )
    }

    // Validate: if isAvailable true with times, startTime < endTime
    if (body.isAvailable && body.startTime && body.endTime) {
      if (body.startTime >= body.endTime) {
        return c.json(
          { success: false, message: "Start time must be before end time" },
          HttpStatusCodes.BAD_REQUEST
        )
      }
    }

    // Validate: if isAvailable false, times should be null
    if (body.isAvailable === false && (body.startTime || body.endTime)) {
      return c.json(
        {
          success: false,
          message: "Times should not be set when marking date as unavailable",
        },
        HttpStatusCodes.BAD_REQUEST
      )
    }

    const [override] = await db
      .insert(availabilityOverride)
      .values({
        ...body,
        scheduleId,
      })
      .returning()

    return c.json(override, HttpStatusCodes.CREATED)
  } catch (error: unknown) {
    // Handle unique constraint violation
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "23505"
    ) {
      return c.json(
        { success: false, message: "An override already exists for this date" },
        HttpStatusCodes.BAD_REQUEST
      )
    }
    console.error("[Create Override] Error:", error)
    return c.json(
      { success: false, message: "Failed to create override" },
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    )
  }
}

export const updateOverride: AppRouteHandler<UpdateOverrideRoute> = async (
  c
) => {
  try {
    const { businessId, userId, scheduleId, overrideId } = c.req.valid("param")
    const body = c.req.valid("json")
    const org = c.var.organization

    if (!org) {
      return c.json(
        { success: false, message: "Organization context required" },
        HttpStatusCodes.FORBIDDEN
      )
    }

    const access = await verifyBusinessUserAccess(org.id, businessId, userId)
    if (isAccessError(access)) {
      return c.json(
        { success: false, message: access.error },
        access.status as 404
      )
    }

    const schedule = await verifyScheduleAccess(scheduleId, userId)
    if (!schedule) {
      return c.json(
        { success: false, message: "Schedule not found" },
        HttpStatusCodes.NOT_FOUND
      )
    }

    // Verify override exists and belongs to schedule
    const existingOverride = await db.query.availabilityOverride.findFirst({
      where: and(
        eq(availabilityOverride.id, overrideId),
        eq(availabilityOverride.scheduleId, scheduleId)
      ),
    })

    if (!existingOverride) {
      return c.json(
        { success: false, message: "Override not found" },
        HttpStatusCodes.NOT_FOUND
      )
    }

    // Merge with existing for validation
    const newIsAvailable = body.isAvailable ?? existingOverride.isAvailable
    const newStartTime = body.startTime ?? existingOverride.startTime
    const newEndTime = body.endTime ?? existingOverride.endTime

    if (newIsAvailable && newStartTime && newEndTime) {
      if (newStartTime >= newEndTime) {
        return c.json(
          { success: false, message: "Start time must be before end time" },
          HttpStatusCodes.BAD_REQUEST
        )
      }
    }

    const [updated] = await db
      .update(availabilityOverride)
      .set(body)
      .where(eq(availabilityOverride.id, overrideId))
      .returning()

    return c.json(updated, HttpStatusCodes.OK)
  } catch (error) {
    console.error("[Update Override] Error:", error)
    return c.json(
      { success: false, message: "Failed to update override" },
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    )
  }
}

export const deleteOverride: AppRouteHandler<DeleteOverrideRoute> = async (
  c
) => {
  try {
    const { businessId, userId, scheduleId, overrideId } = c.req.valid("param")
    const org = c.var.organization

    if (!org) {
      return c.json(
        { success: false, message: "Organization context required" },
        HttpStatusCodes.FORBIDDEN
      )
    }

    const access = await verifyBusinessUserAccess(org.id, businessId, userId)
    if (isAccessError(access)) {
      return c.json(
        { success: false, message: access.error },
        access.status as 404
      )
    }

    const schedule = await verifyScheduleAccess(scheduleId, userId)
    if (!schedule) {
      return c.json(
        { success: false, message: "Schedule not found" },
        HttpStatusCodes.NOT_FOUND
      )
    }

    const existingOverride = await db.query.availabilityOverride.findFirst({
      where: and(
        eq(availabilityOverride.id, overrideId),
        eq(availabilityOverride.scheduleId, scheduleId)
      ),
    })

    if (!existingOverride) {
      return c.json(
        { success: false, message: "Override not found" },
        HttpStatusCodes.NOT_FOUND
      )
    }

    await db
      .delete(availabilityOverride)
      .where(eq(availabilityOverride.id, overrideId))

    return c.json(
      { success: true, message: "Override deleted" },
      HttpStatusCodes.OK
    )
  } catch (error) {
    console.error("[Delete Override] Error:", error)
    return c.json(
      { success: false, message: "Failed to delete override" },
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    )
  }
}
