import { z } from "@hono/zod-openapi"

const userIdQuery = z.string().openapi({
  param: {
    name: "userId",
    in: "query",
    required: false,
  },
  example: "tdlAgM7KV7m6Nwj9E6wHuCAkyHhSaPeQ",
})

export default userIdQuery
