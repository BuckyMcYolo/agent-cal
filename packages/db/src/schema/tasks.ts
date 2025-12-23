import { boolean, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"
import { createInsertSchema, createSelectSchema } from "drizzle-zod"

export const tasks = pgTable("tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
  done: boolean("done").notNull().default(false),
  name: text("name").notNull(),
})

export const selectTasksSchema = createSelectSchema(tasks)

export const insertTasksSchema = createInsertSchema(tasks, {
  name: (schema) => schema.min(1).max(255),
})
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  })
  .required({
    done: true,
    name: true,
  })

export const updateTasksSchema = insertTasksSchema.partial()
