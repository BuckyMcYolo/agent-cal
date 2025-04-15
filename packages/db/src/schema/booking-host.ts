import {
  pgTable,
  uuid,
  timestamp,
  text,
  boolean,
  pgEnum,
  json,
  index,
} from "drizzle-orm/pg-core"
import { booking } from "./booking"
import { user } from "./auth"
import { relations } from "drizzle-orm"

export const hostStatusEnum = pgEnum("host_status", [
  "PENDING",
  "ACCEPTED",
  "DECLINED",
])

// This table is for tracking the actual host assignments for each booking
// This is different from the event-host table which only store the available hosts for each event type

export const bookingHost = pgTable(
  "booking_host",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    // When this host assignment was created and updated
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),

    // Link to the specific booking
    bookingId: uuid("booking_id")
      .notNull()
      .references(() => booking.id, { onDelete: "cascade" }),

    // Link to the user who is hosting
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    // Assignment status
    status: hostStatusEnum("status").default("PENDING"),

    // Optional decline reason
    declineReason: text("decline_reason"),

    // Whether this host should receive notifications for this booking
    receiveNotifications: boolean("receive_notifications").default(true),

    // Whether this is the primary host for this booking
    isPrimary: boolean("is_primary").default(false),

    // For any additional data
    metadata: json("metadata"),

    // Prevent duplicate assignments
    // This would be implemented as a unique constraint in SQL
    // UNIQUE(bookingId, userId)
  },
  (t) => [
    index("booking_host_booking_user_idx").on(t.bookingId, t.userId),
    index("booking_host_user_idx").on(t.userId),
    index("booking_host_booking_idx").on(t.bookingId),
    index("booking_host_status_idx").on(t.status),
  ]
)

export const bookingHostRelations = relations(bookingHost, ({ one }) => ({
  booking: one(booking, {
    fields: [bookingHost.bookingId],
    references: [booking.id],
  }),
  user: one(user, {
    fields: [bookingHost.userId],
    references: [user.id],
  }),
}))
