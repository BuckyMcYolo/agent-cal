import { serverEnv } from "@workspace/env-config/server"
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
// Centralized relations (to avoid circular dependencies)
import * as relationsSchema from "./schema/_relations"
// Core auth schema (Better Auth + AgentCal extensions)
import * as authSchema from "./schema/auth"
import * as availabilityRuleSchema from "./schema/availability-rule"
import * as availabilityScheduleSchema from "./schema/availability-schedule"
import * as bookingSchema from "./schema/booking"
// New multi-tenant API schema
import * as businessSchema from "./schema/business"
import * as businessUserSchema from "./schema/business-user"
import * as calendarConnectionSchema from "./schema/calendar-connection"
import * as eventTypeSchema from "./schema/event-type"

const client = postgres(serverEnv.DATABASE_URL)
export const db = drizzle({
  client,
  casing: "snake_case",
  schema: {
    ...authSchema,
    ...businessSchema,
    ...businessUserSchema,
    ...calendarConnectionSchema,
    ...eventTypeSchema,
    ...availabilityScheduleSchema,
    ...availabilityRuleSchema,
    ...bookingSchema,
    ...relationsSchema,
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
