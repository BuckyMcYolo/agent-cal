import { z } from "@hono/zod-openapi"

const orgIdQuery = z.string().openapi({
  param: {
    name: "orgId",
    in: "query",
    required: false,
  },
  example: "tdlAgM7KV7m6Nwj9E6wHuCAkyHhSaPeQ",
})

export default orgIdQuery
