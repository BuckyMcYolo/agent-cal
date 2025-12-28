import { createRoute, z } from "@hono/zod-openapi"
import { selectCalendarConnectionSchema } from "@workspace/db/schema/calendar-connection"
import { forbiddenSchema } from "@/lib/helpers/openapi/schemas/error/forbidden-schema"
import { internalServerErrorSchema } from "@/lib/helpers/openapi/schemas/error/internal-server-error-schema"
import { notFoundSchema } from "@/lib/helpers/openapi/schemas/error/not-found-schema"
import { unauthorizedSchema } from "@/lib/helpers/openapi/schemas/error/unauthorized-schema"
import jsonContent from "@/lib/helpers/openapi/schemas/json-content"
import * as HttpStatusCodes from "@/lib/misc/http-status-codes"
import { authMiddleware } from "@/middleware/auth-middleware"

// Path params for business/user routes
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

const ConnectionIdParamsSchema = BusinessUserParamsSchema.extend({
  connectionId: z
    .string()
    .uuid()
    .openapi({
      param: { name: "connectionId", in: "path", required: true },
      example: "550e8400-e29b-41d4-a716-446655440002",
    }),
})

// Response schemas
const CalendarConnectionResponseSchema = selectCalendarConnectionSchema.omit({
  accessToken: true,
  refreshToken: true,
})

const CalendarListItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  isPrimary: z.boolean().optional(),
  accessRole: z.string().optional(),
  backgroundColor: z.string().optional(),
})

// ============================================================================
// OAuth Routes
// ============================================================================

export const getGoogleOAuthUrl = createRoute({
  path: "/v1/businesses/{businessId}/users/{userId}/oauth/google",
  method: "get",
  summary: "Get Google OAuth authorization URL",
  description:
    "Returns a URL to redirect the user to for Google Calendar authorization",
  middleware: [authMiddleware] as const,
  request: {
    params: BusinessUserParamsSchema,
    query: z.object({
      redirectUri: z.string().url().optional().openapi({
        description: "URL to redirect to after OAuth completion",
        example: "https://myapp.com/settings/calendar",
      }),
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent({
      schema: z.object({
        url: z.string().url(),
      }),
      description: "Google OAuth authorization URL",
    }),
    [HttpStatusCodes.UNAUTHORIZED]: unauthorizedSchema,
    [HttpStatusCodes.FORBIDDEN]: jsonContent({
      schema: forbiddenSchema,
      description: "User does not have access to this business user",
    }),
    [HttpStatusCodes.NOT_FOUND]: jsonContent({
      schema: notFoundSchema,
      description: "Business or user not found",
    }),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: internalServerErrorSchema,
  },
})

export const handleGoogleOAuthCallback = createRoute({
  path: "/v1/oauth/google/callback",
  method: "get",
  summary: "Handle Google OAuth callback",
  description:
    "Handles the OAuth callback from Google, exchanges the code for tokens, and stores the calendar connection",
  request: {
    query: z.object({
      code: z.string().openapi({
        description: "Authorization code from Google",
      }),
      state: z.string().openapi({
        description: "State token for CSRF protection",
      }),
      error: z.string().optional().openapi({
        description: "Error code if authorization failed",
      }),
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent({
      schema: z.object({
        success: z.boolean(),
        message: z.string(),
        connection: CalendarConnectionResponseSchema.optional(),
      }),
      description: "OAuth completed successfully",
    }),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent({
      schema: z.object({
        success: z.boolean(),
        message: z.string(),
      }),
      description: "Invalid or expired state token, or OAuth error",
    }),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: internalServerErrorSchema,
  },
})

// ============================================================================
// Calendar Connection Routes
// ============================================================================

export const listConnections = createRoute({
  path: "/v1/businesses/{businessId}/users/{userId}/connections",
  method: "get",
  summary: "List calendar connections",
  description: "Returns all calendar connections for a business user",
  middleware: [authMiddleware] as const,
  request: {
    params: BusinessUserParamsSchema,
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent({
      schema: z.object({
        data: z.array(CalendarConnectionResponseSchema),
      }),
      description: "List of calendar connections",
    }),
    [HttpStatusCodes.UNAUTHORIZED]: unauthorizedSchema,
    [HttpStatusCodes.FORBIDDEN]: jsonContent({
      schema: forbiddenSchema,
      description: "User does not have access to this business user",
    }),
    [HttpStatusCodes.NOT_FOUND]: jsonContent({
      schema: notFoundSchema,
      description: "Business or user not found",
    }),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: internalServerErrorSchema,
  },
})

export const getConnection = createRoute({
  path: "/v1/businesses/{businessId}/users/{userId}/connections/{connectionId}",
  method: "get",
  summary: "Get a calendar connection",
  description: "Returns details of a specific calendar connection",
  middleware: [authMiddleware] as const,
  request: {
    params: ConnectionIdParamsSchema,
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent({
      schema: CalendarConnectionResponseSchema,
      description: "Calendar connection details",
    }),
    [HttpStatusCodes.UNAUTHORIZED]: unauthorizedSchema,
    [HttpStatusCodes.FORBIDDEN]: jsonContent({
      schema: forbiddenSchema,
      description: "User does not have access to this connection",
    }),
    [HttpStatusCodes.NOT_FOUND]: jsonContent({
      schema: notFoundSchema,
      description: "Connection not found",
    }),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: internalServerErrorSchema,
  },
})

export const deleteConnection = createRoute({
  path: "/v1/businesses/{businessId}/users/{userId}/connections/{connectionId}",
  method: "delete",
  summary: "Delete a calendar connection",
  description: "Disconnects a calendar from a business user",
  middleware: [authMiddleware] as const,
  request: {
    params: ConnectionIdParamsSchema,
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent({
      schema: z.object({
        success: z.boolean(),
        message: z.string(),
      }),
      description: "Connection deleted successfully",
    }),
    [HttpStatusCodes.UNAUTHORIZED]: unauthorizedSchema,
    [HttpStatusCodes.FORBIDDEN]: jsonContent({
      schema: forbiddenSchema,
      description: "User does not have access to this connection",
    }),
    [HttpStatusCodes.NOT_FOUND]: jsonContent({
      schema: notFoundSchema,
      description: "Connection not found",
    }),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: internalServerErrorSchema,
  },
})

export const listCalendars = createRoute({
  path: "/v1/businesses/{businessId}/users/{userId}/connections/{connectionId}/calendars",
  method: "get",
  summary: "List available calendars",
  description: "Returns all calendars available through a calendar connection",
  middleware: [authMiddleware] as const,
  request: {
    params: ConnectionIdParamsSchema,
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent({
      schema: z.object({
        data: z.array(CalendarListItemSchema),
      }),
      description: "List of available calendars",
    }),
    [HttpStatusCodes.UNAUTHORIZED]: unauthorizedSchema,
    [HttpStatusCodes.FORBIDDEN]: jsonContent({
      schema: forbiddenSchema,
      description: "User does not have access to this connection",
    }),
    [HttpStatusCodes.NOT_FOUND]: jsonContent({
      schema: notFoundSchema,
      description: "Connection not found",
    }),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: internalServerErrorSchema,
  },
})

export const updateConnectionCalendar = createRoute({
  path: "/v1/businesses/{businessId}/users/{userId}/connections/{connectionId}",
  method: "patch",
  summary: "Update calendar connection",
  description: "Update the selected calendar for a connection",
  middleware: [authMiddleware] as const,
  request: {
    params: ConnectionIdParamsSchema,
    body: jsonContent({
      schema: z.object({
        calendarId: z.string().openapi({
          description: "The calendar ID to use for this connection",
          example: "primary",
        }),
      }),
      description: "Calendar selection",
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent({
      schema: CalendarConnectionResponseSchema,
      description: "Updated calendar connection",
    }),
    [HttpStatusCodes.UNAUTHORIZED]: unauthorizedSchema,
    [HttpStatusCodes.FORBIDDEN]: jsonContent({
      schema: forbiddenSchema,
      description: "User does not have access to this connection",
    }),
    [HttpStatusCodes.NOT_FOUND]: jsonContent({
      schema: notFoundSchema,
      description: "Connection not found",
    }),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: internalServerErrorSchema,
  },
})

// ============================================================================
// Microsoft OAuth Routes (disabled until MICROSOFT_CLIENT_ID is configured)
// ============================================================================

export const getMicrosoftOAuthUrl = createRoute({
  path: "/v1/businesses/{businessId}/users/{userId}/oauth/microsoft",
  method: "get",
  summary: "Get Microsoft OAuth authorization URL",
  description:
    "Returns a URL to redirect the user to for Microsoft Calendar authorization. Requires MICROSOFT_CLIENT_ID and MICROSOFT_CLIENT_SECRET to be configured.",
  middleware: [authMiddleware] as const,
  request: {
    params: BusinessUserParamsSchema,
    query: z.object({
      redirectUri: z.string().url().optional().openapi({
        description: "URL to redirect to after OAuth completion",
        example: "https://myapp.com/settings/calendar",
      }),
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent({
      schema: z.object({
        url: z.string().url(),
      }),
      description: "Microsoft OAuth authorization URL",
    }),
    [HttpStatusCodes.UNAUTHORIZED]: unauthorizedSchema,
    [HttpStatusCodes.FORBIDDEN]: jsonContent({
      schema: forbiddenSchema,
      description: "User does not have access to this business user",
    }),
    [HttpStatusCodes.NOT_FOUND]: jsonContent({
      schema: notFoundSchema,
      description: "Business or user not found",
    }),
    [HttpStatusCodes.SERVICE_UNAVAILABLE]: jsonContent({
      schema: z.object({
        success: z.boolean(),
        message: z.string(),
      }),
      description: "Microsoft Calendar integration not configured",
    }),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: internalServerErrorSchema,
  },
})

export const handleMicrosoftOAuthCallback = createRoute({
  path: "/v1/oauth/microsoft/callback",
  method: "get",
  summary: "Handle Microsoft OAuth callback",
  description:
    "Handles the OAuth callback from Microsoft, exchanges the code for tokens, and stores the calendar connection",
  request: {
    query: z.object({
      code: z.string().openapi({
        description: "Authorization code from Microsoft",
      }),
      state: z.string().openapi({
        description: "State token for CSRF protection",
      }),
      error: z.string().optional().openapi({
        description: "Error code if authorization failed",
      }),
      error_description: z.string().optional().openapi({
        description: "Error description if authorization failed",
      }),
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent({
      schema: z.object({
        success: z.boolean(),
        message: z.string(),
        connection: CalendarConnectionResponseSchema.optional(),
      }),
      description: "OAuth completed successfully",
    }),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent({
      schema: z.object({
        success: z.boolean(),
        message: z.string(),
      }),
      description: "Invalid or expired state token, or OAuth error",
    }),
    [HttpStatusCodes.SERVICE_UNAVAILABLE]: jsonContent({
      schema: z.object({
        success: z.boolean(),
        message: z.string(),
      }),
      description: "Microsoft Calendar integration not configured",
    }),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: internalServerErrorSchema,
  },
})

// Export route types
export type GetGoogleOAuthUrlRoute = typeof getGoogleOAuthUrl
export type HandleGoogleOAuthCallbackRoute = typeof handleGoogleOAuthCallback
export type GetMicrosoftOAuthUrlRoute = typeof getMicrosoftOAuthUrl
export type HandleMicrosoftOAuthCallbackRoute =
  typeof handleMicrosoftOAuthCallback
export type ListConnectionsRoute = typeof listConnections
export type GetConnectionRoute = typeof getConnection
export type DeleteConnectionRoute = typeof deleteConnection
export type ListCalendarsRoute = typeof listCalendars
export type UpdateConnectionCalendarRoute = typeof updateConnectionCalendar
