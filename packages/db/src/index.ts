import { serverEnv } from "@workspace/env-config"
import {
  and,
  asc,
  avg,
  between,
  count,
  desc,
  eq,
  getTableColumns,
  gt,
  gte,
  ilike,
  inArray,
  isNotNull,
  isNull,
  like,
  lt,
  lte,
  max,
  min,
  ne,
  not,
  notInArray,
  or,
  sql,
  sum,
} from "drizzle-orm"
import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as attendeeSchema from "./schema/attendee"
import * as betterAuthSchema from "./schema/auth"
import * as availabilitySchema from "./schema/availability"
import * as bookingSchema from "./schema/booking"
import * as bookingHostSchema from "./schema/booking-host"
import * as eventHostSchema from "./schema/event-host"
import * as eventTypeSchema from "./schema/event-types"
import * as taskSchema from "./schema/tasks"
import * as userPreferencesSchema from "./schema/user-preferences"

const client = postgres(serverEnv.DATABASE_URL)
export const db = drizzle({
  client,
  casing: "snake_case",
  schema: {
    ...betterAuthSchema,
    ...taskSchema,
    ...bookingSchema,
    ...bookingHostSchema,
    ...eventTypeSchema,
    ...eventHostSchema,
    ...availabilitySchema,
    ...attendeeSchema,
    ...userPreferencesSchema,
  },
})

export {
  // Comparison operators
  eq, // Equal
  ne, // Not equal
  gt, // Greater than
  gte, // Greater than or equal
  lt, // Less than
  lte, // Less than or equal
  isNull, // Is NULL
  isNotNull, // Is NOT NULL
  inArray, // IN (...)
  notInArray, // NOT IN (...)
  // Logical operators
  and, // AND
  or, // OR
  not, // NOT
  // Range operator
  between, // BETWEEN x AND y
  // String operators
  like, // LIKE pattern
  ilike, // ILIKE pattern (case insensitive)
  // Order functions
  asc, // ORDER BY column ASC
  desc, // ORDER BY column DESC
  // SQL functions
  sql, // Raw SQL
  // Aggregate functions
  count, // COUNT(column)
  sum, // SUM(column)
  avg, // AVG(column)
  min, // MIN(column)
  max, // MAX(column)
  // Table utilities
  getTableColumns, // Get all columns from a table
}
