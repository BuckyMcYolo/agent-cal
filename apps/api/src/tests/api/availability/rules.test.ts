import { testClient } from "hono/testing"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { createRouter } from "@/lib/helpers/app/create-app"
import * as routes from "@/routes/v1/availability/routes"
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
          findFirst: vi.fn(async () => {
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
        values: vi.fn(
          (data: Record<string, unknown> | Record<string, unknown>[]) => ({
            returning: vi.fn(async () => {
              const items = Array.isArray(data) ? data : [data]
              return items.map((item) => {
                const newRule = {
                  id: crypto.randomUUID(),
                  createdAt: new Date(),
                  updatedAt: new Date(),
                  ...item,
                }
                mockRules.set(
                  newRule.id as string,
                  newRule as ReturnType<typeof createMockRule>
                )
                return newRule
              })
            }),
          })
        ),
      })),
      update: vi.fn((table: unknown) => ({
        set: vi.fn((data: Record<string, unknown>) => ({
          where: vi.fn((condition: unknown) => ({
            returning: vi.fn(async () => {
              const rule = mockRules.values().next().value
              if (rule) {
                const updated = { ...rule, ...data, updatedAt: new Date() }
                mockRules.set(rule.id, updated)
                return [updated]
              }
              return []
            }),
          })),
        })),
      })),
      delete: vi.fn((table: unknown) => ({
        where: vi.fn(async (condition: unknown) => {
          mockRules.clear()
          return { rowCount: 1 }
        }),
      })),
      transaction: vi.fn(
        async (callback: (tx: unknown) => Promise<unknown>) => {
          // Create a mock transaction context
          const txInsert = vi.fn((table: unknown) => ({
            values: vi.fn((data: Record<string, unknown>[]) => ({
              returning: vi.fn(async () => {
                mockRules.clear() // Simulate delete first
                return data.map((item) => {
                  const newRule = {
                    id: crypto.randomUUID(),
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    ...item,
                  }
                  mockRules.set(
                    newRule.id as string,
                    newRule as ReturnType<typeof createMockRule>
                  )
                  return newRule
                })
              }),
            })),
          }))

          const txDelete = vi.fn((table: unknown) => ({
            where: vi.fn(async () => {
              mockRules.clear()
              return { rowCount: mockRules.size }
            }),
          }))

          const tx = { insert: txInsert, delete: txDelete }
          return callback(tx)
        }
      ),
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

import * as handlers from "@/routes/v1/availability/handlers"

function createTestRouter() {
  return createRouter()
    .openapi(routes.createRule, handlers.createRule)
    .openapi(routes.updateRule, handlers.updateRule)
    .openapi(routes.deleteRule, handlers.deleteRule)
    .openapi(routes.replaceRules, handlers.replaceRules)
}

describe("Availability Rules CRUD", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSchedules.clear()
    mockRules.clear()
    mockBusiness = createMockBusiness()
    mockBusinessUser = createMockBusinessUser()
    // Add a default schedule
    const schedule = createMockSchedule()
    mockSchedules.set(schedule.id, schedule)
  })

  describe("POST /v1/businesses/{businessId}/users/{userId}/schedules/{scheduleId}/rules", () => {
    it("should create a new rule", async () => {
      const app = createTestRouter()
      const client = testClient(app)

      const res = await client.businesses[":businessId"].users[
        ":userId"
      ].schedules[":scheduleId"].rules.$post({
        param: {
          businessId: mockUUIDs.businessId,
          userId: mockUUIDs.userId,
          scheduleId: mockUUIDs.scheduleId,
        },
        json: {
          dayOfWeek: 1,
          startTime: "09:00",
          endTime: "17:00",
        },
      })

      expect(res.status).toBe(201)
      const json = (await res.json()) as {
        dayOfWeek: number
        startTime: string
        endTime: string
      }
      expect(json.dayOfWeek).toBe(1)
      expect(json.startTime).toBe("09:00")
      expect(json.endTime).toBe("17:00")
    })

    it("should reject rule with invalid time order", async () => {
      const app = createTestRouter()
      const client = testClient(app)

      const res = await client.businesses[":businessId"].users[
        ":userId"
      ].schedules[":scheduleId"].rules.$post({
        param: {
          businessId: mockUUIDs.businessId,
          userId: mockUUIDs.userId,
          scheduleId: mockUUIDs.scheduleId,
        },
        json: {
          dayOfWeek: 1,
          startTime: "17:00",
          endTime: "09:00", // End before start
        },
      })

      expect(res.status).toBe(400)
      const json = (await res.json()) as { message: string }
      expect(json.message).toContain("Start time must be before end time")
    })

    it("should return 404 when schedule not found", async () => {
      mockSchedules.clear() // Remove all schedules

      const app = createTestRouter()
      const client = testClient(app)

      const res = await client.businesses[":businessId"].users[
        ":userId"
      ].schedules[":scheduleId"].rules.$post({
        param: {
          businessId: mockUUIDs.businessId,
          userId: mockUUIDs.userId,
          scheduleId: "00000000-0000-0000-0000-000000000000",
        },
        json: {
          dayOfWeek: 1,
          startTime: "09:00",
          endTime: "17:00",
        },
      })

      expect(res.status).toBe(404)
    })
  })

  describe("PATCH /v1/businesses/{businessId}/users/{userId}/schedules/{scheduleId}/rules/{ruleId}", () => {
    it("should update a rule's time", async () => {
      const rule = createMockRule()
      mockRules.set(rule.id, rule)

      const app = createTestRouter()
      const client = testClient(app)

      const res = await client.businesses[":businessId"].users[
        ":userId"
      ].schedules[":scheduleId"].rules[":ruleId"].$patch({
        param: {
          businessId: mockUUIDs.businessId,
          userId: mockUUIDs.userId,
          scheduleId: mockUUIDs.scheduleId,
          ruleId: mockUUIDs.ruleId,
        },
        json: {
          startTime: "10:00",
          endTime: "18:00",
        },
      })

      expect(res.status).toBe(200)
      const json = (await res.json()) as { startTime: string; endTime: string }
      expect(json.startTime).toBe("10:00")
      expect(json.endTime).toBe("18:00")
    })

    it("should update rule's day of week", async () => {
      const rule = createMockRule()
      mockRules.set(rule.id, rule)

      const app = createTestRouter()
      const client = testClient(app)

      const res = await client.businesses[":businessId"].users[
        ":userId"
      ].schedules[":scheduleId"].rules[":ruleId"].$patch({
        param: {
          businessId: mockUUIDs.businessId,
          userId: mockUUIDs.userId,
          scheduleId: mockUUIDs.scheduleId,
          ruleId: mockUUIDs.ruleId,
        },
        json: {
          dayOfWeek: 5, // Friday
        },
      })

      expect(res.status).toBe(200)
      const json = (await res.json()) as { dayOfWeek: number }
      expect(json.dayOfWeek).toBe(5)
    })

    it("should reject update with invalid time order", async () => {
      const rule = createMockRule({ startTime: "09:00", endTime: "17:00" })
      mockRules.set(rule.id, rule)

      const app = createTestRouter()
      const client = testClient(app)

      const res = await client.businesses[":businessId"].users[
        ":userId"
      ].schedules[":scheduleId"].rules[":ruleId"].$patch({
        param: {
          businessId: mockUUIDs.businessId,
          userId: mockUUIDs.userId,
          scheduleId: mockUUIDs.scheduleId,
          ruleId: mockUUIDs.ruleId,
        },
        json: {
          startTime: "18:00", // After existing end time of 17:00
        },
      })

      expect(res.status).toBe(400)
    })

    it("should return 404 when rule not found", async () => {
      // No rules in map
      const app = createTestRouter()
      const client = testClient(app)

      const res = await client.businesses[":businessId"].users[
        ":userId"
      ].schedules[":scheduleId"].rules[":ruleId"].$patch({
        param: {
          businessId: mockUUIDs.businessId,
          userId: mockUUIDs.userId,
          scheduleId: mockUUIDs.scheduleId,
          ruleId: "00000000-0000-0000-0000-000000000000",
        },
        json: {
          startTime: "10:00",
        },
      })

      expect(res.status).toBe(404)
    })
  })

  describe("DELETE /v1/businesses/{businessId}/users/{userId}/schedules/{scheduleId}/rules/{ruleId}", () => {
    it("should delete a rule", async () => {
      const rule = createMockRule()
      mockRules.set(rule.id, rule)

      const app = createTestRouter()
      const client = testClient(app)

      const res = await client.businesses[":businessId"].users[
        ":userId"
      ].schedules[":scheduleId"].rules[":ruleId"].$delete({
        param: {
          businessId: mockUUIDs.businessId,
          userId: mockUUIDs.userId,
          scheduleId: mockUUIDs.scheduleId,
          ruleId: mockUUIDs.ruleId,
        },
      })

      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.success).toBe(true)
      expect(json.message).toBe("Rule deleted")
    })

    it("should return 404 when rule not found", async () => {
      // No rules in map
      const app = createTestRouter()
      const client = testClient(app)

      const res = await client.businesses[":businessId"].users[
        ":userId"
      ].schedules[":scheduleId"].rules[":ruleId"].$delete({
        param: {
          businessId: mockUUIDs.businessId,
          userId: mockUUIDs.userId,
          scheduleId: mockUUIDs.scheduleId,
          ruleId: "00000000-0000-0000-0000-000000000000",
        },
      })

      expect(res.status).toBe(404)
    })
  })

  describe("PUT /v1/businesses/{businessId}/users/{userId}/schedules/{scheduleId}/rules", () => {
    it("should replace all rules with new ones", async () => {
      // Add existing rules
      const rule1 = createMockRule({ dayOfWeek: 1 })
      const rule2 = createMockRule({ id: "rule-2", dayOfWeek: 2 })
      mockRules.set(rule1.id, rule1)
      mockRules.set(rule2.id, rule2)

      const app = createTestRouter()
      const client = testClient(app)

      const res = await client.businesses[":businessId"].users[
        ":userId"
      ].schedules[":scheduleId"].rules.$put({
        param: {
          businessId: mockUUIDs.businessId,
          userId: mockUUIDs.userId,
          scheduleId: mockUUIDs.scheduleId,
        },
        json: {
          rules: [
            { dayOfWeek: 1, startTime: "08:00", endTime: "12:00" },
            { dayOfWeek: 1, startTime: "13:00", endTime: "17:00" },
            { dayOfWeek: 2, startTime: "09:00", endTime: "17:00" },
          ],
        },
      })

      expect(res.status).toBe(200)
      const json = (await res.json()) as { data: unknown[] }
      expect(json.data).toHaveLength(3)
    })

    it("should clear all rules when given empty array", async () => {
      const rule = createMockRule()
      mockRules.set(rule.id, rule)

      const app = createTestRouter()
      const client = testClient(app)

      const res = await client.businesses[":businessId"].users[
        ":userId"
      ].schedules[":scheduleId"].rules.$put({
        param: {
          businessId: mockUUIDs.businessId,
          userId: mockUUIDs.userId,
          scheduleId: mockUUIDs.scheduleId,
        },
        json: {
          rules: [],
        },
      })

      expect(res.status).toBe(200)
      const json = (await res.json()) as { data: unknown[] }
      expect(json.data).toHaveLength(0)
    })

    it("should reject batch with invalid rule", async () => {
      const app = createTestRouter()
      const client = testClient(app)

      const res = await client.businesses[":businessId"].users[
        ":userId"
      ].schedules[":scheduleId"].rules.$put({
        param: {
          businessId: mockUUIDs.businessId,
          userId: mockUUIDs.userId,
          scheduleId: mockUUIDs.scheduleId,
        },
        json: {
          rules: [
            { dayOfWeek: 1, startTime: "09:00", endTime: "17:00" },
            { dayOfWeek: 2, startTime: "17:00", endTime: "09:00" }, // Invalid
          ],
        },
      })

      expect(res.status).toBe(400)
      const json = (await res.json()) as { message: string }
      expect(json.message).toContain("Start time must be before end time")
    })

    it("should return 404 when schedule not found", async () => {
      mockSchedules.clear()

      const app = createTestRouter()
      const client = testClient(app)

      const res = await client.businesses[":businessId"].users[
        ":userId"
      ].schedules[":scheduleId"].rules.$put({
        param: {
          businessId: mockUUIDs.businessId,
          userId: mockUUIDs.userId,
          scheduleId: "00000000-0000-0000-0000-000000000000",
        },
        json: {
          rules: [{ dayOfWeek: 1, startTime: "09:00", endTime: "17:00" }],
        },
      })

      expect(res.status).toBe(404)
    })
  })
})
