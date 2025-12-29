import { testClient } from "hono/testing"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { createRouter } from "@/lib/helpers/app/create-app"
import * as routes from "../routes"
import {
  createMockBusiness,
  createMockBusinessUser,
  createMockOverride,
  createMockRule,
  createMockSchedule,
  mockUUIDs,
} from "./test-utils"

// ============================================================================
// Mock Data
// ============================================================================

const mockSchedules = new Map<string, ReturnType<typeof createMockSchedule>>()
const mockRules = new Map<string, ReturnType<typeof createMockRule>>()
const mockOverrides = new Map<string, ReturnType<typeof createMockOverride>>()
let mockBusiness: ReturnType<typeof createMockBusiness> | null = null
let mockBusinessUser: ReturnType<typeof createMockBusinessUser> | null = null
let mockEventType: Record<string, unknown> | null = null
let mockCalendarConnection: Record<string, unknown> | null = null

// ============================================================================
// Mock Dependencies
// ============================================================================

vi.mock("@workspace/db", () => {
  const eq = vi.fn((field: unknown, value: unknown) => ({
    field,
    value,
    op: "eq",
  }))
  const ne = vi.fn((field: unknown, value: unknown) => ({
    field,
    value,
    op: "ne",
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

  return {
    db: {
      query: {
        availabilitySchedule: {
          findMany: vi.fn(async () => Array.from(mockSchedules.values())),
          findFirst: vi.fn(async () => {
            for (const schedule of mockSchedules.values()) {
              return schedule
            }
            return null
          }),
        },
        availabilityRule: {
          findMany: vi.fn(async () => Array.from(mockRules.values())),
          findFirst: vi.fn(async () => mockRules.values().next().value ?? null),
        },
        availabilityOverride: {
          findMany: vi.fn(async () => Array.from(mockOverrides.values())),
          findFirst: vi.fn(
            async () => mockOverrides.values().next().value ?? null
          ),
        },
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
        calendarConnection: {
          findFirst: vi.fn(async () => mockCalendarConnection),
        },
      },
    },
    eq,
    ne,
    and,
    gte,
    lte,
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
  verifyBusinessUserAccess: vi.fn(async () => {
    if (!mockBusiness) {
      return { error: "Business not found", status: 404 }
    }
    if (!mockBusinessUser) {
      return { error: "User not found", status: 404 }
    }
    return { businessRecord: mockBusiness, userRecord: mockBusinessUser }
  }),
  isAccessError: vi.fn((result: unknown) => {
    return result && typeof result === "object" && "error" in result
  }),
}))

// Mock calendar service
vi.mock("@/services/calendar", () => ({
  getCalendarServiceForConnection: vi.fn(() => ({
    getCredentialsWithRefresh: vi.fn(async () => ({})),
    getClient: vi.fn(() => ({
      getBusyTimes: vi.fn(async () => []),
    })),
  })),
}))

// ============================================================================
// Test Setup
// ============================================================================

import * as handlers from "../handlers"

function createTestRouter() {
  return createRouter().openapi(
    routes.getAvailability,
    handlers.getAvailability
  )
}

function createMockEventType(overrides: Record<string, unknown> = {}) {
  return {
    id: mockUUIDs.eventTypeId,
    businessId: mockUUIDs.businessId,
    businessUserId: mockUUIDs.userId,
    name: "30 Minute Meeting",
    durationMinutes: 30,
    slotStepMinutes: null, // defaults to durationMinutes
    bufferBefore: 0,
    bufferAfter: 0,
    minNoticeMinutes: 0,
    maxDaysInAdvance: null,
    availabilityScheduleId: null,
    eligibleUserIds: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

describe("Availability Calculation", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSchedules.clear()
    mockRules.clear()
    mockOverrides.clear()
    mockBusiness = createMockBusiness()
    mockBusinessUser = createMockBusinessUser()
    mockEventType = createMockEventType()
    mockCalendarConnection = null

    // Add default schedule with Monday 9-5 rule
    const schedule = createMockSchedule()
    mockSchedules.set(schedule.id, schedule)

    const mondayRule = createMockRule({
      dayOfWeek: 1, // Monday
      startTime: "09:00:00",
      endTime: "17:00:00",
    })
    mockRules.set(mondayRule.id, mondayRule)
  })

  describe("GET /v1/businesses/{businessId}/availability", () => {
    it("should return available slots for a date range", async () => {
      const app = createTestRouter()
      const client = testClient(app)

      const res = await client.businesses[":businessId"].availability.$get({
        param: {
          businessId: mockUUIDs.businessId,
        },
        query: {
          eventTypeId: mockUUIDs.eventTypeId,
          startDate: "2025-01-13", // Monday
          endDate: "2025-01-13",
          timezone: "America/New_York",
        },
      })

      expect(res.status).toBe(200)
      const json = (await res.json()) as { slots: unknown[]; timezone: string }
      expect(json.slots).toBeDefined()
      expect(json.timezone).toBe("America/New_York")
    })

    it("should return empty slots when no rules match", async () => {
      // Clear rules - no availability
      mockRules.clear()

      const app = createTestRouter()
      const client = testClient(app)

      const res = await client.businesses[":businessId"].availability.$get({
        param: {
          businessId: mockUUIDs.businessId,
        },
        query: {
          eventTypeId: mockUUIDs.eventTypeId,
          startDate: "2025-01-13",
          endDate: "2025-01-13",
          timezone: "UTC",
        },
      })

      expect(res.status).toBe(200)
      const json = (await res.json()) as { slots: unknown[] }
      expect(json.slots).toHaveLength(0)
    })

    it("should return 404 when event type not found", async () => {
      mockEventType = null

      const app = createTestRouter()
      const client = testClient(app)

      const res = await client.businesses[":businessId"].availability.$get({
        param: {
          businessId: mockUUIDs.businessId,
        },
        query: {
          eventTypeId: "00000000-0000-0000-0000-000000000000",
          startDate: "2025-01-13",
          endDate: "2025-01-13",
        },
      })

      expect(res.status).toBe(404)
    })

    it("should return 404 when business not found", async () => {
      mockBusiness = null

      const app = createTestRouter()
      const client = testClient(app)

      const res = await client.businesses[":businessId"].availability.$get({
        param: {
          businessId: "00000000-0000-0000-0000-000000000000",
        },
        query: {
          eventTypeId: mockUUIDs.eventTypeId,
          startDate: "2025-01-13",
          endDate: "2025-01-13",
        },
      })

      expect(res.status).toBe(404)
    })

    it("should return 400 for invalid timezone", async () => {
      const app = createTestRouter()
      const client = testClient(app)

      const res = await client.businesses[":businessId"].availability.$get({
        param: {
          businessId: mockUUIDs.businessId,
        },
        query: {
          eventTypeId: mockUUIDs.eventTypeId,
          startDate: "2025-01-13",
          endDate: "2025-01-13",
          timezone: "Invalid/Timezone",
        },
      })

      expect(res.status).toBe(400)
      const json = (await res.json()) as { message: string }
      expect(json.message).toContain("Invalid timezone")
    })

    it("should default to UTC when no timezone provided", async () => {
      const app = createTestRouter()
      const client = testClient(app)

      const res = await client.businesses[":businessId"].availability.$get({
        param: {
          businessId: mockUUIDs.businessId,
        },
        query: {
          eventTypeId: mockUUIDs.eventTypeId,
          startDate: "2025-01-13",
          endDate: "2025-01-13",
        },
      })

      expect(res.status).toBe(200)
      const json = (await res.json()) as { timezone: string }
      expect(json.timezone).toBe("UTC")
    })

    it("should return 400 when no users available", async () => {
      // Set event type with specific user that doesn't exist
      mockEventType = createMockEventType({
        businessUserId: null,
        eligibleUserIds: [], // Empty array = no users
      })
      mockBusinessUser = null

      const app = createTestRouter()
      const client = testClient(app)

      const res = await client.businesses[":businessId"].availability.$get({
        param: {
          businessId: mockUUIDs.businessId,
        },
        query: {
          eventTypeId: mockUUIDs.eventTypeId,
          startDate: "2025-01-13",
          endDate: "2025-01-13",
        },
      })

      expect(res.status).toBe(400)
      const json = (await res.json()) as { message: string }
      expect(json.message).toContain("No users available")
    })

    it("should accept slotStepMinutes in event type", async () => {
      // 30-min meetings with 15-min slot intervals
      mockEventType = createMockEventType({
        durationMinutes: 30,
        slotStepMinutes: 15,
      })

      const app = createTestRouter()
      const client = testClient(app)

      const res = await client.businesses[":businessId"].availability.$get({
        param: {
          businessId: mockUUIDs.businessId,
        },
        query: {
          eventTypeId: mockUUIDs.eventTypeId,
          startDate: "2025-01-13",
          endDate: "2025-01-13",
          timezone: "UTC",
        },
      })

      // Should return 200 OK and proper response shape
      expect(res.status).toBe(200)
      const json = (await res.json()) as { slots: unknown[]; timezone: string }
      expect(json.slots).toBeDefined()
      expect(json.timezone).toBe("UTC")
    })

    it("should skip days with unavailable overrides", async () => {
      // Add override marking day as unavailable
      const override = createMockOverride({
        date: "2025-01-13",
        isAvailable: false,
      })
      mockOverrides.set(override.id, override)

      const app = createTestRouter()
      const client = testClient(app)

      const res = await client.businesses[":businessId"].availability.$get({
        param: {
          businessId: mockUUIDs.businessId,
        },
        query: {
          eventTypeId: mockUUIDs.eventTypeId,
          startDate: "2025-01-13",
          endDate: "2025-01-13",
          timezone: "UTC",
        },
      })

      expect(res.status).toBe(200)
      const json = (await res.json()) as { slots: unknown[] }
      expect(json.slots).toHaveLength(0)
    })

    it("should handle overrides with custom times", async () => {
      // Add override with custom hours (10:00-14:00 instead of 9:00-17:00)
      const override = createMockOverride({
        date: "2025-01-13",
        isAvailable: true,
        startTime: "10:00:00",
        endTime: "14:00:00",
      })
      mockOverrides.set(override.id, override)

      const app = createTestRouter()
      const client = testClient(app)

      const res = await client.businesses[":businessId"].availability.$get({
        param: {
          businessId: mockUUIDs.businessId,
        },
        query: {
          eventTypeId: mockUUIDs.eventTypeId,
          startDate: "2025-01-13",
          endDate: "2025-01-13",
          timezone: "UTC",
        },
      })

      // Should return 200 OK - custom override times are processed
      expect(res.status).toBe(200)
      const json = (await res.json()) as { slots: unknown[]; timezone: string }
      expect(json.slots).toBeDefined()
      expect(json.timezone).toBe("UTC")
    })

    it("should return empty slots beyond maxDaysInAdvance", async () => {
      mockEventType = createMockEventType({
        maxDaysInAdvance: 7,
      })

      const app = createTestRouter()
      const client = testClient(app)

      // Query for a date far in the future
      const res = await client.businesses[":businessId"].availability.$get({
        param: {
          businessId: mockUUIDs.businessId,
        },
        query: {
          eventTypeId: mockUUIDs.eventTypeId,
          startDate: "2026-01-13", // Way in the future
          endDate: "2026-01-13",
          timezone: "UTC",
        },
      })

      expect(res.status).toBe(200)
      const json = (await res.json()) as { slots: unknown[] }
      expect(json.slots).toHaveLength(0)
    })
  })
})
