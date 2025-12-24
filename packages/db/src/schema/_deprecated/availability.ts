import { relations, sql } from "drizzle-orm"
import {
  boolean,
  check,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  time,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core"
import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import { z } from "zod"
import { organization, user } from "../auth"
import { eventType } from "../event-type"

export const exceptionTypeEnum = pgEnum("exception_type", [
  "BLOCK", // Blocks time off (unavailable)
  "ALLOW", // Makes time available (overrides blocks)
])

// 1. Main availability schedule table
export const availabilitySchedule = pgTable(
  "availability_schedule",
  {
    id: uuid().primaryKey().defaultRandom(),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp()
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    name: text().notNull(), // e.g., "Standard Work Hours", "Summer Hours"
    timeZone: text().notNull(),
    ownerId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    organizationId: text().references(() => organization.id, {
      onDelete: "cascade",
    }),
    // Is this the default schedule for the owner?
    isDefault: boolean().default(false),
  },
  (t) => [
    index("availability_schedule_owner_idx").on(t.ownerId),
    index("availability_schedule_org_idx").on(t.organizationId),
  ]
)

export const selectAvailabilitySchema = createSelectSchema(availabilitySchedule)

export const insertAvailabilitySchema = createInsertSchema(
  availabilitySchedule,
  {
    name: (schema) => schema.min(1).max(255),
  }
)
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    isDefault: true,
    ownerId: true,
    organizationId: true,
    timeZone: true,
  })
  .required({
    name: true,
  })
export const updateTasksSchema = insertAvailabilitySchema.partial()

// 2. Weekly schedule slots table - for type safety
// ex. Sunday null
// ex. Monday 9am-5pm
// ex. Tuesday 8am-12pm & 1pm-5pm
// ex. Wednesday 9am-5pm
// ex. Thursday 9am-5pm
// ex. Friday 9am-12pm
// ex. Saturday null
export const weeklyScheduleSlot = pgTable(
  "weekly_schedule_slot",
  {
    id: uuid().primaryKey().defaultRandom(),
    // Link to parent schedule
    scheduleId: uuid()
      .notNull()
      .references(() => availabilitySchedule.id, { onDelete: "cascade" }),

    // Day of week as integer (0-6, Sunday-Saturday)
    // This matches JavaScript's Date.getDay()
    dayOfWeek: integer().notNull(),
    startTime: time().notNull(),
    endTime: time().notNull(),
  },
  (t) => [
    index("weekly_slot_schedule_idx").on(t.scheduleId),
    index("weekly_slot_day_idx").on(t.dayOfWeek),
    // Ensure dayOfWeek is between 0 and 6
    check(
      "weekly_slot_day_check",
      sql`${t.dayOfWeek} >= 0 AND ${t.dayOfWeek} <= 6`
    ),
  ]
)

export const selectWeeklyScheduleSchema = createSelectSchema(weeklyScheduleSlot)
export const insertWeeklyScheduleSchema = createInsertSchema(
  weeklyScheduleSlot
).omit({
  id: true,
  scheduleId: true,
})

export const updateWeeklyScheduleSchema = insertWeeklyScheduleSchema.partial()

// 3. Exceptions table (timestamp ranges when regular schedule is modified)
export const availabilityException = pgTable(
  "availability_exception",
  {
    id: uuid().primaryKey().defaultRandom(),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp()
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),

    scheduleId: uuid()
      .notNull()
      .references(() => availabilitySchedule.id, { onDelete: "cascade" }),

    exceptionStartTime: timestamp().notNull(),
    exceptionEndTime: timestamp().notNull(),

    title: text(),

    exceptionType: exceptionTypeEnum("exception_type")
      .notNull()
      .default("BLOCK"),
  },
  (t) => [
    index("availability_exception_schedule_idx").on(t.scheduleId),
    index("availability_exception_time_range_idx").on(
      t.exceptionStartTime,
      t.exceptionEndTime
    ),
  ]
)

// 4. Exception time slots (for overriding regular schedule with specific available times)
export const exceptionTimeSlot = pgTable(
  "exception_time_slot",
  {
    id: uuid().primaryKey().defaultRandom(),

    exceptionId: uuid()
      .notNull()
      .references(() => availabilityException.id, { onDelete: "cascade" }),

    overrideStartTime: timestamp().notNull(),
    overrideEndTime: timestamp().notNull(),
  },
  (t) => [index("exception_slot_exception_idx").on(t.exceptionId)]
)

// Relations
export const availabilityScheduleRelations = relations(
  availabilitySchedule,
  ({ one, many }) => ({
    owner: one(user, {
      fields: [availabilitySchedule.ownerId],
      references: [user.id],
    }),
    organization: one(organization, {
      fields: [availabilitySchedule.organizationId],
      references: [organization.id],
    }),
    weeklySlots: many(weeklyScheduleSlot),
    exceptions: many(availabilityException),
    eventTypes: many(eventType),
  })
)

export const weeklyScheduleSlotRelations = relations(
  weeklyScheduleSlot,
  ({ one }) => ({
    schedule: one(availabilitySchedule, {
      fields: [weeklyScheduleSlot.scheduleId],
      references: [availabilitySchedule.id],
    }),
  })
)

export const availabilityExceptionRelations = relations(
  availabilityException,
  ({ one, many }) => ({
    schedule: one(availabilitySchedule, {
      fields: [availabilityException.scheduleId],
      references: [availabilitySchedule.id],
    }),
    timeSlots: many(exceptionTimeSlot),
  })
)

export const exceptionTimeSlotRelations = relations(
  exceptionTimeSlot,
  ({ one }) => ({
    exception: one(availabilityException, {
      fields: [exceptionTimeSlot.exceptionId],
      references: [availabilityException.id],
    }),
  })
)

export const selectAvailabilitySchemaWithWeeklySlots = createSelectSchema(
  availabilitySchedule
).extend({
  weeklySlots: z.array(selectWeeklyScheduleSchema),
})
