// packages/config/client.ts
import { z } from "zod"

// Define the schema for client environment variables
const ClientEnvSchema = z.object({
  // Include only public env vars that are safe for browser
  NEXT_PUBLIC_API_URL: z.string().url(),
  NODE_ENV: z.string().default("development"),
})

export type ClientEnv = z.infer<typeof ClientEnvSchema>

// For client-side, we need to use the Next.js publicRuntimeConfig approach
// These values are injected at build time from the .env file
const clientEnv: ClientEnv = {
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || "",
  NODE_ENV: process.env.NODE_ENV || "development",
}

// Validate the environment variables
// During build time - if invalid, we'll throw an error
if (process.env.NEXT_PUBLIC_API_URL === undefined) {
  console.error(
    "Error - Required environment variable NEXT_PUBLIC_API_URL is missing"
  )
  // In non-browser environments, we can throw
  if (typeof window === "undefined") {
    throw new Error("Invalid Client .env: NEXT_PUBLIC_API_URL is required")
  }
}

export default clientEnv
