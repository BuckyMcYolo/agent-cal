import { z } from "@hono/zod-openapi"

const slugQuery = z.string().openapi({
  param: {
    name: "slug",
    in: "query",
    required: false,
  },
  example: "example-slug",
})

export default slugQuery
