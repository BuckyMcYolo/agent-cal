import { pgTable, text, timestamp, boolean, uuid } from "drizzle-orm/pg-core"
import { booking } from "./booking"
import { relations } from "drizzle-orm"

export const attendee = pgTable("attendee", {
  id: uuid().primaryKey().unique().defaultRandom(),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp()
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
  bookingId: uuid()
    .notNull()
    .references(() => booking.id, { onDelete: "set null" }),
  name: text().notNull(),
  email: text().notNull(),
  phone: text(),
  timeZone: text(),
  locale: text(),
  noShow: boolean().default(false),
})

export const attendeeRelations = relations(attendee, ({ one }) => ({
  booking: one(booking, {
    fields: [attendee.bookingId],
    references: [booking.id],
  }),
}))
