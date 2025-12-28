import { type DateTime, Interval } from "luxon"

export interface TimeSlot {
  start: DateTime
  end: DateTime
}

export interface BusyBlock {
  start: DateTime
  end: DateTime
}

/**
 * Parse time string (HH:MM:SS or HH:MM) to { hour, minute }
 */
export function parseTimeString(timeStr: string): {
  hour: number
  minute: number
} {
  const [hours, minutes] = timeStr.split(":").map(Number)
  return { hour: hours ?? 0, minute: minutes ?? 0 }
}

/**
 * Generate available slots for a single day using Luxon
 */
export function generateDaySlots(
  date: DateTime,
  rules: Array<{ startTime: string; endTime: string }>,
  durationMinutes: number,
  slotStepMinutes: number,
  busyBlocks: BusyBlock[],
  bufferBefore: number,
  bufferAfter: number,
  minNoticeTime: DateTime
): TimeSlot[] {
  const slots: TimeSlot[] = []

  for (const rule of rules) {
    const ruleStart = parseTimeString(rule.startTime)
    const ruleEnd = parseTimeString(rule.endTime)

    // Create DateTime for rule boundaries on this day
    let slotStart = date.set({
      hour: ruleStart.hour,
      minute: ruleStart.minute,
      second: 0,
      millisecond: 0,
    })

    const ruleEndTime = date.set({
      hour: ruleEnd.hour,
      minute: ruleEnd.minute,
      second: 0,
      millisecond: 0,
    })

    // Generate slots within this rule's time window
    while (slotStart.plus({ minutes: durationMinutes }) <= ruleEndTime) {
      const slotEnd = slotStart.plus({ minutes: durationMinutes })

      // Check minimum notice
      if (slotStart < minNoticeTime) {
        slotStart = slotStart.plus({ minutes: slotStepMinutes })
        continue
      }

      // Check conflicts with busy blocks (including buffers)
      const slotWithBufferStart = slotStart.minus({ minutes: bufferBefore })
      const slotWithBufferEnd = slotEnd.plus({ minutes: bufferAfter })
      const slotInterval = Interval.fromDateTimes(
        slotWithBufferStart,
        slotWithBufferEnd
      )

      const hasConflict = busyBlocks.some((busy) => {
        const busyInterval = Interval.fromDateTimes(busy.start, busy.end)
        return slotInterval.overlaps(busyInterval)
      })

      if (!hasConflict) {
        slots.push({ start: slotStart, end: slotEnd })
      }

      slotStart = slotStart.plus({ minutes: slotStepMinutes })
    }
  }

  return slots
}
