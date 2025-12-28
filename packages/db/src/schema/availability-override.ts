import { sql } from "drizzle-orm"
import {
  boolean,
  check,
  date,
  index,
  pgTable,
  time,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core"
import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import { availabilitySchedule } from "./availability-schedule"

/**
 * Availability Override - Date-specific availability that overrides weekly rules.
 *
 * Two use cases:
 * 1. isAvailable = false: Date is completely unavailable (holiday, time off)
 * 2. isAvailable = true + startTime/endTime: Custom hours for that date
 *
 * If isAvailable is true but no times are set, the weekly rules apply.
 */
export const availabilityOverride = pgTable(
  "availability_override",
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
    date: date("date").notNull(),
    isAvailable: boolean("is_available").notNull().default(true),
    startTime: time("start_time"), // Only used if isAvailable = true
    endTime: time("end_time"), // Only used if isAvailable = true
  },
  (table) => [
    index("availability_override_schedule_idx").on(table.scheduleId),
    index("availability_override_date_idx").on(table.date),
    // Unique constraint: one override per date per schedule
    unique("availability_override_schedule_date_unique").on(
      table.scheduleId,
      table.date
    ),
    // If times are provided, ensure startTime < endTime
    check(
      "override_time_check",
      sql`${table.startTime} IS NULL OR ${table.endTime} IS NULL OR ${table.startTime} < ${table.endTime}`
    ),
  ]
)

export const selectAvailabilityOverrideSchema =
  createSelectSchema(availabilityOverride)
export const insertAvailabilityOverrideSchema = createInsertSchema(
  availabilityOverride
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})
export const updateAvailabilityOverrideSchema =
  insertAvailabilityOverrideSchema.partial()

export type AvailabilityOverride = typeof availabilityOverride.$inferSelect
export type NewAvailabilityOverride = typeof availabilityOverride.$inferInsert
