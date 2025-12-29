import { createRoute, z } from "@hono/zod-openapi"
import {
  insertAvailabilityOverrideSchema,
  selectAvailabilityOverrideSchema,
  updateAvailabilityOverrideSchema,
} from "@workspace/db/schema/availability-override"
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

const ScheduleParamsSchema = z.object({
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
  scheduleId: z
    .string()
    .uuid()
    .openapi({
      param: { name: "scheduleId", in: "path", required: true },
      example: "550e8400-e29b-41d4-a716-446655440002",
    }),
})

const OverrideParamsSchema = ScheduleParamsSchema.extend({
  overrideId: z
    .string()
    .uuid()
    .openapi({
      param: { name: "overrideId", in: "path", required: true },
      example: "550e8400-e29b-41d4-a716-446655440005",
    }),
})

// ============================================================================
// Override CRUD Routes
// ============================================================================

export const listOverrides = createRoute({
  path: "/businesses/{businessId}/users/{userId}/schedules/{scheduleId}/overrides",
  method: "get",
  summary: "List date overrides",
  description: "Returns all date overrides for a schedule",
  middleware: [authMiddleware] as const,
  request: {
    params: ScheduleParamsSchema,
    query: z.object({
      startDate: z.string().optional().openapi({
        description: "Filter overrides on or after this date (YYYY-MM-DD)",
        example: "2025-01-01",
      }),
      endDate: z.string().optional().openapi({
        description: "Filter overrides on or before this date (YYYY-MM-DD)",
        example: "2025-12-31",
      }),
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent({
      schema: z.object({
        data: z.array(selectAvailabilityOverrideSchema),
      }),
      description: "List of date overrides",
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

export const createOverride = createRoute({
  path: "/businesses/{businessId}/users/{userId}/schedules/{scheduleId}/overrides",
  method: "post",
  summary: "Create date override",
  description: "Creates a date override for a schedule",
  middleware: [authMiddleware] as const,
  request: {
    params: ScheduleParamsSchema,
    body: jsonContent({
      schema: insertAvailabilityOverrideSchema.omit({ scheduleId: true }),
      description: "Override to create",
    }),
  },
  responses: {
    [HttpStatusCodes.CREATED]: jsonContent({
      schema: selectAvailabilityOverrideSchema,
      description: "Created override",
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
      description: "Invalid override data or date already has override",
    }),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: internalServerErrorSchema,
  },
})

export const updateOverride = createRoute({
  path: "/businesses/{businessId}/users/{userId}/schedules/{scheduleId}/overrides/{overrideId}",
  method: "patch",
  summary: "Update date override",
  description: "Updates an existing date override",
  middleware: [authMiddleware] as const,
  request: {
    params: OverrideParamsSchema,
    body: jsonContent({
      schema: updateAvailabilityOverrideSchema.omit({ scheduleId: true }),
      description: "Fields to update",
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent({
      schema: selectAvailabilityOverrideSchema,
      description: "Updated override",
    }),
    [HttpStatusCodes.UNAUTHORIZED]: unauthorizedSchema,
    [HttpStatusCodes.FORBIDDEN]: jsonContent({
      schema: forbiddenSchema,
      description: "User does not have access",
    }),
    [HttpStatusCodes.NOT_FOUND]: jsonContent({
      schema: notFoundSchema,
      description: "Override not found",
    }),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent({
      schema: z.object({
        success: z.boolean(),
        message: z.string(),
      }),
      description: "Invalid override data",
    }),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: internalServerErrorSchema,
  },
})

export const deleteOverride = createRoute({
  path: "/businesses/{businessId}/users/{userId}/schedules/{scheduleId}/overrides/{overrideId}",
  method: "delete",
  summary: "Delete date override",
  description: "Deletes a date override",
  middleware: [authMiddleware] as const,
  request: {
    params: OverrideParamsSchema,
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent({
      schema: z.object({
        success: z.boolean(),
        message: z.string(),
      }),
      description: "Override deleted",
    }),
    [HttpStatusCodes.UNAUTHORIZED]: unauthorizedSchema,
    [HttpStatusCodes.FORBIDDEN]: jsonContent({
      schema: forbiddenSchema,
      description: "User does not have access",
    }),
    [HttpStatusCodes.NOT_FOUND]: jsonContent({
      schema: notFoundSchema,
      description: "Override not found",
    }),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: internalServerErrorSchema,
  },
})

// ============================================================================
// Route Types
// ============================================================================

export type ListOverridesRoute = typeof listOverrides
export type CreateOverrideRoute = typeof createOverride
export type UpdateOverrideRoute = typeof updateOverride
export type DeleteOverrideRoute = typeof deleteOverride
