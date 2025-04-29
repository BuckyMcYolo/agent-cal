import jsonContentRequired from "../json-content-required"
import { z } from "@hono/zod-openapi"
import type { ZodSchema } from "../types"

export const paginationSchema = (schema: ZodSchema) => {
  return z.object({
    data: z.array(schema),
    meta: z.object({
      currentPage: z.number(),
      perPage: z.number(),
      totalItems: z.number(),
      totalPages: z.number(),
      nextPage: z.number().nullable(),
      prevPage: z.number().nullable(),
    }),
  })
}
