import { and, db, eq, gte, lte, ne } from "@workspace/db"
import { availabilityOverride } from "@workspace/db/schema/availability-override"
import { availabilityRule } from "@workspace/db/schema/availability-rule"
import { availabilitySchedule } from "@workspace/db/schema/availability-schedule"
import { businessUser } from "@workspace/db/schema/business-user"
import { calendarConnection } from "@workspace/db/schema/calendar-connection"
import { eventType } from "@workspace/db/schema/event-type"
import { business } from "@workspace/db/schema/business"
import { DateTime, Interval } from "luxon"
import {
  isAccessError,
  verifyBusinessAccess,
  verifyBusinessUserAccess,
} from "@/lib/helpers/access/verify-business-access"
import * as HttpStatusCodes from "@/lib/misc/http-status-codes"
import { getCalendarServiceForConnection } from "@/services/calendar"
import type { AppRouteHandler } from "@/lib/types/app-types"
import type {
  CreateRuleRoute,
  CreateScheduleRoute,
  DeleteRuleRoute,
  DeleteScheduleRoute,
  GetAvailabilityRoute,
  GetScheduleRoute,
  ListSchedulesRoute,
  ReplaceRulesRoute,
  UpdateRuleRoute,
  UpdateScheduleRoute,
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
// Schedule Handlers
// ============================================================================

export const listSchedules: AppRouteHandler<ListSchedulesRoute> = async (c) => {
  try {
    const { businessId, userId } = c.req.valid("param")
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

    const schedules = await db.query.availabilitySchedule.findMany({
      where: eq(availabilitySchedule.businessUserId, userId),
      orderBy: (schedule, { desc }) => [desc(schedule.isDefault)],
    })

    return c.json({ data: schedules }, HttpStatusCodes.OK)
  } catch (error) {
    console.error("[List Schedules] Error:", error)
    return c.json(
      { success: false, message: "Failed to list schedules" },
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    )
  }
}

export const createSchedule: AppRouteHandler<CreateScheduleRoute> = async (
  c
) => {
  try {
    const { businessId, userId } = c.req.valid("param")
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

    // If this is being set as default, unset other defaults first
    if (body.isDefault) {
      await db
        .update(availabilitySchedule)
        .set({ isDefault: false })
        .where(eq(availabilitySchedule.businessUserId, userId))
    }

    const [schedule] = await db
      .insert(availabilitySchedule)
      .values({
        ...body,
        businessUserId: userId,
      })
      .returning()

    return c.json(schedule, HttpStatusCodes.CREATED)
  } catch (error) {
    console.error("[Create Schedule] Error:", error)
    return c.json(
      { success: false, message: "Failed to create schedule" },
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    )
  }
}

export const getSchedule: AppRouteHandler<GetScheduleRoute> = async (c) => {
  try {
    const { businessId, userId, scheduleId } = c.req.valid("param")
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

    const schedule = await db.query.availabilitySchedule.findFirst({
      where: and(
        eq(availabilitySchedule.id, scheduleId),
        eq(availabilitySchedule.businessUserId, userId)
      ),
      with: {
        rules: true,
      },
    })

    if (!schedule) {
      return c.json(
        { success: false, message: "Schedule not found" },
        HttpStatusCodes.NOT_FOUND
      )
    }

    return c.json(schedule, HttpStatusCodes.OK)
  } catch (error) {
    console.error("[Get Schedule] Error:", error)
    return c.json(
      { success: false, message: "Failed to get schedule" },
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    )
  }
}

export const updateSchedule: AppRouteHandler<UpdateScheduleRoute> = async (
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

    // If setting as default, unset other defaults first
    if (body.isDefault) {
      await db
        .update(availabilitySchedule)
        .set({ isDefault: false })
        .where(
          and(
            eq(availabilitySchedule.businessUserId, userId),
            ne(availabilitySchedule.id, scheduleId) // exclude current one (will be set below)
          )
        )
    }

    const [updated] = await db
      .update(availabilitySchedule)
      .set(body)
      .where(eq(availabilitySchedule.id, scheduleId))
      .returning()

    return c.json(updated, HttpStatusCodes.OK)
  } catch (error) {
    console.error("[Update Schedule] Error:", error)
    return c.json(
      { success: false, message: "Failed to update schedule" },
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    )
  }
}

export const deleteSchedule: AppRouteHandler<DeleteScheduleRoute> = async (
  c
) => {
  try {
    const { businessId, userId, scheduleId } = c.req.valid("param")
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

    // Delete schedule (rules cascade)
    await db
      .delete(availabilitySchedule)
      .where(eq(availabilitySchedule.id, scheduleId))

    return c.json(
      { success: true, message: "Schedule deleted" },
      HttpStatusCodes.OK
    )
  } catch (error) {
    console.error("[Delete Schedule] Error:", error)
    return c.json(
      { success: false, message: "Failed to delete schedule" },
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    )
  }
}

// ============================================================================
// Rule Handlers
// ============================================================================

export const createRule: AppRouteHandler<CreateRuleRoute> = async (c) => {
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

    // Validate startTime < endTime
    if (body.startTime >= body.endTime) {
      return c.json(
        { success: false, message: "Start time must be before end time" },
        HttpStatusCodes.BAD_REQUEST
      )
    }

    const [rule] = await db
      .insert(availabilityRule)
      .values({
        ...body,
        scheduleId,
      })
      .returning()

    return c.json(rule, HttpStatusCodes.CREATED)
  } catch (error) {
    console.error("[Create Rule] Error:", error)
    return c.json(
      { success: false, message: "Failed to create rule" },
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    )
  }
}

export const updateRule: AppRouteHandler<UpdateRuleRoute> = async (c) => {
  try {
    const { businessId, userId, scheduleId, ruleId } = c.req.valid("param")
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

    // Get existing rule
    const existingRule = await db.query.availabilityRule.findFirst({
      where: and(
        eq(availabilityRule.id, ruleId),
        eq(availabilityRule.scheduleId, scheduleId)
      ),
    })

    if (!existingRule) {
      return c.json(
        { success: false, message: "Rule not found" },
        HttpStatusCodes.NOT_FOUND
      )
    }

    // Validate times if both are provided
    const newStartTime = body.startTime ?? existingRule.startTime
    const newEndTime = body.endTime ?? existingRule.endTime
    if (newStartTime >= newEndTime) {
      return c.json(
        { success: false, message: "Start time must be before end time" },
        HttpStatusCodes.BAD_REQUEST
      )
    }

    const [updated] = await db
      .update(availabilityRule)
      .set(body)
      .where(eq(availabilityRule.id, ruleId))
      .returning()

    return c.json(updated, HttpStatusCodes.OK)
  } catch (error) {
    console.error("[Update Rule] Error:", error)
    return c.json(
      { success: false, message: "Failed to update rule" },
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    )
  }
}

export const deleteRule: AppRouteHandler<DeleteRuleRoute> = async (c) => {
  try {
    const { businessId, userId, scheduleId, ruleId } = c.req.valid("param")
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

    const existingRule = await db.query.availabilityRule.findFirst({
      where: and(
        eq(availabilityRule.id, ruleId),
        eq(availabilityRule.scheduleId, scheduleId)
      ),
    })

    if (!existingRule) {
      return c.json(
        { success: false, message: "Rule not found" },
        HttpStatusCodes.NOT_FOUND
      )
    }

    await db.delete(availabilityRule).where(eq(availabilityRule.id, ruleId))

    return c.json(
      { success: true, message: "Rule deleted" },
      HttpStatusCodes.OK
    )
  } catch (error) {
    console.error("[Delete Rule] Error:", error)
    return c.json(
      { success: false, message: "Failed to delete rule" },
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    )
  }
}

export const replaceRules: AppRouteHandler<ReplaceRulesRoute> = async (c) => {
  try {
    const { businessId, userId, scheduleId } = c.req.valid("param")
    const { rules } = c.req.valid("json")
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

    // Validate all rules before transaction
    for (const rule of rules) {
      if (rule.startTime >= rule.endTime) {
        return c.json(
          {
            success: false,
            message: "Start time must be before end time for all rules",
          },
          HttpStatusCodes.BAD_REQUEST
        )
      }
    }

    // Use transaction for atomicity
    const newRules = await db.transaction(async (tx) => {
      // Delete all existing rules
      await tx
        .delete(availabilityRule)
        .where(eq(availabilityRule.scheduleId, scheduleId))

      // Insert new rules (if any)
      if (rules.length === 0) {
        return []
      }

      const insertedRules = await tx
        .insert(availabilityRule)
        .values(rules.map((rule) => ({ ...rule, scheduleId })))
        .returning()

      return insertedRules
    })

    return c.json({ data: newRules }, HttpStatusCodes.OK)
  } catch (error) {
    console.error("[Replace Rules] Error:", error)
    return c.json(
      { success: false, message: "Failed to replace rules" },
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    )
  }
}

// ============================================================================
// Availability Calculation with Luxon
// ============================================================================

interface TimeSlot {
  start: DateTime
  end: DateTime
}

interface BusyBlock {
  start: DateTime
  end: DateTime
}

/**
 * Parse time string (HH:MM:SS or HH:MM) to { hour, minute }
 */
function parseTimeString(timeStr: string): { hour: number; minute: number } {
  const [hours, minutes] = timeStr.split(":").map(Number)
  return { hour: hours ?? 0, minute: minutes ?? 0 }
}

/**
 * Generate available slots for a single day using Luxon
 */
function generateDaySlots(
  date: DateTime,
  rules: Array<{ startTime: string; endTime: string }>,
  durationMinutes: number,
  slotStepMinutes: number,
  busyBlocks: BusyBlock[],
  bufferBefore: number,
  bufferAfter: number,
  minNoticeTime: DateTime
): TimeSlot[] {
  const slots: TimeSlot[] = []

  for (const rule of rules) {
    const ruleStart = parseTimeString(rule.startTime)
    const ruleEnd = parseTimeString(rule.endTime)

    // Create DateTime for rule boundaries on this day
    let slotStart = date.set({
      hour: ruleStart.hour,
      minute: ruleStart.minute,
      second: 0,
      millisecond: 0,
    })

    const ruleEndTime = date.set({
      hour: ruleEnd.hour,
      minute: ruleEnd.minute,
      second: 0,
      millisecond: 0,
    })

    // Generate slots within this rule's time window
    while (slotStart.plus({ minutes: durationMinutes }) <= ruleEndTime) {
      const slotEnd = slotStart.plus({ minutes: durationMinutes })

      // Check minimum notice
      if (slotStart < minNoticeTime) {
        slotStart = slotStart.plus({ minutes: slotStepMinutes })
        continue
      }

      // Check conflicts with busy blocks (including buffers)
      const slotWithBufferStart = slotStart.minus({ minutes: bufferBefore })
      const slotWithBufferEnd = slotEnd.plus({ minutes: bufferAfter })
      const slotInterval = Interval.fromDateTimes(
        slotWithBufferStart,
        slotWithBufferEnd
      )

      const hasConflict = busyBlocks.some((busy) => {
        const busyInterval = Interval.fromDateTimes(busy.start, busy.end)
        return slotInterval.overlaps(busyInterval)
      })

      if (!hasConflict) {
        slots.push({ start: slotStart, end: slotEnd })
      }

      slotStart = slotStart.plus({ minutes: slotStepMinutes })
    }
  }

  return slots
}

/**
 * Fetch user availability data (schedule, rules, overrides, busy times) in parallel
 */
async function fetchUserAvailabilityData(
  userId: string,
  eventTypeRecord: typeof eventType.$inferSelect,
  queryStart: DateTime,
  queryEnd: DateTime
): Promise<{
  schedule: typeof availabilitySchedule.$inferSelect | null
  rules: Array<typeof availabilityRule.$inferSelect>
  overrides: Array<typeof availabilityOverride.$inferSelect>
  busyBlocks: BusyBlock[]
}> {
  // Get schedule (event type's or user's default)
  let schedule: typeof availabilitySchedule.$inferSelect | undefined

  if (eventTypeRecord.availabilityScheduleId) {
    schedule = await db.query.availabilitySchedule.findFirst({
      where: eq(
        availabilitySchedule.id,
        eventTypeRecord.availabilityScheduleId
      ),
    })
  }

  if (!schedule) {
    schedule = await db.query.availabilitySchedule.findFirst({
      where: and(
        eq(availabilitySchedule.businessUserId, userId),
        eq(availabilitySchedule.isDefault, true)
      ),
    })
  }

  if (!schedule) {
    return { schedule: null, rules: [], overrides: [], busyBlocks: [] }
  }

  const scheduleTimezone = schedule.timezone || "UTC"

  // Fetch rules, overrides, and calendar connection in parallel
  const [rules, overrides, connection] = await Promise.all([
    db.query.availabilityRule.findMany({
      where: eq(availabilityRule.scheduleId, schedule.id),
    }),
    db.query.availabilityOverride.findMany({
      where: and(
        eq(availabilityOverride.scheduleId, schedule.id),
        gte(availabilityOverride.date, queryStart.toISODate()!),
        lte(availabilityOverride.date, queryEnd.toISODate()!)
      ),
    }),
    db.query.calendarConnection.findFirst({
      where: eq(calendarConnection.businessUserId, userId),
    }),
  ])

  // Get busy times from calendar
  let busyBlocks: BusyBlock[] = []

  if (connection && connection.calendarId) {
    try {
      const service = getCalendarServiceForConnection(connection)
      const credentials = await service.getCredentialsWithRefresh(connection)
      const client = service.getClient()

      const rawBusyTimes = await client.getBusyTimes(credentials, {
        calendarId: connection.calendarId,
        startDate: queryStart.toJSDate(),
        endDate: queryEnd.toJSDate(),
        timezone: scheduleTimezone,
      })

      busyBlocks = rawBusyTimes.map((block) => ({
        start: DateTime.fromJSDate(block.start, { zone: scheduleTimezone }),
        end: DateTime.fromJSDate(block.end, { zone: scheduleTimezone }),
      }))
    } catch (err) {
      console.warn(
        `[Availability] Failed to get busy times for user ${userId}:`,
        err
      )
    }
  }

  return { schedule, rules, overrides, busyBlocks }
}

export const getAvailability: AppRouteHandler<GetAvailabilityRoute> = async (
  c
) => {
  try {
    const { businessId } = c.req.valid("param")
    const { eventTypeId, startDate, endDate, timezone } = c.req.valid("query")
    const org = c.var.organization

    if (!org) {
      return c.json(
        { success: false, message: "Organization context required" },
        HttpStatusCodes.FORBIDDEN
      )
    }

    // Use provided timezone or default to UTC
    const responseTimezone = timezone || "UTC"

    // Validate timezone
    if (!DateTime.local().setZone(responseTimezone).isValid) {
      return c.json(
        { success: false, message: `Invalid timezone: ${responseTimezone}` },
        HttpStatusCodes.BAD_REQUEST
      )
    }

    // Verify business belongs to organization
    const access = await verifyBusinessAccess(org.id, businessId)
    if (isAccessError(access)) {
      return c.json(
        { success: false, message: access.error },
        access.status as 404
      )
    }

    // Get the event type
    const eventTypeRecord = await db.query.eventType.findFirst({
      where: and(
        eq(eventType.id, eventTypeId),
        eq(eventType.businessId, businessId)
      ),
    })

    if (!eventTypeRecord) {
      return c.json(
        { success: false, message: "Event type not found" },
        HttpStatusCodes.NOT_FOUND
      )
    }

    // Determine which user(s) to check
    let userIds: string[]
    if (eventTypeRecord.businessUserId) {
      userIds = [eventTypeRecord.businessUserId]
    } else if (
      eventTypeRecord.eligibleUserIds &&
      Array.isArray(eventTypeRecord.eligibleUserIds)
    ) {
      userIds = eventTypeRecord.eligibleUserIds as string[]
    } else {
      const allUsers = await db.query.businessUser.findMany({
        where: eq(businessUser.businessId, businessId),
      })
      userIds = allUsers.map((u) => u.id)
    }

    if (userIds.length === 0) {
      return c.json(
        { success: false, message: "No users available for this event type" },
        HttpStatusCodes.BAD_REQUEST
      )
    }

    // Parse date range using Luxon
    const queryStart = DateTime.fromISO(startDate, { zone: responseTimezone }).startOf("day")
    const queryEnd = DateTime.fromISO(endDate, { zone: responseTimezone }).endOf("day")

    if (!queryStart.isValid || !queryEnd.isValid) {
      return c.json(
        { success: false, message: "Invalid date format" },
        HttpStatusCodes.BAD_REQUEST
      )
    }

    // Current time for minimum notice calculation
    const now = DateTime.now().setZone(responseTimezone)

    // Check maxDaysInAdvance
    if (eventTypeRecord.maxDaysInAdvance) {
      const maxDate = now.plus({ days: eventTypeRecord.maxDaysInAdvance })
      if (queryStart > maxDate) {
        return c.json(
          { slots: [], timezone: responseTimezone },
          HttpStatusCodes.OK
        )
      }
    }

    // Minimum notice time
    const minNoticeTime = now.plus({ minutes: eventTypeRecord.minNoticeMinutes })

    // Compute effective slot step (defaults to duration if not set)
    const effectiveStepMinutes =
      eventTypeRecord.slotStepMinutes ?? eventTypeRecord.durationMinutes

    // Fetch all user data in parallel
    const userDataPromises = userIds.map((userId) =>
      fetchUserAvailabilityData(userId, eventTypeRecord, queryStart, queryEnd)
    )
    const usersData = await Promise.all(userDataPromises)

    // Collect all available slots from all users
    const allSlots: TimeSlot[] = []

    for (const userData of usersData) {
      const { schedule, rules, overrides, busyBlocks } = userData

      if (!schedule || rules.length === 0) {
        continue
      }

      const scheduleTimezone = schedule.timezone || "UTC"

      // Generate slots for each day in range
      let currentDate = queryStart.setZone(scheduleTimezone).startOf("day")
      const endDate_ = queryEnd.setZone(scheduleTimezone).endOf("day")

      while (currentDate <= endDate_) {
        const dateStr = currentDate.toISODate()!

        // Check for date override first
        const override = overrides.find((o) => o.date === dateStr)

        if (override) {
          // Date has an override
          if (!override.isAvailable) {
            // Skip this day entirely - marked as unavailable
            currentDate = currentDate.plus({ days: 1 })
            continue
          }

          // Has custom times - use those instead of weekly rules
          if (override.startTime && override.endTime) {
            const customRules = [
              { startTime: override.startTime, endTime: override.endTime },
            ]
            const daySlots = generateDaySlots(
              currentDate,
              customRules,
              eventTypeRecord.durationMinutes,
              effectiveStepMinutes,
              busyBlocks,
              eventTypeRecord.bufferBefore,
              eventTypeRecord.bufferAfter,
              minNoticeTime.setZone(scheduleTimezone)
            )
            allSlots.push(...daySlots)
            currentDate = currentDate.plus({ days: 1 })
            continue
          }
          // If isAvailable=true but no times, fall through to weekly rules
        }

        // No override or override with no custom times - use weekly rules
        // Luxon weekday is 1-7 (Monday=1, Sunday=7) - matches our schema
        const dayOfWeek = currentDate.weekday

        // Filter rules for this day
        const dayRules = rules.filter((r) => r.dayOfWeek === dayOfWeek)

        if (dayRules.length > 0) {
          const daySlots = generateDaySlots(
            currentDate,
            dayRules,
            eventTypeRecord.durationMinutes,
            effectiveStepMinutes,
            busyBlocks,
            eventTypeRecord.bufferBefore,
            eventTypeRecord.bufferAfter,
            minNoticeTime.setZone(scheduleTimezone)
          )

          allSlots.push(...daySlots)
        }

        currentDate = currentDate.plus({ days: 1 })
      }
    }

    // Deduplicate slots (for "book with anyone" mode)
    const uniqueSlots = Array.from(
      new Map(
        allSlots.map((slot) => [
          `${slot.start.toISO()}-${slot.end.toISO()}`,
          slot,
        ])
      ).values()
    )

    // Sort by start time
    uniqueSlots.sort((a, b) => a.start.toMillis() - b.start.toMillis())

    // Format response - convert to requested timezone
    const responseSlots = uniqueSlots.map((slot) => ({
      start: slot.start.setZone(responseTimezone).toISO() as string,
      end: slot.end.setZone(responseTimezone).toISO() as string,
    }))

    return c.json(
      { slots: responseSlots, timezone: responseTimezone },
      HttpStatusCodes.OK
    )
  } catch (error) {
    console.error("[Get Availability] Error:", error)
    return c.json(
      { success: false, message: "Failed to get availability" },
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    )
  }
}
