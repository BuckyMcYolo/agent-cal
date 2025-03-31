import { createRouter } from "@/lib/helpers/app/create-app"
import { createRoute, z } from "@hono/zod-openapi"
import * as HttpStatusCodes from "@/lib/misc/http-status-codes"
import jsonContent from "@/lib/helpers/openapi/schemas/json-content"

const router = createRouter().openapi(
  createRoute({
    method: "get",
    path: "/",
    tags: ["users"],
    responses: {
      [HttpStatusCodes.OK]: jsonContent({
        schema: z.object({
          message: z.string(),
        }),
        description: "Server is running",
      }),
    },
  }),
  (c) => {
    return c.json(
      {
        message: "Server is running",
      },
      HttpStatusCodes.OK
    )
  }
)

export default router
