// Better Auth generated schema + AgentCal extensions
// Base tables (user, session, account, etc.) are managed by Better Auth
// Extensions (organization fields, apikey modifications) are for AgentCal multi-tenant API

// NOTE: We use generateId: false in Better Auth config, so Postgres generates UUIDs via defaultRandom()

import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core"
import { createInsertSchema, createSelectSchema } from "drizzle-zod"

export const user = pgTable("user", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
  role: text("role"),
  banned: boolean("banned"),
  banReason: text("ban_reason"),
  banExpires: timestamp("ban_expires"),
  phoneNumber: text("phone_number"),
  phoneNumberVerified: boolean("phone_number_verified")
    .default(false)
    .notNull(),
  twoFactorEnabled: boolean("two_factor_enabled").default(false).notNull(),
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
    id: uuid("id").defaultRandom().primaryKey(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
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
    id: uuid("id").defaultRandom().primaryKey(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: uuid("user_id")
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
    id: uuid("id").defaultRandom().primaryKey(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
  },
  (t) => [index("account_user_id_idx").on(t.userId)]
)

export const verification = pgTable(
  "verification",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
  },
  (t) => [index("verification_identifier_idx").on(t.identifier)]
)

export const apikey = pgTable(
  "apikey",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    name: text("name"),
    start: text("start"),
    prefix: text("prefix"),
    key: text("key").notNull(),
    userId: uuid("user_id").references(() => user.id, { onDelete: "cascade" }),
    organizationId: uuid("organization_id").references(() => organization.id, {
      onDelete: "cascade",
    }),
    refillInterval: integer("refill_interval"),
    refillAmount: integer("refill_amount"),
    lastRefillAt: timestamp("last_refill_at"),
    enabled: boolean("enabled").default(true),
    rateLimitEnabled: boolean("rate_limit_enabled").default(true),
    rateLimitTimeWindow: integer("rate_limit_time_window"),
    rateLimitMax: integer("rate_limit_max"),
    requestCount: integer("request_count").default(0),
    remaining: integer("remaining"),
    lastRequest: timestamp("last_request"),
    expiresAt: timestamp("expires_at"),
    permissions: text("permissions"),
    metadata: text("metadata"),
  },
  (t) => [
    index("apikey_organization_id_idx").on(t.organizationId),
    index("apikey_user_id_idx").on(t.userId),
    index("apikey_key_idx").on(t.key),
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
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    role: text("role").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("member_user_org_idx").on(t.userId, t.organizationId),
    index("member_organization_id_idx").on(t.organizationId),
  ]
)

export const invitation = pgTable(
  "invitation",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    role: text("role"),
    status: text("status").default("pending").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    inviterId: uuid("inviter_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (t) => [
    index("invitation_organization_id_idx").on(t.organizationId),
    index("invitation_email_idx").on(t.email),
  ]
)

// Two-factor authentication table
export const twoFactor = pgTable(
  "two_factor",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    secret: text("secret").notNull(),
    backupCodes: text("backup_codes").notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (t) => [
    index("two_factor_user_id_idx").on(t.userId),
    index("twoFactor_secret_idx").on(t.secret),
  ]
)
