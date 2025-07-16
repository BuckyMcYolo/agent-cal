import {
  pgTable,
  text,
  timestamp,
  boolean,
  uuid,
  integer,
  json,
  pgEnum,
  unique,
  index,
} from "drizzle-orm/pg-core"
import { user, organization } from "./auth"
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-zod"
import { relations } from "drizzle-orm"
import { booking } from "./booking"
import { eventHost } from "./event-host"
import { availabilitySchedule } from "./availability"

// Define event type scheduling enum
export const schedulingTypeEnum = pgEnum("scheduling_type", [
  "ROUND_ROBIN",
  "COLLECTIVE",
  "INDIVIDUAL",
])

// Define event location type enum
export const eventLocationTypeEnum = pgEnum("event_location_type", [
  "IN_PERSON",
  "VIRTUAL",
  "PHONE",
])

// Define booking limit type enum
export const bookingLimitTypeEnum = pgEnum("booking_limit_type", [
  "PER_DAY",
  "PER_WEEK",
  "PER_MONTH",
  "FUTURE_DAYS",
])

export const eventType = pgTable(
  "event_type",
  {
    id: uuid().primaryKey().defaultRandom(),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp()
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),

    title: text().notNull(),
    slug: text().notNull(),
    description: text(), // description will be shown to end users (ie. 'This is a 30 minute call to discuss your needs')
    length: integer().notNull(), // Duration in minutes, must be in increments of 15 minutes
    // slotInterval: integer().default(15), // how long each time slot is in minutes (ie. 15, 30, 60), should be in increments of 15 minutes and by defult be the same as the length of the event type
    hidden: boolean().default(false), //whether the event type is hidden from the user interface and unable to be booked by end users
    listPosition: integer().default(0), // position of the event type in the list of event types (used for drag and drop ordering)

    // Relations
    ownerId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    organizationId: text().references(() => organization.id, {
      onDelete: "cascade",
    }),

    // Scheduling settings
    schedulingType: schedulingTypeEnum().default("INDIVIDUAL"),
    minimumBookingNotice: integer().default(60), // how many minutes in advance bookings must be made
    beforeEventBuffer: integer().default(0), //  buffer time before events in minutes (padding between meetings).
    afterEventBuffer: integer().default(0), // buffer time after events in minutes (padding between meetings).

    // Booking limits
    limitBookingFrequency: boolean().default(false), // whether to limit the number of bookings
    dailyFrequencyLimit: integer(),
    weeklyFrequencyLimit: integer(),
    monthlyFrequencyLimit: integer(),

    limitFutureBookings: boolean().default(false), // whether to limit the number of future bookings
    maxDaysInFuture: integer(),

    // Customization options
    requiresConfirmation: boolean().default(false),
    disableGuests: boolean().default(false), // removes the ability for guests to add other guests to the booking on the booking page

    // Location settings
    locationType: eventLocationTypeEnum().default("VIRTUAL"),
    //--------------FUTURE REFERENCE-------------------------
    //   locationId: uuid(location_id"),
    // This will be a table to store structured location information depending on type (Zoom/Google links, meeting room details, phone numbers, etc.)

    // Availability and calendar
    timeZone: text(),
    lockTimezone: boolean().default(false), // whether to lock the timezone to the event types's timezone (useful for scheduling in person meetings)

    // This will be a reference to a table that has the availability schedule for the event type
    availabilityScheduleId: uuid().references(() => availabilitySchedule.id, {
      onDelete: "set null",
    }),

    // Additional data
    //--------------FUTURE REFERENCE-------------------------
    // customForms: uuid(),
    // This will be a table to store custom questions/forms for the event type

    // AI Email Assistant Settings
    aiEmailAssistantEnabled: boolean().default(false), // whether the AI email assistant can use this event type for bookings
    // more tbd

    // AI Phone Assistant Settings
    aiPhoneAssistantEnabled: boolean().default(false), // whether the AI phone assistant can use this event type for bookings
    // more tbd

    metadata: json(), // For extensibility/ not sure if we need this yet
    //TODO: add a unique constraint to prevent duplicate event types for the same user/organization
    // TODO add a unique constraint to prevent duplicate event types with the same slug for the same user/organization

    // @@unique([userId, slug])
    // @@unique([teamId, slug])
    // @@unique([userId, parentId])
  },
  (t) => [
    unique("unique_org_slug").on(t.slug, t.organizationId),
    unique("unique_user_slug").on(t.slug, t.ownerId),
    index("user_id_index").on(t.ownerId),
    index("organization_id_index").on(t.organizationId),
  ]
)

export const eventTypeRelations = relations(eventType, ({ one, many }) => ({
  owner: one(user, {
    fields: [eventType.ownerId],
    references: [user.id],
  }),
  organization: one(organization, {
    fields: [eventType.organizationId],
    references: [organization.id],
  }),
  availabilitySchedule: one(availabilitySchedule, {
    fields: [eventType.availabilityScheduleId],
    references: [availabilitySchedule.id],
  }),
  bookings: many(booking),
  eventHosts: many(eventHost),
}))

export const selectEventTypeSchema = createSelectSchema(eventType)

export const insertEventTypeSchema = createInsertSchema(eventType, {
  title: (schema) => schema.min(1).max(255),
  slug: (schema) => schema.min(1).max(255),
  description: (schema) => schema.max(1000).optional(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})

export const updateTasksSchema = insertEventTypeSchema.partial()
