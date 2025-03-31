import { uuid } from "drizzle-orm/pg-core"
import { pgTable, text, timestamp, boolean } from "drizzle-orm/pg-core"

export const booking = pgTable("booking", {
  id: uuid("id").primaryKey().unique().defaultRandom(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
})
