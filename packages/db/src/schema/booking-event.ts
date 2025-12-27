import {
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core"
import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import { booking, bookingStatusEnum } from "./booking"

/**
 * Booking Event - Audit log for tracking booking lifecycle changes.
 *
 * Records all significant events in a booking's lifecycle for debugging,
 * customer support, and analytics purposes.
 *
 * Event types:
 * - created: Initial booking creation
 * - confirmed: Booking was confirmed
 * - rescheduled: Booking time was changed
 * - cancelled: Booking was cancelled
 * - completed: Meeting took place
 * - no_show: Attendee didn't show up
 */
export const bookingEvent = pgTable(
  "booking_event",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    bookingId: uuid("booking_id")
      .notNull()
      .references(() => booking.id, { onDelete: "cascade" }),
    eventType: text("event_type").notNull(), // "created", "confirmed", "rescheduled", "cancelled", "completed", "no_show"
    oldStatus: bookingStatusEnum("old_status"), // null for "created" events
    newStatus: bookingStatusEnum("new_status"),
    metadata: jsonb("metadata"), // { "reason": "customer requested", "previousStartTime": "...", "previousEndTime": "...", "actor": "system|user|attendee" }
  },
  (table) => [
    index("booking_event_booking_idx").on(table.bookingId),
    index("booking_event_event_type_idx").on(table.eventType),
    index("booking_event_created_at_idx").on(table.createdAt),
  ]
)

// Relations are defined in _relations.ts to avoid circular dependencies

export const selectBookingEventSchema = createSelectSchema(bookingEvent)
export const insertBookingEventSchema = createInsertSchema(bookingEvent).omit({
  id: true,
  createdAt: true,
})

export type BookingEvent = typeof bookingEvent.$inferSelect
export type NewBookingEvent = typeof bookingEvent.$inferInsert
