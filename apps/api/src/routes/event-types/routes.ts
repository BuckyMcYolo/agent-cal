import { createRoute, z } from "@hono/zod-openapi"
import {
  insertEventTypeSchema,
  selectEventTypeSchema,
  updateEventTypeSchema,
} from "@workspace/db/schema/event-types"
import { forbiddenSchema } from "@/lib/helpers/openapi/schemas/error/forbidden-schema"
import { internalServerErrorSchema } from "@/lib/helpers/openapi/schemas/error/internal-server-error-schema"
import { notFoundSchema } from "@/lib/helpers/openapi/schemas/error/not-found-schema"
import { unauthorizedSchema } from "@/lib/helpers/openapi/schemas/error/unauthorized-schema"
import jsonContent from "@/lib/helpers/openapi/schemas/json-content"
import jsonContentRequired from "@/lib/helpers/openapi/schemas/json-content-required"
import UUIDParamsSchema from "@/lib/helpers/openapi/schemas/params/uuid-params"
import orgIdQuery from "@/lib/helpers/openapi/schemas/query/org-id-query"
import slugQuery from "@/lib/helpers/openapi/schemas/query/slug-query"
import userIdQuery from "@/lib/helpers/openapi/schemas/query/user-id-query"
import { apiKeySecuritySchema } from "@/lib/helpers/openapi/schemas/security-schemas"
import * as HttpStatusCodes from "@/lib/misc/http-status-codes"
import { authMiddleware } from "@/middleware/bearer-auth-middleware"

const tags = ["Event Types"]

// not a protected route since public booking pages will need to access this
export const listEventTypes = createRoute({
  path: "/event-types",
  method: "get",
  summary: "Get all Event Types",
  description:
    "Get all Event Types for a user or organization. If no query parameters are provided, all event types for the organization will be returned.",
  tags,
  request: {
    query: z.object({
      orgId: orgIdQuery.optional(),
      userId: userIdQuery.optional(),
      slug: slugQuery.optional().openapi({
        description:
          "Must be the full unique slug of the event type. Example: 'my-event-type'",
      }),
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent({
      schema: z.array(selectEventTypeSchema),
      description: "List of tasks",
    }),
  },
})

//needs to be a protected route since only authenticated users can create event types
export const createEventType = createRoute({
  path: "/event-types",
  method: "post",
  summary: "Create a new Event Type",
  security: apiKeySecuritySchema,
  tags,
  request: {
    body: jsonContentRequired({
      //only accepts title, description and length
      schema: insertEventTypeSchema.omit({
        afterEventBuffer: true,
        beforeEventBuffer: true,
        availabilityScheduleId: true,
        ownerId: true,
        organizationId: true,
        aiEmailAssistantEnabled: true,
        aiPhoneAssistantEnabled: true,
        metadata: true,
        dailyFrequencyLimit: true,
        weeklyFrequencyLimit: true,
        monthlyFrequencyLimit: true,
        disableGuests: true,
        hidden: true,
        timeZone: true,
        limitFutureBookings: true,
        limitBookingFrequency: true,
        lockTimezone: true,
        slug: true,
        listPosition: true,
        locationType: true,
        minimumBookingNotice: true,
        maxDaysInFuture: true,
        schedulingType: true,
        requiresConfirmation: true,
      }),
      description: "The event type to create",
    }),
  },
  middleware: [authMiddleware] as const,
  responses: {
    [HttpStatusCodes.OK]: jsonContent({
      schema: selectEventTypeSchema,
      description: "The created event type",
    }),
    [HttpStatusCodes.UNAUTHORIZED]: unauthorizedSchema,
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: internalServerErrorSchema,
    [HttpStatusCodes.BAD_REQUEST]: jsonContent({
      schema: z.object({
        success: z.boolean(),
        message: z.string(),
      }),
      description: "Bad request, invalid input data",
    }),
  },
})

export const getEventType = createRoute({
  path: "/event-types/{id}",
  method: "get",
  summary: "Get an Event Type by ID",
  security: apiKeySecuritySchema,
  tags,
  request: {
    params: UUIDParamsSchema,
  },
  middleware: [authMiddleware] as const,
  responses: {
    [HttpStatusCodes.OK]: jsonContent({
      schema: selectEventTypeSchema,
      description: "The event type",
    }),
    [HttpStatusCodes.NOT_FOUND]: jsonContent({
      schema: notFoundSchema,
      description: "Event type not found",
    }),
    [HttpStatusCodes.UNAUTHORIZED]: unauthorizedSchema,
    [HttpStatusCodes.FORBIDDEN]: jsonContent({
      schema: forbiddenSchema,
      description:
        "Forbidden - insufficient permissions to access this event type",
    }),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: internalServerErrorSchema,
  },
})

export const updateEventType = createRoute({
  path: "/event-types/{id}",
  method: "put",
  summary: "Update an Event Type",
  description:
    "Update an event type with full schema support including all scheduling, booking limits, AI assistant settings, and other configuration options",
  security: apiKeySecuritySchema,
  tags,
  request: {
    params: UUIDParamsSchema,
    body: jsonContentRequired({
      schema: updateEventTypeSchema
        .omit({
          id: true,
          createdAt: true,
          updatedAt: true,
          ownerId: true,
          organizationId: true,
        })
        .partial(),
      description:
        "The event type fields to update. All fields are optional for partial updates.",
    }),
  },
  middleware: [authMiddleware] as const,
  responses: {
    [HttpStatusCodes.OK]: jsonContent({
      schema: selectEventTypeSchema,
      description: "The updated event type",
    }),
    [HttpStatusCodes.NOT_FOUND]: jsonContent({
      schema: notFoundSchema,
      description: "Event type not found",
    }),
    [HttpStatusCodes.UNAUTHORIZED]: unauthorizedSchema,
    [HttpStatusCodes.FORBIDDEN]: jsonContent({
      schema: forbiddenSchema,
      description:
        "Forbidden - insufficient permissions to update this event type",
    }),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent({
      schema: z.object({
        success: z.boolean(),
        message: z.string(),
        errors: z.array(z.string()).optional(),
      }),
      description: "Bad request, invalid input data or validation errors",
    }),
    [HttpStatusCodes.CONFLICT]: jsonContent({
      schema: z.object({
        success: z.boolean(),
        message: z.string(),
        field: z.string().optional(),
      }),
      description:
        "Conflict - duplicate slug or other unique constraint violation",
    }),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: internalServerErrorSchema,
  },
})

export const deleteEventType = createRoute({
  path: "/event-types/{id}",
  method: "delete",
  summary: "Delete an Event Type",
  security: apiKeySecuritySchema,
  tags,
  request: {
    params: UUIDParamsSchema,
  },
  middleware: [authMiddleware] as const,
  responses: {
    [HttpStatusCodes.NO_CONTENT]: {
      description: "Event type deleted successfully",
    },
    [HttpStatusCodes.NOT_FOUND]: jsonContent({
      schema: notFoundSchema,
      description: "Event type not found",
    }),
    [HttpStatusCodes.UNAUTHORIZED]: unauthorizedSchema,
    [HttpStatusCodes.FORBIDDEN]: jsonContent({
      schema: forbiddenSchema,
      description:
        "Forbidden - insufficient permissions to delete this event type",
    }),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: internalServerErrorSchema,
  },
})

export type ListEventsTypesRoute = typeof listEventTypes
export type CreateEventTypeRoute = typeof createEventType
export type GetEventTypeRoute = typeof getEventType
export type UpdateEventTypeRoute = typeof updateEventType
export type DeleteEventTypeRoute = typeof deleteEventType
