import { and, count, db, eq, gte, lte, sql } from "@workspace/db"
import { availabilityOverride } from "@workspace/db/schema/availability-override"
import { availabilityRule } from "@workspace/db/schema/availability-rule"
import { availabilitySchedule } from "@workspace/db/schema/availability-schedule"
import {
  type Booking,
  booking,
  type bookingStatusEnum,
} from "@workspace/db/schema/booking"
import { bookingEvent } from "@workspace/db/schema/booking-event"
import { businessUser } from "@workspace/db/schema/business-user"
import { calendarConnection } from "@workspace/db/schema/calendar-connection"
import type { eventType } from "@workspace/db/schema/event-type"
import { DateTime, Interval } from "luxon"
import type { BusyBlock } from "@/lib/time/slot-generation"
import { getCalendarServiceForConnection } from "@/services/calendar"

// ============================================================================
// Types
// ============================================================================

export type UserAssignment = {
  userId: string
  assignedVia: string
  assignmentMetadata: Record<string, unknown>
}

export type BookingStatus = (typeof bookingStatusEnum.enumValues)[number]

type GetUserBusyBlocksParams = {
  userId: string
  startTime: DateTime
  endTime: DateTime
  timezone: string
}

type CheckSlotAvailabilityParams = {
  userId: string
  slotStart: DateTime
  slotEnd: DateTime
  eventTypeRecord: typeof eventType.$inferSelect
  excludeBookingId?: string
}

type SelectUserForBookingParams = {
  eventTypeRecord: typeof eventType.$inferSelect
  businessId: string
  slotStart: DateTime
  slotEnd: DateTime
  requestedUserId?: string
}

type CreateCalendarEventParams = {
  bookingRecord: Booking
  eventTypeRecord: typeof eventType.$inferSelect
}

type UpdateCalendarEventParams = {
  bookingRecord: Booking
  updates: {
    startTime?: Date
    endTime?: Date
    timezone?: string
  }
}

type DeleteCalendarEventParams = {
  bookingRecord: Booking
}

type LogBookingEventParams = {
  bookingId: string
  eventType: string
  oldStatus: BookingStatus | null
  newStatus: BookingStatus | null
  metadata?: Record<string, unknown>
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get busy blocks for a user from their calendar
 */
export async function getUserBusyBlocks(
  params: GetUserBusyBlocksParams
): Promise<BusyBlock[]> {
  const { userId, startTime, endTime, timezone } = params

  const connection = await db.query.calendarConnection.findFirst({
    where: eq(calendarConnection.businessUserId, userId),
  })

  if (!connection?.calendarId) {
    return []
  }

  try {
    const service = getCalendarServiceForConnection(connection)
    const credentials = await service.getCredentialsWithRefresh(connection)
    const client = service.getClient()

    // Expand query window to handle timezone edge cases
    const queryStart = startTime.minus({ days: 1 })
    const queryEnd = endTime.plus({ days: 1 })

    const rawBusyTimes = await client.getBusyTimes(credentials, {
      calendarId: connection.calendarId,
      startDate: queryStart.toJSDate(),
      endDate: queryEnd.toJSDate(),
      timezone,
    })

    return rawBusyTimes.map((block) => ({
      start: DateTime.fromJSDate(block.start, { zone: timezone }),
      end: DateTime.fromJSDate(block.end, { zone: timezone }),
    }))
  } catch (err) {
    console.warn(`[Bookings] Failed to get busy times for user ${userId}:`, err)
    return []
  }
}

/**
 * Check if a specific time slot is available for a user
 */
export async function checkSlotAvailability(
  params: CheckSlotAvailabilityParams
): Promise<boolean> {
  const { userId, slotStart, slotEnd, eventTypeRecord, excludeBookingId } =
    params

  // Get user's schedule
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
    return false // No schedule means no availability
  }

  const scheduleTimezone = schedule.timezone || "UTC"

  // Fetch rules and overrides
  const [rules, overrides] = await Promise.all([
    db.query.availabilityRule.findMany({
      where: eq(availabilityRule.scheduleId, schedule.id),
    }),
    db.query.availabilityOverride.findMany({
      where: and(
        eq(availabilityOverride.scheduleId, schedule.id),
        eq(availabilityOverride.date, slotStart.toISODate() ?? "")
      ),
    }),
  ])

  // Check if date is blocked by override
  const dateOverride = overrides[0]
  if (dateOverride && !dateOverride.isAvailable) {
    return false
  }

  // Determine working hours for this day
  let workingHours: Array<{ startTime: string; endTime: string }> = []

  if (dateOverride?.startTime && dateOverride?.endTime) {
    workingHours = [
      { startTime: dateOverride.startTime, endTime: dateOverride.endTime },
    ]
  } else {
    const dayOfWeek = slotStart.setZone(scheduleTimezone).weekday
    workingHours = rules
      .filter((r) => r.dayOfWeek === dayOfWeek)
      .map((r) => ({ startTime: r.startTime, endTime: r.endTime }))
  }

  if (workingHours.length === 0) {
    return false // No working hours on this day
  }

  // Check if slot falls within working hours
  const slotInWorkingHours = workingHours.some((wh) => {
    const [startHour, startMin] = wh.startTime.split(":").map(Number)
    const [endHour, endMin] = wh.endTime.split(":").map(Number)

    const workStart = slotStart.setZone(scheduleTimezone).set({
      hour: startHour,
      minute: startMin,
      second: 0,
      millisecond: 0,
    })
    const workEnd = slotStart.setZone(scheduleTimezone).set({
      hour: endHour,
      minute: endMin,
      second: 0,
      millisecond: 0,
    })

    const slotStartInZone = slotStart.setZone(scheduleTimezone)
    const slotEndInZone = slotEnd.setZone(scheduleTimezone)

    return slotStartInZone >= workStart && slotEndInZone <= workEnd
  })

  if (!slotInWorkingHours) {
    return false
  }

  // Get busy blocks from calendar
  const busyBlocks = await getUserBusyBlocks({
    userId,
    startTime: slotStart,
    endTime: slotEnd,
    timezone: scheduleTimezone,
  })

  // Check for conflicts with busy blocks (including buffers)
  const bufferBefore = eventTypeRecord.bufferBefore
  const bufferAfter = eventTypeRecord.bufferAfter

  const slotWithBufferStart = slotStart.minus({ minutes: bufferBefore })
  const slotWithBufferEnd = slotEnd.plus({ minutes: bufferAfter })
  const slotInterval = Interval.fromDateTimes(
    slotWithBufferStart,
    slotWithBufferEnd
  )

  const hasCalendarConflict = busyBlocks.some((busy) => {
    const busyInterval = Interval.fromDateTimes(busy.start, busy.end)
    return slotInterval.overlaps(busyInterval)
  })

  if (hasCalendarConflict) {
    return false
  }

  // Check for conflicts with existing bookings
  const existingBookingsQuery = db
    .select({ id: booking.id })
    .from(booking)
    .where(
      and(
        eq(booking.businessUserId, userId),
        lte(booking.startTime, slotWithBufferEnd.toJSDate()),
        gte(booking.endTime, slotWithBufferStart.toJSDate()),
        eq(booking.status, "confirmed")
      )
    )

  const existingBookings = await existingBookingsQuery

  // Filter out the booking being rescheduled if provided
  const conflictingBookings = excludeBookingId
    ? existingBookings.filter((b) => b.id !== excludeBookingId)
    : existingBookings

  return conflictingBookings.length === 0
}

/**
 * Select a user for the booking based on assignment strategy
 */
export async function selectUserForBooking(
  params: SelectUserForBookingParams
): Promise<UserAssignment | null> {
  const { eventTypeRecord, businessId, slotStart, slotEnd, requestedUserId } =
    params

  // If event type is locked to a specific user
  if (eventTypeRecord.businessUserId) {
    const isAvailable = await checkSlotAvailability({
      userId: eventTypeRecord.businessUserId,
      slotStart,
      slotEnd,
      eventTypeRecord,
    })

    if (!isAvailable) {
      return null
    }

    return {
      userId: eventTypeRecord.businessUserId,
      assignedVia: "event_type_locked",
      assignmentMetadata: {
        reason: "Event type assigned to specific user",
      },
    }
  }

  // If manual assignment is required
  if (eventTypeRecord.assignmentStrategy === "manual") {
    if (!requestedUserId) {
      return null // Manual strategy requires explicit user selection
    }

    const isAvailable = await checkSlotAvailability({
      userId: requestedUserId,
      slotStart,
      slotEnd,
      eventTypeRecord,
    })

    if (!isAvailable) {
      return null
    }

    return {
      userId: requestedUserId,
      assignedVia: "manual",
      assignmentMetadata: {
        reason: "Manually selected by caller",
      },
    }
  }

  // If a specific user was requested (even with auto-assignment)
  if (requestedUserId) {
    const isAvailable = await checkSlotAvailability({
      userId: requestedUserId,
      slotStart,
      slotEnd,
      eventTypeRecord,
    })

    if (!isAvailable) {
      return null
    }

    return {
      userId: requestedUserId,
      assignedVia: "manual",
      assignmentMetadata: {
        reason: "Explicitly requested user",
      },
    }
  }

  // Get eligible users
  let eligibleUserIds: string[]

  if (
    eventTypeRecord.eligibleUserIds &&
    Array.isArray(eventTypeRecord.eligibleUserIds)
  ) {
    eligibleUserIds = eventTypeRecord.eligibleUserIds as string[]
  } else {
    const allUsers = await db.query.businessUser.findMany({
      where: eq(businessUser.businessId, businessId),
    })
    eligibleUserIds = allUsers.map((u) => u.id)
  }

  if (eligibleUserIds.length === 0) {
    return null
  }

  // Filter to available users
  const availableUsers: string[] = []
  for (const userId of eligibleUserIds) {
    const isAvailable = await checkSlotAvailability({
      userId,
      slotStart,
      slotEnd,
      eventTypeRecord,
    })
    if (isAvailable) {
      availableUsers.push(userId)
    }
  }

  if (availableUsers.length === 0) {
    return null
  }

  // Apply assignment strategy
  // Safe to assert since we checked availableUsers.length > 0 above
  const firstAvailableUser = availableUsers[0] as string
  let selectedUserId: string = firstAvailableUser
  let reason: string

  switch (eventTypeRecord.assignmentStrategy) {
    case "round_robin": {
      // Get booking counts for each user in the past 30 days
      const thirtyDaysAgo = DateTime.now().minus({ days: 30 }).toJSDate()

      const bookingCounts = await db
        .select({
          userId: booking.businessUserId,
          count: count(),
        })
        .from(booking)
        .where(
          and(
            sql`${booking.businessUserId} = ANY(${availableUsers})`,
            gte(booking.createdAt, thirtyDaysAgo),
            eq(booking.status, "confirmed")
          )
        )
        .groupBy(booking.businessUserId)

      // Create a map of user -> count
      const countMap = new Map<string, number>()
      for (const bc of bookingCounts) {
        countMap.set(bc.userId, Number(bc.count))
      }

      // Find user with fewest bookings
      let minCount = Infinity
      for (const userId of availableUsers) {
        const userCount = countMap.get(userId) ?? 0
        if (userCount < minCount) {
          minCount = userCount
          selectedUserId = userId
        }
      }
      reason = `Round robin: selected user with ${minCount} bookings in past 30 days`
      break
    }

    case "least_busy": {
      // Get booking counts for the current week
      const weekStart = DateTime.now().startOf("week").toJSDate()
      const weekEnd = DateTime.now().endOf("week").toJSDate()

      const bookingCounts = await db
        .select({
          userId: booking.businessUserId,
          count: count(),
        })
        .from(booking)
        .where(
          and(
            sql`${booking.businessUserId} = ANY(${availableUsers})`,
            gte(booking.startTime, weekStart),
            lte(booking.startTime, weekEnd),
            eq(booking.status, "confirmed")
          )
        )
        .groupBy(booking.businessUserId)

      const countMap = new Map<string, number>()
      for (const bc of bookingCounts) {
        countMap.set(bc.userId, Number(bc.count))
      }

      let minCount = Infinity
      for (const userId of availableUsers) {
        const userCount = countMap.get(userId) ?? 0
        if (userCount < minCount) {
          minCount = userCount
          selectedUserId = userId
        }
      }
      reason = `Least busy: selected user with ${minCount} bookings this week`
      break
    }

    default: {
      const randomIndex = Math.floor(Math.random() * availableUsers.length)
      selectedUserId = availableUsers[randomIndex] ?? firstAvailableUser
      reason = `Random selection from ${availableUsers.length} available users`
      break
    }
  }

  return {
    userId: selectedUserId,
    assignedVia: eventTypeRecord.assignmentStrategy,
    assignmentMetadata: {
      reason,
      eligibleUserIds,
      availableUserIds: availableUsers,
    },
  }
}

/**
 * Create a calendar event for a booking
 */
export async function createCalendarEvent(
  params: CreateCalendarEventParams
): Promise<string | null> {
  const { bookingRecord, eventTypeRecord } = params

  // Suppress unused variable warning - eventTypeRecord may be used for future enhancements
  void eventTypeRecord

  const connection = await db.query.calendarConnection.findFirst({
    where: eq(calendarConnection.businessUserId, bookingRecord.businessUserId),
  })

  if (!connection?.calendarId) {
    return null
  }

  try {
    const service = getCalendarServiceForConnection(connection)
    const credentials = await service.getCredentialsWithRefresh(connection)
    const client = service.getClient()

    const calendarEvent = await client.createEvent(credentials, {
      calendarId: connection.calendarId,
      title: bookingRecord.title,
      description: bookingRecord.description ?? undefined,
      startTime: bookingRecord.startTime,
      endTime: bookingRecord.endTime,
      timezone: bookingRecord.timezone,
      attendees: [
        {
          email: bookingRecord.attendeeEmail,
          name: bookingRecord.attendeeName,
        },
      ],
      location: bookingRecord.location ?? undefined,
      sendUpdates: true,
    })

    return calendarEvent.id
  } catch (err) {
    console.error("[Bookings] Failed to create calendar event:", err)
    return null
  }
}

/**
 * Update a calendar event
 */
export async function updateCalendarEvent(
  params: UpdateCalendarEventParams
): Promise<boolean> {
  const { bookingRecord, updates } = params

  if (!bookingRecord.calendarEventId) {
    return false
  }

  const connection = await db.query.calendarConnection.findFirst({
    where: eq(calendarConnection.businessUserId, bookingRecord.businessUserId),
  })

  if (!connection?.calendarId) {
    return false
  }

  try {
    const service = getCalendarServiceForConnection(connection)
    const credentials = await service.getCredentialsWithRefresh(connection)
    const client = service.getClient()

    await client.updateEvent(credentials, {
      calendarId: connection.calendarId,
      eventId: bookingRecord.calendarEventId,
      startTime: updates.startTime,
      endTime: updates.endTime,
      timezone: updates.timezone,
      sendUpdates: true,
    })

    return true
  } catch (err) {
    console.error("[Bookings] Failed to update calendar event:", err)
    return false
  }
}

/**
 * Delete a calendar event
 */
export async function deleteCalendarEvent(
  params: DeleteCalendarEventParams
): Promise<boolean> {
  const { bookingRecord } = params

  if (!bookingRecord.calendarEventId) {
    return false
  }

  const connection = await db.query.calendarConnection.findFirst({
    where: eq(calendarConnection.businessUserId, bookingRecord.businessUserId),
  })

  if (!connection?.calendarId) {
    return false
  }

  try {
    const service = getCalendarServiceForConnection(connection)
    const credentials = await service.getCredentialsWithRefresh(connection)
    const client = service.getClient()

    await client.deleteEvent(
      credentials,
      connection.calendarId,
      bookingRecord.calendarEventId,
      true // sendUpdates
    )

    return true
  } catch (err) {
    console.error("[Bookings] Failed to delete calendar event:", err)
    return false
  }
}

/**
 * Log a booking event to the audit table
 */
export async function logBookingEvent(
  params: LogBookingEventParams
): Promise<void> {
  const {
    bookingId,
    eventType: eventTypeStr,
    oldStatus,
    newStatus,
    metadata,
  } = params

  try {
    await db.insert(bookingEvent).values({
      bookingId,
      eventType: eventTypeStr,
      oldStatus,
      newStatus,
      metadata,
    })
  } catch (err) {
    console.error("[Bookings] Failed to log booking event:", err)
  }
}
