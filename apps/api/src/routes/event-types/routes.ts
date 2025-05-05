import jsonContent from "@/lib/helpers/openapi/schemas/json-content"
import { createRoute, z } from "@hono/zod-openapi"
import * as HttpStatusCodes from "@/lib/misc/http-status-codes"
import jsonContentRequired from "@/lib/helpers/openapi/schemas/json-content-required"
import { zodSchemaToOpenAPI } from "@/lib/helpers/openapi/drizzle-zod-to-openapi"
import createErrorSchema from "@/lib/helpers/openapi/schemas/error/create-error-schema"
import UUIDParamsSchema from "@/lib/helpers/openapi/schemas/params/uuid-params"
import { notFoundSchema } from "@/lib/helpers/openapi/schemas/error/not-found-schema"
import { unauthorizedSchema } from "@/lib/helpers/openapi/schemas/error/unauthorized-schema"
import { authMiddleware } from "@/middleware/bearer-auth-middleware"
import { apiKeySecuritySchema } from "@/lib/helpers/openapi/schemas/security-schemas"
import {
  selectEventTypeSchema,
  insertEventTypeSchema,
  updateTasksSchema,
} from "@workspace/db/schema/event-types"
import userIdQuery from "@/lib/helpers/openapi/schemas/query/user-id-query"
import orgIdQuery from "@/lib/helpers/openapi/schemas/query/org-id-query"
import slugQuery from "@/lib/helpers/openapi/schemas/query/slug-query"

const tags = ["Event Types"]

// not a protected route since public booking pages will need to access this
export const listEventTypes = createRoute({
  path: "/event-types",
  method: "get",
  summary: "Get all Event Types",
  description:
    "Get all Event Types for a user or organization. If no query parameters are provided, all event types for the organization will be returned.",
  //   security: apiKeySecuritySchema,
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
  //   middleware: [authMiddleware] as const,
  responses: {
    [HttpStatusCodes.OK]: jsonContent({
      schema: z.array(selectEventTypeSchema),
      description: "List of tasks",
    }),
    // [HttpStatusCodes.UNAUTHORIZED]: unauthorizedSchema,
  },
})

export type ListEventsTypesRoute = typeof listEventTypes
