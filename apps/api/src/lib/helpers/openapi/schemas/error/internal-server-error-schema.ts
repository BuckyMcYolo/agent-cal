import { z } from "@hono/zod-openapi"
import jsonContent from "../json-content"

export const internalServerErrorSchema = jsonContent({
  schema: z
    .object({
      success: z.boolean(),
      message: z.string(),
    })
    .openapi({
      example: {
        success: false,
        message: "Internal server error",
      },
    }),
  description: "Internal server error",
})
