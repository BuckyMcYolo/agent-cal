import ical, { ICalCalendarMethod, ICalEventStatus } from "ical-generator"
import type { DateTime } from "luxon"

interface GenerateIcsParams {
  id: string
  title: string
  description?: string | null
  startTime: DateTime
  endTime: DateTime
  location?: string | null
  meetingUrl?: string | null
  organizerName: string
  organizerEmail: string
  attendeeName: string
  attendeeEmail: string
  status?: "confirmed" | "cancelled"
  method?: "REQUEST" | "CANCEL"
}

/**
 * Generate an .ics calendar file for a booking
 */
export function generateIcs(params: GenerateIcsParams): string {
  const calendar = ical({
    name: "AgentCal Booking",
    method:
      params.method === "CANCEL"
        ? ICalCalendarMethod.CANCEL
        : ICalCalendarMethod.REQUEST,
  })

  const event = calendar.createEvent({
    id: params.id,
    start: params.startTime.toJSDate(),
    end: params.endTime.toJSDate(),
    timezone: params.startTime.zoneName ?? "UTC",
    summary: params.title,
    description: params.description ?? undefined,
    location: params.meetingUrl ?? params.location ?? undefined,
    url: params.meetingUrl ?? undefined,
    status:
      params.status === "cancelled"
        ? ICalEventStatus.CANCELLED
        : ICalEventStatus.CONFIRMED,
    organizer: {
      name: params.organizerName,
      email: params.organizerEmail,
    },
  })

  event.createAttendee({
    name: params.attendeeName,
    email: params.attendeeEmail,
    rsvp: true,
  })

  return calendar.toString()
}

/**
 * Generate an .ics file as a Buffer for email attachment
 */
export function generateIcsBuffer(params: GenerateIcsParams): Buffer {
  return Buffer.from(generateIcs(params), "utf-8")
}
