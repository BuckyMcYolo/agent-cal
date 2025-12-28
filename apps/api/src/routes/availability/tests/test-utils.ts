import type { Context } from "hono"
import { vi } from "vitest"
import type { AppBindings, Member, Organization } from "@/lib/types/app-types"

// ============================================================================
// Mock Data Factories
// ============================================================================

export const mockUUIDs = {
  orgId: "550e8400-e29b-41d4-a716-446655440000",
  businessId: "550e8400-e29b-41d4-a716-446655440001",
  userId: "550e8400-e29b-41d4-a716-446655440002",
  scheduleId: "550e8400-e29b-41d4-a716-446655440003",
  ruleId: "550e8400-e29b-41d4-a716-446655440004",
  overrideId: "550e8400-e29b-41d4-a716-446655440005",
  eventTypeId: "550e8400-e29b-41d4-a716-446655440006",
  authUserId: "550e8400-e29b-41d4-a716-446655440007",
}

export function createMockOrganization(
  overrides: Partial<Organization> = {}
): Organization {
  return {
    id: mockUUIDs.orgId,
    name: "Test Org",
    slug: "test-org",
    logo: null,
    metadata: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    publishableKey: null,
    plan: null,
    stripeCustomerId: null,
    ...overrides,
  }
}

export function createMockMember(overrides: Partial<Member> = {}): Member {
  return {
    id: "member-1",
    userId: mockUUIDs.authUserId,
    organizationId: mockUUIDs.orgId,
    role: "owner",
    createdAt: new Date(),
    ...overrides,
  }
}

export function createMockBusiness(overrides: Record<string, unknown> = {}) {
  return {
    id: mockUUIDs.businessId,
    name: "Test Business",
    organizationId: mockUUIDs.orgId,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

export function createMockBusinessUser(
  overrides: Record<string, unknown> = {}
) {
  return {
    id: mockUUIDs.userId,
    businessId: mockUUIDs.businessId,
    name: "Test User",
    email: "test@example.com",
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

export function createMockSchedule(overrides: Record<string, unknown> = {}) {
  return {
    id: mockUUIDs.scheduleId,
    businessUserId: mockUUIDs.userId,
    name: "Default Schedule",
    timezone: "America/New_York",
    isDefault: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

export function createMockRule(overrides: Record<string, unknown> = {}) {
  return {
    id: mockUUIDs.ruleId,
    scheduleId: mockUUIDs.scheduleId,
    dayOfWeek: 1,
    startTime: "09:00:00",
    endTime: "17:00:00",
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

export function createMockOverride(overrides: Record<string, unknown> = {}) {
  return {
    id: mockUUIDs.overrideId,
    scheduleId: mockUUIDs.scheduleId,
    date: "2025-01-15",
    isAvailable: false,
    startTime: null,
    endTime: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

// ============================================================================
// Mock Context Factory
// ============================================================================

export interface MockContextParams {
  params?: Record<string, string>
  query?: Record<string, string>
  body?: unknown
  organization?: Organization | null
  member?: Member | null
}

export function createMockContext(
  options: MockContextParams = {}
): Partial<Context<AppBindings>> {
  const {
    params = {},
    query = {},
    body = {},
    organization = createMockOrganization(),
    member = createMockMember(),
  } = options

  return {
    req: {
      valid: vi.fn((type: string) => {
        if (type === "param") return params
        if (type === "query") return query
        if (type === "json") return body
        return {}
      }),
    } as unknown as Context<AppBindings>["req"],
    var: {
      organization,
      member,
      user: { id: mockUUIDs.authUserId, email: "auth@example.com" },
      session: null,
      authMethod: { type: "session", sessionId: "session-1" },
    } as unknown as Context<AppBindings>["var"],
  }
}

// ============================================================================
// Database Mock Helpers
// ============================================================================

export interface MockDbQuery {
  availabilitySchedule: {
    findMany: ReturnType<typeof vi.fn>
    findFirst: ReturnType<typeof vi.fn>
  }
  availabilityRule: {
    findMany: ReturnType<typeof vi.fn>
    findFirst: ReturnType<typeof vi.fn>
  }
  availabilityOverride: {
    findMany: ReturnType<typeof vi.fn>
    findFirst: ReturnType<typeof vi.fn>
  }
  business: {
    findFirst: ReturnType<typeof vi.fn>
  }
  businessUser: {
    findFirst: ReturnType<typeof vi.fn>
    findMany: ReturnType<typeof vi.fn>
  }
  eventType: {
    findFirst: ReturnType<typeof vi.fn>
  }
  calendarConnection: {
    findFirst: ReturnType<typeof vi.fn>
  }
}

export function createMockDbQuery(): MockDbQuery {
  return {
    availabilitySchedule: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
    availabilityRule: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
    availabilityOverride: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
    business: {
      findFirst: vi.fn(),
    },
    businessUser: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    eventType: {
      findFirst: vi.fn(),
    },
    calendarConnection: {
      findFirst: vi.fn(),
    },
  }
}

export interface MockDb {
  query: MockDbQuery
  insert: ReturnType<typeof vi.fn>
  update: ReturnType<typeof vi.fn>
  delete: ReturnType<typeof vi.fn>
  transaction: ReturnType<typeof vi.fn>
}

export function createMockDb(): MockDb {
  const mockQuery = createMockDbQuery()

  // Chainable insert mock
  const insertReturning = vi.fn()
  const insertValues = vi.fn(() => ({ returning: insertReturning }))
  const insert = vi.fn(() => ({ values: insertValues }))

  // Chainable update mock
  const updateReturning = vi.fn()
  const updateWhere = vi.fn(() => ({ returning: updateReturning }))
  const updateSet = vi.fn(() => ({ where: updateWhere }))
  const update = vi.fn(() => ({ set: updateSet }))

  // Chainable delete mock
  const deleteWhere = vi.fn()
  const deleteFn = vi.fn(() => ({ where: deleteWhere }))

  // Transaction mock
  const transaction = vi.fn(
    async (callback: (tx: unknown) => Promise<unknown>) => {
      const txInsertReturning = vi.fn()
      const txInsertValues = vi.fn(() => ({ returning: txInsertReturning }))
      const txInsert = vi.fn(() => ({ values: txInsertValues }))
      const txDeleteWhere = vi.fn()
      const txDelete = vi.fn(() => ({ where: txDeleteWhere }))

      const tx = {
        insert: txInsert,
        delete: txDelete,
        _insertReturning: txInsertReturning,
        _deleteWhere: txDeleteWhere,
      }

      return callback(tx)
    }
  )

  return {
    query: mockQuery,
    insert,
    update,
    delete: deleteFn,
    transaction,
  }
}
