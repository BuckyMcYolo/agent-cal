import { createRoute, z } from "@hono/zod-openapi"
import {
  insertAvailabilityRuleSchema,
  selectAvailabilityRuleSchema,
  updateAvailabilityRuleSchema,
} from "@workspace/db/schema/availability-rule"
import {
  insertAvailabilityScheduleSchema,
  selectAvailabilityScheduleSchema,
  updateAvailabilityScheduleSchema,
} from "@workspace/db/schema/availability-schedule"
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

const BusinessUserParamsSchema = z.object({
  businessId: z
    .string()
    .uuid()
    .openapi({
      param: { name: "businessId", in: "path", required: true },
      example: "550e8400-e29b-41d4-a716-446655440000",
    }),
  userId: z
    .string()
    .uuid()
    .openapi({
      param: { name: "userId", in: "path", required: true },
      example: "550e8400-e29b-41d4-a716-446655440001",
    }),
})

const ScheduleParamsSchema = BusinessUserParamsSchema.extend({
  scheduleId: z
    .string()
    .uuid()
    .openapi({
      param: { name: "scheduleId", in: "path", required: true },
      example: "550e8400-e29b-41d4-a716-446655440002",
    }),
})

const RuleParamsSchema = ScheduleParamsSchema.extend({
  ruleId: z
    .string()
    .uuid()
    .openapi({
      param: { name: "ruleId", in: "path", required: true },
      example: "550e8400-e29b-41d4-a716-446655440003",
    }),
})

const BusinessParamsSchema = z.object({
  businessId: z
    .string()
    .uuid()
    .openapi({
      param: { name: "businessId", in: "path", required: true },
      example: "550e8400-e29b-41d4-a716-446655440000",
    }),
})

// ============================================================================
// Response Schemas
// ============================================================================

const ScheduleWithRulesSchema = selectAvailabilityScheduleSchema.extend({
  rules: z.array(selectAvailabilityRuleSchema),
})

const TimeSlotSchema = z.object({
  start: z.string().datetime().openapi({
    description: "Slot start time in ISO 8601 format",
    example: "2025-01-15T09:00:00Z",
  }),
  end: z.string().datetime().openapi({
    description: "Slot end time in ISO 8601 format",
    example: "2025-01-15T09:30:00Z",
  }),
})

const AvailabilityResponseSchema = z.object({
  slots: z.array(TimeSlotSchema),
  timezone: z.string().openapi({
    description: "Timezone used for the response",
    example: "America/New_York",
  }),
})

// ============================================================================
// Schedule CRUD Routes
// ============================================================================

export const listSchedules = createRoute({
  path: "/v1/businesses/{businessId}/users/{userId}/schedules",
  method: "get",
  summary: "List availability schedules",
  description: "Returns all availability schedules for a business user",
  middleware: [authMiddleware] as const,
  request: {
    params: BusinessUserParamsSchema,
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent({
      schema: z.object({
        data: z.array(selectAvailabilityScheduleSchema),
      }),
      description: "List of availability schedules",
    }),
    [HttpStatusCodes.UNAUTHORIZED]: unauthorizedSchema,
    [HttpStatusCodes.FORBIDDEN]: jsonContent({
      schema: forbiddenSchema,
      description: "User does not have access",
    }),
    [HttpStatusCodes.NOT_FOUND]: jsonContent({
      schema: notFoundSchema,
      description: "Business or user not found",
    }),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: internalServerErrorSchema,
  },
})

export const createSchedule = createRoute({
  path: "/v1/businesses/{businessId}/users/{userId}/schedules",
  method: "post",
  summary: "Create availability schedule",
  description: "Creates a new availability schedule for a business user",
  middleware: [authMiddleware] as const,
  request: {
    params: BusinessUserParamsSchema,
    body: jsonContent({
      schema: insertAvailabilityScheduleSchema.omit({ businessUserId: true }),
      description: "Schedule to create",
    }),
  },
  responses: {
    [HttpStatusCodes.CREATED]: jsonContent({
      schema: selectAvailabilityScheduleSchema,
      description: "Created schedule",
    }),
    [HttpStatusCodes.UNAUTHORIZED]: unauthorizedSchema,
    [HttpStatusCodes.FORBIDDEN]: jsonContent({
      schema: forbiddenSchema,
      description: "User does not have access",
    }),
    [HttpStatusCodes.NOT_FOUND]: jsonContent({
      schema: notFoundSchema,
      description: "Business or user not found",
    }),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: internalServerErrorSchema,
  },
})

export const getSchedule = createRoute({
  path: "/v1/businesses/{businessId}/users/{userId}/schedules/{scheduleId}",
  method: "get",
  summary: "Get availability schedule",
  description: "Returns a specific availability schedule with its rules",
  middleware: [authMiddleware] as const,
  request: {
    params: ScheduleParamsSchema,
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent({
      schema: ScheduleWithRulesSchema,
      description: "Schedule with rules",
    }),
    [HttpStatusCodes.UNAUTHORIZED]: unauthorizedSchema,
    [HttpStatusCodes.FORBIDDEN]: jsonContent({
      schema: forbiddenSchema,
      description: "User does not have access",
    }),
    [HttpStatusCodes.NOT_FOUND]: jsonContent({
      schema: notFoundSchema,
      description: "Schedule not found",
    }),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: internalServerErrorSchema,
  },
})

export const updateSchedule = createRoute({
  path: "/v1/businesses/{businessId}/users/{userId}/schedules/{scheduleId}",
  method: "patch",
  summary: "Update availability schedule",
  description: "Updates an existing availability schedule",
  middleware: [authMiddleware] as const,
  request: {
    params: ScheduleParamsSchema,
    body: jsonContent({
      schema: updateAvailabilityScheduleSchema.omit({ businessUserId: true }),
      description: "Fields to update",
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent({
      schema: selectAvailabilityScheduleSchema,
      description: "Updated schedule",
    }),
    [HttpStatusCodes.UNAUTHORIZED]: unauthorizedSchema,
    [HttpStatusCodes.FORBIDDEN]: jsonContent({
      schema: forbiddenSchema,
      description: "User does not have access",
    }),
    [HttpStatusCodes.NOT_FOUND]: jsonContent({
      schema: notFoundSchema,
      description: "Schedule not found",
    }),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: internalServerErrorSchema,
  },
})

export const deleteSchedule = createRoute({
  path: "/v1/businesses/{businessId}/users/{userId}/schedules/{scheduleId}",
  method: "delete",
  summary: "Delete availability schedule",
  description: "Deletes an availability schedule and all its rules",
  middleware: [authMiddleware] as const,
  request: {
    params: ScheduleParamsSchema,
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent({
      schema: z.object({
        success: z.boolean(),
        message: z.string(),
      }),
      description: "Schedule deleted",
    }),
    [HttpStatusCodes.UNAUTHORIZED]: unauthorizedSchema,
    [HttpStatusCodes.FORBIDDEN]: jsonContent({
      schema: forbiddenSchema,
      description: "User does not have access",
    }),
    [HttpStatusCodes.NOT_FOUND]: jsonContent({
      schema: notFoundSchema,
      description: "Schedule not found",
    }),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: internalServerErrorSchema,
  },
})

// ============================================================================
// Rule CRUD Routes
// ============================================================================

export const createRule = createRoute({
  path: "/v1/businesses/{businessId}/users/{userId}/schedules/{scheduleId}/rules",
  method: "post",
  summary: "Create availability rule",
  description: "Adds a new availability rule to a schedule",
  middleware: [authMiddleware] as const,
  request: {
    params: ScheduleParamsSchema,
    body: jsonContent({
      schema: insertAvailabilityRuleSchema.omit({ scheduleId: true }),
      description: "Rule to create",
    }),
  },
  responses: {
    [HttpStatusCodes.CREATED]: jsonContent({
      schema: selectAvailabilityRuleSchema,
      description: "Created rule",
    }),
    [HttpStatusCodes.UNAUTHORIZED]: unauthorizedSchema,
    [HttpStatusCodes.FORBIDDEN]: jsonContent({
      schema: forbiddenSchema,
      description: "User does not have access",
    }),
    [HttpStatusCodes.NOT_FOUND]: jsonContent({
      schema: notFoundSchema,
      description: "Schedule not found",
    }),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent({
      schema: z.object({
        success: z.boolean(),
        message: z.string(),
      }),
      description: "Invalid rule data",
    }),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: internalServerErrorSchema,
  },
})

export const updateRule = createRoute({
  path: "/v1/businesses/{businessId}/users/{userId}/schedules/{scheduleId}/rules/{ruleId}",
  method: "patch",
  summary: "Update availability rule",
  description: "Updates an existing availability rule",
  middleware: [authMiddleware] as const,
  request: {
    params: RuleParamsSchema,
    body: jsonContent({
      schema: updateAvailabilityRuleSchema.omit({ scheduleId: true }),
      description: "Fields to update",
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent({
      schema: selectAvailabilityRuleSchema,
      description: "Updated rule",
    }),
    [HttpStatusCodes.UNAUTHORIZED]: unauthorizedSchema,
    [HttpStatusCodes.FORBIDDEN]: jsonContent({
      schema: forbiddenSchema,
      description: "User does not have access",
    }),
    [HttpStatusCodes.NOT_FOUND]: jsonContent({
      schema: notFoundSchema,
      description: "Rule not found",
    }),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent({
      schema: z.object({
        success: z.boolean(),
        message: z.string(),
      }),
      description: "Invalid rule data",
    }),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: internalServerErrorSchema,
  },
})

export const deleteRule = createRoute({
  path: "/v1/businesses/{businessId}/users/{userId}/schedules/{scheduleId}/rules/{ruleId}",
  method: "delete",
  summary: "Delete availability rule",
  description: "Deletes an availability rule from a schedule",
  middleware: [authMiddleware] as const,
  request: {
    params: RuleParamsSchema,
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent({
      schema: z.object({
        success: z.boolean(),
        message: z.string(),
      }),
      description: "Rule deleted",
    }),
    [HttpStatusCodes.UNAUTHORIZED]: unauthorizedSchema,
    [HttpStatusCodes.FORBIDDEN]: jsonContent({
      schema: forbiddenSchema,
      description: "User does not have access",
    }),
    [HttpStatusCodes.NOT_FOUND]: jsonContent({
      schema: notFoundSchema,
      description: "Rule not found",
    }),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: internalServerErrorSchema,
  },
})

const BatchRulesRequestSchema = z.object({
  rules: z
    .array(insertAvailabilityRuleSchema.omit({ scheduleId: true }))
    .openapi({
      description: "Array of rules to replace all existing rules",
      example: [
        { dayOfWeek: 1, startTime: "09:00", endTime: "17:00" },
        { dayOfWeek: 2, startTime: "09:00", endTime: "17:00" },
      ],
    }),
})

export const replaceRules = createRoute({
  path: "/v1/businesses/{businessId}/users/{userId}/schedules/{scheduleId}/rules",
  method: "put",
  summary: "Replace all availability rules",
  description:
    "Atomically replaces all rules for a schedule. Deletes existing rules and inserts the provided ones.",
  middleware: [authMiddleware] as const,
  request: {
    params: ScheduleParamsSchema,
    body: jsonContent({
      schema: BatchRulesRequestSchema,
      description: "New rules to replace existing ones",
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent({
      schema: z.object({
        data: z.array(selectAvailabilityRuleSchema),
      }),
      description: "Replaced rules",
    }),
    [HttpStatusCodes.UNAUTHORIZED]: unauthorizedSchema,
    [HttpStatusCodes.FORBIDDEN]: jsonContent({
      schema: forbiddenSchema,
      description: "User does not have access",
    }),
    [HttpStatusCodes.NOT_FOUND]: jsonContent({
      schema: notFoundSchema,
      description: "Schedule not found",
    }),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent({
      schema: z.object({
        success: z.boolean(),
        message: z.string(),
      }),
      description: "Invalid rule data",
    }),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: internalServerErrorSchema,
  },
})

// ============================================================================
// Availability Query Route
// ============================================================================

export const getAvailability = createRoute({
  path: "/v1/businesses/{businessId}/availability",
  method: "get",
  summary: "Get available time slots",
  description:
    "Calculates available time slots for an event type, considering user availability rules and calendar conflicts",
  middleware: [authMiddleware] as const,
  request: {
    params: BusinessParamsSchema,
    query: z.object({
      eventTypeId: z.string().uuid().openapi({
        description: "The event type to check availability for",
        example: "550e8400-e29b-41d4-a716-446655440004",
      }),
      startDate: z.string().openapi({
        description: "Start date for availability query (ISO 8601)",
        example: "2025-01-15",
      }),
      endDate: z.string().openapi({
        description: "End date for availability query (ISO 8601)",
        example: "2025-01-22",
      }),
      timezone: z.string().optional().openapi({
        description: "Timezone for the response (defaults to UTC)",
        example: "America/New_York",
      }),
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent({
      schema: AvailabilityResponseSchema,
      description: "Available time slots",
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
    [HttpStatusCodes.BAD_REQUEST]: jsonContent({
      schema: z.object({
        success: z.boolean(),
        message: z.string(),
      }),
      description: "Invalid query parameters",
    }),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: internalServerErrorSchema,
  },
})

// ============================================================================
// Route Types
// ============================================================================

export type ListSchedulesRoute = typeof listSchedules
export type CreateScheduleRoute = typeof createSchedule
export type GetScheduleRoute = typeof getSchedule
export type UpdateScheduleRoute = typeof updateSchedule
export type DeleteScheduleRoute = typeof deleteSchedule
export type CreateRuleRoute = typeof createRule
export type UpdateRuleRoute = typeof updateRule
export type DeleteRuleRoute = typeof deleteRule
export type ReplaceRulesRoute = typeof replaceRules
export type GetAvailabilityRoute = typeof getAvailability
