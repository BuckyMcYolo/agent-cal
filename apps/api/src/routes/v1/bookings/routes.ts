import { createRoute, z } from "@hono/zod-openapi"
import { selectBookingSchema } from "@workspace/db/schema/booking"
import { forbiddenSchema } from "@/lib/helpers/openapi/schemas/error/forbidden-schema"
import { internalServerErrorSchema } from "@/lib/helpers/openapi/schemas/error/internal-server-error-schema"
import { notFoundSchema } from "@/lib/helpers/openapi/schemas/error/not-found-schema"
import { unauthorizedSchema } from "@/lib/helpers/openapi/schemas/error/unauthorized-schema"
import jsonContent from "@/lib/helpers/openapi/schemas/json-content"
import * as HttpStatusCodes from "@/lib/misc/http-status-codes"
import { authMiddleware } from "@/middleware/auth-middleware"

// ============================================================================
// Path Parameters
// ============================================================================

const BusinessParamsSchema = z.object({
  businessId: z
    .string()
    .uuid()
    .openapi({
      param: { name: "businessId", in: "path", required: true },
      example: "550e8400-e29b-41d4-a716-446655440000",
    }),
})

const BookingParamsSchema = BusinessParamsSchema.extend({
  bookingId: z
    .string()
    .uuid()
    .openapi({
      param: { name: "bookingId", in: "path", required: true },
      example: "550e8400-e29b-41d4-a716-446655440001",
    }),
})

// ============================================================================
// Request Schemas
// ============================================================================

const CreateBookingRequestSchema = z.object({
  eventTypeId: z.string().uuid().openapi({
    description: "The event type to book",
    example: "550e8400-e29b-41d4-a716-446655440002",
  }),
  startTime: z.string().datetime().openapi({
    description: "Booking start time in ISO 8601 format",
    example: "2025-01-15T14:00:00Z",
  }),
  timezone: z.string().openapi({
    description: "Timezone for the booking",
    example: "America/New_York",
  }),
  attendeeEmail: z.string().email().openapi({
    description: "Email of the attendee",
    example: "customer@example.com",
  }),
  attendeeName: z.string().openapi({
    description: "Name of the attendee",
    example: "John Customer",
  }),
  attendeeTimezone: z.string().optional().openapi({
    description: "Timezone of the attendee",
    example: "America/Los_Angeles",
  }),
  businessUserId: z.string().uuid().optional().openapi({
    description:
      "Specific user to book with (optional, uses assignment strategy if not provided)",
    example: "550e8400-e29b-41d4-a716-446655440003",
  }),
  title: z.string().optional().openapi({
    description: "Custom title for the booking (defaults to event type title)",
    example: "Strategy Consultation",
  }),
  description: z.string().optional().openapi({
    description: "Additional notes for the booking",
    example: "Discuss Q1 planning",
  }),
  location: z.string().optional().openapi({
    description: "Physical address or custom location",
    example: "123 Main St, Suite 100",
  }),
  metadata: z.record(z.unknown()).optional().openapi({
    description: "Custom metadata for the booking",
  }),
})

const RescheduleBookingRequestSchema = z.object({
  startTime: z.string().datetime().openapi({
    description: "New start time in ISO 8601 format",
    example: "2025-01-16T10:00:00Z",
  }),
  timezone: z.string().optional().openapi({
    description: "Timezone for the new time",
    example: "America/New_York",
  }),
  reason: z.string().optional().openapi({
    description: "Reason for rescheduling",
    example: "Customer requested different time",
  }),
})

const CancelBookingRequestSchema = z.object({
  reason: z.string().optional().openapi({
    description: "Reason for cancellation",
    example: "Customer no longer available",
  }),
})

// ============================================================================
// Query Schemas
// ============================================================================

const ListBookingsQuerySchema = z.object({
  status: z
    .enum(["pending", "confirmed", "cancelled", "completed", "no_show"])
    .optional()
    .openapi({
      description: "Filter by booking status",
      example: "confirmed",
    }),
  startDate: z.string().optional().openapi({
    description: "Filter bookings starting on or after this date (ISO 8601)",
    example: "2025-01-01",
  }),
  endDate: z.string().optional().openapi({
    description: "Filter bookings starting on or before this date (ISO 8601)",
    example: "2025-01-31",
  }),
  eventTypeId: z.string().uuid().optional().openapi({
    description: "Filter by event type",
    example: "550e8400-e29b-41d4-a716-446655440002",
  }),
  businessUserId: z.string().uuid().optional().openapi({
    description: "Filter by assigned user",
    example: "550e8400-e29b-41d4-a716-446655440003",
  }),
  limit: z.coerce.number().min(1).max(100).default(50).optional().openapi({
    description: "Maximum number of results",
    example: 50,
  }),
  offset: z.coerce.number().min(0).default(0).optional().openapi({
    description: "Number of results to skip",
    example: 0,
  }),
})

// ============================================================================
// Response Schemas
// ============================================================================

const BookingResponseSchema = selectBookingSchema

const BookingListResponseSchema = z.object({
  data: z.array(selectBookingSchema),
  meta: z.object({
    total: z.number(),
    limit: z.number(),
    offset: z.number(),
  }),
})

const ConflictErrorSchema = z.object({
  success: z.literal(false),
  message: z.string(),
  code: z.literal("SLOT_UNAVAILABLE").optional(),
})

// ============================================================================
// Route Definitions
// ============================================================================

export const createBooking = createRoute({
  path: "/businesses/{businessId}/bookings",
  method: "post",
  summary: "Create a booking",
  description:
    "Creates a new booking for an event type. If no businessUserId is provided, the system will automatically assign a user based on the event type's assignment strategy.",
  tags: ["Bookings"],
  middleware: [authMiddleware] as const,
  request: {
    params: BusinessParamsSchema,
    body: jsonContent({
      schema: CreateBookingRequestSchema,
      description: "Booking details",
    }),
  },
  responses: {
    [HttpStatusCodes.CREATED]: jsonContent({
      schema: BookingResponseSchema,
      description: "Booking created successfully",
    }),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent({
      schema: z.object({
        success: z.boolean(),
        message: z.string(),
      }),
      description: "Invalid request data",
    }),
    [HttpStatusCodes.UNAUTHORIZED]: unauthorizedSchema,
    [HttpStatusCodes.FORBIDDEN]: jsonContent({
      schema: forbiddenSchema,
      description: "User does not have access",
    }),
    [HttpStatusCodes.NOT_FOUND]: jsonContent({
      schema: notFoundSchema,
      description: "Business or event type not found",
    }),
    [HttpStatusCodes.CONFLICT]: jsonContent({
      schema: ConflictErrorSchema,
      description: "Requested time slot is not available",
    }),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: internalServerErrorSchema,
  },
})

export const listBookings = createRoute({
  path: "/businesses/{businessId}/bookings",
  method: "get",
  summary: "List bookings",
  description: "Returns all bookings for a business with optional filtering",
  tags: ["Bookings"],
  middleware: [authMiddleware] as const,
  request: {
    params: BusinessParamsSchema,
    query: ListBookingsQuerySchema,
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent({
      schema: BookingListResponseSchema,
      description: "List of bookings",
    }),
    [HttpStatusCodes.UNAUTHORIZED]: unauthorizedSchema,
    [HttpStatusCodes.FORBIDDEN]: jsonContent({
      schema: forbiddenSchema,
      description: "User does not have access",
    }),
    [HttpStatusCodes.NOT_FOUND]: jsonContent({
      schema: notFoundSchema,
      description: "Business not found",
    }),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: internalServerErrorSchema,
  },
})

export const getBooking = createRoute({
  path: "/businesses/{businessId}/bookings/{bookingId}",
  method: "get",
  summary: "Get a booking",
  description: "Returns details for a specific booking",
  tags: ["Bookings"],
  middleware: [authMiddleware] as const,
  request: {
    params: BookingParamsSchema,
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent({
      schema: BookingResponseSchema,
      description: "Booking details",
    }),
    [HttpStatusCodes.UNAUTHORIZED]: unauthorizedSchema,
    [HttpStatusCodes.FORBIDDEN]: jsonContent({
      schema: forbiddenSchema,
      description: "User does not have access",
    }),
    [HttpStatusCodes.NOT_FOUND]: jsonContent({
      schema: notFoundSchema,
      description: "Booking not found",
    }),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: internalServerErrorSchema,
  },
})

export const rescheduleBooking = createRoute({
  path: "/businesses/{businessId}/bookings/{bookingId}",
  method: "patch",
  summary: "Reschedule a booking",
  description: "Updates the time of an existing booking",
  tags: ["Bookings"],
  middleware: [authMiddleware] as const,
  request: {
    params: BookingParamsSchema,
    body: jsonContent({
      schema: RescheduleBookingRequestSchema,
      description: "New booking time",
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent({
      schema: BookingResponseSchema,
      description: "Booking rescheduled successfully",
    }),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent({
      schema: z.object({
        success: z.boolean(),
        message: z.string(),
      }),
      description: "Invalid request or booking cannot be rescheduled",
    }),
    [HttpStatusCodes.UNAUTHORIZED]: unauthorizedSchema,
    [HttpStatusCodes.FORBIDDEN]: jsonContent({
      schema: forbiddenSchema,
      description: "User does not have access",
    }),
    [HttpStatusCodes.NOT_FOUND]: jsonContent({
      schema: notFoundSchema,
      description: "Booking not found",
    }),
    [HttpStatusCodes.CONFLICT]: jsonContent({
      schema: ConflictErrorSchema,
      description: "New time slot is not available",
    }),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: internalServerErrorSchema,
  },
})

export const cancelBooking = createRoute({
  path: "/businesses/{businessId}/bookings/{bookingId}",
  method: "delete",
  summary: "Cancel a booking",
  description: "Cancels an existing booking",
  tags: ["Bookings"],
  middleware: [authMiddleware] as const,
  request: {
    params: BookingParamsSchema,
    body: jsonContent({
      schema: CancelBookingRequestSchema,
      description: "Cancellation details",
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent({
      schema: z.object({
        success: z.literal(true),
        message: z.string(),
      }),
      description: "Booking cancelled successfully",
    }),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent({
      schema: z.object({
        success: z.boolean(),
        message: z.string(),
      }),
      description: "Booking cannot be cancelled",
    }),
    [HttpStatusCodes.UNAUTHORIZED]: unauthorizedSchema,
    [HttpStatusCodes.FORBIDDEN]: jsonContent({
      schema: forbiddenSchema,
      description: "User does not have access",
    }),
    [HttpStatusCodes.NOT_FOUND]: jsonContent({
      schema: notFoundSchema,
      description: "Booking not found",
    }),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: internalServerErrorSchema,
  },
})

// ============================================================================
// Route Types
// ============================================================================

export type CreateBookingRoute = typeof createBooking
export type ListBookingsRoute = typeof listBookings
export type GetBookingRoute = typeof getBooking
export type RescheduleBookingRoute = typeof rescheduleBooking
export type CancelBookingRoute = typeof cancelBooking
