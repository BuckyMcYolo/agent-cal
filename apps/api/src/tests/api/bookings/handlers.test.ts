import { testClient } from "hono/testing"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { createRouter } from "@/lib/helpers/app/create-app"
import * as routes from "@/routes/v1/bookings/routes"

// ============================================================================
// Mock Data
// ============================================================================

const mockUUIDs = {
  orgId: "550e8400-e29b-41d4-a716-446655440000",
  businessId: "550e8400-e29b-41d4-a716-446655440001",
  userId: "550e8400-e29b-41d4-a716-446655440002",
  eventTypeId: "550e8400-e29b-41d4-a716-446655440003",
  bookingId: "550e8400-e29b-41d4-a716-446655440004",
  authUserId: "550e8400-e29b-41d4-a716-446655440005",
}

let mockBusiness: Record<string, unknown> | null = null
let mockBusinessUser: Record<string, unknown> | null = null
let mockEventType: Record<string, unknown> | null = null
let mockBooking: Record<string, unknown> | null = null
const mockBookings: Array<Record<string, unknown>> = []

function createMockBusiness(overrides: Record<string, unknown> = {}) {
  return {
    id: mockUUIDs.businessId,
    name: "Test Business",
    organizationId: mockUUIDs.orgId,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

function createMockBusinessUser(overrides: Record<string, unknown> = {}) {
  return {
    id: mockUUIDs.userId,
    businessId: mockUUIDs.businessId,
    name: "Test User",
    email: "testuser@example.com",
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

function createMockEventType(overrides: Record<string, unknown> = {}) {
  return {
    id: mockUUIDs.eventTypeId,
    businessId: mockUUIDs.businessId,
    businessUserId: mockUUIDs.userId,
    title: "30 Minute Meeting",
    description: "A 30 minute consultation",
    durationMinutes: 30,
    slotStepMinutes: null,
    bufferBefore: 0,
    bufferAfter: 0,
    minNoticeMinutes: 0,
    maxDaysInAdvance: null,
    availabilityScheduleId: null,
    eligibleUserIds: null,
    assignmentStrategy: "round_robin",
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

function createMockBooking(overrides: Record<string, unknown> = {}) {
  const now = new Date()
  const startTime = new Date(now.getTime() + 24 * 60 * 60 * 1000) // Tomorrow
  const endTime = new Date(startTime.getTime() + 30 * 60 * 1000) // +30 minutes

  return {
    id: mockUUIDs.bookingId,
    businessId: mockUUIDs.businessId,
    businessUserId: mockUUIDs.userId,
    eventTypeId: mockUUIDs.eventTypeId,
    title: "30 Minute Meeting",
    description: "A 30 minute consultation",
    startTime,
    endTime,
    timezone: "America/New_York",
    status: "confirmed",
    calendarEventId: null,
    locationType: null,
    location: null,
    meetingUrl: null,
    assignedVia: "round_robin",
    assignmentMetadata: {},
    attendeeEmail: "customer@example.com",
    attendeeName: "John Customer",
    attendeeTimezone: null,
    cancellationReason: null,
    metadata: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }
}

// ============================================================================
// Mock Dependencies
// ============================================================================

vi.mock("@workspace/db", () => {
  const eq = vi.fn((field: unknown, value: unknown) => ({
    field,
    value,
    op: "eq",
  }))
  const and = vi.fn((...conditions: unknown[]) => ({ conditions, op: "and" }))
  const gte = vi.fn((field: unknown, value: unknown) => ({
    field,
    value,
    op: "gte",
  }))
  const lte = vi.fn((field: unknown, value: unknown) => ({
    field,
    value,
    op: "lte",
  }))
  const sql = vi.fn()
  const count = vi.fn(() => "count")

  return {
    db: {
      query: {
        business: {
          findFirst: vi.fn(async () => mockBusiness),
        },
        businessUser: {
          findFirst: vi.fn(async () => mockBusinessUser),
          findMany: vi.fn(async () =>
            mockBusinessUser ? [mockBusinessUser] : []
          ),
        },
        eventType: {
          findFirst: vi.fn(async () => mockEventType),
        },
        booking: {
          findFirst: vi.fn(async () => mockBooking),
          findMany: vi.fn(async () => mockBookings),
        },
      },
      insert: vi.fn(() => ({
        values: vi.fn(() => ({
          returning: vi.fn(async () => [createMockBooking()]),
        })),
      })),
      update: vi.fn(() => ({
        set: vi.fn(() => ({
          where: vi.fn(() => ({
            returning: vi.fn(async () => [mockBooking]),
          })),
        })),
      })),
      select: vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn(async () => [{ count: mockBookings.length }]),
        })),
      })),
    },
    eq,
    and,
    gte,
    lte,
    sql,
    count,
  }
})

// Mock auth middleware
vi.mock("@/middleware/auth-middleware", () => ({
  authMiddleware: vi.fn(async (c, next) => {
    c.set("organization", {
      id: mockUUIDs.orgId,
      name: "Test Org",
      slug: "test-org",
      logo: null,
      metadata: null,
      createdAt: new Date(),
    })
    c.set("member", {
      id: "member-1",
      userId: mockUUIDs.authUserId,
      organizationId: mockUUIDs.orgId,
      role: "owner",
      createdAt: new Date(),
    })
    c.set("user", { id: mockUUIDs.authUserId, email: "test@example.com" })
    c.set("authMethod", { type: "session", sessionId: "session-1" })
    await next()
  }),
}))

// Mock access verification
vi.mock("@/lib/helpers/access/verify-business-access", () => ({
  verifyBusinessAccess: vi.fn(async () => {
    if (!mockBusiness) {
      return { error: "Business not found", status: 404 }
    }
    return { businessRecord: mockBusiness }
  }),
  isAccessError: vi.fn((result: unknown) => {
    return result && typeof result === "object" && "error" in result
  }),
}))

// Mock booking helpers
vi.mock("@/lib/bookings", () => ({
  selectUserForBooking: vi.fn(async () => ({
    userId: mockUUIDs.userId,
    assignedVia: "round_robin",
    assignmentMetadata: { reason: "Test assignment" },
  })),
  checkSlotAvailability: vi.fn(async () => true),
  createCalendarEvent: vi.fn(async () => "calendar-event-123"),
  updateCalendarEvent: vi.fn(async () => true),
  deleteCalendarEvent: vi.fn(async () => true),
  logBookingEvent: vi.fn(async () => {}),
}))

// ============================================================================
// Test Setup
// ============================================================================

import * as handlers from "@/routes/v1/bookings/handlers"
import * as bookingHelpers from "@/lib/bookings"

function createTestRouter() {
  return createRouter()
    .openapi(routes.createBooking, handlers.createBooking)
    .openapi(routes.listBookings, handlers.listBookings)
    .openapi(routes.getBooking, handlers.getBooking)
    .openapi(routes.rescheduleBooking, handlers.rescheduleBooking)
    .openapi(routes.cancelBooking, handlers.cancelBooking)
}

// ============================================================================
// Tests
// ============================================================================

describe("Bookings API", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockBusiness = createMockBusiness()
    mockBusinessUser = createMockBusinessUser()
    mockEventType = createMockEventType()
    mockBooking = createMockBooking()
    mockBookings.length = 0
    mockBookings.push(createMockBooking())
  })

  describe("POST /businesses/{businessId}/bookings", () => {
    it("should create a booking with valid data", async () => {
      const app = createTestRouter()
      const client = testClient(app)

      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(14, 0, 0, 0)

      const res = await client.businesses[":businessId"].bookings.$post({
        param: { businessId: mockUUIDs.businessId },
        json: {
          eventTypeId: mockUUIDs.eventTypeId,
          startTime: tomorrow.toISOString(),
          timezone: "America/New_York",
          attendeeEmail: "customer@example.com",
          attendeeName: "John Customer",
        },
      })

      expect(res.status).toBe(201)
      const json = await res.json()
      expect(json).toHaveProperty("id")
      expect(json).toHaveProperty("status", "confirmed")
    })

    it("should return 404 when business not found", async () => {
      mockBusiness = null

      const app = createTestRouter()
      const client = testClient(app)

      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)

      const res = await client.businesses[":businessId"].bookings.$post({
        param: { businessId: "00000000-0000-0000-0000-000000000000" },
        json: {
          eventTypeId: mockUUIDs.eventTypeId,
          startTime: tomorrow.toISOString(),
          timezone: "America/New_York",
          attendeeEmail: "customer@example.com",
          attendeeName: "John Customer",
        },
      })

      expect(res.status).toBe(404)
    })

    it("should return 404 when event type not found", async () => {
      mockEventType = null

      const app = createTestRouter()
      const client = testClient(app)

      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)

      const res = await client.businesses[":businessId"].bookings.$post({
        param: { businessId: mockUUIDs.businessId },
        json: {
          eventTypeId: "00000000-0000-0000-0000-000000000000",
          startTime: tomorrow.toISOString(),
          timezone: "America/New_York",
          attendeeEmail: "customer@example.com",
          attendeeName: "John Customer",
        },
      })

      expect(res.status).toBe(404)
    })

    it("should return 409 when slot is unavailable", async () => {
      vi.mocked(bookingHelpers.selectUserForBooking).mockResolvedValueOnce(null)

      const app = createTestRouter()
      const client = testClient(app)

      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)

      const res = await client.businesses[":businessId"].bookings.$post({
        param: { businessId: mockUUIDs.businessId },
        json: {
          eventTypeId: mockUUIDs.eventTypeId,
          startTime: tomorrow.toISOString(),
          timezone: "America/New_York",
          attendeeEmail: "customer@example.com",
          attendeeName: "John Customer",
        },
      })

      expect(res.status).toBe(409)
      const json = (await res.json()) as { code?: string }
      expect(json.code).toBe("SLOT_UNAVAILABLE")
    })

    it("should create calendar event when user has connection", async () => {
      const app = createTestRouter()
      const client = testClient(app)

      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)

      await client.businesses[":businessId"].bookings.$post({
        param: { businessId: mockUUIDs.businessId },
        json: {
          eventTypeId: mockUUIDs.eventTypeId,
          startTime: tomorrow.toISOString(),
          timezone: "America/New_York",
          attendeeEmail: "customer@example.com",
          attendeeName: "John Customer",
        },
      })

      expect(bookingHelpers.createCalendarEvent).toHaveBeenCalled()
    })

    it("should log created event", async () => {
      const app = createTestRouter()
      const client = testClient(app)

      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)

      await client.businesses[":businessId"].bookings.$post({
        param: { businessId: mockUUIDs.businessId },
        json: {
          eventTypeId: mockUUIDs.eventTypeId,
          startTime: tomorrow.toISOString(),
          timezone: "America/New_York",
          attendeeEmail: "customer@example.com",
          attendeeName: "John Customer",
        },
      })

      expect(bookingHelpers.logBookingEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: "created",
          oldStatus: null,
          newStatus: "confirmed",
        })
      )
    })
  })

  describe("GET /businesses/{businessId}/bookings", () => {
    it("should list all bookings for business", async () => {
      const app = createTestRouter()
      const client = testClient(app)

      const res = await client.businesses[":businessId"].bookings.$get({
        param: { businessId: mockUUIDs.businessId },
        query: {},
      })

      expect(res.status).toBe(200)
      const json = (await res.json()) as { data: unknown[]; meta: unknown }
      expect(json.data).toBeDefined()
      expect(json.meta).toBeDefined()
    })

    it("should return 404 when business not found", async () => {
      mockBusiness = null

      const app = createTestRouter()
      const client = testClient(app)

      const res = await client.businesses[":businessId"].bookings.$get({
        param: { businessId: "00000000-0000-0000-0000-000000000000" },
        query: {},
      })

      expect(res.status).toBe(404)
    })

    it("should filter by status", async () => {
      const app = createTestRouter()
      const client = testClient(app)

      const res = await client.businesses[":businessId"].bookings.$get({
        param: { businessId: mockUUIDs.businessId },
        query: { status: "confirmed" },
      })

      expect(res.status).toBe(200)
    })

    it("should filter by date range", async () => {
      const app = createTestRouter()
      const client = testClient(app)

      const res = await client.businesses[":businessId"].bookings.$get({
        param: { businessId: mockUUIDs.businessId },
        query: {
          startDate: "2025-01-01",
          endDate: "2025-01-31",
        },
      })

      expect(res.status).toBe(200)
    })

    it("should support pagination", async () => {
      const app = createTestRouter()
      const client = testClient(app)

      const res = await client.businesses[":businessId"].bookings.$get({
        param: { businessId: mockUUIDs.businessId },
        query: { limit: 10, offset: 0 },
      })

      expect(res.status).toBe(200)
      const json = (await res.json()) as {
        meta: { limit: number; offset: number }
      }
      expect(json.meta.limit).toBe(10)
      expect(json.meta.offset).toBe(0)
    })
  })

  describe("GET /businesses/{businessId}/bookings/{bookingId}", () => {
    it("should return booking by ID", async () => {
      const app = createTestRouter()
      const client = testClient(app)

      const res = await client.businesses[":businessId"].bookings[
        ":bookingId"
      ].$get({
        param: {
          businessId: mockUUIDs.businessId,
          bookingId: mockUUIDs.bookingId,
        },
      })

      expect(res.status).toBe(200)
      const json = (await res.json()) as { id: string }
      expect(json.id).toBe(mockUUIDs.bookingId)
    })

    it("should return 404 when booking not found", async () => {
      mockBooking = null

      const app = createTestRouter()
      const client = testClient(app)

      const res = await client.businesses[":businessId"].bookings[
        ":bookingId"
      ].$get({
        param: {
          businessId: mockUUIDs.businessId,
          bookingId: "00000000-0000-0000-0000-000000000000",
        },
      })

      expect(res.status).toBe(404)
    })

    it("should return 404 when business not found", async () => {
      mockBusiness = null

      const app = createTestRouter()
      const client = testClient(app)

      const res = await client.businesses[":businessId"].bookings[
        ":bookingId"
      ].$get({
        param: {
          businessId: "00000000-0000-0000-0000-000000000000",
          bookingId: mockUUIDs.bookingId,
        },
      })

      expect(res.status).toBe(404)
    })
  })

  describe("PATCH /businesses/{businessId}/bookings/{bookingId}", () => {
    it("should reschedule booking to new time", async () => {
      const app = createTestRouter()
      const client = testClient(app)

      const newTime = new Date()
      newTime.setDate(newTime.getDate() + 2)

      const res = await client.businesses[":businessId"].bookings[
        ":bookingId"
      ].$patch({
        param: {
          businessId: mockUUIDs.businessId,
          bookingId: mockUUIDs.bookingId,
        },
        json: {
          startTime: newTime.toISOString(),
        },
      })

      expect(res.status).toBe(200)
    })

    it("should return 404 when booking not found", async () => {
      mockBooking = null

      const app = createTestRouter()
      const client = testClient(app)

      const newTime = new Date()
      newTime.setDate(newTime.getDate() + 2)

      const res = await client.businesses[":businessId"].bookings[
        ":bookingId"
      ].$patch({
        param: {
          businessId: mockUUIDs.businessId,
          bookingId: "00000000-0000-0000-0000-000000000000",
        },
        json: {
          startTime: newTime.toISOString(),
        },
      })

      expect(res.status).toBe(404)
    })

    it("should return 400 for cancelled booking", async () => {
      mockBooking = createMockBooking({ status: "cancelled" })

      const app = createTestRouter()
      const client = testClient(app)

      const newTime = new Date()
      newTime.setDate(newTime.getDate() + 2)

      const res = await client.businesses[":businessId"].bookings[
        ":bookingId"
      ].$patch({
        param: {
          businessId: mockUUIDs.businessId,
          bookingId: mockUUIDs.bookingId,
        },
        json: {
          startTime: newTime.toISOString(),
        },
      })

      expect(res.status).toBe(400)
      const json = (await res.json()) as { message: string }
      expect(json.message).toContain("cancelled")
    })

    it("should return 409 when new slot unavailable", async () => {
      vi.mocked(bookingHelpers.checkSlotAvailability).mockResolvedValueOnce(
        false
      )

      const app = createTestRouter()
      const client = testClient(app)

      const newTime = new Date()
      newTime.setDate(newTime.getDate() + 2)

      const res = await client.businesses[":businessId"].bookings[
        ":bookingId"
      ].$patch({
        param: {
          businessId: mockUUIDs.businessId,
          bookingId: mockUUIDs.bookingId,
        },
        json: {
          startTime: newTime.toISOString(),
        },
      })

      expect(res.status).toBe(409)
      const json = (await res.json()) as { code?: string }
      expect(json.code).toBe("SLOT_UNAVAILABLE")
    })

    it("should update calendar event", async () => {
      const app = createTestRouter()
      const client = testClient(app)

      const newTime = new Date()
      newTime.setDate(newTime.getDate() + 2)

      await client.businesses[":businessId"].bookings[":bookingId"].$patch({
        param: {
          businessId: mockUUIDs.businessId,
          bookingId: mockUUIDs.bookingId,
        },
        json: {
          startTime: newTime.toISOString(),
        },
      })

      expect(bookingHelpers.updateCalendarEvent).toHaveBeenCalled()
    })

    it("should log rescheduled event", async () => {
      const app = createTestRouter()
      const client = testClient(app)

      const newTime = new Date()
      newTime.setDate(newTime.getDate() + 2)

      await client.businesses[":businessId"].bookings[":bookingId"].$patch({
        param: {
          businessId: mockUUIDs.businessId,
          bookingId: mockUUIDs.bookingId,
        },
        json: {
          startTime: newTime.toISOString(),
          reason: "Customer requested",
        },
      })

      expect(bookingHelpers.logBookingEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: "rescheduled",
        })
      )
    })
  })

  describe("DELETE /businesses/{businessId}/bookings/{bookingId}", () => {
    it("should cancel booking", async () => {
      const app = createTestRouter()
      const client = testClient(app)

      const res = await client.businesses[":businessId"].bookings[
        ":bookingId"
      ].$delete({
        param: {
          businessId: mockUUIDs.businessId,
          bookingId: mockUUIDs.bookingId,
        },
        json: {},
      })

      expect(res.status).toBe(200)
      const json = (await res.json()) as { success: boolean }
      expect(json.success).toBe(true)
    })

    it("should return 404 when booking not found", async () => {
      mockBooking = null

      const app = createTestRouter()
      const client = testClient(app)

      const res = await client.businesses[":businessId"].bookings[
        ":bookingId"
      ].$delete({
        param: {
          businessId: mockUUIDs.businessId,
          bookingId: "00000000-0000-0000-0000-000000000000",
        },
        json: {},
      })

      expect(res.status).toBe(404)
    })

    it("should return 400 for already cancelled booking", async () => {
      mockBooking = createMockBooking({ status: "cancelled" })

      const app = createTestRouter()
      const client = testClient(app)

      const res = await client.businesses[":businessId"].bookings[
        ":bookingId"
      ].$delete({
        param: {
          businessId: mockUUIDs.businessId,
          bookingId: mockUUIDs.bookingId,
        },
        json: {},
      })

      expect(res.status).toBe(400)
      const json = (await res.json()) as { message: string }
      expect(json.message).toContain("already cancelled")
    })

    it("should delete calendar event", async () => {
      const app = createTestRouter()
      const client = testClient(app)

      await client.businesses[":businessId"].bookings[":bookingId"].$delete({
        param: {
          businessId: mockUUIDs.businessId,
          bookingId: mockUUIDs.bookingId,
        },
        json: {},
      })

      expect(bookingHelpers.deleteCalendarEvent).toHaveBeenCalled()
    })

    it("should log cancelled event with reason", async () => {
      const app = createTestRouter()
      const client = testClient(app)

      await client.businesses[":businessId"].bookings[":bookingId"].$delete({
        param: {
          businessId: mockUUIDs.businessId,
          bookingId: mockUUIDs.bookingId,
        },
        json: {
          reason: "Customer no longer available",
        },
      })

      expect(bookingHelpers.logBookingEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: "cancelled",
          oldStatus: "confirmed",
          newStatus: "cancelled",
        })
      )
    })
  })
})
