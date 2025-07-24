import { z } from "@hono/zod-openapi"

const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
// Create a reusable time schema
export const timeSlotSchema = z
  .string()
  .regex(timeRegex, {
    message: "Time must be in HH:MM format (24-hour, e.g., '09:30', '14:45')",
  })
  .refine(
    (time) => {
      // Additional validation to ensure the time is actually valid
      const parts = time.split(":")
      if (parts.length !== 2) return false

      const hours = Number(parts[0])
      const minutes = Number(parts[1])

      // Check if conversion resulted in valid numbers
      if (isNaN(hours) || isNaN(minutes)) return false

      return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59
    },
    {
      message: "Invalid time: hours must be 0-23 and minutes must be 0-59",
    }
  )
