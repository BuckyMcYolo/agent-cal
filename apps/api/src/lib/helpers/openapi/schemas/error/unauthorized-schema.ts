import { z } from "@hono/zod-openapi"
import jsonContent from "../json-content"

export const unauthorizedSchema = jsonContent({
  schema: z
    .object({
      success: z.boolean(),
      message: z.string(),
    })
    .openapi({
      example: {
        success: false,
        message: "Unauthorized",
      },
    }),
  description: "Unauthorized - Authentication required",
})
