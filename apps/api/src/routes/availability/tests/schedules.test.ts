import { testClient } from "hono/testing"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { createRouter } from "@/lib/helpers/app/create-app"
import * as routes from "../routes"
import {
  createMockBusiness,
  createMockBusinessUser,
  createMockRule,
  createMockSchedule,
  mockUUIDs,
} from "./test-utils"

// ============================================================================
// Mock Dependencies
// ============================================================================

// Mock the database module
const mockSchedules = new Map<string, ReturnType<typeof createMockSchedule>>()
const mockRules = new Map<string, ReturnType<typeof createMockRule>>()
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
          findFirst: vi.fn(async ({ where }: { where?: unknown } = {}) => {
            // Return schedule if it matches userId
            for (const schedule of mockSchedules.values()) {
              return { ...schedule, rules: Array.from(mockRules.values()) }
            }
            return null
          }),
        },
        availabilityRule: {
          findMany: vi.fn(async () => Array.from(mockRules.values())),
          findFirst: vi.fn(async () => mockRules.values().next().value ?? null),
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
            const newSchedule = {
              id: crypto.randomUUID(),
              createdAt: new Date(),
              updatedAt: new Date(),
              ...data,
            }
            mockSchedules.set(
              newSchedule.id as string,
              newSchedule as ReturnType<typeof createMockSchedule>
            )
            return [newSchedule]
          }),
        })),
      })),
      update: vi.fn((table: unknown) => ({
        set: vi.fn((data: Record<string, unknown>) => ({
          where: vi.fn((condition: unknown) => ({
            returning: vi.fn(async () => {
              const schedule = mockSchedules.values().next().value
              if (schedule) {
                const updated = { ...schedule, ...data, updatedAt: new Date() }
                mockSchedules.set(schedule.id, updated)
                return [updated]
              }
              return []
            }),
          })),
        })),
      })),
      delete: vi.fn((table: unknown) => ({
        where: vi.fn(async (condition: unknown) => {
          // Clear all schedules for testing
          mockSchedules.clear()
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

// Import handlers after mocking
import * as handlers from "../handlers"

function createTestRouter() {
  return createRouter()
    .openapi(routes.listSchedules, handlers.listSchedules)
    .openapi(routes.createSchedule, handlers.createSchedule)
    .openapi(routes.getSchedule, handlers.getSchedule)
    .openapi(routes.updateSchedule, handlers.updateSchedule)
    .openapi(routes.deleteSchedule, handlers.deleteSchedule)
}

describe("Availability Schedule CRUD", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSchedules.clear()
    mockRules.clear()
    mockBusiness = createMockBusiness()
    mockBusinessUser = createMockBusinessUser()
  })

  describe("GET /v1/businesses/{businessId}/users/{userId}/schedules", () => {
    it("should list all schedules for a user", async () => {
      const schedule1 = createMockSchedule({ name: "Morning Schedule" })
      const schedule2 = createMockSchedule({
        id: "schedule-2",
        name: "Evening Schedule",
        isDefault: false,
      })
      mockSchedules.set(schedule1.id, schedule1)
      mockSchedules.set(schedule2.id, schedule2)

      const app = createTestRouter()
      const client = testClient(app)

      const res = await client.v1.businesses[":businessId"].users[
        ":userId"
      ].schedules.$get({
        param: {
          businessId: mockUUIDs.businessId,
          userId: mockUUIDs.userId,
        },
      })

      expect(res.status).toBe(200)
      const json = (await res.json()) as { data: unknown[] }
      expect(json.data).toHaveLength(2)
    })

    it("should return 404 when business not found", async () => {
      mockBusiness = null

      const app = createTestRouter()
      const client = testClient(app)

      const res = await client.v1.businesses[":businessId"].users[
        ":userId"
      ].schedules.$get({
        param: {
          businessId: "00000000-0000-0000-0000-000000000000", // Valid UUID format but not found
          userId: mockUUIDs.userId,
        },
      })

      expect(res.status).toBe(404)
    })

    it("should return 404 when user not found", async () => {
      mockBusinessUser = null

      const app = createTestRouter()
      const client = testClient(app)

      const res = await client.v1.businesses[":businessId"].users[
        ":userId"
      ].schedules.$get({
        param: {
          businessId: mockUUIDs.businessId,
          userId: "00000000-0000-0000-0000-000000000000", // Valid UUID format but not found
        },
      })

      expect(res.status).toBe(404)
    })
  })

  describe("POST /v1/businesses/{businessId}/users/{userId}/schedules", () => {
    it("should create a new schedule", async () => {
      const app = createTestRouter()
      const client = testClient(app)

      const res = await client.v1.businesses[":businessId"].users[
        ":userId"
      ].schedules.$post({
        param: {
          businessId: mockUUIDs.businessId,
          userId: mockUUIDs.userId,
        },
        json: {
          name: "New Schedule",
          timezone: "America/Los_Angeles",
          isDefault: false,
        },
      })

      expect(res.status).toBe(201)
      const json = (await res.json()) as { name: string; timezone: string }
      expect(json.name).toBe("New Schedule")
      expect(json.timezone).toBe("America/Los_Angeles")
    })

    it("should create a default schedule", async () => {
      const app = createTestRouter()
      const client = testClient(app)

      const res = await client.v1.businesses[":businessId"].users[
        ":userId"
      ].schedules.$post({
        param: {
          businessId: mockUUIDs.businessId,
          userId: mockUUIDs.userId,
        },
        json: {
          name: "Default Schedule",
          timezone: "UTC",
          isDefault: true,
        },
      })

      expect(res.status).toBe(201)
      const json = (await res.json()) as { isDefault: boolean }
      expect(json.isDefault).toBe(true)
    })
  })

  describe("GET /v1/businesses/{businessId}/users/{userId}/schedules/{scheduleId}", () => {
    it("should get a schedule with its rules", async () => {
      const schedule = createMockSchedule()
      const rule = createMockRule()
      mockSchedules.set(schedule.id, schedule)
      mockRules.set(rule.id, rule)

      const app = createTestRouter()
      const client = testClient(app)

      const res = await client.v1.businesses[":businessId"].users[
        ":userId"
      ].schedules[":scheduleId"].$get({
        param: {
          businessId: mockUUIDs.businessId,
          userId: mockUUIDs.userId,
          scheduleId: mockUUIDs.scheduleId,
        },
      })

      expect(res.status).toBe(200)
      const json = (await res.json()) as { name: string; rules: unknown[] }
      expect(json.name).toBe("Default Schedule")
      expect(json.rules).toBeDefined()
    })

    it("should return 404 when schedule not found", async () => {
      // No schedules in map
      const app = createTestRouter()
      const client = testClient(app)

      const res = await client.v1.businesses[":businessId"].users[
        ":userId"
      ].schedules[":scheduleId"].$get({
        param: {
          businessId: mockUUIDs.businessId,
          userId: mockUUIDs.userId,
          scheduleId: "00000000-0000-0000-0000-000000000000", // Valid UUID format but not found
        },
      })

      expect(res.status).toBe(404)
    })
  })

  describe("PATCH /v1/businesses/{businessId}/users/{userId}/schedules/{scheduleId}", () => {
    it("should update a schedule name", async () => {
      const schedule = createMockSchedule()
      mockSchedules.set(schedule.id, schedule)

      const app = createTestRouter()
      const client = testClient(app)

      const res = await client.v1.businesses[":businessId"].users[
        ":userId"
      ].schedules[":scheduleId"].$patch({
        param: {
          businessId: mockUUIDs.businessId,
          userId: mockUUIDs.userId,
          scheduleId: mockUUIDs.scheduleId,
        },
        json: {
          name: "Updated Schedule Name",
        },
      })

      expect(res.status).toBe(200)
      const json = (await res.json()) as { name: string }
      expect(json.name).toBe("Updated Schedule Name")
    })

    it("should update schedule timezone", async () => {
      const schedule = createMockSchedule()
      mockSchedules.set(schedule.id, schedule)

      const app = createTestRouter()
      const client = testClient(app)

      const res = await client.v1.businesses[":businessId"].users[
        ":userId"
      ].schedules[":scheduleId"].$patch({
        param: {
          businessId: mockUUIDs.businessId,
          userId: mockUUIDs.userId,
          scheduleId: mockUUIDs.scheduleId,
        },
        json: {
          timezone: "Europe/London",
        },
      })

      expect(res.status).toBe(200)
      const json = (await res.json()) as { timezone: string }
      expect(json.timezone).toBe("Europe/London")
    })

    it("should set schedule as default", async () => {
      const schedule1 = createMockSchedule({ isDefault: true })
      const schedule2 = createMockSchedule({
        id: "schedule-2",
        name: "Second Schedule",
        isDefault: false,
      })
      mockSchedules.set(schedule1.id, schedule1)
      mockSchedules.set(schedule2.id, schedule2)

      const app = createTestRouter()
      const client = testClient(app)

      const res = await client.v1.businesses[":businessId"].users[
        ":userId"
      ].schedules[":scheduleId"].$patch({
        param: {
          businessId: mockUUIDs.businessId,
          userId: mockUUIDs.userId,
          scheduleId: mockUUIDs.scheduleId,
        },
        json: {
          isDefault: true,
        },
      })

      expect(res.status).toBe(200)
    })
  })

  describe("DELETE /v1/businesses/{businessId}/users/{userId}/schedules/{scheduleId}", () => {
    it("should delete a schedule", async () => {
      const schedule = createMockSchedule()
      mockSchedules.set(schedule.id, schedule)

      const app = createTestRouter()
      const client = testClient(app)

      const res = await client.v1.businesses[":businessId"].users[
        ":userId"
      ].schedules[":scheduleId"].$delete({
        param: {
          businessId: mockUUIDs.businessId,
          userId: mockUUIDs.userId,
          scheduleId: mockUUIDs.scheduleId,
        },
      })

      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.success).toBe(true)
      expect(json.message).toBe("Schedule deleted")
    })

    it("should return 404 when deleting non-existent schedule", async () => {
      // No schedules in map
      const app = createTestRouter()
      const client = testClient(app)

      const res = await client.v1.businesses[":businessId"].users[
        ":userId"
      ].schedules[":scheduleId"].$delete({
        param: {
          businessId: mockUUIDs.businessId,
          userId: mockUUIDs.userId,
          scheduleId: "00000000-0000-0000-0000-000000000000", // Valid UUID format but not found
        },
      })

      expect(res.status).toBe(404)
    })
  })
})
