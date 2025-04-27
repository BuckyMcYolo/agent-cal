import { serverEnv } from "@workspace/env-config"
import { defineConfig } from "drizzle-kit"

export default defineConfig({
  out: "./migrations",
  schema: "./src/schema",
  dialect: "postgresql",
  dbCredentials: {
    url: serverEnv.DATABASE_URL,
  },
  casing: "snake_case",
})
