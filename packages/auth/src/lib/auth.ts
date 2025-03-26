import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { admin, organization, apiKey, openAPI } from "better-auth/plugins"
import { db } from "@workspace/db"

import dotenv from "dotenv"

dotenv.config()

export const auth: ReturnType<typeof betterAuth> = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),

  emailAndPassword: {
    enabled: true,
  },

  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          console.log("User created", user)
        },
      },
    },
  },

  plugins: [admin(), apiKey(), openAPI(), organization()],
})
