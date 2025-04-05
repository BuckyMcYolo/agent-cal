import jsonContent from "../json-content"
import { z } from "@hono/zod-openapi"

export const unauthorizedSchema = jsonContent({
  schema: z
    .object({
      success: z.boolean(),
      error: z.string(),
    })
    .openapi({
      example: {
        success: false,
        error: "Unauthorized",
      },
    }),
  description: "Unauthorized Error",
})
