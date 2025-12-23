import { z } from "zod"

// Enhanced validation schemas with detailed error messages
export const eventTypeOverviewSchema = z.object({
  title: z
    .string()
    .min(1, "Event title is required")
    .max(255, "Event title must be less than 255 characters")
    .refine(
      (val) => val.trim().length > 0,
      "Event title cannot be empty or only whitespace"
    ),
  slug: z
    .string()
    .min(1, "URL slug is required")
    .max(255, "URL slug must be less than 255 characters")
    .regex(
      /^[a-z0-9-]+$/,
      "URL slug can only contain lowercase letters, numbers, and hyphens"
    )
    .refine(
      (val) => !val.startsWith("-") && !val.endsWith("-"),
      "URL slug cannot start or end with a hyphen"
    )
    .refine(
      (val) => !val.includes("--"),
      "URL slug cannot contain consecutive hyphens"
    ),
  description: z
    .string()
    .max(1000, "Description must be less than 1000 characters")
    .optional()
    .or(z.literal("")),
  length: z
    .number({
      required_error: "Duration is required",
      invalid_type_error: "Duration must be a number",
    })
    .min(15, "Duration must be at least 15 minutes")
    .max(480, "Duration must be less than 8 hours (480 minutes)")
    .refine(
      (val) => val % 15 === 0,
      "Duration must be in 15-minute increments"
    ),
  hidden: z.boolean(),
  locationType: z.enum(["IN_PERSON", "VIRTUAL", "PHONE"], {
    required_error: "Location type is required",
    invalid_type_error: "Invalid location type selected",
  }),
})

export const eventTypeAvailabilitySchema = z.object({
  availabilityScheduleId: z
    .string()
    .uuid("Invalid availability schedule ID")
    .optional()
    .nullable(),
  timeZone: z
    .string()
    .min(1, "Timezone is required when specified")
    .optional()
    .nullable(),
  lockTimezone: z.boolean(),
  schedulingType: z.enum(["ROUND_ROBIN", "COLLECTIVE", "INDIVIDUAL"], {
    required_error: "Scheduling type is required",
    invalid_type_error: "Invalid scheduling type selected",
  }),
  minimumBookingNotice: z
    .number({
      required_error: "Minimum booking notice is required",
      invalid_type_error: "Minimum booking notice must be a number",
    })
    .min(0, "Minimum booking notice cannot be negative")
    .max(
      525600,
      "Minimum booking notice cannot exceed 1 year (525,600 minutes)"
    ),
})

export const eventTypeAdvancedSchema = z
  .object({
    // Booking Limits
    limitBookingFrequency: z.boolean(),
    dailyFrequencyLimit: z
      .number({
        invalid_type_error: "Daily limit must be a number",
      })
      .min(1, "Daily limit must be at least 1")
      .max(100, "Daily limit cannot exceed 100")
      .optional()
      .nullable(),
    weeklyFrequencyLimit: z
      .number({
        invalid_type_error: "Weekly limit must be a number",
      })
      .min(1, "Weekly limit must be at least 1")
      .max(700, "Weekly limit cannot exceed 700")
      .optional()
      .nullable(),
    monthlyFrequencyLimit: z
      .number({
        invalid_type_error: "Monthly limit must be a number",
      })
      .min(1, "Monthly limit must be at least 1")
      .max(3000, "Monthly limit cannot exceed 3000")
      .optional()
      .nullable(),

    // Future Booking Limits
    limitFutureBookings: z.boolean(),
    maxDaysInFuture: z
      .number({
        invalid_type_error: "Future booking limit must be a number",
      })
      .min(1, "Future booking limit must be at least 1 day")
      .max(365, "Future booking limit cannot exceed 365 days")
      .optional()
      .nullable(),

    // Buffer Times
    beforeEventBuffer: z
      .number({
        required_error: "Before event buffer is required",
        invalid_type_error: "Before event buffer must be a number",
      })
      .min(0, "Before event buffer cannot be negative")
      .max(480, "Before event buffer cannot exceed 8 hours (480 minutes)"),
    afterEventBuffer: z
      .number({
        required_error: "After event buffer is required",
        invalid_type_error: "After event buffer must be a number",
      })
      .min(0, "After event buffer cannot be negative")
      .max(480, "After event buffer cannot exceed 8 hours (480 minutes)"),

    // Booking Controls
    requiresConfirmation: z.boolean(),
    disableGuests: z.boolean(),

    // AI Assistants
    aiEmailAssistantEnabled: z.boolean(),
    aiPhoneAssistantEnabled: z.boolean(),
  })
  .refine(
    (data) => {
      // If booking frequency limits are enabled, at least one limit must be set
      if (data.limitBookingFrequency) {
        return (
          (data.dailyFrequencyLimit !== null &&
            data.dailyFrequencyLimit !== undefined &&
            data.dailyFrequencyLimit > 0) ||
          (data.weeklyFrequencyLimit !== null &&
            data.weeklyFrequencyLimit !== undefined &&
            data.weeklyFrequencyLimit > 0) ||
          (data.monthlyFrequencyLimit !== null &&
            data.monthlyFrequencyLimit !== undefined &&
            data.monthlyFrequencyLimit > 0)
        )
      }
      return true
    },
    {
      message:
        "At least one frequency limit must be set when frequency limiting is enabled",
      path: ["limitBookingFrequency"],
    }
  )
  .refine(
    (data) => {
      // If future booking limits are enabled, maxDaysInFuture must be set
      if (data.limitFutureBookings) {
        return (
          data.maxDaysInFuture !== null && data.maxDaysInFuture !== undefined
        )
      }
      return true
    },
    {
      message:
        "Maximum days in future must be set when future booking limits are enabled",
      path: ["maxDaysInFuture"],
    }
  )

// Type exports
export type EventTypeOverviewFormData = z.infer<typeof eventTypeOverviewSchema>
export type EventTypeAvailabilityFormData = z.infer<
  typeof eventTypeAvailabilitySchema
>
export type EventTypeAdvancedFormData = z.infer<typeof eventTypeAdvancedSchema>

// Error message helpers
export const getFieldErrorMessage = (error: unknown): string => {
  if (typeof error === "string") return error
  if (error !== null && typeof error === "object" && "message" in error) {
    return String(error.message)
  }
  return "Invalid value"
}

// API error parsing
export const parseApiError = (error: unknown): string => {
  if (typeof error === "string") return error

  if (error === null || typeof error !== "object") {
    return "An unexpected error occurred. Please try again."
  }

  // Handle API response errors
  if ("response" in error) {
    const responseError = error as {
      response?: { data?: { message?: string } }
    }
    if (responseError.response?.data?.message) {
      return responseError.response.data.message
    }
  }

  // Handle fetch errors
  if ("message" in error && typeof error.message === "string") {
    const message = error.message
    // Check for specific constraint violations
    if (
      message.includes("unique constraint") ||
      message.includes("already exists") ||
      message.includes("URL slug")
    ) {
      return "This URL slug is already in use. Please choose a different one."
    }

    if (message.includes("similar title")) {
      return "An event type with a similar title already exists. Please choose a different title or customize the URL slug."
    }

    if (message.includes("validation")) {
      return "Please check your input and try again."
    }

    if (message.includes("15-minute")) {
      return "Duration must be in 15-minute increments (15, 30, 45, etc.)"
    }

    if (message.includes("frequency limit")) {
      return "At least one frequency limit must be set when frequency limiting is enabled."
    }

    if (message.includes("future booking")) {
      return "Maximum days in future must be set when future booking limits are enabled."
    }

    if (message.includes("buffer")) {
      return "Buffer times must be non-negative values."
    }

    if (message.includes("booking notice")) {
      return "Minimum booking notice must be a non-negative value."
    }

    if (message.includes("not authenticated")) {
      return "You must be logged in to perform this action."
    }

    if (message.includes("permission") || message.includes("forbidden")) {
      return "You don't have permission to perform this action."
    }

    if (message.includes("not found")) {
      return "The requested event type was not found."
    }

    return message
  }

  return "An unexpected error occurred. Please try again."
}

// Validation helpers
export const validateSlugFormat = (slug: string): boolean => {
  return (
    /^[a-z0-9-]+$/.test(slug) &&
    !slug.startsWith("-") &&
    !slug.endsWith("-") &&
    !slug.includes("--")
  )
}

export const validateDurationIncrement = (duration: number): boolean => {
  return duration % 15 === 0
}

// Form state helpers
export const hasUnsavedChanges = (
  isDirty: boolean,
  isSubmitting: boolean
): boolean => {
  return isDirty && !isSubmitting
}
