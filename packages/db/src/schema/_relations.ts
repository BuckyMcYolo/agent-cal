/**
 * Centralized relations file to avoid circular dependencies.
 * All Drizzle relations are defined here.
 */
import { relations } from "drizzle-orm"
import {
  account,
  apikey,
  invitation,
  member,
  organization,
  session,
  user,
} from "./auth"
import { availabilityRule } from "./availability-rule"
import { availabilitySchedule } from "./availability-schedule"
import { booking } from "./booking"
import { bookingEvent } from "./booking-event"
import { business } from "./business"
import { businessUser } from "./business-user"
import { calendarConnection } from "./calendar-connection"
import { eventType } from "./event-type"

// ============================================================
// Auth Schema Relations (Better Auth + AgentCal extensions)
// ============================================================

// User relations
export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  apikeys: many(apikey),
  members: many(member),
}))

// Organization relations
export const organizationRelations = relations(organization, ({ many }) => ({
  members: many(member),
  invitations: many(invitation),
  apikeys: many(apikey),
  businesses: many(business),
}))

// Session relations
export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
  activeOrganization: one(organization, {
    fields: [session.activeOrganizationId],
    references: [organization.id],
  }),
}))

// Account relations
export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}))

// API Key relations
export const apikeyRelations = relations(apikey, ({ one }) => ({
  user: one(user, {
    fields: [apikey.userId],
    references: [user.id],
  }),
  organization: one(organization, {
    fields: [apikey.organizationId],
    references: [organization.id],
  }),
}))

// Member relations
export const memberRelations = relations(member, ({ one }) => ({
  organization: one(organization, {
    fields: [member.organizationId],
    references: [organization.id],
  }),
  user: one(user, {
    fields: [member.userId],
    references: [user.id],
  }),
}))

// Invitation relations
export const invitationRelations = relations(invitation, ({ one }) => ({
  organization: one(organization, {
    fields: [invitation.organizationId],
    references: [organization.id],
  }),
  inviter: one(user, {
    fields: [invitation.inviterId],
    references: [user.id],
  }),
}))

// ============================================================
// Multi-tenant API Schema Relations
// ============================================================

// Business relations
export const businessRelations = relations(business, ({ one, many }) => ({
  organization: one(organization, {
    fields: [business.organizationId],
    references: [organization.id],
  }),
  businessUsers: many(businessUser),
  eventTypes: many(eventType),
  bookings: many(booking),
}))

// BusinessUser relations
export const businessUserRelations = relations(
  businessUser,
  ({ one, many }) => ({
    business: one(business, {
      fields: [businessUser.businessId],
      references: [business.id],
    }),
    calendarConnections: many(calendarConnection),
    availabilitySchedules: many(availabilitySchedule),
    eventTypes: many(eventType),
    bookings: many(booking),
  })
)

// EventType relations
export const eventTypeRelations = relations(eventType, ({ one, many }) => ({
  business: one(business, {
    fields: [eventType.businessId],
    references: [business.id],
  }),
  businessUser: one(businessUser, {
    fields: [eventType.businessUserId],
    references: [businessUser.id],
  }),
  availabilitySchedule: one(availabilitySchedule, {
    fields: [eventType.availabilityScheduleId],
    references: [availabilitySchedule.id],
  }),
  bookings: many(booking),
}))

// CalendarConnection relations
export const calendarConnectionRelations = relations(
  calendarConnection,
  ({ one }) => ({
    businessUser: one(businessUser, {
      fields: [calendarConnection.businessUserId],
      references: [businessUser.id],
    }),
  })
)

// AvailabilitySchedule relations
export const availabilityScheduleRelations = relations(
  availabilitySchedule,
  ({ one, many }) => ({
    businessUser: one(businessUser, {
      fields: [availabilitySchedule.businessUserId],
      references: [businessUser.id],
    }),
    rules: many(availabilityRule),
    eventTypes: many(eventType),
  })
)

// AvailabilityRule relations
export const availabilityRuleRelations = relations(
  availabilityRule,
  ({ one }) => ({
    schedule: one(availabilitySchedule, {
      fields: [availabilityRule.scheduleId],
      references: [availabilitySchedule.id],
    }),
  })
)

// Booking relations
export const bookingRelations = relations(booking, ({ one, many }) => ({
  business: one(business, {
    fields: [booking.businessId],
    references: [business.id],
  }),
  businessUser: one(businessUser, {
    fields: [booking.businessUserId],
    references: [businessUser.id],
  }),
  eventType: one(eventType, {
    fields: [booking.eventTypeId],
    references: [eventType.id],
  }),
  events: many(bookingEvent),
}))

// BookingEvent relations (audit log)
export const bookingEventRelations = relations(bookingEvent, ({ one }) => ({
  booking: one(booking, {
    fields: [bookingEvent.bookingId],
    references: [booking.id],
  }),
}))
