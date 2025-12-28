import { db, eq } from "@workspace/db"
import { user } from "@workspace/db/schema/better-auth-schema"
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
  twoFactor,
} from "better-auth/plugins"

// Environment helpers
const isProduction = () => serverEnv.NODE_ENV === "production"
const isDevelopment = () => serverEnv.NODE_ENV === "development"

const options = {
  appName: "AgentCal",
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  advanced: {
    cookiePrefix: "AC", // AgentCal session
    database: {
      generateId: false, // Let Postgres generate UUIDs via defaultRandom()
    },
    // Cross-subdomain cookies for app.agentcal.ai + api.agentcal.ai
    crossSubDomainCookies: isProduction()
      ? {
          enabled: true,
          domain: ".agentcal.ai",
        }
      : undefined,
  },
  // Cookie cache for faster session access
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
    },
  },
  // Rate limiting
  rateLimit: {
    enabled: true,
    storage: "memory", // TODO: add Redis as secondary storage
    max: 60, // max requests
    window: 60, // 60 seconds
  },

  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    requireEmailVerification: true,
    sendResetPassword: async (
      { user, token, url },
      _request
    ): Promise<void> => {
      // TODO: Implement password reset email
      console.log("[Better Auth] Password reset requested", {
        email: user.email,
        url,
      })
    },
  },

  emailVerification: {
    sendVerificationEmail: async ({ user, token, url }, _request) => {
      // TODO: Implement email verification sending
      console.log("[Better Auth] Email verification requested", {
        email: user.email,
        url,
      })
    },
    autoSignInAfterVerification: true,
    sendOnSignUp: true,
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
  // Environment-aware trusted origins
  trustedOrigins: isProduction()
    ? ["https://app.agentcal.ai", "https://api.agentcal.ai"]
    : [
        "http://localhost:3000",
        "http://localhost:8080",
        "http://localhost:4000",
      ],
  plugins: [
    phoneNumber({
      sendOTP: ({ phoneNumber, code }, _request) => {
        // TODO: Implement sending OTP code via SMS
        console.log("[Better Auth] Phone OTP requested", { phoneNumber })
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
        maxRequests: 100, // 100 requests per minute
      },
      permissions: {
        defaultPermissions: {
          all: ["read", "write"],
        },
      },
    }),
    openAPI(),
    organization({
      sendInvitationEmail: async (
        { invitation, organization, inviter, email, id, role },
        _request
      ) => {
        const inviteUrl = isDevelopment()
          ? `http://localhost:3000/accept-invitation?inviteId=${id}`
          : `https://app.agentcal.ai/accept-invitation?inviteId=${id}`

        // TODO: Implement invitation email
        console.log("[Better Auth] Invitation email requested", {
          email,
          inviteUrl,
          orgName: organization.name,
          inviterName: inviter.user.name,
        })
      },
    }),
    emailOTP({
      async sendVerificationOTP({ email, otp, type }) {
        // TODO: Implement sending OTP to user's email
        console.log("[Better Auth] Email OTP requested", { email, type })
      },
    }),
    twoFactor(), // TOTP apps (Google Authenticator, etc.)
  ],
} satisfies BetterAuthOptions

export const auth = betterAuth({
  ...options,
  plugins: [...(options.plugins ?? [])],
})

export type UserSession = typeof auth.$Infer.Session
export type Session = typeof auth.$Infer.Session.session
export type User = typeof auth.$Infer.Session.user
