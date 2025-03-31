import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as betterAuthSchema from "./schema/auth"
import * as taskSchema from "./schema/tasks"
import * as bookingSchema from "./schema/bookings"
import env from "@workspace/env-config"

const client = postgres(env.DATABASE_URL)
export const db = drizzle({
  client,
  logger: true,
  casing: "snake_case",
  schema: { ...betterAuthSchema, ...taskSchema, ...bookingSchema },
})
