import { testClient } from "hono/testing"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { createRouter } from "@/lib/helpers/app/create-app"
import * as overrideRoutes from "../overrides/routes"
import {
  createMockBusiness,
  createMockBusinessUser,
  createMockOverride,
  createMockSchedule,
  mockUUIDs,
} from "./test-utils"

// ============================================================================
// Mock Dependencies
// ============================================================================

const mockSchedules = new Map<string, ReturnType<typeof createMockSchedule>>()
const mockOverrides = new Map<string, ReturnType<typeof createMockOverride>>()
let mockBusiness: ReturnType<typeof createMockBusiness> | null = null
let mockBusinessUser: ReturnType<typeof createMockBusinessUser> | null = null

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
      },
      insert: vi.fn((table: unknown) => ({
        values: vi.fn((data: Record<string, unknown>) => ({
          returning: vi.fn(async () => {
            const newOverride = {
              id: crypto.randomUUID(),
              createdAt: new Date(),
              updatedAt: new Date(),
              ...data,
            }
            mockOverrides.set(
              newOverride.id as string,
              newOverride as ReturnType<typeof createMockOverride>
            )
            return [newOverride]
          }),
        })),
      })),
      update: vi.fn((table: unknown) => ({
        set: vi.fn((data: Record<string, unknown>) => ({
          where: vi.fn((condition: unknown) => ({
            returning: vi.fn(async () => {
              const override = mockOverrides.values().next().value
              if (override) {
                const updated = { ...override, ...data, updatedAt: new Date() }
                mockOverrides.set(override.id, updated)
                return [updated]
              }
              return []
            }),
          })),
        })),
      })),
      delete: vi.fn((table: unknown) => ({
        where: vi.fn(async (condition: unknown) => {
          mockOverrides.clear()
          return { rowCount: 1 }
        }),
      })),
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

// ============================================================================
// Test Setup
// ============================================================================

import * as overrideHandlers from "../overrides/handlers"

function createTestRouter() {
  return createRouter()
    .openapi(overrideRoutes.listOverrides, overrideHandlers.listOverrides)
    .openapi(overrideRoutes.createOverride, overrideHandlers.createOverride)
    .openapi(overrideRoutes.updateOverride, overrideHandlers.updateOverride)
    .openapi(overrideRoutes.deleteOverride, overrideHandlers.deleteOverride)
}

describe("Date Overrides CRUD", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSchedules.clear()
    mockOverrides.clear()
    mockBusiness = createMockBusiness()
    mockBusinessUser = createMockBusinessUser()
    // Add a default schedule
    const schedule = createMockSchedule()
    mockSchedules.set(schedule.id, schedule)
  })

  describe("GET /v1/businesses/{businessId}/users/{userId}/schedules/{scheduleId}/overrides", () => {
    it("should list all overrides for a schedule", async () => {
      const override1 = createMockOverride({ date: "2025-01-15" })
      const override2 = createMockOverride({
        id: "override-2",
        date: "2025-01-20",
        isAvailable: true,
        startTime: "10:00",
        endTime: "14:00",
      })
      mockOverrides.set(override1.id, override1)
      mockOverrides.set(override2.id, override2)

      const app = createTestRouter()
      const client = testClient(app)

      const res = await client["v1"]["businesses"][":businessId"]["users"][
        ":userId"
      ]["schedules"][":scheduleId"]["overrides"].$get({
        param: {
          businessId: mockUUIDs.businessId,
          userId: mockUUIDs.userId,
          scheduleId: mockUUIDs.scheduleId,
        },
        query: {},
      })

      expect(res.status).toBe(200)
      const json = (await res.json()) as { data: unknown[] }
      expect(json.data).toHaveLength(2)
    })

    it("should filter overrides by date range", async () => {
      const override = createMockOverride({ date: "2025-01-15" })
      mockOverrides.set(override.id, override)

      const app = createTestRouter()
      const client = testClient(app)

      const res = await client["v1"]["businesses"][":businessId"]["users"][
        ":userId"
      ]["schedules"][":scheduleId"]["overrides"].$get({
        param: {
          businessId: mockUUIDs.businessId,
          userId: mockUUIDs.userId,
          scheduleId: mockUUIDs.scheduleId,
        },
        query: {
          startDate: "2025-01-01",
          endDate: "2025-01-31",
        },
      })

      expect(res.status).toBe(200)
    })

    it("should return 404 when schedule not found", async () => {
      mockSchedules.clear()

      const app = createTestRouter()
      const client = testClient(app)

      const res = await client["v1"]["businesses"][":businessId"]["users"][
        ":userId"
      ]["schedules"][":scheduleId"]["overrides"].$get({
        param: {
          businessId: mockUUIDs.businessId,
          userId: mockUUIDs.userId,
          scheduleId: "00000000-0000-0000-0000-000000000000",
        },
        query: {},
      })

      expect(res.status).toBe(404)
    })
  })

  describe("POST /v1/businesses/{businessId}/users/{userId}/schedules/{scheduleId}/overrides", () => {
    it("should create an unavailable date override", async () => {
      const app = createTestRouter()
      const client = testClient(app)

      const res = await client["v1"]["businesses"][":businessId"]["users"][
        ":userId"
      ]["schedules"][":scheduleId"]["overrides"].$post({
        param: {
          businessId: mockUUIDs.businessId,
          userId: mockUUIDs.userId,
          scheduleId: mockUUIDs.scheduleId,
        },
        json: {
          date: "2025-12-25",
          isAvailable: false,
        },
      })

      expect(res.status).toBe(201)
      const json = (await res.json()) as { date: string; isAvailable: boolean }
      expect(json.date).toBe("2025-12-25")
      expect(json.isAvailable).toBe(false)
    })

    it("should create an override with custom hours", async () => {
      const app = createTestRouter()
      const client = testClient(app)

      const res = await client["v1"]["businesses"][":businessId"]["users"][
        ":userId"
      ]["schedules"][":scheduleId"]["overrides"].$post({
        param: {
          businessId: mockUUIDs.businessId,
          userId: mockUUIDs.userId,
          scheduleId: mockUUIDs.scheduleId,
        },
        json: {
          date: "2025-01-15",
          isAvailable: true,
          startTime: "10:00",
          endTime: "14:00",
        },
      })

      expect(res.status).toBe(201)
      const json = (await res.json()) as {
        isAvailable: boolean
        startTime: string
        endTime: string
      }
      expect(json.isAvailable).toBe(true)
      expect(json.startTime).toBe("10:00")
      expect(json.endTime).toBe("14:00")
    })

    it("should reject override with invalid time order", async () => {
      const app = createTestRouter()
      const client = testClient(app)

      const res = await client["v1"]["businesses"][":businessId"]["users"][
        ":userId"
      ]["schedules"][":scheduleId"]["overrides"].$post({
        param: {
          businessId: mockUUIDs.businessId,
          userId: mockUUIDs.userId,
          scheduleId: mockUUIDs.scheduleId,
        },
        json: {
          date: "2025-01-15",
          isAvailable: true,
          startTime: "17:00",
          endTime: "09:00",
        },
      })

      expect(res.status).toBe(400)
      const json = (await res.json()) as { message: string }
      expect(json.message).toContain("Start time must be before end time")
    })

    it("should reject times when marking as unavailable", async () => {
      const app = createTestRouter()
      const client = testClient(app)

      const res = await client["v1"]["businesses"][":businessId"]["users"][
        ":userId"
      ]["schedules"][":scheduleId"]["overrides"].$post({
        param: {
          businessId: mockUUIDs.businessId,
          userId: mockUUIDs.userId,
          scheduleId: mockUUIDs.scheduleId,
        },
        json: {
          date: "2025-01-15",
          isAvailable: false,
          startTime: "09:00",
          endTime: "17:00",
        },
      })

      expect(res.status).toBe(400)
      const json = (await res.json()) as { message: string }
      expect(json.message).toContain(
        "Times should not be set when marking date as unavailable"
      )
    })

    it("should return 404 when schedule not found", async () => {
      mockSchedules.clear()

      const app = createTestRouter()
      const client = testClient(app)

      const res = await client["v1"]["businesses"][":businessId"]["users"][
        ":userId"
      ]["schedules"][":scheduleId"]["overrides"].$post({
        param: {
          businessId: mockUUIDs.businessId,
          userId: mockUUIDs.userId,
          scheduleId: "00000000-0000-0000-0000-000000000000",
        },
        json: {
          date: "2025-01-15",
          isAvailable: false,
        },
      })

      expect(res.status).toBe(404)
    })
  })

  describe("PATCH /v1/businesses/{businessId}/users/{userId}/schedules/{scheduleId}/overrides/{overrideId}", () => {
    it("should update override availability", async () => {
      const override = createMockOverride({ isAvailable: false })
      mockOverrides.set(override.id, override)

      const app = createTestRouter()
      const client = testClient(app)

      const res = await client["v1"]["businesses"][":businessId"]["users"][
        ":userId"
      ]["schedules"][":scheduleId"]["overrides"][":overrideId"].$patch({
        param: {
          businessId: mockUUIDs.businessId,
          userId: mockUUIDs.userId,
          scheduleId: mockUUIDs.scheduleId,
          overrideId: mockUUIDs.overrideId,
        },
        json: {
          isAvailable: true,
          startTime: "10:00",
          endTime: "15:00",
        },
      })

      expect(res.status).toBe(200)
      const json = (await res.json()) as {
        isAvailable: boolean
        startTime: string
        endTime: string
      }
      expect(json.isAvailable).toBe(true)
      expect(json.startTime).toBe("10:00")
      expect(json.endTime).toBe("15:00")
    })

    it("should update override times", async () => {
      const override = createMockOverride({
        isAvailable: true,
        startTime: "09:00",
        endTime: "17:00",
      })
      mockOverrides.set(override.id, override)

      const app = createTestRouter()
      const client = testClient(app)

      const res = await client["v1"]["businesses"][":businessId"]["users"][
        ":userId"
      ]["schedules"][":scheduleId"]["overrides"][":overrideId"].$patch({
        param: {
          businessId: mockUUIDs.businessId,
          userId: mockUUIDs.userId,
          scheduleId: mockUUIDs.scheduleId,
          overrideId: mockUUIDs.overrideId,
        },
        json: {
          startTime: "08:00",
          endTime: "12:00",
        },
      })

      expect(res.status).toBe(200)
      const json = (await res.json()) as { startTime: string; endTime: string }
      expect(json.startTime).toBe("08:00")
      expect(json.endTime).toBe("12:00")
    })

    it("should reject update with invalid time order", async () => {
      const override = createMockOverride({
        isAvailable: true,
        startTime: "09:00",
        endTime: "17:00",
      })
      mockOverrides.set(override.id, override)

      const app = createTestRouter()
      const client = testClient(app)

      const res = await client["v1"]["businesses"][":businessId"]["users"][
        ":userId"
      ]["schedules"][":scheduleId"]["overrides"][":overrideId"].$patch({
        param: {
          businessId: mockUUIDs.businessId,
          userId: mockUUIDs.userId,
          scheduleId: mockUUIDs.scheduleId,
          overrideId: mockUUIDs.overrideId,
        },
        json: {
          startTime: "18:00", // After existing end time
        },
      })

      expect(res.status).toBe(400)
    })

    it("should return 404 when override not found", async () => {
      const app = createTestRouter()
      const client = testClient(app)

      const res = await client["v1"]["businesses"][":businessId"]["users"][
        ":userId"
      ]["schedules"][":scheduleId"]["overrides"][":overrideId"].$patch({
        param: {
          businessId: mockUUIDs.businessId,
          userId: mockUUIDs.userId,
          scheduleId: mockUUIDs.scheduleId,
          overrideId: "00000000-0000-0000-0000-000000000000",
        },
        json: {
          isAvailable: true,
        },
      })

      expect(res.status).toBe(404)
    })
  })

  describe("DELETE /v1/businesses/{businessId}/users/{userId}/schedules/{scheduleId}/overrides/{overrideId}", () => {
    it("should delete an override", async () => {
      const override = createMockOverride()
      mockOverrides.set(override.id, override)

      const app = createTestRouter()
      const client = testClient(app)

      const res = await client["v1"]["businesses"][":businessId"]["users"][
        ":userId"
      ]["schedules"][":scheduleId"]["overrides"][":overrideId"].$delete({
        param: {
          businessId: mockUUIDs.businessId,
          userId: mockUUIDs.userId,
          scheduleId: mockUUIDs.scheduleId,
          overrideId: mockUUIDs.overrideId,
        },
      })

      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.success).toBe(true)
      expect(json.message).toBe("Override deleted")
    })

    it("should return 404 when override not found", async () => {
      const app = createTestRouter()
      const client = testClient(app)

      const res = await client["v1"]["businesses"][":businessId"]["users"][
        ":userId"
      ]["schedules"][":scheduleId"]["overrides"][":overrideId"].$delete({
        param: {
          businessId: mockUUIDs.businessId,
          userId: mockUUIDs.userId,
          scheduleId: mockUUIDs.scheduleId,
          overrideId: "00000000-0000-0000-0000-000000000000",
        },
      })

      expect(res.status).toBe(404)
    })
  })
})
