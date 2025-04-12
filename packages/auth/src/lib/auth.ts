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
import { serverEnv } from "@workspace/env-config"

export const auth = betterAuth({
  appName: "AgentCal",
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  advanced: {
    cookiePrefix: "AC", // AgentCal session
  },
  // Cookie cache
  // This is used to cache the session in a cookie for faster access
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
    },
  },
  //rate limiting
  rateLimit: {
    enabled: true,
    storage: "memory", //will add secondary storage later
    max: 50, // max requests
    window: 60, //60 seconds
  },

  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
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
  secret: serverEnv.BETTER_AUTH_SECRET,
  trustedOrigins: [
    serverEnv.NODE_ENV === "production"
      ? "https://agentcal.ai"
      : "http://localhost:3000",
  ],
  plugins: [
    admin(),
    apiKey({
      defaultPrefix: "agentcal_",
      apiKeyHeaders: ["x-api-key"],
    }),
    openAPI(),
    organization({}), //not currently working with typescript declaration files
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
