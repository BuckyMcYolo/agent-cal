import {
  pgTable,
  text,
  timestamp,
  boolean,
  uuid,
  integer,
  json,
  pgEnum,
} from "drizzle-orm/pg-core"
import { user, organization } from "./auth"
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-zod"

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

export const eventType = pgTable("event_type", {
  id: uuid().primaryKey().unique().defaultRandom(),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp()
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),

  title: text().notNull(),
  slug: text().notNull().unique(),
  description: text(), // description will be shown to end users (ie. 'This is a 30 minute call to discuss your needs')
  length: integer().notNull(), // Duration in minutes, must be in increments of 15 minutes
  slotInterval: integer().default(15), // how long each time slot is in minutes (ie. 15, 30, 60), should be in increments of 15 minutes and by defult be the same as the length of the event type
  hidden: boolean().default(false), //whether the event type is hidden from the user interface and unable to be booked by end users
  listPosition: integer().default(0), // position of the event type in the list of event types (used for drag and drop ordering)

  userId: text()
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
  //--------------FUTURE REFERENCE-------------------------
  //   hosts: uuid("hosts"), // This will be a table to store the hosts for the event type (ie. the people who can be booked for this event type)

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

  //--------------FUTURE REFERENCE-------------------------
  //   availabilityScheduleId: uuid("availability_schedule_id"),
  // This will be a reference to a table that has the availability schedule for the event type

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
})
