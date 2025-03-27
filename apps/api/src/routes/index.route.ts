import { createRouter } from "@/lib/misc/create-app"
import { createRoute, z } from "@hono/zod-openapi"

const router = createRouter().openapi(
  createRoute({
    method: "get",
    path: "/",
    responses: {
      200: {
        content: {
          "application/json": {
            schema: z.object({
              message: z.string(),
            }),
          },
        },
        description: "Hello Hono!",
      },
    },
  }),
  (c) => {
    return c.json({
      message: "Hello Hono!",
    })
  }
)

export default router
