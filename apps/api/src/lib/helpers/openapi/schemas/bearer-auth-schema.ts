import { z } from "@hono/zod-openapi"

const bearerAuthSchema = z.object({
  authorization: z.string().openapi({
    param: {
      name: "authorization", //must be lowercase as referenced here https://github.com/honojs/middleware/tree/main/packages/zod-openapi#header-keys
      in: "header",
      required: true,
      description:
        "value must be `Bearer <token>` where `<token>` is API key prefixed with 'agentcal_' or user access token",
    },
    example: "Bearer agentcal_e2g55fa3f4a0d1e4e2fbaac",
  }),
})

export default bearerAuthSchema
