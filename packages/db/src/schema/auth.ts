// Better Auth generated schema + AgentCal extensions
// Base tables (user, session, account, etc.) are managed by Better Auth
// Extensions (organization fields, apikey modifications) are for AgentCal multi-tenant API

import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core"
import { createInsertSchema, createSelectSchema } from "drizzle-zod"

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  role: text("role"),
  banned: boolean("banned"),
  banReason: text("ban_reason"),
  banExpires: timestamp("ban_expires"),
  phoneNumber: text("phone_number"),
  phoneNumberVerified: boolean("phone_number_verified")
    .default(false)
    .notNull(),
})

// Organization plan enum for billing tiers
export const organizationPlanEnum = pgEnum("organization_plan", [
  "free",
  "pro",
  "enterprise",
])

export const organization = pgTable(
  "organization",
  {
    id: text("id").primaryKey(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    name: text("name").notNull(),
    slug: text("slug").unique(),
    logo: text("logo"),
    metadata: text("metadata"),
    // AgentCal API extensions
    publishableKey: text("publishable_key"), // pk_live_xxx - public key for embeds
    plan: organizationPlanEnum("plan").default("free"),
    stripeCustomerId: text("stripe_customer_id"),
  },
  (t) => [unique("unique_organization_slug").on(t.slug)]
)

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    impersonatedBy: text("impersonated_by"),
    activeOrganizationId: text("active_organization_id"),
  },
  (t) => [index("session_user_id_idx").on(t.userId)]
)

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
  },
  (t) => [index("account_user_id_idx").on(t.userId)]
)

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
})

export const apikey = pgTable(
  "apikey",
  {
    id: text("id").primaryKey(),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
    name: text("name"),
    start: text("start"),
    prefix: text("prefix"),
    key: text("key").notNull(),
    userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
    organizationId: text("organization_id").references(() => organization.id, {
      onDelete: "cascade",
    }),
    refillInterval: integer("refill_interval"),
    refillAmount: integer("refill_amount"),
    lastRefillAt: timestamp("last_refill_at"),
    enabled: boolean("enabled"),
    rateLimitEnabled: boolean("rate_limit_enabled"),
    rateLimitTimeWindow: integer("rate_limit_time_window"),
    rateLimitMax: integer("rate_limit_max"),
    requestCount: integer("request_count"),
    remaining: integer("remaining"),
    lastRequest: timestamp("last_request"),
    expiresAt: timestamp("expires_at"),
    permissions: text("permissions"),
    metadata: text("metadata"),
  },
  (t) => [
    index("apikey_organization_id_idx").on(t.organizationId),
    index("apikey_user_id_idx").on(t.userId),
  ]
)

export type ApiKey = typeof apikey.$inferSelect

export const selectApiKeySchema = createSelectSchema(apikey).omit({
  key: true,
})

export const insertApiKeySchema = createInsertSchema(apikey, {
  name: (schema) => schema.min(1).max(255),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})

export const updateApiKeySchema = insertApiKeySchema.partial()

export const member = pgTable(
  "member",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    role: text("role").notNull(),
    createdAt: timestamp("created_at").notNull(),
  },
  (t) => [
    index("member_user_org_idx").on(t.userId, t.organizationId),
    index("member_organization_id_idx").on(t.organizationId),
  ]
)

export const invitation = pgTable("invitation", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  role: text("role"),
  status: text("status").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  inviterId: text("inviter_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
})
