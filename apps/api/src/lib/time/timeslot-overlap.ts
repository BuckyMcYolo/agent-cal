import { timeToMinutes } from "./conversions"

// Helper function to check if two time slots overlap
export const doTimeSlotsOverlap = (
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean => {
  const start1Minutes = timeToMinutes(start1)
  const end1Minutes = timeToMinutes(end1)
  const start2Minutes = timeToMinutes(start2)
  const end2Minutes = timeToMinutes(end2)

  // Check if slots overlap: start1 < end2 && start2 < end1
  return start1Minutes < end2Minutes && start2Minutes < end1Minutes
}

// Helper function to validate time slots for overlaps
export const validateTimeSlots = (
  timeSlots: Array<{
    dayOfWeek: string
    startTime: string
    endTime: string
  }>
): { isValid: boolean; error?: string } => {
  // Group slots by day
  const slotsByDay: Record<
    string,
    Array<{ startTime: string; endTime: string }>
  > = {}

  for (const slot of timeSlots) {
    // Validate that start time is before end time
    if (timeToMinutes(slot.startTime) >= timeToMinutes(slot.endTime)) {
      return {
        isValid: false,
        error: `Invalid time range for ${slot.dayOfWeek}: start time must be before end time`,
      }
    }

    if (!slotsByDay[slot.dayOfWeek]) {
      slotsByDay[slot.dayOfWeek] = []
    }
    slotsByDay[slot.dayOfWeek]?.push({
      startTime: slot.startTime,
      endTime: slot.endTime,
    })
  }

  // Check for overlaps within each day
  for (const [day, slots] of Object.entries(slotsByDay)) {
    for (let i = 0; i < slots.length; i++) {
      for (let j = i + 1; j < slots.length; j++) {
        const slot1 = slots[i]
        const slot2 = slots[j]

        if (!slot1 || !slot2) continue

        if (
          doTimeSlotsOverlap(
            slot1.startTime,
            slot1.endTime,
            slot2.startTime,
            slot2.endTime
          )
        ) {
          return {
            isValid: false,
            error: `Overlapping time slots found for ${day}: ${slot1.startTime}-${slot1.endTime} and ${slot2.startTime}-${slot2.endTime}`,
          }
        }
      }
    }
  }

  return { isValid: true }
}
