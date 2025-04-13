import { integer, json, pgEnum, uuid } from "drizzle-orm/pg-core"
import { pgTable, text, timestamp, boolean } from "drizzle-orm/pg-core"
import { user, organization } from "./auth"
import { eventType } from "./event-types"

export const bookingStatusEnum = pgEnum("booking_status", [
  "SCHEDULED",
  "CANCELLED",
  "COMPLETED",
  "RESCHEDULED",
  "NO_SHOW",
])

// Now let's expand our booking table to support the event types
export const booking = pgTable("booking", {
  id: uuid().primaryKey().unique().defaultRandom(),
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
  userId: text()
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  organizationId: text().references(() => organization.id, {
    onDelete: "cascade",
  }),
  eventTypeId: uuid().references(() => eventType.id, {
    onDelete: "set null",
  }),

  // Guest information
  // guestName: text().notNull(),
  // guestEmail: text().notNull(),
  // guestPhone: text(),
  // guestCount: integer().default(1),

  // -------------FUTURE REFERENCE----------------
  // attendees: []
  // attendees will be an array of ogjects containing the following fields:
  //   - name: string
  //   - email: string
  //   - phoneNumber: string
  //   - timeZone: string
  //   - locale : string (default to en-US)
  //   - status: string (default to accepted)

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
})
