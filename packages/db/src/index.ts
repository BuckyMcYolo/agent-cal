import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as userSchema from "./schema/users"
import * as orgSchema from "./schema/organizations"
import env from "@workspace/env-config"

const client = postgres(env.DATABASE_URL)
export const db = drizzle({
  client,
  logger: true,
  casing: "snake_case",
  schema: { ...userSchema, ...orgSchema },
})
