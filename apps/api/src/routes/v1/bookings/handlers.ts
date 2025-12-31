import { and, count, db, eq, gte, lte } from "@workspace/db"
import { booking } from "@workspace/db/schema/booking"
import { businessUser } from "@workspace/db/schema/business-user"
import { eventType } from "@workspace/db/schema/event-type"
import { DateTime } from "luxon"
import {
  checkSlotAvailability,
  createCalendarEvent,
  deleteCalendarEvent,
  logBookingEvent,
  selectUserForBooking,
  updateCalendarEvent,
} from "@/lib/bookings"
import {
  notifyBookingCreated,
  notifyBookingCancelled,
  notifyBookingRescheduled,
} from "@/lib/notifications"
import {
  isAccessError,
  verifyBusinessAccess,
} from "@/lib/helpers/access/verify-business-access"
import * as HttpStatusCodes from "@/lib/misc/http-status-codes"
import type { AppRouteHandler } from "@/lib/types/app-types"
import type {
  CancelBookingRoute,
  CreateBookingRoute,
  GetBookingRoute,
  ListBookingsRoute,
  RescheduleBookingRoute,
} from "./routes"

// ============================================================================
// Route Handlers
// ============================================================================

export const createBooking: AppRouteHandler<CreateBookingRoute> = async (c) => {
  try {
    const { businessId } = c.req.valid("param")
    const body = c.req.valid("json")
    const org = c.var.organization

    if (!org) {
      return c.json(
        { success: false, message: "Organization context required" },
        HttpStatusCodes.FORBIDDEN
      )
    }

    // Verify business access
    const access = await verifyBusinessAccess(org.id, businessId)
    if (isAccessError(access)) {
      return c.json(
        { success: false, message: access.error },
        access.status as 404
      )
    }

    // Get event type
    const eventTypeRecord = await db.query.eventType.findFirst({
      where: and(
        eq(eventType.id, body.eventTypeId),
        eq(eventType.businessId, businessId)
      ),
    })

    if (!eventTypeRecord) {
      return c.json(
        { success: false, message: "Event type not found" },
        HttpStatusCodes.NOT_FOUND
      )
    }

    // Parse and validate times
    const slotStart = DateTime.fromISO(body.startTime, { zone: body.timezone })
    if (!slotStart.isValid) {
      return c.json(
        { success: false, message: "Invalid start time" },
        HttpStatusCodes.BAD_REQUEST
      )
    }

    const slotEnd = slotStart.plus({ minutes: eventTypeRecord.durationMinutes })

    // Check minimum notice
    const now = DateTime.now()
    const minNoticeTime = now.plus({
      minutes: eventTypeRecord.minNoticeMinutes,
    })
    if (slotStart < minNoticeTime) {
      return c.json(
        {
          success: false as const,
          message: `Booking must be at least ${eventTypeRecord.minNoticeMinutes} minutes in advance`,
          code: "SLOT_UNAVAILABLE" as const,
        },
        HttpStatusCodes.CONFLICT
      )
    }

    // Check max days in advance
    if (eventTypeRecord.maxDaysInAdvance) {
      const maxDate = now.plus({ days: eventTypeRecord.maxDaysInAdvance })
      if (slotStart > maxDate) {
        return c.json(
          {
            success: false as const,
            message: `Booking must be within ${eventTypeRecord.maxDaysInAdvance} days`,
            code: "SLOT_UNAVAILABLE" as const,
          },
          HttpStatusCodes.CONFLICT
        )
      }
    }

    // Select user for booking
    const assignment = await selectUserForBooking({
      eventTypeRecord,
      businessId,
      slotStart,
      slotEnd,
      requestedUserId: body.businessUserId,
    })

    if (!assignment) {
      return c.json(
        {
          success: false as const,
          message: "No available users for the requested time slot",
          code: "SLOT_UNAVAILABLE" as const,
        },
        HttpStatusCodes.CONFLICT
      )
    }

    // Create booking record
    const [newBooking] = await db
      .insert(booking)
      .values({
        businessId,
        businessUserId: assignment.userId,
        eventTypeId: eventTypeRecord.id,
        title: body.title ?? eventTypeRecord.title,
        description: body.description ?? eventTypeRecord.description,
        startTime: slotStart.toJSDate(),
        endTime: slotEnd.toJSDate(),
        timezone: body.timezone,
        status: "confirmed",
        locationType: null,
        location: body.location ?? null,
        assignedVia: assignment.assignedVia,
        assignmentMetadata: assignment.assignmentMetadata,
        attendeeEmail: body.attendeeEmail,
        attendeeName: body.attendeeName,
        attendeeTimezone: body.attendeeTimezone ?? null,
        metadata: body.metadata ?? null,
      })
      .returning()

    if (!newBooking) {
      return c.json(
        { success: false, message: "Failed to create booking" },
        HttpStatusCodes.INTERNAL_SERVER_ERROR
      )
    }

    // Create calendar event (best effort)
    const calendarEventId = await createCalendarEvent({
      bookingRecord: newBooking,
      eventTypeRecord,
    })

    if (calendarEventId) {
      await db
        .update(booking)
        .set({ calendarEventId })
        .where(eq(booking.id, newBooking.id))

      newBooking.calendarEventId = calendarEventId
    }

    // Log booking creation
    await logBookingEvent({
      bookingId: newBooking.id,
      eventType: "created",
      oldStatus: null,
      newStatus: "confirmed",
      metadata: {
        eventTypeId: eventTypeRecord.id,
        assignedVia: assignment.assignedVia,
      },
    })

    // Send notifications (best effort - don't fail booking if notifications fail)
    const host = await db.query.businessUser.findFirst({
      where: eq(businessUser.id, assignment.userId),
    })

    if (host) {
      await notifyBookingCreated({
        booking: newBooking,
        host,
        eventType: eventTypeRecord,
      })
    }

    return c.json(newBooking, HttpStatusCodes.CREATED)
  } catch (error) {
    console.error("[Create Booking] Error:", error)
    return c.json(
      { success: false, message: "Failed to create booking" },
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    )
  }
}

export const listBookings: AppRouteHandler<ListBookingsRoute> = async (c) => {
  try {
    const { businessId } = c.req.valid("param")
    const query = c.req.valid("query")
    const org = c.var.organization

    if (!org) {
      return c.json(
        { success: false, message: "Organization context required" },
        HttpStatusCodes.FORBIDDEN
      )
    }

    // Verify business access
    const access = await verifyBusinessAccess(org.id, businessId)
    if (isAccessError(access)) {
      return c.json(
        { success: false, message: access.error },
        access.status as 404
      )
    }

    // Build query conditions
    const conditions = [eq(booking.businessId, businessId)]

    if (query.status) {
      conditions.push(eq(booking.status, query.status))
    }

    if (query.startDate) {
      const startDate = DateTime.fromISO(query.startDate).startOf("day")
      if (startDate.isValid) {
        conditions.push(gte(booking.startTime, startDate.toJSDate()))
      }
    }

    if (query.endDate) {
      const endDate = DateTime.fromISO(query.endDate).endOf("day")
      if (endDate.isValid) {
        conditions.push(lte(booking.startTime, endDate.toJSDate()))
      }
    }

    if (query.eventTypeId) {
      conditions.push(eq(booking.eventTypeId, query.eventTypeId))
    }

    if (query.businessUserId) {
      conditions.push(eq(booking.businessUserId, query.businessUserId))
    }

    const limit = query.limit ?? 50
    const offset = query.offset ?? 0

    // Get bookings
    const bookings = await db.query.booking.findMany({
      where: and(...conditions),
      orderBy: (b, { desc }) => [desc(b.startTime)],
      limit,
      offset,
    })

    // Get total count
    const [countResult] = await db
      .select({ count: count() })
      .from(booking)
      .where(and(...conditions))

    const total = Number(countResult?.count ?? 0)

    return c.json(
      {
        data: bookings,
        meta: {
          total,
          limit,
          offset,
        },
      },
      HttpStatusCodes.OK
    )
  } catch (error) {
    console.error("[List Bookings] Error:", error)
    return c.json(
      { success: false, message: "Failed to list bookings" },
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    )
  }
}

export const getBooking: AppRouteHandler<GetBookingRoute> = async (c) => {
  try {
    const { businessId, bookingId } = c.req.valid("param")
    const org = c.var.organization

    if (!org) {
      return c.json(
        { success: false, message: "Organization context required" },
        HttpStatusCodes.FORBIDDEN
      )
    }

    // Verify business access
    const access = await verifyBusinessAccess(org.id, businessId)
    if (isAccessError(access)) {
      return c.json(
        { success: false, message: access.error },
        access.status as 404
      )
    }

    // Get booking
    const bookingRecord = await db.query.booking.findFirst({
      where: and(eq(booking.id, bookingId), eq(booking.businessId, businessId)),
    })

    if (!bookingRecord) {
      return c.json(
        { success: false, message: "Booking not found" },
        HttpStatusCodes.NOT_FOUND
      )
    }

    return c.json(bookingRecord, HttpStatusCodes.OK)
  } catch (error) {
    console.error("[Get Booking] Error:", error)
    return c.json(
      { success: false, message: "Failed to get booking" },
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    )
  }
}

export const rescheduleBooking: AppRouteHandler<
  RescheduleBookingRoute
> = async (c) => {
  try {
    const { businessId, bookingId } = c.req.valid("param")
    const body = c.req.valid("json")
    const org = c.var.organization

    if (!org) {
      return c.json(
        { success: false, message: "Organization context required" },
        HttpStatusCodes.FORBIDDEN
      )
    }

    // Verify business access
    const access = await verifyBusinessAccess(org.id, businessId)
    if (isAccessError(access)) {
      return c.json({ success: false, message: access.error }, access.status)
    }

    // Get existing booking
    const existingBooking = await db.query.booking.findFirst({
      where: and(eq(booking.id, bookingId), eq(booking.businessId, businessId)),
    })

    if (!existingBooking) {
      return c.json(
        { success: false, message: "Booking not found" },
        HttpStatusCodes.NOT_FOUND
      )
    }

    // Check if booking can be rescheduled
    if (
      existingBooking.status === "cancelled" ||
      existingBooking.status === "completed"
    ) {
      return c.json(
        {
          success: false,
          message: `Cannot reschedule ${existingBooking.status} booking`,
        },
        HttpStatusCodes.BAD_REQUEST
      )
    }

    // Get event type for duration
    const eventTypeRecord = existingBooking.eventTypeId
      ? await db.query.eventType.findFirst({
          where: eq(eventType.id, existingBooking.eventTypeId),
        })
      : null

    const durationMinutes =
      eventTypeRecord?.durationMinutes ??
      DateTime.fromJSDate(existingBooking.endTime).diff(
        DateTime.fromJSDate(existingBooking.startTime),
        "minutes"
      ).minutes

    // Parse new time
    const timezone = body.timezone ?? existingBooking.timezone
    const newStart = DateTime.fromISO(body.startTime, { zone: timezone })
    if (!newStart.isValid) {
      return c.json(
        { success: false, message: "Invalid start time" },
        HttpStatusCodes.BAD_REQUEST
      )
    }

    const newEnd = newStart.plus({ minutes: durationMinutes })

    // Check availability for assigned user
    const isAvailable = await checkSlotAvailability({
      userId: existingBooking.businessUserId,
      slotStart: newStart,
      slotEnd: newEnd,
      eventTypeRecord:
        eventTypeRecord ??
        ({
          bufferBefore: 0,
          bufferAfter: 0,
          availabilityScheduleId: null,
        } as typeof eventType.$inferSelect),
      excludeBookingId: bookingId,
    })

    if (!isAvailable) {
      return c.json(
        {
          success: false as const,
          message: "New time slot is not available",
          code: "SLOT_UNAVAILABLE" as const,
        },
        HttpStatusCodes.CONFLICT
      )
    }

    // Store previous times for audit
    const previousStartTime = existingBooking.startTime
    const previousEndTime = existingBooking.endTime

    // Update booking
    const [updatedBooking] = await db
      .update(booking)
      .set({
        startTime: newStart.toJSDate(),
        endTime: newEnd.toJSDate(),
        timezone,
      })
      .where(eq(booking.id, bookingId))
      .returning()

    if (!updatedBooking) {
      return c.json(
        { success: false, message: "Failed to update booking" },
        HttpStatusCodes.INTERNAL_SERVER_ERROR
      )
    }

    // Update calendar event
    await updateCalendarEvent({
      bookingRecord: updatedBooking,
      updates: {
        startTime: newStart.toJSDate(),
        endTime: newEnd.toJSDate(),
        timezone,
      },
    })

    // Log rescheduled event
    await logBookingEvent({
      bookingId,
      eventType: "rescheduled",
      oldStatus: existingBooking.status,
      newStatus: updatedBooking.status,
      metadata: {
        previousStartTime: previousStartTime.toISOString(),
        previousEndTime: previousEndTime.toISOString(),
        newStartTime: newStart.toISO(),
        newEndTime: newEnd.toISO(),
        reason: body.reason,
      },
    })

    // Send reschedule notifications
    const host = await db.query.businessUser.findFirst({
      where: eq(businessUser.id, existingBooking.businessUserId),
    })

    if (host) {
      await notifyBookingRescheduled({
        booking: updatedBooking,
        host,
        eventType: eventTypeRecord ?? null,
        previousStartTime,
        previousEndTime,
      })
    }

    return c.json(updatedBooking, HttpStatusCodes.OK)
  } catch (error) {
    console.error("[Reschedule Booking] Error:", error)
    return c.json(
      { success: false, message: "Failed to reschedule booking" },
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    )
  }
}

export const cancelBooking: AppRouteHandler<CancelBookingRoute> = async (c) => {
  try {
    const { businessId, bookingId } = c.req.valid("param")
    const body = c.req.valid("json")
    const org = c.var.organization

    if (!org) {
      return c.json(
        { success: false, message: "Organization context required" },
        HttpStatusCodes.FORBIDDEN
      )
    }

    // Verify business access
    const access = await verifyBusinessAccess(org.id, businessId)
    if (isAccessError(access)) {
      return c.json(
        { success: false, message: access.error },
        access.status as 404
      )
    }

    // Get existing booking
    const existingBooking = await db.query.booking.findFirst({
      where: and(eq(booking.id, bookingId), eq(booking.businessId, businessId)),
    })

    if (!existingBooking) {
      return c.json(
        { success: false, message: "Booking not found" },
        HttpStatusCodes.NOT_FOUND
      )
    }

    // Check if booking can be cancelled
    if (existingBooking.status === "cancelled") {
      return c.json(
        { success: false, message: "Booking is already cancelled" },
        HttpStatusCodes.BAD_REQUEST
      )
    }

    const previousStatus = existingBooking.status

    // Update booking status
    await db
      .update(booking)
      .set({
        status: "cancelled",
        cancellationReason: body.reason ?? null,
      })
      .where(eq(booking.id, bookingId))

    // Delete calendar event
    await deleteCalendarEvent({ bookingRecord: existingBooking })

    // Log cancellation
    await logBookingEvent({
      bookingId,
      eventType: "cancelled",
      oldStatus: previousStatus,
      newStatus: "cancelled",
      metadata: {
        reason: body.reason,
      },
    })

    // Send cancellation notifications
    const host = await db.query.businessUser.findFirst({
      where: eq(businessUser.id, existingBooking.businessUserId),
    })

    if (host) {
      const eventTypeRecord = existingBooking.eventTypeId
        ? await db.query.eventType.findFirst({
            where: eq(eventType.id, existingBooking.eventTypeId),
          })
        : null

      await notifyBookingCancelled({
        booking: existingBooking,
        host,
        eventType: eventTypeRecord ?? null,
        reason: body.reason,
      })
    }

    return c.json(
      { success: true, message: "Booking cancelled" },
      HttpStatusCodes.OK
    )
  } catch (error) {
    console.error("[Cancel Booking] Error:", error)
    return c.json(
      { success: false, message: "Failed to cancel booking" },
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    )
  }
}
