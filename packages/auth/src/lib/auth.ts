import { betterAuth, type BetterAuthOptions } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import {
  admin,
  organization,
  apiKey,
  openAPI,
  emailOTP,
  phoneNumber,
} from "better-auth/plugins"
import { db } from "@workspace/db"
import { serverEnv } from "@workspace/env-config"

const options = {
  appName: "AgentCal",
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  advanced: {
    cookiePrefix: "AC", // AgentCal session
  },
  // Cookie cache
  // This is used to cache the session in a cookie for faster access
  // session: {
  //   cookieCache: {
  //     enabled: true,
  //     maxAge: 5 * 60, // 5 minutes
  //   },
  // },
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
    phoneNumber({
      sendOTP: ({ phoneNumber, code }, _request) => {
        // Implement sending OTP code via SMS
      },
    }),
    admin({
      defaultRole: "admin",
    }),
    apiKey({
      defaultPrefix: "agentcal_",
      apiKeyHeaders: ["x-api-key"],
      rateLimit: {
        enabled: true,
        timeWindow: 1000 * 60, // 1 minute
        maxRequests: 100, //  100 requests per minute
      },
      permissions: {
        defaultPermissions: {
          all: ["read", "write"],
        },
      },
    }),
    openAPI(),
    organization(),
    emailOTP({
      async sendVerificationOTP({ email, otp, type }) {
        // Implement the sendVerificationOTP method to send the OTP to the user's email address
      },
    }),
  ],
} satisfies BetterAuthOptions

export const auth = betterAuth({
  ...options,
  plugins: [
    ...(options.plugins ?? []),
    // customSession(async ({ user, session }) => {
    //   const member = await db.query.member.findFirst({
    //     where: (member, { eq }) => eq(member.userId, user.id),
    //     with: {
    //       organization: true,
    //     },
    //   })

    //   // now both user and session will infer the fields added by plugins and your custom fields
    //   return {
    //     user: {
    //       ...user,
    //       organization: member?.organization,
    //       member: {
    //         id: member?.id,
    //         role: member?.role,
    //         userId: member?.userId,
    //       },
    //     },
    //     session,
    //   }
    // }, options), // pass options here
  ],
})

export type UserSession = typeof auth.$Infer.Session
export type Session = typeof auth.$Infer.Session.session
export type User = typeof auth.$Infer.Session.user
// export interface UserWithOrganization extends User {
//   organization?: {
//     id: string
//     name: string
//     createdAt: Date
//     metadata: string | null
//     slug: string | null
//     logo: string | null
//   }
//   member: {
//     id?: string
//     role?: string
//     userId?: string
//   }
// }
