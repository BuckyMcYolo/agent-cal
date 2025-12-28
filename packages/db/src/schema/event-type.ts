import {
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core"
import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import { availabilitySchedule } from "./availability-schedule"
import { business } from "./business"
import { businessUser } from "./business-user"

/**
 * Assignment Strategy - How to pick a user when multiple are available.
 *
 * - round_robin: Rotate evenly across all eligible users
 * - least_busy: Assign to user with fewest bookings this week
 * - random: Random selection among available users
 * - manual: Requires businessUserId in booking request (no auto-assign)
 */
export const assignmentStrategyEnum = pgEnum("assignment_strategy", [
  "round_robin",
  "least_busy",
  "random",
  "manual",
])

/**
 * Event Type - A bookable appointment type.
 *
 * Event types belong to a business and can optionally be assigned to a specific user:
 *
 * - businessUserId = NULL: "Book with anyone" - any available user can fulfill
 *   URL: agentcal.ai/acme-insurance/consultation
 *   System picks an available user at booking time using assignmentStrategy
 *
 * - businessUserId = set: "Book with John specifically"
 *   URL: agentcal.ai/acme-insurance/john/consultation
 *   Only that user's availability is considered
 */
export const eventType = pgTable(
  "event_type",
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
    businessUserId: uuid("business_user_id").references(() => businessUser.id, {
      onDelete: "set null",
    }), // Optional: if null, uses assignmentStrategy to pick user
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    description: text("description"),
    durationMinutes: integer("duration_minutes").notNull(),
    slotStepMinutes: integer("slot_step_minutes"), // Slot interval (defaults to durationMinutes if null)
    bufferBefore: integer("buffer_before").notNull().default(0),
    bufferAfter: integer("buffer_after").notNull().default(0),
    minNoticeMinutes: integer("min_notice_minutes").notNull().default(60),
    maxDaysInAdvance: integer("max_days_in_advance"),
    availabilityScheduleId: uuid("availability_schedule_id").references(
      () => availabilitySchedule.id,
      { onDelete: "set null" }
    ), // Optional: if null, uses the assigned user's default schedule
    // Assignment configuration (for "book with anyone" mode)
    assignmentStrategy: assignmentStrategyEnum("assignment_strategy")
      .notNull()
      .default("round_robin"),
    eligibleUserIds: uuid("eligible_user_ids").array(), // UUIDs of eligible users, or null = all business users
    metadata: jsonb("metadata"),
  },
  (table) => [
    index("event_type_business_idx").on(table.businessId),
    index("event_type_user_idx").on(table.businessUserId),
    index("event_type_slug_idx").on(table.slug),
    // Slug unique per business - allows simple URLs like /acme/consultation
    unique("event_type_business_slug_unique").on(table.businessId, table.slug),
  ]
)

// Relations are defined in a separate relations file to avoid circular dependencies
// See: packages/db/src/schema/_relations.ts

export const selectEventTypeSchema = createSelectSchema(eventType)
export const insertEventTypeSchema = createInsertSchema(eventType, {
  durationMinutes: (schema) => schema.min(5).max(480), // 5 mins to 8 hours
  slotStepMinutes: (schema) => schema.min(5).max(480).nullable(),
  bufferBefore: (schema) => schema.min(0).max(120),
  bufferAfter: (schema) => schema.min(0).max(120),
  minNoticeMinutes: (schema) => schema.min(0),
  maxDaysInAdvance: (schema) => schema.min(1).max(365).nullable(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})
export const updateEventTypeSchema = insertEventTypeSchema.partial()

export type EventType = typeof eventType.$inferSelect
export type NewEventType = typeof eventType.$inferInsert
