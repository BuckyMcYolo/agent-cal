import { index, json, pgEnum, uuid } from "drizzle-orm/pg-core"
import { pgTable, text, timestamp, } from "drizzle-orm/pg-core"
import { user, organization } from "./auth"
import { eventType } from "./event-types"
import { relations } from "drizzle-orm"
import { attendee } from "./attendee"
import { bookingHost } from "./booking-host"

export const bookingStatusEnum = pgEnum("booking_status", [
  "SCHEDULED",
  "CANCELLED",
  "COMPLETED",
  "RESCHEDULED",
  "NO_SHOW",
])

// Now let's expand our booking table to support the event types
export const booking = pgTable(
  "booking",
  {
    id: uuid().primaryKey().defaultRandom(),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp()
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),

    // Scheduling information
    title: text().notNull(),
    description: text(),
    startTime: timestamp().notNull(),
    endTime: timestamp().notNull(),
    timezone: text().notNull(),

    // Relations

    // the user who created the inital eventType and therefore is the defaut owner of the booking and can edit it and delete/remove other hosts & guests
    ownerId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    organizationId: text().references(() => organization.id, {
      onDelete: "cascade",
    }),
    eventTypeId: uuid().references(() => eventType.id, {
      onDelete: "set null",
    }),

    status: bookingStatusEnum("status").notNull().default("SCHEDULED"),
    cancellationReason: text(),

    // AI agent information
    // handledByAgent: boolean().default(false),
    // agentId: uuid(),
    // agentType: text(), // type of agent (email, phone, chat, etc.)
    // agentNotes: text(),

    // Location information
    //--------------FUTURE REFERENCE-------------------------
    //   locationId: uuid(location_id"),
    // This will be a table to store structured location information depending on type (Zoom/Google links, meeting room details, phone numbers, etc.)

    // Custom data from the booking form
    //--------------FUTURE REFERENCE-------------------------
    // formResponses: uuid()
    // This will be a table to store the form responses from the booking form

    // Metadata for extensibility
    metadata: json(),
  },
  (t) => [
    index("booking_owner_idx").on(t.ownerId),
    index("booking_event_type_idx").on(t.eventTypeId),
    index("booking_organization_idx").on(t.organizationId),
    index("booking_start_time_idx").on(t.startTime),
    index("booking_end_time_idx").on(t.endTime),
  ]
)

export const bookingRelations = relations(booking, ({ one, many }) => ({
  owner: one(user, {
    fields: [booking.ownerId],
    references: [user.id],
  }),
  eventType: one(eventType, {
    fields: [booking.eventTypeId],
    references: [eventType.id],
  }),
  organization: one(organization, {
    fields: [booking.organizationId],
    references: [organization.id],
  }),
  attendees: many(attendee),
  bookingHosts: many(bookingHost),
}))
