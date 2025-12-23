import { z } from "@hono/zod-openapi"
import * as HttpStatusPhrases from "@/lib/misc/http-status-phrases"

export const forbiddenSchema = z
  .object({
    success: z.boolean(),
    message: z.string(),
  })
  .openapi({
    example: {
      success: false,
      message: HttpStatusPhrases.FORBIDDEN,
    },
  })
