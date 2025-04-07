// packages/config/index.ts
import path from "path"
import { z } from "zod"
import { config } from "dotenv"
import { expand } from "dotenv-expand"
import { fileURLToPath } from "url"

const isClient = typeof window !== "undefined"
const isNextJS =
  !isClient && typeof process !== "undefined" && process.env.NEXT_JS === "true"

// Try to use server-only in Next.js environments
if (isNextJS) {
  try {
    // Dynamic import to avoid static parsing issues
    const dynamicRequire = new Function(
      "modulePath",
      "return require(modulePath)"
    )
    dynamicRequire("server-only")
  } catch (e) {
    // Silently continue if server-only isn't available
  }
}

// Get directory name in a way that works in different environments
let currentDirname: string
try {
  // For ESM
  const currentFilename = fileURLToPath(import.meta.url)
  currentDirname = path.dirname(currentFilename)
} catch (error) {
  // For CommonJS or environments where import.meta is not available
  currentDirname = __dirname || "."
}

// Only load .env file in development
if (process.env.NODE_ENV !== "production") {
  expand(config({ path: path.resolve(currentDirname, "../../../.env") }))
}

const EnvSchema = z.object({
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
  // DATABASE_AUTH_TOKEN: z.string().optional(),
})
// .superRefine((input, ctx) => {
//   if (input.NODE_ENV === "production" && !input.DATABASE_AUTH_TOKEN) {
//     ctx.addIssue({
//       code: z.ZodIssueCode.invalid_type,
//       expected: "string",
//       received: "undefined",
//       path: ["DATABASE_AUTH_TOKEN"],
//       message: "Must be set when NODE_ENV is 'production'",
//     })
//   }
// })

export type ServerEnv = z.infer<typeof EnvSchema>

// Only parse server environment on the server
let serverEnvData: ServerEnv | undefined

if (!isClient) {
  const { data, error } = EnvSchema.safeParse(process.env)

  if (error) {
    console.error("Error - Invalid .env:")
    console.error(JSON.stringify(error.flatten().fieldErrors, null, 2))
    process.exit(1)
  }

  serverEnvData = data
}

// Create a proxy for server environment that throws in client components
const serverEnv = new Proxy({} as ServerEnv, {
  get: (target, prop) => {
    // If we're in a client environment, throw an error
    if (isClient) {
      throw new Error(
        `Cannot access server environment variable '${String(prop)}' from a client component. ` +
          `This is a server-only variable and should not be used on the client.`
      )
    }

    // Otherwise, return the value from serverEnvData
    return serverEnvData?.[prop as keyof ServerEnv]
  },
})

export default serverEnv
