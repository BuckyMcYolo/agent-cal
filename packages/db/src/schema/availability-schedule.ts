import {
  boolean,
  index,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core"
import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import { businessUser } from "./business-user"

/**
 * Availability Schedule - A named collection of availability rules.
 *
 * Each business user can have multiple schedules (e.g., "Standard Hours", "Summer Hours").
 * One schedule can be marked as the default for the user.
 * Event types can optionally reference a specific schedule, or use the user's default.
 */
export const availabilitySchedule = pgTable(
  "availability_schedule",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    businessUserId: uuid("business_user_id")
      .notNull()
      .references(() => businessUser.id, { onDelete: "cascade" }),
    name: text("name").notNull(), // e.g., "Standard Hours", "Summer Hours", "On-Call"
    timezone: text("timezone").notNull().default("UTC"),
    isDefault: boolean("is_default").notNull().default(false),
  },
  (table) => [
    index("availability_schedule_user_idx").on(table.businessUserId),
    index("availability_schedule_default_idx").on(
      table.businessUserId,
      table.isDefault
    ),
  ]
)

// Relations are defined in _relations.ts to avoid circular dependencies

export const selectAvailabilityScheduleSchema =
  createSelectSchema(availabilitySchedule)
export const insertAvailabilityScheduleSchema = createInsertSchema(
  availabilitySchedule,
  {
    name: (schema) => schema.min(1).max(255),
  }
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})
export const updateAvailabilityScheduleSchema =
  insertAvailabilityScheduleSchema.partial()

export type AvailabilitySchedule = typeof availabilitySchedule.$inferSelect
export type NewAvailabilitySchedule = typeof availabilitySchedule.$inferInsert
