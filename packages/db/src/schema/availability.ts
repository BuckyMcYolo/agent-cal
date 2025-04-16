import {
  pgTable,
  text,
  timestamp,
  boolean,
  uuid,
  integer,
  index,
  time,
  pgEnum,
  check,
} from "drizzle-orm/pg-core"
import { relations, sql } from "drizzle-orm"
import { user, organization } from "./auth"

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

// 2. Weekly schedule slots table - for type safety
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

// 3. Exceptions table (timestampe ranges when regular schedule is modified)
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
