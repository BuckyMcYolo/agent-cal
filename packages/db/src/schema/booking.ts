import {
  index,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core"
import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import { business } from "./business"
import { businessUser } from "./business-user"
import { eventType } from "./event-type"

export const bookingStatusEnum = pgEnum("booking_status", [
  "pending",
  "confirmed",
  "cancelled",
  "completed",
  "no_show",
])

export const booking = pgTable(
  "booking",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    businessId: uuid("business_id")
      .notNull()
      .references(() => business.id, { onDelete: "cascade" }),
    businessUserId: uuid("business_user_id")
      .notNull()
      .references(() => businessUser.id, { onDelete: "cascade" }),
    eventTypeId: uuid("event_type_id").references(() => eventType.id, {
      onDelete: "set null",
    }),
    title: text("title").notNull(),
    description: text("description"),
    startTime: timestamp("start_time").notNull(),
    endTime: timestamp("end_time").notNull(),
    timezone: text("timezone").notNull(),
    status: bookingStatusEnum("status").notNull().default("pending"),
    calendarEventId: text("calendar_event_id"), // External calendar event ID
    // Attendee info (flattened - single attendee per booking for MVP)
    attendeeEmail: text("attendee_email").notNull(),
    attendeeName: text("attendee_name").notNull(),
    attendeeTimezone: text("attendee_timezone"),
    cancellationReason: text("cancellation_reason"),
    metadata: jsonb("metadata"),
  },
  (table) => [
    index("booking_business_idx").on(table.businessId),
    index("booking_user_idx").on(table.businessUserId),
    index("booking_event_type_idx").on(table.eventTypeId),
    index("booking_start_time_idx").on(table.startTime),
    index("booking_end_time_idx").on(table.endTime),
    index("booking_status_idx").on(table.status),
    index("booking_calendar_event_idx").on(table.calendarEventId),
  ]
)

// Relations are defined in a separate relations file to avoid circular dependencies
// See: packages/db/src/schema/_relations.ts

export const selectBookingSchema = createSelectSchema(booking)
export const insertBookingSchema = createInsertSchema(booking).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})
export const updateBookingSchema = insertBookingSchema.partial()

export type Booking = typeof booking.$inferSelect
export type NewBooking = typeof booking.$inferInsert
