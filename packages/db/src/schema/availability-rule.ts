import { sql } from "drizzle-orm"
import {
  check,
  index,
  integer,
  pgTable,
  time,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core"
import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import { availabilitySchedule } from "./availability-schedule"

/**
 * Availability Rule - A weekly recurring time slot within a schedule.
 *
 * Multiple rules can exist per schedule to define complex availability patterns.
 * For example, Monday 9am-12pm and 1pm-5pm (with a lunch break).
 */
export const availabilityRule = pgTable(
  "availability_rule",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    scheduleId: uuid("schedule_id")
      .notNull()
      .references(() => availabilitySchedule.id, { onDelete: "cascade" }),
    dayOfWeek: integer("day_of_week").notNull(), // 0-6, Sunday=0
    startTime: time("start_time").notNull(),
    endTime: time("end_time").notNull(),
  },
  (table) => [
    index("availability_rule_schedule_idx").on(table.scheduleId),
    index("availability_rule_day_idx").on(table.dayOfWeek),
    check(
      "day_of_week_check",
      sql`${table.dayOfWeek} >= 0 AND ${table.dayOfWeek} <= 6`
    ),
  ]
)

// Relations are defined in relations.ts to avoid circular dependencies

export const selectAvailabilityRuleSchema = createSelectSchema(availabilityRule)
export const insertAvailabilityRuleSchema = createInsertSchema(
  availabilityRule,
  {
    dayOfWeek: (schema) => schema.min(0).max(6),
  }
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})
export const updateAvailabilityRuleSchema =
  insertAvailabilityRuleSchema.partial()

export type AvailabilityRule = typeof availabilityRule.$inferSelect
export type NewAvailabilityRule = typeof availabilityRule.$inferInsert
