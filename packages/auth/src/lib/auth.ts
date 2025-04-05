import { betterAuth, type BetterAuthOptions } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import {
  admin,
  organization,
  apiKey,
  openAPI,
  emailOTP,
  bearer,
} from "better-auth/plugins"
import { db } from "@workspace/db"
// import { env } from "@workspace/env-config"

export const auth = betterAuth({
  appName: "Booker",
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  advanced: {
    cookiePrefix: "BS_", // booker session
  },

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

  plugins: [
    admin(),
    apiKey({
      defaultPrefix: "booker_",
    }),
    openAPI(),
    organization({}), //not currently working with typescript declaration files
    bearer({
      requireSignature: true, // By Default all cookie are signed using the better auth secret. See https://www.better-auth.com/docs/concepts/cookies
    }),
    emailOTP({
      async sendVerificationOTP({ email, otp, type }) {
        // Implement the sendVerificationOTP method to send the OTP to the user's email address
      },
    }),
  ],
})

export type UserSession = typeof auth.$Infer.Session
export type Session = typeof auth.$Infer.Session.session
export type User = typeof auth.$Infer.Session.user
