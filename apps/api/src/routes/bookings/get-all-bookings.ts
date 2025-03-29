import { createRouter } from "@/lib/misc/create-app"
import { createRoute, z } from "@hono/zod-openapi"
import * as HttpStatusCodes from "@/lib/misc/http-status-codes"
import jsonContent from "@/lib/helpers/openapi/schemas/json-content"

const router = createRouter().openapi(
  createRoute({
    method: "get",
    path: "/",
    tags: ["Bookings"],
    responses: {
      [HttpStatusCodes.OK]: jsonContent({
        schema: z.object({
          message: z.string(),
        }),
        description: "Get all bookings for an organization",
      }),
    },
  }),
  (c) => {
    return c.json(
      {
        message: "Hello Hono!",
      },
      HttpStatusCodes.OK
    )
  }
)

export default router
