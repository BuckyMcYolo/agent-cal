import { createRoute, z } from "@hono/zod-openapi"
import {
  selectAvailabilitySchema,
  selectAvailabilitySchemaWithWeeklySlots,
} from "@workspace/db/schema/availability"
import { forbiddenSchema } from "@/lib/helpers/openapi/schemas/error/forbidden-schema"
import { internalServerErrorSchema } from "@/lib/helpers/openapi/schemas/error/internal-server-error-schema"
import { notFoundSchema } from "@/lib/helpers/openapi/schemas/error/not-found-schema"
import { unauthorizedSchema } from "@/lib/helpers/openapi/schemas/error/unauthorized-schema"
import jsonContent from "@/lib/helpers/openapi/schemas/json-content"
import jsonContentRequired from "@/lib/helpers/openapi/schemas/json-content-required"
import UUIDParamsSchema from "@/lib/helpers/openapi/schemas/params/uuid-params"
import { apiKeySecuritySchema } from "@/lib/helpers/openapi/schemas/security-schemas"
import { timeSlotSchema } from "@/lib/helpers/openapi/schemas/time/timeslot-schema"
import * as HttpStatusCodes from "@/lib/misc/http-status-codes"
import { authMiddleware } from "@/middleware/bearer-auth-middleware"

const tags = ["Availability"]

export const listAvailability = createRoute({
  path: "/availability",
  method: "get",
  summary: "Get all Availability Schedules",
  description:
    "Get all Availability Schedules for a user or organization. To get all organization availability schedules, the user's role must be 'admin'. If no query parameters are provided, all availability schedules for the user will be returned.",
  tags,
  request: {
    query: z.object({
      returnOrg: z.boolean().optional(),
    }),
  },
  middleware: [authMiddleware] as const,
  security: apiKeySecuritySchema,
  responses: {
    [HttpStatusCodes.OK]: jsonContent({
      schema: z.array(selectAvailabilitySchemaWithWeeklySlots),
      description: "List of tasks",
    }),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: internalServerErrorSchema,
    [HttpStatusCodes.BAD_REQUEST]: jsonContent({
      schema: z.object({
        success: z.boolean(),
        message: z.string(),
      }),
      description: "Bad request, invalid input data",
    }),
    [HttpStatusCodes.UNAUTHORIZED]: unauthorizedSchema,
  },
})

export const getAvailability = createRoute({
  path: "/availability/{id}",
  method: "get",
  summary: "Get Availability Schedule by ID",
  description:
    "Get a specific availability schedule by its ID. User must own the schedule or be an admin in the organization.",
  tags,
  security: apiKeySecuritySchema,
  middleware: [authMiddleware] as const,
  request: {
    params: UUIDParamsSchema,
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent({
      schema: selectAvailabilitySchemaWithWeeklySlots,
      description: "Availability schedule with weekly slots",
    }),
    [HttpStatusCodes.NOT_FOUND]: jsonContent({
      schema: notFoundSchema,
      description: "Availability schedule not found",
    }),
    [HttpStatusCodes.FORBIDDEN]: jsonContent({
      schema: forbiddenSchema,
      description: "Forbidden - insufficient permissions",
    }),
    [HttpStatusCodes.UNAUTHORIZED]: unauthorizedSchema,
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: internalServerErrorSchema,
  },
})

export const postAvailability = createRoute({
  path: "/availability",
  method: "post",
  summary: "Create an Availability Schedule",
  tags,
  security: apiKeySecuritySchema,
  middleware: [authMiddleware] as const,
  request: {
    body: jsonContentRequired({
      schema: z.object({
        name: z.string().min(1).max(255),
        timeSlots: z.array(
          z.object({
            dayOfWeek: z.enum([
              "sunday",
              "monday",
              "tuesday",
              "wednesday",
              "thursday",
              "friday",
              "saturday",
            ]),
            startTime: timeSlotSchema,
            endTime: timeSlotSchema,
          })
        ),
      }),
      description: "Availability Schedule to create",
    }),
  },
  responses: {
    [HttpStatusCodes.CREATED]: jsonContent({
      schema: selectAvailabilitySchema,
      description: "Availability Schedule created successfully",
    }),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent({
      schema: z.object({
        success: z.boolean(),
        message: z.string(),
      }),
      description: "Bad request, invalid input data",
    }),
    [HttpStatusCodes.UNAUTHORIZED]: unauthorizedSchema,
    [HttpStatusCodes.FORBIDDEN]: jsonContent({
      schema: forbiddenSchema,
      description: "Forbidden, user does not have valid permissions",
    }),
    [HttpStatusCodes.NOT_FOUND]: jsonContent({
      schema: notFoundSchema,
      description: "Not found, organization or user does not exist",
    }),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: internalServerErrorSchema,
  },
})

export const updateAvailability = createRoute({
  path: "/availability/{id}",
  method: "put",
  summary: "Update Availability Schedule",
  description:
    "Update a specific availability schedule by its ID. User must own the schedule or be an admin in the organization.",
  tags,
  security: apiKeySecuritySchema,
  middleware: [authMiddleware] as const,
  request: {
    params: UUIDParamsSchema,
    body: jsonContentRequired({
      schema: z.object({
        name: z.string().min(1).max(255).optional(),
        isDefault: z.boolean().optional(),
        timeZone: z.string().optional(),
        timeSlots: z
          .array(
            z.object({
              dayOfWeek: z.enum([
                "sunday",
                "monday",
                "tuesday",
                "wednesday",
                "thursday",
                "friday",
                "saturday",
              ]),
              startTime: timeSlotSchema,
              endTime: timeSlotSchema,
            })
          )
          .optional(),
      }),
      description: "Availability Schedule update data",
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent({
      schema: selectAvailabilitySchemaWithWeeklySlots,
      description: "Updated availability schedule",
    }),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent({
      schema: z.object({
        success: z.boolean(),
        message: z.string(),
      }),
      description: "Bad request, invalid input data",
    }),
    [HttpStatusCodes.NOT_FOUND]: jsonContent({
      schema: notFoundSchema,
      description: "Availability schedule not found",
    }),
    [HttpStatusCodes.FORBIDDEN]: jsonContent({
      schema: forbiddenSchema,
      description: "Forbidden - insufficient permissions",
    }),
    [HttpStatusCodes.UNAUTHORIZED]: unauthorizedSchema,
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: internalServerErrorSchema,
  },
})

export const deleteAvailability = createRoute({
  path: "/availability/{id}",
  method: "delete",
  summary: "Delete Availability Schedule",
  description:
    "Delete a specific availability schedule by its ID. User must own the schedule or be an admin in the organization.",
  tags,
  security: apiKeySecuritySchema,
  middleware: [authMiddleware] as const,
  request: {
    params: UUIDParamsSchema,
  },
  responses: {
    [HttpStatusCodes.NO_CONTENT]: {
      description: "Availability schedule deleted successfully",
    },
    [HttpStatusCodes.NOT_FOUND]: jsonContent({
      schema: notFoundSchema,
      description: "Availability schedule not found",
    }),
    [HttpStatusCodes.FORBIDDEN]: jsonContent({
      schema: forbiddenSchema,
      description: "Forbidden - insufficient permissions",
    }),
    [HttpStatusCodes.UNAUTHORIZED]: unauthorizedSchema,
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: internalServerErrorSchema,
  },
})

export type ListAvailabilityRoute = typeof listAvailability
export type GetAvailabilityRoute = typeof getAvailability
export type PostAvailabilityRoute = typeof postAvailability
export type UpdateAvailabilityRoute = typeof updateAvailability
export type DeleteAvailabilityRoute = typeof deleteAvailability
