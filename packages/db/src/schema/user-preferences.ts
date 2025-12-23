import {
  boolean,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core"
import { user } from "./auth"
import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import { relations } from "drizzle-orm"

export const userPreferences = pgTable("user_preferences", {
  id: uuid().primaryKey().defaultRandom(),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp()
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
  userId: text()
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  timezone: text().default("America/New_York").notNull(),
  //ONBOARDING QUESTIONS
  calendarService: text(), // "googleCalendar", "outlookCalendar", etc.
  shouldShowFullTour: boolean().default(false).notNull(),
  schedulingPreference: text(), // "inPerson", "online", "both"
  referralSource: text(), // "google", "social media", etc.
  onboardingCompleted: boolean().default(false).notNull(),
})

export const userPreferencesRelations = relations(
  userPreferences,
  ({ one }) => ({
    user: one(user, {
      fields: [userPreferences.userId],
      references: [user.id],
    }),
  })
)

export const selectUserPreferences = createSelectSchema(userPreferences)

export const insertUserPreferences = createInsertSchema(
  userPreferences,
  {}
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})

export const insertOnboardingPreferences = createInsertSchema(
  userPreferences,
  {}
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})

export const updateUserPreferences = insertUserPreferences.partial()
