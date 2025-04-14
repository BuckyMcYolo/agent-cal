import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as betterAuthSchema from "./schema/auth"
import * as taskSchema from "./schema/tasks"
import * as bookingSchema from "./schema/booking"
import { serverEnv } from "@workspace/env-config"
import {
  eq,
  ne,
  gt,
  gte,
  lt,
  lte,
  isNull,
  isNotNull,
  inArray,
  notInArray,
  and,
  or,
  not,
  between,
  like,
  ilike,
  asc,
  desc,
  sql,
  count,
  sum,
  avg,
  min,
  max,
  getTableColumns,
} from "drizzle-orm"

const client = postgres(serverEnv.DATABASE_URL)
export const db = drizzle({
  client,
  logger: true,
  casing: "snake_case",
  schema: { ...betterAuthSchema, ...taskSchema, ...bookingSchema },
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
