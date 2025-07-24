import jsonContent from "@/lib/helpers/openapi/schemas/json-content"
import { createRoute, z } from "@hono/zod-openapi"
import * as HttpStatusCodes from "@/lib/misc/http-status-codes"
import jsonContentRequired from "@/lib/helpers/openapi/schemas/json-content-required"
import UUIDParamsSchema from "@/lib/helpers/openapi/schemas/params/uuid-params"
import { notFoundSchema } from "@/lib/helpers/openapi/schemas/error/not-found-schema"
import { unauthorizedSchema } from "@/lib/helpers/openapi/schemas/error/unauthorized-schema"
import { authMiddleware } from "@/middleware/bearer-auth-middleware"
import { apiKeySecuritySchema } from "@/lib/helpers/openapi/schemas/security-schemas"
import userIdQuery from "@/lib/helpers/openapi/schemas/query/user-id-query"
import orgIdQuery from "@/lib/helpers/openapi/schemas/query/org-id-query"
import slugQuery from "@/lib/helpers/openapi/schemas/query/slug-query"
import { internalServerErrorSchema } from "@/lib/helpers/openapi/schemas/error/internal-server-error-schema"
import { forbiddenSchema } from "@/lib/helpers/openapi/schemas/error/forbidden-schema"
import {
  insertWeeklyScheduleSchema,
  selectAvailabilitySchema,
  selectAvailabilitySchemaWithWeeklySlots,
} from "@workspace/db/schema/availability"
import { timeSlotSchema } from "@/lib/helpers/openapi/schemas/time/timeslot-schema"

const tags = ["Event Types"]

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

export type ListAvailabilityRoute = typeof listAvailability
export type PostAvailabilityRoute = typeof postAvailability
