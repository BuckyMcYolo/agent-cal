import {
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core"
import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import { organization } from "./auth"

export const business = pgTable(
  "business",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    referenceCustomerId: text("reference_customer_id"), // The org's internal ID for this business/customer
    name: text("name").notNull(),
    metadata: jsonb("metadata"),
  },
  (table) => [
    index("business_org_idx").on(table.organizationId),
    index("business_reference_customer_id_idx").on(table.referenceCustomerId),
  ]
)

// Relations are defined in a separate relations file to avoid circular dependencies
// See: packages/db/src/schema/_relations.ts

export const selectBusinessSchema = createSelectSchema(business)
export const insertBusinessSchema = createInsertSchema(business).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})
export const updateBusinessSchema = insertBusinessSchema.partial()

export type Business = typeof business.$inferSelect
export type NewBusiness = typeof business.$inferInsert
