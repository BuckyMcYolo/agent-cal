import { serverEnv } from "@workspace/env-config/server"
import type { Booking } from "@workspace/db/schema/booking"
import type { BusinessUser } from "@workspace/db/schema/business-user"
import type { eventType } from "@workspace/db/schema/event-type"
import { DateTime } from "luxon"
import { sendBookingConfirmation } from "@/services/email"

type EventType = typeof eventType.$inferSelect

interface NotifyBookingCreatedParams {
  booking: Booking
  host: BusinessUser
  eventType: EventType
}

/**
 * Send all notifications for a newly created booking
 * - Confirmation email to attendee (with cancel/reschedule links)
 * - Notification email to host
 */
export async function notifyBookingCreated({
  booking,
  host,
  eventType,
}: NotifyBookingCreatedParams): Promise<void> {
  const startTime = DateTime.fromJSDate(booking.startTime).setZone(
    booking.timezone
  )
  const endTime = DateTime.fromJSDate(booking.endTime).setZone(booking.timezone)

  const startFormatted = startTime.toFormat("cccc, LLLL d, yyyy 'at' h:mm a")
  const endFormatted = endTime.toFormat("h:mm a")

  const baseUrl = serverEnv.BOOKING_MANAGE_BASE_URL

  // Send confirmation to attendee
  if (booking.attendeeEmail) {
    await sendBookingConfirmation({
      to: booking.attendeeEmail,
      attendeeName: booking.attendeeName ?? "Guest",
      hostName: host.name,
      hostEmail: host.email,
      eventTitle: booking.title ?? eventType.title,
      startTime: startFormatted,
      endTime: endFormatted,
      timezone: booking.timezone,
      location: booking.location,
      meetingUrl: booking.meetingUrl,
      cancelUrl: `${baseUrl}/${booking.id}/cancel`,
      rescheduleUrl: `${baseUrl}/${booking.id}/reschedule`,
    })
  }

  // TODO: Send notification to host
  // await sendBookingNotificationToHost({ ... })
}

interface NotifyBookingCancelledParams {
  booking: Booking
  host: BusinessUser
  eventType: EventType | null
  reason?: string | null
}

/**
 * Send all notifications for a cancelled booking
 */
export async function notifyBookingCancelled({
  booking,
  host,
  eventType,
  reason,
}: NotifyBookingCancelledParams): Promise<void> {
  // TODO: Implement cancellation emails
  // - Email to attendee confirming cancellation
  // - Email to host notifying of cancellation
}

interface NotifyBookingRescheduledParams {
  booking: Booking
  host: BusinessUser
  eventType: EventType | null
  previousStartTime: Date
  previousEndTime: Date
}

/**
 * Send all notifications for a rescheduled booking
 */
export async function notifyBookingRescheduled({
  booking,
  host,
  eventType,
  previousStartTime,
  previousEndTime,
}: NotifyBookingRescheduledParams): Promise<void> {
  // TODO: Implement reschedule emails
  // - Email to attendee with new time and cancel/reschedule links
  // - Email to host notifying of reschedule
}
