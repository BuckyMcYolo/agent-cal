import {
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core"
import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import { business } from "./business"

export const businessUser = pgTable(
  "business_user",
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
    externalUserId: text("external_user_id"), // The org's internal ID for this user
    email: text("email").notNull(),
    name: text("name").notNull(),
    slug: text("slug").notNull(), // URL-friendly identifier: /business-slug/user-slug/event-type
    timezone: text("timezone").notNull().default("UTC"),
    metadata: jsonb("metadata"),
  },
  (table) => [
    index("business_user_business_idx").on(table.businessId),
    index("business_user_external_user_id_idx").on(table.externalUserId),
    index("business_user_email_idx").on(table.email),
    unique("business_user_business_slug_unique").on(
      table.businessId,
      table.slug
    ),
  ]
)

// Relations are defined in a separate relations file to avoid circular dependencies
// See: packages/db/src/schema/_relations.ts

export const selectBusinessUserSchema = createSelectSchema(businessUser)
export const insertBusinessUserSchema = createInsertSchema(businessUser).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})
export const updateBusinessUserSchema = insertBusinessUserSchema.partial()

export type BusinessUser = typeof businessUser.$inferSelect
export type NewBusinessUser = typeof businessUser.$inferInsert
