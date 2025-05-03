import {
  boolean,
  pgTable,
  text,
  timestamp,
  pgEnum,
  uuid,
} from "drizzle-orm/pg-core"
import { user } from "./auth"
import { createInsertSchema, createSelectSchema } from "drizzle-zod"

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
