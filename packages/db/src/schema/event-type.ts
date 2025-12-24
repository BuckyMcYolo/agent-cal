import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core"
import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import { availabilitySchedule } from "./availability-schedule"
import { business } from "./business"

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
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    description: text("description"),
    durationMinutes: integer("duration_minutes").notNull(),
    bufferBefore: integer("buffer_before").notNull().default(0),
    bufferAfter: integer("buffer_after").notNull().default(0),
    minNoticeMinutes: integer("min_notice_minutes").notNull().default(60),
    maxDaysInAdvance: integer("max_days_in_advance"),
    availabilityScheduleId: uuid("availability_schedule_id").references(
      () => availabilitySchedule.id,
      { onDelete: "set null" }
    ), // Optional: if null, uses the schedulable user's default schedule
    metadata: jsonb("metadata"),
  },
  (table) => [
    index("event_type_business_idx").on(table.businessId),
    index("event_type_slug_idx").on(table.slug),
    unique("event_type_business_slug_unique").on(table.businessId, table.slug),
  ]
)

// Relations are defined in a separate relations file to avoid circular dependencies
// See: packages/db/src/schema/_relations.ts

export const selectEventTypeSchema = createSelectSchema(eventType)
export const insertEventTypeSchema = createInsertSchema(eventType, {
  durationMinutes: (schema) => schema.min(5).max(480), // 5 mins to 8 hours
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
