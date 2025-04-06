import * as HttpStatusPhrases from "@/lib/misc/http-status-phrases"
import { z } from "@hono/zod-openapi"

export const notFoundSchema = z
  .object({
    success: z.boolean(),
    message: z.string(),
  })
  .openapi({
    example: {
      success: false,
      message: HttpStatusPhrases.NOT_FOUND,
    },
  })
