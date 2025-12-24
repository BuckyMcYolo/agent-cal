import { db, eq } from "@workspace/db"
import { user } from "@workspace/db/schema/auth"
import { serverEnv } from "@workspace/env-config"
import { type BetterAuthOptions, betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import {
  admin,
  apiKey,
  emailOTP,
  openAPI,
  organization,
  phoneNumber,
} from "better-auth/plugins"

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
        after: async (userData) => {
          console.log("[Better Auth] User created", userData.id)
        },
      },
    },
    session: {
      // Set activeOrganizationId when a session is created
      create: {
        before: async (session) => {
          // Get the user with their member records
          const userData = await db.query.user.findFirst({
            where: eq(user.id, session.userId),
            with: {
              members: true,
            },
          })

          // If user has no memberships, leave activeOrganizationId null
          if (!userData?.members || userData.members.length === 0) {
            console.log(
              "[Better Auth] User has no organization memberships",
              session.userId
            )
            return {
              data: {
                ...session,
                activeOrganizationId: null,
              },
            }
          }

          // Set the first organization as the active one
          const firstMember = userData.members[0]
          if (!firstMember) {
            return {
              data: {
                ...session,
                activeOrganizationId: null,
              },
            }
          }

          const organizationId = firstMember.organizationId

          console.log("[Better Auth] Setting active organization", {
            userId: session.userId,
            organizationId,
          })

          return {
            data: {
              ...session,
              activeOrganizationId: organizationId,
            },
          }
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
  plugins: [...(options.plugins ?? [])],
})

export type UserSession = typeof auth.$Infer.Session
export type Session = typeof auth.$Infer.Session.session
export type User = typeof auth.$Infer.Session.user
