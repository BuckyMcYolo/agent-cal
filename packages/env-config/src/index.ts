// packages/config/index.ts
import path from "path"
import { z } from "zod"
import { config } from "dotenv"
import { expand } from "dotenv-expand"

expand(config({ path: path.resolve(__dirname, "../../../.env") }))

const EnvSchema = z
  .object({
    BETTER_AUTH_SECRET: z.string(),
    API_URL: z.string().url(),
    NODE_ENV: z.string().default("development"),
    PORT: z.coerce.number().default(8080),
    DATABASE_URL: z.string().url(),
    LOG_LEVEL: z.enum([
      "fatal",
      "error",
      "warn",
      "info",
      "debug",
      "trace",
      "silent",
    ]),
    DATABASE_AUTH_TOKEN: z.string().optional(),
  })
  .superRefine((input, ctx) => {
    if (input.NODE_ENV === "production" && !input.DATABASE_AUTH_TOKEN) {
      ctx.addIssue({
        code: z.ZodIssueCode.invalid_type,
        expected: "string",
        received: "undefined",
        path: ["DATABASE_AUTH_TOKEN"],
        message: "Must be set when NODE_ENV is 'production'",
      })
    }
  })

export type env = z.infer<typeof EnvSchema>

const { data: env, error } = EnvSchema.safeParse(process.env)

if (error) {
  console.error("Error - Invalid .env:")
  console.error(JSON.stringify(error.flatten().fieldErrors, null, 2))
  process.exit(1)
}

export default env!
