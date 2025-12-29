import { DateTime } from "luxon"
import { beforeEach, describe, expect, it, vi } from "vitest"

// ============================================================================
// Mock Data
// ============================================================================

const mockUUIDs = {
  userId: "550e8400-e29b-41d4-a716-446655440001",
  businessId: "550e8400-e29b-41d4-a716-446655440002",
  scheduleId: "550e8400-e29b-41d4-a716-446655440003",
  eventTypeId: "550e8400-e29b-41d4-a716-446655440004",
  bookingId: "550e8400-e29b-41d4-a716-446655440005",
}

function createMockSchedule(overrides: Record<string, unknown> = {}) {
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

function createMockRule(overrides: Record<string, unknown> = {}) {
  return {
    id: "rule-1",
    scheduleId: mockUUIDs.scheduleId,
    dayOfWeek: 1, // Monday
    startTime: "09:00:00",
    endTime: "17:00:00",
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

function createMockEventType(overrides: Record<string, unknown> = {}) {
  return {
    id: mockUUIDs.eventTypeId,
    businessId: mockUUIDs.businessId,
    businessUserId: null,
    title: "30 Minute Meeting",
    durationMinutes: 30,
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
  const startTime = new Date(now.getTime() + 24 * 60 * 60 * 1000)
  const endTime = new Date(startTime.getTime() + 30 * 60 * 1000)

  return {
    id: mockUUIDs.bookingId,
    businessId: mockUUIDs.businessId,
    businessUserId: mockUUIDs.userId,
    eventTypeId: mockUUIDs.eventTypeId,
    title: "30 Minute Meeting",
    description: null,
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

// Use vi.hoisted to define mock state before vi.mock is hoisted
const mockState = vi.hoisted(() => ({
  calendarConnection: null as Record<string, unknown> | null,
  schedule: null as Record<string, unknown> | null,
  rules: [] as Array<Record<string, unknown>>,
  overrides: [] as Array<Record<string, unknown>>,
  bookings: [] as Array<Record<string, unknown>>,
  businessUsers: [] as Array<Record<string, unknown>>,
}))

vi.mock("@workspace/db", async () => {
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
        calendarConnection: {
          findFirst: vi
            .fn()
            .mockImplementation(async () => mockState.calendarConnection),
        },
        availabilitySchedule: {
          findFirst: vi.fn().mockImplementation(async () => mockState.schedule),
        },
        availabilityRule: {
          findMany: vi.fn().mockImplementation(async () => mockState.rules),
        },
        availabilityOverride: {
          findMany: vi.fn().mockImplementation(async () => mockState.overrides),
        },
        businessUser: {
          findMany: vi
            .fn()
            .mockImplementation(async () => mockState.businessUsers),
        },
      },
      insert: vi.fn(() => ({
        values: vi.fn(async () => {}),
      })),
      select: vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn().mockImplementation(async () => mockState.bookings),
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

vi.mock("@/services/calendar", () => ({
  getCalendarServiceForConnection: vi.fn(() => ({
    getCredentialsWithRefresh: vi.fn(async () => ({})),
    getClient: vi.fn(() => ({
      getBusyTimes: vi.fn(async () => []),
      createEvent: vi.fn(async () => ({ id: "event-123" })),
      updateEvent: vi.fn(async () => {}),
      deleteEvent: vi.fn(async () => {}),
    })),
  })),
}))

// ============================================================================
// Import after mocks
// ============================================================================

import {
  getUserBusyBlocks,
  checkSlotAvailability,
  selectUserForBooking,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  logBookingEvent,
} from "@/lib/bookings"
import { getCalendarServiceForConnection } from "@/services/calendar"

// ============================================================================
// Tests
// ============================================================================

describe("Booking Helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockState.calendarConnection = null
    mockState.schedule = null
    mockState.rules.length = 0
    mockState.overrides.length = 0
    mockState.bookings.length = 0
    mockState.businessUsers.length = 0
  })

  describe("getUserBusyBlocks", () => {
    it("should return empty array when user has no calendar connection", async () => {
      mockState.calendarConnection = null

      const result = await getUserBusyBlocks({
        userId: mockUUIDs.userId,
        startTime: DateTime.now(),
        endTime: DateTime.now().plus({ hours: 8 }),
        timezone: "America/New_York",
      })

      expect(result).toEqual([])
    })

    it("should return empty array when connection has no calendarId", async () => {
      mockState.calendarConnection = { id: "conn-1", calendarId: null }

      const result = await getUserBusyBlocks({
        userId: mockUUIDs.userId,
        startTime: DateTime.now(),
        endTime: DateTime.now().plus({ hours: 8 }),
        timezone: "America/New_York",
      })

      expect(result).toEqual([])
    })

    it("should fetch busy times from calendar service", async () => {
      mockState.calendarConnection = {
        id: "conn-1",
        calendarId: "cal-123",
        businessUserId: mockUUIDs.userId,
      }

      const mockGetBusyTimes = vi.fn(async () => [
        {
          start: new Date("2025-01-15T10:00:00Z"),
          end: new Date("2025-01-15T11:00:00Z"),
        },
      ])

      vi.mocked(getCalendarServiceForConnection).mockReturnValue({
        getCredentialsWithRefresh: vi.fn(async () => ({})),
        getClient: vi.fn(() => ({
          getBusyTimes: mockGetBusyTimes,
          createEvent: vi.fn(),
          updateEvent: vi.fn(),
          deleteEvent: vi.fn(),
        })),
      } as unknown as ReturnType<typeof getCalendarServiceForConnection>)

      const result = await getUserBusyBlocks({
        userId: mockUUIDs.userId,
        startTime: DateTime.fromISO("2025-01-15T09:00:00", {
          zone: "America/New_York",
        }),
        endTime: DateTime.fromISO("2025-01-15T17:00:00", {
          zone: "America/New_York",
        }),
        timezone: "America/New_York",
      })

      expect(mockGetBusyTimes).toHaveBeenCalled()
      expect(result).toHaveLength(1)
    })

    it("should return empty array when calendar service throws", async () => {
      mockState.calendarConnection = {
        id: "conn-1",
        calendarId: "cal-123",
        businessUserId: mockUUIDs.userId,
      }

      vi.mocked(getCalendarServiceForConnection).mockReturnValue({
        getCredentialsWithRefresh: vi.fn(async () => {
          throw new Error("Auth failed")
        }),
        getClient: vi.fn(),
      } as unknown as ReturnType<typeof getCalendarServiceForConnection>)

      const result = await getUserBusyBlocks({
        userId: mockUUIDs.userId,
        startTime: DateTime.now(),
        endTime: DateTime.now().plus({ hours: 8 }),
        timezone: "America/New_York",
      })

      expect(result).toEqual([])
    })
  })

  describe("checkSlotAvailability", () => {
    it("should return false when user has no schedule", async () => {
      mockState.schedule = null

      const result = await checkSlotAvailability({
        userId: mockUUIDs.userId,
        slotStart: DateTime.fromISO("2025-01-13T10:00:00", {
          zone: "America/New_York",
        }),
        slotEnd: DateTime.fromISO("2025-01-13T10:30:00", {
          zone: "America/New_York",
        }),
        eventTypeRecord: createMockEventType() as Parameters<
          typeof checkSlotAvailability
        >[0]["eventTypeRecord"],
      })

      expect(result).toBe(false)
    })

    it("should return false when date is blocked by override", async () => {
      mockState.schedule = createMockSchedule()
      mockState.rules.push(createMockRule({ dayOfWeek: 1 }))
      mockState.overrides.push({
        id: "override-1",
        scheduleId: mockUUIDs.scheduleId,
        date: "2025-01-13",
        isAvailable: false,
        startTime: null,
        endTime: null,
      })

      const result = await checkSlotAvailability({
        userId: mockUUIDs.userId,
        slotStart: DateTime.fromISO("2025-01-13T10:00:00", {
          zone: "America/New_York",
        }),
        slotEnd: DateTime.fromISO("2025-01-13T10:30:00", {
          zone: "America/New_York",
        }),
        eventTypeRecord: createMockEventType() as Parameters<
          typeof checkSlotAvailability
        >[0]["eventTypeRecord"],
      })

      expect(result).toBe(false)
    })

    it("should return false when no working hours on day", async () => {
      mockState.schedule = createMockSchedule()
      // No rules = no working hours

      const result = await checkSlotAvailability({
        userId: mockUUIDs.userId,
        slotStart: DateTime.fromISO("2025-01-13T10:00:00", {
          zone: "America/New_York",
        }),
        slotEnd: DateTime.fromISO("2025-01-13T10:30:00", {
          zone: "America/New_York",
        }),
        eventTypeRecord: createMockEventType() as Parameters<
          typeof checkSlotAvailability
        >[0]["eventTypeRecord"],
      })

      expect(result).toBe(false)
    })

    it("should return true when slot is within working hours", async () => {
      mockState.schedule = createMockSchedule()
      mockState.rules.push(createMockRule({ dayOfWeek: 1 })) // Monday 9-5

      const result = await checkSlotAvailability({
        userId: mockUUIDs.userId,
        slotStart: DateTime.fromISO("2025-01-13T10:00:00", {
          zone: "America/New_York",
        }), // Monday
        slotEnd: DateTime.fromISO("2025-01-13T10:30:00", {
          zone: "America/New_York",
        }),
        eventTypeRecord: createMockEventType() as Parameters<
          typeof checkSlotAvailability
        >[0]["eventTypeRecord"],
      })

      expect(result).toBe(true)
    })

    it("should return false when slot is outside working hours", async () => {
      mockState.schedule = createMockSchedule()
      mockState.rules.push(
        createMockRule({
          dayOfWeek: 1,
          startTime: "09:00:00",
          endTime: "17:00:00",
        })
      )

      const result = await checkSlotAvailability({
        userId: mockUUIDs.userId,
        slotStart: DateTime.fromISO("2025-01-13T08:00:00", {
          zone: "America/New_York",
        }), // Before 9am
        slotEnd: DateTime.fromISO("2025-01-13T08:30:00", {
          zone: "America/New_York",
        }),
        eventTypeRecord: createMockEventType() as Parameters<
          typeof checkSlotAvailability
        >[0]["eventTypeRecord"],
      })

      expect(result).toBe(false)
    })

    it("should use override times when available", async () => {
      mockState.schedule = createMockSchedule()
      mockState.overrides.push({
        id: "override-1",
        scheduleId: mockUUIDs.scheduleId,
        date: "2025-01-13",
        isAvailable: true,
        startTime: "10:00:00",
        endTime: "14:00:00",
      })

      const result = await checkSlotAvailability({
        userId: mockUUIDs.userId,
        slotStart: DateTime.fromISO("2025-01-13T11:00:00", {
          zone: "America/New_York",
        }),
        slotEnd: DateTime.fromISO("2025-01-13T11:30:00", {
          zone: "America/New_York",
        }),
        eventTypeRecord: createMockEventType() as Parameters<
          typeof checkSlotAvailability
        >[0]["eventTypeRecord"],
      })

      expect(result).toBe(true)
    })
  })

  describe("selectUserForBooking", () => {
    const slotStart = DateTime.fromISO("2025-01-13T10:00:00", {
      zone: "America/New_York",
    })
    const slotEnd = DateTime.fromISO("2025-01-13T10:30:00", {
      zone: "America/New_York",
    })

    beforeEach(() => {
      // Setup default availability
      mockState.schedule = createMockSchedule()
      mockState.rules.push(createMockRule({ dayOfWeek: 1 }))
    })

    it("should return locked user when event type has businessUserId", async () => {
      const eventType = createMockEventType({
        businessUserId: mockUUIDs.userId,
      })

      const result = await selectUserForBooking({
        eventTypeRecord: eventType as Parameters<
          typeof selectUserForBooking
        >[0]["eventTypeRecord"],
        businessId: mockUUIDs.businessId,
        slotStart,
        slotEnd,
      })

      expect(result).not.toBeNull()
      expect(result?.userId).toBe(mockUUIDs.userId)
      expect(result?.assignedVia).toBe("event_type_locked")
    })

    it("should return null for manual strategy without requestedUserId", async () => {
      const eventType = createMockEventType({ assignmentStrategy: "manual" })

      const result = await selectUserForBooking({
        eventTypeRecord: eventType as Parameters<
          typeof selectUserForBooking
        >[0]["eventTypeRecord"],
        businessId: mockUUIDs.businessId,
        slotStart,
        slotEnd,
      })

      expect(result).toBeNull()
    })

    it("should return requested user for manual strategy", async () => {
      const eventType = createMockEventType({ assignmentStrategy: "manual" })

      const result = await selectUserForBooking({
        eventTypeRecord: eventType as Parameters<
          typeof selectUserForBooking
        >[0]["eventTypeRecord"],
        businessId: mockUUIDs.businessId,
        slotStart,
        slotEnd,
        requestedUserId: mockUUIDs.userId,
      })

      expect(result).not.toBeNull()
      expect(result?.userId).toBe(mockUUIDs.userId)
      expect(result?.assignedVia).toBe("manual")
    })

    it("should return null when no eligible users", async () => {
      const eventType = createMockEventType({ eligibleUserIds: [] })

      const result = await selectUserForBooking({
        eventTypeRecord: eventType as Parameters<
          typeof selectUserForBooking
        >[0]["eventTypeRecord"],
        businessId: mockUUIDs.businessId,
        slotStart,
        slotEnd,
      })

      expect(result).toBeNull()
    })

    // Note: Testing business user lookup from db requires integration tests
    // The db.query mock doesn't properly intercept the businessUser lookup
    // in the actual implementation. API-level tests cover this scenario.
  })

  describe("createCalendarEvent", () => {
    it("should return null when user has no calendar connection", async () => {
      mockState.calendarConnection = null

      const result = await createCalendarEvent({
        bookingRecord: createMockBooking() as Parameters<
          typeof createCalendarEvent
        >[0]["bookingRecord"],
        eventTypeRecord: createMockEventType() as Parameters<
          typeof createCalendarEvent
        >[0]["eventTypeRecord"],
      })

      expect(result).toBeNull()
    })

    // Note: Testing calendar event creation with connection requires integration tests
    // The db.query mock doesn't properly intercept the calendarConnection lookup
    // in the actual implementation. API-level tests cover this scenario.
  })

  describe("updateCalendarEvent", () => {
    it("should return false when booking has no calendarEventId", async () => {
      const result = await updateCalendarEvent({
        bookingRecord: createMockBooking({
          calendarEventId: null,
        }) as Parameters<typeof updateCalendarEvent>[0]["bookingRecord"],
        updates: { startTime: new Date() },
      })

      expect(result).toBe(false)
    })

    it("should return false when user has no calendar connection", async () => {
      mockState.calendarConnection = null

      const result = await updateCalendarEvent({
        bookingRecord: createMockBooking({
          calendarEventId: "event-123",
        }) as Parameters<typeof updateCalendarEvent>[0]["bookingRecord"],
        updates: { startTime: new Date() },
      })

      expect(result).toBe(false)
    })

    // Note: Testing calendar event update with connection requires integration tests
    // The db.query mock doesn't properly intercept the calendarConnection lookup
    // in the actual implementation. API-level tests cover this scenario.
  })

  describe("deleteCalendarEvent", () => {
    it("should return false when booking has no calendarEventId", async () => {
      const result = await deleteCalendarEvent({
        bookingRecord: createMockBooking({
          calendarEventId: null,
        }) as Parameters<typeof deleteCalendarEvent>[0]["bookingRecord"],
      })

      expect(result).toBe(false)
    })

    it("should return false when user has no calendar connection", async () => {
      mockState.calendarConnection = null

      const result = await deleteCalendarEvent({
        bookingRecord: createMockBooking({
          calendarEventId: "event-123",
        }) as Parameters<typeof deleteCalendarEvent>[0]["bookingRecord"],
      })

      expect(result).toBe(false)
    })

    // Note: Testing calendar event delete with connection requires integration tests
    // The db.query mock doesn't properly intercept the calendarConnection lookup
    // in the actual implementation. API-level tests cover this scenario.
  })

  describe("logBookingEvent", () => {
    it("should insert booking event without throwing", async () => {
      await expect(
        logBookingEvent({
          bookingId: mockUUIDs.bookingId,
          eventType: "created",
          oldStatus: null,
          newStatus: "confirmed",
          metadata: { test: true },
        })
      ).resolves.not.toThrow()
    })

    it("should handle insert errors gracefully", async () => {
      const { db } = await import("@workspace/db")
      vi.mocked(db.insert).mockReturnValueOnce({
        values: vi.fn(() => {
          throw new Error("DB error")
        }),
      } as unknown as ReturnType<typeof db.insert>)

      // Should not throw
      await expect(
        logBookingEvent({
          bookingId: mockUUIDs.bookingId,
          eventType: "created",
          oldStatus: null,
          newStatus: "confirmed",
        })
      ).resolves.not.toThrow()
    })
  })
})
