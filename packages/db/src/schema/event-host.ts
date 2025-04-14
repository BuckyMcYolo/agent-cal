import {
  uuid,
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
} from "drizzle-orm/pg-core"
import { user } from "./auth"
import { eventType } from "./event-types"
import { relations } from "drizzle-orm"

// This table will store the available hosts for each event type
export const eventHost = pgTable("event_host", {
  id: uuid().primaryKey().unique().defaultRandom(),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp()
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
  eventTypeId: uuid()
    .notNull()
    .references(() => eventType.id, { onDelete: "cascade" }),
  userId: text()
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  // Host configuration for round-robin
  isFixed: boolean().default(false), //  flag indicating if this host is fixed (always included) or part of a rotation in round-robin scheduling
  priority: integer(), // Numerical value determining the order of hosts in a round-robin rotation. Lower values typically indicate higher priority
  weight: integer(), // Numerical value determining the distribution weight for this host
  // Higher weights mean the host receives more bookings proportionally
  // For example, a host with weight 2 would receive twice as many bookings as a host with weight 1

  // -----------TODO-----------
  // Create a unique constraint to prevent duplicate hosts for same event type
  // This would be implemented as a unique constraint in SQL
})

export const eventHostRelations = relations(eventHost, ({ one }) => ({
  eventType: one(eventType, {
    fields: [eventHost.eventTypeId],
    references: [eventType.id],
  }),
  user: one(user, {
    fields: [eventHost.userId],
    references: [user.id],
  }),
}))
