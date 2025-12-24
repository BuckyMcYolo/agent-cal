import {
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core"
import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import { businessUser } from "./business-user"

export const calendarProviderEnum = pgEnum("calendar_provider", [
  "google",
  "microsoft",
])

export const calendarConnection = pgTable(
  "calendar_connection",
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
    provider: calendarProviderEnum("provider").notNull(),
    providerAccountId: text("provider_account_id"), // Google account ID
    email: text("email").notNull(), // Calendar email
    accessToken: text("access_token").notNull(), // Should be encrypted at rest
    refreshToken: text("refresh_token"), // Should be encrypted at rest
    tokenExpiresAt: timestamp("token_expires_at"),
    calendarId: text("calendar_id"), // Primary calendar ID
  },
  (table) => [
    index("calendar_connection_user_idx").on(table.businessUserId),
    index("calendar_connection_provider_idx").on(table.provider),
  ]
)

// Relations are defined in a separate relations file to avoid circular dependencies
// See: packages/db/src/schema/_relations.ts

export const selectCalendarConnectionSchema =
  createSelectSchema(calendarConnection)
export const insertCalendarConnectionSchema = createInsertSchema(
  calendarConnection
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})
export const updateCalendarConnectionSchema =
  insertCalendarConnectionSchema.partial()

export type CalendarConnection = typeof calendarConnection.$inferSelect
export type NewCalendarConnection = typeof calendarConnection.$inferInsert
