import env from "@workspace/env-config"
import { defineConfig } from "drizzle-kit"

export default defineConfig({
  out: "./migrations",
  schema: "./src/schema",
  dialect: "postgresql",
  dbCredentials: {
    url: env.DATABASE_URL,
  },
})
