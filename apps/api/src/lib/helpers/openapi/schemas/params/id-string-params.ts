import { z } from "@hono/zod-openapi"

const IdStringParamsSchema = z.object({
  id: z.string().openapi({
    param: {
      name: "id",
      in: "path",
      required: true,
    },
    required: ["id"],
    example: "tdlAgM7KV7m6Nwj9E6wHuCAkyHhSaPeQ",
  }),
})

export default IdStringParamsSchema
