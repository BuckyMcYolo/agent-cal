import "dotenv/config"
import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import { config } from "dotenv"
import * as userSchema from "./schema/users"
import * as orgSchema from "./schema/organizations"

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be a valid postgres connection string")
}

const client = postgres(process.env.DATABASE_URL!)
export const db = drizzle({
  client,
  logger: true,
  casing: "snake_case",
  schema: { ...userSchema, ...orgSchema },
})
