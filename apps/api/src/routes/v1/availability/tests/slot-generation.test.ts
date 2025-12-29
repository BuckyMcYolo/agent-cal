import { DateTime } from "luxon"
import { describe, expect, it } from "vitest"
import {
  type BusyBlock,
  generateDaySlots,
  parseTimeString,
} from "@/lib/time/slot-generation"

describe("parseTimeString", () => {
  it("parses HH:MM format", () => {
    expect(parseTimeString("09:00")).toEqual({ hour: 9, minute: 0 })
    expect(parseTimeString("14:30")).toEqual({ hour: 14, minute: 30 })
    expect(parseTimeString("00:00")).toEqual({ hour: 0, minute: 0 })
    expect(parseTimeString("23:59")).toEqual({ hour: 23, minute: 59 })
  })

  it("parses HH:MM:SS format", () => {
    expect(parseTimeString("09:00:00")).toEqual({ hour: 9, minute: 0 })
    expect(parseTimeString("14:30:45")).toEqual({ hour: 14, minute: 30 })
  })
})

describe("generateDaySlots", () => {
  const baseDate = DateTime.fromISO("2025-01-15", { zone: "UTC" })
  const farPast = DateTime.fromISO("2020-01-01", { zone: "UTC" })

  describe("basic slot generation", () => {
    it("generates correct number of 30-min slots for 9am-5pm", () => {
      const slots = generateDaySlots(
        baseDate,
        [{ startTime: "09:00", endTime: "17:00" }],
        30, // duration
        30, // step
        [], // no busy blocks
        0, // no buffer before
        0, // no buffer after
        farPast // no minimum notice constraint
      )

      // 9:00-17:00 = 8 hours = 480 mins / 30 = 16 slots
      expect(slots).toHaveLength(16)
      expect(slots[0]?.start.hour).toBe(9)
      expect(slots[0]?.start.minute).toBe(0)
      expect(slots[15]?.start.hour).toBe(16)
      expect(slots[15]?.start.minute).toBe(30)
    })

    it("generates correct number of 60-min slots for 9am-5pm", () => {
      const slots = generateDaySlots(
        baseDate,
        [{ startTime: "09:00", endTime: "17:00" }],
        60, // duration
        60, // step
        [],
        0,
        0,
        farPast
      )

      // 8 hours / 60 mins = 8 slots
      expect(slots).toHaveLength(8)
    })

    it("generates no slots when duration exceeds available time", () => {
      const slots = generateDaySlots(
        baseDate,
        [{ startTime: "09:00", endTime: "09:30" }],
        60, // 60-min duration doesn't fit in 30-min window
        60,
        [],
        0,
        0,
        farPast
      )

      expect(slots).toHaveLength(0)
    })
  })

  describe("slot step size", () => {
    it("generates more slots with smaller step than duration", () => {
      const slots = generateDaySlots(
        baseDate,
        [{ startTime: "09:00", endTime: "10:00" }],
        30, // 30-min appointments
        15, // 15-min step (more frequent start times)
        [],
        0,
        0,
        farPast
      )

      // 9:00, 9:15, 9:30 = 3 slots that can fit 30-min duration before 10:00
      expect(slots).toHaveLength(3)
      expect(slots[0]?.start.hour).toBe(9)
      expect(slots[0]?.start.minute).toBe(0)
      expect(slots[1]?.start.minute).toBe(15)
      expect(slots[2]?.start.minute).toBe(30)
    })

    it("generates fewer slots with larger step than duration", () => {
      const slots = generateDaySlots(
        baseDate,
        [{ startTime: "09:00", endTime: "11:00" }],
        30, // 30-min appointments
        60, // 60-min step (gaps between options)
        [],
        0,
        0,
        farPast
      )

      // 9:00 and 10:00 = 2 slots
      expect(slots).toHaveLength(2)
      expect(slots[0]?.start.hour).toBe(9)
      expect(slots[1]?.start.hour).toBe(10)
    })
  })

  describe("busy block conflicts", () => {
    it("excludes slots that overlap with busy blocks", () => {
      const busyBlocks: BusyBlock[] = [
        {
          start: DateTime.fromISO("2025-01-15T10:00:00", { zone: "UTC" }),
          end: DateTime.fromISO("2025-01-15T11:00:00", { zone: "UTC" }),
        },
      ]

      const slots = generateDaySlots(
        baseDate,
        [{ startTime: "09:00", endTime: "12:00" }],
        30,
        30,
        busyBlocks,
        0,
        0,
        farPast
      )

      // 9:00-12:00 = 6 slots normally, minus 2 (10:00 and 10:30) = 4 slots
      expect(slots).toHaveLength(4)

      // Verify no slots start during the busy period
      const hasConflictingSlot = slots.some(
        (s) => s.start.hour === 10 && s.start.minute < 30
      )
      expect(hasConflictingSlot).toBe(false)
    })

    it("excludes slots that would end during a busy block", () => {
      const busyBlocks: BusyBlock[] = [
        {
          start: DateTime.fromISO("2025-01-15T10:15:00", { zone: "UTC" }),
          end: DateTime.fromISO("2025-01-15T10:45:00", { zone: "UTC" }),
        },
      ]

      const slots = generateDaySlots(
        baseDate,
        [{ startTime: "09:00", endTime: "11:00" }],
        30,
        30,
        busyBlocks,
        0,
        0,
        farPast
      )

      // 10:00-10:30 slot would overlap with busy 10:15-10:45
      const has10amSlot = slots.some(
        (s) => s.start.hour === 10 && s.start.minute === 0
      )
      expect(has10amSlot).toBe(false)
    })
  })

  describe("buffer times", () => {
    it("respects buffer before meetings - slot before busy needs buffer gap", () => {
      // Busy block at 10:00-10:30
      // With 15-min buffer BEFORE the new slot, the slot's buffer extends backwards
      // So a 9:30-10:00 slot with buffer starts checking at 9:15
      // This doesn't conflict with 10:00 busy block
      // But a 9:45-10:15 slot (if we had 15-min step) would have buffer at 9:30, still no conflict
      // The buffer BEFORE means we need gap before OUR slot, not before the busy block

      // Actually, buffer before/after refers to the SLOT we're creating
      // bufferBefore = 15 means the slot "occupies" 15 mins before its start
      // So 9:30-10:00 slot with bufferBefore=15 has footprint 9:15-10:00
      // This doesn't overlap with 10:00-10:30 busy block (they just touch)

      // Let's test: busy at 10:00, slot 9:30-10:00 with bufferAfter=15 would be 9:30-10:15 footprint
      // That WOULD overlap with 10:00-10:30
      const busyBlocks: BusyBlock[] = [
        {
          start: DateTime.fromISO("2025-01-15T10:00:00", { zone: "UTC" }),
          end: DateTime.fromISO("2025-01-15T10:30:00", { zone: "UTC" }),
        },
      ]

      const slots = generateDaySlots(
        baseDate,
        [{ startTime: "09:00", endTime: "11:00" }],
        30,
        30,
        busyBlocks,
        0,
        15, // buffer AFTER - slot 9:30-10:00 has footprint 9:30-10:15, conflicts with 10:00 busy
        farPast
      )

      // 9:30-10:00 slot with 15-min buffer after has footprint 9:30-10:15
      // This overlaps with busy 10:00-10:30, so slot should be excluded
      const has930Slot = slots.some(
        (s) => s.start.hour === 9 && s.start.minute === 30
      )
      expect(has930Slot).toBe(false)
    })

    it("respects buffer before - slot after busy needs buffer gap", () => {
      // Busy block 9:00-9:30
      // A slot 9:30-10:00 with bufferBefore=15 has footprint 9:15-10:00
      // This overlaps with busy 9:00-9:30, so should be excluded
      const busyBlocks: BusyBlock[] = [
        {
          start: DateTime.fromISO("2025-01-15T09:00:00", { zone: "UTC" }),
          end: DateTime.fromISO("2025-01-15T09:30:00", { zone: "UTC" }),
        },
      ]

      const slots = generateDaySlots(
        baseDate,
        [{ startTime: "09:00", endTime: "11:00" }],
        30,
        30,
        busyBlocks,
        15, // buffer BEFORE - slot 9:30-10:00 has footprint 9:15-10:00
        0,
        farPast
      )

      // 9:30-10:00 slot with 15-min buffer before has footprint 9:15-10:00
      // This overlaps with busy 9:00-9:30, so slot should be excluded
      const has930Slot = slots.some(
        (s) => s.start.hour === 9 && s.start.minute === 30
      )
      expect(has930Slot).toBe(false)
    })
  })

  describe("minimum notice time", () => {
    it("excludes slots before minimum notice time", () => {
      const minNotice = DateTime.fromISO("2025-01-15T10:30:00", { zone: "UTC" })

      const slots = generateDaySlots(
        baseDate,
        [{ startTime: "09:00", endTime: "12:00" }],
        30,
        30,
        [],
        0,
        0,
        minNotice
      )

      // All slots before 10:30 should be excluded
      const hasEarlySlot = slots.some((s) => s.start < minNotice)
      expect(hasEarlySlot).toBe(false)
      expect(slots[0]?.start.hour).toBe(10)
      expect(slots[0]?.start.minute).toBe(30)
    })
  })

  describe("multiple rules per day", () => {
    it("combines slots from multiple rules (lunch break)", () => {
      const slots = generateDaySlots(
        baseDate,
        [
          { startTime: "09:00", endTime: "12:00" }, // Morning
          { startTime: "13:00", endTime: "17:00" }, // Afternoon
        ],
        60,
        60,
        [],
        0,
        0,
        farPast
      )

      // 3 morning slots + 4 afternoon slots = 7 total
      expect(slots).toHaveLength(7)

      // No slots during lunch (12:00-13:00)
      const hasLunchSlot = slots.some((s) => s.start.hour === 12)
      expect(hasLunchSlot).toBe(false)
    })
  })

  describe("timezone handling", () => {
    it("generates slots in the correct timezone", () => {
      const nyDate = DateTime.fromISO("2025-01-15", {
        zone: "America/New_York",
      })
      const farPastNY = DateTime.fromISO("2020-01-01", {
        zone: "America/New_York",
      })

      const slots = generateDaySlots(
        nyDate,
        [{ startTime: "09:00", endTime: "12:00" }],
        60,
        60,
        [],
        0,
        0,
        farPastNY
      )

      expect(slots).toHaveLength(3)
      // Slots should be in NY timezone
      expect(slots[0]?.start.zoneName).toBe("America/New_York")
      expect(slots[0]?.start.hour).toBe(9)
      // 9am NY = 2pm UTC (EST is UTC-5)
      expect(slots[0]?.start.toUTC().hour).toBe(14)
    })

    it("handles busy blocks across timezone boundaries", () => {
      // Schedule in New York
      const nyDate = DateTime.fromISO("2025-01-15", {
        zone: "America/New_York",
      })
      const farPastNY = DateTime.fromISO("2020-01-01", {
        zone: "America/New_York",
      })

      // Busy block from Google Calendar might come in UTC
      // 3pm UTC = 10am NY
      const busyBlocks: BusyBlock[] = [
        {
          start: DateTime.fromISO("2025-01-15T15:00:00", { zone: "UTC" }),
          end: DateTime.fromISO("2025-01-15T16:00:00", { zone: "UTC" }),
        },
      ]

      const slots = generateDaySlots(
        nyDate,
        [{ startTime: "09:00", endTime: "12:00" }], // 9am-12pm NY
        60,
        60,
        busyBlocks,
        0,
        0,
        farPastNY
      )

      // 9am, 10am, 11am NY slots
      // 10am NY = 3pm UTC, conflicts with busy block
      // Should have 2 slots: 9am and 11am
      expect(slots).toHaveLength(2)
      expect(slots[0]?.start.hour).toBe(9)
      expect(slots[1]?.start.hour).toBe(11)
    })

    it("handles DST transition day - spring forward", () => {
      // March 9, 2025: US clocks spring forward at 2am -> 3am
      const dstDate = DateTime.fromISO("2025-03-09", {
        zone: "America/New_York",
      })
      const farPastNY = DateTime.fromISO("2020-01-01", {
        zone: "America/New_York",
      })

      const slots = generateDaySlots(
        dstDate,
        [{ startTime: "01:00", endTime: "04:00" }], // 1am-4am window
        60,
        60,
        [],
        0,
        0,
        farPastNY
      )

      // 1am exists, 2am doesn't exist (skipped), 3am exists
      // So we should get 1am and 3am = 2 slots
      // Note: Luxon handles this - 2am on this day is invalid
      expect(slots).toHaveLength(2)
      expect(slots[0]?.start.hour).toBe(1)
      expect(slots[1]?.start.hour).toBe(3)
    })

    it("handles DST transition day - fall back", () => {
      // Nov 2, 2025: US clocks fall back at 2am -> 1am
      const dstDate = DateTime.fromISO("2025-11-02", {
        zone: "America/New_York",
      })
      const farPastNY = DateTime.fromISO("2020-01-01", {
        zone: "America/New_York",
      })

      const slots = generateDaySlots(
        dstDate,
        [{ startTime: "09:00", endTime: "13:00" }], // 9am-1pm (well after DST change)
        60,
        60,
        [],
        0,
        0,
        farPastNY
      )

      // 9am, 10am, 11am, 12pm = 4 slots
      // DST transition at 2am shouldn't affect daytime slots
      expect(slots).toHaveLength(4)
      expect(slots[0]?.start.hour).toBe(9)
      expect(slots[3]?.start.hour).toBe(12)
    })

    it("converts slots to different output timezone", () => {
      // Generate in NY timezone
      const nyDate = DateTime.fromISO("2025-01-15", {
        zone: "America/New_York",
      })
      const farPastNY = DateTime.fromISO("2020-01-01", {
        zone: "America/New_York",
      })

      const slots = generateDaySlots(
        nyDate,
        [{ startTime: "09:00", endTime: "10:00" }],
        30,
        30,
        [],
        0,
        0,
        farPastNY
      )

      // Convert to LA timezone for response
      const laSlots = slots.map((s) => ({
        start: s.start.setZone("America/Los_Angeles"),
        end: s.end.setZone("America/Los_Angeles"),
      }))

      // 9am NY = 6am LA (3 hour difference)
      expect(laSlots[0]?.start.hour).toBe(6)
      expect(laSlots[1]?.start.hour).toBe(6)
      expect(laSlots[1]?.start.minute).toBe(30)
    })

    it("handles minimum notice across timezones", () => {
      // Schedule in Tokyo (UTC+9)
      const tokyoDate = DateTime.fromISO("2025-01-16", { zone: "Asia/Tokyo" })

      // Current time is 10am in New York on Jan 15 = midnight Jan 16 in Tokyo
      // Min notice is 2 hours, so earliest slot is 2am Tokyo on Jan 16
      const nowNY = DateTime.fromISO("2025-01-15T10:00:00", {
        zone: "America/New_York",
      })
      const minNotice = nowNY.plus({ hours: 2 }) // noon NY Jan 15 = 2am Tokyo Jan 16

      const slots = generateDaySlots(
        tokyoDate, // Jan 16 Tokyo
        [{ startTime: "00:00", endTime: "08:00" }], // midnight-8am Tokyo
        60,
        60,
        [],
        0,
        0,
        minNotice.setZone("Asia/Tokyo")
      )

      // Slots at 0am, 1am are before min notice (2am Tokyo)
      // Slots at 2am, 3am, 4am, 5am, 6am, 7am = 6 slots should be available
      expect(slots).toHaveLength(6)
      expect(slots[0]?.start.hour).toBe(2)
    })
  })
})
