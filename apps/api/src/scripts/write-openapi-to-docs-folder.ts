/**
 * Development script to generate OpenAPI spec
 */

import * as fs from "node:fs"
import * as path from "node:path"
import { fileURLToPath } from "node:url"
import { serverEnv } from "@workspace/env-config/index"
import app from "../app"
import type { AppOpenAPI } from "../lib/types/app-types"

export async function generateOpenAPI(app: AppOpenAPI) {
  try {
    const openApiDoc = app.getOpenAPIDocument({
      openapi: "3.0.0",
      info: {
        version: "1.0.1",
        title: "AgentCal API reference",
        description: "API documentation for the AgentCal service",
      },
      servers: [
        {
          url: "http://localhost:8080",
          description: "Local server",
        },
      ],
    })

    if (serverEnv.NODE_ENV !== "development") {
      console.log("Skipping OpenAPI document generation in production mode.")
      return false
    }

    // Create paths compatible with ES modules
    const __filename = fileURLToPath(import.meta.url)
    const __dirname = path.dirname(__filename)

    // Create the directory if it doesn't exist
    const docsDir = path.resolve(__dirname, "../../../../docs/api-reference")
    if (!fs.existsSync(docsDir)) {
      fs.mkdirSync(docsDir, { recursive: true })
    }

    const openApiFilePath = path.resolve(docsDir, "openapi.json")
    fs.writeFileSync(openApiFilePath, JSON.stringify(openApiDoc, null, 2))

    console.log(`OpenAPI document written to ${openApiFilePath}`)
    return true
  } catch (error) {
    console.error("Error generating OpenAPI document:", error)
    return false
  }
}

// ES Module way to check if file is being run directly
const isMainModule = import.meta.url === `file://${process.argv[1]}`

if (isMainModule) {
  generateOpenAPI(app)
    .then((success) => {
      process.exit(success ? 0 : 1)
    })
    .catch((err) => {
      console.error("Unhandled error:", err)
      process.exit(1)
    })
}
