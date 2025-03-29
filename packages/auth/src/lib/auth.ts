import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import {
  admin,
  organization,
  apiKey,
  openAPI,
  emailOTP,
} from "better-auth/plugins"
import { db } from "@workspace/db"

export const auth = betterAuth({
  appName: "Booker",
  database: drizzleAdapter(db, {
    provider: "pg",
  }),

  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      enabled: true,
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
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

  plugins: [
    admin(),
    apiKey(),
    openAPI(),
    organization(),
    emailOTP({
      async sendVerificationOTP({ email, otp, type }) {
        // Implement the sendVerificationOTP method to send the OTP to the user's email address
      },
    }),
  ],
})
