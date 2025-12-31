import { serverEnv } from "@workspace/env-config/server"
import type { Booking } from "@workspace/db/schema/booking"
import type { BusinessUser } from "@workspace/db/schema/business-user"
import type { eventType } from "@workspace/db/schema/event-type"
import { DateTime } from "luxon"
import {
  sendBookingConfirmation,
  sendBookingHostNotification,
  sendBookingCancelled,
  sendBookingRescheduled,
} from "@/services/email"
import { generateIcs } from "@/lib/calendar/ics"

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
  const eventTitle = booking.title ?? eventType.title

  // Generate .ics calendar invite
  const icsContent = generateIcs({
    id: booking.id,
    title: eventTitle,
    description: booking.description,
    startTime,
    endTime,
    location: booking.location,
    meetingUrl: booking.meetingUrl,
    organizerName: host.name,
    organizerEmail: host.email,
    attendeeName: booking.attendeeName ?? "Guest",
    attendeeEmail: booking.attendeeEmail,
    status: "confirmed",
    method: "REQUEST",
  })

  // Send confirmation to attendee
  if (booking.attendeeEmail) {
    await sendBookingConfirmation({
      to: booking.attendeeEmail,
      attendeeName: booking.attendeeName ?? "Guest",
      hostName: host.name,
      hostEmail: host.email,
      eventTitle,
      startTime: startFormatted,
      endTime: endFormatted,
      timezone: booking.timezone,
      location: booking.location,
      meetingUrl: booking.meetingUrl,
      cancelUrl: `${baseUrl}/${booking.id}/cancel`,
      rescheduleUrl: `${baseUrl}/${booking.id}/reschedule`,
      icsContent,
    })
  }

  // Send notification to host
  await sendBookingHostNotification({
    to: host.email,
    hostName: host.name,
    attendeeName: booking.attendeeName ?? "Guest",
    attendeeEmail: booking.attendeeEmail,
    eventTitle: booking.title ?? eventType.title,
    startTime: startFormatted,
    endTime: endFormatted,
    timezone: booking.timezone,
    location: booking.location,
    meetingUrl: booking.meetingUrl,
    manageUrl: `${baseUrl}/${booking.id}`,
  })
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
  const startTime = DateTime.fromJSDate(booking.startTime).setZone(
    booking.timezone
  )
  const endTime = DateTime.fromJSDate(booking.endTime).setZone(booking.timezone)

  const startFormatted = startTime.toFormat("cccc, LLLL d, yyyy 'at' h:mm a")
  const endFormatted = endTime.toFormat("h:mm a")
  const eventTitle = booking.title ?? eventType?.title ?? "Meeting"

  // Send cancellation email to attendee
  if (booking.attendeeEmail) {
    await sendBookingCancelled({
      to: booking.attendeeEmail,
      recipientName: booking.attendeeName ?? "Guest",
      otherPartyName: host.name,
      eventTitle,
      startTime: startFormatted,
      endTime: endFormatted,
      timezone: booking.timezone,
      reason,
      isHost: false,
    })
  }

  // Send cancellation email to host
  await sendBookingCancelled({
    to: host.email,
    recipientName: host.name,
    otherPartyName: booking.attendeeName ?? "Guest",
    eventTitle,
    startTime: startFormatted,
    endTime: endFormatted,
    timezone: booking.timezone,
    reason,
    isHost: true,
  })
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
  const oldStart = DateTime.fromJSDate(previousStartTime).setZone(
    booking.timezone
  )
  const oldEnd = DateTime.fromJSDate(previousEndTime).setZone(booking.timezone)
  const newStart = DateTime.fromJSDate(booking.startTime).setZone(
    booking.timezone
  )
  const newEnd = DateTime.fromJSDate(booking.endTime).setZone(booking.timezone)

  const oldStartFormatted = oldStart.toFormat("cccc, LLLL d, yyyy 'at' h:mm a")
  const oldEndFormatted = oldEnd.toFormat("h:mm a")
  const newStartFormatted = newStart.toFormat("cccc, LLLL d, yyyy 'at' h:mm a")
  const newEndFormatted = newEnd.toFormat("h:mm a")

  const eventTitle = booking.title ?? eventType?.title ?? "Meeting"
  const baseUrl = serverEnv.BOOKING_MANAGE_BASE_URL

  // Send reschedule email to attendee
  if (booking.attendeeEmail) {
    await sendBookingRescheduled({
      to: booking.attendeeEmail,
      recipientName: booking.attendeeName ?? "Guest",
      otherPartyName: host.name,
      eventTitle,
      oldStartTime: oldStartFormatted,
      oldEndTime: oldEndFormatted,
      newStartTime: newStartFormatted,
      newEndTime: newEndFormatted,
      timezone: booking.timezone,
      location: booking.location,
      meetingUrl: booking.meetingUrl,
      isHost: false,
      cancelUrl: `${baseUrl}/${booking.id}/cancel`,
      rescheduleUrl: `${baseUrl}/${booking.id}/reschedule`,
    })
  }

  // Send reschedule email to host
  await sendBookingRescheduled({
    to: host.email,
    recipientName: host.name,
    otherPartyName: booking.attendeeName ?? "Guest",
    eventTitle,
    oldStartTime: oldStartFormatted,
    oldEndTime: oldEndFormatted,
    newStartTime: newStartFormatted,
    newEndTime: newEndFormatted,
    timezone: booking.timezone,
    location: booking.location,
    meetingUrl: booking.meetingUrl,
    isHost: true,
  })
}
